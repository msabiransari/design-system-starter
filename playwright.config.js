module.exports = {
  testDir: './tests/e2e',
  testIgnore: 'angular7-fixture.spec.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  // Freeze CSS animations/transitions for every screenshot so staggered entrance
  // animations (e.g. the example cards' slide-up) can't be captured mid-flight —
  // this removes a long-standing source of visual-snapshot flakiness.
  expect: {
    // animations: freeze entrance animations so cards can't be caught mid-flight.
    // maxDiffPixelRatio: tolerate minor text anti-aliasing on a tiny fraction of
    // pixels (real regressions change far more than 1% and still fail).
    toHaveScreenshot: { animations: 'disabled', threshold: 0.2, maxDiffPixelRatio: 0.01 },
  },
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}',
  projects: [
    {
      name: 'chromium-desktop',
      use: { browserName: 'chromium', viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'chromium-mobile',
      use: { browserName: 'chromium', viewport: { width: 375, height: 667 } },
    },
  ],
  webServer: [
    {
      command: 'python3 -m http.server 8080',
      url: 'http://localhost:8080',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd fixtures/primeng-modern && python3 -m http.server 8082 --directory dist/primeng-modern/browser',
      url: 'http://localhost:8082',
      reuseExistingServer: !process.env.CI,
    },
  ],
};
