const { test, expect } = require('@playwright/test');

async function setTheme(page, name) {
  await page.evaluate((t) => {
    const link = document.getElementById('theme-link');
    link.href = link.href.replace(/themes\/[^/]+\.css/, `themes/${t}.css`);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, name);
  await page.waitForTimeout(name ? 300 : 0);
}

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

test.describe('ag-Grid fixture screenshots', () => {
  for (const theme of ['professional', 'dark', 'forest']) {
    test(`aggrid — ${theme}`, async ({ page }) => {
      await page.goto('/examples/aggrid/');
      await page.waitForSelector('.ag-fresh .ag-header', { timeout: 10000 });
      await setTheme(page, theme);
      await page.waitForTimeout(400);
      await expect(page).toHaveScreenshot(`aggrid-${theme}.png`, { fullPage: true, threshold: 0.2 });
    });
  }
});

test.describe('ag-Grid 14 shim', () => {
  test('grid renders and re-skins via tokens on theme switch', async ({ page }) => {
    await page.goto('/examples/aggrid/');
    await page.waitForSelector('.ag-fresh .ag-header', { timeout: 10000 });
    const header = page.locator('.ag-fresh .ag-header').first();

    await setTheme(page, 'professional');
    const proBg = await header.evaluate((el) => getComputedStyle(el).backgroundColor);

    await setTheme(page, 'dark');
    const darkBg = await header.evaluate((el) => getComputedStyle(el).backgroundColor);

    // Shim maps header background to var(--surface-raised); themes differ → bg must change.
    expect(proBg).not.toBe(darkBg);
    // And it is a solid token color, not ag-Grid's default linear-gradient (which computes to a gradient via backgroundImage).
    const headerImg = await header.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(headerImg).toBe('none');
  });
});
