# Milestone 5: Functional Application Primitives

This milestone expands the design system with common product UI primitives. The goal is functional coverage, not decorative polish. Motion is allowed only when it communicates state change, origin, progress, or hierarchy.

## Positioning

This project is a framework-agnostic design token and primitive system for modern and legacy apps. New primitives must work in plain HTML and be easy to wire from AngularJS, Angular, React, Vue, and server-rendered templates.

Do not create a framework component library in this milestone. Ship CSS primitives and documented behavior contracts. Consuming apps can provide framework-specific state and event handling.

## Core Rule

Prefer this order:

1. Native HTML behavior.
2. CSS styling and token-driven motion.
3. Small JavaScript behavior only when native HTML cannot provide accessible behavior.

Use CSS for:

- Visual states: hover, focus, active, selected, disabled, readonly, invalid, loading.
- Transitions: accordion reveal, tab indicator movement, menu fade, switch thumb movement.
- Token-driven styling: color, surface, spacing, radius, typography, shadow, z-index.
- Reduced-motion behavior through `prefers-reduced-motion`.

Use JavaScript only for behavior contracts that CSS cannot solve accessibly:

- Tab panel switching.
- Custom menu open/close.
- Roving `tabindex`.
- Escape key behavior.
- Focus management.
- Outside-click close.
- Syncing ARIA state such as `aria-expanded`, `aria-selected`, and `hidden`.

## Non-Goals

Do not add:

- Button ripple effects.
- Page transitions.
- Parallax or scroll-triggered effects.
- Particle effects, confetti, or decorative loaders.
- 3D/WebGL visual treatments.
- Decorative gradient blobs or marketing-heavy sections.
- Framework-specific React, Angular, or Vue wrappers.

## Scope

Implement primitives in phases. Keep each primitive small, token-based, documented, and covered by examples/tests.

### Phase 1: Highest Leverage

1. Form Field Wrapper
2. Switch / Toggle
3. Tabs
4. Accordion / Details

### Phase 2: App Completion

5. Dropdown / Select Menu
6. Progress Bar / Spinner
7. Pagination
8. Breadcrumb
9. Avatar
10. Empty State

If time is limited, complete Phase 1 first and leave Phase 2 as documented follow-up.

## Primitive Specifications

### Form Field Wrapper

Purpose: standardize label, input, help text, required marker, error text, and disabled/read-only layout.

Recommended classes:

- `.ds-field`
- `.ds-field-label`
- `.ds-field-required`
- `.ds-field-control`
- `.ds-field-help`
- `.ds-field-error`
- `.ds-field-row`
- `.ds-field[aria-invalid="true"]` or `.ds-field.is-invalid`
- `.ds-field.is-disabled`
- `.ds-field.is-readonly`

Behavior:

- No JavaScript required.
- Use native form semantics.
- Error state must be visible without relying on color alone.
- Help and error text should use stable spacing so layout does not jump heavily.

Example:

```html
<div class="ds-field">
  <label class="ds-field-label" for="email">Email <span class="ds-field-required">*</span></label>
  <input id="email" class="ds-input ds-field-control" type="email" aria-describedby="email-help" />
  <p id="email-help" class="ds-field-help">Use your work email address.</p>
</div>
```

Invalid example:

```html
<div class="ds-field is-invalid">
  <label class="ds-field-label" for="amount">Amount</label>
  <input id="amount" class="ds-input ds-field-control" aria-invalid="true" aria-describedby="amount-error" />
  <p id="amount-error" class="ds-field-error">Enter a valid amount.</p>
</div>
```

### Switch / Toggle

Purpose: token-styled binary control backed by a native checkbox.

Recommended classes:

- `.ds-switch`
- `.ds-switch-input`
- `.ds-switch-track`
- `.ds-switch-thumb`
- `.ds-switch-label`
- `.ds-switch-description`
- `.ds-switch-sm`
- `.ds-switch-lg`

Behavior:

- Must use `<input type="checkbox">`.
- No JavaScript required for basic behavior.
- Thumb movement should be CSS-only.
- Disabled state must follow native `disabled`.
- Use `currentColor` or tokens for all visual parts.

Example:

```html
<label class="ds-switch">
  <input class="ds-switch-input" type="checkbox" />
  <span class="ds-switch-track"><span class="ds-switch-thumb"></span></span>
  <span class="ds-switch-label">Email notifications</span>
</label>
```

Motion:

- Thumb translates from off to on.
- Reduced motion should remove/shorten the translation duration.

### Tabs

Purpose: standardize tab lists and panels for settings, dashboards, wizards, and detail pages.

Recommended classes:

- `.ds-tabs`
- `.ds-tab-list`
- `.ds-tab`
- `.ds-tab-indicator`
- `.ds-tab-panel`
- `.ds-tab-panel[hidden]`
- `.ds-tabs-compact`

Behavior:

- JavaScript or framework code is required to switch panels accessibly.
- CSS must only define layout, selected state, focus state, and optional active indicator motion.
- Document that consuming code must update `aria-selected`, `tabindex`, and `hidden`.

