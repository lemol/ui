# ui-design: token schema, theme composition and v()

Date: 2026-09-18
Task: M1 / 10
Status: agreed, not yet implemented

`packages/ui-design/src/{tokens,theme,ref}.ts`. Strings and data only. This is
the package a future `ui-opentui` shares, so nothing here may know what a
component is or what a renderer does.

## The four decisions

### 1. The schema holds names, never values

`tokens.ts` declares the vocabulary — groups, names, and the fact that a value
is a string. It holds no colours, no pixel counts, no curves. `defineTheme`
requires every primitive; `extendTheme` is how a theme avoids restating them.

**Why.** It is the only version of the package that provably holds no design.
`ui-design`'s README promises "no components, and no dependencies at all" on
the grounds that a terminal renderer can share it; a package shipping a hex
palette breaks that promise quietly, because the hexes are useless to the
terminal and nobody notices until someone writes the terminal.

**Cost accepted.** `ui-remix-mini` becomes the only complete value set in the
repo, and a theme written from scratch restates roughly 93 keys. A theme is
free to compute them — see decision 3.

**This contradicts `docs/design-system.md` as currently written** and that
document gets fixed as part of this task. See "Documents to correct".

### 2. Every value is `string`, and the schema is grouped by category

No template-literal types, no branded `Length` or `Color`, no per-token
category records. Names are grouped into seven arrays, and a value is a string.

**Why.** The guarantee the documents promise — "a renamed token fails the
typecheck instead of the design review" — is about *names*, and `defineTheme`
requiring every `PrimitiveName` delivers it completely. A rename breaks every
theme at compile time, pointing at the missing key.

A hand-written `Length` type is a denylist by omission of a grammar that keeps
growing. Admitting `calc()` and `clamp()` still leaves `min()`, `round()`,
`anchor-size()` — which `docs/interactivity.md` already commits us to — and
relative colour syntax for `Color`. Each omission blocks legal CSS until
someone edits this package, and the error prints the whole union at the object
literal rather than at the bad key.

Against that, the mistake it catches is a hex in the space ramp, which renders
visibly broken the first time anyone looks. It is not the silent-failure class
`docs/principles.md` §6 exists to forbid.

**Grouping is the cheap part of the alternative.** A category is derivable from
which array a name sits in, so:

- Task 11's `prefers-reduced-motion` reset can zero *every* duration by
  iterating `schema.motion`, rather than maintaining a second list.
- The emitter can order output by group.
- A future `ui-opentui` can ask which tokens are colours without this package
  carrying per-token category data or a CSS parser.

Widening a grouped array into a record of `{ category, … }` later is additive
and breaks no consumer. That is the cheap direction to be wrong in.

### 3. Semantic variants are named explicitly; components never derive them

Four arms per tone — `<tone>`, `<tone>-ink`, `<tone>-subtle`, `<tone>-border` —
named in the schema. Component token defaults must not contain `color-mix()`.

**Why.** Derivation does not remove the mix ratio, it relocates it into
`ui-remix/src/badge/tokens.ts` where it is permanent for every theme.
`docs/motion.md` already rules on this shape of thing: *"A literal `200ms` or
`cubic-bezier(...)` in a component is a bug… it cannot be retuned centrally."*
A literal `12%` is the same object. Retuning it under derivation means
overriding four tones across every component that uses semantics — Badge,
Field's invalid state, and whatever arrives later — instead of setting four
primitives once.

Two supporting reasons:

- **Explicit values can be opaque.** `color-mix(…, transparent)` is always
  translucent, so the same badge reads differently on `canvas` than on
  `surface`, and stacked translucent layers compound. A theme that wants a
  hand-picked opaque tint against a known surface cannot express it through
  derivation at all.
- **`danger-subtle` is consumed by two components** — Field (task 15) and Badge
  (task 16). Shared across components is the test for vocabulary rather than
  component detail.

**The authoring cost is not real.** A theme may compute its own values; the
schema only names them. `mini` can write a four-line local helper and get
twelve values from four seeds. That helper belongs in `mini`, decided in task
18 — **not** in `ui-design`, because the ratios are a design opinion and this
package holds none.

Contrast is the argument that nearly split this decision, and it lands the same
way: no mix percentage knows whether text on the result passes WCAG, which is
precisely why `<tone>-ink` is hand-picked.

### 4. Ramps are numeric and the number is a multiplier; sets are t-shirt sized

> Ramps you do arithmetic on are numeric, and their number is a multiplier.
> Sets you choose from are t-shirt sized.

Space is the only ramp: `sp-0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 24` at a 4px
base, so `sp-4` is 16px. Radius, font size, line height, tracking, weight,
duration and easing are all t-shirt sized.

