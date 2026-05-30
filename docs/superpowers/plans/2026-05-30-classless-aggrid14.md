# Classless Layer + ag-Grid 14 Shim Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in, globally-importable "classless" layer that themes all semantic HTML, an ag-Grid 14 class-based shim that maps the grid onto our tokens, and prove both (plus runtime theming) in a hermetic fixture — while restructuring `examples/` so each example is self-contained.

**Architecture:** `classless.css` wraps all rules in a single low-priority `@layer ds.classless`, so any unlayered app/primitive style overrides it with zero `!important`. `adapters/ag-grid-14-adapter.css` overrides ag-Grid 14's `.ag-fresh .ag-*` classes with `var(--token)` values (v14 has no CSS variables), so the grid re-skins live on theme switch. A vendored, pinned ag-Grid 14.2.0 fixture at `examples/aggrid/` exercises everything under Playwright.

**Tech Stack:** Plain CSS (custom properties + `@layer` + `color-mix()`), vanilla JS (ag-Grid 14 UMD), Playwright (behavioral assertions + visual snapshots), stylelint, Node 18+ for tooling.

---

## File Structure

**Create:**
- `classless.css` — repo-root global classless layer (tokens only; `@layer ds.classless`).
- `adapters/ag-grid-14-adapter.css` — class-based shim for ag-Grid 14 `.ag-fresh`.
- `examples/aggrid/index.html` — fixture: bare HTML + app-override demo + real ag-Grid 14.
- `examples/aggrid/vendor/ag-grid-14.2.0/{ag-grid.js,ag-grid.css,theme-fresh.css}` — vendored pinned library (hermetic tests, no CDN flakiness).
- `tests/e2e/classless-aggrid.spec.js` — behavioral assertions (classless applies, app overrides win, grid re-skins on theme switch) + visual snapshot.

**Modify:**
- `examples/{auth,components,crm,dashboard,data,guide,marketing,pilot-app,studio}.html` → moved to `examples/<name>/index.html` with corrected relative paths.
- `examples/index.html` — card links point to folders; new ag-Grid card.
- `examples/shared/nav.js` — depth-aware links + theme path; new "ag-Grid 14" entry.
- `tests/e2e/visual.spec.js` — example URLs point to folders.
- `package.json` — `exports["./classless"]`, `files[]`, `build` copy step.
- `README.md`, `AGENTS.md`, `adapters/MATRIX.md` — docs.

**Responsibility boundaries:** the classless layer never knows about any library; the adapter never redefines token meaning (only maps `.ag-*` → tokens); the fixture is the only page that loads `classless.css` + ag-Grid (existing examples keep using primitives, so their behavior is unchanged except the shared nav gains one link).

---

### Task 1: Restructure `examples/` into per-example folders

Atomic change: move all 9 pages into folders, fix their relative paths, make `nav.js` depth-aware and add the ag-Grid entry, update `index.html` links + add an ag-Grid card, create a placeholder `examples/aggrid/index.html`, and update Playwright URLs. End state: `npm run test:e2e` green (render/no-404 tests pass first, then baselines refreshed for the changed nav).

**Files:**
- Move: `examples/<name>.html` → `examples/<name>/index.html` (9 files)
- Create: `examples/aggrid/index.html` (placeholder)
- Modify: `examples/shared/nav.js`, `examples/index.html`, `tests/e2e/visual.spec.js`

- [ ] **Step 1: Move the 9 pages into folders (preserve git history)**

```bash
cd /Users/msabir/development/projects/design-system-starter
for n in auth components crm dashboard data guide marketing pilot-app studio; do
  mkdir -p "examples/$n"
  git mv "examples/$n.html" "examples/$n/index.html"
done
git status -s | head -30
```

Expected: 9 renames staged; `examples/shared/` and `examples/index.html` untouched.

- [ ] **Step 2: Fix relative paths inside each moved page**

Each moved page is now one directory deeper, so `"../X"` → `"../../X"` and `"./shared/X"` → `"../shared/X"`. Run the rewrite and then verify nothing shallow remains:

**Order matters** — double the repo-root `../` refs FIRST (while `./shared/` still starts with
`./`, so it is untouched), THEN convert `./shared/` and any other `./`:

