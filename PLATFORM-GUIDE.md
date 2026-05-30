# Platform Team Integration Guide

You are the platform team. You build components. Other teams consume them. Your apps already use PrimeNG (and possibly other libraries) and have scattered CSS. This guide shows you how to introduce the token system **without breaking anything**.

---

## The Architecture

```
┌─────────────────────────────────────────┐
│           APPLICATIONS                    │
│  (App A uses PrimeNG, App B uses React)  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      PLATFORM COMPONENT LIBRARIES       │
│  (@acme/angular-components, etc.)       │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  Built with │  │  Wrapped libs   │   │
│  │   tokens    │  │  (PrimeNG shim) │   │
│  └─────────────┘  └─────────────────┘   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│           ADAPTER LAYER                 │
│  primeng-adapter.css                    │
│  material-adapter.css                   │
│  (maps library internals → tokens)      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         TOKEN SYSTEM (Source)           │
│  tokens.css  ── semantic contract       │
│  themes/     ── concrete values         │
│  primitives.css ── optional classes     │
└─────────────────────────────────────────┘
```

**Rule #1:** Tokens are the only source of truth. Nothing below the adapter layer knows about PrimeNG, Material, or React.

**Rule #2:** Apps load tokens + theme + adapters. They do NOT load library-specific colors directly.

---

## 1. Publish Tokens as an NPM Package

Don't copy-paste CSS files between repos. Publish them:

```
packages/
  @acme/design-tokens/
    package.json
    dist/
      tokens.css
      base.css
      base-scoped.css
      motion.css
      primitives.css
      themes/
        professional.css
        light.css
        dark.css
        healthcare.css
        saas.css
        minimal.css
        forest.css
        ocean.css
      adapters/
        primeng-adapter.css
        material-adapter.css
```

### App `angular.json` or `index.html`:

```html
<!-- 1. Tokens (the contract) -->
<link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/tokens.css" />

<!-- 2. Theme (chosen by app or user preference) -->
<link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/themes/professional.css" id="theme-link" />

<!-- 3. Base reset + globals -->
<!-- Use base.css for greenfield apps (global * reset) -->
<link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/base.css" />
<!-- OR use base-scoped.css for legacy/hybrid apps (scoped under .ds-base) -->
<!-- <link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/base-scoped.css" /> -->

<!-- 4. Motion -->
<link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/motion.css" />

<!-- 5. Optional primitives -->
<link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/primitives.css" />

<!-- 6. LIBRARY ADAPTER (e.g. PrimeNG) -->
<link rel="stylesheet" href="node_modules/@acme/design-tokens/dist/adapters/primeng-adapter.css" />
```

> **Why load the adapter LAST?** CSS cascade. The adapter overrides library defaults with token values.

---

## 2. Build Platform Components Using Tokens

When your platform team builds a new component, **never use a hex code**. Reference tokens directly.

### Angular Component Example

```typescript
// acme-button.component.ts
@Component({
  selector: 'acme-button',
  template: `<button class="acme-button" [class.primary]="variant === 'primary'"><ng-content /></button>`,
  styles: [`
    :host {
      display: inline-flex;
    }
    .acme-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-1-5);
      padding: var(--space-2) var(--space-4);
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
      border-radius: var(--radius-base);
      border: 1px solid transparent;
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-out);
      background: var(--accent-secondary);
      color: var(--accent-secondary-text);
    }
    .acme-button:hover {
      background: var(--accent-secondary-hover);
    }
    .acme-button.primary {
      background: var(--accent-primary);
      color: var(--accent-primary-text);
      border-color: var(--accent-primary);
    }
    .acme-button.primary:hover {
      background: var(--accent-primary-hover);
      border-color: var(--accent-primary-hover);
    }
  `]
})
export class AcmeButtonComponent {
  @Input() variant: 'primary' | 'secondary' = 'secondary';
}
```

**Benefits:**
- Zero dependency on PrimeNG's button.
- Automatically adapts to any theme.
- Apps can use `acme-button` OR PrimeNG's `p-button` (both look consistent because the adapter handles PrimeNG).

---

## 3. Handling Scattered Styles (The Strangler Fig)

You have existing CSS across many libs. Don't rewrite it all at once.

### Phase 1: Stop the Bleeding (Week 1)

Add a **stylelint rule** that bans hardcoded colors in NEW code:

```json
// .stylelintrc.json
{
  "rules": {
    "color-no-hex": true,
    "color-named": "never",
    "declaration-property-value-disallowed-list": {
      "background-color": ["/^rgb/", "/^hsl/"],
      "color": ["/^rgb/", "/^hsl/"]
    }
  }
}
```

> Existing files get a `/* stylelint-disable */` header. New files must follow the rule.

### Phase 2: Token Shim for Legacy Components (Week 2-4)

