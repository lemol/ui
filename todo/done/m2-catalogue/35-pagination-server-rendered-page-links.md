---
title: "Pagination: server-rendered page links"
tags: [ui-remix]
group: M2 — Catalogue
completed_at: 2026-09-20T16:41:56Z
outcome: completed
---
Server-rendered `?page=n` links — pairs naturally with [[04-table]]'s demo
but ships as its own component.

## Scope

- `src/remix/pagination/` — `pagination.tsx` (prev/next, page-number links,
  ellipsis for a long range), `tokens.ts`, `pagination.test.tsx`,
  `pagination.demo.tsx` wired into the `Table` demo's data so the catalogue
  shows the real pattern rather than a standalone widget.
- `ui-pagination-*` tokens: control size (reads `--control-h-sm`), active
  page background/ink, hover surface, gap.
- Register in `src/remix/demos.ts`.

## Done when

- Every control is a real `<a href>` — a page is reachable without JS and
  without a click handler.
- The active page is marked with `aria-current="page"`.
