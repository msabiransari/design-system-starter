# Migration Playbooks

## Assessment

Before choosing a playbook, inspect the target app:

- CSS entry points and final load order.
- Frameworks: AngularJS, Angular, React, Vue, server-rendered templates, plain HTML.
- Styling formats: CSS, SCSS/Sass, Less, CSS modules, styled-components, Emotion, inline styles, `[ngStyle]`, `:style`, `style={...}`.
- Libraries: PrimeNG, Angular Material, Bootstrap, Tailwind, custom component libraries.
- Hardcoded color inventory and top repeated values.
- High-traffic UI: shell, nav, forms, buttons, cards, tables, modals, alerts.
- Dynamic theming needs: does the app support theme switching?

Run the scanner:

```bash
python3 skills/acme-design-system-migration/scripts/scan_legacy_styles.py /path/to/app --format html --output report.html
```

---

## Playbook Structure

Every playbook below follows the same sections:

1. **Detection** — how to recognize this app type.
2. **Files to inspect first** — entry points and config that reveal load order.
3. **Load order** — where ACME files fit.
4. **Shim strategy** — lowest-risk adoption path.
5. **Refactor strategy** — how to move from shim to primitives.
6. **Common breakages** — what typically goes wrong.
7. **Verification** — checks before declaring done.
8. **Stop conditions** — when to ask a human.

---

## Playbook: AngularJS 1.x

### Detection

- `angular.js` or `angular.min.js` in vendor/scripts.
- `ng-app` attribute on `<html>` or `<body>`.
- Templates use `ng-class`, `ng-style`, `ng-repeat`, `ng-if`.
- Component style: `.directive('name', { template: '...', link: ... })` or `.component()`.
- Build tool: often Grunt/Gulp, sometimes no bundler (script tags only).

### Files to Inspect First

| File | Why |
|------|-----|
| `index.html` | Script load order, `<link rel="stylesheet">` order, `ng-app` root. |
| `app.js` or `main.js` | Module definitions, route config, dependency injection. |
| Any `*.css` in `app/` or `assets/` | Legacy styles to shim. |
| `package.json` / `bower.json` | AngularJS version, build pipeline. |

### Load Order

```
1. tokens.css
2. themes/{name}.css
3. base-scoped.css          ← scoped reset; AngularJS templates may depend on old defaults
4. [legacy app CSS]
5. legacy-shim.css          ← loaded last, overrides hardcoded legacy colors
```

Wrap the migrated shell or app root in `.ds-base` if using `base-scoped.css`:

```html
<body ng-app="myApp" class="ds-base">
```

### Shim Strategy

1. Copy `tokens.css`, `themes/professional.css`, and `base-scoped.css` into the app's asset directory.
2. Load them in `index.html` **before** legacy CSS.
3. Create `legacy-shim.css`. Target the app's most visible legacy classes first (nav, buttons, cards, tables).
4. Use `!important` in shims only when legacy specificity is high.
5. Do NOT rewrite AngularJS directives. Only change CSS.

Example shim:

```css
@layer acme-legacy {
  .navbar-inverse {
    background: var(--accent-primary) !important;
    border-color: var(--accent-primary-hover) !important;
  }
  .btn-primary {
    background: var(--accent-primary) !important;
    color: var(--accent-primary-text) !important;
    border-color: var(--accent-primary) !important;
  }
}
```

### Refactor Strategy

- Replace static `ng-style` objects with CSS classes that reference tokens.
- Keep dynamic `ng-style` only for data-driven values (progress bars, chart coordinates).
- Refactor shell/nav first, then buttons/forms, then tables, then edge pages.
- Leave AngularJS directive logic untouched.

### Common Breakages

- **Layout shift** from scoped reset: `base-scoped.css` scopes reset to `.ds-base`. If the app relies on global resets (e.g. `* { margin: 0 }`), elements outside `.ds-base` may look different. Fix: move `.ds-base` higher or add targeted resets.
- **Bootstrap conflict**: many AngularJS apps use Bootstrap. Bootstrap classes like `.btn`, `.panel`, `.navbar` have hardcoded colors. Shim them or let Bootstrap load before the theme and override with higher specificity.
- **Inline styles from `ng-style`**: static color values in `ng-style` bypass CSS. Replace with token-driven classes.

### Verification

