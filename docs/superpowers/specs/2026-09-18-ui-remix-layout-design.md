# ui-remix: Stack, Row, Grid and Container

Date: 2026-09-18
Task: M1 / 13
Status: implemented

Four layout components that declare **no tokens of their own**. `Button`
proved the contract by reading nothing but `--ui-btn-*`; these prove it from
the other side, by reading nothing but primitives and structural keywords and
adding nothing to `ui-remix/src/tokens.ts`.

That constraint is the whole design problem. A layout component needs a space
step, the contract forbids hard-coding one, and the tier that normally supplies
it is closed off. The value has to arrive from the call site instead, and the
mechanism it arrives by decides everything else.

## Why the constraint is right, not merely imposed

Worth settling first, because the obvious reading is that task 13 is being
awkward.

A `--ui-stack-gap` token would let a theme retune every stack at once. But a
stack's gap is a composition decision, not a brand decision: two stacks on one
page routinely want different gaps, and a single themeable value cannot express
that. Adding the token would not remove the need for a per-instance prop — it
would leave both, and the token would be the one nobody sets.

The one component where a themeable value *is* right is `Container`, whose
maximum width genuinely is one decision per application. The token schema
already spent two primitives on exactly that case:

> `page-max` and `gutter` exist because task 13 requires `Container` to declare
> **no tokens of its own**, so its maximum width has to be a primitive.
>
> — `2026-09-18-ui-design-token-schema-design.md`, "`sizing` — 6"

So there is no gap for a contract token to fill. "No tokens of their own" is a
correct description of these four components, not a restriction on them.

## The gap channel

Three ways a caller's chosen step could reach CSS.

**Inline `style`.** `remix/ui` accepts `style?: string | StyleProps`, so
`style={{ gap: "var(--sp-4)" }}` works and needs no lookup table. It is also
unlayered, and unlayered CSS beats every layer — `mix`, a skin and an
application stylesheet would all lose to it without `!important`. `CLAUDE.md`
permits unlayered only when a rule must beat a component, and here nothing
must. It also repeats the declaration on every element rather than sharing one
class. Rejected: it trades the property this repo has invested the most in for
a small saving in source.

**A `--ui-*` token.** Rejected above, and forbidden by the task, which says a
needed contract token is a finding to record rather than a quiet addition.

**A static `Record` of `css()` descriptors, keyed by step.** Chosen. It is the
mechanism `Button` already uses for `sizeStyles`, so there is in-repo
precedent and the existing test helpers cover it. The gap block is an ordinary
`rmx` sub-layer, so a skin and an application rule can still reach it. The prop
type derives from `schema.space`, so a step the schema does not hold is a
typecheck failure rather than a `var()` that silently resolves to nothing.

Its cost is twelve descriptor objects per gap axis at module load. Only the
blocks actually rendered are emitted, so the stylesheet does not grow. Its one
real consequence is stated in "The always/optional split" below.

### `space.ts`

Overtaken: `align` is shared too and shipped as a second module, `src/align.ts`
— see "Two refinements to the spec" in
`../plans/2026-09-18-ui-remix-layout.md`.

Stack, Row and Grid need the same Record and the same type. Three copies would
drift, and `remix/ui` caches a `css()` block by content — so three identical
copies collapse to one sub-layer anyway and save nothing. The Record lives once
at `src/space.ts`, beside the existing `tokens.ts`, `demos.ts` and `compat.ts`.

The step type is derived rather than restated:

```ts
type StepName = (typeof schema.space)[number]          // "sp-0" | "sp-1" | …
export type SpaceStep = StepName extends `sp-${infer N extends number}`
  ? N
  : never                                              // 0 | 1 | … | 24
```

Adding `sp-32` to the schema widens every gap prop with no edit here. The
Record is built from the same source, so the two cannot disagree:

```ts
export const gaps = Object.fromEntries(
  schema.space.map((name) => [name.slice(3), css({ gap: `var(--${name})` })]),
) as Record<SpaceStep, CSSMixinDescriptor>
```

The cast is the one unchecked step: `Object.fromEntries` widens to
`{ [k: string]: … }`. It is safe because both the keys and the type come from
`schema.space`, and a mismatch would be a typecheck failure at the use site
rather than a runtime miss.

## The surface

| | Props | Base block |
| --- | --- | --- |
| `Stack` | `gap`, `align`, `mix`, `children` | `display: flex; flex-direction: column` |
| `Row` | `gap`, `align`, `justify`, `wrap`, `mix`, `children` | `display: flex` |
| `Grid` | `gap`, `cols`, `mix`, `children` | `display: grid` |
| `Container` | `mix`, `children` | `max-inline-size: var(--page-max)`, `padding-inline: var(--gutter)`, `margin-inline: auto` |

All four render a `div`. `mix` is `MixInput<HTMLDivElement>`.

Alignment values are structural keywords, not tokens, so promoting them to
props does not touch the contract — they are the same kind of value as
`Button`'s `display: inline-flex`.

- `align` (Stack, Row): `start`, `center`, `end`, `baseline`, `stretch`. The
  logical `start` and `end` keywords are supported across the whole browser
  baseline.
- `justify` (Row): `start`, `center`, `end`, `between`, `around`, `evenly`.
- `wrap` (Row): boolean, emitting `flex-wrap: wrap`.
- `cols` (Grid): `1`–`6`, emitting `repeat(n, 1fr)`. Six is the ceiling because
  more than six equal `1fr` tracks is unreadable at any width `--page-max`
  permits; it is a judgement, not a constraint from the schema.