**Why.** Both conventions already appear in the documents — `docs/design-system.md`
line 9 writes `--sp-4`, `--r-md` and `--dur-fast` in one breath — but the rule
has never been stated, so it has been inherited by accident. Stating it costs
no churn and settles every future token.

Space tokens are the most-typed tokens in the system, and `gap: var(--sp-3)`
telling a reader "12px" without a lookup is the whole benefit of a numeric
ramp. Dense numeric (`sp-0`…`sp-10`, meaning "the Nth step") is more honest
about the schema holding no values, but it discards exactly that benefit.

**The 4px base is a resolution, not a constraint.** A theme on an 8px grid uses
the even steps and skips the odd ones — `sp-2` is 8px, `sp-4` is 16px, the
multiplier stays true. Only a base that is not 4-divisible is excluded.

**Fluid spacing is excluded, deliberately.** `[data-density]` is this repo's
mechanism for adaptive spacing; clamped steps would be a second, overlapping
one, and they break `sp-2 + sp-2 = sp-4`, which is what "compose from the space
scale" in `docs/design-system.md` depends on.

**The multiplier is not enforced by the compiler.** Because the schema holds no
values, `sp-4: "3px"` typechecks and the name then lies to every reader. It is
checked where values exist instead — one test in the theme package. That test
belongs to task 18; it is recorded under "Inherited by later tasks" so it does
not get lost.

## What fluid type is, and is not

Fluid vs. fixed type is **not a schema decision**. The schema names `fs-2xl`;
a theme may supply `2.25rem` or `clamp(…)` and this package cannot tell. It
resurfaces in task 18.

One trap belongs in the record now: a `clamp()` whose middle term is pure `vw`
fails WCAG 1.4.4, because the text stops responding to the user's root font
size. The middle term needs a `rem` component — `clamp(1.5rem, 1rem + 2vw, 3rem)`,
not `clamp(1.5rem, 4vw, 3rem)`.

## The inventory

93 primitives across seven groups.

### `color` — 36

| Purpose | Names |
| --- | --- |
| Surfaces | `canvas`, `surface`, `surface-raised`, `surface-hover`, `surface-active` |
| Structure | `hairline`, `hairline-strong` |
| Ink | `ink`, `ink-muted`, `ink-subtle`, `ink-inverse` |
| Overlay | `scrim`, `focus` |
| Accent | `accent`, `accent-hover`, `accent-ink`, `accent-subtle`, `accent-border` |
| Links | `link`, `link-hover` |
| Semantic ×4 | `success`, `warning`, `danger`, `info`, each with `-ink`, `-subtle`, `-border` |

`<tone>` is the strong colour: solid fills, icons, and text sitting on
`<tone>-subtle`. `<tone>-ink` is what is readable *on* the solid fill. That
asymmetry is the only part of the naming worth memorising, and it is why
`<tone>-subtle` has no ink of its own.

### `space` — 12

`sp-0`, `sp-1`, `sp-2`, `sp-3`, `sp-4`, `sp-5`, `sp-6`, `sp-8`, `sp-10`,
`sp-12`, `sp-16`, `sp-24`. At a 4px base that is 0px to 96px.

### `radius` — 6

`r-xs`, `r-sm`, `r-md`, `r-lg`, `r-xl`, `r-pill`.

### `type` — 22

- Families: `font-sans`, `font-mono`
- Size: `fs-2xs`, `fs-xs`, `fs-sm`, `fs-md`, `fs-lg`, `fs-xl`, `fs-2xl`, `fs-3xl`
- Leading: `lh-tight`, `lh-snug`, `lh-base`, `lh-relaxed`
- Tracking: `tr-tight`, `tr-normal`, `tr-wide`, `tr-wider`
- Weight: `fw-regular`, `fw-medium`, `fw-semibold`, `fw-bold`

Tracking earns its place from `Eyebrow` (task 14), which is small, uppercase
and widely tracked.

### `motion` — 7

`dur-instant`, `dur-fast`, `dur-base`, `dur-slow`, `ease-out-quad`,
`ease-spring`, `ease-in-out-smooth`.

Fixed by the architecture spec, which pins `--dur-instant` at 80ms and
`--dur-slow` at 400ms. These land here rather than in M5 because `Dialog`
(task 17) ships its transition when it is built.

### `sizing` — 6

`control-h`, `control-h-sm`, `row-h`, `row-pad-y`, `page-max`, `gutter`.

The first four are the density swap. `page-max` and `gutter` exist because
task 13 requires `Container` to declare **no tokens of its own**, so its
maximum width has to be a primitive.

### `elevation` — 4

