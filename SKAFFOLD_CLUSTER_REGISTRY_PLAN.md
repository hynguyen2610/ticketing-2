# Plan: Build and Push Skaffold Images to the Cluster Registry

## Goal

Make Skaffold build the application images locally and push them to the Docker registry that the Kubernetes cluster can pull from, without breaking the current local development flow.

## Current State

- `skaffold.yaml` builds eight app images from the service directories.
- `build.local.push` is currently `false`, so Skaffold does not push images after building.
- Kubernetes manifests under `infra/k8s` reference images under `bluestorm1288/...:latest`.
- Skaffold can rewrite deployed image tags for artifacts it owns, but the cluster still needs to be able to pull the final image references from a reachable registry.

## Assumptions to Confirm

- The cluster registry endpoint is known from the developer machine, for example `localhost:5000`, `registry.local:5000`, or a cloud/private registry host.
- The same registry is reachable by cluster nodes, or the cluster has registry mirror configuration that maps the developer-facing endpoint to the node-facing endpoint.
- The Docker client used by Skaffold is logged in or otherwise allowed to push to the registry.
- The cluster has image pull permissions if the registry requires authentication.

## Implementation Steps

1. Identify the registry address.
   - Determine the push address used by the local Docker daemon.
   - Determine the pull address used by Kubernetes nodes.
   - If these differ, document the mapping and cluster runtime configuration.

2. Add a dedicated Skaffold profile for cluster-registry builds.
   - Keep the default profile as local dev with `push: false`.
   - Add a profile such as `cluster-registry` that sets `build.local.push: true`.
   - Add `build.local.useDockerCLI: true` only if the local Docker CLI context is required.

3. Add a dedicated Skaffold profile for in-cluster builds.
   - Add a profile such as `cluster-builder` that switches `build.local` to `build.cluster`.
   - Patch each Docker artifact to use the equivalent Kaniko artifact while this profile is active.
   - Keep build concurrency low for a single-node cluster.
   - Use the same `--default-repo` registry target so images are pushed where deployments can pull them.

4. Add a remote-Docker path for the Linux cluster machine.
   - Add a profile such as `cluster-docker` that keeps Docker artifacts and enables `build.local.push: true`.
   - Run Skaffold with `DOCKER_HOST=ssh://USER@NODE_IP` so Docker builds happen on the Linux machine.
   - Still push to the registry because the Kubernetes node reports `containerd`, so Docker's local image store is not guaranteed to be the runtime image store.
   - Ensure the Linux Docker daemon allows the insecure registry `NODE_IP:30500`.

5. Make image names registry-aware.
   - Prefer setting `default-repo` at runtime:

     ```sh
     skaffold run \
       --profile cluster-registry \
       --default-repo REGISTRY_HOST/ticketing \
       --insecure-registry REGISTRY_HOST
     ```

   - This avoids hard-coding one registry into every artifact name.
   - Example final image reference:

     ```text
     REGISTRY_HOST/ticketing/bluestorm1288/ticketing-auth:<git-tag>
     ```

6. Decide whether to preserve or remove the `bluestorm1288` namespace.
   - Fastest path: keep current artifact names and use `--default-repo`.
   - Cleaner path: rename artifacts to short names like `ticketing-auth`, then use `--default-repo REGISTRY_HOST/ticketing`.
   - If renaming artifacts, update Kubernetes manifests to match the new artifact names so Skaffold can still rewrite them.

7. Verify cluster image pulls.
   - Build and deploy once:

     ```sh
     skaffold run \
       --profile cluster-registry \
       --default-repo REGISTRY_HOST/ticketing \
       --insecure-registry REGISTRY_HOST
     ```

   - Check that pods pull the pushed tags:

     ```sh
     kubectl get pods
     kubectl describe pod POD_NAME
     ```

   - Confirm no pod is stuck in `ImagePullBackOff` or `ErrImagePull`.

8. Add registry authentication only if needed.
   - For Docker push auth, run `docker login REGISTRY_HOST`.
   - For Kubernetes pull auth, create an image pull secret and attach it to the relevant service account or deployments.

9. Document the final command.
   - Add the selected command to `README.md` once the registry host is confirmed.
   - Include any cluster-specific setup, such as local registry mirror config or image pull secret creation.

## Proposed Skaffold Shape

Keep default local development behavior:

```yaml
build:
  local:
    push: false
```

Add a push-enabled profile:

```yaml
profiles:
  - name: cluster-registry
    build:
      local:
        push: true
```

Add a remote-Docker profile for the Linux cluster machine:

```yaml
profiles:
  - name: cluster-docker
    build:
      local:
        push: true
```

Add an in-cluster build profile:

```yaml
profiles:
  - name: cluster-builder
    patches:
      - op: remove
        path: /build/artifacts/0/docker
      - op: add
        path: /build/artifacts/0/kaniko
        value:
          dockerfile: Dockerfile
    build:
      cluster:
        namespace: default
        concurrency: 1
        timeout: 30m
```

Run with the registry supplied at deploy time:

```sh
skaffold run \
  --profile cluster-registry \
  --default-repo REGISTRY_HOST/ticketing \
  --insecure-registry REGISTRY_HOST
```

Run with in-cluster Kaniko builds:

```sh
skaffold run \
  --profile cluster-builder \
  --default-repo REGISTRY_HOST/ticketing \
  --insecure-registry REGISTRY_HOST
```

Run with Docker on the Linux cluster machine:

```sh
CLUSTER_DOCKER_HOST=ssh://USER@NODE_IP scripts/skaffold-cluster-docker.sh
```

## Acceptance Criteria

- `skaffold dev` still works for local development.
- `skaffold run --profile cluster-registry --default-repo REGISTRY_HOST/ticketing --insecure-registry REGISTRY_HOST` builds, tags, pushes, and deploys all application images.
- `CLUSTER_DOCKER_HOST=ssh://USER@NODE_IP scripts/skaffold-cluster-docker.sh` builds with Docker on the Linux machine, pushes, and deploys all application images.
- `skaffold run --profile cluster-builder --default-repo REGISTRY_HOST/ticketing --insecure-registry REGISTRY_HOST` builds in Kubernetes using Kaniko, pushes, and deploys all application images.
- Kubernetes deployments use immutable Skaffold-generated tags instead of relying on `latest`.
- All application pods reach `Running` or `Completed` without image pull errors.
- The final registry command and any auth steps are captured in `README.md`.

## Risks

- A local registry can be reachable from the developer machine but not from cluster nodes.
- Private registries require both Docker push credentials and Kubernetes pull credentials.
- Keeping `latest` in manifests is acceptable when Skaffold rewrites image tags, but confusing when manifests are applied directly with `kubectl`.
- Renaming artifacts is cleaner but touches more manifests and should be done separately if the immediate goal is just pushing to the cluster registry.
