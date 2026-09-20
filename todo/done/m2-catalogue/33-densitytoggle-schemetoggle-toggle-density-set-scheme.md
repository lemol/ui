---
title: "DensityToggle / SchemeToggle: --toggle-density / --set-scheme"
tags: [ui-remix]
group: M2 — Catalogue
completed_at: 2026-09-20T16:29:37Z
outcome: completed
---
Persisting the two choices the playground's switchers already make via query
params ([[../m1-foundation-and-contract-proof]] shipped those as server-side
forms) — these are the always-on, no-page-reload versions, backed by
`bootScript`'s no-flash restore.

## Scope

- `src/remix/density-toggle/` and `src/remix/scheme-toggle/` — each a button
  with `command="--toggle-density"` / `command="--set-scheme"` and a
  `commandfor` pointing at `document.documentElement` (or an id'd wrapper —
  match whatever `bootScript` already reads/writes in
  `src/design/css/boot.ts`, since these two must agree with it exactly or the
  no-flash guarantee breaks on the next load).
- `--toggle-density` / `--set-scheme` registered in `src/remix/runtime.ts`:
  set `data-density` / `data-scheme` on `<html>`, persist to the same storage
  key `bootScript` reads.
- With the runtime absent, both toggles are inert — the page still renders in
  whatever `bootScript` restored server-side/inline, which is the accepted
  degradation (no-JS means no live switching, not a broken theme).
- `tokens.ts` for both, `*.test.tsx`, `*.demo.tsx` for both.
- Register both in `src/remix/demos.ts`.

## Done when

- Toggling either persists across a full page reload with the runtime
  present, with no flash of the old value (verified against `bootScript`'s
  read, not a new storage key).
- Both are simple, inert buttons with the runtime absent.
