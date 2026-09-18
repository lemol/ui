# @lemol/ui-remix

Remix 3 components, and the `--ui-*` token contract each one declares beside
itself. Also `ThemeStyle`, which puts an emitted stylesheet into the document,
and the two files that are the whole of this repo's hand-written client code.

Depends on `@lemol/ui-design` and `remix/ui`, and on nothing else.

## Entry points

| Import | Holds | Ships to the browser |
| --- | --- | --- |
| `@lemol/ui-remix` | The components, their token records, `ThemeStyle`. | Only what a page uses. |
| `@lemol/ui-remix/runtime` | The single capture-phase `command` listener. | Yes. |
| `@lemol/ui-remix/compat` | The Invoker Commands backfill. | Yes. |
| `@lemol/ui-remix/demos` | The demo for each component, for the playground. | No. |

**Import the runtime from its own subpath, never from the barrel** — otherwise
the bundle pulls the component library in behind it.

## Catalogue

### `Button` / `LinkButton`

`Button` renders a `<button>`, defaulting `type` to `"button"` because a bare
button inside a form submits it. `LinkButton` renders an `<a>` and requires
`href`: `aria-disabled` on an anchor does not prevent navigation, so a disabled
link is a broken link.

Two axes, thirty-one tokens in `button/tokens.ts`:

| Axis | Values | Comes from |
| --- | --- | --- |
| `tone` | `primary`, `neutral`, `ghost`, `danger` | `--ui-btn-<tone>-{bg,ink,border,bg-hover}` |
| `size` | `md`, `sm` | `--control-h` and `--control-h-sm`, so density reaches it |

Neither component styles focus. The reset owns the ring, and it applies because
nothing in the component competes with it. `:active` reuses the hover
background. Disabled is three tone-independent tokens rather than an opacity
ratio, and its override sits inside each tone's own `css()` block rather than
in the shared base block — see
[design-system.md](../../docs/design-system.md#cascade-layers) for why a
`css()` call's sub-layer, not just its specificity, decides which declaration
wins.

Tone backgrounds use the `background` shorthand, so a skin may set
`--ui-btn-<tone>-bg` to a gradient — `background-color` would drop a gradient
as invalid. Gradients do not interpolate, so a gradient skin swaps instantly on
hover while the flat default transitions.

**`mix` adds; it does not override.** It reliably sets properties the component
leaves alone — `position`, a grid placement, a margin the surrounding layout
owns. It does not reliably override a property the component declares, and
composing it last does not change that: each `css()` block is its own cascade
sub-layer, layer order beats specificity inside a layer, and sub-layer order
follows the order blocks are first encountered during the render rather than the
order of the `mix` array. A descriptor already rendered on an earlier element
registers first and loses to the component's own tone.

To change a property the component declares, set its `--ui-btn-*` token — that
is what the tier is for, and it reaches every instance instead of one call site.
`!important` also wins, since no component here declares one, but reaching for
it means a token is missing. See
[design-system.md](../../docs/design-system.md#cascade-layers).

### `ThemeStyle`

Renders `emitTokensCss()`'s string into the document, defaulting to this
package's aggregate:

```tsx
<ThemeStyle theme={miniTheme} />
```

**It belongs in `<head>`.** `remix/ui` splices its own component styles in
immediately before `</head>`, so a `ThemeStyle` in the body is evaluated after
the `rmx` layer exists — and `@layer base, rmx;` then registers `base` after
it, inverting the order with no error. See
[design-system.md](../../docs/design-system.md#delivery).

## Limits

- **A component never hard-codes a colour, radius, duration or space step.** It
  declares its own tokens in `src/<name>/tokens.ts`, each defaulting relationally
  to a primitive, and reads only that tier. A skin is a set of token values; it
  is never a forked component.
- **SPA-safe.** No `node:*`, no `bun`, no `effect`, and no server-side `remix/*`
  entry — `remix/router`, `remix/routes`, `remix/assets`, `remix/spa` are all
  out. `test/boundaries.test.ts` enforces it, which is what makes SPA
  portability a checked property rather than an intention.
- **One delegated, capturing listener.** `CommandEvent` does not bubble, and a
  non-delegated listener dies on the first frame navigation, so behaviours go
  through `--` custom commands read by the single listener in `runtime.ts`.
- **Never hand-write a `commandfor` id.** A mismatch is a dead click with no
  error and no warning. Use the `overlay()` factory, which binds both halves.
- **Native first.** Check the ladder in
  [interactivity.md](../../docs/interactivity.md#the-ladder) before writing DOM
  code.
- **No build step, and `remix` is the only peer.**

## Structure

One directory per component, holding the component, its token record, its demo
and its test:

```
src/button/button.tsx  tokens.ts  button.demo.tsx  button.test.tsx
```

Co-location is what keeps the demo from drifting from the component.
`src/tokens.ts` aggregates every component's record and exports the union of
their names as a type.

## Reading

[design-system.md](../../docs/design-system.md) for the contract and emission
order, [interactivity.md](../../docs/interactivity.md) for the command protocol
and the browser baseline, [motion.md](../../docs/motion.md) for entry and exit
transitions.

## Status

`Button`, `LinkButton` and `ThemeStyle` ship. `src/tokens.ts` aggregates the
component records and exports `ComponentTokenName`; `src/demos.ts` registers
one demo. `runtime.ts` and `compat.ts` are still stubs — nothing here needs
client JavaScript yet.
