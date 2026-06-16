# UI Improvement Plan

## Goals

- Make the ticketing client feel elegant, professional, and product-ready.
- Replace the current Bootstrap/pastel styling with a Tailwind CSS design system.
- Display the signed-in user's profile picture when Auth0 provides one.
- Keep the existing auth-service architecture and `/auth/*` client flow intact.

## Implementation Status

- [x] Tailwind CSS is installed and configured for the client.
- [x] Bootstrap app-shell usage has been removed from `_app`, header, footer,
  and the refreshed landing/auth pages.
- [x] The header displays Auth0 profile pictures when available, with initials
  fallback.
- [x] Auth0 `picture` claims are propagated through the auth service session.
- [x] Home, sign-in, sign-up, and auth-error pages have an initial Tailwind
  refresh.
- [ ] Ticket creation, ticket detail, and order pages still need the full
  Tailwind refresh.

## Current State

- The client is a Next.js app under `client/`.
- Styling currently comes from Bootstrap plus `client/resources/style.css`.
- The header is implemented in `client/components/new-header.js`.
- User state is loaded in `client/pages/_app.js` from `/api/users/currentuser`.
- Auth0 profile data is stored in the auth service session as `auth0User`.
- The auth service now exposes `id`, `email`, `name`, `picture`, and `sub`
  through the Auth0 session user.

## Proposed Design Direction

- Use a restrained professional palette: neutral background, strong readable
  text, one primary accent color, and subtle borders/shadows.
- Prefer dense, scannable layouts over marketing-style hero sections.
- Use consistent spacing, typography, buttons, cards, forms, tables, and empty
  states.
- Keep cards at small radius, around `rounded-md` or `rounded-lg`.
- Avoid one-note color themes and oversized decorative elements.

## Implementation Phases

### 1. Add Tailwind CSS

- Install Tailwind dependencies in `client`:
  - `tailwindcss`
  - `postcss`
  - `autoprefixer`
- Add:
  - `client/tailwind.config.js`
  - `client/postcss.config.js`
- Replace or reduce Bootstrap usage after Tailwind styles are in place.
- Update `client/pages/_app.js` to import the Tailwind global stylesheet.
- Convert `client/resources/style.css` into Tailwind base/global styles.

### 2. Define Shared UI Primitives

- Add small reusable components before touching every page:
  - `Button`
  - `Input`
  - `PageShell`
  - `EmptyState`
  - `UserAvatar`
- Keep these components simple and local to `client/components/`.
- Avoid broad abstractions until repeated page patterns are obvious.

### 3. Redesign App Shell

- Rebuild `client/components/new-header.js` with Tailwind classes.
- Make navigation clear for anonymous and signed-in users.
- Add a compact user area:
  - profile image when available
  - initials fallback when no image exists
  - email/name text
  - sign-out action
- Update `client/components/new-footer.js` so it is not fixed over content.

### 4. Add Auth0 Profile Picture Support

- In `auth/src/routes/auth0.ts`, read `claims.picture` from the Auth0 ID token.
- Store it in `req.session.auth0User.picture` when it is a string.
- Include `picture` in `/api/users/currentuser` responses via the existing
  `auth0User` object.
- Keep the internal JWT unchanged unless another service needs the picture.
- Add auth-service tests for profile picture propagation.

### 5. Refresh Key Pages

- Update these first:
  - `client/pages/index.js`
  - `client/pages/auth/signin.js`
  - `client/pages/auth/signup.js`
  - `client/pages/auth/error.js`
  - `client/pages/tickets/new.js`
  - order pages
- Improve:
  - table styling
  - empty ticket list state
  - form layout and validation feedback
  - consistent action buttons

### 6. Verification

- Run focused tests:
  - `cd client && npm run test:auth0-links`
  - `cd client && npm run test:build-client`
  - `cd auth && npm run test:auth0-flow`
- Start or use Skaffold port forwarding and verify:
  - `/`
  - `/auth/signin`
  - `/auth/signup`
  - signed-in header with profile picture
  - signed-out header fallback
- Check desktop and mobile widths.
- Confirm no text overlaps and the header remains usable on narrow screens.

## Open Questions

- Should Bootstrap be fully removed, or kept temporarily while pages migrate?
- Should profile picture use Auth0's `picture` claim only, or later support
  user-uploaded avatars from the image service?
- Should the signed-in user menu be a simple inline section first, or a dropdown?

## Suggested Order

1. Add Tailwind setup and keep current UI working.
2. Add `picture` support in auth service and tests.
3. Build `UserAvatar` and redesign the header.
4. Refresh the home/auth pages.
5. Refresh ticket/order workflows.
