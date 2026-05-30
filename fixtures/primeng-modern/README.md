# Fixture: Modern PrimeNG

Real Angular 17 + PrimeNG 17 application using ACME design tokens.

## Purpose

- Prove the `primeng-adapter.css` works with a real built Angular app.
- Validate theme switching at runtime.
- Provide a realistic screenshot target for Playwright visual regression.

## Build

```bash
cd fixtures/primeng-modern
npm install
npm run build
```

## Serve

```bash
npm run start   # ng serve --port 4200
# or serve the built output:
python3 -m http.server 8082 --directory dist/primeng-modern/browser
```

## ACME Integration

The Angular CLI loads ACME files in this order (see `angular.json`):

1. `../../tokens.css`
2. `../../themes/professional.css`
3. `../../base.css`
4. `../../primitives.css`
5. `primeng/resources/primeng.min.css` (library structure)
6. `../../adapters/primeng-adapter.css` (ACME overrides)
7. `src/styles.css` (app-specific)

Theme switching is done at runtime by swapping the `theme-link` stylesheet href.

## Notes

- PrimeNG 17 uses class-based CSS (`p-button`, `p-inputtext`, etc.) which the adapter targets.
- PrimeNG 21+ uses a new CSS-variable injection system and is not yet supported by the adapter.
