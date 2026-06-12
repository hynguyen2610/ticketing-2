# Auth0 Integration Checklist

This checklist is for replacing or integrating the current custom auth service with Auth0 in the ticketing system.

> Status: Auth0 redirect flow is implemented in the auth service and client. Tenant/application setup, cluster deployment secrets, and full token validation middleware remain to be completed.

## 1. Auth0 tenant and application setup
- [ ] Create an Auth0 tenant for the project.
- [ ] Create a Single Page Application (SPA) in Auth0 for the client app.
- [ ] Create a Machine-to-Machine or Regular Web Application if the auth service needs server-side token exchange.
- [ ] Record the Auth0 settings:
  - Domain
  - Client ID
  - Client Secret
  - Audience (if using API access)
  - Allowed Callback URLs
  - Allowed Logout URLs
  - Allowed Web Origins
  - Allowed CORS Origins

## 2. Configure redirect URLs and origins
- [ ] Add local dev callback URL: `http://localhost:3000/auth/callback` (or the callback route used in the app).
- [ ] Add local dev logout redirect URL: `http://localhost:3000`.
- [ ] Add local dev origin: `http://localhost:3000`.
- [ ] Add cluster host callback/logout URLs if running in a remote cluster or preview environment.

## 3. Client app integration
- [x] Replace custom sign in / sign up pages with Auth0 login redirect or Auth0 SDK components.
- [ ] Install Auth0 SDK for Next.js or React, for example `@auth0/nextjs-auth0`.
- [x] Add Auth0 environment variables to the client app config:
  - `AUTH0_DOMAIN`
  - `AUTH0_CLIENT_ID`
  - `AUTH0_CLIENT_SECRET` (if needed on the server side)
  - `AUTH0_AUDIENCE`
  - `AUTH0_REDIRECT_URI`
  - `AUTH0_POST_LOGOUT_REDIRECT_URI`
- [ ] Update `client/pages/_app.js` to read user info from Auth0 instead of `/api/users/currentuser` if using Auth0 session hooks.
- [x] Change `client/pages/auth/signin.js` and `client/pages/auth/signup.js` to use Auth0 login/signup flows.
- [x] Update header/nav components to show login/logout state from Auth0 instead of the current `currentUser` object.

## 4. Auth service / backend integration
- [x] Decide whether the `auth` microservice remains as a custom user store, or whether Auth0 fully replaces it.  
  - Decision: keep the auth service as a metadata/session layer and add Auth0 callback support.
- [ ] If Auth0 replaces backend auth entirely:
  - Remove or deprecate `/api/users/signin`, `/api/users/signup`, and `/api/users/signout` in the auth service.
  - Keep `/api/users/currentuser` only if it proxies Auth0 session data.
- [ ] If keeping the auth service for user metadata:
  - Add Auth0 JWT validation middleware in `auth/src/app.ts` or a shared middleware package.
  - Verify JWT signature using Auth0 issuer and JWKS endpoint.
  - Accept Auth0-issued access tokens or ID tokens in requests.
- [ ] Ensure the backend uses Auth0 AUDIENCE/AUTH0_DOMAIN to validate incoming tokens.
- [ ] Update `auth/src/routes/current-user.ts` to derive the current user from Auth0 token claims if the auth service remains in use.

## 5. Environment and secrets
- [x] Add Auth0 variables to local and cluster environments.
- [x] For local development, set these values in the env files or deployment configs:
  - `AUTH0_DOMAIN`
  - `AUTH0_CLIENT_ID`
  - `AUTH0_CLIENT_SECRET`
  - `AUTH0_AUDIENCE`
  - `AUTH0_CALLBACK_URL`
  - `AUTH0_LOGOUT_REDIRECT_URL`
- [x] If the auth service still issues its own JWT, preserve `JWT_KEY` for that flow or migrate fully to Auth0.

## 6. Update deployment and Skaffold workflows
- [ ] Add Auth0-related secrets to the auth service deployment manifest.
- [ ] Add Auth0 env vars to the client deployment manifest if the Next.js app needs them at runtime.
- [ ] Verify service URLs for the remote cluster if the callback URL is not `localhost`.
- [x] Document the local dev workflow.

## 7. Local development workflow
- [x] Bring up system infra:
  ```sh
  scripts/system-infra.sh up
  ```
- [x] Start the app with Skaffold and Auth0 port forwarding if needed:
  ```sh
  scripts/dev.sh
  ```
- [x] Open the app at `http://localhost:3000`.
- [ ] Confirm login redirects to Auth0 and returns to the app.
- [ ] Confirm authenticated pages can call backend endpoints successfully.

## 8. Test and verify
- [ ] Confirm login and logout work from the client.
- [ ] Confirm `currentUser` state is populated correctly after Auth0 authentication.
- [ ] Confirm protected routes and API calls validate the Auth0 token.
- [ ] Confirm token refresh and session persistence if using Auth0 SDK.
- [ ] Confirm sign-out clears the Auth0 session and redirects correctly.

## 9. Optional improvements
- [ ] Add roles or permissions in Auth0 for admin vs regular users.
- [ ] Add an Auth0 rule or Action to populate custom claims.
- [ ] Add multi-tenant or organization support if needed.
- [ ] Add Auth0 logout hooks for cross-app sign-out.

## Notes
- The current system uses cookie-based JWT sessions at `auth/src/routes/signin.ts` and `auth/src/routes/signup.ts`.
- Integrating Auth0 will require changing the auth flow from custom user/password forms to an OAuth/OIDC redirect flow.
- If the auth service remains deployed, it can be adapted to validate Auth0 tokens and act as a metadata service.
