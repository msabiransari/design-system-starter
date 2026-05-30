# Design: Classless Layer + ag-Grid Shim + Runtime Theming Proof

**Date:** 2026-05-30
**Status:** Approved (pending spec review)
**Milestone:** 1 of N (foundation + first library shim, proven in isolation)

---

## Background & Motivation

This open-source design system (`@acme/design-tokens`) is built and proven *here*, in
isolation, against real library fixtures. The eventual consumer is a messy multi-framework
estate (AngularJS, Angular 7, Angular 14; ag-Grid, amCharts; no design system today — only
ad-hoc classes and inline styles). That estate is **not** part of this work.

The estate owner wants a design system that:

1. Can be switched to "classless" with a single import at the top of an SPA.
2. Lets app styles override the classless layer easily.
3. Can skin third-party libraries by mapping their variables to ours (a "shim"/adapter).
4. Supports runtime theme switching.

Requirements #2 and #4 already exist in the system (cascade-based overrides; CSS-custom-property
themes swapped at runtime). Requirement #3 exists for PrimeNG/Material via adapters. Requirement
#1 (classless) does **not** exist yet. This milestone delivers the classless layer, an
override model that reconciles #1 with #2, and proves #3 + #4 against a **real ag-Grid fixture**.

amCharts (JS-themed, not CSS-themed) and the app-level rollouts are explicitly later milestones.

---

## Goals

- Ship a global, opt-in-by-import **classless layer** that themes bare semantic HTML.
- Make that layer **trivially overridable** by any app style, with no `!important`.
- Ship an **ag-Grid 14 adapter** that skins the grid by overriding its `.ag-*` classes with our
  tokens (class-based shim — v14 has no CSS variables).
- Prove **classless + override + shim + runtime theming** end-to-end in one fixture, with a
  visual-regression test.
- Restructure `examples/` so each example is self-contained in its own folder.

## Non-Goals (deferred to later milestones)

- amCharts JS-bridge adapter.
- A scoped (`.ds-base` / `.ds-prose`) variant of the classless layer.
- AngularJS / Angular 7 / Angular 14 application pilots.
- Expanding PrimeNG/Material adapter version coverage.
- Modern (v28+, `--ag-*` CSS-variable) ag-Grid theming — a separate future adapter. This
  milestone targets **legacy ag-Grid 14**, which is the consumer's actual version.

## Browser / Environment Constraints

- **Target browsers:** latest evergreen Chrome/Edge/Firefox/Safari only. No IE11. This means
  CSS custom properties (`var()`) and `color-mix()` are both safe to use.
- **Node:** building *this repo* requires Node 18+ (stylelint 16, Playwright). The consuming
  apps run older Node (e.g. 14), which is irrelevant — the design system ships plain CSS
  interpreted by the browser, not by Node.

---

## The Override Model (keystone)

The classless layer wraps all its rules in a single low-priority CSS cascade layer:

```css
@layer ds.classless {
  table { … }   button { … }   input { … }   /* all → token references only */
}
```

Because **unlayered CSS always wins over layered CSS** regardless of specificity or source
order, this resolves the tension between Req #1 and Req #2:

- **Req #1 (import → everything themed):** importing `classless.css` themes every bare element
  on the page.
- **Req #2 (override easily):** any app rule — a class, an element selector, or inline
  `style=` — automatically beats the classless layer. Adding `.ds-table` makes the richer
  primitive win; writing `td { color: red }` in app CSS wins. **No `!important` is ever needed.**

### Why this is low-risk

`tokens.css`, `base.css`, `motion.css`, and `primitives.css` remain **unlayered** and keep their
current cascade behavior. `ds.classless` is the only named layer in the system, so it sits
strictly *below* everything else. Blast radius is limited to the new file; the stable token
contract is untouched.

### Cascade interactions (intended)

| Pair | Winner | Why / intent |
|------|--------|--------------|
| `.ds-button` (unlayered primitive) vs bare `button` (classless) | primitive | Opt into a class → get the richer component. |
| App CSS / inline style vs classless | app | Req #2 — effortless override. |
| `base.css` element rules (`a`, `hr`) vs classless | base | base is unlayered; consistent, intended. |
| ag-Grid's own CSS (unlayered) vs classless | ag-Grid | Classless must not leak into grid internals — that's the adapter's job. |

---

## Component 1 — `classless.css` (new file, repo root)

A global stylesheet that themes **all user-visible HTML elements**, referencing tokens
exclusively (no hardcoded color/size values; enforced by stylelint). Comprehensive by design —
the low cascade layer means broad coverage carries no override risk.

**In scope — all renderable elements:**
- **Text / inline:** `h1–h6`, `p`, `a`, `strong, em, small, mark, abbr, sub, sup, del, ins,
  kbd, samp, var, cite, q`, `blockquote`, `code, pre`, `hr`
