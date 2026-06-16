#!/usr/bin/env sh
set -eu

KUBECTL="${KUBECTL:-kubectl}"
NAMESPACE="${NAMESPACE:-default}"
SECRET_NAME="${SECRET_NAME:-auth0-secret-ticketing}"
AUTH_SELECTOR="${AUTH_SELECTOR:-app=auth}"
AUTH_SERVICE="${AUTH_SERVICE:-auth-srv}"
LOCAL_PORT="${LOCAL_PORT:-13000}"
MODE="${1:-secret}"

usage() {
  cat <<EOF
Usage: $0 [secret|--pod-env|--login-route|--all]

Commands:
  secret     Check the Kubernetes auth0-secret-ticketing object (default)
  --pod-env  Check the running auth pod environment
  --login-route
             Check /auth/login through a temporary auth service port-forward
  --all      Run the secret, pod environment, and login route checks

Environment variables:
  KUBECTL        Kubectl command to use (default: kubectl)
  NAMESPACE      Kubernetes namespace (default: default)
  SECRET_NAME    Secret name for secret mode (default: auth0-secret-ticketing)
  AUTH_SELECTOR  Pod selector for --pod-env mode (default: app=auth)
  AUTH_SERVICE   Auth service name for --login-route mode (default: auth-srv)
  LOCAL_PORT     Local port for --login-route mode (default: 13000)
EOF
}

decode_base64() {
  if printf '%s' "$1" | base64 --decode 2>/dev/null; then
    return 0
  fi

  printf '%s' "$1" | base64 -D
}

check_required_key() {
  key="$1"
  if ! encoded="$($KUBECTL get secret "$SECRET_NAME" -n "$NAMESPACE" -o "jsonpath={.data.$key}" 2>/dev/null)"; then
    echo "$key=unable-to-read-secret"
    return 1
  fi

  if [ -z "$encoded" ]; then
    echo "$key=missing"
    return 1
  fi

  value="$(decode_base64 "$encoded")"

  if [ -z "$value" ]; then
    echo "$key=empty"
    return 1
  fi

  case "$value" in
    YOUR_AUTH0_*|*_PLACEHOLDER|PLACEHOLDER)
      echo "$key=placeholder"
      return 1
      ;;
    http://*|https://*)
      if [ "$key" = "AUTH0_DOMAIN" ]; then
        echo "$key=url-instead-of-domain"
        return 1
      fi

      echo "$key=configured"
      return 0
      ;;
    *)
      echo "$key=configured"
      return 0
      ;;
  esac
}

check_required_value() {
  key="$1"
  value="${2:-}"

  if [ -z "$value" ]; then
    echo "$key=missing"
    return 1
  fi

  case "$value" in
    YOUR_AUTH0_*|*_PLACEHOLDER|PLACEHOLDER)
      echo "$key=placeholder"
      return 1
      ;;
    http://*|https://*)
      if [ "$key" = "AUTH0_DOMAIN" ]; then
        echo "$key=url-instead-of-domain"
        return 1
      fi

      echo "$key=configured"
      return 0
      ;;
    *)
      echo "$key=configured"
      return 0
      ;;
  esac
}

check_optional_key() {
  key="$1"
  if ! encoded="$($KUBECTL get secret "$SECRET_NAME" -n "$NAMESPACE" -o "jsonpath={.data.$key}" 2>/dev/null)"; then
    echo "$key=unable-to-read-secret"
    return 1
  fi

  if [ -z "$encoded" ]; then
    echo "$key=missing-optional"
    return 0
  fi

  value="$(decode_base64 "$encoded")"

  if [ -z "$value" ]; then
    echo "$key=empty-optional"
    return 0
  fi

  case "$value" in
    YOUR_AUTH0_*|*_PLACEHOLDER|PLACEHOLDER)
      echo "$key=placeholder"
      return 1
      ;;
    *)
      echo "$key=configured"
      return 0
      ;;
  esac
}

check_optional_value() {
  key="$1"
  value="${2:-}"

  if [ -z "$value" ]; then
    echo "$key=missing-optional"
    return 0
  fi

  case "$value" in
    YOUR_AUTH0_*|*_PLACEHOLDER|PLACEHOLDER)
      echo "$key=placeholder"
      return 1
      ;;
    *)
      echo "$key=configured"
      return 0
      ;;
  esac
}

check_secret() {
  echo "Checking $SECRET_NAME in namespace $NAMESPACE"

  status=0
  check_required_key AUTH0_DOMAIN || status=1
  check_required_key AUTH0_CLIENT_ID || status=1
  check_required_key AUTH0_CLIENT_SECRET || status=1
  check_required_key AUTH0_CALLBACK_URL || status=1
  check_required_key AUTH0_LOGOUT_REDIRECT_URL || status=1
  check_optional_key AUTH0_AUDIENCE || status=1

  return "$status"
}

