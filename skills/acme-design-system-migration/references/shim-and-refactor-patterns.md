# Shim and Refactor Patterns

## Legacy Shim

Create `legacy-shim.css` and load it after legacy CSS.

```css
@layer acme-legacy {
  .legacy-btn,
  .old-primary-button {
    background: var(--accent-primary) !important;
    color: var(--accent-primary-text) !important;
    border-color: var(--accent-primary) !important;
    border-radius: var(--radius-base) !important;
  }

  .legacy-card {
    background: var(--surface-raised) !important;
    color: var(--text-primary) !important;
    border: 1px solid var(--border-default) !important;
    box-shadow: var(--shadow-sm) !important;
  }
}
```

Use `!important` only in shims. Do not use it in new primitives or app components unless the user explicitly accepts the debt.

## Adapter vs Shim Boundary

- **Adapters** (`adapters/primeng-adapter.css`, `adapters/material-adapter.css`) override third-party library CSS. They should use normal specificity and target stable library classes or CSS variables.
- **Shims** (`legacy-shim.css`) override your own legacy app CSS. `!important` is acceptable here because you control both sides and the shim is temporary.

## Color Replacement

Before:

```css
.panel {
  background: #ffffff;
  color: #333333;
  border: 1px solid #e5e7eb;
}
```

After:

```css
.panel {
  background: var(--surface-raised);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}
```

Do not blindly replace every `#ffffff` with `--surface-default`. Choose based on role:

- Page background: `--surface-page`
- Card/content: `--surface-raised`
- Input/control: `--surface-default`
- Overlay/menu/dialog: `--surface-overlay`

## Form Field Pattern

Prefer an explicit wrapper for labels/help/errors:

```html
<div class="field">
  <label class="field-label" for="email">Email</label>
  <input id="email" class="ds-input" type="email">
  <p class="field-help">Use your work email.</p>
</div>
```

```css
.field {
  display: grid;
  gap: var(--space-1);
}
.field-label {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}
.field-help {
  color: var(--text-muted);
  font-size: var(--text-xs);
}
```

## Inline Styles

Static inline values should become classes.

Before:

```html
<div style="background:#fff;color:#333;padding:16px">
```

After:

```html
<div class="account-panel">
```

```css
.account-panel {
  background: var(--surface-raised);
  color: var(--text-secondary);
  padding: var(--space-4);
}
```

Dynamic inline values should be reviewed. Data-driven width, transform, or chart values may remain inline if they do not encode theme colors.

## Angular `[ngStyle]` and Dynamic Bindings

Replace static `ng-style` objects with CSS classes:

Before:
```html
<div [ngStyle]="{background: '#fff', color: '#333'}">
```

After:
```html
<div class="account-panel">
```

Keep `ng-style` only for truly dynamic values (e.g., progress-bar width, chart coordinates). Even then, prefer CSS custom properties if the value is computed in the component:

```ts
// component.ts
this.el.style.setProperty('--progress', `${percent}%`);
```
```css
.progress-bar { width: var(--progress); }
```

## Shadow DOM / Web Components

CSS custom properties are global and **do not pierce Shadow DOM**. If a web component or Angular component uses `ViewEncapsulation.ShadowDom` or `ShadowRoot`, tokens must be explicitly forwarded:

```css
:host {
  --surface-raised: var(--surface-raised);
  --text-primary: var(--text-primary);
}
```

Or declare them inside the shadow tree. Class selectors never cross shadow boundaries.

## Adapter Authoring

Adapters map library variables or stable class hooks to ACME tokens. They do not redefine ACME tokens.

```css
:root {
  --library-primary: var(--accent-primary);
  --library-surface: var(--surface-default);
}

@layer acme-library-shim {
  .library-button {
    background: var(--accent-primary);
    color: var(--accent-primary-text);
  }
}
```

Use class shims only when the library lacks CSS variables or leaves important states uncovered.

Before writing a new adapter, verify the library's class names and CSS custom properties against a real installed version. See `adapters/MATRIX.md` for version coverage.

## Refactor Priority

Refactor in this order unless the user gives a different priority:

1. App shell, header, nav, sidebar.
2. Buttons, links, focus states.
3. Cards/surfaces, modals, overlays.
4. Forms and validation states.
5. Tables, lists, pagination.
6. Alerts/toasts/status badges.
7. Low-traffic pages and edge states.

## Migration Scanner

Run the migration scanner to find hardcoded colors in an app:

```bash
python3 skills/acme-design-system-migration/scripts/scan_legacy_styles.py /path/to/app --format html --output report.html
```

This outputs an HTML report with file paths, found colors, suggested token replacements, and risk classification. Use it to build a color-to-token mapping before broad refactoring.