```bash
cd /Users/msabir/development/projects/design-system-starter
for n in auth components crm dashboard data guide marketing pilot-app studio; do
  f="examples/$n/index.html"
  # 1) "../X" (one level up to repo root) -> "../../X"  (does NOT match "./shared/")
  perl -0pi -e 's{(href|src)="\.\./(?!\.)}{$1="../../}g' "$f"
  # 2) "./shared/X" -> "../shared/X"
  perl -0pi -e 's{(href|src)="\./shared/}{$1="../shared/}g' "$f"
  # 3) any other remaining "./X" -> "../X"
  perl -0pi -e 's{(href|src)="\./(?!\.)}{$1="../}g' "$f"
done
echo "=== sanity: any single-level ../ assets left (should be ../../ now)? ==="
grep -REn '(href|src)="\.\./[^.]' examples/*/index.html | grep -v '\.\./\.\.' | grep -v '\.\./shared' || echo "clean"
echo "=== sanity: any ./shared or bare shared refs left? ==="
grep -REn '"\./shared|="shared' examples/*/index.html || echo "clean"
```

Expected: both sanity greps print `clean`. (`../shared/` and `../../` references are correct and expected.)

- [ ] **Step 3: Check moved pages for non-head relative references (JS template literals, inline fetch)**

`studio/index.html` and others may reference assets in inline `<script>` via backtick/quote paths the head rewrite missed.

```bash
cd /Users/msabir/development/projects/design-system-starter
grep -REn "fetch\(|\.href ?=|url\(|new Image|XMLHttpRequest|import\(" examples/*/index.html \
  | grep -E "\.\./|themes/|shared/|fixtures/" || echo "no relative refs in JS"
```

Expected: any hits must already be `../../...` (themes/fixtures live at repo root). If a `../themes/` (single) remains inside a script, fix it to `../../themes/`. Record and fix each before continuing.

- [ ] **Step 4: Replace `examples/shared/nav.js` with the depth-aware version**

Full file replacement:

```js
/* ============================================================
   SHARED NAVIGATION + THEME SWITCHER
   Depth-aware: works from examples/index.html (depth 0) and
   examples/<name>/index.html (depth 1). Theme path is derived
   from the existing #theme-link href so it is depth-independent.
   ============================================================ */

(function () {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const exIdx = segments.lastIndexOf('examples');
  const afterEx = exIdx >= 0 ? segments.slice(exIdx + 1) : [];
  const depth = Math.max(0, afterEx.length - 1); // 0 = overview, 1 = a sub-page
  const toExamples = depth === 0 ? './' : '../'.repeat(depth);
  const currentDir = depth === 0 ? 'index' : afterEx[0];

  const examples = [
    { dir: 'index', label: 'Overview' },
    { dir: 'dashboard', label: 'Dashboard' },
    { dir: 'crm', label: 'CRM' },
    { dir: 'marketing', label: 'Marketing' },
    { dir: 'data', label: 'Data' },
    { dir: 'auth', label: 'Auth' },
    { dir: 'components', label: 'Components' },
    { dir: 'guide', label: 'Guide' },
    { dir: 'aggrid', label: 'ag-Grid 14' },
    { dir: 'studio', label: 'Studio' },
  ];

  const themes = [
    { id: 'professional', label: 'Professional' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'auto', label: 'Auto (OS)' },
    { id: 'healthcare', label: 'Healthcare' },
    { id: 'saas', label: 'SaaS' },
    { id: 'minimal', label: 'Minimal' },
    { id: 'forest', label: 'Forest' },
    { id: 'ocean', label: 'Ocean' },
  ];

  function hrefFor(dir) {
    return dir === 'index' ? toExamples : `${toExamples}${dir}/`;
  }

  function init() {
    injectNav();
    restoreTheme();
  }

  function injectNav() {
    const header = document.createElement('header');
    header.className = 'ex-nav';
    header.innerHTML = `
      <div class="ex-nav-brand">
        <span class="ex-nav-logo">DS</span>
        <span class="ex-nav-title">Design System</span>
      </div>
      <nav class="ex-nav-links" aria-label="Examples">
        ${examples.map(ex => `
          <a href="${hrefFor(ex.dir)}" class="ex-nav-link ${currentDir === ex.dir ? 'active' : ''}">${ex.label}</a>
        `).join('')}
      </nav>
      <div class="ex-nav-theme">
        <label for="theme-select" class="ex-nav-theme-label">Theme</label>
        <select id="theme-select" class="ex-nav-select" aria-label="Select theme">
          ${themes.map(t => `<option value="${t.id}">${t.label}</option>`).join('')}
        </select>
      </div>
    `;
    document.body.insertBefore(header, document.body.firstChild);

    document.getElementById('theme-select').addEventListener('change', (e) => {
      setTheme(e.target.value);
    });
  }

  function setTheme(name) {
    const link = document.getElementById('theme-link');
    const html = document.documentElement;
    if (!link) return;

    // Derive base path from the existing href so depth does not matter.
    link.href = link.href.replace(/themes\/[^/]+\.css/, `themes/${name}.css`);
    localStorage.setItem('ds-theme', name);

    if (name === 'dark') {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
    } else {
      html.classList.remove('dark');
      html.removeAttribute('data-theme');
    }

    const select = document.getElementById('theme-select');
    if (select) select.value = name;
  }

  function restoreTheme() {
    const saved = localStorage.getItem('ds-theme') || 'professional';
    setTheme(saved);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

- [ ] **Step 5: Update `examples/index.html` intra-example links + add ag-Grid card**

The overview stays at depth 0, so its `../tokens.css`/`../themes/` head links and the inline `fetch('../themes/...')` are already correct. Only the page-to-page links change from `<name>.html` to `<name>/`.

```bash
cd /Users/msabir/development/projects/design-system-starter
perl -0pi -e 's{href="(auth|components|crm|dashboard|data|guide|marketing|pilot-app|studio)\.html"}{href="$1/"}g' examples/index.html
# inline gallery script links to studio
perl -0pi -e "s{'studio\.html}{'studio/}g" examples/index.html
perl -0pi -e 's{"studio\.html}{"studio/}g' examples/index.html
echo "=== remaining *.html intra links (expect only ../ROLLOUT etc, none to example pages) ==="
grep -oE 'href="[a-z-]+\.html"' examples/index.html || echo "clean"
```

Then add the ag-Grid card. Use Edit to insert this block immediately before the closing `</div>` of `ex-card-grid` (after the Studio card at `examples/index.html`):

```html
        <a href="aggrid/" class="ds-card suite-card ds-animate-slide-up" style="animation-delay: 400ms;">
          <div class="suite-card-icon">🧮</div>
          <div class="suite-card-title">ag-Grid 14</div>
          <div class="suite-card-desc">Legacy ag-Grid 14 skinned by a token shim, plus classless bare HTML — switch themes to watch the grid and page re-skin together.</div>
        </a>
