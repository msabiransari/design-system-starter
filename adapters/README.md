# Library Adapters

Third-party component libraries (PrimeNG, Material, etc.) ship with their own theming systems. **Adapters bridge them to our token system** without forking the library or rewriting components.

## Philosophy

- **Do not fork PrimeNG.** Maintainability dies when you fork a library.
- **Do not fight specificity wars.** Adapters use CSS variables and cascade layers, not `!important` armies.
- **One direction only.** Library styles read from our tokens. Our tokens never read from library styles.

## How Adapters Work

Each adapter is a single CSS file that runs **after** the library's theme CSS and **after** our `tokens.css` + theme:

```html
<!-- 1. Our tokens + theme -->
<link rel="stylesheet" href="tokens.css" />
<link rel="stylesheet" href="themes/professional.css" />

<!-- 2. Library theme (PrimeNG, Material, etc.) -->
<link rel="stylesheet" href="primeng-theme.css" />

<!-- 3. ADAPTER: bridges library variables to our tokens -->
<link rel="stylesheet" href="adapters/primeng-adapter.css" />
```

The adapter re-assigns the library's CSS custom properties to reference our semantic tokens. When the theme changes, the library components update automatically.

## Supported Libraries

| Library | Adapter File | Status |
|---------|-------------|--------|
| PrimeNG (modern) | `primeng-adapter.css` | Ready |
| Angular Material | `material-adapter.css` | Ready |
| Bootstrap 5 | `bootstrap-adapter.css` | Planned |

## Adding a New Adapter

1. Inspect the library's CSS custom properties (Chrome DevTools → Computed → filter by `--`).
2. Map library colors to our semantic tokens (surface, text, accent, border, shadow).
3. Create `adapters/{library}-adapter.css`.
4. Load it after the library theme.

## For Libraries Without CSS Variables (Legacy)

If a library uses hardcoded SCSS or static CSS (older PrimeNG, Bootstrap 4):

1. Create a **shim layer** that targets library classes with token values.
2. Use `@layer` to keep specificity low:

```css
@layer ds-shim {
  .p-button {
    background: var(--accent-primary) !important; /* last resort */
  }
}
```

3. Migrate away from that library version as soon as feasible.
