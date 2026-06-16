# Playwright UI Validation Plan

## Goal

Add Playwright coverage that checks the ticketing UI is reachable, stable, and visually sane across the main pages.

The first version should catch broken routes, client-side crashes, failed assets, obvious layout issues, and Auth0 link regressions while keeping the test setup simple enough to run during local development.

## Target Runtime

Run tests against the local Tilt client:

```sh
http://127.0.0.1:13100
```

Allow overriding the base URL for other environments:

```sh
E2E_BASE_URL=http://127.0.0.1:13101 npm run test:e2e
```

## Phase 1: Public Smoke Coverage

Add a lightweight Playwright suite for routes that should load without seeded data or a logged-in user.

Initial routes:

- `/`
- `/auth/signin`
- `/auth/signup`
- `/auth/error`
- `/tickets/new`

For each route:

- Page responds without Playwright navigation failure.
- No uncaught browser console errors.
- No failed document, script, stylesheet, image, or font requests.
- Main app shell renders.
- Page has non-empty visible content.
- Screenshot is captured for local inspection or CI artifacts.

## Phase 2: Auth0 Link Checks

Validate Auth0 UI entry points without completing an external Auth0 login.

Checks:

- Sign-in page contains a `Login with Auth0` path.
- Sign-up page contains a `Sign up with Auth0` path.
- Auth0 links point to the auth service routes, not directly to Auth0.
- Clicking the Auth0 button reaches `/auth/login` or receives the expected redirect response.
- The app does not show raw JSON error output on the client page for expected Auth0 redirects.

## Phase 3: Visual Sanity Checks

Add viewport coverage for:

- Desktop: `1440x900`
- Tablet: `768x1024`
- Mobile: `390x844`

For each smoke route and viewport:

- No horizontal overflow on `body` or `html`.
- Header, main content, and footer are visible where expected.
- Primary action buttons have measurable size and visible text or accessible names.
- No visible text nodes have zero-sized bounding boxes.
- Important images either load successfully or show the intended fallback UI.

Avoid fragile pixel-perfect assertions at first. Prefer structural and viewport-level checks until the UI settles.

## Phase 4: Authenticated And Data-Dependent Pages

After public routes are stable, add coverage for authenticated flows.

Options:

- Create a test session cookie directly with the same internal JWT strategy used by the app.
- Add a test-only login helper in the auth service.
- Seed users, tickets, and orders through API calls before navigation.

Candidate routes:

- `/tickets/[ticketId]`
- order purchase flow
- order detail page
- user menu/profile display
- pages that show the Auth0 profile picture after login

## Phase 5: Regression Artifacts

Configure Playwright artifacts:

- screenshot on failure
- trace on retry
- video only on failure, if storage is acceptable
- HTML report for local debugging

Recommended local artifact directory:

```text
client/playwright-report
client/test-results
```

These should be ignored by git.

## Proposed File Changes

- `client/package.json`
  - add Playwright test scripts
  - add Playwright dependency
- `client/playwright.config.js`
  - base URL from `E2E_BASE_URL`
  - desktop/tablet/mobile projects
  - screenshots/traces configured
- `client/e2e/ui-smoke.spec.js`
  - public route smoke tests
- `client/e2e/auth0-links.spec.js`
  - browser-level Auth0 entry checks
- `.gitignore`
  - ignore Playwright reports and test artifacts
- `README.md`
  - document how to run UI validation against Tilt

## Suggested Scripts

From `client/package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report"
  }
}
```

## Local Run Flow

Start Tilt:

```sh
scripts/dev-tilt.sh
```

Run UI checks:

```sh
cd client
E2E_BASE_URL=http://127.0.0.1:13100 npm run test:e2e
```

If the client port was overridden:

```sh
cd client
E2E_BASE_URL=http://127.0.0.1:13101 npm run test:e2e
```

## Acceptance Criteria

- Playwright can be installed and run from `client`.
- Public smoke routes pass on desktop, tablet, and mobile.
- Tests fail on console errors, failed important assets, and navigation failures.
- Auth0 buttons continue to point through the auth service.
- Failure artifacts make broken UI easy to inspect.
- README documents the test command.

## Follow-Up Optimizations

- Add seeded authenticated flows.
- Add visual snapshots once the UI is stable enough.
- Add CI execution after local reliability is proven.
- Add route discovery from `client/pages` if manual route lists become stale.
