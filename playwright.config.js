// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration for CalmDash
 * Tests the Screen Wake Lock feature and overall app functionality
 */
module.exports = defineConfig({
  testDir: './tests',

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],

  // Shared settings for all projects
  use: {
    // Base URL for the app (uses http-server on port 8080)
    baseURL: 'http://localhost:8080',

    // Collect trace when retrying failed tests
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Note: Wake Lock API permissions are automatically granted in secure contexts (HTTPS/localhost)
      },
    },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: 'npx http-server app -p 8080 -c-1',
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