`shadow-sm`, `shadow-md`, `shadow-lg`, `focus-ring`.

`focus-ring` is a complete `box-shadow` value; the colour it references is
`focus`, in the colour group. Task 15 needs the ring as one token because a
two-ring focus style (offset against the surface, then the focus colour) is one
value, not a composable pair.

## The API

### `tokens.ts`

Names elided below; the full lists are in "The inventory" above.

```ts
export const schema = {
  color:     [...],
  space:     [...],
  radius:    [...],
  type:      [...],
  motion:    [...],
  sizing:    [...],
  elevation: [...],
} as const

export type TokenGroup     = keyof typeof schema
export type PrimitiveName  = (typeof schema)[TokenGroup][number]
export type PrimitiveTokens = { readonly [K in PrimitiveName]: string }

/** Every primitive name, flat, in group order. */
export const primitiveNames: readonly PrimitiveName[]

/** Which group a name belongs to. Built once from `schema`, not hand-written. */
export function groupOf(name: PrimitiveName): TokenGroup
```

`primitiveNames` and `groupOf` are derived from `schema` at module load. No
second list to keep in sync.

### `theme.ts`

```ts
export interface Theme<C extends string = never> {
  readonly base:    PrimitiveTokens & Readonly<Partial<Record<C, string>>>
  readonly dark:    Readonly<Partial<PrimitiveTokens & Record<C, string>>> | undefined
  readonly compact: Readonly<Partial<PrimitiveTokens & Record<C, string>>> | undefined
}

export function defineTheme<C extends string = never>(
  input: ThemeInput<NoInfer<C>>,
): Theme<C>

export function extendTheme<C extends string = never>(
  theme: Theme<C>,
  overrides: ThemeOverrides<NoInfer<C>>,
): Theme<C>
```

**`NoInfer<C>` is load-bearing, not decoration.** Without it, TypeScript infers
`C` from the argument, so `defineTheme({ base, dark: { nope: "x" } })` simply
infers `C = "nope"` and accepts the garbage. The seam has to be supplied
explicitly by `mini` or default to `never`; `NoInfer` is what forces that.
`extendTheme` wraps only its `overrides` parameter, because `C` must still be
inferred from the `theme` argument.

This was caught by compiling the design, not by reading it — see "Already
verified".

- **`base` is total, `dark` and `compact` are partial.** A theme omitting `dark`
  typechecks — that is task 10's stated "done when", and it is what mionso's
  theme will need.
- **`C` is the cross-package seam.** It defaults to `never`, so `ui-design`
  knows nothing about components, satisfying *"`ui-design` never learns which
  components exist; it takes a record."* `ui-remix-mini` supplies it:

  ```ts
  import type { ComponentTokenName } from "@lemol/ui-remix/tokens"
  export const miniTheme = defineTheme<ComponentTokenName>({ … })
  ```

  which is what makes a renamed `--ui-*` token fail `bun run typecheck` at
  `mini`'s theme. The `ui-remix` half of that is task 12.
- **Keys carry no `--` prefix**, matching the spec's
  `"ui-btn-primary-bg": "var(--accent)"`. The emitter adds it.
- **`dark` and `compact` are typed as partials of the whole record**, not
  restricted to a subset. Dark needs colours *and* shadows; restricting
  `compact` to the sizing group is a convention worth documenting but not worth
  a type that invites a fork the first time it is inconvenient.
- **`extendTheme` merges shallowly, per axis**, and mutates nothing. Both
  functions return frozen objects.
- **Neither validates at runtime.** The types are the check, and the package
  ships TypeScript with no build step, so there is no JS-consumer case to
  defend against.

### `ref.ts`

```ts
export function v(name: PrimitiveName): string   // `var(--${name})`
```

No fallback argument. A component token's default value *is* the fallback
mechanism, so `v("accent", "#f00")` would be a second way to do the same job
and the one that hides a missing token instead of surfacing it.

`v()` covers primitives only. `ui-design` cannot type `--ui-*` names without
learning what components exist, which is the one thing it must not do. If
`ui-remix` wants the same ergonomics for its own tier, that is task 12's
decision and it lives there.

### `index.ts`

Re-exports all three modules. It must not pull in `./css` — task 11's "done
when" pins that the base entry does not drag the emitter in.

## Tests

`bun:test`, colocated in `src/`.

| File | Asserts |
| --- | --- |
| `tokens.test.ts` | No name appears in two groups; `primitiveNames.length` equals the sum of the group lengths; `groupOf` round-trips for every name; every group is non-empty |
| `theme.test.ts` | `defineTheme` returns the input frozen; `extendTheme` merges per axis, leaves unmentioned axes intact, and does not mutate its argument; a theme with no `dark` survives both |
| `ref.test.ts` | `v("accent") === "var(--accent)"` |