- **Lists:** `ul, ol, li`, `dl, dt, dd`, `menu`
- **Tables:** `table, caption, thead, tbody, tfoot, tr, th, td, colgroup`
- **Forms:** `form, fieldset, legend, label`, `input` (all types incl. checkbox/radio/range),
  `textarea`, `select, option, optgroup`, `button`, `output`, `progress`, `meter`
- **Interactive / media:** `details, summary`, `dialog`, `figure, figcaption`, `img, video,
  audio` (sizing/reset), `iframe` (reset)
- **Sectioning:** sensible spacing/rhythm for `section, article, aside, header, footer, main,
  nav`

**Out of scope — nothing to render:**
- Non-rendered elements (`script, style, head, meta, link, template, title`) get no styling.
- No global `*` reset — `base.css` already owns reset/box-sizing.

Table styling mirrors the look already defined by `.ds-table` in `primitives.css`, but at bare
selectors inside `@layer ds.classless`, so `.ds-table` still wins when present.

---

## Component 2 — `adapters/ag-grid-14-adapter.css` (new file)

**ag-Grid 14 (circa 2017) has no CSS variables.** The `--ag-*` theming system did not arrive
until v28 (2022). v14 ships compiled Sass themes and is skinned by **overriding its `.ag-*`
classes directly** — a class-based shim, exactly like the existing PrimeNG adapter overrides
`.p-button` / `.p-datatable`. The overrides reference our tokens, so runtime theming still works.

```css
/* Class-based shim — targets ag-Grid 14's compiled theme DOM */
.ag-theme-fresh .ag-root,
.ag-theme-fresh .ag-body-viewport {
  background-color: var(--surface-default) !important;
  color: var(--text-primary) !important;
  font-family: var(--font-sans) !important;
  font-size: var(--text-sm) !important;
}
.ag-theme-fresh .ag-header {
  background-color: var(--surface-raised) !important;
  border-bottom: 1px solid var(--border-default) !important;
}
.ag-theme-fresh .ag-header-cell { color: var(--text-secondary) !important; }
.ag-theme-fresh .ag-row { border-bottom: 1px solid var(--border-subtle) !important; }
.ag-theme-fresh .ag-row-hover { background-color: var(--surface-hover) !important; }
.ag-theme-fresh .ag-row-selected {
  background-color: color-mix(in srgb, var(--accent-primary) 14%, transparent) !important;
}
/* …cell padding, borders, scrollbars, pinned columns, footer/pager from tokens… */
```

**Rules:**
- **Class-based** (not CSS-variable mapping). Targets v14's internal `.ag-*` class names / DOM.
- **Unlayered**, loaded **after** ag-Grid's own stylesheet (cascade override depends on source
  order — same convention as the PrimeNG adapter).
- `!important` is used to defeat ag-Grid's compiled CSS specificity — permitted in shims/
  adapters by the project's own rules.
