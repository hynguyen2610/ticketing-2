#!/usr/bin/env sh
set -eu

if command -v scripts/check-auth0-secret.sh >/dev/null 2>&1; then
  scripts/check-auth0-secret.sh || true
fi

echo "Starting Tilt dev with system infra, cluster registry, and client port forwarding..."
tilt up "$@"
