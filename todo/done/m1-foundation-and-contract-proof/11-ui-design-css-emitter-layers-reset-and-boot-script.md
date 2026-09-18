---
title: 'ui-design/css: emitter, layers, reset and boot script'
tags: [ui-design, css]
depends_on: [10]
group: M1 — Foundation and contract proof
completed_at: 2026-09-18T15:03:39Z
---
`src/css/emit.ts`, `layers.ts`, `reset.ts`, `boot.ts` — the opt-in `/css`
subpath. `emitTokensCss()` returns CSS text, never a component.

## Scope

- Four emission blocks, in this order:

      :root { --canvas: #FBFBFA; … }
      @media (prefers-color-scheme: dark) {
        :root:not([data-scheme="light"]) { --canvas: #191919; … }
      }
      :root[data-scheme="dark"]     { --canvas: #191919; … }
      :root[data-density="compact"] { --control-h: 28px; … }

- Component defaults written first, theme values second — same selector, same
  specificity, later wins.
- `@layer base, rmx`; element defaults go in `@layer base`.
- The global `prefers-reduced-motion: reduce` reset, zeroing every duration so no
  component opts in individually.
- `bootScript` — no-flash scheme and density restore.
- Tests pin that the emitted text carries no backticks and no unescaped `<`, `>`
  or `&`.

## From the spec

> **Composition into one stylesheet.** `ui-remix/src/tokens.ts` aggregates every
> component's record and exports the union of their names as a type. The emitter
> writes component defaults first and theme values second — same selector, same
> specificity, later wins. No cascade-layer subtlety for custom properties and no
> import-order trap.

> `prefers-reduced-motion: reduce` zeroes every duration globally in the emitted
> sheet, so no component opts in.

> It also retires the two traps mionso carries from injecting a template literal
> as `<style>` text — no backticks, and no `<`, `>` or `&`, both pinned by tests
> there.

> `emitTokensCss()` stays exported for anyone who prefers to write a static file
> and use `<link>`.

## Done when

- Emitted CSS matches the block order and precedence above, under test.
- `emitTokensCss()` is importable from `@lemol/ui-design/css`, and the base entry
  does not pull it in.