check_pod_env() {
  if ! pod="$($KUBECTL get pods -n "$NAMESPACE" -l "$AUTH_SELECTOR" -o "jsonpath={.items[0].metadata.name}" 2>/dev/null)"; then
    echo "auth-pod=unable-to-read"
    return 1
  fi

  if [ -z "$pod" ]; then
    echo "auth-pod=missing"
    return 1
  fi

  echo "Checking environment for pod $pod in namespace $NAMESPACE"

  if ! env_output="$($KUBECTL exec -n "$NAMESPACE" "$pod" -- printenv 2>/dev/null)"; then
    echo "auth-pod-env=unable-to-read"
    return 1
  fi

  get_env_value() {
    key="$1"
    printf '%s\n' "$env_output" | awk -F= -v key="$key" '$1 == key {print substr($0, length(key) + 2)}'
  }

  status=0
  check_required_value AUTH0_DOMAIN "$(get_env_value AUTH0_DOMAIN)" || status=1
  check_required_value AUTH0_CLIENT_ID "$(get_env_value AUTH0_CLIENT_ID)" || status=1
  check_required_value AUTH0_CLIENT_SECRET "$(get_env_value AUTH0_CLIENT_SECRET)" || status=1
  check_required_value AUTH0_CALLBACK_URL "$(get_env_value AUTH0_CALLBACK_URL)" || status=1
  check_required_value AUTH0_LOGOUT_REDIRECT_URL "$(get_env_value AUTH0_LOGOUT_REDIRECT_URL)" || status=1
  check_optional_value AUTH0_AUDIENCE "$(get_env_value AUTH0_AUDIENCE)" || status=1

  return "$status"
}

check_login_route() {
  tmp_file="${TMPDIR:-/tmp}/auth0-login-route.$$"
  header_file="${TMPDIR:-/tmp}/auth0-login-route-headers.$$"
  port_forward_log="${TMPDIR:-/tmp}/auth0-port-forward.$$"

  cleanup() {
    if [ "${port_forward_pid:-}" ]; then
      kill "$port_forward_pid" 2>/dev/null || true
      wait "$port_forward_pid" 2>/dev/null || true
    fi
    rm -f "$tmp_file" "$header_file" "$port_forward_log"
  }

  trap cleanup EXIT INT TERM

  $KUBECTL port-forward -n "$NAMESPACE" "svc/$AUTH_SERVICE" "$LOCAL_PORT:3000" >"$port_forward_log" 2>&1 &
  port_forward_pid="$!"

  i=0
  while [ "$i" -lt 20 ]; do
    if grep -q "Forwarding from" "$port_forward_log" 2>/dev/null; then
      break
    fi
    if ! kill -0 "$port_forward_pid" 2>/dev/null; then
      echo "auth-login-route=port-forward-failed"
      return 1
    fi
    i=$((i + 1))
    sleep 0.25
  done

  if ! grep -q "Forwarding from" "$port_forward_log" 2>/dev/null; then
    echo "auth-login-route=port-forward-timeout"
    return 1
  fi

  status_code="$(curl -sS -o "$tmp_file" -D "$header_file" -w "%{http_code}" --max-time 5 "http://127.0.0.1:$LOCAL_PORT/auth/login" 2>/dev/null || true)"
  location="$(grep -i '^location:' "$header_file" 2>/dev/null | awk '{$1=""; sub(/^ /, ""); print}' | tr -d '\r')"

  case "$status_code" in
    302)
      case "$location" in
        https://*.auth0.com/*|https://*.auth0.com\?*|https://*.us.auth0.com/*|https://*.us.auth0.com\?*)
          echo "auth-login-route=redirects-to-auth0"
          return 0
          ;;
        *)
          echo "auth-login-route=redirects-unexpectedly"
          return 1
          ;;
      esac
      ;;
    400)
      if grep -q "must be configured with a real Auth0 value" "$tmp_file" 2>/dev/null; then
        echo "auth-login-route=placeholder-config-rejected"
        return 1
      fi
      echo "auth-login-route=bad-request"
      return 1
      ;;
    404)
      echo "auth-login-route=missing"
      return 1
      ;;
    000|"")
      echo "auth-login-route=unreachable"
      return 1
      ;;
    *)
      echo "auth-login-route=http-$status_code"
      return 1
      ;;
  esac
}

check_all() {
  status=0
  check_secret || status=1
  echo
  check_pod_env || status=1
  echo
  check_login_route || status=1

  return "$status"
}

case "$MODE" in
  secret)
    check_secret
    ;;
  --pod-env)
    check_pod_env
    ;;
  --login-route)
    check_login_route
    ;;
  --all)
    check_all
    ;;
  help|--help|-h)
    usage
    ;;
  *)
    echo "Unknown command: $MODE" >&2
    usage >&2
    exit 1
    ;;
esac
