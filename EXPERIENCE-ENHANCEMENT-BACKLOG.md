# Experience Enhancement Backlog

This backlog turns the current token package into a more powerful, more adoptable experience system. The goal is not decoration. The goal is to make the system easier to understand, easier to migrate to, and more polished in real applications.

Use this document as build instructions for future agents.

## Principles

- **Useful first.** Every enhancement must help product teams ship or migrate real apps.
- **Framework-agnostic by default.** CSS, HTML, and generated docs should work in Angular, AngularJS, React, Vue, and server-rendered apps.
- **Token-driven only.** New UI states, animation, icons, and examples must use existing tokens or add new semantic tokens through the governance process.
- **Accessible by default.** Respect reduced motion, color contrast, keyboard focus, and screen reader behavior.
- **No decorative bloat.** Avoid ornamental SVGs, 3D effects, gradient blobs, or marketing-heavy pages unless they directly explain the system.

## Priority 1: System-Aware Theme And Motion

### Goal

Respect OS-level preferences automatically:

- `prefers-color-scheme: dark`
- `prefers-reduced-motion: reduce`

### Recommended Implementation

Add `themes/auto.css`.

`auto.css` should:

- Start from the default light/professional mappings.
- Use `@media (prefers-color-scheme: dark)` to map the private theme variables to dark values.
- Follow the existing theme pattern: concrete values live in `--_*` private variables, while public tokens remain in `tokens.css`.
- Be optional. Apps should be able to load either a fixed theme or `themes/auto.css`.

Extend `motion.css` reduced-motion handling.

Reduced motion should:

- Set motion duration tokens to `0ms`.
- Disable nonessential animation and transition duration.
- Preserve focus visibility and layout stability.
- Avoid removing state changes entirely.

### Files

- `themes/auto.css`
- `motion.css`
- `README.md`
- `examples/shared/nav.js`
- `examples/components/`
- `tests/e2e/visual.spec.js`

### Acceptance Criteria

- `themes/auto.css` is exported through `package.json` build output.
- Example theme dropdown includes `auto`.
- Reduced motion does not break skeletons, toasts, modals, or existing examples.
- Playwright covers `auto` at least in one smoke test, or documents why OS preference testing is deferred.
- `npm run lint:css`, `npm run audit:contrast`, `npm run build`, and `npm run test:e2e` pass.

## Priority 2: Skeleton Loading Primitives

### Goal

Add token-driven loading states that work in every framework.

### Recommended Implementation

Add primitives such as:

- `.ds-skeleton`
- `.ds-skeleton-text`
- `.ds-skeleton-title`
- `.ds-skeleton-circle`
- `.ds-skeleton-avatar`
- `.ds-skeleton-button`
- `.ds-skeleton-card`

Use a shimmer animation based on surface tokens:

- Base: `--surface-default`
- Highlight: `--surface-hover` or a new semantic skeleton token if contrast is weak in any theme
- Radius: existing radius tokens
- Motion: existing duration/ease tokens

The shimmer must respect `prefers-reduced-motion`.

### Files

- `primitives.css`
- `motion.css`
- `examples/components/`
- `examples/pilot-app/`
- `README.md`
- `scripts/audit-contrast.js` if new color pairs are introduced

### Acceptance Criteria

- Skeletons look distinct but subtle across all 8 themes.
- Reduced motion switches shimmer to a static loading surface.
- Component reference page shows text, avatar, card, table-row, and button skeleton examples.
- Visual snapshots are updated intentionally.

## Priority 3: Design System Studio

### Goal

Create one first-class visual experience for engineers, agents, and stakeholders to understand the system.

### Recommended Page

Create:

```text
examples/studio/index.html
```

The studio should include:

- Theme switcher using the shared nav.
- Live app preview with common UI: toolbar, card, table, form, alerts, toast, modal preview.
- Primitive state matrix: default, hover, active, focus, disabled, read-only, error, loading.
- Token inspector with current computed values.
- Motion preview panel.
- Adapter preview links for AngularJS and PrimeNG fixtures.
- Legacy migration preview: before/after panel showing legacy CSS and tokenized shim.

Keep it tool-like, not marketing-like. This should feel like a platform engineering console.

### Files

- `examples/studio/`
- `examples/shared/nav.js`
- `examples/shared/examples.css`
- `tests/e2e/visual.spec.js`

### Acceptance Criteria

- Studio is linked from `examples/index.html` and shared nav.
- Studio has no hardcoded colors except demo legacy examples that are intentionally shown as legacy.
- Studio is screenshot-tested in at least the default theme and mobile viewport.
- Text does not overlap at mobile width.

