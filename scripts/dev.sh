#!/usr/bin/env sh
set -eu

scripts/system-infra.sh up

echo "Starting Skaffold dev with the cluster registry..."
skaffold dev \
  --profile cluster-registry \
  --default-repo 100.114.61.78:30500/ticketing \
  --insecure-registry 100.114.61.78:30500
