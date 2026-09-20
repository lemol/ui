---
title: "Breadcrumbs: route links with aria-current"
tags: [ui-remix]
group: M2 — Catalogue
completed_at: 2026-09-20T16:34:24Z
outcome: completed
---
Route links with `aria-current` — no client state, since these are
server-rendered apps and the current page is known at render time.

## Scope

- `src/remix/breadcrumbs/` — `breadcrumbs.tsx` (`Breadcrumbs`, list of
  `<a>`/current-page `<span aria-current="page">`), `tokens.ts`,
  `breadcrumbs.test.tsx`, `breadcrumbs.demo.tsx`. Check whether `remix/ui`
  ships a `breadcrumbs` primitive already (the M2 plan's ladder table lists
  it among what `remix/ui` provides) before writing separator/list markup by
  hand.
- `ui-breadcrumbs-*` tokens: separator glyph/colour, link ink, current-page
  ink, gap.
- Register in `src/remix/demos.ts`.

## Done when

- Renders correctly with the runtime absent (it never needed JS).
- The current item is marked with `aria-current="page"`, not just a visual
  style.
