---
title: 'Contract proof: Button through all three packages'
tags: [ui-remix, contract]
depends_on: [7, 11]
completed_at: 2026-09-18T17:04:07Z
---
The load-bearing task of M1: `Button` / `LinkButton` styled only through
`--ui-btn-*`, the aggregator, `ThemeStyle`, `mini`'s theme, the cross-package
type wiring, and `/c/button` rendering in light, dark and compact with no client
JavaScript.

If the contract is wrong, it is wrong here — before a catalogue sits on it.

## Scope

- `ui-remix/src/button/` — `button.tsx`, `tokens.ts`, `button.test.tsx`,
  `button.demo.tsx`. Tone and size form the token contract.
- `ui-remix/src/tokens.ts` aggregating every component's record and exporting the
  union of their names as a type.
- `ui-remix/src/theme-style.tsx` — `ThemeStyle`, wrapping `ui-design`'s pure
  `emitTokensCss()`. A `<style>` element is valid in the body and applies
  document-wide, so it renders in server mode and inside the SPA tree with no
  special casing.
- `ui-remix-mini/src/theme.ts` — `base` / `dark` / `compact`.
- The type wiring, which lives in `mini` because `mini` is the package that
  depends on both.
- `mix` as the structural escape hatch.
- The component reads only `var(--ui-btn-*)` and never a raw colour, radius,
  duration or space step.

## From the spec

> ```ts
> // ui-remix/src/button/tokens.ts
> export const buttonTokens = {
>   "ui-btn-primary-bg":  "var(--accent)",
>   "ui-btn-primary-ink": "var(--ink-inverse)",
>   "ui-btn-radius":      "var(--r-sm)",
> }
> ```

> A skin is then a set of token values. mionso keeps its exact gradient by
> overriding one value and never touching the component:
>
> ```ts
> "ui-btn-primary-bg":
>   "linear-gradient(180deg, var(--accent-highlight), var(--accent) 65%, var(--accent-bronze))",
> ```

> Because `ui-remix-mini` depends on both packages, it wires the types together:
> `defineTheme` requires every primitive and type-checks every `--ui-*` override
> against the names `ui-remix` actually declares. A renamed token fails the
> typecheck instead of the design review.

> **Escape hatch.** Every component accepts `mix` for one-off structural
> overrides. Differences that cannot be expressed as a CSS value go there, not
> into a fork.

## Done when

- Renaming a token in `button/tokens.ts` fails `bun run typecheck` at `mini`'s
  theme.
- Overriding `ui-btn-primary-bg` with a gradient changes the rendered button with
  no edit to `button.tsx`.
- `/c/button` renders in light, dark and compact with the runtime absent.