Required markup:

```html
<div class="ds-tabs">
  <div class="ds-tab-list" role="tablist" aria-label="Account sections">
    <button class="ds-tab is-active" role="tab" aria-selected="true" aria-controls="panel-profile" id="tab-profile">Profile</button>
    <button class="ds-tab" role="tab" aria-selected="false" aria-controls="panel-security" id="tab-security" tabindex="-1">Security</button>
  </div>
  <section class="ds-tab-panel" role="tabpanel" id="panel-profile" aria-labelledby="tab-profile">Profile content</section>
  <section class="ds-tab-panel" role="tabpanel" id="panel-security" aria-labelledby="tab-security" hidden>Security content</section>
</div>
```

Behavior contract for app/framework code:

- Arrow keys move focus between tabs.
- Home/End move to first/last tab.
- Enter/Space activates the focused tab if activation is not automatic.
- Active tab has `aria-selected="true"` and `tabindex="0"`.
- Inactive tabs have `aria-selected="false"` and `tabindex="-1"`.
- Only the active panel is visible; inactive panels have `hidden`.

Motion:

- Optional underline/indicator movement.
- Reduced motion should snap without sliding.

### Accordion / Details

Purpose: collapsible content for filters, settings, summaries, and dense pages.

Preferred native version:

- Use `<details>` and `<summary>` when possible.

Recommended classes:

- `.ds-accordion`
- `.ds-accordion-item`
- `.ds-accordion-summary`
- `.ds-accordion-content`
- `.ds-accordion-icon`

Native example:

```html
<details class="ds-accordion-item">
  <summary class="ds-accordion-summary">Billing details</summary>
  <div class="ds-accordion-content">Billing content</div>
</details>
```

Behavior:

- Native `<details>` requires no JavaScript.
- Custom multi-select or single-select accordion behavior may require app/framework code.
- If custom behavior is used, consuming code must update `aria-expanded`.

Motion:

- Use a functional reveal animation only if it remains stable.
- Prefer `grid-template-rows: 0fr -> 1fr` or max-block-size with conservative limits.
- Reduced motion should show/hide instantly.

### Dropdown / Select Menu

Purpose: style select-like controls and action menus.

Important: this is higher risk than other primitives. Native `<select>` can be styled, but a custom menu needs JavaScript for accessibility.

Recommended classes:

- `.ds-select`
- `.ds-menu`
- `.ds-menu-trigger`
- `.ds-menu-content`
- `.ds-menu-item`
- `.ds-menu-separator`
- `.ds-menu-label`

Behavior:

- Native `<select class="ds-select">` requires no JavaScript.
- Custom menus require JavaScript/framework code for open state, keyboard navigation, Escape, focus return, and outside-click close.

Behavior contract for custom menu:

- Trigger has `aria-haspopup="menu"` and `aria-expanded`.
- Menu has `role="menu"` when it is an action menu.
- Menu items have `role="menuitem"` or appropriate checkbox/radio menu roles.
- Escape closes the menu and returns focus to trigger.
- Arrow keys move focus through menu items.
- Disabled items are skipped by keyboard navigation.

Motion:

- Menu may fade and translate slightly from its trigger.
- Reduced motion should open instantly.

### Progress Bar / Spinner

Purpose: standalone progress for uploads, multi-step flows, background work, and indeterminate loading.

Recommended classes:

- `.ds-progress`
- `.ds-progress-bar`
- `.ds-progress-label`
- `.ds-progress-value`
- `.ds-spinner`
- `.ds-spinner-sm`
- `.ds-spinner-lg`

Behavior:

- Prefer native `<progress>` for determinate progress.
- Use CSS spinner only for indeterminate states.
- Spinner must have accessible text nearby or `aria-label`.

Example:

```html
<label class="ds-progress-label" for="upload-progress">Upload</label>
<progress id="upload-progress" class="ds-progress" value="64" max="100">64%</progress>
```

Reduced motion:

- Spinner should stop or switch to a static loading mark.

### Pagination

Purpose: navigation for data tables, search results, and list views.

Recommended classes:

- `.ds-pagination`
- `.ds-pagination-list`
- `.ds-pagination-item`
- `.ds-pagination-link`
- `.ds-pagination-ellipsis`

Behavior:

- Use `<nav aria-label="Pagination">`.
- Current page should use `aria-current="page"`.
- Disabled previous/next controls should use `aria-disabled="true"` and be non-interactive.

### Breadcrumb

Purpose: page hierarchy navigation.

Recommended classes:

- `.ds-breadcrumb`
- `.ds-breadcrumb-list`
- `.ds-breadcrumb-item`
- `.ds-breadcrumb-link`
- `.ds-breadcrumb-separator`

Behavior:

- Use `<nav aria-label="Breadcrumb">`.
- Current page should use `aria-current="page"`.
- Separators should be decorative or hidden from screen readers.

### Avatar

Purpose: user/entity image or initials with consistent sizing.

Recommended classes:

