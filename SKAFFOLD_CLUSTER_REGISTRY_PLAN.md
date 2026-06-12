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

3. Make image names registry-aware.
   - Prefer setting `default-repo` at runtime:

     ```sh
     skaffold run --profile cluster-registry --default-repo REGISTRY_HOST/ticketing
     ```

   - This avoids hard-coding one registry into every artifact name.
   - Example final image reference:

     ```text
     REGISTRY_HOST/ticketing/bluestorm1288/ticketing-auth:<git-tag>
     ```

4. Decide whether to preserve or remove the `bluestorm1288` namespace.
   - Fastest path: keep current artifact names and use `--default-repo`.
   - Cleaner path: rename artifacts to short names like `ticketing-auth`, then use `--default-repo REGISTRY_HOST/ticketing`.
   - If renaming artifacts, update Kubernetes manifests to match the new artifact names so Skaffold can still rewrite them.

5. Verify cluster image pulls.
   - Build and deploy once:

     ```sh
     skaffold run --profile cluster-registry --default-repo REGISTRY_HOST/ticketing
     ```

   - Check that pods pull the pushed tags:

     ```sh
     kubectl get pods
     kubectl describe pod POD_NAME
     ```

   - Confirm no pod is stuck in `ImagePullBackOff` or `ErrImagePull`.

6. Add registry authentication only if needed.
   - For Docker push auth, run `docker login REGISTRY_HOST`.
   - For Kubernetes pull auth, create an image pull secret and attach it to the relevant service account or deployments.

7. Document the final command.
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

Run with the registry supplied at deploy time:

```sh
skaffold run --profile cluster-registry --default-repo REGISTRY_HOST/ticketing
```

## Acceptance Criteria

- `skaffold dev` still works for local development.
- `skaffold run --profile cluster-registry --default-repo REGISTRY_HOST/ticketing` builds, tags, pushes, and deploys all application images.
- Kubernetes deployments use immutable Skaffold-generated tags instead of relying on `latest`.
- All application pods reach `Running` or `Completed` without image pull errors.
- The final registry command and any auth steps are captured in `README.md`.

## Risks

- A local registry can be reachable from the developer machine but not from cluster nodes.
- Private registries require both Docker push credentials and Kubernetes pull credentials.
- Keeping `latest` in manifests is acceptable when Skaffold rewrites image tags, but confusing when manifests are applied directly with `kubectl`.
- Renaming artifacts is cleaner but touches more manifests and should be done separately if the immediate goal is just pushing to the cluster registry.
