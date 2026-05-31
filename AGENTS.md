# Design System — Agent Operating Instructions

This file is for AI coding agents (Copilot, Kimi, Claude, etc.). It contains explicit instructions for modifying this design system.

## Project Structure

```
design-system-starter/
├── tokens.css              # Semantic token contract. NEVER edit values here.
├── base.css                # CSS reset + global typography. Edit with caution.
├── motion.css              # Animations + keyframes. Safe to extend.
├── primitives.css          # Component classes (.ds-button, .ds-card, etc.)
├── README.md               # Human-facing overview
├── PLATFORM-GUIDE.md       # Human-facing integration guide
├── FUNCTIONAL-PRIMITIVES-MILESTONE.md # Agent brief for app-level primitives
├── AGENTS.md               # This file
├── themes/
│   ├── light.css           # Light theme (concrete values for tokens)
│   ├── dark.css            # Dark theme (scoped to .dark or [data-theme="dark"])
│   ├── professional.css    # Financial/enterprise theme
│   ├── healthcare.css      # Medical/calm theme
│   ├── saas.css            # Modern indigo theme
│   ├── minimal.css         # Brutalist black+white theme
│   ├── forest.css          # Earthy organic theme
│   └── ocean.css           # Fresh cyan theme
├── adapters/
│   ├── primeng-adapter.css # Maps PrimeNG variables → tokens
│   ├── material-adapter.css# Maps Angular Material variables → tokens
│   └── README.md           # Adapter authoring guide
├── skills/
│   └── acme-design-system-migration/
│       ├── SKILL.md        # Cross-agent legacy migration workflow
│       ├── references/     # Adoption playbooks and quality gates
│       └── scripts/        # Legacy style scanner
└── examples/
    ├── index.html          # Suite overview
    ├── guide/
    │   └── index.html      # Documentation viewer (has TOC + all docs)
    ├── dashboard/
    │   └── index.html      # Financial dashboard demo
    ├── crm/
    │   └── index.html      # CRM contacts + pipeline demo
    ├── marketing/
    │   └── index.html      # Landing page demo
    ├── data/
    │   └── index.html      # Data tables + filters demo
    ├── auth/
    │   └── index.html      # Login/register demo
    ├── components/
    │   └── index.html      # Complete primitive reference
    └── shared/
        ├── nav.js          # Injects nav + theme switcher. Has localStorage persistence.
        └── examples.css    # Layout helpers for demo pages
```

## Core Rules

1. **Tokens are the contract.** `tokens.css` declares semantic variables (`--surface-default`, `--text-primary`). It never contains concrete values.
2. **Themes hold the values.** All hex codes, font stacks, and shadow definitions live in `themes/*.css` using the `--_` prefixed private variables.
3. **Never use hardcoded values in examples or primitives.** Always reference tokens.
4. **Backward compatibility.** Never rename or delete existing token variables. Only add new ones.
5. **Adapters are bridges, not replacements.** Adapters map library variables to tokens. They do not redefine token semantics.

## Common Tasks — Decision Trees

### Task: Migrate a legacy app to this design system

1. **Use the project-local skill** at `skills/acme-design-system-migration/SKILL.md`.
2. **Run the scanner** against the target app:
   ```bash
   python3 skills/acme-design-system-migration/scripts/scan_legacy_styles.py /path/to/legacy-app --format html --output report.html
   ```
3. **Read the relevant playbook** in `skills/acme-design-system-migration/references/migration-playbooks.md`:
   - AngularJS 1.x
   - Angular 7 + PrimeNG 7
   - Modern Angular (17+) + PrimeNG 17
   - React
   - Vue
   - Static / Server-rendered
4. **Choose global vs scoped base**:
   - Use `base.css` for greenfield apps.
   - Use `base-scoped.css` and `.ds-base` for legacy or hybrid apps.
5. **Load adapters before shims**. Do not edit third-party library files.
6. **Create targeted shims**, then refactor visible components incrementally.
7. **Stop and ask a human** if you hit any stop condition listed in the playbook (e.g. IE11 support, PrimeNG 21+, dynamic theming provider conflicts, CMS-generated CSS).
8. **Verify** with app builds, style linting, contrast checks, browser screenshots, and relevant Playwright fixtures.

### Task: Add functional application primitives

1. **Read** `FUNCTIONAL-PRIMITIVES-MILESTONE.md` before editing.
2. **Prioritize Phase 1** unless the user explicitly asks for broader scope:
   - Form Field Wrapper
   - Switch / Toggle
   - Tabs
   - Accordion / Details
3. **Prefer native HTML behavior**, then CSS styling/motion, then small app/framework-owned JavaScript only when required for accessibility.
4. **Do not add decorative effects** such as ripples, parallax, particles, 3D/WebGL, gradient blobs, or page transitions.
5. **Document behavior contracts** for primitives that require JavaScript, especially tabs, custom dropdowns, menus, and modals.
6. **Verify** with `npm run lint:css`, `npm run audit:contrast`, `npm run build`, and `npm run test:e2e`.

### Task: Add a new theme

