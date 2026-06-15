#!/usr/bin/env sh
set -eu

KUBECTL="${KUBECTL:-kubectl}"
NAMESPACE="${NAMESPACE:-default}"
SECRET_NAME="${SECRET_NAME:-auth0-secret}"

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

echo "Checking $SECRET_NAME in namespace $NAMESPACE"

status=0
check_required_key AUTH0_DOMAIN || status=1
check_required_key AUTH0_CLIENT_ID || status=1
check_required_key AUTH0_CLIENT_SECRET || status=1
check_required_key AUTH0_CALLBACK_URL || status=1
check_required_key AUTH0_LOGOUT_REDIRECT_URL || status=1
check_optional_key AUTH0_AUDIENCE || status=1

exit "$status"
