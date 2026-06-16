const { defineConfig, devices } = require('@playwright/test');

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:13110';
const shouldStartLocalServer = !process.env.E2E_BASE_URL;

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  workers: process.env.CI ? 2 : 1,
  expect: {
    timeout: 5 * 1000,
  },
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: shouldStartLocalServer
    ? {
        command: 'npm run dev -- -p 13110',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      }
    : undefined,
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'chromium-tablet',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
