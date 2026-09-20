---
title: "Spinner / Skeleton: loading indicators, reduced motion"
tags: [ui-remix]
group: M2 — Catalogue
completed_at: 2026-09-20T16:48:19Z
outcome: completed
---
Loading indicators — pure CSS animation, no JS, and the one place
`prefers-reduced-motion` visibly matters for a component that's otherwise
"just" decorative.

## Scope

- `src/remix/spinner/` — `spinner.tsx` (`Spinner`, CSS `@keyframes` rotation),
  `tokens.ts`, `spinner.test.tsx`, `spinner.demo.tsx`.
- `src/remix/skeleton/` — `skeleton.tsx` (`Skeleton`, a shimmering placeholder
  block), `tokens.ts`, `skeleton.test.tsx`, `skeleton.demo.tsx`.
- Both animations respect the global `prefers-reduced-motion: reduce` reset
  already in the emitted sheet (`src/design/css/reset.ts` or wherever M1 put
  it) — verify by reading the emitted CSS rather than assuming; do not add a
  second, component-local reduced-motion query.
- `ui-spinner-*` / `ui-skeleton-*` tokens: size, stroke/track colour,
  animation duration (named token, not a literal).
- Register both in `src/remix/demos.ts`.

## Done when

- Both render as static (non-distracting) elements under
  `prefers-reduced-motion: reduce`, verified against the actual emitted CSS
  rule, not a new one.
- Duration comes from a named token in both.
