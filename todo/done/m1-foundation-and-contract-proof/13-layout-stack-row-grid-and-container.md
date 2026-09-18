---
title: 'Layout: Stack, Row, Grid and Container'
tags: [ui-remix]
depends_on: [12]
group: M1 — Foundation and contract proof
completed_at: 2026-09-18T20:43:42Z
---
`Stack`, `Row`, `Grid`, `Container` — and the point of this task is that they
declare **no tokens of their own**. They stress the contract from the opposite
direction to `Button`: a component that consumes the primitive space scale
directly and adds nothing to the aggregator.

## Scope

- One directory per component, each with a server-render test and a
  `*.demo.tsx` beside it.
- `mix` escape hatch.
- No entries in `ui-remix/src/tokens.ts`. If one of these turns out to need a
  contract token, that is a finding worth recording as a comment here, not a
  quiet addition.

## From the spec

> `Stack` / `Row` / `Grid` / `Container` (layout, no tokens of their own)

> A narrow `ui-remix` chosen to stress the contract from different angles.

## Done when

- `bun run check` is green.
- The four components appear in the catalogue via their demos.

## Comments

### @leza.lutonda at 2026-09-18 19:22:03 +00:00

Finding: Grid ships a fixed `cols` count only. Responsive auto-fit needs a track minimum for `repeat(auto-fit, minmax(<min>, 1fr))`, and `schema.sizing` holds no primitive for one — `control-h`, `control-h-sm`, `row-h`, `row-pad-y`, `page-max` and `gutter` are all something else. The alternative, a caller-supplied `min="16rem"`, would be the one open-ended length in the package: every call site writes a magic number the schema cannot vet, which is exactly the escape these four components are meant not to have. Deferred rather than added quietly, per this task's own instruction. Adding a sizing ramp is a `ui-design` schema change, and M2's `Table` and `CommandPalette` are better placed than a guess made here to say what that ramp should be.
