#!/usr/bin/env sh
set -eu

SYSTEM_DIR="${SYSTEM_DIR:-infra/k8s-system}"
KUBECTL="${KUBECTL:-kubectl}"

usage() {
  cat <<EOF
Usage: $0 <command>

Commands:
  up      Apply system infrastructure manifests from ${SYSTEM_DIR}
  down    Delete system infrastructure manifests from ${SYSTEM_DIR}
  help    Show this help message

Environment variables:
  SYSTEM_DIR  Directory containing system infra manifests (default: infra/k8s-system)
  KUBECTL     Kubectl command to use (default: kubectl)
EOF
}

if [ "$#" -ne 1 ]; then
  usage
  exit 1
fi

case "$1" in
  up)
    echo "Applying system infrastructure manifests from $SYSTEM_DIR"
    $KUBECTL apply -f "$SYSTEM_DIR"
    ;;
  down)
    echo "Deleting system infrastructure manifests from $SYSTEM_DIR"
    $KUBECTL delete -f "$SYSTEM_DIR"
    ;;
  help)
    usage
    ;;
  *)
    echo "Unknown command: $1" >&2
    usage
    exit 1
    ;;
esac
