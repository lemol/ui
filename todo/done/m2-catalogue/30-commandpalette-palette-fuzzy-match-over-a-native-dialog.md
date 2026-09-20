---
title: "CommandPalette: --palette fuzzy match over a native dialog"
tags: [ui-remix]
group: M2 — Catalogue
completed_at: 2026-09-20T16:11:54Z
outcome: completed
---
The other component needing hand-written JS, and the one the spec calls out
as the model for how to test it: "extract the palette's match rule as a pure
function and test it directly."

## Scope

- `src/remix/command-palette/` — `command-palette.tsx`, built on a native
  `<dialog>` (from `Dialog`/`overlay()`, M1) rather than a popover, since a
  palette wants a modal focus trap.
- A server-rendered `<input>` plus a full list of items in the markup — with
  the runtime absent, every item is visible and clickable (a long list, not a
  filtered miss).
- `--palette` registered in `src/remix/runtime.ts`: on input, calls a pure
  `matchItems(query, items) -> Item[]` function (fuzzy substring/subsequence
  match — pick one algorithm, document the choice) and toggles `hidden` on
  the non-matching `<li>` elements. No virtual DOM, no re-render.
- `matchItems` lives in its own module (`command-palette/match.ts`) and is
  tested directly with a table of query/items/expected-order cases — this is
  the "pure logic extracted and tested directly" example the spec names.
- `ui-palette-*` tokens: shared with `Dialog`'s surface tokens where
  reasonable rather than duplicating them.
- Register in `src/remix/demos.ts`.

## Done when

- `matchItems` has a unit test table independent of the DOM.
- Typing filters the visible list once hydrated (browser test — one of the
  six runtime behaviours).
- With the runtime absent, every item is present and reachable by keyboard.
