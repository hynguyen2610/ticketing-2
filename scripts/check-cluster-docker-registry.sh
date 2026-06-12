#!/usr/bin/env sh
set -eu

REGISTRY="${REGISTRY:-100.114.61.78:30500}"

if [ -z "${CLUSTER_DOCKER_HOST:-}" ]; then
  echo "CLUSTER_DOCKER_HOST is required, for example:" >&2
  echo "  CLUSTER_DOCKER_HOST=ssh://user@100.114.61.78 $0" >&2
  exit 1
fi

export DOCKER_HOST="$CLUSTER_DOCKER_HOST"

echo "Checking Docker daemon through $DOCKER_HOST"
docker version

echo
echo "Checking registry HTTP endpoint from the Docker host"
docker run --rm curlimages/curl:8.10.1 -fsS "http://$REGISTRY/v2/"

echo
echo "Checking Docker insecure registry config"
docker info

echo
echo "Trying a small push to $REGISTRY"
docker pull busybox:latest
docker tag busybox:latest "$REGISTRY/ticketing/push-check:latest"
docker push "$REGISTRY/ticketing/push-check:latest"
