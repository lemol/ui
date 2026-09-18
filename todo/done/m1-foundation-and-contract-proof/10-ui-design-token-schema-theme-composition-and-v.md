---
title: 'ui-design: token schema, theme composition and v()'
tags: [ui-design]
depends_on: [6]
group: M1 — Foundation and contract proof
completed_at: 2026-09-18T06:02:32Z
---
`src/tokens.ts`, `src/theme.ts`, `src/ref.ts`. Strings and data only — nothing
here is a component, which is precisely what lets a future `ui-opentui` share
this package.

## Scope

- Primitive token schema: categories and types. Colour, radius, space, the type
  scale, control and row heights.
- **Motion primitives land here, not in M5.** Duration tokens `--dur-instant`
  (80ms) through `--dur-slow` (400ms); easings `--ease-out-quad`,
  `--ease-spring`, `--ease-in-out-smooth`. `Dialog` cannot ship its transition
  without them.
- `defineTheme` / `extendTheme` over two axes only: `base`, optional `dark`,
  optional `compact`.
- `v()` — typed token reference.
- `ui-design` never learns which components exist; it takes a record. The
  `--ui-*` type wiring is proven in the contract-proof slice, not here.

## From the spec

> - **Scheme.** A theme declares `base` values and an optional `dark` override.
> - **Density.** A `compact` override, the four-token swap already proven in
>   mionso (`--control-h`, `--control-h-sm`, `--row-h`, `--row-pad-y`).

> **Typing.** `ui-design` never learns which components exist; it takes a record.

> Duration tokens `--dur-instant` (80ms) through `--dur-slow` (400ms); easings
> `--ease-out-quad`, `--ease-spring`, `--ease-in-out-smooth`. Components name
> tokens, never literal curves or millisecond values.

> A third axis (contrast, brand) waits until something needs one; a general
> named-modes mechanism was rejected as speculative.

## Done when

- A theme omitting `dark` typechecks — dark-only or light-only is legal, and is
  what mionso will declare.
- `bun run check` is green.