`Container` takes no props because it has nothing to decide: both of its
lengths are primitives, and block spacing belongs to the `Stack` inside it
rather than to the container around it.

### `Container` is not polymorphic

`mix` cannot change a tag name, so a caller wanting `<main>` or `<section>`
wraps the `Container` rather than configuring it. An `as` prop is a real
question and belongs to whichever later task first needs it, with the
accessibility implications considered then.

## Grid has no responsive mode yet

`cols` is a fixed count. Responsive auto-fit —
`repeat(auto-fit, minmax(<min>, 1fr))` — needs a track minimum, and the schema
holds no primitive for one: `sizing` has `control-h`, `control-h-sm`, `row-h`,
`row-pad-y`, `page-max` and `gutter`, none of which is a grid track floor.

The alternative is a caller-supplied length, `<Grid min="16rem">`. The
component would hard-code nothing, but it would be the one open-ended length in
the package: every call site and the demo would write a magic number the schema
cannot vet, and the point of this task is that these components have no such
escape.

So it is deferred and recorded as a comment on task 13, per the task's own
instruction. Adding a sizing primitive is a `ui-design` schema change, and M2's
`Table` and `CommandPalette` are more likely to establish what that ramp should
be than a guess made here.

## The always/optional split

`docs/design-system.md` already requires a component's own `css()` blocks to be
property-disjoint: if two blocks can declare the same property, sub-layer order
decides which paints, and that order follows render order rather than source
order and is not stable across a client session.

For `Button` that is satisfied by construction — base, size and tone happen not
to overlap. Here it is a design constraint with a visible consequence, because
a default value and an explicit value want to set the *same* property. Putting
`gap: var(--sp-0)` in the base block and a step block over the top of it is
exactly the arrangement the rule forbids.

The resolution is that a block with a default always renders, carrying the
default as its value, and a block without one renders only when its prop is
passed:

| Block | Renders | Default |
| --- | --- | --- |
| `gap` | always | `0`, so `var(--sp-0)` |
| `Row` `align` | always | `center` |
| `Stack` `align` | only when passed | browser `stretch` |
| `Row` `justify` | only when passed | browser `flex-start` |
| `Row` `wrap` | only when passed | browser `nowrap` |
| `Grid` `cols` | only when passed | no `grid-template-columns` |

Optional-render has a second benefit worth naming. `mix` reliably **adds** a
property the component does not declare, and reliably overrides nothing. A
block that does not render declares nothing — so `<Row mix={css({ justifyContent:
"space-between" })}>` is reliable for every caller who does not also pass
`justify`, and a bare `<Grid>` leaves `grid-template-columns` entirely to the
caller. Each optional axis is therefore prop-driven *or* mix-driven at the
caller's choice, and only using both at once is ambiguous — which is visibly
the caller's error rather than a silent one.

`gap` defaults to `0` rather than to a step for the reason the token was
rejected: spacing is a per-instance decision, so the component should not
presume one. `Row`'s centring is the single presumption worth making, because
it is right in almost every horizontal row and the alternative — stretched
items of unequal height — is a bug in almost every one.

## Tests

One `*.test.tsx` per component directory, using the `test/render.ts` and
`test/styles.ts` helpers as they stand. No new helper is needed.

Overtaken: one was — `nonPrimitiveValues`, because all four tests needed the
same filter. See "Two refinements to the spec" in
`../plans/2026-09-18-ui-remix-layout.md`.

- **Server render.** The element, its children, and the class it carries.
- **The contract, mirrored.** `Button`'s test asserts every declaration value
  *is* a `var(--ui-btn-*)`. These assert the inverse: every value is a
  structural keyword or a primitive the schema holds, and `var(--ui-` appears
  nowhere in the emitted CSS. That is the machine-checkable form of "no tokens
  of their own", and it fails the moment someone adds one.
- **Property-disjointness.** `sharedProperties(blocks)` is empty for every
  combination of props, not just the default one — a default that collides with
  an explicit value is precisely the failure the split above prevents.
- **Optional-render.** A bare instance emits no block for any optional axis.
  Without this, the split is a convention rather than a checked property, and
  the first person to "simplify" a default back into the base block reintroduces
  the collision silently.
- **Derivation.** `space.ts`'s Record holds a descriptor for every name in
  `schema.space`, so a schema addition cannot leave a step unreachable.
- **Demos.** Each demo renders every value of each axis it demonstrates.

## Playground

Four entries in `src/demos.ts`, which is the only wiring required: `/c/:component`
resolves through `isDemoName`, so the route works as soon as the entry exists.

Demos are styled from primitives, following the precedent `button.demo.tsx`
sets — a demo is a page, not a component. The `Container` demo needs a visible
edge to show its maximum width, which it draws with `var(--hairline)` and
`var(--surface)`.

## Documents to correct

- `packages/ui-remix/README.md` — catalogue entries for the four, the
  always/optional-render rule, and a Status update.
- `docs/design-system.md` — the always/optional-render rule, as a corollary in
  the existing property-disjointness section. It generalises beyond layout:
  every later component with a defaulted axis faces the same collision.

## Out of scope

- A sizing primitive for grid track minimums, and `Grid`'s responsive mode with
  it.
- An `as` prop on `Container`.
- A catalogue index page. The home page still says nothing is catalogued; that
  was already true of `Button` and is task 19's to fix.
- Rewriting `apps/playground/app/ui/catalogue.tsx` to use `Container`. It is a
  sensible follow-up and it is not this task's deliverable.