## Priority 4: Interactive Token Documentation

### Goal

Make token discovery and copy-paste adoption easy.

### Recommended Implementation

Add a generated docs page:

```text
docs/tokens.html
```

Add a generator:

```text
scripts/generate-token-docs.js
```

Add package scripts:

```json
"docs:generate": "node scripts/generate-token-docs.js"
```

The generator should parse:

- `tokens.css`
- `themes/*.css`
- optional token category comments if added later

The page should show:

- Search/filter by token name.
- Category grouping.
- Current computed value.
- Copy button for `var(--token-name)`.
- Theme selector.
- Side-by-side theme comparison for key color tokens.
- Contrast ratio display for documented text/surface and badge pairs.

### Files

- `scripts/generate-token-docs.js`
- `docs/tokens.html`
- `package.json`
- `README.md`
- `tests/e2e/visual.spec.js`

### Acceptance Criteria

- `npm run docs:generate` creates deterministic output.
- Generated docs use token references for styling.
- Docs work without a framework.
- Copy buttons use minimal JS and do not require external dependencies.
- CI either runs `docs:generate` and verifies no diff, or documents docs generation as a release step.

## Priority 5: Migration Report UI

### Goal

Turn the migration skill scanner into an actionable visual report.

### Recommended Implementation

Extend:

```text
skills/acme-design-system-migration/scripts/scan_legacy_styles.py
```

Add output modes:

- `--format text`
- `--format json`
- `--format html`

The HTML report should include:

- Hardcoded colors grouped by file.
- Suggested semantic token mapping.
- Confidence level for each mapping.
- Risk level: shim, refactor, or rewrite.
- Inline style and `ngStyle` findings.
- Adapter candidates such as PrimeNG or Material class usage.
- Before/after shim examples.

### Files

- `skills/acme-design-system-migration/scripts/scan_legacy_styles.py`
- `skills/acme-design-system-migration/references/quality-gates.md`
- `skills/acme-design-system-migration/references/migration-playbooks.md`
- `docs/migration-report-example.html`
- `README.md`

### Acceptance Criteria

- Scanner can run against this repo and produce an HTML report.
- HTML report is static and self-contained.
- Findings are sorted by risk and frequency.
- Suggested mappings are conservative and never rewrite files automatically.
- The skill docs explain how agents should use the report before editing a legacy app.

## Priority 6: Toast And Notification Primitives

### Goal

Provide framework-agnostic notification layout and motion primitives.

### Recommended Implementation

Add:

- `.ds-toast-stack`
- `.ds-toast`
- `.ds-toast-success`
- `.ds-toast-warning`
- `.ds-toast-danger`
- `.ds-toast-info`
- `.ds-toast-title`
- `.ds-toast-body`
- `.ds-toast-action`
- `.ds-toast-close`
- `.ds-toast.exiting`

Support positions through modifier classes:

- `.ds-toast-stack-end`
- `.ds-toast-stack-start`
- `.ds-toast-stack-top`
- `.ds-toast-stack-bottom`

Use existing z-index token `--z-toast`.

### Files

- `primitives.css`
- `motion.css`
- `examples/components/`
- `examples/studio/` if studio exists
- `scripts/audit-contrast.js`

### Acceptance Criteria

- Toasts pass contrast checks in all themes.
- Toast motion respects reduced motion.
- Stack positioning works on mobile without covering core content awkwardly.
- Close/action controls use accessible labels in examples.

## Priority 7: CSS Icon System

### Goal

Provide lightweight, framework-agnostic icons without requiring a JS icon library.

### Recommended Approach

Prefer inline SVG symbols over CSS mask fragments if browser behavior is inconsistent.

Recommended structure:

```text
icons/
  sprite.svg
icons.css
```

Classes:

- `.ds-icon`
- `.ds-icon-xs`
- `.ds-icon-sm`
- `.ds-icon-md`
- `.ds-icon-lg`
- `.ds-icon-xl`

Initial icon set:

- `check`
- `alert`
- `info`
- `x`
- `search`
- `filter`
- `chevron-down`
- `settings`
- `user`
- `home`
- `calendar`
- `download`

All icons must inherit `currentColor`.

### Files

- `icons/sprite.svg`
- `icons.css`
- `package.json`
- `README.md`
- `examples/components/`
- `examples/studio/` if studio exists

### Acceptance Criteria

