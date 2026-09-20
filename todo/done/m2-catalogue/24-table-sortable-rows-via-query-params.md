---
title: "Table: sortable rows via query params"
tags: [ui-remix]
group: M2 — Catalogue
completed_at: 2026-09-20T08:46:05Z
outcome: completed
---
Server-rendered rows and nothing else — sorting is a link with a query
param, not client state. Virtualized tables are explicitly out of scope
(see the M2 plan).

## Scope

- `src/remix/table/` — `table.tsx` (`Table`, `TableHead`, `TableRow`,
  `TableCell`, a sortable column header that is an `<a>` toggling
  `?sort=field&dir=asc|desc`), `tokens.ts`, `table.test.tsx`,
  `table.demo.tsx`.
- `ui-table-*` tokens: row height (respecting `--row-h` / `--row-h` compact
  swap from the density axis), header background, hairline, hover surface,
  cell padding.
- Register in `src/remix/demos.ts`, with a demo that includes a sortable
  column so the pattern is visible in the catalogue rather than only
  documented.

## Done when

- `/c/table` renders correctly with the runtime absent, including sorting via
  plain links.
- Density switch (`compact`) visibly changes row height with no component
  edit.
