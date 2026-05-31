# @acme/design-tokens

**A framework-agnostic, token-based design system for re-branding and revamping web applications — without rewriting your markup.**

[![CSS Variables](https://img.shields.io/badge/built%20with-CSS%20custom%20properties-264de4)](#how-it-works)
[![Frameworks](https://img.shields.io/badge/works%20with-React%20%7C%20Angular%20%7C%20Vue%20%7C%20plain%20HTML-success)](#framework-support)
[![Themes](https://img.shields.io/badge/themes-9%20built--in-orange)](#built-in-themes)
[![License](https://img.shields.io/badge/license-MIT-green)](#license)
[![Accessibility](https://img.shields.io/badge/contrast-WCAG%20AA-blueviolet)](#accessibility)

> Copy this folder (or install the package), choose a theme, and your entire application inherits a crisp, modern, professional aesthetic. Swap one CSS import to re-skin everything — buttons, cards, tables, modals, and even third-party libraries like PrimeNG and Angular Material.

---

## Table of Contents

- [What is this?](#what-is-this)
- [Why it exists](#why-it-exists)
- [How it works](#how-it-works)
- [Quick start](#quick-start)
- [What you get](#what-you-get)
- [Built-in themes](#built-in-themes)
- [How flexible is it?](#how-flexible-is-it)
- [Using it with legacy applications](#using-it-with-legacy-applications)
- [Re-branding / revamp playbook](#re-branding--revamp-playbook-for-engineers)
- [Classless layer](#classless-layer)
- [Framework support](#framework-support)
- [Third-party library adapters](#third-party-library-adapters)
- [Runtime theme switching](#runtime-theme-switching)
- [Accessibility](#accessibility)
- [Project layout](#project-layout)
- [Scripts & verification](#scripts--verification)
- [Browser support](#browser-support)
- [For AI coding agents](#for-ai-coding-agents)
- [FAQ](#faq)
- [License](#license)

---

## What is this?

`@acme/design-tokens` is **not a UI framework and not a component library you have to adopt wholesale**. It's a thin, portable **styling foundation** built entirely on [CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) (CSS variables). It ships as plain `.css` files with **zero JavaScript runtime dependency**, so it works in any stack — React, Angular, Vue, Svelte, server-rendered pages, or a single static HTML file.

It gives your organization a **single source of truth for look-and-feel**: every color, font, spacing value, shadow, radius, and motion curve is named once as a *semantic token*. Your app references `--surface-default`, never `#ffffff`. Change the theme file and the entire UI re-skins instantly.

It is purpose-built for the hardest real-world case: **introducing a consistent design language into a sprawl of existing apps** (different frameworks, different component libraries, scattered hardcoded CSS) **without a big-bang rewrite**.

---

## Why it exists

Most teams accumulate this problem over years:

- App A is Angular 7 + PrimeNG, App B is React, App C is AngularJS with inline styles everywhere.
- Colors are hardcoded as hex values in hundreds of files.
- "Make everything match the new brand" turns into a multi-quarter rewrite nobody wants to own.

This system solves it with **one rule**: *tokens are the lingua franca*. PrimeNG speaks it through an adapter, your old libs speak it through a shim, and your new components speak it natively. Re-branding becomes *"edit one theme file,"* not *"touch every component."*

---

## How it works

A strict **three-layer separation** keeps the contract stable while everything visual stays swappable:

```
┌─────────────────────────────────────────────┐
│  primitives.css   →  optional ready-made     │  "the components"
│                      classes (.ds-button…)   │
├─────────────────────────────────────────────┤
│  themes/*.css     →  concrete values         │  "the skin" (swappable)
│                      (--_surface: #fff)      │
├─────────────────────────────────────────────┤
│  tokens.css       →  semantic contract       │  "the contract" (stable)
│                      (--surface-default)     │
└─────────────────────────────────────────────┘
```

| Layer | File(s) | What it holds | Rule |
|-------|---------|---------------|------|
| **Contract** | `tokens.css` | Semantic variables (`--surface-default`, `--text-primary`, `--accent-primary`) | **Never** holds concrete values. Never rename or delete a token. |
| **Skin** | `themes/*.css` | Concrete hex codes, font stacks, shadows via `--_`-prefixed private variables | Swap one file → re-skin everything. |
| **Components** | `primitives.css`, `base.css`, `motion.css` | Reusable classes & resets that reference **only** tokens | No hardcoded colors, ever. |
| **Bridges** | `adapters/*.css` | Maps third-party library variables onto your tokens | Adapters translate; they never redefine token meaning. |

The magic: `tokens.css` declares `--surface-default: var(--_surface-default);`. A theme file just defines `--_surface-default`. Because every primitive, every adapter, and your own components all read `--surface-default`, swapping the theme value cascades everywhere automatically — including at runtime.

---

## Quick start

### Option A — drop-in CSS (any project)

```html
<!-- 1. Tokens (the contract) -->
<link rel="stylesheet" href="tokens.css" />

<!-- 2. Theme (the skin: light, dark, professional, …) -->
<link rel="stylesheet" href="themes/professional.css" id="theme-link" />

<!-- 3. Base reset + global typography (use base-scoped.css for legacy apps) -->
<link rel="stylesheet" href="base.css" />

<!-- 4. Motion / animations (optional) -->
<link rel="stylesheet" href="motion.css" />

<!-- 5. Ready-made component classes (optional) -->
<link rel="stylesheet" href="primitives.css" />
```

### Option B — bundler entry (Vite / Webpack / Angular CLI)

```css
@import "@acme/design-tokens/tokens";
@import "@acme/design-tokens/themes/professional.css";
@import "@acme/design-tokens/base";
@import "@acme/design-tokens/motion";
@import "@acme/design-tokens/primitives";
```

### See it live

```bash
npm run serve
# → open http://localhost:8080/examples/
```

The examples suite includes a **theme switcher** (top nav) so you can watch every demo re-skin in real time.

---

## What you get

**Token categories** (the vocabulary your app references):

- **Surface** — page, card, raised, overlay, hover, active backgrounds
- **Text** — primary, secondary, muted, inverted, danger, success
- **Border** — default, hover, focus, subtle dividers
- **Accent** — primary / secondary action, danger, warning, success, info (each with a paired `-text` and `-hover`)
- **Elevation** — shadows from flat to floating modal
- **Radius** — none, sm, base, lg, pill, full
- **Spacing** — 4px-based scale (0–16) plus semantic gaps
- **Typography** — sans / serif / mono families, sizes (xs–4xl), weights, line-heights, tracking
- **Motion** — durations, easings, stagger delays (all respect `prefers-reduced-motion`)
- **Z-index** — layered scale from base (0) to tooltip (900)
- **Field heights, icon sizes, layout** — form-control heights (sm/base/lg), icon sizes (xs–xl), container max-widths, sidebar width, header height
- **Breakpoints** — reference widths for JS / preprocessor use

**Optional primitives** (`primitives.css`) — ~80 ready-to-use classes covering: buttons (primary/secondary/ghost/danger, sm/lg), cards, inputs & selects, badges, tables, modals & backdrops, tooltips, skeletons, toasts, form fields, switches, tabs, accordions, dropdown menus, progress bars & spinners, pagination, breadcrumbs, avatars (with status dots), and empty states. Use them — or ignore them and reference tokens in your own components.

---

## Built-in themes

Nine themes ship ready to use (`themes/`). Pick one, or copy the closest and tweak the `--_*` values.

| Theme | Feel | Typical use |
|-------|------|-------------|
| `light` | Clean neutral light | General default |
| `dark` | Dark mode (scoped to `.dark` / `[data-theme="dark"]`) | Dark preference |
| `auto` | Follows OS `prefers-color-scheme` | Automatic light/dark |
| `professional` | Financial / enterprise navy | CRMs, dashboards, fintech |
| `healthcare` | Calm medical blues/greens | Health & care apps |
| `saas` | Modern indigo | Marketing & SaaS products |
| `minimal` | Brutalist black + white | High-contrast, editorial |
| `forest` | Earthy organic greens | Sustainability, lifestyle |
| `ocean` | Fresh cyan | Bright, friendly products |

---

## How flexible is it?

Very — flexibility is the entire point. Concretely:

- **Adopt as much or as little as you want.** Use only `tokens.css` + a theme and reference tokens in your own components. Or add `primitives.css` for instant UI. Or go all-in with adapters and shims. There is no framework to buy into.
- **Re-skin without touching markup.** Changing the theme `<link>` (or one `@import`) re-skins the whole app. No HTML/JSX/template edits.
- **Make a custom brand theme in minutes.** Copy `themes/professional.css` → `themes/mybrand.css`, edit only the `--_*` private variables inside `:root`. Done — `tokens.css` is untouched and everything inherits it.
- **Extend the vocabulary safely.** Need a new token? Add `--new-token: var(--_new-token);` to `tokens.css`, give every theme a `--_new-token` value, document it. Existing tokens are **never renamed or removed**, so consumers never break (backward-compatible by contract).
- **Runtime theming.** Because tokens are CSS custom properties, you can switch themes live by swapping one stylesheet — PrimeNG, Material, primitives, and your components all update at once. No reload.
- **Framework-neutral.** Plain CSS variables. Works identically in React, Angular, Vue, Svelte, Web Components, or static HTML.
- **Composable with libraries you already use.** Adapters bridge PrimeNG / Angular Material onto your tokens, so vendor components match your brand without forking them.
- **Greenfield or legacy.** Choose a global reset (`base.css`) for new apps or a scoped reset (`base-scoped.css` under `.ds-base`) so you can introduce the system into a legacy app one container at a time.

**Honest limits** (so you can plan): it requires CSS custom properties — **no IE11** (consider a SCSS system if you need it). CSS variables can't be used inside `@media` query conditions, so breakpoints are exposed as reference values for JS/preprocessor use. PrimeNG 21+'s new CSS-variable injection isn't covered by the class-based adapter. See [Browser support](#browser-support) and [adapters/MATRIX.md](adapters/MATRIX.md).

---

## Using it with legacy applications

This is where the system earns its keep. The strategy is the **strangler fig**: introduce tokens alongside existing CSS, make old components *look* new via shims, then refactor incrementally as teams touch code — never a big-bang rewrite.

### The four-phase rollout

| Phase | Goal | What you do |
|-------|------|-------------|
| **1. Stop the bleeding** *(week 1)* | No new hardcoded colors | Add a stylelint rule banning hex/named colors in new files. Existing files get a temporary disable header. |
| **2. Shim legacy components** *(weeks 2–4)* | Old UI matches the new theme | Write `legacy-shim.css` mapping your top legacy classes to tokens. `!important` is allowed **only here** to defeat legacy specificity. Load it last. |
| **3. Codemod migration** *(months 2–3)* | Replace hardcoded values at scale | Run a script that swaps your most common hex values for token references. Review every diff. |
| **4. Deprecation** *(month 6+)* | Shrink the shim to zero | As components get migrated/replaced, delete their shim rules until `legacy-shim.css` disappears. |

### Greenfield vs. legacy base reset

- **Greenfield / controlled shell** → use `base.css` (global `*` reset).
- **Legacy / hybrid app** → use `base-scoped.css` and wrap your migrated shell/root in `.ds-base`, so the reset and typography only apply where you opt in. This prevents the design system from fighting existing global styles.

### Recommended load order for a consuming app

```
1. tokens.css              ← semantic variables
2. themes/{name}.css       ← concrete values (swappable at runtime)
3. base.css | base-scoped.css ← reset + typography
4. motion.css              ← animations (optional)
5. primitives.css          ← utility classes (optional)
6. [library theme].css     ← PrimeNG / Material base
7. adapters/{lib}.css      ← bridges library → tokens  (load AFTER the library)
8. [app-specific CSS]      ← your pages & components
9. legacy-shim.css         ← old component overrides (temporary)
```

> **Why adapters load after the library?** The CSS cascade. The adapter must override the library's defaults with your token values.

### Automated migration tooling

A bundled scanner reports hardcoded colors, fonts, and style sprawl across a target app and produces an HTML report:

```bash
python3 skills/acme-design-system-migration/scripts/scan_legacy_styles.py /path/to/legacy-app \
  --format html --output report.html
```

Framework-specific adoption playbooks live in `skills/acme-design-system-migration/references/migration-playbooks.md` (AngularJS 1.x, Angular 7 + PrimeNG 7, modern Angular + PrimeNG 17, React, Vue, static/server-rendered).

---

## Re-branding / revamp playbook (for engineers)

If your goal is *"make our app(s) look modern and on-brand,"* here's the fastest safe path:

1. **Pick or build your theme.** Start from the closest built-in theme. Copy it to `themes/<brand>.css` and edit only the `--_*` variables — brand colors, fonts, radius, shadows. Don't touch `tokens.css`.
2. **Wire the load order** (above). For an existing app, prefer `base-scoped.css` + `.ds-base` so you can roll out screen-by-screen.
3. **Adapt your component library.** Using PrimeNG or Angular Material? Add the matching adapter after the library CSS and your branded components instantly inherit the theme. Check [adapters/MATRIX.md](adapters/MATRIX.md) for version support.
4. **Shim the legacy hotspots.** Map your highest-traffic legacy classes (buttons, cards, nav, forms, tables, modals) to tokens in `legacy-shim.css` for an immediate visual lift with minimal risk.
5. **Refactor visible surfaces first.** Shell, nav, buttons, cards, forms, tables, modals, alerts — the things users see most. Leave obscure screens for normal feature work.
6. **Add a theme switcher** to your shell so brand/dark-mode changes are one line of code, and persist the choice (the examples use `localStorage`).
7. **Verify before you ship.** Run stylelint, the contrast audit, the build, and the Playwright visual tests (or at minimum capture before/after screenshots in light + dark). See [Scripts & verification](#scripts--verification).

**Rule of thumb for token mapping during a revamp:** not every `#ffffff` is `--surface-default`. Page backgrounds → `--surface-page`, cards/raised surfaces → `--surface-raised`, primary brand actions → `--accent-primary`. When a library concept has no clean token, compute it from existing tokens with `color-mix()` rather than inventing per-library tokens.

---

## Classless layer

Import one file and **every bare semantic element is themed** — no classes required:

```css
@import "@acme/design-tokens/tokens";
@import "@acme/design-tokens/themes/professional.css";
@import "@acme/design-tokens/base";
@import "@acme/design-tokens/classless";   /* ← themes table, button, input, h1–h6, … */
```

`classless.css` lives in the lowest CSS cascade layer (`@layer ds.classless`). Because
**unlayered CSS always beats layered CSS**, any of your own styles — a class, an element rule,
or inline `style=` — overrides it automatically, with **no `!important` ever**. Add `.ds-table`
and the richer primitive wins; write `td { color: red }` in your app and that wins too. Demo:
`examples/aggrid/` (bare HTML + ag-Grid 14, both re-skinning on theme switch).

---

## Framework support

Because everything is plain CSS variables, the system is framework-neutral. Reference tokens directly in your components:

```ts
// Angular component — never a hex code, always a token
@Component({
  selector: 'acme-button',
  template: `<button class="acme-button" [class.primary]="variant === 'primary'"><ng-content/></button>`,
  styles: [`
    .acme-button {
      padding: var(--space-2) var(--space-4);
      font-weight: var(--weight-semibold);
      border-radius: var(--radius-base);
      background: var(--accent-secondary);
      color: var(--accent-secondary-text);
      transition: all var(--duration-fast) var(--ease-out);
    }
    .acme-button.primary {
      background: var(--accent-primary);
      color: var(--accent-primary-text);
    }
  `]
})
export class AcmeButtonComponent { @Input() variant: 'primary' | 'secondary' = 'secondary'; }
```

```jsx
// React — same tokens, inline or via CSS modules
<button style={{
  background: 'var(--accent-primary)',
  color: 'var(--accent-primary-text)',
  borderRadius: 'var(--radius-base)',
  padding: 'var(--space-2) var(--space-4)',
}}>Save</button>
```

The component is now skin-agnostic: it adapts to any theme automatically and has zero dependency on a specific UI library.

---

## Third-party library adapters

Adapters map a library's internal CSS variables/classes onto your tokens so vendor components match your brand — **without editing the library**.

| Adapter | File | Status |
|---------|------|--------|
| PrimeNG (modern) | `adapters/primeng-adapter.css` | ✅ PrimeNG 17 / Angular 17–21 (validated fixture). ⚠️ 16 partial. ❌ 21+ uses new variable injection. |
| PrimeNG 7 | `adapters/primeng7-adapter.css` | For legacy `ui-*` class names; verify with `fixtures/angular7-primeng/`. |
| Angular Material | `adapters/material-adapter.css` | ✅ MDC-based (17). ⚠️ 16 partial. ❌ legacy non-MDC (15). |
| ag-Grid 14 (legacy) | `adapters/ag-grid-14-adapter.css` | ✅ Class-based shim over `.ag-fresh` (v14 has no CSS variables). Load after ag-Grid's CSS. |

Full version/browser matrix and known limitations: [adapters/MATRIX.md](adapters/MATRIX.md). Authoring a new adapter is documented in [adapters/README.md](adapters/README.md).

---

## Runtime theme switching

Swap one stylesheet and the whole UI — including adapted PrimeNG/Material components — re-skins with no reload:

```ts
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private linkEl = document.querySelector('#theme-link') as HTMLLinkElement;

  setTheme(name: string) {
    this.linkEl.href = `@acme/design-tokens/themes/${name}.css`;
    localStorage.setItem('acme-theme', name);
    document.documentElement.classList.toggle('dark', name === 'dark');
  }

  restore() { this.setTheme(localStorage.getItem('acme-theme') ?? 'professional'); }
}
```

---

## Accessibility

- **Motion** respects `prefers-reduced-motion` throughout `motion.css`.
- **Focus rings** are visible and consistent (`2px` offset, `--focus-ring` color).
- **Contrast** — built-in text/background token pairs are designed to pass **WCAG AA** minimums, and an automated auditor (`npm run audit:contrast`) checks them.
- **Primitives** prefer native HTML semantics and behavior before adding JavaScript.

---

## Project layout

```
design-system-starter/
├── tokens.css              # Semantic token contract — NEVER edit values here
├── base.css                # Global CSS reset + typography (greenfield)
├── base-scoped.css         # Scoped reset under .ds-base (legacy/hybrid)
├── motion.css              # Animations + keyframes (respects reduced-motion)
├── primitives.css          # ~80 component classes (.ds-button, .ds-card, …)
├── icons.css / icons/      # Icon sprite + sizing tokens
├── themes/                 # 9 themes: light, dark, auto, professional, …
├── adapters/               # PrimeNG (modern + 7), Angular Material + MATRIX.md
├── examples/               # Dashboard, CRM, marketing, data, auth, components…
│   └── shared/nav.js       # Theme switcher with localStorage persistence
├── skills/                 # AI-agent migration skill + legacy-style scanner
├── fixtures/               # Real Angular/PrimeNG apps for adapter testing
├── tests/e2e/              # Playwright visual-regression tests + snapshots
├── scripts/                # Contrast auditor + token-doc generator
├── docs/                   # Generated token docs + sample migration report
├── AGENTS.md               # Operating instructions for AI coding agents
├── PLATFORM-GUIDE.md       # Platform-team integration deep-dive
└── GOVERNANCE.md           # Contribution rules & backward-compat policy
```

---

## Scripts & verification

```bash
npm run serve            # Serve the examples suite at http://localhost:8080/examples/
npm run build            # Bundle all CSS + themes + adapters + icons into dist/
npm run lint:css         # Stylelint (enforces no hardcoded colors)
npm run audit:contrast   # WCAG AA contrast audit across theme token pairs
npm run docs:generate    # Generate token documentation
npm run test:e2e         # Playwright visual-regression tests (themes × viewports)
npm run verify           # lint:css + audit:contrast + build + test:e2e  (full gate)
```

Run `npm run verify` before publishing or merging a re-brand — it's the single command that proves nothing regressed.

---

## Browser support

Requires CSS custom properties (`var()`).

| Browser | Supported |
|---------|-----------|
| Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ | ✅ |
| IE11 | ❌ |
| Safari ≤13, Chrome ≤89 | ❌ |

If you must support IE11 or very old Safari, this token system isn't compatible — consider a SCSS-compiled design system instead.

---

## For AI coding agents

This repo is explicitly designed to be operated by AI coding agents. See **[AGENTS.md](AGENTS.md)** for decision trees covering: migrating a legacy app, adding a theme, adding a token, integrating a new library, and modifying primitives — plus a strict "what NOT to do" list (never put concrete values in `tokens.css`, never rename/delete tokens, no `!important` outside shims). A reusable migration skill lives in `skills/acme-design-system-migration/`.

---

## FAQ

**Do I have to use the `.ds-*` primitive classes?** No. They're optional. Many teams use only the tokens and build their own components.

**Will adopting this break my existing styles?** Not if you use `base-scoped.css` + `.ds-base` and introduce the system incrementally. The legacy rollout is designed to be additive.

**Can different apps use different brand themes from the same package?** Yes — each app just loads a different theme file. The contract (`tokens.css`) is shared; the skin is per-app.

**How do I create a brand theme?** Copy the closest `themes/*.css`, edit only the `--_*` variables, register it in `examples/shared/nav.js` to preview it. Never edit `tokens.css`.

**What about SCSS/Tailwind apps?** Keep your conventions; just replace concrete colors/sizes with token references at the boundary. The tokens coexist with utility/CSS-in-JS approaches.

---

## License

MIT
