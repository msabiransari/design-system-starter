const { test, expect } = require('@playwright/test');

test.describe('Classless layer', () => {
  test('themes a bare <th> via tokens (not the browser default)', async ({ page }) => {
    await page.goto('/examples/aggrid/');
    const th = page.locator('#bare-table th').first();
    await expect(th).toBeVisible();
    const bg = await th.evaluate((el) => getComputedStyle(el).backgroundColor);
    // Browser default for <th> is transparent (rgba(0,0,0,0)). Classless gives it a surface.
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(bg).not.toBe('transparent');
  });

  test('an unlayered app rule beats classless by layer precedence — NO !important, even when declared earlier', async ({ page }) => {
    await page.goto('/examples/aggrid/');
    const probe = page.locator('#probe');
    const bg = await probe.evaluate((el) => getComputedStyle(el).backgroundColor);
    // The page sets `mark { background-color: rgb(255,0,0) }` UNLAYERED and BEFORE the
    // classless <link>. Equal specificity + earlier source order would normally LOSE to the
    // later classless `mark` rule — but unlayered always beats layered, so the app rule wins.
    // This isolates the @layer effect (not specificity, not source order).
    expect(bg).toBe('rgb(255, 0, 0)');
  });
});
