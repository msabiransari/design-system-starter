import { defineConfig } from '@playwright/test';

const portValue = process.env.DS_MODES_PORT || '8094';
const port = Number(portValue);
if (!/^\d+$/.test(portValue) || port < 1 || port > 65535 || [8080, 8082].includes(port)) {
  throw new Error('DS_MODES_PORT must be a port from 1 to 65535 other than 8080 or 8082');
}
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'theme-modes.spec.js',
  forbidOnly: !!process.env.CI,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    browserName: 'chromium',
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: `python3 -m http.server ${port} --bind 127.0.0.1`,
    url: baseURL,
    reuseExistingServer: false,
  },
});
