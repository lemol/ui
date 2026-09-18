---
title: 'Layout: Stack, Row, Grid and Container'
tags: [ui-remix]
depends_on: [12]
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
