---
title: 'Typography: Heading, Text, Eyebrow and the type scale'
tags: [ui-remix]
depends_on: [12]
group: M1 — Foundation and contract proof
completed_at: 2026-09-18T23:00:31Z
outcome: completed
---
`Heading`, `Text`, `Eyebrow` — the type scale expressed as a contract.

## Scope

- One directory per component, each with a server-render test and a
  `*.demo.tsx`.
- Contract tokens defaulting relationally to the primitive type scale from
  `ui-design`.
- Element defaults for headings and body text belong in `@layer base` via
  `ui-design/css`'s reset, not in these components.

## From the spec

> `Heading` / `Text` / `Eyebrow` (type scale)

> **Element defaults go in `@layer base`.** Unlayered CSS beats layered CSS, so
> reach for unlayered only when a rule must beat a component, and say why.

## Done when

- `bun run check` is green.
- The type scale renders at both densities.
