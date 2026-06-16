const { test, expect } = require('@playwright/test');

const publicRoutes = [
  { path: '/', heading: /tickets showcase|no tickets available/i },
  { path: '/auth/signin', heading: /sign in to ticket system/i },
  { path: '/auth/signup', heading: /join ticket system/i },
  { path: '/auth/error', heading: /sign-in error/i },
  {
    path: '/tickets/new',
    heading: /sign in to ticket system|create a ticket/i,
    expectedPath: /\/auth\/signin|\/tickets\/new/,
  },
];

const importantResourceTypes = new Set(['document', 'script', 'stylesheet', 'image', 'font']);

function attachPageHealthChecks(page) {
  const consoleErrors = [];
  const failedRequests = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    consoleErrors.push(error.message);
  });

  page.on('requestfailed', (request) => {
    if (importantResourceTypes.has(request.resourceType())) {
      failedRequests.push(`${request.resourceType()} ${request.url()} ${request.failure()?.errorText || ''}`.trim());
    }
  });

  return {
    assertHealthy() {
      expect(consoleErrors, 'browser console/page errors').toEqual([]);
      expect(failedRequests, 'failed important network requests').toEqual([]);
    },
  };
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return {
      documentOverflow: doc.scrollWidth - doc.clientWidth,
      bodyOverflow: body.scrollWidth - body.clientWidth,
    };
  });

  expect(overflow.documentOverflow, 'document horizontal overflow').toBeLessThanOrEqual(1);
  expect(overflow.bodyOverflow, 'body horizontal overflow').toBeLessThanOrEqual(1);
}

async function expectVisibleAppShell(page) {
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
  await expect(page.getByRole('link', { name: /ticket system/i })).toBeVisible();
}

async function expectVisibleContent(page, headingPattern) {
  const main = page.getByRole('main');
  await expect(main).toContainText(headingPattern);

  const visibleTextLength = await main.evaluate((element) => element.innerText.trim().length);
  expect(visibleTextLength, 'visible main text length').toBeGreaterThan(20);
}

for (const route of publicRoutes) {
  test(`loads ${route.path} without broken UI`, async ({ page }) => {
    const health = attachPageHealthChecks(page);

    await page.goto(route.path, { waitUntil: 'networkidle' });

    if (route.expectedPath) {
      await expect(page).toHaveURL(route.expectedPath);
    }

    await expectVisibleAppShell(page);
    await expectVisibleContent(page, route.heading);
    await expectNoHorizontalOverflow(page);
    health.assertHealthy();
  });
}
