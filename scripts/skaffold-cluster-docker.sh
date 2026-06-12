#!/usr/bin/env sh
set -eu

REGISTRY="${REGISTRY:-100.114.61.78:30500}"
DEFAULT_REPO="${DEFAULT_REPO:-$REGISTRY/ticketing}"
PROFILE="${PROFILE:-cluster-docker}"
SKAFFOLD_COMMAND="${1:-run}"

if [ -z "${CLUSTER_DOCKER_HOST:-}" ]; then
  echo "CLUSTER_DOCKER_HOST is required, for example:" >&2
  echo "  CLUSTER_DOCKER_HOST=ssh://user@100.114.61.78 $0 dev" >&2
  exit 1
fi

case "$CLUSTER_DOCKER_HOST" in
  ssh://USER@*|ssh://user@*)
    echo "Replace USER/user in CLUSTER_DOCKER_HOST with your real Linux SSH username." >&2
    echo "Example:" >&2
    echo "  CLUSTER_DOCKER_HOST=ssh://hdnguyen@100.114.61.78 $0 dev" >&2
    exit 1
    ;;
esac

export DOCKER_HOST="$CLUSTER_DOCKER_HOST"

skaffold "$SKAFFOLD_COMMAND" \
  --profile "$PROFILE" \
  --default-repo "$DEFAULT_REPO" \
  --insecure-registry "$REGISTRY"
