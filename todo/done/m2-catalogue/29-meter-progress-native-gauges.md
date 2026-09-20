---
title: "Meter / Progress: native gauges"
tags: [ui-remix]
group: M2 — Catalogue
completed_at: 2026-09-20T16:02:24Z
outcome: completed
---
Pure native: `<meter>` for a value against a range, `<progress>` for
determinate/indeterminate progress. No JS either way.

## Scope

- `src/remix/meter/` — `meter.tsx` (`Meter` wrapping `<meter>`, `Progress`
  wrapping `<progress>`), `tokens.ts`, `meter.test.tsx`, `meter.demo.tsx`.
- `ui-meter-*` tokens: track background, fill colour per state (native
  `:-webkit-meter-optimum-value` etc. have poor cross-browser styling hooks,
  so lean on `<progress>`'s more stylable value/track model where the demo
  needs a themed look; keep `<meter>` for genuine gauge semantics).
- Indeterminate `<progress>` (no `value` attribute) gets the native browser
  animation — do not reimplement it in CSS or JS.
- Register in `src/remix/demos.ts`.

## Done when

- Both render correctly with the runtime absent.
- Fill colour responds to theme tokens without a component edit.
