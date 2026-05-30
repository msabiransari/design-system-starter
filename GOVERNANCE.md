# Token Governance

Rules for adding, deprecating, naming, and releasing tokens. Every contributor must follow these.

---

## Adding a New Token

1. **Open a PR.** Do not push directly to main.
2. **Add the semantic variable** to `tokens.css`:
   ```css
   --new-token: var(--_new-token);
   ```
3. **Add the concrete value** to **ALL** theme files in `themes/`.
4. **Run the contrast audit** and verify it passes:
   ```bash
   npm run audit:contrast
   ```
5. **Run the linter** and verify it passes:
   ```bash
   npm run lint:css
   ```
6. **Update `README.md`** to document the new token in the Token Categories section.
7. **Update `examples/guide.html`** if the token is user-facing.
8. **Get one review** from a maintainer before merging.

### What Makes a Token Justified

A new token is justified if it meets **one** of these criteria:
- It appears in **at least 3 components** across different apps.
- It represents a **semantic concept** (e.g. disabled, hover, error) rather than a one-off value.
- It is required for **accessibility** (focus rings, reduced-motion).

A new token is **NOT** justified if:
- It is only used in one component.
- It duplicates an existing token with a different name.
- It represents a one-off marketing color.

---

## Deprecating a Token

1. **Do not delete immediately.** Tokens are a public API. Deletion is a breaking change.
2. **Mark as deprecated** in `tokens.css`:
   ```css
   /* @deprecated Use --new-token instead. Will be removed in v2.0.0 */
   --old-token: var(--_old-token);
   ```
3. **File an issue** tracking the deprecation with a target removal version.
4. **Keep for at least 2 minor versions** before removal.
5. **Announce in release notes** when the token is deprecated and when it will be removed.
6. **Only remove in a major version release.**

---

## Theme Completeness

Every theme in `themes/` must define **ALL** `--_*` variables. No exceptions.

### Checklist for a new theme PR

- [ ] All `--_*` variables are defined.
- [ ] Contrast audit passes (`npm run audit:contrast`).
- [ ] The theme renders correctly in `examples/index.html`.
- [ ] The theme renders correctly in `examples/components.html`.
- [ ] The theme is added to `examples/shared/nav.js`.
- [ ] The theme has a preview swatch in `examples/index.html`.

---

## Naming Conventions

| Category | Prefix | Example |
|----------|--------|---------|
| Surfaces | `--surface-*` | `--surface-default`, `--surface-hover` |
| Text | `--text-*` | `--text-primary`, `--text-muted` |
| Borders | `--border-*` | `--border-default`, `--border-focus` |
| Accent actions | `--accent-*` | `--accent-primary`, `--accent-danger` |
| Elevation | `--shadow-*` | `--shadow-sm`, `--shadow-lg` |
| Radius | `--radius-*` | `--radius-base`, `--radius-pill` |
| Spacing | `--space-*` | `--space-2`, `--space-4` |
| Semantic spacing | `--gap-*` | `--gap-sm`, `--gap-md` |
| Typography size | `--text-*` | `--text-sm`, `--text-xl` |
| Typography weight | `--weight-*` | `--weight-medium`, `--weight-bold` |
| Typography leading | `--leading-*` | `--leading-tight`, `--leading-normal` |
| Typography tracking | `--tracking-*` | `--tracking-tight`, `--tracking-wide` |
| Motion duration | `--duration-*` | `--duration-fast`, `--duration-slow` |
| Motion easing | `--ease-*` | `--ease-out`, `--ease-spring` |
| Z-index | `--z-*` | `--z-dropdown`, `--z-modal` |
| Breakpoints | `--breakpoint-*` | `--breakpoint-md`, `--breakpoint-lg` |
| Icon sizes | `--icon-*` | `--icon-sm`, `--icon-lg` |
| Field heights | `--field-height-*` | `--field-height-base` |

### Rules

- Use **kebab-case**.
- Use **semantic names**, not literal values. `--text-primary`, not `--text-gray-900`.
- Private theme variables use `--_` prefix.
- Do not abbreviate. `--border-default`, not `--bd-default`.

---

## Release and Versioning

This project follows [Semantic Versioning](https://semver.org/).

### Patch (0.2.1)

- Bug fixes in themes (contrast failures, incorrect values).
- Adapter fixes for specific library versions.
- Documentation corrections.

### Minor (0.3.0)

- New tokens added (backward compatible).
- New themes added.
- New adapters added.
- New primitive classes added.

### Major (1.0.0, 2.0.0)

- Token renamed or deleted.
- Theme deleted.
- Adapter deleted.
- Breaking change in CSS loading order.

### Release Checklist

- [ ] All CI checks pass (lint, contrast, build).
- [ ] Version bumped in `package.json`.
- [ ] `package-lock.json` updated (`npm install --package-lock-only`).
- [ ] `CHANGELOG.md` updated.
- [ ] Git tag created (`git tag v1.0.0`).
- [ ] npm package published (`npm publish`).

---

## Breaking-Change Policy

1. **Never break without a deprecation period.**
2. **Never delete a token in a minor or patch release.**
3. **Provide a migration guide** in the major release notes.
4. **Support the previous major version** with critical fixes for at least 3 months.

---

## Contributor Quick Reference

| Task | Command |
|------|---------|
| Lint | `npm run lint:css` |
| Contrast audit | `npm run audit:contrast` |
| Build | `npm run build` |
| Serve examples | `python3 -m http.server 8080` |
| Add theme | Copy `themes/professional.css`, rename, edit values, update nav |
| Add token | Edit `tokens.css` + ALL themes + README + run audit |
