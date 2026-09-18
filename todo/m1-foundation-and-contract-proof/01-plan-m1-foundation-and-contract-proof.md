---
title: 'Plan M1: foundation and contract proof'
tags: [planning]
---
Plan the M1 implementation. Full spec: `docs/superpowers/specs/2026-09-17-lemol-ui-architecture-design.md`.

M1 proves the component-token contract end to end before committing a whole catalogue to it. `Field` and `Dialog` are in the slice deliberately — form integration and overlay behaviour are where a contract breaks, not `Button`.

## @lemol/ui-design (complete)

    src/tokens.ts       primitive token schema: categories + types
    src/theme.ts        defineTheme, extendTheme
    src/ref.ts          v() -- typed token reference
    src/css/emit.ts     emitTokensCss() -> string
    src/css/layers.ts   @layer base, rmx
    src/css/boot.ts     bootScript (no flash)
    src/css/reset.ts    element defaults

`/css` is an opt-in subpath. Everything here is strings and data, never a component — that is precisely what lets a future `ui-opentui` share this package.

## @lemol/ui-remix (narrow slice)

- `Button` / `LinkButton` — tone and size token contract
- `Stack` / `Row` / `Grid` / `Container` — layout, no tokens of their own
- `Heading` / `Text` / `Eyebrow` — the type scale
- `Field` — native form controls and constraint validation
- `Badge` — semantic tokens
- `Dialog` + `overlay()` — native `<dialog>`, Invoker Commands, compat
- `ThemeStyle` — renders ui-design's emitted sheet into the document
- `src/tokens.ts` — aggregates every component's contract, exports the name union
- `src/compat.ts` — Invoker Commands backfill (~15 lines)

## The contract (the point of M1)

Each component declares its own tokens beside itself, defaulting relationally to a primitive:

    // ui-remix/src/button/tokens.ts
    export const buttonTokens = {
      "ui-btn-primary-bg":  "var(--accent)",
      "ui-btn-primary-ink": "var(--ink-inverse)",
      "ui-btn-radius":      "var(--r-sm)",
    }

The component reads only `var(--ui-btn-*)` and never a raw colour, radius, duration or space step. The emitter writes component defaults first and theme values second — same selector, same specificity, later wins, so no cascade-layer subtlety for custom properties and no import-order trap.

`ui-design` never learns which components exist; it takes a record. `mini` depends on both packages and wires the types, so `defineTheme` requires every primitive and type-checks every `--ui-*` override against the names `ui-remix` actually declares. Every component takes `mix` as the structural escape hatch.

## Theme variants

Two axes only — scheme and density:

    export const miniTheme = defineTheme({
      base:    { canvas: "#FBFBFA", surface: "#FFFFFF", ink: "#111111", hairline: "#EAEAEA" },
      dark:    { canvas: "#191919", surface: "#242424", ink: "#F4F4F0", hairline: "#3A3A3A" },
      compact: { "control-h": "28px", "row-h": "32px" },
    })

Emitted as `:root`, then `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-scheme="light"])`, then `:root[data-scheme="dark"]`, then `:root[data-density="compact"]`.

## @lemol/ui-remix-mini

`theme.ts` plus `shell.tsx` / `states.tsx` with `Document`, `AppShell`, `Nav`, `EmptyState`, `ErrorState`. The wiring is the fiddly part, not the components: boot script before the stylesheet, runtime imported from its own subpath so the barrel does not drag the library into the browser bundle, `run()` resolving `clientEntry` through the asset server.

Rich, not a floor — it must be a visible upgrade over todo-md's current UI. It must **not** re-export `ui-remix`.

## apps/playground

Catalogue at `/c/:component`, built from `*.demo.tsx` files colocated with each component and exposed as `@lemol/ui-remix/demos` — colocation is what makes drift impossible. Plus one composed page recipe, theme/scheme/density switchers as query params and a form (rendering is server-side, so knobs need no JS), a no-JS toggle that omits the runtime and compat scripts, and one `/spa/*` route proving portability.

## Enforced boundary

`test/boundaries.test.ts` — the three packages may import `remix/ui`, `remix/ui/*` and `@lemol/ui-design`; they must not import `node:*`, `bun`, `effect`, `remix/router`, `remix/routes`, `remix/assets` or `remix/spa`. This makes "runs in SPA mode" a checked property rather than a claim.

## Composition-root edits (in the workspace repo, not here)

Add `ui` to `workspace.yaml`; add `repos/ui/packages/*` and `repos/ui/apps/*` to the root `workspaces`; add `file:` overrides for the three packages; order the ui packages before todo-md in `tools/verify-order.ts`.

## Baseline and tooling

Chrome 114+ / Safari 17+ / Firefox 125+ — the Popover API floor. Invoker Commands used natively with the compat shim behind them; anchor positioning behind `@supports (anchor-name: --a)`. Bun as package manager, test runner and runtime; Remix's asset server for browser assets; no bundler and no build step for the packages; no Effect dependency, so `remix` is the only peer.

## Tests

A server-render test per component via `remix/ui/server`. Browser tests only for runtime behaviours — a DOM shim would only test the shim. A no-JS render test asserting a dialog is complete markup with the runtime absent. Plus the boundaries test above.

## Motion (mechanism, not polish)

Motion tokens land here, and `Dialog` ships its entry/exit transition when it
is built — not in a later pass. Retrofitting `@starting-style` into a finished
catalogue costs more than three lines per component at the time, and an
unanimated `Dialog` becomes the reference everyone copies.

- Duration tokens `--dur-instant` (80ms) through `--dur-slow` (400ms); easings
  `--ease-out-quad`, `--ease-spring`, `--ease-in-out-smooth`. Components name
  tokens, never literal curves or millisecond values.
- The global `prefers-reduced-motion: reduce` reset in the emitted sheet, which
  zeroes every duration so no component opts in individually.
- `Dialog` gets `@starting-style` + `transition-behavior: allow-discrete`, with
  the `transition` shorthand declared **twice** — the first without
  `allow-discrete`, so other properties still transition on engines lacking it.
- `@starting-style` must target the state being entered (`dialog[open]`, not
  `dialog`) and carries no specificity boost, unlike `@keyframes`.
- `overlay` is not Baseline and is absent in Safari, so exit animations degrade
  there while entry animations work. Accept that; do not add a JavaScript close
  sequence.

Details and the full rationale: `docs/motion.md`.
