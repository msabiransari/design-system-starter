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
