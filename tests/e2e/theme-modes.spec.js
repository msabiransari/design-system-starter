import { test, expect } from '@playwright/test';

// Independent expected values: removing a night block must fail in the browser.
const themes = [
  { id: 'professional', day: '#f4f6f8', night: '#111722' },
  { id: 'healthcare', day: '#f5f7f4', night: '#121b18' },
  { id: 'saas', day: '#fafafa', night: '#161522' },
  { id: 'minimal', day: '#ffffff', night: '#121212' },
  { id: 'forest', day: '#f5f3ee', night: '#181b14' },
  { id: 'ocean', day: '#f0f9ff', night: '#101c25' },
];
const modes = [
  { mode: null, device: 'light', form: 'day' },
  { mode: null, device: 'dark', form: 'day' },
  { mode: 'dark', device: 'light', form: 'night' },
  { mode: 'dark', device: 'dark', form: 'night' },
  { mode: 'auto', device: 'dark', form: 'night' },
  { mode: 'auto', device: 'light', form: 'day' },
  { mode: 'light', device: 'dark', form: 'day' },
];

async function rootStyle(page) {
  return page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return { page: style.getPropertyValue('--surface-page').trim(), scheme: style.colorScheme };
  });
}

for (const theme of themes) {
  test(`${theme.id}: day, forced night and device modes`, async ({ page }) => {
    await page.goto('/examples/components/');
    await page.getByLabel('Select theme').selectOption(theme.id);
    for (const { mode, device, form } of modes) {
      await test.step(`${mode ?? 'unset'} / device ${device}`, async () => {
        await page.emulateMedia({ colorScheme: device });
        await page.evaluate((value) => {
          if (value === null) document.documentElement.removeAttribute('data-mode');
          else document.documentElement.setAttribute('data-mode', value);
        }, mode);
        await expect.poll(() => rootStyle(page)).toEqual({
          page: theme[form], scheme: form === 'night' ? 'dark' : 'light',
        });
      });
    }
  });
}

test('mode control updates the root, persists, and follows device changes', async ({ page }) => {
  await page.goto('/examples/');
  await page.getByLabel('Select theme').selectOption('ocean');
  await page.getByLabel('Select mode').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
  await expect.poll(() => rootStyle(page)).toEqual({ page: '#101c25', scheme: 'dark' });
  await page.reload();
  await expect(page.getByLabel('Select mode')).toHaveValue('dark');
  await expect.poll(() => rootStyle(page)).toEqual({ page: '#101c25', scheme: 'dark' });
  await page.getByLabel('Select mode').selectOption('auto');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect.poll(() => rootStyle(page)).toEqual({ page: '#f0f9ff', scheme: 'light' });
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect.poll(() => rootStyle(page)).toEqual({ page: '#101c25', scheme: 'dark' });
  await page.getByLabel('Select mode').selectOption('light');
  await expect.poll(() => rootStyle(page)).toEqual({ page: '#f0f9ff', scheme: 'light' });
});

test('gallery previews resolve each brand form independently of the page theme', async ({ page }) => {
  await page.goto('/examples/');
  for (const theme of themes) {
    const card = page.locator(`.theme-card[href$="?theme=${theme.id}"]`);
    for (const [mode, expected] of [['light', theme.day], ['dark', theme.night]]) {
      const preview = card.locator(`[data-preview-mode="${mode}"]`);
      await expect(preview).toBeVisible();
      const rgb = expected.slice(1).match(/../g).map(value => parseInt(value, 16)).join(', ');
      await expect(preview).toHaveCSS('background-color', `rgb(${rgb})`);
    }
  }
});

test('neutral themes retain their own mode and dark hooks', async ({ page }) => {
  await page.goto('/examples/');
  await page.getByLabel('Select mode').selectOption('dark');
  for (const [theme, device, expected, scheme] of [
    ['light', 'dark', '#f8f9fb', 'light'],
    ['dark', 'light', '#13161b', 'dark'],
    ['auto', 'light', '#f4f6f8', 'light dark'],
    ['auto', 'dark', '#13161b', 'dark'],
  ]) {
    await page.emulateMedia({ colorScheme: device });
    await page.getByLabel('Select theme').selectOption(theme);
    await expect(page.getByLabel('Select mode')).toBeDisabled();
    await expect.poll(() => rootStyle(page)).toEqual({ page: expected, scheme });
    if (theme === 'dark') {
      await expect(page.locator('html')).toHaveClass(/dark/);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    }
  }
});
