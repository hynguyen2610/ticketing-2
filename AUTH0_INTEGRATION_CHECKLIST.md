# Auth0 Integration Checklist

This checklist tracks the current Auth0 integration status for the ticketing
system.

> Current status: Auth0 is partially integrated. The client routes login,
> signup, callback, and logout through the existing `auth` service. The `auth`
> service acts as the OIDC client, exchanges the Auth0 callback, creates or
> finds the local user, and preserves the existing cookie JWT contract used by
> the other services. Tenant setup, real secret values, runtime verification,
> and full Auth0 token validation are still pending.

## Architecture Decision

- [x] Keep the `auth` microservice as the compatibility/session layer.
- [x] Preserve the existing internal cookie JWT so `tickets`, `orders`,
  `payment`, and image services can continue using `@ndhcode/common`
  `currentUser` middleware.
- [x] Use Auth0 for browser login/signup/logout redirects.
- [ ] Decide whether this is the final architecture or a migration bridge.
  - Option A: keep Auth0 only at the `auth` service boundary and continue using
    internal JWT cookies between frontend and services.
  - Option B: migrate backend services to validate Auth0 access tokens directly
    using issuer, audience, and JWKS.

## Current Implementation

- [x] `auth/src/routes/auth0.ts` adds:
  - `/auth/login`
  - `/auth/callback`
  - `/auth/logout`
- [x] Auth0 login uses authorization-code flow with PKCE.
- [x] Auth0 callback validates stored `state` and PKCE verifier.
- [x] Auth0 callback reads ID token claims, requires an email, creates or finds
  the local user, and stores:
  - existing internal `jwt`
  - `auth0IdToken`
  - `auth0AccessToken`
  - `auth0User`
- [x] `auth/src/routes/current-user.ts` can return either the internal JWT user
  or `auth0User` from the session.
- [x] `client/pages/auth/signin.js` links to `/auth/login`.
- [x] `client/pages/auth/signup.js` links to `/auth/login?screen_hint=signup`.
- [x] `client/pages/auth/signout.js` redirects to `/auth/logout`.
- [x] `client/next.config.js` rewrites `/auth/login`, `/auth/callback`, and
  `/auth/logout` to `auth-srv`.
- [x] `infra/k8s-apps/auth-depl.yaml` reads Auth0 values from `auth0-secret`.
- [x] `infra/k8s-apps/auth0-secret.example.yaml` exists as a placeholder
  template.
- [x] `README.md` documents the Auth0 secret values and local workflow.

## Not Implemented Yet

- [ ] The client does not use `@auth0/nextjs-auth0` or another Auth0 SDK.
  - Current behavior intentionally depends on the auth service OIDC flow.
- [ ] Backend services do not validate Auth0-issued access tokens directly.
  - They still validate the internal JWT cookie signed by `JWT_KEY`.
- [ ] Auth0 ID/access tokens stored in the cookie session are not used by other
  services yet.
- [ ] No automated tests cover `/auth/login`, `/auth/callback`, `/auth/logout`,
  or Auth0 current-user behavior.
- [ ] No runtime verification has confirmed a real Auth0 tenant can complete
  login/logout against the local Kubernetes workflow.

## 1. Auth0 Tenant And Application Setup

- [ ] Create an Auth0 tenant for the project.
- [ ] Create an Auth0 Regular Web Application for the auth service OIDC flow.
  - The current server-side callback requires `AUTH0_CLIENT_SECRET`, so this
    should not be configured as a pure SPA-only integration unless the client
    architecture changes.
- [ ] Configure the application to allow Authorization Code with PKCE.
- [ ] Record the Auth0 settings:
  - Domain
  - Client ID
  - Client Secret
  - Audience, if API access is needed
  - Allowed Callback URLs
  - Allowed Logout URLs
  - Allowed Web Origins
  - Allowed CORS Origins
- [ ] Confirm Auth0 user profiles include `email`.

## 2. Configure Redirect URLs And Origins

- [ ] Add local callback URL: `http://localhost:3000/auth/callback`.
- [ ] Add local logout redirect URL: `http://localhost:3000`.
- [ ] Add local web origin: `http://localhost:3000`.
- [ ] Add cluster host callback/logout URLs if running through a remote host,
  preview environment, or non-local NodePort.
- [ ] Confirm `AUTH0_CALLBACK_URL` exactly matches one of the configured Auth0
  callback URLs.
- [ ] Confirm `AUTH0_LOGOUT_REDIRECT_URL` exactly matches one of the configured
  Auth0 logout URLs.

## 3. Environment And Secrets

- [x] Add Auth0 secret references to `infra/k8s-apps/auth-depl.yaml`.
- [x] Add `infra/k8s-apps/auth0-secret.example.yaml` as a safe placeholder.
- [x] Document the manual `kubectl create secret generic auth0-secret` command
  in `README.md`.
