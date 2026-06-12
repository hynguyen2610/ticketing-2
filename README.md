Before running the app.
Make sure:
- Ingress Nginx installed to k8s cluster.
- 2 secrets exist: JWT_KEY and STRIPE_KEY
- PVCs storageClass

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
  --default-repo 192.168.2.177:30500/ticketing \
  --insecure-registry 192.168.2.177:30500
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
