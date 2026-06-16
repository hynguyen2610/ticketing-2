# Tilt Migration Plan

## Goal

Replace the current Skaffold development loop with Tilt to reduce Docker rebuild and reload time during local Kubernetes development.

The migration should preserve the current Kubernetes manifests, local registry flow, Auth0 secret handling, and client port forwarding while improving edit-feedback speed for the Node services and frontend.

## Current State

- `skaffold.yaml` builds and deploys all app services from `infra/k8s-apps/*`.
- `scripts/dev.sh` starts system infrastructure, then runs `skaffold dev`.
- The client is port-forwarded from `client-srv:3000` to `http://127.0.0.1:13100`.
- App images are currently named under `bluestorm1288/*`.
- Local cluster registry usage is configured through the Skaffold `cluster-registry` profile with:
  - default repo: `100.114.61.78:30500/ticketing`
  - insecure registry: `100.114.61.78:30500`
- Auth0 runtime configuration comes from the `auth0-secret-ticketing` Kubernetes secret.

## Target State

- Add a `Tiltfile` that becomes the primary local development entrypoint.
- Keep `skaffold.yaml` during the transition until Tilt is validated.
- Use Tilt live updates for fast source syncing into running containers.
- Keep full Docker rebuilds for dependency, Dockerfile, and base image changes.
- Preserve the existing client port forward at `13100`.
- Keep system infrastructure startup explicit and predictable.

## Proposed Tilt Structure

The initial `Tiltfile` should:

- Load app manifests:

  ```python
  k8s_yaml(glob('./infra/k8s-apps/*.yaml'))
  ```

- Configure the local registry:

  ```python
  default_registry('100.114.61.78:30500/ticketing')
  ```

- Define one `docker_build` per service:

  - `auth`
  - `client`
  - `tickets`
  - `orders`
  - `expiration`
  - `payment`
  - `image-management/backend`
  - `image-management/frontend`

- Configure `k8s_resource` entries for:

  - readable service grouping in the Tilt UI
  - dependency ordering where useful
  - client port forwarding:

    ```python
    k8s_resource('client', port_forwards=['13100:3000'])
    ```

## Live Update Strategy

### Node TypeScript Services

For services such as `auth`, `tickets`, `orders`, `expiration`, `payment`, and `image-management/backend`:

- Sync `src/**/*.ts` into the running container.
- Trigger a dependency install or full rebuild when package files change.
- Restart the app process after source sync if the current runtime does not reliably reload.

Example shape:

```python
docker_build(
  'bluestorm1288/ticketing-auth',
  './auth',
  dockerfile='./auth/Dockerfile',
  live_update=[
    sync('./auth/src', '/app/src'),
    run('npm ci', trigger=['./auth/package.json', './auth/package-lock.json']),
    restart_process(),
  ],
)
```

If `ts-node-dev` or the service runtime already watches files reliably inside the container, `restart_process()` can be removed after validation.

### Client

For the Next.js client:

- Sync pages, components, API helpers, styles, Tailwind config, and PostCSS config.
- Rebuild or run dependency installation when package files change.
- Keep the client reachable at `http://127.0.0.1:13100`.

Candidate sync paths:

- `client/pages`
- `client/components`
- `client/api`
- `client/hooks`
- `client/resources`
- `client/styles`, if present
- `client/tailwind.config.js`
- `client/postcss.config.js`

### Image Management Frontend

The image-management frontend may need special handling depending on whether it runs a dev server or a production build in the container.

Recommended path:

- First migrate it with ordinary Docker rebuild behavior.
- Then add live update once its runtime command is confirmed.
- If it currently serves a static production build, consider a separate dev image or dev command before expecting meaningful live reload.

## Migration Phases

### Phase 1: Baseline

- Record current Skaffold timings:
  - first build
  - service TypeScript edit reload
  - client JS edit reload
  - Tailwind/CSS edit reload
  - package dependency change rebuild
- Capture current working commands from `scripts/dev.sh`.

### Phase 2: Add Tilt Alongside Skaffold

- Add a root `Tiltfile`.
- Do not remove `skaffold.yaml`.
- Add `scripts/dev-tilt.sh` for the new flow.
- Keep `scripts/dev.sh` unchanged until Tilt is proven stable.

### Phase 3: Migrate App Builds

- Add `docker_build` definitions for every app image.
- Confirm Tilt correctly injects built images into existing Kubernetes manifests.
- Verify deployment works with the existing local registry.
- Confirm the `auth0-secret-ticketing` secret is still used by the auth deployment.

### Phase 4: Add Live Updates

- Start with `auth`, because Auth0 work has been the active integration path.
- Add live updates to the other TypeScript services.
- Add client live updates for Next.js files and Tailwind CSS.
- Keep package changes deterministic by rebuilding or running `npm ci`.

### Phase 5: Developer Entry Point

- Update `scripts/dev-tilt.sh` to:
  - start system infrastructure
  - verify required secrets if practical
  - run `tilt up`
- After validation, update README to document Tilt as the preferred dev loop.
- Optionally switch `scripts/dev.sh` to call Tilt after the old Skaffold path is no longer needed.

### Phase 6: Deprecate Skaffold

- Keep Skaffold for one transition window.
- Remove or archive Skaffold-specific scripts and docs after Tilt is the stable path.
- Delete `skaffold.yaml` only after the team no longer depends on it.

## Risks And Mitigations

- Local registry routing may differ between Skaffold and Tilt.
  - Mitigation: validate `default_registry()` with the current cluster before removing Skaffold.

- Tilt live update may sync files but the app process may not reload.
  - Mitigation: use `restart_process()` first, then remove it only when watchers are verified.

- Package changes can make live update slow or inconsistent.
  - Mitigation: prefer full rebuilds for package file changes unless `npm ci` in-container proves reliable.

- Current manifests may use static image tags.
  - Mitigation: rely on Tilt image injection and verify each workload receives the intended image digest.

- Example secrets must never be deployed as real secrets.
  - Mitigation: keep real Auth0 values in `infra/secret/auth0-secret-ticketing.yaml`, which should remain local and ignored.

- Existing port forwards may conflict with Tilt port forwards.
  - Mitigation: stop Skaffold before running Tilt and keep the client port on `13100`.

## Acceptance Criteria

- `tilt up` builds and deploys all app services.
- The client is reachable at `http://127.0.0.1:13100`.
- Editing `auth/src/**/*.ts` updates the running auth service without a full image rebuild.
- Editing client pages, components, or Tailwind styles updates the UI without a full image rebuild.
- Package file changes trigger a deterministic dependency update or full rebuild.
- Auth0 login still redirects to Auth0 and returns through the configured callback.
- Existing auth and client tests still pass.
- README documents Tilt as the preferred local development workflow.

## Recommended Files

- `Tiltfile`
- `scripts/dev-tilt.sh`
- README local development updates
- Optional follow-up cleanup for Skaffold docs after validation

## Suggested Rollback

If Tilt fails during migration:

- Keep using `scripts/dev.sh`.
- Leave `skaffold.yaml` untouched.
- Remove or ignore the new `Tiltfile` until the issue is isolated.

This keeps the migration reversible until Tilt is faster and stable enough to replace Skaffold.