- `.ds-avatar`
- `.ds-avatar-img`
- `.ds-avatar-initials`
- `.ds-avatar-status`
- `.ds-avatar-xs`
- `.ds-avatar-sm`
- `.ds-avatar-md`
- `.ds-avatar-lg`
- `.ds-avatar-xl`

Behavior:

- No JavaScript required.
- Image avatars need useful `alt` text if meaningful.
- Decorative avatars should use empty `alt=""`.
- Initials must have accessible surrounding text if the initials alone are ambiguous.

### Empty State

Purpose: consistent no-data, no-results, and first-use states.

Recommended classes:

- `.ds-empty`
- `.ds-empty-icon`
- `.ds-empty-title`
- `.ds-empty-description`
- `.ds-empty-actions`

Behavior:

- No JavaScript required.
- Use icon only as a supporting visual.
- Message must be concise and action-oriented.

## Files To Update

Expected implementation files:

- `primitives.css` — add primitive classes.
- `motion.css` — add only reusable functional keyframes/timing if needed.
- `tokens.css` — add semantic tokens only if existing tokens cannot express the primitive safely.
- `themes/*.css` — add concrete private values for any new theme-backed token.
- `examples/components/` — add complete examples and state matrix rows.
- `examples/studio/` — add diagnostic coverage in the Primitives tab only; do not duplicate every showcase page.
- `tests/e2e/visual.spec.js` — add smoke/screenshot coverage for new primitives.
- `README.md` — document new public primitive categories.
- `docs/tokens.html` — regenerate if token categories changed.

Avoid changing:

- Third-party adapter files unless a primitive requires adapter integration.
- Fixture app behavior unless explicitly testing adoption.
- Generated `dist/` by hand; use `npm run build`.

## Token Rules

- Do not put concrete color values in `tokens.css`.
- Do not rename or delete existing tokens.
- Prefer existing spacing, radius, typography, z-index, duration, opacity, and field-height tokens.
- Add new tokens only when they represent a reusable contract, not a one-off implementation detail.
- New theme-backed tokens must be added to every theme file and to `themes/auto.css` light/dark branches.

Potential token additions if needed:

- `--switch-width`
- `--switch-height`
- `--switch-thumb-size`
- `--tab-indicator-height`
- `--spinner-size`
- `--spinner-border-width`

Do not add these preemptively. Use existing tokens if the implementation remains clear.

## Motion Rules

Allowed functional motion:

| Primitive | Motion | Purpose |
|---|---|---|
| Switch | Thumb translate | Shows on/off state changed |
| Tabs | Indicator translate | Shows active tab changed |
| Accordion | Content reveal | Shows content expanding/collapsing |
| Dropdown/Menu | Fade + slight translate | Connects menu to trigger |
| Modal, if touched | Fade + small scale | Shows layer appeared |

Reduced motion requirements:

- All motion must use duration tokens from `motion.css`.
- `prefers-reduced-motion: reduce` must remove or minimize movement.
- Reduced motion must not leave controls in an intermediate visual state.

## Accessibility Requirements

Every primitive must cover:

- Keyboard focus visibility.
- Disabled state.
- High contrast token usage.
- Reduced motion fallback when animated.
- Correct native element or ARIA role.
- Screen-reader-safe labels and state.

Do not implement a custom interactive primitive if its behavior contract is not documented.

## Examples Requirements

`examples/components/` should show:

- Default state.
- Hover/focus-ready styling where applicable.
- Disabled state.
- Invalid/error state for form primitives.
- Selected/active state for navigation primitives.
- Loading/progress state where applicable.
- Reduced-motion compatibility should be covered by CSS/tests, not by visible explanatory text in the app.

Keep visible page text practical. Do not add long in-app explanations of how the primitives work.

## Testing Requirements

Before declaring this milestone complete:

```bash
npm run lint:css
npm run audit:contrast
npm run build
npm run test:e2e
```

Also verify:

- New examples render in `examples/components/`.
- Studio Primitives tab still renders and remains diagnostic.
- Theme screenshots include new primitives across all themes.
- Auto light/dark screenshots still pass.
- No network 404s appear in Playwright.
- Snapshot count increases only because intentional new screenshots were added or updated.

If tokens changed:

```bash
npm run docs:generate
```

Then verify `docs/tokens.html` includes the new public tokens.

## Stop Conditions

Stop and ask a human if:

- A primitive requires non-trivial JavaScript to be accessible and no behavior contract exists.
- A requested primitive needs framework-specific code.
- A token addition would require guessing theme values with unclear design intent.
- A new primitive would require broad adapter changes.
- Visual regression snapshots change outside the intended primitive sections.
- The implementation requires hardcoded colors outside themes, fixtures, or documented mocks.

## Definition of Done

Milestone 5 is complete when:

- Phase 1 primitives are implemented, documented, and visually covered.
- CSS uses tokens only.
- Reduced motion behavior is implemented.
- Accessibility behavior contracts are documented for JS-required primitives.
- Examples and Studio render the new primitives.
- Playwright screenshots cover the new primitives on desktop and mobile.
- `lint:css`, `audit:contrast`, `build`, and `test:e2e` pass.

