# Changelog

## 0.6.0

- Add complete night forms to Professional, Healthcare, SaaS, Minimal, Forest,
  and Ocean. Existing day values remain unchanged.
- Support root `data-mode="light"`, `"dark"`, and `"auto"` for brand themes,
  including native `color-scheme` and live device preference changes.
- Audit day/night completeness, forced/device night parity, and contrast using
  the same text and non-text pairs for every form.
- Add persisted Day / Night / Device controls and scoped day/night gallery
  previews to the examples.
- Add an isolated computed-value browser suite (`npm run test:e2e:modes`), with
  a configurable `DS_MODES_PORT` (default 8094) and no server reuse or snapshots.
