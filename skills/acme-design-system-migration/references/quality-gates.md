# Quality Gates

## Minimum Local Checks

Run in the design token package when changing ACME files:

```bash
npm run lint:css
npm run audit:contrast
npm run build
npm run test:e2e
```

Run in the target app:

- Existing unit/integration tests.
- App build.
- Framework lint/typecheck if available.
- Browser smoke test for the migrated routes.

## Consuming App Stylelint

Add a stylelint rule to the consuming app to prevent new hardcoded colors:

```json
{
  "rules": {
    "color-no-hex": true,
    "function-disallowed-list": ["rgb", "rgba", "hsl", "hsla"]
  }
}
```

Allow hex in theme files and library mocks only via `ignoreFiles` or `ignorePatterns`.

## Visual Verification

At minimum, inspect:

- Default theme and dark theme.
- Desktop and mobile viewport.
- Buttons, forms, tables, nav, modals, alerts.
- Hover/focus/disabled/error states.

If Playwright exists, add screenshots for high-value routes and fixtures. If it does not exist, capture manual screenshots and document gaps.

### Snapshot Baselines

If the design token package (or app) uses Playwright visual regression:

1. Baseline screenshots must be committed to version control.
2. CI must run `npm run test:e2e` and fail on unexpected diffs.
3. Update baselines intentionally with `npx playwright test --update-snapshots`.
4. Review diffed snapshots in PRs before accepting changes.

## Contrast

Use ACME `audit:contrast` for token themes. For app-specific components, check actual rendered pairs when new combinations are introduced.

## Fixture Verification

When modifying adapters or shims that affect fixture apps, run the relevant Playwright tests:

```bash
npm run test:e2e
```

Specific fixtures to verify:

- **AngularJS legacy**: `tests/e2e/visual.spec.js` — `angularjs-legacy` screenshots
- **PrimeNG modern**: `tests/e2e/visual.spec.js` — `primeng-modern` screenshots
- **Angular 7 PrimeNG**: not yet runnable; verify adapter CSS against `fixtures/angular7-primeng/README.md` class names

## Migration Report Verification

If you used the migration scanner, generate the HTML report and review it before editing:

```bash
python3 skills/acme-design-system-migration/scripts/scan_legacy_styles.py /path/to/app --format html --output migration-report.html
```

Review the report for:
- Colors sorted by frequency (top candidates for shim mapping).
- Risk classification (shim vs refactor vs rewrite).
- Adapter candidates (PrimeNG, Material, Bootstrap).
- Inline style findings that need human review.

## Definition of Done

A migration task is complete when:

- Tokens/theme load in the intended order.
- Legacy-safe reset choice is documented.
- Adapters or shims are scoped and loaded after the CSS they override.
- No new hardcoded colors are introduced outside themes, fixtures, or documented mocks.
- High-risk inline styles are either refactored or listed as residual work.
- The app still builds (`ng build`, `vite build`, `npm run build`, etc.).
- Key UI surfaces are visually checked across default and dark themes.
- Relevant Playwright fixture tests pass (if adapters were modified).
- The migration scanner report was reviewed (if available).
