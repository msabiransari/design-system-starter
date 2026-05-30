# Engineering Rollout Playbook

This is the document you hand to app engineering teams. It tells them exactly what to do Monday morning.

---

## The Promise

You can make an ugly AngularJS/PrimeNG app look modern and professional **without touching a single component** in the first afternoon. Then you refactor incrementally.

---

## Before You Start

Pick **one pilot app**. Not your biggest app. Pick the one that:
- Has the most customer-facing UI (login, dashboard, tables, forms).
- Uses PrimeNG or standard HTML components (not heavily custom widgets).
- Has a single `index.html` entry point.

**Do not** pick the app with the most inline styles. You will refactor those later.

---

## Phase 1: One Afternoon (Zero Component Changes)

**Goal:** The app looks dramatically better. No TypeScript/JavaScript changes.

### Step 1: Install the package

```bash
npm install @acme/design-tokens
```

### Step 2: Load tokens in `index.html`

Find your app's `index.html` (or the root HTML file that bootstraps AngularJS/Angular). Add these **before** any other CSS:

```html
<head>
  <!-- 1. Design Tokens -->
  <link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/tokens.css" />
  <link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/themes/professional.css" id="theme-link" />

  <!-- 2. Reset (use base-scoped.css for legacy/hybrid apps) -->
  <link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/base-scoped.css" />

  <!-- 3. Motion -->
  <link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/motion.css" />

  <!-- 4. Your existing library CSS (PrimeNG, etc.) -->
  <link rel="stylesheet" href="node_modules/primeng/resources/themes/lara-light-blue/theme.css" />
  <link rel="stylesheet" href="node_modules/primeng/resources/primeng.min.css" />

  <!-- 5. ADAPTER: maps library variables to our tokens -->
  <link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/adapters/primeng-adapter.css" />

  <!-- 6. Your app's existing CSS -->
  <link rel="stylesheet" href="styles.css" />

  <!-- 7. APP SHIM: overrides your app's legacy classes (create this now) -->
  <link rel="stylesheet" href="app-shim.css" />
</head>

<!-- For base-scoped.css, wrap your app body: -->
<body class="ds-base">
  <div ng-app="myApp">
    ...your app...
  </div>
</body>
```

> **Why load order matters:** CSS cascade. The adapter must load after PrimeNG. The shim must load after everything.

### Step 3: Create `app-shim.css`

Create `app-shim.css` in your app root. Target your most common legacy classes and force them onto tokens:

```css
/* app-shim.css */
/* Target your app's most visible legacy classes */

/* Old buttons */
.btn-primary,
.legacy-btn-primary {
  background-color: var(--accent-primary) !important;
  color: var(--accent-primary-text) !important;
  border-color: var(--accent-primary) !important;
  border-radius: var(--radius-base) !important;
}

/* Old inputs */
.legacy-input,
.form-control {
  background: var(--surface-default) !important;
  border-color: var(--border-default) !important;
  color: var(--text-primary) !important;
  border-radius: var(--radius-base) !important;
}

/* Old cards / panels */
.panel,
.legacy-card {
  background: var(--surface-raised) !important;
  border: 1px solid var(--border-default) !important;
  border-radius: var(--radius-md) !important;
  box-shadow: var(--shadow-sm) !important;
}

/* Old table headers */
.legacy-table th {
  background: var(--surface-default) !important;
  color: var(--text-muted) !important;
  font-weight: var(--weight-semibold) !important;
  text-transform: uppercase !important;
  font-size: var(--text-xs) !important;
}

/* Old table rows */
.legacy-table td {
  color: var(--text-secondary) !important;
  border-bottom-color: var(--border-subtle) !important;
}

.legacy-table tr:hover td {
  background: var(--surface-hover) !important;
  color: var(--text-primary) !important;
}

/* Old nav links */
.legacy-nav a {
  color: var(--text-secondary) !important;
}
.legacy-nav a:hover {
  color: var(--text-primary) !important;
  background: var(--surface-hover) !important;
}
.legacy-nav a.active {
  color: var(--text-primary) !important;
  background: var(--surface-active) !important;
}
```

> **Use `!important` in the shim.** This is a demolition tool. It is temporary. Its job is to make old UI look themed while you refactor.

### Step 4: Run the app

```bash
ng serve  # or your dev server
```

Open the app. It should look dramatically better immediately.

**If it looks broken:**
1. Check the browser console for 404s on CSS files.
2. Check that `app-shim.css` is loaded **last**.
3. Use DevTools → Elements → Computed to see which CSS is winning.

---

## Phase 2: One Week (High-Visibility Refactor)

**Goal:** Refactor the 20 most visible components to use tokens natively. Delete matching shim rules as you go.

### Priority Order

