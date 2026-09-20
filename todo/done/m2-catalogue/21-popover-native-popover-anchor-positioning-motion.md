---
title: "Popover: native popover, anchor positioning, motion"
tags: [ui-remix]
group: M2 — Catalogue
completed_at: 2026-09-20T08:25:23Z
outcome: completed
---
The floor everything else in M2 stands on: `Menu`, `Toaster` and
`CommandPalette` all sit on this. Native `popover` for top layer, light
dismiss and Esc — zero client JS for the open/close mechanism itself.

## Scope

- `src/remix/popover/` — `popover.tsx`, `tokens.ts`, `popover.test.tsx`,
  `popover.demo.tsx`.
- Extend `overlay()` (`src/remix/dialog/overlay.ts`) or add a sibling factory
  so a popover trigger/target pair is minted together, same reasoning as
  `Dialog`: a hand-written `commandfor` id is a dead click with no error.
- `command="toggle-popover"` / `"show-popover"` / `"hide-popover"`, native —
  no runtime command needed for open/close.
- Placement: `anchor-name` / `position-anchor` / `position-area` behind
  `@supports (anchor-name: --a)`, degrading to a centered or statically
  placed popover when unsupported. Anchor names minted by the component, never
  hand-written (same failure class as `commandfor` and view-transition names).
- Motion: `@starting-style` + `transition-behavior: allow-discrete`, the
  `transition` shorthand declared twice, duration/easing tokens from
  `docs/motion.md` — not literals.
- `ui-popover-*` tokens (surface, border, radius, shadow, gap) in
  `tokens.ts`, aggregated into `src/remix/tokens.ts`.
- Register in `src/remix/demos.ts`.

## Done when

- `/c/popover` opens and dismisses with the runtime absent (no-JS render
  test passes).
- Placement degrades gracefully behind `@supports`, verified by reading the
  emitted CSS in the server-render test rather than a browser test.
- Overriding a `ui-popover-*` token changes the rendered popover with no edit
  to `popover.tsx`.
