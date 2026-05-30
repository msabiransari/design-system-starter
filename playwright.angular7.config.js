module.exports = {
  testDir: './tests/e2e',
  testMatch: 'angular7-fixture.spec.js',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:8083',
    browserName: 'chromium',
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'python3 -m http.server 8083 --directory fixtures/angular7-primeng/dist/angular7-primeng',
    url: 'http://localhost:8083',
    reuseExistingServer: !process.env.CI,
  },
};