- [ ] Create the real Kubernetes secret in the target cluster:
  - `AUTH0_DOMAIN`
  - `AUTH0_CLIENT_ID`
  - `AUTH0_CLIENT_SECRET`
  - `AUTH0_CALLBACK_URL`
  - `AUTH0_LOGOUT_REDIRECT_URL`
  - `AUTH0_AUDIENCE`
- [ ] Confirm `JWT_KEY` still exists because the auth service still issues the
  internal JWT cookie after Auth0 login.
- [ ] Decide how to manage local developer secrets outside source control.
- [ ] Do not commit a real `infra/k8s-apps/auth0-secret.yaml`.

## 4. Client App Integration

- [x] Replace custom sign-in and sign-up page actions with Auth0 redirect links.
- [x] Route sign-out through Auth0 logout.
- [x] Keep `client/pages/_app.js` reading user state from
  `/api/users/currentuser`.
- [x] Keep header/nav login state based on the existing `currentUser` object.
- [ ] Add error handling or user-facing feedback for failed Auth0 redirects.
- [ ] Decide whether to keep the auth-service redirect model or migrate the
  client to `@auth0/nextjs-auth0`.
- [ ] If migrating to `@auth0/nextjs-auth0`, add client/server environment
  variables and replace the current `/auth/*` rewrite model.

## 5. Auth Service Integration

- [x] Add Auth0 OIDC routes to the auth service.
- [x] Keep custom `/api/users/signin`, `/api/users/signup`, and
  `/api/users/signout` routes for local fallback/backward compatibility.
- [x] Create or find local users by Auth0 email during callback.
- [x] Issue the existing internal JWT cookie after successful Auth0 callback.
- [ ] Add automated tests for missing Auth0 env vars.
- [ ] Add automated tests for callback state mismatch.
- [ ] Add automated tests for successful Auth0 callback using mocked
  `openid-client`.
- [ ] Consider storing a stable Auth0 subject (`sub`) on the local user model
  instead of linking only by email.
- [ ] Consider clearing Auth0 session metadata on local `/api/users/signout`.

## 6. Backend Service Token Strategy

- [x] Continue using internal `JWT_KEY`-signed cookies for existing services.
- [ ] If keeping this strategy, document that backend services trust only the
  auth service's internal JWT, not raw Auth0 tokens.
- [ ] If migrating to direct Auth0 validation:
  - Add Auth0 JWT validation middleware to a shared package.
  - Verify JWT signature with Auth0 issuer and JWKS.
  - Validate issuer and audience.
  - Update protected routes to accept bearer tokens or a consistent cookie
    strategy.
  - Update tests in every service that currently signs local JWTs.

## 7. Deployment And Skaffold Workflow

- [x] Auth deployment references `auth0-secret`.
- [x] Client deployment does not need Auth0 env vars in the current
  auth-service redirect architecture.
- [x] Client rewrites proxy `/auth/*` and `/api/*` to cluster service DNS names.
- [ ] Verify Skaffold deploy succeeds when `auth0-secret`, `jwt-secret`, and
  `stripe-secret` already exist.
- [ ] Verify local service port forwarding exposes the client at
  `http://localhost:3000`.
- [ ] Verify remote cluster callback/logout URLs if not using localhost.

## 8. Local Verification

- [ ] Bring up system infrastructure:
  ```sh
  scripts/system-infra.sh up
  ```
- [ ] Create/update real secrets in the cluster.
- [ ] Start the app:
  ```sh
  scripts/dev.sh
  ```
- [ ] Open `http://localhost:3000`.
- [ ] Click Sign In and confirm redirect to Auth0.
- [ ] Complete Auth0 login and confirm redirect back to `/auth/callback`, then
  `/`.
- [ ] Confirm `/api/users/currentuser` returns the authenticated user.
- [ ] Confirm authenticated pages, ticket creation, orders, and payment flows
  still work with the internal JWT cookie.
- [ ] Click Sign Out and confirm Auth0 logout redirects back to the app.

## 9. Test Plan

- [ ] Add auth service tests for Auth0 routes.
- [ ] Add client smoke tests for signin/signup/signout links.
- [ ] Add an integration or e2e test path that can run with mocked Auth0.
- [ ] Manually verify with a real Auth0 tenant before marking integration done.

## 10. Optional Improvements

- [ ] Store Auth0 `sub` on local users and handle email changes safely.
- [ ] Add roles or permissions in Auth0 for admin vs regular users.
- [ ] Add an Auth0 Action to populate custom claims.
- [ ] Add organization support if needed.
- [ ] Add a dedicated callback error page.
- [ ] Reduce cookie size by avoiding storage of raw Auth0 tokens in the session
  unless they are actually needed.