```

- [ ] **Step 6: Create placeholder `examples/aggrid/index.html`**

Minimal valid page (fleshed out in Tasks 2–3) so the new nav link and card never 404:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ag-Grid 14 + Classless — Design System</title>
  <link rel="stylesheet" href="../../tokens.css" />
  <link rel="stylesheet" href="../../themes/professional.css" id="theme-link" />
  <link rel="stylesheet" href="../../base.css" />
  <link rel="stylesheet" href="../../motion.css" />
  <link rel="stylesheet" href="../shared/examples.css" />
  <script src="../shared/nav.js" defer></script>
</head>
<body>
  <main class="ex-page">
    <h1 class="ds-headline">ag-Grid 14 + Classless</h1>
    <p class="ds-body">Coming together in the next steps.</p>
  </main>
</body>
</html>
```

- [ ] **Step 7: Update example URLs in `tests/e2e/visual.spec.js`**

```bash
cd /Users/msabir/development/projects/design-system-starter
perl -0pi -e 's{/examples/(components|guide|pilot-app|studio)\.html}{/examples/$1/}g' tests/e2e/visual.spec.js
echo "=== confirm no flat example URLs remain (index.html is allowed) ==="
grep -nE "/examples/(components|guide|pilot-app|studio)\.html" tests/e2e/visual.spec.js || echo "clean"
```

Expected: `clean`. (`/examples/index.html` intentionally stays.)

- [ ] **Step 8: Verify paths/no-404 BEFORE touching baselines**

