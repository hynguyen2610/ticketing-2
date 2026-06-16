#!/usr/bin/env sh
set -eu

KUBECTL="${KUBECTL:-kubectl}"
NAMESPACE="${NAMESPACE:-default}"
SECRET_NAME="${SECRET_NAME:-auth0-secret-ticketing}"
AUTH_DEPLOYMENT="${AUTH_DEPLOYMENT:-auth-depl}"
RESTART_AUTH=false

usage() {
  cat <<EOF
Usage: $0 [--restart-auth]

Creates or updates the Kubernetes Auth0 secret from environment variables.
Secret values are not printed.

Options:
  --restart-auth  Restart the auth deployment after applying the secret and run
                  value-safe pod/route checks

Required environment variables:
  AUTH0_DOMAIN
  AUTH0_CLIENT_ID
  AUTH0_CLIENT_SECRET
  AUTH0_CALLBACK_URL
  AUTH0_LOGOUT_REDIRECT_URL

Optional environment variables:
  AUTH0_AUDIENCE

Other environment variables:
  KUBECTL      Kubectl command to use (default: kubectl)
  NAMESPACE    Kubernetes namespace (default: default)
  SECRET_NAME  Secret name (default: auth0-secret-ticketing)
  AUTH_DEPLOYMENT
              Auth deployment to restart with --restart-auth (default: auth-depl)
EOF
}

is_placeholder() {
  case "${1:-}" in
    YOUR_AUTH0_*|*_PLACEHOLDER|PLACEHOLDER) return 0 ;;
    *) return 1 ;;
  esac
}

is_url() {
  case "${1:-}" in
    http://*|https://*) return 0 ;;
    *) return 1 ;;
  esac
}

require_real_value() {
  name="$1"
  value="${2:-}"

  if [ -z "$value" ]; then
    echo "$name=missing" >&2
    return 1
  fi

  if is_placeholder "$value"; then
    echo "$name=placeholder" >&2
    return 1
  fi

  return 0
}

case "${1:-}" in
  "")
    ;;
  --restart-auth)
    RESTART_AUTH=true
    ;;
  --help|-h|help)
    usage
    exit 0
    ;;
  *)
    echo "Unknown option: $1" >&2
    usage >&2
    exit 1
    ;;
esac

status=0
require_real_value AUTH0_DOMAIN "${AUTH0_DOMAIN:-}" || status=1
require_real_value AUTH0_CLIENT_ID "${AUTH0_CLIENT_ID:-}" || status=1
require_real_value AUTH0_CLIENT_SECRET "${AUTH0_CLIENT_SECRET:-}" || status=1
require_real_value AUTH0_CALLBACK_URL "${AUTH0_CALLBACK_URL:-}" || status=1
require_real_value AUTH0_LOGOUT_REDIRECT_URL "${AUTH0_LOGOUT_REDIRECT_URL:-}" || status=1

if [ -n "${AUTH0_DOMAIN:-}" ] && is_url "$AUTH0_DOMAIN"; then
  echo "AUTH0_DOMAIN=must-be-domain-only-without-scheme" >&2
  status=1
fi

if [ -n "${AUTH0_AUDIENCE:-}" ] && is_placeholder "$AUTH0_AUDIENCE"; then
  echo "AUTH0_AUDIENCE=placeholder" >&2
  status=1
fi

if [ "$status" -ne 0 ]; then
  echo "Refusing to apply $SECRET_NAME until required Auth0 values are real." >&2
  exit "$status"
fi

tmp_manifest="${TMPDIR:-/tmp}/auth0-secret-ticketing.$$"

cleanup() {
  rm -f "$tmp_manifest"
}

trap cleanup EXIT INT TERM

$KUBECTL create secret generic "$SECRET_NAME" -n "$NAMESPACE" \
  --from-literal=AUTH0_DOMAIN="$AUTH0_DOMAIN" \
  --from-literal=AUTH0_CLIENT_ID="$AUTH0_CLIENT_ID" \
  --from-literal=AUTH0_CLIENT_SECRET="$AUTH0_CLIENT_SECRET" \
  --from-literal=AUTH0_CALLBACK_URL="$AUTH0_CALLBACK_URL" \
  --from-literal=AUTH0_LOGOUT_REDIRECT_URL="$AUTH0_LOGOUT_REDIRECT_URL" \
  --dry-run=client \
  -o yaml >"$tmp_manifest"

if [ -n "${AUTH0_AUDIENCE:-}" ]; then
  $KUBECTL create secret generic "$SECRET_NAME" -n "$NAMESPACE" \
    --from-literal=AUTH0_DOMAIN="$AUTH0_DOMAIN" \
    --from-literal=AUTH0_CLIENT_ID="$AUTH0_CLIENT_ID" \
    --from-literal=AUTH0_CLIENT_SECRET="$AUTH0_CLIENT_SECRET" \
    --from-literal=AUTH0_CALLBACK_URL="$AUTH0_CALLBACK_URL" \
    --from-literal=AUTH0_LOGOUT_REDIRECT_URL="$AUTH0_LOGOUT_REDIRECT_URL" \
    --from-literal=AUTH0_AUDIENCE="$AUTH0_AUDIENCE" \
    --dry-run=client \
    -o yaml >"$tmp_manifest"
fi

$KUBECTL apply -f "$tmp_manifest"

echo "$SECRET_NAME=applied"

if [ "$RESTART_AUTH" = true ]; then
  $KUBECTL rollout restart "deploy/$AUTH_DEPLOYMENT" -n "$NAMESPACE"
  $KUBECTL rollout status "deploy/$AUTH_DEPLOYMENT" -n "$NAMESPACE"

  script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
  "$script_dir/check-auth0-secret.sh" --pod-env
  "$script_dir/check-auth0-secret.sh" --login-route
fi