- App still boots without JS errors.
- Shell, nav, buttons, and tables render correctly in default and dark themes.
- Run `npm run lint:css` or equivalent in the design token package after modifying adapters/shims.
- Run `npm run audit:contrast` if the app introduces new color combinations.
- Visual check: open the app in browser, toggle themes if a theme switcher exists.

### Stop Conditions — Ask a Human

- The app uses a custom AngularJS build pipeline you do not understand.
- You find `ng-style` with dynamic color values that appear business-critical (e.g. status colors from API).
- The app mixes AngularJS and Angular (hybrid app). See the AngularJS + Angular Hybrid section below.
- You need to support IE11. This design system requires CSS custom properties.

### Reference Fixture

See `fixtures/angularjs-legacy/` for a working AngularJS 1.8 app with:
- `base-scoped.css` + `.ds-base` wrapper
- `legacy-shim.css` overriding hardcoded colors
- Theme switching via nav.js

---

## Playbook: Angular 7 + PrimeNG 7

### Detection

- `package.json` with `@angular/core` ~7.x and `primeng` ~7.x.
- `angular.json` with `@angular-devkit/build-angular` ~0.13.
- PrimeNG 7 uses `ui-*` class names (`ui-button`, `ui-inputtext`, `ui-card`, `ui-table`).
- Node requirement: 10.9–12.x.

### Files to Inspect First

| File | Why |
|------|-----|
| `angular.json` | Styles array load order. |
| `src/styles.css` or `src/styles.scss` | Global CSS entry point. |
| `src/index.html` | Any hardcoded `<style>` blocks. |
| `src/app/app.component.html` | PrimeNG component usage patterns. |

### Load Order

```
1. tokens.css
2. themes/{name}.css
3. base-scoped.css
4. primeng/resources/themes/{theme}/theme.css   ← PrimeNG 7 theme
5. primeng/resources/primeng.min.css
6. [app-specific CSS]
7. primeng7-adapter.css   ← may need a custom adapter for ui-* classes
8. legacy-shim.css
```

### Shim Strategy

1. Add tokens + theme + `base-scoped.css` to `angular.json` `styles` array.
2. Verify the app still builds (`ng build`). PrimeNG 7 themes are large; build time may increase slightly.
3. Create a `primeng7-adapter.css` that targets `ui-*` classes with ACME tokens. The existing `adapters/primeng-adapter.css` targets `.p-*` classes (PrimeNG 14+), so it will NOT work for PrimeNG 7.
4. Start with buttons, inputs, and cards. Tables and dialogs are more complex — shim later.

Example PrimeNG 7 adapter rule:

```css
@layer acme-primeng7 {
  .ui-button {
    background: var(--accent-primary);
    color: var(--accent-primary-text);
    border-color: var(--accent-primary);
  }
  .ui-inputtext {
    background: var(--surface-default);
    color: var(--text-primary);
    border-color: var(--border-default);
  }
}
```

### Refactor Strategy

- Replace hardcoded component styles with token references.
- Use Angular component `styleUrls` with token vars for new or refactored components.
- Do not change component TypeScript logic unless required for theming (e.g. dynamic theme class toggling).
- CSS variables cross Angular emulated view encapsulation boundaries, but class selectors do not. Use `:host` styles for component-local token overrides.

### Common Breakages

- **PrimeNG 7 theme conflicts**: PrimeNG 7 themes are pre-built and heavily styled. The adapter may need many rules to override defaults.
- **Font size cascade**: `base-scoped.css` may change font sizing. Verify forms and tables do not break.
- **Build budget**: Angular 7 default bundle budget is 2MB. Adding token CSS is negligible, but if you add all 8 themes, tree-shake unused ones.

### Verification

- `ng build` succeeds without budget errors.
- `ng test` or existing unit tests pass.
- Buttons, inputs, cards, and tables render correctly.
- Theme switch works if implemented.
- Run design-token package checks: `lint:css`, `audit:contrast`.

### Stop Conditions — Ask a Human

- The app uses PrimeNG 7 components not covered by your adapter rules (e.g. `p-tree`, `p-schedule`).
- The app has custom PrimeNG theme files that were hand-edited.
- You need to run this in CI but Node 12 is not available in the current pipeline.
- Build budget is exceeded and cannot be raised.

### Reference Fixture