- Icons render in static HTML without a bundler.
- Icons use `currentColor`.
- Icon sizing uses `--icon-*` tokens.
- No decorative-only icons in examples unless `aria-hidden="true"` is used.
- Package build copies `icons.css` and `icons/` into `dist/`.

## Priority 8: Component State Matrix

### Goal

Expose missing states and token gaps before consuming teams find them.

### Recommended Implementation

Add a dedicated section to `examples/components/` or `examples/studio/` that shows:

- Buttons: default, hover sample, active sample, focus sample, disabled, loading.
- Inputs: default, focus, disabled, read-only, error, help text.
- Cards: default, hover, selected, disabled.
- Badges: success, warning, danger, info, neutral.
- Tables: hover, selected row, empty state, loading skeleton row.
- Toasts: success, warning, danger, info.

Use explicit classes for display states where pseudo-classes cannot be demonstrated reliably:

- `.is-hover`
- `.is-active`
- `.is-focus`
- `.is-loading`
- `.is-selected`

### Files

- `primitives.css`
- `examples/components/`
- `examples/studio/` if studio exists
- `tests/e2e/visual.spec.js`

### Acceptance Criteria

- State examples render across all themes.
- No state uses hardcoded colors.
- Disabled/read-only states use opacity/cursor tokens.
- Visual snapshots include the state matrix.

## Priority 9: Theme Gallery

### Goal

Make themes immediately understandable and visually appealing.

### Recommended Implementation

Improve `examples/index.html` with theme cards:

- One mini dashboard preview per theme.
- Theme swatches.
- Contrast status badge.
- Best-fit label: finance, healthcare, SaaS, minimal internal tools, etc.
- Link to open the example suite with that theme selected.

### Files

- `examples/index.html`
- `examples/shared/nav.js`
- `examples/shared/examples.css`

### Acceptance Criteria

- The brand/theme is clear in the first viewport.
- Cards remain compact and do not become marketing panels.
- Preview cards use real tokenized UI snippets.
- Mobile layout is readable and non-overlapping.

## Priority 10: Agent-Ready Migration Playbooks

### Goal

Make the project-local skill useful to any capable coding agent, not just one model.

### Recommended Additions

Add playbooks for:

- AngularJS 1.x.
- Angular 7 + PrimeNG 7.
- Modern Angular + PrimeNG 17.
- React.
- Vue.
- Static/server-rendered apps.

Each playbook should include:

- Detection rules.
- Files to inspect first.
- Expected load order.
- Safe shim strategy.
- Refactor strategy.
- Common breakages.
- Required verification.
- Stop conditions where the agent should ask for human input.

### Files

- `skills/acme-design-system-migration/references/migration-playbooks.md`
- `skills/acme-design-system-migration/references/shim-and-refactor-patterns.md`
- `skills/acme-design-system-migration/references/quality-gates.md`
- `AGENTS.md`

### Acceptance Criteria

- Playbooks are specific enough for a new agent to apply without broad interpretation.
- AngularJS and Angular 7 playbooks reference the fixture apps.
- Verification always includes lint, contrast audit, and relevant Playwright fixtures.

## Ideas To Defer

| Idea | Reason |
|------|--------|
| CSS Houdini / Paint API | Browser support and operational predictability are not good enough for this system. |
| Figma plugin | Valuable later, but only after design workflow requirements are known. |
| CSS-only charts | Out of scope for a token infrastructure package. Use real chart libraries and token adapters later. |
| 3D/WebGL visual system | Not useful for migration or platform adoption. |
| Heavy decorative SVG hero art | Makes the project feel like marketing instead of infrastructure. |
| Automatic codemod rewrites | Too risky before scanner confidence and pilot app results are stronger. |

## Suggested Build Order

1. `themes/auto.css` and improved reduced motion handling.
2. Skeleton primitives.
3. Toast primitives.
4. Component state matrix.
5. Design System Studio.
6. Interactive token documentation generator.
7. Migration report UI.
8. CSS icon system.
9. Theme gallery polish.
10. Expanded agent migration playbooks.

This order gives immediate application value first, then improves adoption and migration tooling.

## Required Verification For Every Enhancement

Run:

```bash
npm run lint:css
npm run audit:contrast
npm run build
cd fixtures/primeng-modern && npm run build
cd ../..
npm run test:e2e
```

Also verify:

- No Playwright network 404s.
- No hardcoded colors in source files except themes, adapters, mocks, and intentional legacy examples.
- New theme-sensitive UI appears in all 8 themes.
- Mobile viewport screenshots do not show overlapping text or controls.
- Reduced motion has a non-animated fallback.

