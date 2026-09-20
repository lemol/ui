---
title: "CopyButton: --copy clipboard write and confirm"
tags: [ui-remix]
group: M2 — Catalogue
completed_at: 2026-09-20T16:23:10Z
outcome: completed
---
Clipboard write plus an in-place confirmation — one of the six named runtime
behaviours.

## Scope

- `src/remix/copy-button/` — `copy-button.tsx`: a `<button
  command="--copy" commandfor="...">`, minted via a small factory the same
  way `overlay()` mints dialog ids, pointing at the element (or a
  `data-copy-value` attribute on itself) holding the text to copy.
- `--copy` registered in `src/remix/runtime.ts`: `navigator.clipboard.writeText`,
  then swaps the button's label/icon to a confirmation state for a fixed
  duration (reuse the same `scheduleDismiss`-shaped timer pattern as
  [[05-toaster]] if it fits, rather than a second implementation).
- With the runtime absent, the button is inert (no clipboard API without JS)
  — document that as the accepted degradation rather than adding a
  `<input readonly>` fallback nobody asked for.
- `ui-copy-btn-*` tokens, likely delegating most of them to `Button`'s
  contract rather than inventing a parallel set.
- Register in `src/remix/demos.ts`.

## Done when

- Clicking copies the target text and shows the confirmation state, verified
  by a browser test.
- The confirmation reverts after its timer without leaking the interval on
  repeated clicks.
