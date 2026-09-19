# @lemol/ui-remix

Remix 3 components, and the `--ui-*` token contract a component declares beside
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

### `Stack` / `Row` / `Grid` / `Container`

Layout, and **no tokens of their own** — the contract proved from the opposite
side to `Button`. Each reads primitives directly and declares no `--ui-*`, so
none of them appears in `src/tokens.ts` and a skin retunes them by changing the
primitives they read — the space scale, `--page-max`, `--gutter` — rather than
the components.

| Component | Layout props | Declares |
| --- | --- | --- |
| `Stack` | `gap`: a space step. `align`: `start`, `center`, `end`, `baseline`, `stretch` | `display: flex`, `flex-direction: column` |
| `Row` | `gap` and `align` as above. `justify`: `start`, `center`, `end`, `between`, `around`, `evenly`. `wrap`: a boolean | `display: flex` |
| `Grid` | `gap`. `cols`: `1` to `6` | `display: grid` |
| `Container` | none | `max-inline-size: var(--page-max)`, `padding-inline: var(--gutter)`, `margin-inline: auto` |

`gap` is a step on the primitive space scale — `gap={4}` is `var(--sp-4)` — and
its type derives from `schema.space`, so a step the schema does not hold is a
typecheck failure. The Record of blocks is shared in `src/space.ts`, and `align`
in `src/align.ts`, because `remix/ui` caches a `css()` block by content: a copy
per component would collapse to one sub-layer anyway and save nothing while
still drifting.

**Which axes have defaults, and why it matters.** `gap` defaults to `0` and
`Row`'s `align` to `center`; both blocks therefore always render. `Stack`'s
`align`, `Row`'s `justify` and `wrap`, and `Grid`'s `cols` render no block
unless asked for — `wrap` unless it is `true`, the others unless the prop is
passed — which leaves those properties fully reachable through `mix`. See
[design-system.md](../../docs/design-system.md#cascade-layers) for the rule and
the cost of giving an axis a default.

`Container` has no layout props because it has nothing to decide: both of its
lengths are primitives a theme sets. It cannot change its tag either, so a
caller wanting `<main>` wraps it rather than configuring it.

`cols` stops at six. Twelve is the convention for grid systems that count
*spans*; these are equal `1fr` tracks, and more than six of them is unreadable
at any width `--page-max` permits. A judgement, not a schema constraint.

`Grid` has no responsive mode. `repeat(auto-fit, minmax(…))` needs a track
minimum and the schema holds no primitive for one; a caller-supplied length
would be the only open-ended value in the package. Until a sizing ramp exists,
a responsive track list goes through `mix`, which is reliable precisely because
`cols` was not passed.

### `Heading` / `Text` / `Eyebrow`

The type scale as a contract. `Heading` separates the document outline from the
appearance: `level` picks the element, `size` picks the step and defaults to
`level`, so an `h3` that has to look like an `h5` needs no escape hatch.

| Axis | Values | Comes from |
| --- | --- | --- |
| `Heading` `level` | `1` to `6`, required | The element rendered |
| `Heading` `size` | `1` to `6`, defaults to `level` | `--ui-heading-<n>-size` |
| `Text` `size` | `sm`, `md`, `lg` | `--ui-text-size-<size>` |
| `Text` `tone` | `default`, `muted`, `subtle` | `--ui-text-ink*` |
| `Text` `as` | `p`, `span`, `div` | The element rendered |
| `Eyebrow` | no axes | `--ui-eyebrow-*`, all five |

The six heading sizes default from `headingScale` in `@lemol/ui-design`, which
is also where the reset gets the sizes it gives a bare `h1`–`h6`. One map, so a
heading nobody wrapped in the component and one that went through it cannot
drift apart.

`Text` declares no `font-weight`, so `mix={css({ fontWeight: "var(--fw-semibold)" })}`
is reliable. `Heading`, `Text` and `Eyebrow` all declare `color`, so their ink
goes through the contract — `tone` on `Text`, the token on the other two.

### `ThemeStyle`

Renders `emitTokensCss()`'s string into the document, defaulting to this
package's aggregate:

```tsx
<ThemeStyle theme={miniTheme} />
```

**It belongs in `<head>`.** `remix/ui` splices its own component styles in
immediately before `</head>`, so a `ThemeStyle` in the body is evaluated after
the `rmx` layer exists — and `@layer rmx-reset, base, rmx;` then registers
`base` after it, inverting the order with no error. See
[design-system.md](../../docs/design-system.md#delivery).

## Limits

- **A component never hard-codes a colour, radius, duration or space step.** It
  declares its own tokens in `src/<name>/tokens.ts`, each defaulting relationally
  to a primitive, and reads only that tier — or it declares none and reads
  primitives directly, as the layout components do. A skin is a set of token
  values; it is never a forked component.
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

One directory per component, holding the component, its demo, its test, and its
token record if it has one:

```
src/button/button.tsx  tokens.ts  button.demo.tsx  button.test.tsx
src/stack/stack.tsx               stack.demo.tsx   stack.test.tsx
```

Dropped rather than aligned: `heading/` is another instance of the "with
`tokens.ts`" row above, not a third case.

Co-location is what keeps the demo from drifting from the component. A missing
`tokens.ts` is a claim, not an omission: that component styles itself from
primitives and structural keywords alone, and its test fails on a `--ui-`
anywhere in its output. `src/tokens.ts` aggregates every component's record and
exports the union of their names as a type. A Record of blocks more than one
component uses sits at the package root instead: `src/space.ts`,
`src/align.ts`.

## Reading

[design-system.md](../../docs/design-system.md) for the contract and emission
order, [interactivity.md](../../docs/interactivity.md) for the command protocol
and the browser baseline, [motion.md](../../docs/motion.md) for entry and exit
transitions.

## Status

`Button`, `LinkButton`, `Stack`, `Row`, `Grid`, `Container`, `Heading`, `Text`,
`Eyebrow` and `ThemeStyle` ship. `src/tokens.ts` aggregates the component
records and exports `ComponentTokenName`; the four layout components add nothing
to it, which is what they exist to demonstrate, and the three typographic ones
add twenty-two between them. `src/demos.ts` registers eight demos. `runtime.ts`
and `compat.ts` are still stubs — nothing here needs client JavaScript yet.
