#!/usr/bin/env sh
set -eu

SYSTEM_DIR="${SYSTEM_DIR:-infra/k8s-system}"
PVC_DIR="${PVC_DIR:-infra/pvc}"
PV_FILE="${PV_FILE:-infra/pvc/static-pvs.yaml}"
KUBECTL="${KUBECTL:-kubectl}"

usage() {
  cat <<EOF
Usage: $0 <command>

Commands:
  up      Apply persistent volumes, PVCs, and system infrastructure manifests
  down    Delete system infrastructure manifests and PVCs
  help    Show this help message

Environment variables:
  PV_FILE     File containing static PV manifests (default: infra/pvc/static-pvs.yaml)
  PVC_DIR     Directory containing PVC manifests (default: infra/pvc)
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
    echo "Applying static PV manifests from $PV_FILE"
    $KUBECTL apply -f "$PV_FILE"
    echo
    echo "Applying PVC manifests from $PVC_DIR"
    $KUBECTL apply -f "$PVC_DIR"
    echo
    echo "Applying system infrastructure manifests from $SYSTEM_DIR"
    $KUBECTL apply -f "$SYSTEM_DIR"
    ;;
  down)
    echo "Deleting system infrastructure manifests from $SYSTEM_DIR"
    $KUBECTL delete -f "$SYSTEM_DIR"
    echo
    echo "Deleting PVC manifests from $PVC_DIR"
    $KUBECTL delete -f "$PVC_DIR"
    echo
    echo "Deleting static PV manifests from $PV_FILE"
    $KUBECTL delete -f "$PV_FILE"
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
