# Fixture: AngularJS Legacy App

Static AngularJS 1.8 application demonstrating `base-scoped.css` + legacy shim migration.

## Purpose

- Prove `base-scoped.css` safely isolates the ACME reset inside `.ds-base`.
- Demonstrate a `legacy-shim.css` overriding old hardcoded colors with tokens.
- Show theme switching in a legacy app without framework changes.

## Serve

```bash
cd fixtures/angularjs-legacy
npm install   # vendors angular.min.js locally
npm start     # npx http-server -p 8081
```

For Playwright tests, this fixture is served through the **root server** on port 8080 at `/fixtures/angularjs-legacy/index.html` so that relative paths like `../../tokens.css` resolve correctly.

## ACME Integration

Load order in `index.html`:

1. `../../tokens.css`
2. `../../themes/professional.css`
3. `../../base-scoped.css`
4. `legacy-styles.css` (old hardcoded colors)
5. `legacy-shim.css` (ACME token overrides)

The app shell is wrapped in `<body class="ds-base">` so the scoped reset applies.

## Theme Switching

The AngularJS controller includes a `setTheme()` function that swaps the theme CSS href and toggles the `.dark` class on `<html>`.

## Shim Strategy

The shim uses `!important` to defeat legacy specificity. As components are rebuilt,
shim rules can be removed incrementally.
