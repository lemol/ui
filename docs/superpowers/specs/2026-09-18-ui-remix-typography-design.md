# ui-remix: Heading, Text and Eyebrow

Date: 2026-09-18
Task: M1 / 14
Status: designed

Three components that put the type scale on the contract. `Button` reads
nothing but `--ui-btn-*`; the layout four read nothing but primitives and
structural keywords. Typography is the first place where both tiers have to
describe the same property, and settling why is most of this design.

## Two tiers for one property

A `<button>` nobody wrapped in `Button` is rare. A heading nobody wrapped in
`Heading` is not: markdown rendering, pasted markup, and any HTML the
application did not author all produce bare `h1`–`h6`. The reset already
concedes this — it gives them `font-weight`, `letter-spacing` and
`line-height` from primitives at zero specificity. It stops short of
`font-size`, so the single most visible typographic property of a bare heading
is still the user agent's `2em`, a literal no theme can reach.

So both tiers describe heading size: `@layer base` is the floor for markup
nobody wrapped, and `--ui-heading-*` is the retheming surface for markup that
went through the component. They are different jobs, not duplication.

The constraint is that they cannot share a value by reference. `ui-design`
never learns which components exist, so its reset cannot name `--ui-heading-*`;
and `ui-remix` cannot have its defaults silently disagree with the floor those
same elements land on.

### `headingScale`

`ui-design` exports the mapping as data and derives its own CSS from it:

```ts
// ui-design/src/tokens.ts
export const headingScale = {
  1: "fs-3xl",
  2: "fs-2xl",
  3: "fs-xl",
  4: "fs-lg",
  5: "fs-md",
  6: "fs-sm",
} as const
```

| | h1 | h2 | h3 | h4 | h5 | h6 |
| --- | --- | --- | --- | --- | --- | --- |
| | `fs-3xl` | `fs-2xl` | `fs-xl` | `fs-lg` | `fs-md` | `fs-sm` |

`h5` lands on body size and `h6` below it. Both stay distinct through the
`fw-bold` + `tr-tight` + `lh-tight` the existing rule carries, and the choice
leaves `fs-xs` and `fs-2xs` unclaimed by headings — which is where `Eyebrow`
and the smaller UI of tasks 15 and 16 live.

This is not new API surface of a new kind. `h1`–`h6` are HTML elements, not
components, so exporting their scale tells `ui-design` nothing about
`ui-remix`. The reset already derives a block from exported data:
`reducedMotionCss` is built by filtering `schema.motion` for `dur-` names
rather than keeping a second list that can drift. `headingScale` is the same
move for the same reason.

The reset emits six flat rules from it — flat because the sheet ships as the
text of a style element, where a nested rule arrives broken:

```
:where(h1) { font-size: var(--fs-3xl); }
…
```

`ui-remix` imports it for its defaults, so `--ui-heading-2-size` and a bare
`<h2>` cannot disagree by construction. The alternative — both files spelling
the primitives out, with a test reading `resetCss` to pin them together —
detects divergence rather than preventing it, and buys only that
`heading/tokens.ts` stays a readable literal the way `button/tokens.ts` is.
The keys stay literal either way, so `mini`'s excess-property rename check
still fires on a renamed token.

## `Heading`

`level` is required. A heading with no level is a document-outline bug, and
there is no default that is right more often than it is wrong.

`size` defaults to `level` and overrides it. Decoupling the two is the whole
reason this component is more than a tag switch: a card title inside a page
that already has an `h2` must be an `h3` for the outline and should look
smaller than one, and a sidebar section label is often an `h2` that should
look like body text. Without `size`, neither is reachable — `mix` cannot
reliably beat a property the component declares, and setting
`--ui-heading-2-size` at the call site retunes every `h2` in that subtree.

| Block | Renders | Declares |
| --- | --- | --- |
| base | always | `font-weight`, `letter-spacing`, `line-height`, `color` |
| size | always | `font-size: var(--ui-heading-<size>-size)` |

The size block always renders, carrying the level's default. That is task 13's
always/optional split: a default and an explicit value want the same property,
so one block owns it and carries the default, rather than a base block
declaring it and a second block painting over — which sub-layer order, not
source order, would decide.

Ten tokens. Six sizes, plus `--ui-heading-weight` → `fw-bold`,
`--ui-heading-tracking` → `tr-tight`, `--ui-heading-leading` → `lh-tight`, and
`--ui-heading-ink` → `ink`. The middle three restate one tier up what the reset
gives a bare heading, for the same reason the sizes do.

`--ui-heading-ink` is a deliberate trade. Because `color` is declared,
`mix={css({ color: … })}` stops being reliable and the token becomes the path.
Headings in a different hue from body text is a routine brand move, so it is
better retunable through the contract than reachable through an escape hatch
that works by accident.

### The tag

`level` picks between `h1` and `h6`. Whether `remix/ui` accepts a string in
component position — ``const Tag = `h${level}`; <Tag>`` — is unverified. If it
does not, six literal branches. The plan settles it against `bun run check`
rather than guessing here, and the component's surface is the same either way.

## `Text`

| Prop | Values | Default |
| --- | --- | --- |
| `size` | `sm`, `md`, `lg` | `md` |
| `tone` | `default`, `muted`, `subtle` | `default` |
| `as` | `p`, `span`, `div` | `p` |

Three blocks, property-disjoint by construction: base declares `line-height`,
size declares `font-size`, tone declares `color`. All three always render,
because all three have defaults.

Seven tokens: `--ui-text-size-sm` / `-md` / `-lg` → `fs-sm` / `fs-md` /
`fs-lg`, `--ui-text-leading` → `lh-base`, and `--ui-text-ink` /
`-ink-muted` / `-ink-subtle` → `ink` / `ink-muted` / `ink-subtle`.

