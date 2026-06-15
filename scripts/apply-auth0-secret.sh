#!/usr/bin/env sh
set -eu

KUBECTL="${KUBECTL:-kubectl}"
NAMESPACE="${NAMESPACE:-default}"
SECRET_NAME="${SECRET_NAME:-auth0-secret}"

usage() {
  cat <<EOF
Usage: $0

Creates or updates the Kubernetes Auth0 secret from environment variables.
Secret values are not printed.

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
  SECRET_NAME  Secret name (default: auth0-secret)
EOF
}

is_placeholder() {
  case "${1:-}" in
    YOUR_AUTH0_*) return 0 ;;
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

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ] || [ "${1:-}" = "help" ]; then
  usage
  exit 0
fi

status=0
require_real_value AUTH0_DOMAIN "${AUTH0_DOMAIN:-}" || status=1
require_real_value AUTH0_CLIENT_ID "${AUTH0_CLIENT_ID:-}" || status=1
require_real_value AUTH0_CLIENT_SECRET "${AUTH0_CLIENT_SECRET:-}" || status=1
require_real_value AUTH0_CALLBACK_URL "${AUTH0_CALLBACK_URL:-}" || status=1
require_real_value AUTH0_LOGOUT_REDIRECT_URL "${AUTH0_LOGOUT_REDIRECT_URL:-}" || status=1

if [ -n "${AUTH0_AUDIENCE:-}" ] && is_placeholder "$AUTH0_AUDIENCE"; then
  echo "AUTH0_AUDIENCE=placeholder" >&2
  status=1
fi

if [ "$status" -ne 0 ]; then
  echo "Refusing to apply $SECRET_NAME until required Auth0 values are real." >&2
  exit "$status"
fi

tmp_manifest="${TMPDIR:-/tmp}/auth0-secret.$$"

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