Refactor in this order. Each one has high visual impact:

1. **Top navigation / header**
2. **Primary action buttons**
3. **Data tables** (headers, rows, hover states)
4. **Form inputs** (text, select, checkbox, radio)
5. **Cards / panels / modals**
6. **Status badges / pills**
7. **Login / auth screens**
8. **Empty states**
9. **Loading skeletons / spinners**
10. **Footer**

### How to Refactor a Component

**Before (legacy):**
```html
<!-- AngularJS -->
<button class="legacy-btn-primary" style="background: #0f1d40; color: #fff;">Save</button>
```

**After (token-native):**
```html
<!-- AngularJS -->
<button class="ds-button ds-button-primary">Save</button>
```

Or if you need to keep the old class for backward compatibility:
```css
/* In the component's CSS or a module CSS file */
.my-app-button {
  background: var(--accent-primary);
  color: var(--accent-primary-text);
  border-radius: var(--radius-base);
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}
.my-app-button:hover {
  background: var(--accent-primary-hover);
}
```

### Rule: Delete Shim Rules as You Go

Every time you refactor a component to use tokens natively, delete its corresponding rule from `app-shim.css`.

```bash
# Before refactor
app-shim.css has 50 rules

# After refactoring buttons
app-shim.css has 45 rules

# Goal: app-shim.css shrinks to 0 over time
```

---

## Phase 3: One Month (Theme Switching)

**Goal:** Users can switch between light, dark, and professional themes.

### Add Theme Switcher to Your App Shell

```typescript
// theme.service.ts (Angular) or a simple JS service (AngularJS)
class ThemeService {
  setTheme(name: string) {
    const link = document.getElementById('theme-link') as HTMLLinkElement;
    link.href = `node_modules/@acme/design-tokens/dist/themes/${name}.css`;
    localStorage.setItem('app-theme', name);
    document.documentElement.classList.toggle('dark', name === 'dark');
  }

  restore() {
    const saved = localStorage.getItem('app-theme') || 'professional';
    this.setTheme(saved);
  }
}
```

Add a dropdown to your nav:

```html
<select (change)="themeService.setTheme($event.target.value)">
  <option value="professional">Professional</option>
  <option value="light">Light</option>
  <option value="dark">Dark</option>
  <option value="healthcare">Healthcare</option>
</select>
```

**That's it.** PrimeNG buttons, your custom tables, and legacy panels all update instantly.

---

## Phase 4: Library Migration (Ongoing)

**Goal:** Your internal component libraries use tokens natively. Apps stop needing shims.

### For Library Teams

1. Add `@acme/design-tokens` as a peer dependency.
2. In each component, replace hardcoded values with token references.
3. Publish a new major/minor version.
4. Apps upgrade and delete the corresponding shim rules.

---

## Common Pitfalls

| Problem | Cause | Fix |
|---------|-------|-----|
| **Components still look ugly** | `app-shim.css` not loaded last | Move it to the bottom of `angular.json` styles array |
| **PrimeNG buttons not themed** | Adapter not loaded after PrimeNG CSS | Check load order in `index.html` |
| **Inline styles ignore tokens** | Inline `style="color: red"` has highest specificity | Refactor the component. Shim cannot override inline styles. |
| **AngularJS directives broken** | `base.css` global reset too aggressive | Use `base-scoped.css` and add `class="ds-base"` to `<body>` |
| **Some colors look wrong in dark mode** | Library uses hardcoded colors the adapter missed | Add a shim rule or open an issue for adapter expansion |

---

## Success Metrics

Track these weekly:

- **Shim rule count:** Should decrease over time.
- **Token usage:** `grep -r "var(--" src/ | wc -l` should increase.
- **Inline style count:** `grep -r 'style=' src/ | wc -l` should decrease.
- **Theme coverage:** All user-facing pages should render correctly in all themes.

---

## What Engineering Teams Need from Platform

1. **This playbook** (check — you have it now).
2. **A pilot app that proved it works** (do this first — pick one app, prove it, then replicate).
3. **A stylelint config** they can drop into their repo (check — `.stylelintrc.json` is ready).
4. **A migration script** that finds hardcoded colors in their codebase (check — `scripts/audit-contrast.js` and scanner exist).
5. **Office hours** — a weekly 30-minute session where teams ask questions.

---

## TL;DR for Busy Engineers

```bash
npm install @acme/design-tokens
```

Add to `index.html`:
```html
<link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/tokens.css" />
<link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/themes/professional.css" id="theme-link" />
<link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/base-scoped.css" />
<link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/adapters/primeng-adapter.css" />
```

Create `app-shim.css` with `!important` overrides for your worst legacy classes.

Wrap `<body class="ds-base">`.

Done. App looks better in one afternoon.
