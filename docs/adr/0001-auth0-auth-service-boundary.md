# 0001. Integrate Auth0 At The Auth Service Boundary

Date: 2026-06-15

## Status

Accepted

## Context

The ticketing system already has an `auth` service that owns browser session
creation and issues a `JWT_KEY`-signed cookie consumed by the other services.
Services such as tickets, orders, payment, and image management use the shared
`@ndhcode/common` `currentUser` middleware to read that internal JWT contract.

Auth0 is being added to replace the browser-facing login, signup, and logout
experience. The integration needs to avoid a broad rewrite of every backend
service while still allowing the app to use Auth0 as the external identity
provider.

## Decision

Auth0 will be integrated at the `auth` service boundary.

The client routes users to `/auth/login`, `/auth/callback`, and `/auth/logout`.
The Next.js app rewrites those routes to `auth-srv`, and the `auth` service acts
as the OIDC client for Auth0. After a successful Auth0 callback, the `auth`
service creates or finds the local user, links the Auth0 subject to that user,
and issues the existing internal session cookie containing a `JWT_KEY`-signed
JWT.

The client will not use `@auth0/nextjs-auth0` or another browser-facing Auth0
SDK for this integration. Backend services will not validate raw Auth0 ID or
access tokens directly; they will continue to trust the internal JWT issued by
the `auth` service.

## Consequences

- Existing backend services keep their current authentication contract.
- Auth0-specific OIDC configuration, PKCE handling, account linking, and logout
  behavior stay localized in the `auth` service.
- The client remains simple and uses the existing `/auth/*` rewrite model.
- `JWT_KEY` remains required because the `auth` service still signs the
  internal cookie after Auth0 login.
- Auth0 access tokens are not available to backend services unless a future
  architecture change adds direct Auth0 token validation.
- The system must keep local user records so Auth0 identities can map to the
  existing service data model.

## Alternatives Considered

### Use `@auth0/nextjs-auth0` In The Client

This would move more Auth0 behavior into the Next.js app and introduce client
or Next.js server environment variables. It does not fit the current
microservice contract as directly because backend services would still need a
compatible user/session representation.

### Validate Auth0 Access Tokens In Every Backend Service

This would remove the internal JWT compatibility layer over time, but it is a
larger migration. Each protected service would need issuer, audience, and JWKS
validation, plus updated tests and a consistent bearer-token or cookie strategy.

### Keep Only Local Auth

This avoids external identity-provider complexity, but it does not meet the
goal of using Auth0 for browser login, signup, and logout.