See `fixtures/angular7-primeng/` for the planned fixture skeleton. It is not yet a runnable app, but it documents the expected structure and PrimeNG 7 class names.

---

## Playbook: Modern Angular (17+) + PrimeNG 17

### Detection

- `package.json` with `@angular/core` ^17.x and `primeng` ^17.x.
- `angular.json` uses `@angular-devkit/build-angular:application` builder.
- PrimeNG 17 uses `.p-*` class names (`p-button`, `p-inputtext`, `p-card`, `p-table`).
- Standalone components (`@Component({ standalone: true })`) are common.

### Files to Inspect First

| File | Why |
|------|-----|
| `angular.json` | Styles array, builder config, output path. |
| `src/app/app.config.ts` or `main.ts` | Providers, PrimeNG config. |
| `src/styles.css` | Global CSS entry point. |
| `src/app/app.component.ts` | PrimeNG imports, component tree. |

### Load Order

```
1. tokens.css
2. themes/{name}.css
3. base.css   ← modern Angular apps can use global base
4. primeng/resources/primeng.min.css
5. adapters/primeng-adapter.css
6. [app-specific CSS]
7. legacy-shim.css   ← only if migrating legacy components
```

### Shim Strategy

1. Add tokens + theme + `base.css` to `angular.json` `styles` array.
2. Add `adapters/primeng-adapter.css` after `primeng.min.css`.
3. Verify `ng build` is clean. The adapter is ~10KB; it should not affect the budget.
4. If the app has legacy custom components with hardcoded colors, create a narrow `legacy-shim.css`.

### Refactor Strategy

- Use `base.css` for global reset if the app is greenfield or fully controlled.
- Use `base-scoped.css` + `.ds-base` if the app has legacy CSS that depends on old reset behavior.
- Refactor app components to use token references in `styleUrls` or global styles.
- For dynamic theming, inject a theme switcher service that swaps the theme CSS link and toggles `.dark` class.

### Common Breakages

- **PrimeNG 21+ incompatibility**: PrimeNG 21+ uses a new CSS-variable injection system that is NOT compatible with the class-based adapter. If the app uses PrimeNG 21+, stop and ask a human. See `adapters/MATRIX.md`.
- **Shadow DOM**: if any component uses `encapsulation: ViewEncapsulation.ShadowDom`, tokens must be forwarded via `:host` styles.
- **Budget warning**: Angular 17 default initial budget is 500KB. Adding PrimeNG + tokens may push the bundle over. Raise the budget in `angular.json` if needed (see `fixtures/primeng-modern/angular.json`).

### Verification

- `ng build` succeeds.
- Unit tests pass.
- All PrimeNG components covered by the adapter render correctly.
- Theme switch works in default and dark modes.
- Run `npm run test:e2e` in the design-token package if you modified adapters.
- Run `npm run lint:css` and `npm run audit:contrast`.

### Stop Conditions — Ask a Human

- PrimeNG version is 21+ (unsupported by current adapter).
- The app uses custom PrimeNG themes from a design system not covered by the adapter.
- You need to add a new adapter for a library not listed in `adapters/MATRIX.md`.

### Reference Fixture

See `fixtures/primeng-modern/` for a working Angular 17.3 + PrimeNG 17.18 app with:
- `angular.json` loading tokens → theme → base → primeng → adapter
- Real `p-button`, `p-card`, `p-table`, `p-inputtext` components
- Theme switching at runtime

---

## Playbook: React

### Detection

- `package.json` with `react` and `react-dom`.
- Styling patterns: plain CSS imports, CSS Modules, styled-components, Emotion, Tailwind, inline styles.
- Build tool: Vite, Webpack, CRA, Next.js, Remix.

### Files to Inspect First

| File | Why |
|------|-----|
| `src/index.js` or `src/main.jsx` | CSS import order. |
| `src/App.css` or `src/App.module.css` | Global styles to audit. |
| `src/components/` | Component-level styles and inline patterns. |
| Build config (vite.config.js, webpack.config.js, etc.) | CSS handling rules. |

### Load Order

```
1. tokens.css
2. themes/{name}.css
3. base.css   ← or base-scoped.css if mixing with legacy CSS
4. [app CSS / CSS Modules]
5. legacy-shim.css   ← if needed
```

For Vite/Webpack/CRA, import in the entry file:

