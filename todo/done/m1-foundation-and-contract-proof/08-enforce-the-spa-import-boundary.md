---
title: Enforce the SPA import boundary
tags: [test]
depends_on: [6]
group: M1 — Foundation and contract proof
completed_at: 2026-09-18T04:16:14Z
---
`test/boundaries.test.ts` — the allow and deny import lists for the three
packages. It lands before any feature code so that it gates everything after it,
rather than being satisfied retroactively.

## Scope

- Applies to `packages/*`. `apps/playground` is a composition root and may import
  what it likes.
- Follows todo-md's `test/boundaries.test.ts` precedent.

## From the spec

> ```
> ui-design, ui-remix and ui-remix-mini may import:
>     remix/ui, remix/ui/*, @lemol/ui-design
> must NOT import:
>     node:*, bun, effect, remix/router, remix/routes, remix/assets, remix/spa
> ```
>
> "Runs in SPA mode" becomes a property the build checks.

> What would break portability is a component reaching for a server-only import.
> So it is enforced rather than trusted.

## Done when

- The test fails when a denied import is added to any of the three packages.
- `bun run check` is green.