Create a `legacy-shim.css` that overrides your existing component classes with token values:

```css
/* @acme/design-tokens/dist/legacy-shim.css */
@layer acme-legacy {
  /* Old library button class → map to tokens */
  .acme-btn-old {
    background-color: var(--accent-primary) !important;
    color: var(--accent-primary-text) !important;
    border-radius: var(--radius-base) !important;
  }
  .acme-btn-old:hover {
    background-color: var(--accent-primary-hover) !important;
  }

  /* Old card class */
  .acme-card-old {
    background: var(--surface-raised) !important;
    border: 1px solid var(--border-default) !important;
    box-shadow: var(--shadow-sm) !important;
  }
}
```

Apps load `legacy-shim.css` after their old component CSS. Old components suddenly match the new theme.

### Phase 3: Codemod Migration (Month 2-3)

Write a Node script that scans your component libraries and replaces common hardcoded values with token references:

```javascript
// scripts/migrate-to-tokens.js
const fs = require('fs');
const path = require('path');

const TOKEN_MAP = {
  '#0f1d40': 'var(--accent-primary)',
  '#ffffff': 'var(--surface-default)',
  '#f4f6f8': 'var(--surface-page)',
  // ... generated from your most common values
};

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  Object.entries(TOKEN_MAP).forEach(([hex, token]) => {
    const regex = new RegExp(hex, 'gi');
    content = content.replace(regex, token);
  });
  fs.writeFileSync(filePath, content);
}

// Run on all CSS/SCSS files in your component libs
glob('libs/**/*.scss').forEach(migrateFile);
```

> **Caution:** Review the diff. Some `#ffffff` might need to be `var(--surface-raised)` instead of `var(--surface-default)`.

### Phase 4: Deprecation (Month 6+)

Once a legacy component is fully migrated or replaced, remove its shim rule. The `legacy-shim.css` file should shrink over time until it can be deleted.

---

## 4. Theme Switching at Runtime

Apps should be able to swap themes without reloading. Since tokens are CSS custom properties, you only need to swap the theme CSS file:

```typescript
// theme.service.ts (Angular example)
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private linkEl = document.querySelector('#theme-link') as HTMLLinkElement;

  setTheme(name: string) {
    this.linkEl.href = `node_modules/@acme/design-tokens/dist/themes/${name}.css`;
    localStorage.setItem('acme-theme', name);
    if (name === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  restore() {
    const saved = localStorage.getItem('acme-theme') || 'professional';
    this.setTheme(saved);
  }
}
```

**PrimeNG, Material, and your platform components all update instantly** because they reference the same CSS variables.

---

## 5. Dealing with Library-Specific Gaps

Sometimes a library uses a concept your tokens don't cover (e.g. PrimeNG's `--p-surface-700`). Don't add a new token for every library concept. Instead:

```css
/* In the adapter, compute from existing tokens */
--p-surface-700: var(--text-secondary);   /* close enough semantically */
--p-surface-800: var(--text-primary);
```

If a library concept truly doesn't map (rare), use `color-mix()`:

```css
--p-surface-100: color-mix(in srgb, var(--surface-hover) 80%, var(--surface-active));
```

---

## 6. Recommended File Loading Order (Per App)

```
1. tokens.css              ← semantic variables
2. themes/{name}.css       ← concrete values (swappable)
3. base.css                ← reset + global typography
4. motion.css              ← animations
5. primitives.css          ← optional utility classes
6. [library theme].css     ← PrimeNG / Material base
7. adapters/{lib}.css      ← bridges library → tokens
8. [app-specific CSS]      ← app pages + components
9. legacy-shim.css         ← old component overrides (temporary)
```

---

## 7. Quick Wins Checklist

- [ ] Publish `@acme/design-tokens` to your private registry
- [ ] Add `stylelint` ban on hex colors for new files
- [ ] Create `primeng-adapter.css` and load it in one pilot app
- [ ] Build ONE new platform component using tokens (e.g. `acme-button`)
- [ ] Write `legacy-shim.css` with your top 10 most-used legacy classes
- [ ] Add theme switcher to your shell/nav component
- [ ] Announce: "New components use tokens. Old components shimmed. PrimeNG adapts automatically."

---

## Summary

| Problem | Solution |
|---------|----------|
| PrimeNG looks different from our design | `primeng-adapter.css` maps its variables to our tokens |
| Scattered CSS in old libs | `legacy-shim.css` + stylelint ban + gradual codemod |
| Apps need to swap themes | CSS custom properties update at runtime; swap one CSS file |
| Platform team builds new components | Reference tokens directly; never hardcode colors |
| Different apps use different frameworks | Tokens are plain CSS. Framework doesn't matter. |

The token system becomes the **lingua franca** of your organization. PrimeNG speaks it through an adapter. Your old libs speak it through a shim. Your new components speak it natively.
