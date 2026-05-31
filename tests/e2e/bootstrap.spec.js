const { test, expect } = require('@playwright/test');

async function setTheme(page, name) {
  await page.evaluate((t) => {
    const link = document.getElementById('theme-link');
    link.href = link.href.replace(/themes\/[^/]+\.css/, `themes/${t}.css`);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, name);
  await page.waitForTimeout(300);
}

test.describe('Bootstrap adapter', () => {
  test('Bootstrap components re-skin to tokens on theme switch', async ({ page }) => {
    await page.goto('/examples/bootstrap/');
    const primaryBtn = page.locator('.btn-primary').first();
    await expect(primaryBtn).toBeVisible();

    await setTheme(page, 'professional');
    const proBg = await primaryBtn.evaluate((el) => getComputedStyle(el).backgroundColor);
    // The adapter maps --bs-btn-bg to var(--accent-primary); confirm it is NOT
    // Bootstrap's default blue (#0d6efd === rgb(13, 110, 253)).
    expect(proBg).not.toBe('rgb(13, 110, 253)');

    await setTheme(page, 'dark');
    const darkBg = await primaryBtn.evaluate((el) => getComputedStyle(el).backgroundColor);
    // Themes differ → the token-driven button background must change.
    expect(darkBg).not.toBe(proBg);

    // The card surface is also token-driven and re-skins with the theme.
    const cardBg = await page.locator('.card').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(cardBg).not.toBe('rgb(255, 255, 255)');
  });
});

test.describe('Bootstrap fixture screenshots', () => {
  for (const theme of ['professional', 'dark', 'forest']) {
    test(`bootstrap — ${theme}`, async ({ page }) => {
      await page.goto('/examples/bootstrap/');
      await page.locator('.btn-primary').first().waitFor();
      await setTheme(page, theme);
      await expect(page).toHaveScreenshot(`bootstrap-${theme}.png`, { fullPage: true });
    });
  }
});