### `as`, and why it lands here

`Container`'s spec deferred an `as` prop to "whichever later task first needs
one". This is that task. A `<p>` inside a `<p>` is invalid markup the parser
silently unnests, so without `as` every inline use — a muted suffix inside a
sentence, a label beside a `Badge` in a `Row` — is a bare `<span>` styled by
hand, off the contract. Inline muted text is most of the `ink-muted` on a real
page, which makes that the common case rather than an edge.

The accessibility question `Container` deferred does not arise: `p`, `span` and
`div` differ in block-versus-inline layout and in nothing an assistive
technology reports. A polymorphic prop that could reach `section` or `main`
would be a different question, and this is not it.

`mix` is typed `MixInput<HTMLParagraphElement | HTMLSpanElement |
HTMLDivElement>` if that stays assignable where the JSX element expects the
concrete type, and `MixInput<HTMLElement>` with a comment if it does not.
`MixInput<node extends EventTarget>` accepts the union; whether it survives
assignment is a variance question the plan answers with a typecheck.

### No `weight` prop

`font-weight` is not declared, so `mix={css({ fontWeight: "var(--fw-semibold)" })}`
is reliable — the mix-driven half of task 13's rule, used on purpose. A
`weight` prop would add a fourth block and three tokens to reach what already
works, and it would take the property away from `mix` in the process.

## `Eyebrow`

Small, uppercase, widely tracked. No props but `mix` and `children`; renders a
`<p>`.

One block, five tokens: `--ui-eyebrow-size` → `fs-2xs`, `-weight` →
`fw-semibold`, `-tracking` → `tr-wider`, `-ink` → `ink-muted`, and
`-transform` → `uppercase`.

This closes a loop the schema opened. `tr-wider` is in `schema.type` because of
this component — the token-schema spec says so — and a primitive with no
consumer that can vary it is a value nobody can check.

`--ui-eyebrow-transform` holds a bare keyword rather than a primitive, so
`uppercase` joins `transparent` and `1px` in the `allowedLiterals` set in
`ui-remix/src/tokens.test.ts`. That is the intended cost: the list exists so a
non-primitive default is argued for rather than tolerated, and here the
argument is that `uppercase` is taste, not structure. `display: inline-flex` in
`Button` is structural — change it and the component stops working. Caps are a
brand decision, and a brand that sets things in sentence case must be able to
say `--ui-eyebrow-transform: none` rather than fork the component, which is
what "a skin is a set of token values, never a forked component" requires.

No leading token. An eyebrow is one line, and the inherited `lh-base` is right
on the rare occasion it wraps.

## Density

Type is density-invariant. `compact` keeps swapping the four `sizing` tokens
and nothing else, so toggling density retunes controls and rows while line
lengths, wrapping and the `--page-max` measure stay put.

`/c/:component?density=compact` already works, so the done-when is checked by
loading the demos under both densities. What is being checked is that nothing
shifts.

A density type ramp remains available and needs no component change: `compact:
{ "fs-md": …, … }` in `mini`'s theme reaches every consumer. That it is a pure
theme edit is the evidence the tier boundary is in the right place. It is not
made here because it would move `Button`, `Field` and `Badge` on a second axis
at once while proving nothing about this task's contract.

## Tests

One `*.test.tsx` per component directory, on the existing `test/render.ts` and
`test/styles.ts` helpers.

- **Server render.** The element, its children, and the class it carries.
  `Heading` over every level; `Text` over every `as` value.
- **The contract.** Every declaration value is a `var(--ui-<component>-*)`,
  mirroring `button.test.tsx`. A literal size, colour or tracking here is the
  failure these components exist to prevent.
- **Property-disjointness.** `sharedProperties(blocks)` is empty for every
  combination of props, not only the default one.
- **Decoupling.** `<Heading level={2} size={4}>` emits an `h2` carrying
  `--ui-heading-4-size`. Without this, the two props can silently collapse back
  into one.
- **Derivation.** Every level in `headingScale` has a token in
  `headingTokens`, and `resetCss` names the primitive `headingScale` gives each
  element. A level added to the scale cannot be left unreachable by either
  tier.
- **The allow-list.** `uppercase` is listed, so a fourth non-primitive default
  still fails.
- **Demos.** Each demo renders every value of each axis it demonstrates.

`ui-design`'s `reset.test.ts` gains the six `font-size` rules.

## Playground

Three entries in `src/demos.ts`. `/c/:component` resolves through `isDemoName`,
so the route works as soon as the entry exists.

Demos are styled from primitives, as `button.demo.tsx` and the layout demos
are: a demo is a page, not a component.

## Documents to correct

- `packages/ui-remix/README.md` — catalogue entries for the three, and a Status
  update.
- `packages/ui-design/README.md` — `headingScale` in the exports, and the
  element defaults the reset now covers.
- `docs/design-system.md` — the sentence saying `--ui-btn-border-width` is the
  only non-primitive default "at present", with `--ui-eyebrow-transform`'s
  reason beside it. The same edit settles a discrepancy that predates this
  task: `allowedLiterals` already holds `transparent` for the ghost tone, so
  the sentence is either counting CSS-wide keywords as primitives or it is
  wrong. Pick one deliberately and say which.

## Out of scope

- A prose measure on `Text` (`max-inline-size: 65ch`). It is a layout decision
  about a column, not a property of the text in it, and nothing in M1 needs it.
- A density type ramp in `mini`.
- An `as` prop on `Container`. `Text`'s `as` reaches three interchangeable tags;
  `Container`'s would reach landmarks, and that is the question its spec
  deferred.
- Semantic tones on `Text`. `danger` and `success` text arrives with `Badge` in
  task 16, which is where the semantic token set gets designed.
- A catalogue index page, still task 19's.