1. **Copy** the most similar existing theme (e.g. `themes/professional.css` → `themes/mybrand.css`).
2. **Edit ONLY the `--_*` variables** inside `:root`.
3. **Do NOT edit** `tokens.css`. The new theme works automatically because tokens reference `--_*` variables.
4. **Update** `examples/shared/nav.js` to include the new theme in the `themes` array so it appears in the dropdown.
5. **Update** `examples/index.html` theme preview swatches if you want it visible there.
6. **Verify** by opening `examples/index.html` and selecting the new theme from the dropdown.

### Task: Add a new token

1. **Add the semantic variable** to `tokens.css`:
   ```css
   --new-token: var(--_new-token);
   ```
2. **Add the concrete value** to ALL theme files:
   ```css
   --_new-token: #somevalue;
   ```
3. If the token is color-based and you cannot determine a reasonable default for every theme, **ask the user** before proceeding.
4. **Document** the new token in `README.md` under the Token Categories section.

### Task: Integrate with a new third-party library

1. **Inspect** the library's CSS custom properties (Chrome DevTools → Computed → filter by `--`).
2. **Create** `adapters/{library}-adapter.css`.
3. **Follow the pattern** in `adapters/primeng-adapter.css`:
   - Map library color/surface/text variables to semantic tokens.
   - Add component-specific shim rules inside `@layer` if needed.
4. **Update** `adapters/README.md` with the new adapter.
5. **Do NOT** edit the third-party library files.

### Task: Modify primitives

1. **Edit** `primitives.css`.
2. **Only use token references.** No hex codes, no px values for colors.
3. **Use existing token values** for sizing (radius, spacing, typography) where possible.
4. **Verify** changes across all example pages, especially `examples/components/`.

### Task: Use or extend the classless layer

1. **Use it:** import `classless.css` after `base.css`. It themes all bare HTML via tokens
   inside `@layer ds.classless` (lowest layer), so app styles override it with no `!important`.
2. **Add an element:** add a token-only rule inside the `@layer ds.classless { }` block in
   `classless.css`. No hex/rgb/hsl literals (strict stylelint at repo root).
3. **Verify:** `npm run lint:css` and the `examples/aggrid/` fixture.

### Task: Add a class-based library shim (ag-Grid 14 pattern)

1. Use this when a library has **no CSS variables** (old ag-Grid, legacy widgets). For
   libraries that expose `--vars`, follow the CSS-variable adapter pattern instead
   (`adapters/primeng-adapter.css`).
2. Inspect the library's compiled theme CSS to find its real theme class and internal
   selectors (e.g. ag-Grid 14 uses `.ag-fresh .ag-header`, not `.ag-theme-*`).
3. Create `adapters/{library}-{version}-adapter.css`; override those selectors with
   `var(--token)` values. `!important` is allowed in adapters/shims.
4. Load the adapter **after** the library's own CSS. Update `adapters/MATRIX.md`.

### Task: Update example pages

1. Example pages are each in their own folder, e.g. `examples/components/index.html`, `examples/guide/index.html`.
2. **Always use the shared nav and styles:**
   ```html
   <link rel="stylesheet" href="./shared/examples.css" />
   <script src="./shared/nav.js" defer></script>
   ```
3. **Load order** in example `<head>`:
   ```
   ../tokens.css
   ../themes/{default}.css (id="theme-link")
   ../base.css
   ../motion.css
   ../primitives.css
   ./shared/examples.css
   ./shared/nav.js (defer)
   ```
4. **Do NOT** add hardcoded styles in example pages. Use inline `style="..."` only for demo layout helpers that reference tokens.

## What NOT To Do

- **Do NOT** delete or rename existing CSS custom properties in `tokens.css`.
- **Do NOT** put concrete values in `tokens.css`.
- **Do NOT** use `!important` in `primitives.css` or `base.css`.
- **Do NOT** edit `.claude/`, `.codex/`, or `.git/` directories.
- **Do NOT** commit changes without verifying in the example suite.
- **Do NOT** create new example pages without adding them to `nav.js`.

## Testing Checklist

Before declaring a change complete:

- [ ] Open `examples/index.html` in a browser.
- [ ] Switch between ALL themes using the nav dropdown.
- [ ] Verify no visual regressions (broken colors, missing borders, invisible text).
- [ ] Check `examples/components/` — all primitives should render correctly.
- [ ] Check `examples/guide/` — documentation should remain readable.
- [ ] If you added a theme, verify it in light and dark contexts.
- [ ] If you added an adapter, verify it with the target library's components.

## How to Serve Locally

```bash
cd /Users/msabir/development/projects/design-system-starter
npm run serve
# Open http://localhost:8080/examples/
```

## File Loading Order (For Apps Consuming This System)

```
1. tokens.css              ← semantic variables
2. themes/{name}.css       ← concrete values (swappable at runtime)
3. base.css                ← reset + global typography
4. motion.css              ← animations (optional)
5. primitives.css          ← utility classes (optional)
6. [library theme].css     ← PrimeNG / Material / etc.
7. adapters/{lib}.css      ← bridges library → tokens
8. [app-specific CSS]      ← app components
9. legacy-shim.css         ← old component overrides (temporary)
```

## Contact / Context

This design system was built for a platform team supporting AngularJS + Angular 7 hybrid apps with scattered CSS. The architecture favors app-level shims over library rewrites for legacy code. New components should reference tokens natively.
