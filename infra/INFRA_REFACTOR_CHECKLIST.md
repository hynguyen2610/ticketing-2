# Infra Refactor Checklist

## Goal
- Keep application service manifests managed by Skaffold.
- Keep system infrastructure manifests outside Skaffold control.
- Remove dependency on ingress-nginx and expose services without an ingress controller.

## Current state
- `skaffold.yaml` deploys `./infra/k8s/*` and `./infra/k8s-dev/*`.
- System infra resources (message queue, databases, PV/PVC, secrets) are mixed with application manifests.
- `infra/k8s-dev/ingress-srv.yaml` and `infra/k8s-prod/ingress-srv.yaml` require ingress-nginx.
- `client/api/build-client.js` references `ingress-nginx-controller.ingress-nginx.svc.cluster.local`.

## Refactor checklist

### 1. Separate application services from system infra
- [ ] Create separate manifest directories, for example:
  - `infra/k8s-apps/` for app services and app-level service exposure
  - `infra/k8s-system/` for system infrastructure: NATS, MongoDB, PVCs, secrets, and other cluster-level dependencies
- [ ] Move all app service deployments and services into the apps folder:
  - `auth-depl.yaml`
  - `tickets-depl.yaml`
  - `orders-depl.yaml`
  - `payment-depl.yaml`
  - `expiration-depl.yaml`
  - `client-depl.yaml`
  - `image-management-backend-depl.yaml`
  - `image-management-frontend-depl.yaml`
  - optionally `jaeger-depl.yaml` if used by app deployments
- [ ] Move system manifests into the system folder:
  - `nats-depl.yaml`
  - all `*-mongo-depl.yaml`
  - PVC manifests if currently separate or referenced
  - secret manifests: `jwt-secret`, `stripe-secret`, etc.
  - `infra/k8s-prod/ingress-srv.yaml` if ingress controller installation is managed separately

### 2. Update Skaffold to only control app services
- [ ] Edit `skaffold.yaml` `deploy.manifests` to reference only the app services directory, not system infra.
- [ ] Remove system infra manifest directories from Skaffold deploy paths.
- [ ] Keep build artifacts in `skaffold.yaml` for all app images.
- [ ] Validate that `skaffold dev` still rebuilds app images and deploys app manifests.

### 3. Remove ingress-nginx dependency
- [ ] Delete or stop applying `infra/k8s-dev/ingress-srv.yaml` and `infra/k8s-prod/ingress-srv.yaml` in the new flow.
- [ ] Remove ingress controller install instructions from `README.md` and `client/README.md`.
- [ ] Remove ingress-specific annotations and `ingressClassName: nginx` from manifests.
- [ ] For external access, choose one of the following approaches:
  - expose client and public app endpoints via `NodePort` or `LoadBalancer` services
  - use port-forward or cluster host mapping for local dev
  - use a dedicated API Gateway / service mesh if needed, but not ingress-nginx
- [ ] Ensure app service manifests provide the correct service types for needed exposure:
  - `client-srv` as `NodePort` or `LoadBalancer`
  - API services (`auth`, `tickets`, `orders`, `payment`, `image-management-backend`) as `NodePort`/`LoadBalancer` if required by external consumers
  - internal services remain `ClusterIP` for cluster-internal traffic

### 4. Update service routing and client config
- [ ] Replace `client/api/build-client.js` hostname from `ingress-nginx-controller.ingress-nginx.svc.cluster.local` to the new service access pattern.
- [ ] Update any hard-coded hostnames or ingress path-based routing in client and service configs.
- [ ] Ensure the frontend can reach backend APIs directly using service endpoints or NodePort addresses.
- [ ] Update environment variables or secret references if the external access model changes.

### 5. Keep system infra stable outside Skaffold
- [ ] Define a separate deploy flow for system infra, such as `kubectl apply -f infra/k8s-system/`.
- [ ] Document the order of operations: first apply system infra, then run Skaffold for app services.
- [ ] If desired, add a small wrapper script or Makefile target for `infra/system` deployment.
- [ ] Confirm system infra does not change on every `skaffold dev` restart.

### 6. Validate and test
- [ ] Deploy system infra manually and verify:
  - MongoDB services are reachable from app pods
  - NATS is reachable from app pods
  - PVCs are bound and writable
  - secrets are present
- [ ] Run `skaffold dev` and verify:
  - app images build successfully
  - app pods start and connect to system infra
  - app services are accessible through the new service exposure method
- [ ] Verify no ingress-nginx resources remain in the deployment flow.
- [ ] Update documentation to reflect the new deployment model.

## Notes
- Keep the current separation clear: Skaffold should own only code/service deployment and image lifecycle.
- System infra should be stable and reusable across cluster deployments.
- Removing ingress-nginx simplifies the stack and reduces dependency on controller installation.
