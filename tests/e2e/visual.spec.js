const { test, expect } = require('@playwright/test');

const THEMES = ['professional', 'light', 'dark', 'healthcare', 'saas', 'minimal', 'forest', 'ocean'];

function assertNo404s(page) {
  const failed = [];
  page.on('response', (response) => {
    if (response.status() === 404) {
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

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    const link = document.getElementById('theme-link');
    if (link) {
      const base = link.href.replace(/themes\/.*\.css/, 'themes/');
      link.href = base + t + '.css';
    }
    const html = document.documentElement;
    if (t === 'dark') {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
    } else {
      html.classList.remove('dark');
      html.removeAttribute('data-theme');
    }
  }, theme);
  // Wait for CSS to apply
  await page.waitForTimeout(300);
}

test.describe('Examples', () => {
  test('overview page renders', async ({ page }) => {
    const network = assertNo404s(page);
    await page.goto('/examples/index.html');
    await expect(page.locator('h1')).toContainText('Example Suite');
    await expect(page.locator('.theme-gallery')).toBeVisible();
    await network.verify();
  });

  test('components page renders', async ({ page }) => {
    const network = assertNo404s(page);
    await page.goto('/examples/components/');
    await expect(page.locator('h1')).toContainText('Component Reference');
    await network.verify();
  });

  test('guide page renders', async ({ page }) => {
    const network = assertNo404s(page);
    await page.goto('/examples/guide/');
    await expect(page.locator('h2#overview')).toContainText('Overview');
    await network.verify();
  });

  test('pilot app renders', async ({ page }) => {
    const network = assertNo404s(page);
    await page.goto('/examples/pilot-app/');
    await expect(page.locator('h2')).toContainText('Dashboard');
    await network.verify();
  });

  test('studio page renders', async ({ page }) => {
    const network = assertNo404s(page);
    await page.goto('/examples/studio/');
    await expect(page.locator('h1')).toContainText('Design System Studio');
    await network.verify();
  });

  test('studio preview tab shows live app', async ({ page }) => {
    const network = assertNo404s(page);
    await page.goto('/examples/studio/');
    await expect(page.locator('#panel-preview')).toContainText('Live App Preview');
    await expect(page.locator('#panel-preview .mini-app-toolbar')).toBeVisible();
    await network.verify();
  });

  test('studio primitives tab shows state matrix', async ({ page }) => {
    const network = assertNo404s(page);
    await page.goto('/examples/studio/');
    await page.locator('.studio-tab[data-panel="primitives"]').click();
    await expect(page.locator('#panel-primitives')).toContainText('Primitive State Matrix');
    await expect(page.locator('#panel-primitives')).toContainText('Buttons');
    await expect(page.locator('#panel-primitives')).toContainText('Inputs');
    await network.verify();
  });

  test('studio tokens tab shows inspector', async ({ page }) => {
    const network = assertNo404s(page);
    await page.goto('/examples/studio/');
    await page.locator('.studio-tab[data-panel="tokens"]').click();
    await expect(page.locator('#panel-tokens')).toContainText('Token Inspector');
    await expect(page.locator('#token-search')).toBeVisible();
    await network.verify();
  });

  test('studio motion tab shows animations', async ({ page }) => {
    const network = assertNo404s(page);
    await page.goto('/examples/studio/');
    await page.locator('.studio-tab[data-panel="motion"]').click();
    await expect(page.locator('#panel-motion')).toContainText('Motion Preview');
    await expect(page.locator('#panel-motion')).toContainText('Fade In');
    await network.verify();
  });

  test('studio migration tab shows before/after', async ({ page }) => {
    const network = assertNo404s(page);
    await page.goto('/examples/studio/');
    await page.locator('.studio-tab[data-panel="migration"]').click();
    await expect(page.locator('#panel-migration')).toContainText('Migration Preview');
    await expect(page.locator('#panel-migration')).toContainText('Legacy CSS');
    await expect(page.locator('#panel-migration')).toContainText('Token Shim');
    await network.verify();
  });

  test('token docs page renders', async ({ page }) => {
    const network = assertNo404s(page);
    await page.goto('/docs/tokens.html');
    await expect(page.locator('h1')).toContainText('Design Tokens Reference');
    await network.verify();
  });
});

test.describe('Fixture smoke tests', () => {
  test('AngularJS legacy fixture renders', async ({ page }) => {
    const network = assertNo404s(page);
    await page.goto('/fixtures/angularjs-legacy/index.html');
    await expect(page.locator('h1')).toContainText('Legacy AngularJS App');
    await expect(page.locator('.legacy-btn')).toHaveCount(5);
    await network.verify();
  });

  test('PrimeNG modern fixture renders', async ({ page }) => {
    const network = assertNo404s(page);
    await page.goto('http://localhost:8082/');
    await page.waitForSelector('h1', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('PrimeNG Modern Fixture');
    await expect(page.locator('p-button')).toHaveCount(5);
    await network.verify();
  });
});

test.describe('Studio tab screenshots', () => {
  test('studio primitives tab — professional', async ({ page }) => {
    const network = assertNo404s(page);
    await page.goto('/examples/studio/');
    await setTheme(page, 'professional');
    await page.locator('.studio-tab[data-panel="primitives"]').click();
    await expect(page.locator('#panel-primitives')).toBeVisible();
    await page.waitForTimeout(200);
    await expect(page).toHaveScreenshot('studio-primitives-professional.png', {
      fullPage: true,
      threshold: 0.2,
    });
    await network.verify();
  });
});

test.describe('Theme screenshots', () => {
  const targets = [
    { path: '/examples/index.html', name: 'index' },
    { path: '/examples/components/', name: 'components' },
    { path: '/examples/studio/', name: 'studio' },
    { path: '/fixtures/angularjs-legacy/index.html', name: 'angularjs-legacy' },
    { path: 'http://localhost:8082/', name: 'primeng-modern' },
    { path: '/examples/pilot-app/', name: 'pilot' },
  ];

  for (const target of targets) {
    for (const theme of THEMES) {
      test(`${target.name} — ${theme}`, async ({ page }) => {
        const network = assertNo404s(page);
        await page.goto(target.path);
        await setTheme(page, theme);
        await expect(page).toHaveScreenshot(`${target.name}-${theme}.png`, {
          fullPage: true,
          threshold: 0.2,
        });
        await network.verify();
      });
    }
  }
});

test.describe('Auto theme screenshots', () => {
  const targets = [
    { path: '/examples/index.html', name: 'index' },
    { path: '/examples/components/', name: 'components' },
    { path: '/examples/studio/', name: 'studio' },
    { path: '/fixtures/angularjs-legacy/index.html', name: 'angularjs-legacy' },
    { path: 'http://localhost:8082/', name: 'primeng-modern' },
    { path: '/examples/pilot-app/', name: 'pilot' },
  ];

  for (const target of targets) {
    test(`${target.name} — auto-light`, async ({ page }) => {
      const network = assertNo404s(page);
      await page.emulateMedia({ colorScheme: 'light' });
      await page.goto(target.path);
      await setTheme(page, 'auto');
      await expect(page).toHaveScreenshot(`${target.name}-auto-light.png`, {
        fullPage: true,
        threshold: 0.2,
      });
      await network.verify();
    });

    test(`${target.name} — auto-dark`, async ({ page }) => {
      const network = assertNo404s(page);
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto(target.path);
      await setTheme(page, 'auto');
      await expect(page).toHaveScreenshot(`${target.name}-auto-dark.png`, {
        fullPage: true,
        threshold: 0.2,
      });
      await network.verify();
    });
  }
});
