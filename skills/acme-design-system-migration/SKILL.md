---
name: acme-design-system-migration
description: Migrate legacy, hybrid, or greenfield applications onto the ACME design token system. Use when Codex needs to assess an app's CSS/HTML/framework styling, install or wire @acme/design-tokens, choose global vs scoped base reset, apply PrimeNG/Material or other adapters, create legacy shims, refactor hardcoded styles to tokens, plan incremental migration, or add quality gates for design-system adoption across Angular, AngularJS, React, Vue, plain HTML, server-rendered, or mixed apps.
---

# ACME Design System Migration

Use this skill to move an existing app toward `@acme/design-tokens` without a big-bang rewrite. Prefer incremental adoption: load tokens, adapt third-party libraries, shim legacy classes, then refactor high-value surfaces as teams touch them.

## Core Workflow

1. **Map the app first.**
   Identify framework(s), styling formats, component libraries, build entry points, global CSS order, and whether the app is greenfield or legacy/hybrid. Run the scanner when useful:

   ```bash
   python3 skills/acme-design-system-migration/scripts/scan_legacy_styles.py /path/to/app --format html --output report.html
   ```

2. **Choose the adoption path.**
   - Greenfield or controlled shell: use `tokens.css`, theme, `base.css`, `motion.css`, optional `primitives.css`.
   - Legacy/hybrid app: use `tokens.css`, theme, `base-scoped.css`, wrap the migrated shell or root in `.ds-base`, then load app CSS and `legacy-shim.css` last.
   - PrimeNG/Material app: load the library theme, then the matching ACME adapter after tokens and theme. Check `adapters/MATRIX.md` for version support.
   - CSS-in-JS or utility CSS app: keep framework conventions, but replace concrete colors/sizes with token references at the boundary.

3. **Install or wire the package.**
   Prefer package imports if available. For repo-local pilots, copy or link the CSS files temporarily, but do not let copy-paste become the permanent adoption model.

4. **Add adapters before custom shims.**
   Use existing adapters for supported libraries. Do not edit third-party library files. Create new adapters in the same pattern only after inspecting the library's CSS custom properties or stable class hooks. Verify against `adapters/MATRIX.md`.

5. **Create a targeted legacy shim.**
   Add `legacy-shim.css` for high-traffic legacy classes. Use token values, load it last, and comment each group by legacy area. `!important` is allowed only in shims when needed to defeat legacy specificity or inline-era CSS.

6. **Refactor visible components first.**
   Start with shell, nav, buttons, cards, forms, tables, modals, alerts, and layout containers. Leave obscure screens for normal feature-work migration unless the user asks for a broad refactor.

7. **Verify.**
   Run available checks: stylelint, contrast audit, app tests, visual smoke tests, and at minimum browser screenshots across the default theme and dark theme. If visual regression baselines exist, commit them and ensure CI runs `npm run test:e2e`. If no automated visual tests exist, document residual risk.

## Guardrails

- Do not rename or delete existing ACME tokens.
- Do not put concrete values in `tokens.css`; concrete color/font/shadow values belong in themes.
- Do not edit vendor CSS or generated build output.
- Do not use hardcoded colors in new app code; use tokens.
- Do not try to solve every inline style in one pass. Report risky inline and dynamic styles separately.
- Preserve user edits and app-specific behavior. Styling migration should not change business logic.

## References

Read only what is relevant:

- [system-contract.md](references/system-contract.md): ACME package files, load order, token categories, reset choice, theme variable convention.
- [migration-playbooks.md](references/migration-playbooks.md): framework and app-type adoption playbooks, build tool integration, dynamic theme switching.
- [shim-and-refactor-patterns.md](references/shim-and-refactor-patterns.md): concrete shim/refactor examples, shadow DOM caveat, adapter authoring rules.
- [quality-gates.md](references/quality-gates.md): checks to add before declaring migration work complete, snapshot baseline requirements.
