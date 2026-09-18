---
title: 'Badge: the semantic token set'
tags: [ui-remix]
depends_on: [12]
---
`Badge` — the third angle on the contract: a component whose tokens are
*semantic* (success, warning, danger, info) rather than structural, so it tests
whether the primitive layer carries enough meaning to default against.

## Scope

- Semantic tone tokens defaulting relationally to primitives.
- Server-render test plus a `badge.demo.tsx`.
- If a semantic primitive is missing from `ui-design`'s schema, adding it is part
  of this task.

## From the spec

> `Badge` (semantic tokens)

> Each component declares its own tokens beside itself, defaulting relationally
> to a primitive.

## Done when

- Every tone reads only `var(--ui-badge-*)`.
- `bun run check` is green.
