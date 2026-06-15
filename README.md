Before running the app.
Make sure:
- 2 secrets exist: JWT_KEY and STRIPE_KEY
- PVCs storageClass
- system infra (MongoDB, NATS, Redis, Jaeger) is deployed before app services

Default admin login:
- email: `admin@test.com`
- password: `password`

You can override these values using environment variables in the auth service:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Optional Auth0 integration can be enabled by setting Auth0 environment variables for the auth service and using the public login/logout flow:
- `AUTH0_DOMAIN`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `AUTH0_CALLBACK_URL`
- `AUTH0_LOGOUT_REDIRECT_URL`
- `AUTH0_AUDIENCE` (optional)

For clusters, the auth deployment reads these values from a secret named `auth0-secret`. Create that secret manually before deploying the auth service.

Use `infra/k8s-apps/auth0-secret.example.yaml` as a safe placeholder template, then create the real secret manually from the cluster or with `kubectl create secret generic`.

Example command:
```sh
kubectl create secret generic auth0-secret \
  --from-literal=AUTH0_DOMAIN=<your-auth0-domain> \
  --from-literal=AUTH0_CLIENT_ID=<your-auth0-client-id> \
  --from-literal=AUTH0_CLIENT_SECRET=<your-auth0-client-secret> \
  --from-literal=AUTH0_CALLBACK_URL=http://localhost:3000/auth/callback \
  --from-literal=AUTH0_LOGOUT_REDIRECT_URL=http://localhost:3000
```

`AUTH0_DOMAIN` should be the tenant domain only, for example `dev-xxxxx.us.auth0.com`. Do not use the Auth0 dashboard URL.

`AUTH0_AUDIENCE` is optional. Add `--from-literal=AUTH0_AUDIENCE=<your-auth0-audience>` only if you configured an Auth0 API audience. If you deploy to a remote cluster host, replace the callback and logout URLs with the external app URL instead of `localhost`.

You can also apply the secret from environment variables without printing
values or writing a real secret manifest:

```sh
export AUTH0_DOMAIN=<your-auth0-domain>
export AUTH0_CLIENT_ID=<your-auth0-client-id>
export AUTH0_CLIENT_SECRET=<your-auth0-client-secret>
export AUTH0_CALLBACK_URL=http://localhost:3000/auth/callback
export AUTH0_LOGOUT_REDIRECT_URL=http://localhost:3000
scripts/apply-auth0-secret.sh
```

To apply, restart `auth-depl`, and run value-safe pod/route checks:

```sh
scripts/apply-auth0-secret.sh --restart-auth
```

Check the live Kubernetes secret without printing secret values:

```sh
scripts/check-auth0-secret.sh
```

Run all Auth0 deployment checks:

```sh
scripts/check-auth0-secret.sh --all
```

After changing the secret, restart the auth deployment and verify the running
pod picked up the values:

```sh
kubectl rollout restart deploy/auth-depl
kubectl rollout status deploy/auth-depl
scripts/check-auth0-secret.sh --pod-env
```

Check that the deployed auth service exposes `/auth/login`:

```sh
scripts/check-auth0-secret.sh --login-route
```

> Do not commit real Auth0 secrets into source control. Create this secret manually in the cluster or via an ignored local secret management workflow.
>
> If you prefer a local manifest while developing, copy
> `infra/k8s-apps/auth0-secret.example.yaml` to
> `infra/k8s-apps/auth0-secret.yaml`, replace the placeholder values, and apply
> that ignored file with `kubectl apply -f infra/k8s-apps/auth0-secret.yaml`.

The client app now routes sign-in and sign-up through Auth0 while preserving the existing local auth fallback via the auth service.

### Auth0 architecture decision

The current Auth0 integration is the intended architecture for this codebase.
Auth0 is handled by the `auth` service, and the client reaches that service via
the existing `/auth/*` rewrites. See
`docs/adr/0001-auth0-auth-service-boundary.md` for the decision record.

### Auth token strategy

Auth0 is currently integrated at the auth service boundary. After a successful
Auth0 login, the auth service still issues the existing internal session cookie
containing a `JWT_KEY`-signed JWT. Backend services such as tickets, orders,
payment, and image management continue to trust only that internal JWT through
the shared `currentUser` middleware; they do not validate raw Auth0 ID or access
tokens directly.

### Auth0 test path

Run the mocked Auth0 service flow tests with:

```sh
cd auth && npm run test:auth0-flow
```

This exercises the Auth0 login/callback/logout routes with `openid-client`
mocked, plus current-user and signout behavior for the internal session.

### Deploy system infrastructure

```sh
scripts/system-infra.sh up
```

This script creates static hostPath PersistentVolumes from `infra/pvc/static-pvs.yaml`, applies PersistentVolumeClaims from `infra/pvc`, and then deploys system-level resources from `infra/k8s-system`.
If you need to tear down the system infra, run:

```sh
scripts/system-infra.sh down
```

> Secrets are not created by this script; create `JWT_KEY` and `STRIPE_KEY` before running it.
>
> The client app now proxies `/api/*` routes to internal service DNS names, so an ingress controller is no longer required for local development.

## Run local development

First bring up the system infra:

```sh
scripts/system-infra.sh up
```

Then start Skaffold dev from the repo root using the cluster registry and service port forwarding:

```sh
skaffold dev \
  --profile cluster-registry \
  --default-repo 100.114.61.78:30500/ticketing \
  --insecure-registry 100.114.61.78:30500 \
  --port-forward=services
```

Or use the helper script:

```sh
scripts/dev.sh
```

On success, Skaffold will forward service ports for the frontend apps to localhost.

> This project is using a remote cluster registry, so `skaffold dev` must push images to `100.114.61.78:30500/ticketing` before deployments can start.

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
