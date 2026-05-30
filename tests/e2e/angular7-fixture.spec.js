const { test, expect } = require('@playwright/test');

function assertNo404s(page) {
  const failed = [];
  page.on('response', (response) => {
    if (response.status() === 404 && !response.url().endsWith('/favicon.ico')) {
      failed.push(response.url());
    }
  });
  return {
    async verify() {
      if (failed.length > 0) {
        throw new Error(`Network 404s detected:\n${failed.join('\n')}`);
      }
    }
  };
}

test('Angular 7 PrimeNG fixture renders tokenized legacy components', async ({ page }) => {
  const network = assertNo404s(page);
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Angular 7 + PrimeNG 7 Fixture');
  await expect(page.locator('.ui-button')).toHaveCount(3);
  await expect(page.locator('.ui-card')).toHaveCount(3);
  await expect(page.locator('.ui-table')).toHaveCount(1);
  await network.verify();
});

test('Angular 7 PrimeNG fixture can switch to dark theme', async ({ page }) => {
  const network = assertNo404s(page);
  await page.goto('/');
  await page.locator('.theme-picker select').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#theme-link')).toHaveAttribute('href', /themes\/dark\.css$/);
  await network.verify();
});