Type-level behaviour is checked by `bun run typecheck` over the test files
rather than a separate runner: a fixture theme omitting `dark` must compile,
and `@ts-expect-error` marks a theme missing a primitive and a `dark` key that
is not a token name. `@ts-expect-error` fails the typecheck when the error it
claims does not occur, which is the assertion.

The existing `test/boundaries.test.ts` already covers SPA safety and needs no
change — this task adds no imports.

### Already verified

The whole design was written out against the real `tsconfig.json` and run
before this spec was finalised: `bun run check` — lint, typecheck and test —
came back green on all 93 tokens, and the files were then removed. Four type
assertions hold, the two negative ones via `@ts-expect-error`, which `tsc`
reports as an error when the directive is unused:

1. A theme omitting `dark` compiles.
2. A theme missing one primitive does not.
3. `defineTheme<ComponentTokenName>` accepts `--ui-*` keys in `base` and `dark`.
4. A key in `dark` that is neither a primitive nor a component token does not
   compile.

Two things were wrong on paper and are corrected above:

- **Assertion 4 failed on the first attempt.** `C` was inferred from the
  argument, so an unknown key just widened `C` instead of erroring. Fixed with
  `NoInfer<C>`.
- **`Object.freeze({ ...a, ...b })` does not typecheck under
  `exactOptionalPropertyTypes`.** Spreading two partials produces optional
  properties that include `undefined`, which the target rejects. The merge
  helper carries one localised cast.

`(typeof schema)[TokenGroup][number]` survives `as const` tuples and
`noUncheckedIndexedAccess`. Biome reports no lint violations; it does reformat
the schema arrays to one name per line, which makes `tokens.ts` about 112
lines. The risk left in implementation is the inventory itself, not the types.

## Documents to correct

`CLAUDE.md` requires that when code and a document disagree, one gets fixed
deliberately. Here one document disagrees with itself.

1. **`docs/design-system.md`, "Adding a token"** currently says *"A primitive:
   put the value in the right record in `ui-design/src/tokens.ts`. Nothing else
   — the flattener picks it up."* That is decision 1 inverted. Rewrite: a
   primitive is a **name** added to the right group in
   `ui-design/src/tokens.ts`; the name union widens and `v()` typechecks
   immediately; every theme then fails to compile until it supplies a value,
   which is the intended prompt.
2. **`docs/design-system.md`** gains the naming rule from decision 4, and the
   note that component token defaults must not contain `color-mix()`
   (decision 3).
3. **`docs/motion.md`** is already correct and stays.
4. **`packages/ui-design/README.md`** — the "Status" section says `src/` holds
   stubs. Update to reflect that the schema, `defineTheme` and `v()` have
   landed, with the emitter still pending.

## Out of scope

- `emitTokensCss()`, cascade layers, the reset and `bootScript` — task 11.
- `ui-remix/src/tokens.ts`, `ThemeStyle`, and the `ComponentTokenName` union —
  task 12.
- Any actual colour, pixel or curve — task 18.

## Inherited by later tasks

- **Task 18** owns the test asserting `sp-N` resolves to `N × 4px` in `mini`'s
  theme. The multiplier promise in decision 4 is unenforceable here and must be
  checked where values exist.
- **Task 18** decides whether `mini` derives its semantic arms from seeds, and
  owns any `tonal()` helper. It must not be lifted into `ui-design`.
- **Task 18** picks fixed or fluid type, subject to the WCAG 1.4.4 note above.
- **Task 16** no longer needs to add semantic primitives; its brief allowed for
  it, but task 15 lands first and needs an invalid state, so the semantic set
  is defined here instead.
- **Task 12 has no `accent-active`.** Neutral surfaces have `surface-hover` and
  `surface-active`, but `accent` and `link` have hover only, so a primary
  Button has no in-contract way to make `:active` differ from `:hover` — and
  `color-mix()` in a component default is banned by decision 3, which closes
  the usual workaround. Adding the primitive later is additive and cheap while
  there is exactly one theme. Task 12 should decide.
- **Task 18 will hit `exactOptionalPropertyTypes`.**
  `defineTheme({ base, dark: cond ? overrides : undefined })` does not
  compile; the idiom is `...(cond ? { dark: overrides } : {})`.
- **The schema is closed, and the escape hatch is undocumented.** An app
  needing its own primitive (this document's own skin example references
  `--accent-bronze`, which is not in the schema) can widen the seam:
  `defineTheme<ComponentTokenName | "accent-bronze">`. Non-obvious; task 18
  should document it wherever it lands.
