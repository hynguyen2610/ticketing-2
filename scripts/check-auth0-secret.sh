#!/usr/bin/env sh
set -eu

KUBECTL="${KUBECTL:-kubectl}"
NAMESPACE="${NAMESPACE:-default}"
SECRET_NAME="${SECRET_NAME:-auth0-secret}"
AUTH_SELECTOR="${AUTH_SELECTOR:-app=auth}"
MODE="${1:-secret}"

usage() {
  cat <<EOF
Usage: $0 [secret|--pod-env]

Commands:
  secret     Check the Kubernetes auth0-secret object (default)
  --pod-env  Check the running auth pod environment

Environment variables:
  KUBECTL        Kubectl command to use (default: kubectl)
  NAMESPACE      Kubernetes namespace (default: default)
  SECRET_NAME    Secret name for secret mode (default: auth0-secret)
  AUTH_SELECTOR  Pod selector for --pod-env mode (default: app=auth)
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
    YOUR_AUTH0_*)
      echo "$key=placeholder"
      return 1
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
    YOUR_AUTH0_*)
      echo "$key=placeholder"
      return 1
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
    YOUR_AUTH0_*)
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
    YOUR_AUTH0_*)
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

case "$MODE" in
  secret)
    check_secret
    ;;
  --pod-env)
    check_pod_env
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
