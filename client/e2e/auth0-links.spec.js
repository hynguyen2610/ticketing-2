const { test, expect } = require('@playwright/test');

test.describe('Auth0 entry links', () => {
  test('sign-in links through the auth service', async ({ page }) => {
    await page.goto('/auth/signin');

    const auth0Link = page.getByRole('link', { name: /continue with auth0/i });
    await expect(auth0Link).toBeVisible();
    await expect(auth0Link).toHaveAttribute('href', '/auth/login');
  });

  test('sign-up links through the auth service with signup hint', async ({ page }) => {
    await page.goto('/auth/signup');

    const auth0Link = page.getByRole('link', { name: /sign up with auth0/i });
    await expect(auth0Link).toBeVisible();
    await expect(auth0Link).toHaveAttribute('href', '/auth/login?screen_hint=signup');
  });

  test('Auth0 entry route responds predictably', async ({ request }) => {
    test.skip(!process.env.E2E_CHECK_AUTH_ROUTE, 'Enable with E2E_CHECK_AUTH_ROUTE=1 when auth service routing is available.');

    const response = await request.get('/auth/login', {
      maxRedirects: 0,
      failOnStatusCode: false,
    });

    expect([302, 400, 500]).toContain(response.status());

    const contentType = response.headers()['content-type'] || '';
    if (contentType.includes('application/json')) {
      const body = await response.json();
      expect(Array.isArray(body.errors)).toBe(true);
      expect(body.errors[0]?.message || '').toMatch(/auth0|configured|domain|client/i);
    } else {
      expect(response.headers().location || '').toMatch(/auth0|\/auth\/error|\/auth\/callback/i);
    }
  });
});
