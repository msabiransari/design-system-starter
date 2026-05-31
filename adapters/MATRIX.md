# Adapter Compatibility Matrix

Tested library versions, browser support, and known limitations for each adapter.

---

## PrimeNG Adapter

**File:** `adapters/primeng-adapter.css`

### Tested Versions

| PrimeNG | Angular | Status | Notes |
|---------|---------|--------|-------|
| 17.x | 21.x | ✅ Validated | Real fixture at `fixtures/primeng-modern/` |
| 17.x | 17.x | ✅ Supported | Class-based CSS theming |
| 16.x | 16.x | ⚠️ Partial | May require additional shim rules |
| 7.x | 7.x | 🚧 Planned | Uses `ui-*` class names; needs separate adapter or shim |
| 15.x and below (not 7.x) | 15.x and below | ❌ Not supported | Class names differ from adapter targets |

### How It Works

The adapter overrides PrimeNG's component-specific classes (`.p-button`, `.p-inputtext`, `.p-card`, `.p-datatable`, etc.) with ACME token values. It must be loaded **after** the PrimeNG structural CSS (`primeng.min.css`).

PrimeNG 21+ uses a new CSS-variable injection system that is **not** compatible with this class-based adapter.

### Known Limitations

- Inline-styled PrimeNG components (rare) cannot be overridden.
- PrimeNG 21+ requires a different approach (not yet supported).
- PrimeNG 7.x and earlier use `ui-*` class names; use `adapters/primeng7-adapter.css` and verify with `fixtures/angular7-primeng/`.

### Browser Support

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90 | Full support |
| Firefox | 88 | Full support |
| Safari | 14 | Full support |
| Edge | 90 | Full support |
| IE11 | — | ❌ Not supported. CSS custom properties are required. |

---

## Angular Material Adapter

**File:** `adapters/material-adapter.css`

### Tested Versions

| Angular Material | Angular | MDC | Status | Notes |
|------------------|---------|-----|--------|-------|
| 17.x | 17.x | Yes | ✅ Supported | MDC-based theming (modern) |
| 16.x | 16.x | Yes | ⚠️ Partial | Minor class name differences possible |
| 15.x | 15.x | Optional | ❌ Not supported | Legacy non-MDC components |

### How It Works

The adapter overrides Angular Material's MDC CSS variables (`--mat-primary-color`, `--mat-surface-color`, etc.) and component-specific classes. It must be loaded **after** the Material theme CSS.

### Known Limitations

- Heavy use of `!important` in the shim layer for component-specific overrides.
- Custom density scales may conflict with token spacing.
- Some Material components (e.g. datepicker, stepper) have deeply nested selectors that may not be fully covered.

### Browser Support

Same as PrimeNG adapter. IE11 is not supported.

---

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

---

## Bootstrap Adapter

**File:** `adapters/bootstrap-adapter.css`

### Tested Versions

| Bootstrap | Status | Notes |
|-----------|--------|-------|
| 5.3.x | ✅ Validated | Vendored fixture at `examples/bootstrap/vendor/bootstrap-5.3.3/` |
| 5.2.x | ✅ Expected | Same `--bs-*` CSS-variable theming + component vars |
| 5.0–5.1 | ⚠️ Partial | Fewer CSS variables; some components need extra class overrides |
| 3.x / 4.x (legacy) | ❌ Different mechanism | No `--bs-*` variables — needs a class-based shim (like the ag-Grid 14 adapter) |

### How It Works

Bootstrap 5.2+ is themed largely through `--bs-*` CSS variables, so this adapter is mostly a
**variable mapping** (global `:root` vars + component-scoped vars like `--bs-btn-bg`,
`--bs-card-bg`, `--bs-table-*`). A few variants (button/alert/badge colors) bake static values at
Sass-compile time, so those get **direct class overrides**. Solid semantic colors use
`var(--text-inverted)` for their text, which flips with the theme so contrast holds in light and
dark. Must load **after** `bootstrap.min.css`. It restyles only — Bootstrap's JavaScript
(modals, dropdowns, collapse) is untouched.

### Browser Support

Same as other adapters — requires CSS custom properties and `color-mix()`. No IE11.

---

## Adding a New Adapter

1. Inspect the library's CSS custom properties (Chrome DevTools → Computed → filter by `--`).
2. Create `adapters/{library}-adapter.css`.
3. Map library variables to semantic tokens.
4. Add component-specific shim rules inside `@layer` where possible.
5. Create a fixture in `fixtures/{library}.html`.
6. Update this matrix.

---

## Browser Support Policy

This design system **requires** CSS custom properties (`var()`). Browsers that do not support them are not supported.

| Browser | Supported |
|---------|-----------|
| Chrome 90+ | ✅ |
| Firefox 88+ | ✅ |
| Safari 14+ | ✅ |
| Edge 90+ | ✅ |
| IE11 | ❌ |
| Safari 13 and below | ❌ |
| Chrome 89 and below | ❌ |

If you need to support IE11 or older Safari, this token system is not compatible. Consider a SCSS-based design system instead.