```js
import '@acme/design-tokens/dist/tokens.css';
import '@acme/design-tokens/dist/themes/professional.css';
import '@acme/design-tokens/dist/base.css';
```

### Shim Strategy

- **Plain CSS / CSS Modules**: replace concrete values with `var(--token)`.
- **Styled-components / Emotion**: use token strings:
  ```js
  const Button = styled.button`
    background: var(--accent-primary);
    color: var(--accent-primary-text);
  `;
  ```
- **Tailwind**: map Tailwind config colors to ACME tokens (see Tailwind section below).
- **Inline styles**: replace static inline styles with classes. Keep dynamic styles only for data-driven values.

Do NOT rewrite component architecture. Keep existing component boundaries.

### Refactor Strategy

1. Start with the app shell and global styles.
2. Replace theme-aware components (buttons, inputs, cards) with token references.
3. Leave business logic components untouched.
4. Add a stylelint rule to prevent new hardcoded colors.

### Common Breakages

- **CSS-in-JS hydration mismatch**: if using SSR (Next.js/Remix), ensure tokens.css is imported in the server entry or global CSS layer.
- **CSS Modules scoping**: token variables are global, so they work inside CSS Modules. But if you override a token locally, it affects the whole page.
- **Tailwind arbitrary values**: `bg-[var(--surface-raised)]` works but may not be allowed by local conventions.

### Verification

- App builds and starts without CSS errors.
- Visual check across default and dark themes.
- Add stylelint with `color-no-hex` to prevent regressions.
- Run design-token package checks: `lint:css`, `audit:contrast`.

### Stop Conditions — Ask a Human

- The app uses a complex theming system (e.g. CSS-in-JS with runtime theme objects) that conflicts with CSS custom properties.
- The app supports runtime theme changes via a JavaScript theme provider (e.g. ThemeProvider from styled-components). You may need to bridge the two systems.

---

## Playbook: Vue

### Detection

- `package.json` with `vue`.
- Single File Components (`.vue` files) with `<template>`, `<script>`, `<style scoped>`.
- Vue 2 or Vue 3.

### Files to Inspect First

| File | Why |
|------|-----|
| `src/main.js` or `src/main.ts` | CSS import order, app mount point. |
| `src/App.vue` | Global styles and app shell. |
| `src/components/*.vue` | Component-level style patterns. |
| `vite.config.js` or `vue.config.js` | Build config, CSS handling. |

### Load Order

```
1. tokens.css
2. themes/{name}.css
3. base.css   ← or base-scoped.css
4. [app global styles]
5. legacy-shim.css
```

Import in `main.js`:

```js
import '@acme/design-tokens/dist/tokens.css';
import '@acme/design-tokens/dist/themes/professional.css';
import '@acme/design-tokens/dist/base.css';
```

### Shim Strategy

- Use tokens in `<style scoped>` blocks directly:
  ```vue
  <style scoped>
  .panel {
    background: var(--surface-raised);
    color: var(--text-primary);
  }
  </style>
  ```
- Replace `:style` static bindings with classes:
  ```vue
  <!-- Before -->
  <div :style="{ background: '#fff', color: '#333' }">
  <!-- After -->
  <div class="panel">
  ```
- Keep `:style` only for truly dynamic values (progress bars, animations).

### Refactor Strategy

1. Replace global hardcoded colors in `App.vue` and global CSS.
2. Refactor high-traffic components (nav, buttons, forms, cards).
3. Leave low-traffic pages for normal feature work.

### Common Breakages

- **Scoped style specificity**: `scoped` styles in Vue append a data attribute. Token variables are global and unaffected, but if you override a variable inside a scoped block, it only affects that component's subtree.
- **Vue 2 vs Vue 3 CSS handling**: Vue 3 with Vite handles CSS imports more predictably. Vue 2 with Webpack may require `css-loader` config for global CSS variables.

### Verification

- `npm run build` or `vite build` succeeds.
- App renders correctly in default and dark themes.
- No console CSS errors.
- Run design-token package checks: `lint:css`, `audit:contrast`.

### Stop Conditions — Ask a Human

- The app uses a Vue UI library (Vuetify, Element Plus, Quasar) that has its own theming system. You may need to write an adapter similar to the PrimeNG/Material adapters.

---

## Playbook: Static / Server-Rendered Apps

### Detection

