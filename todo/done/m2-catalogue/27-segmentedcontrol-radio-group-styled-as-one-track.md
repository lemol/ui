---
title: "SegmentedControl: radio group styled as one track"
tags: [ui-remix]
group: M2 — Catalogue
completed_at: 2026-09-20T15:56:04Z
outcome: completed
---
A radio group styled as a single segmented track — native semantics, no new
JS.

## Scope

- `src/remix/segmented-control/` — `<fieldset>` of native
  `<input type="radio">` (`opacity:0` + `<label>` as the visible segment), a
  sliding indicator done in pure CSS with `:has()` or a `checked` sibling
  selector — no JS to track the active segment.
- `ui-segmented-*` tokens: track background, segment padding, active segment
  background/ink, radius, indicator transition duration/easing.
- `tokens.ts`, `segmented-control.test.tsx`, `segmented-control.demo.tsx`.
- Register in `src/remix/demos.ts`.

## Done when

- Selecting a segment works with the runtime absent (it's native radio
  buttons underneath).
- The active-segment transition is token-driven, not a literal duration.