- Overrides reference our tokens (`var(--surface-raised)`, etc.), so **runtime theme switching
  still flows through automatically** (Req #4): swap the theme stylesheet/class and the grid
  re-skins live with zero JavaScript.
- **Target:** ag-Grid **14.x** Community, its provided theme (likely `ag-theme-fresh`; **the
  exact theme class names must be verified against the pinned v14 build during implementation**,
  since v14's theme set predates `ag-theme-balham`/`quartz`).
- **Brittleness note:** class-based shims are coupled to ag-Grid's v14 DOM/class structure and
  are version-specific by nature. A future modern-ag-Grid (`--ag-*`) adapter is a separate,
  cleaner milestone.

---

## Component 3 — Proof fixture & demo

`examples/aggrid/index.html`: a self-contained page that loads, in order:

```
../../tokens.css
../../themes/<default>.css            (id="theme-link", swappable)
../../base.css
../../motion.css
../../classless.css                   ← NEW layer
../../primitives.css
<ag-grid 14 core CSS + provided theme CSS, pinned exact version, from CDN>
../../adapters/ag-grid-14-adapter.css ← NEW shim, AFTER the library
../shared/examples.css
../shared/nav.js                      (defer; injects nav + theme switcher)
```

The page renders a populated ag-Grid **14** (Community; pre-v19 the package is `ag-grid`, not
`ag-grid-community`) loaded as a UMD build from CDN at a **pinned exact version** per dependency
rules, alongside bare semantic HTML (a `<table>`, a `<form>`, headings) so a single screen
proves: classless theming, override behavior, the ag-Grid-14 shim, and runtime theme switching
together. Registered in `examples/shared/nav.js`.

---

## Component 4 — `examples/` restructure

Each example becomes a self-contained folder to avoid asset/name collisions and to host
per-example fixtures/screenshots later.

```
examples/
├── index.html              # suite overview / landing — STAYS at root (entry point)
├── shared/                 # nav.js, examples.css — STAYS shared
│   ├── nav.js
│   └── examples.css
├── auth/index.html         # was auth.html
├── components/index.html   # was components.html
├── crm/index.html          # was crm.html
├── dashboard/index.html    # was dashboard.html
├── data/index.html         # was data.html
├── guide/index.html        # was guide.html
├── marketing/index.html    # was marketing.html
├── pilot-app/index.html    # was pilot-app.html
├── studio/index.html       # was studio.html
└── aggrid/index.html       # NEW
```

**Mechanical changes required (all part of this milestone):**
- Moved pages: stylesheet/script links shift one level deeper —
  `../tokens.css` → `../../tokens.css`; `./shared/nav.js` → `../shared/nav.js`.
- `examples/shared/nav.js`: link generation points at `../<name>/`.
- `examples/index.html`: overview cards link to `./<name>/`.
- Playwright specs: update any example-page URLs to the new paths.
- Conventions: each folder uses `index.html` (clean URLs like `/examples/aggrid/`); the root
  overview `index.html` and `shared/` stay put.

---

## Component 5 — Packaging

`package.json`:
- Add export: `"./classless": "./dist/classless.css"`.
- ag-Grid adapter is already covered by the existing `"./adapters/*"` export.
- Add `classless.css` to `files[]` and to the `build` copy step (so it lands in `dist/`).

---

## Testing & Verification

- **Visual regression (Playwright):** add the ag-Grid fixture to `tests/e2e/visual.spec.js`,
  snapshotting across several themes × light/dark × desktop/mobile — same pattern as the
  existing AngularJS/PrimeNG fixtures. Commit baselines.
- **Contrast:** `npm run audit:contrast` must still pass (new classless text/background pairs
  use existing token pairs, so they inherit AA-compliant combinations).
- **Lint:** `npm run lint:css` (stylelint) enforces no hardcoded colors in `classless.css` and
  `adapters/ag-grid-14-adapter.css`.
- **Build:** `npm run build` produces `dist/classless.css` and the adapter.
- **Full gate:** `npm run verify` (lint + contrast + build + e2e) is green.
- **Manual:** open `examples/aggrid/`, switch every theme via the nav dropdown, confirm the grid
  and the bare HTML both re-skin with no reload; confirm an app-style override beats classless
  without `!important`.

---

## Documentation Updates

- **README.md:** new "Classless layer" section (the single import + the override model), and an
  ag-Grid row in the adapter table.
- **AGENTS.md:** task recipes for "use the classless layer", "add a classless element", and
  "add a class-based library shim (ag-Grid 14 pattern)" — with a note pointing to the existing
  CSS-variable adapter pattern (PrimeNG/Material) for libraries that expose `--vars`.
- **adapters/MATRIX.md:** ag-Grid 14 row with tested version, mechanism (class-based `.ag-*`
  overrides — *not* CSS variables, with a note that modern ag-Grid would use `--ag-*`),
  load-after note, and browser support.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Classless leaks into third-party widgets and breaks them | Low layer + bare-element scope; unlayered library CSS always wins. Verified by the ag-Grid fixture. |
| ag-Grid 14 internal class names differ from assumptions | Verify exact `.ag-*` class names + theme against the pinned v14 build during implementation before finalizing the shim. |
| Class-based shim is brittle / version-coupled | Accepted trade-off for v14 (no CSS vars exist). Scoped to the pinned version; a modern `--ag-*` adapter is a separate future milestone. |
| Example path refactor breaks links or tests | Done as one mechanical pass with `npm run verify` + manual nav check as the gate. |
| New classless text/bg pairs fail contrast | Reuse existing AA-compliant token pairs; `audit:contrast` enforces. |
| CDN ag-Grid 14 flakiness/availability in CI | Pin exact version; if CI flakes or the old version is unavailable on CDN, vendor the UMD + theme CSS into the fixture folder. |

---

## Acceptance Criteria

- [ ] `classless.css` exists, themes **all renderable** HTML elements via tokens only, wrapped
      in `@layer ds.classless`.
- [ ] Importing `classless.css` themes bare HTML; any app class/inline style overrides it with
      no `!important`.
- [ ] `adapters/ag-grid-14-adapter.css` overrides ag-Grid 14's `.ag-*` classes with token
      values; grid re-skins on runtime theme switch with no JS.
- [ ] `examples/aggrid/index.html` runs real ag-Grid 14 and demonstrates all four behaviors on
      one page.
- [ ] All existing examples moved into per-example folders; nav, overview, and Playwright URLs
      updated; nothing broken.
- [ ] `package.json` exports/build include `classless.css`.
- [ ] Playwright visual baselines committed; `npm run verify` is green.
- [ ] README, AGENTS.md, and MATRIX.md updated.
