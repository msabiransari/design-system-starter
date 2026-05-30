# ACME Design Token Contract

## Package

Package name: `@acme/design-tokens`

Important exports:

```text
@acme/design-tokens
@acme/design-tokens/tokens
@acme/design-tokens/base
@acme/design-tokens/base-scoped
@acme/design-tokens/motion
@acme/design-tokens/primitives
@acme/design-tokens/themes/{theme}.css
@acme/design-tokens/adapters/{adapter}.css
```

Themes: `professional`, `light`, `dark`, `healthcare`, `saas`, `minimal`, `forest`, `ocean`.

## Load Order

Greenfield app:

```html
<link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/tokens.css">
<link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/themes/professional.css" id="theme-link">
<link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/base.css">
<link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/motion.css">
<link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/primitives.css">
```

Legacy or hybrid app:

```html
<link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/tokens.css">
<link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/themes/professional.css" id="theme-link">
<link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/base-scoped.css">
<link rel="stylesheet" href="legacy-app.css">
<link rel="stylesheet" href="legacy-shim.css">
```

Wrap the adopted area:

```html
<body class="ds-base">
  ...
</body>
```

Library adapter:

```html
<!-- tokens + theme first -->
<!-- library theme / component CSS next -->
<link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/adapters/primeng-adapter.css">
<!-- app shim last -->
```

Adapters must be loaded **after** the library CSS they override.

## Token Groups

These are the public semantic tokens defined in `tokens.css`. Concrete values are provided by theme files via private `--__*` variables.

- **Surface**: `surface-page`, `surface-default`, `surface-hover`, `surface-active`, `surface-raised`, `surface-overlay`
- **Text**: `text-primary`, `text-secondary`, `text-muted`, `text-link`, `text-success`, `text-warning`, `text-danger`
- **Border**: `border-default`, `border-subtle`, `border-focus`
- **Accent**: `accent-primary` (plus hover, active, text), `accent-secondary` (plus text), `accent-danger` (plus hover, text), `accent-success` (plus bg, text), `accent-warning` (plus bg, text), `accent-info` (plus bg, text)
- **Focus**: `focus-ring`
- **Disabled / Read-only**: `opacity-disabled`, `opacity-readonly`, `cursor-disabled`
- **Z-index**: `z-dropdown`, `z-sticky`, `z-fixed`, `z-modal-backdrop`, `z-modal`, `z-popover`, `z-tooltip`, `z-toast`, `z-max`
- **Breakpoints**: `breakpoint-sm` through `breakpoint-2xl` — **reference values only**. CSS custom properties cannot be used inside native `@media` queries; use them from JS, preprocessor config, or copy the numeric value.
- **Icon sizes**: `icon-xs` through `icon-xl`
- **Field heights**: `field-height-sm`, `field-height-base`, `field-height-lg`
- **Layout**: `container-sm` through `container-2xl`, `sidebar-width`, `header-height`
- **Elevation**: `shadow-xs` through `shadow-2xl`
- **Radius**: `radius-none` through `radius-full`
- **Spacing**: `space-0` through `space-24`, plus semantic `gap-xs` through `gap-xl`
- **Typography**: `font-sans`, `font-serif`, `font-mono`, `text-xs` through `text-4xl`, `weight-normal` through `weight-bold`, `leading-tight` through `leading-relaxed`, `tracking-tight` through `tracking-wide`
- **Motion**: `duration-instant` through `duration-slower`, `ease-linear` through `ease-in-out`, `stagger-base` through `stagger-lg`

## Theme Variable Convention

Themes define concrete values using **private** `--__*` variables. Example from `themes/professional.css`:

```css
:root {
  --__surface-page: #f8f9fa;
  --__text-primary: #111827;
  --__accent-primary: #2563eb;
  ...
}
```

`tokens.css` maps public tokens to these private variables:

```css
:root {
  --surface-page: var(--__surface-page);
  --text-primary: var(--__text-primary);
  ...
}
```

Do not reference `--__*` variables directly in app code. They are private and may change.

## Reset Choice

Use `base.css` when the app can accept a global reset.

Use `base-scoped.css` when legacy CSS, vendor CSS, AngularJS, Angular hybrid apps, or server-rendered pages may break under a global `*` reset. Wrap the migrated shell in `.ds-base`.