Run only the render + no-404 tests (these fail on any broken path; they don't compare screenshots):

```bash
npx playwright test visual.spec.js -g "renders|page renders|app renders" --reporter=list
```

Expected: PASS. If any test throws `Network 404s detected`, a path is wrong — fix the offending file and re-run before continuing. Do NOT proceed to Step 9 until this is green.

- [ ] **Step 9: Refresh visual baselines (nav gained one link → every example screenshot changes)**

```bash
npm run test:e2e:update
npm run test:e2e
```

Expected: second command PASS. The only intended visual delta is the extra "ag-Grid 14" nav link; the no-404 gate in Step 8 already proved nothing rendered broken.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "refactor(examples): move each example into its own folder; depth-aware nav

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Create `classless.css` and prove the classless + override behavior

**Files:**
- Create: `classless.css`
- Modify: `examples/aggrid/index.html` (bare HTML + app-override demo + load classless)
- Create: `tests/e2e/classless-aggrid.spec.js`

- [ ] **Step 1: Write the failing behavioral test**

Create `tests/e2e/classless-aggrid.spec.js`:

```js
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
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx playwright test classless-aggrid.spec.js -g "Classless" --reporter=list
```

Expected: FAIL — `#bare-table`/`#override-cell` do not exist yet.

- [ ] **Step 3: Create `classless.css`**

Tokens-only (passes strict root stylelint). Full file:

```css
/* ============================================================
   CLASSLESS LAYER
   Themes all user-visible HTML via tokens, inside the lowest
   cascade layer so ANY unlayered app/primitive style overrides
   it with no !important. Opt in by importing this file.
   ============================================================ */

@layer ds.classless {

  /* Headings */
  h1, h2, h3, h4, h5, h6 {
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-weight: var(--weight-semibold);
    line-height: var(--leading-tight);
    margin-bottom: var(--space-3);
  }
  h1 { font-size: var(--text-3xl); }
  h2 { font-size: var(--text-2xl); }
  h3 { font-size: var(--text-xl); }
  h4 { font-size: var(--text-lg); }
  h5 { font-size: var(--text-base); }
  h6 { font-size: var(--text-sm); }

  /* Body text + inline */
  p, li, dd, dt, figcaption, blockquote {
    color: var(--text-primary);
    line-height: var(--leading-normal);
  }
  p { margin-bottom: var(--space-3); }
  a { color: var(--text-link); text-decoration: none; }
  a:hover { text-decoration: underline; }
  small { font-size: var(--text-sm); color: var(--text-secondary); }
  strong, b { font-weight: var(--weight-semibold); }
  mark { background: var(--accent-warning-bg, var(--surface-hover)); color: var(--text-primary); }
  abbr { text-decoration-style: dotted; }
  code, kbd, samp, var, pre {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
  }
  code, kbd { background: var(--surface-hover); border-radius: var(--radius-sm); padding: 0 var(--space-1); }
  pre {
    background: var(--surface-raised);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-base);
    padding: var(--space-3);
    overflow: auto;
  }
  pre code { background: transparent; padding: 0; }
  blockquote {
    border-left: 3px solid var(--border-default);
    padding-left: var(--space-3);
    color: var(--text-secondary);
  }
  hr { border: 0; height: 1px; background: var(--border-subtle); margin: var(--gap-md) 0; }

  /* Lists */
  ul, ol, menu, dl { margin-bottom: var(--space-3); padding-left: var(--space-5); }
  dl { padding-left: 0; }
  dt { font-weight: var(--weight-semibold); }

  /* Tables (mirrors .ds-table but at bare selectors; .ds-table still wins) */
  table {
    border-collapse: collapse;
    width: 100%;
    color: var(--text-primary);
    font-size: var(--text-sm);
  }
  caption { color: var(--text-muted); text-align: left; padding: var(--space-2); }
  thead { background: var(--surface-raised); }
  th {
    background: var(--surface-raised);
    color: var(--text-secondary);
    text-align: left;
    font-weight: var(--weight-semibold);
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--border-default);
  }
  td {
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--border-subtle);
  }
  tbody tr:hover td { background: var(--surface-hover); }

  /* Forms */
  fieldset {
    border: 1px solid var(--border-default);
    border-radius: var(--radius-base);
    padding: var(--space-3);
    margin-bottom: var(--space-3);
  }
  legend { color: var(--text-secondary); font-weight: var(--weight-semibold); padding: 0 var(--space-2); }
  label { color: var(--text-secondary); font-size: var(--text-sm); }
  input, textarea, select {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--text-primary);
    background: var(--surface-default);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-base);
    padding: var(--space-2) var(--space-3);
  }
  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: var(--border-focus, var(--accent-primary));
    box-shadow: 0 0 0 2px var(--focus-ring);
  }
  input::placeholder, textarea::placeholder { color: var(--text-muted); }
  button {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--accent-primary-text);
    background: var(--accent-primary);
    border: 1px solid var(--accent-primary);
    border-radius: var(--radius-base);
    padding: var(--space-2) var(--space-4);
    cursor: pointer;
    transition: background var(--duration-fast) var(--ease-out);
  }
  button:hover { background: var(--accent-primary-hover, var(--accent-primary)); }
  progress { accent-color: var(--accent-primary); }
  meter { accent-color: var(--accent-primary); }

  /* Interactive / disclosure */
  details {
    border: 1px solid var(--border-default);
    border-radius: var(--radius-base);
    padding: var(--space-2) var(--space-3);
    margin-bottom: var(--space-3);
  }
  summary { cursor: pointer; color: var(--text-primary); font-weight: var(--weight-medium); }
  dialog {
    background: var(--surface-default);
    color: var(--text-primary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-base);
    box-shadow: var(--shadow-lg);
  }

  /* Media */
  img, video, audio, canvas, svg { max-width: 100%; }
  figure { margin: 0 0 var(--space-3); }
}
```

> Note: a few tokens use `var(--token, fallback)` where the optional token may not exist in every theme (e.g. `--accent-warning-bg`, `--accent-primary-hover`, `--border-focus`). The fallback keeps it valid everywhere.

- [ ] **Step 4: Build the fixture's classless surface in `examples/aggrid/index.html`**

Replace the placeholder body and add `classless.css` + an app-override rule. Full file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ag-Grid 14 + Classless — Design System</title>
  <link rel="stylesheet" href="../../tokens.css" />
  <link rel="stylesheet" href="../../themes/professional.css" id="theme-link" />
  <link rel="stylesheet" href="../../base.css" />
  <link rel="stylesheet" href="../../motion.css" />
  <!-- Unlayered app rule, declared BEFORE classless.css. Equal specificity + earlier source
       order would normally lose to classless's later `mark` rule — but unlayered always beats
       layered, so this wins with NO !important. Proves the @layer override model. -->
  <style>
    mark { background-color: rgb(255, 0, 0); color: rgb(255, 255, 255); }
  </style>
  <link rel="stylesheet" href="../../classless.css" />
  <link rel="stylesheet" href="../../primitives.css" />
  <link rel="stylesheet" href="../shared/examples.css" />
  <script src="../shared/nav.js" defer></script>
</head>
<body>
  <main class="ex-page">
    <h1 class="ds-headline">ag-Grid 14 + Classless</h1>
    <p class="ds-body">Bare semantic HTML below is themed only by <code>classless.css</code>. Switch themes in the nav — everything re-skins live. This <mark id="probe">app override</mark> stays red, proving the classless layer yields to app styles with no <code>!important</code>.</p>

    <section style="margin-top: var(--gap-md);">
      <h2>Bare table (no classes)</h2>
      <table id="bare-table">
        <thead>
          <tr><th>Account</th><th>Type</th><th>Balance</th></tr>
        </thead>
        <tbody>
          <tr><td>Operating</td><td>Checking</td><td>$12,400</td></tr>
          <tr><td>Reserve</td><td>Savings</td><td>$48,900</td></tr>
        </tbody>
      </table>
    </section>

    <section style="margin-top: var(--gap-md);">
      <h2>Bare form (no classes)</h2>
      <form>
        <fieldset>
          <legend>Profile</legend>
          <label for="nm">Name</label>
          <input id="nm" type="text" placeholder="Jane Doe" />
          <label for="rl">Role</label>
          <select id="rl"><option>Admin</option><option>Member</option></select>
          <button type="button">Save</button>
        </fieldset>
      </form>
    </section>
  </main>
</body>
</html>
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx playwright test classless-aggrid.spec.js -g "Classless" --reporter=list
```

Expected: PASS (bare `<th>` has a surface background; `#probe` is `rgb(255, 0, 0)`).

- [ ] **Step 6: Lint the new CSS**

```bash
npm run lint:css
```

Expected: PASS (classless.css references tokens only — no hex/rgb/hsl literals).

- [ ] **Step 7: Commit**

```bash
git add classless.css examples/aggrid/index.html tests/e2e/classless-aggrid.spec.js
git commit -m "feat(classless): add token-based classless layer with override-by-cascade-layer

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: ag-Grid 14 shim + real grid in the fixture + runtime-theming test

**Files:**
- Create: `examples/aggrid/vendor/ag-grid-14.2.0/{ag-grid.js,ag-grid.css,theme-fresh.css}`
- Create: `adapters/ag-grid-14-adapter.css`
- Modify: `examples/aggrid/index.html` (add grid markup, vendored CSS/JS, adapter, grid init)
- Modify: `tests/e2e/classless-aggrid.spec.js` (add grid runtime-theming test + visual snapshot)

- [ ] **Step 1: Vendor the pinned ag-Grid 14.2.0 assets (hermetic, version-pinned)**

```bash
cd /Users/msabir/development/projects/design-system-starter
mkdir -p examples/aggrid/vendor/ag-grid-14.2.0
for f in ag-grid.js styles/ag-grid.css styles/theme-fresh.css; do
  out="examples/aggrid/vendor/ag-grid-14.2.0/$(basename $f)"
  curl -sf "https://unpkg.com/ag-grid@14.2.0/dist/$f" -o "$out" && echo "OK $out" || echo "FAIL $f"
done
ls -la examples/aggrid/vendor/ag-grid-14.2.0/
```

Expected: three `OK` lines; `ag-grid.js`, `ag-grid.css`, `theme-fresh.css` present.

- [ ] **Step 2: Write the failing grid runtime-theming test**

Add to `tests/e2e/classless-aggrid.spec.js`:

```js
test.describe('ag-Grid 14 shim', () => {
  async function setTheme(page, name) {
    await page.evaluate((t) => {
      const link = document.getElementById('theme-link');
      link.href = link.href.replace(/themes\/[^/]+\.css/, `themes/${t}.css`);
      document.documentElement.classList.toggle('dark', t === 'dark');
    }, name);
    await page.waitForTimeout(300);
  }

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
```

- [ ] **Step 3: Run to verify it fails**

```bash
npx playwright test classless-aggrid.spec.js -g "ag-Grid 14 shim" --reporter=list
```

Expected: FAIL — no `.ag-fresh .ag-header` (grid not added yet).

- [ ] **Step 4: Create `adapters/ag-grid-14-adapter.css`**

Selectors verified against ag-Grid 14.2.0 `theme-fresh.css`. The relaxed `adapters/**` stylelint override permits `color-mix()`/`!important`:

```css
/* ============================================================
   ag-Grid 14 ADAPTER (class-based shim)
   ag-Grid 14 has NO CSS variables; it ships compiled Sass themes.
   We override its .ag-fresh classes with our tokens so the grid
   matches the active theme and re-skins live on theme switch.
   Load AFTER vendor/ag-grid.css and vendor/theme-fresh.css.
   !important is required to defeat ag-Grid's compiled specificity.
   ============================================================ */

/* Root: font + base text/background */
.ag-fresh {
  font-family: var(--font-sans) !important;
  font-size: var(--text-sm) !important;
  color: var(--text-primary) !important;
}
.ag-fresh .ag-root,
.ag-fresh .ag-body-viewport,
.ag-fresh .ag-body {
  background-color: var(--surface-default) !important;
  border-color: var(--border-default) !important;
}

/* Header: replace the white→grey gradient with a flat token surface */
.ag-fresh .ag-header {
  background-image: none !important;
  background-color: var(--surface-raised) !important;
  color: var(--text-secondary) !important;
  border-bottom: 1px solid var(--border-default) !important;
}
.ag-fresh .ag-header-cell {
  color: var(--text-secondary) !important;
  border-right: 1px solid var(--border-subtle) !important;
}

/* Rows */
.ag-fresh .ag-row-odd { background-color: var(--surface-page) !important; }
.ag-fresh .ag-row-even { background-color: var(--surface-default) !important; }
.ag-fresh .ag-row:hover,
.ag-fresh .ag-row-hover { background-color: var(--surface-hover) !important; }
.ag-fresh .ag-row-selected {
  background-color: color-mix(in srgb, var(--accent-primary) 14%, transparent) !important;
}

/* Cells */
.ag-fresh .ag-cell {
  color: var(--text-primary) !important;
  border-right: 1px solid var(--border-subtle) !important;
}

/* Borders / dividers */
.ag-fresh .ag-row { border-bottom: 1px solid var(--border-subtle) !important; }
```

- [ ] **Step 5: Add the vendored library, adapter, grid markup + init to the fixture**

In `examples/aggrid/index.html`, add the ag-Grid stylesheets **after** primitives and the adapter **after** those (cascade order matters). Insert these into `<head>` right after the `primitives.css` link:

```html
  <link rel="stylesheet" href="./vendor/ag-grid-14.2.0/ag-grid.css" />
  <link rel="stylesheet" href="./vendor/ag-grid-14.2.0/theme-fresh.css" />
  <link rel="stylesheet" href="../../adapters/ag-grid-14-adapter.css" />
```

Add a grid section inside `<main>` (after the bare form section):

```html
    <section style="margin-top: var(--gap-md);">
      <h2>ag-Grid 14 (skinned by the token shim)</h2>
      <div id="grid" class="ag-fresh" style="height: 320px; width: 100%;"></div>
    </section>
```

Add the vendored UMD script and init before `</body>`:

```html
  <script src="./vendor/ag-grid-14.2.0/ag-grid.js"></script>
  <script>
    var gridOptions = {
      enableSorting: true,
      enableColResize: true,
      columnDefs: [
        { headerName: 'Account', field: 'account' },
        { headerName: 'Type', field: 'type' },
        { headerName: 'Balance', field: 'balance' },
        { headerName: 'Status', field: 'status' }
      ],
      rowData: [
        { account: 'Operating', type: 'Checking', balance: '$12,400', status: 'Active' },
        { account: 'Reserve', type: 'Savings', balance: '$48,900', status: 'Active' },
        { account: 'Payroll', type: 'Checking', balance: '$8,150', status: 'Hold' },
        { account: 'Tax', type: 'Savings', balance: '$22,300', status: 'Active' },
        { account: 'Escrow', type: 'Trust', balance: '$61,000', status: 'Review' }
      ]
    };
    new agGrid.Grid(document.getElementById('grid'), gridOptions);
  </script>
```

- [ ] **Step 6: Run the grid test to verify it passes**

```bash
npx playwright test classless-aggrid.spec.js -g "ag-Grid 14 shim" --reporter=list
```

Expected: PASS (header background differs professional vs dark; `backgroundImage` is `none`).

- [ ] **Step 7: Add a visual snapshot of the fixture and generate its baselines**

Append to `tests/e2e/classless-aggrid.spec.js`:

```js
test.describe('ag-Grid fixture screenshots', () => {
  for (const theme of ['professional', 'dark', 'forest']) {
    test(`aggrid — ${theme}`, async ({ page }) => {
      await page.goto('/examples/aggrid/');
      await page.waitForSelector('.ag-fresh .ag-header', { timeout: 10000 });
      await page.evaluate((t) => {
        const link = document.getElementById('theme-link');
        link.href = link.href.replace(/themes\/[^/]+\.css/, `themes/${t}.css`);
        document.documentElement.classList.toggle('dark', t === 'dark');
      }, theme);
      await page.waitForTimeout(400);
      await expect(page).toHaveScreenshot(`aggrid-${theme}.png`, { fullPage: true, threshold: 0.2 });
    });
  }
});
```

```bash
npx playwright test classless-aggrid.spec.js -g "fixture screenshots" --update-snapshots
npx playwright test classless-aggrid.spec.js --reporter=list
```

Expected: second run PASS; baselines `aggrid-{professional,dark,forest}-chromium-{desktop,mobile}.png` committed.

- [ ] **Step 8: Lint**

```bash
npm run lint:css
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add adapters/ag-grid-14-adapter.css examples/aggrid/ tests/e2e/classless-aggrid.spec.js
git commit -m "feat(adapter): ag-grid-14 class-based shim + hermetic fixture + runtime-theming test

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Packaging — ship `classless.css` in the build and exports

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add the export, files entry, and build copy step**

Edit `package.json`:
- In `exports`, after the `"./base"` line add:

```json
    "./classless": "./dist/classless.css",
```

- In `files[]`, after `"base-scoped.css",` add `"classless.css",`.
- In `scripts.build`, add `classless.css` to the `cp` list:

```json
    "build": "mkdir -p dist && cp tokens.css base.css base-scoped.css classless.css motion.css primitives.css icons.css dist/ && cp -r themes dist/ && cp -r adapters dist/ && cp -r icons dist/",
```

- [ ] **Step 2: Build and verify the artifact lands in dist**

```bash
npm run build
test -f dist/classless.css && echo "dist/classless.css OK" || echo "MISSING"
test -f dist/adapters/ag-grid-14-adapter.css && echo "dist adapter OK" || echo "MISSING"
node -e "const p=require('./package.json'); if(!p.exports['./classless']) throw new Error('export missing'); if(!p.files.includes('classless.css')) throw new Error('files missing'); console.log('package.json wiring OK');"
```

Expected: all three lines OK.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "build: ship classless.css in dist, exports, and files

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Documentation

**Files:**
- Modify: `README.md`, `AGENTS.md`, `adapters/MATRIX.md`

- [ ] **Step 1: README — add a "Classless layer" section and an ag-Grid row**

In `README.md`, add a new section after "Using it with legacy applications" (use Edit to insert):

```markdown
## Classless layer

Import one file and **every bare semantic element is themed** — no classes required:

```css
@import "@acme/design-tokens/tokens";
@import "@acme/design-tokens/themes/professional.css";
@import "@acme/design-tokens/base";
@import "@acme/design-tokens/classless";   /* ← themes table, button, input, h1–h6, … */
```

`classless.css` lives in the lowest CSS cascade layer (`@layer ds.classless`). Because
**unlayered CSS always beats layered CSS**, any of your own styles — a class, an element rule,
or inline `style=` — overrides it automatically, with **no `!important` ever**. Add `.ds-table`
and the richer primitive wins; write `td { color: red }` in your app and that wins too. Demo:
`examples/aggrid/` (bare HTML + ag-Grid 14, both re-skinning on theme switch).
```

In the adapter table under "Third-party library adapters", add the row:

```markdown
| ag-Grid 14 (legacy) | `adapters/ag-grid-14-adapter.css` | ✅ Class-based shim over `.ag-fresh` (v14 has no CSS variables). Load after ag-Grid's CSS. |
```

- [ ] **Step 2: AGENTS.md — add task recipes**

In `AGENTS.md`, after the "Task: Modify primitives" section, insert:

```markdown
### Task: Use or extend the classless layer

1. **Use it:** import `classless.css` after `base.css`. It themes all bare HTML via tokens
   inside `@layer ds.classless` (lowest layer), so app styles override it with no `!important`.
2. **Add an element:** add a token-only rule inside the `@layer ds.classless { }` block in
   `classless.css`. No hex/rgb/hsl literals (strict stylelint at repo root).
3. **Verify:** `npm run lint:css` and the `examples/aggrid/` fixture.

### Task: Add a class-based library shim (ag-Grid 14 pattern)

1. Use this when a library has **no CSS variables** (old ag-Grid, legacy widgets). For
   libraries that expose `--vars`, follow the CSS-variable adapter pattern instead
   (`adapters/primeng-adapter.css`).
2. Inspect the library's compiled theme CSS to find its real theme class and internal
   selectors (e.g. ag-Grid 14 uses `.ag-fresh .ag-header`, not `.ag-theme-*`).
3. Create `adapters/{library}-{version}-adapter.css`; override those selectors with
   `var(--token)` values. `!important` is allowed in adapters/shims.
4. Load the adapter **after** the library's own CSS. Update `adapters/MATRIX.md`.
```

- [ ] **Step 3: MATRIX.md — add the ag-Grid 14 row**

In `adapters/MATRIX.md`, add a section after the Angular Material section:

```markdown
## ag-Grid 14 Adapter

**File:** `adapters/ag-grid-14-adapter.css`

### Tested Versions

| ag-Grid | Status | Notes |
|---------|--------|-------|
| 14.2.0 | ✅ Validated | Vendored fixture at `examples/aggrid/vendor/ag-grid-14.2.0/` |
| 14.x | ✅ Expected | Same `.ag-fresh` theme + class structure |
| 15.x–17.x | ⚠️ Untested | Class names begin shifting toward `ag-theme-*` |
| 28.x+ | ❌ Different mechanism | Uses `--ag-*` CSS variables — needs a separate variable-mapping adapter |

### How It Works

ag-Grid 14 has **no CSS variables**; it ships compiled Sass themes. This adapter overrides the
`.ag-fresh .ag-*` classes (header, rows, cells, borders) with ACME token values, so the grid
matches the active theme and re-skins live on theme switch. Must load **after** ag-Grid's
`ag-grid.css` + `theme-fresh.css`. Uses `!important` to defeat ag-Grid's compiled specificity.

### Browser Support

Same as other adapters — requires CSS custom properties and `color-mix()`. No IE11.
```

- [ ] **Step 4: Commit**

```bash
git add README.md AGENTS.md adapters/MATRIX.md
git commit -m "docs: classless layer + ag-grid-14 shim (README, AGENTS, MATRIX)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Full verification gate

**Files:** none (verification only)

- [ ] **Step 1: Run the full gate**

```bash
npm run verify
```

This runs `lint:css` → `audit:contrast` → `build` → `test:e2e`. Expected: all green.

- [ ] **Step 2: If contrast audit flags anything**

The classless layer reuses existing AA-compliant token pairs (text-on-surface like primitives). If `audit:contrast` reports a NEW failure traceable to a classless pair, change that rule to use the same token pair `primitives.css` uses for the equivalent component, then re-run `npm run verify`. Do not weaken the audit.

- [ ] **Step 3: Final commit (only if Step 2 required changes)**

```bash
git add -A
git commit -m "fix(classless): align text/surface pairs with AA-compliant tokens

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4: Hand off to finishing-a-development-branch**

Implementation complete and `npm run verify` green. Use the `superpowers:finishing-a-development-branch` skill to choose merge/PR for `feat/classless-aggrid14` and push.

---

## Notes for the implementer

- **Token names:** `classless.css` uses tokens seen across `primitives.css`/`base.css`. Where a token might be theme-specific (`--accent-primary-hover`, `--accent-warning-bg`, `--border-focus`), the rules use `var(--token, fallback)` so they're valid in every theme. If `npm run lint:css` or a render shows an unstyled element, confirm the token exists in `tokens.css`; if not, switch to the documented equivalent (e.g. `--surface-hover`).
- **Hermetic tests:** ag-Grid is vendored (not CDN-loaded) so `npm run test:e2e` needs no network and is deterministic.
- **Why baselines churn in Task 1:** the shared nav gains one link, which appears on every example screenshot. The no-404 gate (Task 1 Step 8) proves correctness before baselines are refreshed, so regenerated PNGs are trustworthy.
- **Pre-existing primeng-modern dependency:** the full `test:e2e` suite (and `npm run verify`) includes `Fixture smoke tests` / theme screenshots that load `http://localhost:8082` from `fixtures/primeng-modern/dist/...`. That `dist/` is gitignored, so on a clean checkout it must be built first (`cd fixtures/primeng-modern && npm ci && npm run build`). This is pre-existing infra, not part of this scope — but if those specific tests fail with connection/404 errors to `:8082`, build the fixture (or scope test runs to `visual.spec.js` / `classless-aggrid.spec.js` while iterating). Our new ag-Grid fixture is vendored precisely to avoid this class of dependency.
