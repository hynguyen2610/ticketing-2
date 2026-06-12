Before running the app.
Make sure:
- 2 secrets exist: JWT_KEY and STRIPE_KEY
- PVCs storageClass
- system infra (MongoDB, NATS, Redis, Jaeger) is deployed before app services

### Deploy system infrastructure

```sh
scripts/system-infra.sh up
```

Use this script to apply system-level Kubernetes resources from `infra/k8s-system`.
If you need to tear down the system infra, run:

```sh
scripts/system-infra.sh down
```

> Secrets are not created by this script; create `JWT_KEY` and `STRIPE_KEY` before running it.

## Build and push with Skaffold

The default Skaffold workflow keeps local development fast and does not push images:

```sh
skaffold dev
```

To build the app images and push them to the cluster Docker registry, use the
`cluster-registry` profile and pass the registry as Skaffold's default repo:

```sh
skaffold run \
  --profile cluster-registry \
  --default-repo 100.114.61.78:30500/ticketing \
  --insecure-registry 100.114.61.78:30500
```

The current cluster exposes its registry as:

```text
registry/docker-registry NodePort 5000:30500
```

If the cluster node IP changes, update the `--default-repo` host while keeping
the same profile:

```sh
skaffold run \
  --profile cluster-registry \
  --default-repo NODE_IP:30500/ticketing \
  --insecure-registry NODE_IP:30500
```

If Docker rejects the push because the registry uses HTTP, add
`NODE_IP:30500` to Docker's insecure registries and restart Docker before
running Skaffold again.

To build using Docker on the Linux cluster machine over SSH, point the Docker
client at that machine and use the `cluster-docker` profile:

```sh
CLUSTER_DOCKER_HOST=ssh://YOUR_LINUX_USER@100.114.61.78 \
  scripts/skaffold-cluster-docker.sh dev
```

Use your real SSH username for `YOUR_LINUX_USER`. Check access before running
Skaffold:

```sh
ssh YOUR_LINUX_USER@100.114.61.78 docker version
```

The script sets `DOCKER_HOST` for Skaffold, builds with the remote Docker
daemon, pushes to `100.114.61.78:30500/ticketing`, deploys the rendered
manifests, and keeps watching for changes in dev mode. For a one-shot deploy,
use `scripts/skaffold-cluster-docker.sh run`.

Make sure SSH access works and Docker on the Linux machine allows the insecure
registry `100.114.61.78:30500`.

If the build succeeds but pushing fails, run the registry diagnostic:

```sh
CLUSTER_DOCKER_HOST=ssh://YOUR_LINUX_USER@100.114.61.78 \
  scripts/check-cluster-docker-registry.sh
```

On the Linux machine, Docker should include the registry in
`/etc/docker/daemon.json`:

```json
{
  "insecure-registries": ["100.114.61.78:30500"]
}
```

Restart Docker after changing it:

```sh
sudo systemctl restart docker
```

To build inside the Kubernetes cluster instead of using the local Docker daemon,
use the `cluster-builder` profile. Skaffold will run Kaniko build pods in the
cluster and push the resulting images to the same registry:

```sh
skaffold run \
  --profile cluster-builder \
  --default-repo 100.114.61.78:30500/ticketing \
  --insecure-registry 100.114.61.78:30500
```

This is the closest Skaffold-supported equivalent to "building with the
cluster's Docker"; the current node uses containerd, so there is no Kubernetes
Docker daemon to target directly.