- No JavaScript framework. Plain HTML, Jinja, Django templates, Blade, ERB, PHP, etc.
- CSS loaded via `<link>` tags or inline `<style>` blocks.
- May use a CSS preprocessor (SCSS, Less) at build time.

### Files to Inspect First

| File | Why |
|------|-----|
| Base layout/template (e.g. `base.html`, `layout.erb`, `app.blade.php`) | CSS link order, body class structure. |
| Global CSS file | Hardcoded colors and reset behavior. |
| Component/partials CSS | Scoped or modular styles. |

### Load Order

```
1. tokens.css
2. themes/{name}.css
3. base.css   ← or base-scoped.css + .ds-base wrapper
4. [app CSS]
5. legacy-shim.css
```

For scoped adoption, add `.ds-base` to the body or main container:

```html
<body class="ds-base">
  <!-- app content -->
</body>
```

### Shim Strategy

1. Copy or link token CSS files into the app's static asset directory.
2. Add `<link>` tags in the base layout BEFORE app CSS.
3. Create `legacy-shim.css` for hardcoded legacy classes.
4. If the app uses inline styles in templates, replace them with classes over time.

### Refactor Strategy

- Refactor base layout and shared partials first.
- Use token variables in the CSS preprocessor if available:
  ```scss
  .panel {
    background: var(--surface-raised);
    padding: var(--space-4);
  }
  ```
- Do NOT try to import tokens as SCSS variables. The CSS custom property layer is the contract.

### Common Breakages

- **Template cache**: server-rendered apps may cache compiled templates. Clear the cache after CSS changes.
- **Inline styles in templates**: hardcoded `style="color: #333"` in HTML templates bypasses CSS. Search for `style=` in template files.
- **Multiple CSS files**: if the app loads many small CSS files, ensure tokens load before all of them.

### Verification

- App renders without broken layouts.
- Visual check across default and dark themes.
- Run design-token package checks: `lint:css`, `audit:contrast`.
- If using a CSS preprocessor, verify the build pipeline still compiles.

### Stop Conditions — Ask a Human

- The app uses a CMS or framework that generates CSS dynamically (e.g. WordPress with a page builder).
- The app has users who can inject custom CSS (e.g. admin theming panel).

---

## Cross-Cutting: Tailwind or Utility CSS

Do not fight Tailwind. Map Tailwind config colors to ACME tokens where possible:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        surface: {
          page: 'var(--surface-page)',
          raised: 'var(--surface-raised)',
        },
        accent: {
          primary: 'var(--accent-primary)',
        },
      },
    },
  },
};
```

Use arbitrary values like `bg-[var(--surface-raised)]` only if local conventions allow it.

---

## Cross-Cutting: Build Tool Integration

For Vite, Webpack, or similar, import the CSS in your entry file:

```js
import '@acme/design-tokens/dist/tokens.css';
import '@acme/design-tokens/dist/themes/professional.css';
import '@acme/design-tokens/dist/base.css';
```

If your build pipeline inlines or hashes CSS, ensure the theme file can be swapped at runtime for dark-mode or theme-switching features.

---

## Cross-Cutting: SCSS / Less Preprocessors

Tokens are plain CSS custom properties. Reference them directly in SCSS/Less:

```scss
.panel {
  background: var(--surface-raised);
  padding: var(--space-4);
}
```

Do not try to import tokens as SCSS variables. The CSS custom property layer is the contract.

---

## Cross-Cutting: Dynamic Theme Switching

If the app needs runtime theme changes, swap the theme CSS file and toggle a dark-mode class:

```js
function setTheme(name) {
  const link = document.getElementById('theme-link');
  if (link) {
    const base = link.href.replace(/themes\/.*\.css/, 'themes/');
    link.href = base + name + '.css';
  }
  if (name === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
```

For `auto`, use `themes/auto.css` and do not toggle `.dark`.

---

## Cross-Cutting: AngularJS + Angular Hybrid

Load ACME CSS in the host `index.html` before either framework boots. Both frameworks read the same CSS variables because they are global. Use `base-scoped.css` if legacy AngularJS templates depend on old reset behavior.

Target patterns:

- AngularJS `ng-style`: keep only when dynamic; replace static color values with CSS classes or token vars.
- Angular component styles: replace hardcoded values with tokens inside component styles.
- Encapsulation: CSS variables cross Angular view encapsulation boundaries; class selectors do not.
