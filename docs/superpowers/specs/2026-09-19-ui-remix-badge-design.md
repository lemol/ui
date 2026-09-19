# ui-remix: Badge

Date: 2026-09-19
Task: M1 / 16
Status: designed

`Badge` is a status marker: a small pill carrying a word or two, inline with
whatever text surrounds it. It is in the M1 slice as the third angle on the
token contract. `Button` proved a component can default its tokens to
structural primitives. `Field` proved a multi-element component can do it.
`Badge` asks the remaining question — whether the *semantic* primitives carry
enough meaning to default against, or whether a component has to reach past
them and mix its own colours.

The answer is yes, with one correction to the schema's promises that this task
makes. The correction is the substance of the work; the component itself is
small.

## The brief's scope item is void, and a different one replaces it

Task 16 says: "If a semantic primitive is missing from `ui-design`'s schema,
adding it is part of this task." None is. `Field` needed an invalid state and
landed first, so all sixteen semantic names — four arms each for `success`,
`warning`, `danger` and `info` — shipped in task 10. The token-schema plan
already recorded that this clause had lapsed.

What is missing is not a name but a guarantee, and `Badge` is what exposes it.
See "The second contrast promise" below.

## Tones: the semantic four, plus neutral

Five tones: `neutral`, `success`, `warning`, `danger`, `info`. `neutral` is the
default.

The four semantic tones are the task's actual question and each defaults to its
own arms. `neutral` is there because a status-neutral badge — `Draft`, `v2.1`,
a count — is the most common badge there is, and a component that cannot render
one sends its first caller to a hand-styled `<span>` or, worse, to `info` for
something that is not information. Both are the failure the contract exists to
prevent, and the app shell in task 18 would hit it immediately.

`neutral` defaults to `surface`, `hairline` and `ink-muted`: primitives, no
derivation, the same shape as `Button`'s neutral tone.

It costs the purity of the experiment a little. `Badge` is no longer *only* a
semantic component, and one of its five tones answers the task's question by
construction. That is acceptable, because the four semantic tones still each
default to their own four arms and still either work or do not. The evidence
survives.

### No accent tone

`accent-subtle` and `accent-border` are in the schema with no consumer, and
this repository holds that a primitive nothing can vary is a value nobody can
check. That argues for giving them one. It does not argue for giving them
*this* one: their natural first consumer is a selected nav item or a callout in
`mini`, which task 18 owns. Adding an accent badge to make a count go green
would put the pair under a consumer that does not represent how they are meant
to be read.

## Fill: subtle, not solid

Every tone is a `<tone>-subtle` fill, a `<tone>-border` edge, and `<tone>` as
the ink.

The alternative — a solid `<tone>` fill with `<tone>-ink` on it, the way
`Button` fills its primary and danger tones — was the safer read of the schema
and is rejected on looks. Four saturated blocks inline in a paragraph are loud
in a way a status marker should not be, and a solid neutral badge off `surface`
is nearly invisible, existing only by its border.

The reason solid looked safer is worth stating, because it is the thing this
task has to deal with rather than dodge. The schema makes exactly one contrast
promise, in `docs/design-system.md`: `<tone>-ink` is hand-picked to be readable
on `<tone>`, and it is hand-picked precisely because no mix ratio knows whether
text on a computed colour passes WCAG. A subtle-filled badge does not use that
pair. It asks for `<tone>` on `<tone>-subtle`, about which the schema currently
says nothing at all.

## The second contrast promise

Measured against `mini`'s theme as it stands, at the 4.5:1 AA threshold for
normal text — badge text is `fs-xs`, so the large-text threshold does not
apply. Both axes, because a theme's dark values are values too:

| tone    | light: ink on tone | light: tone on subtle | dark: ink on tone | dark: tone on subtle |
| ------- | ------------------ | --------------------- | ----------------- | -------------------- |
| success | 5.03               | **4.42**              | 5.49              | 4.74                 |
| warning | **4.21**           | **3.76**              | 6.88              | 5.83                 |
| danger  | 5.93               | 5.09                  | 5.24              | 4.61                 |
| info    | 7.00               | 6.08                  | 5.99              | 5.13                 |
| accent  | 6.33               | 5.42                  | 5.24              | **4.20**             |

Three findings, and they point the same way.

The subtle pair fails for light `success` and light `warning`, which is what an
unnamed promise looks like when nothing has been checking it.

It fails for dark `accent` too, at 4.20 — a tone nothing reads on either arm,
in the axis a light-mode eye never looks at.

And light `warning` fails on the pair the schema *does* promise, at 4.21.
Nothing has ever consumed `warning`, so nobody has ever looked. That is this
repository's own line about unconsumed primitives, landing on the schema
itself.

`accent` is in the table and in the test despite `Badge` having no accent tone.
The promise being named is about `-subtle` arms, and `accent` has one. Scoping
the check to the four tones this component happens to render would be writing
the test around the component rather than around the guarantee.

So this task does three things beyond the component:

1. **Names the second promise.** `docs/design-system.md` gains it beside the
   first: a theme must make `<tone>` readable on `<tone>-subtle`, as well as
   `<tone>-ink` readable on `<tone>`. Two fills, two promises.
2. **Makes both checkable.** A contrast assertion over `mini`'s theme values
   covering both pairs for all five tones in both axes, in
   `src/mini/theme.test.ts`. It is `mini`'s test because `mini` holds the
   values; `design` holds no values and has nothing to assert about.
3. **Retunes three values** until it passes: light `success` to `#2A7146`,
   light `warning` to `#8A5A09`, and dark `accent-subtle` to `#12201C`. Each
   is chosen with headroom rather than parked on 4.5. No component reads
   `success`, `warning` or `accent-subtle` today, so nothing moves visually as
   a result.

A contrast helper is a handful of lines of sRGB luminance arithmetic and lives
in the test file. It is not a runtime export: nothing at runtime needs to know
a contrast ratio, and shipping one would invite a component to compute a colour
at render time, which is the derivation this schema exists to forbid.

## The contract

Twenty-three tokens in `src/remix/badge/tokens.ts`.

```
ui-badge-radius         var(--r-pill)
ui-badge-pad-x          var(--sp-2)
ui-badge-pad-y          var(--sp-1)
ui-badge-gap            var(--sp-1)
ui-badge-font-size      var(--fs-xs)
ui-badge-font-weight    var(--fw-medium)
ui-badge-leading        var(--lh-tight)
ui-badge-border-width   1px

ui-badge-neutral-bg     var(--surface)
ui-badge-neutral-ink    var(--ink-muted)
ui-badge-neutral-border var(--hairline)

ui-badge-<tone>-bg      var(--<tone>-subtle)
ui-badge-<tone>-ink     var(--<tone>)
ui-badge-<tone>-border  var(--<tone>-border)
```

for `<tone>` in `success`, `warning`, `danger`, `info`.

`1px` is already in `allowedLiterals` in `src/remix/tokens.test.ts`, carrying
`Button`'s and `Field`'s border widths. `Badge`'s needs no new argument.

`ui-badge-leading` exists because a badge inline in a paragraph inherits
`lh-base` and comes out tall and loose. Naming the line-height is what makes
the pill compact, and it is a token rather than a literal because how tight a
pill sits is a brand's decision.

`ui-badge-gap` is inert for a text-only badge, the way `ui-btn-gap` is inert
for a text-only button. It is declared so a badge carrying an icon beside its
text has somewhere to put the spacing other than `mix`.

### What the contract does not hold

**No transition, and no hover.** `docs/design-system.md` rules that status
colours get no `-hover` arm, because they are read on static elements. `Badge`
is that static element, so there is no second state to transition to. `Button`
carries transition tokens because `Button` has a hover; giving `Badge` a pair
that nothing could ever animate would be two tokens a skin can set and watch do
nothing.

**No size axis.** `Button` has `sm` and `md` because `schema.sizing` holds
`control-h` and `control-h-sm`, and its own comment says the size axis is
decided by the schema rather than by taste. `Badge` is not a control. Its
height falls out of padding and line-height, and there is no primitive to key a
second size off. `Eyebrow` is the precedent: a component with no axis the
schema gives it does not invent one.

**No tracking token.** Small text often wants a little, and `Eyebrow` has one.
`Eyebrow`'s exists because letter-spacing is the whole of what an eyebrow is. A
badge is a shape, not a typographic treatment, and a token that exists because
it might be nice is one nobody has a reason to set.

## The component

`src/remix/badge/badge.tsx` exports `Badge` and `BadgeTone`.

It renders a `<span>`. `display: inline-flex` lays the contents out internally
while the element stays inline externally, so a badge sits inside a sentence, a
table cell or a `Row` without breaking the line. That is `Button`'s arrangement
for the same reason.

Tone styling follows `Button`'s shape exactly: one `toneStyle(tone)` factory
producing a `css()` block that reads `--ui-badge-<tone>-bg`, `-ink` and
`-border`, and a `Record<BadgeTone, CSSMixinDescriptor>` built from it. Two
blocks render per badge — the base and the tone — which is one more than
`Eyebrow` and one fewer than `Button`, and they are disjoint by property.

`mix` is present with the same meaning and the same caveat it carries on every
other component: it reliably adds a property `Badge` does not declare, and does
not reliably override one it does, because sub-layer order decides and not
array order. Changing something `Badge` declares goes through the token.

No `aria` props. A badge's text is its content and a screen reader reads it. A
badge that needs an accessible name beyond its text is a badge whose text is
wrong.

## Tests

`src/remix/badge/badge.test.tsx`, matching the suites `Eyebrow` and `Button`
already carry:

- Renders a `<span>` carrying its children.
- Reads only `var(--ui-badge-*)` — the sweep that is the whole point of the
  component.
- Reads every token it declares and declares every one it reads.
- Renders every tone, each reading its own three tokens.
- Renders two blocks, disjoint by property.
- `mix` adds a property `Badge` does not declare.

`src/mini/theme.test.ts` gains the contrast assertion over both pairs for all
five tones.

## The demo

`src/remix/badge/badge.demo.tsx`, registered in `src/remix/demos.ts`. The five
tones in a `Row`, then a badge inline in a sentence of `Text` — the placement
that justifies `inline-flex` and `ui-badge-leading`, and the one that would
look wrong first if either were missing.

Styled from primitives, as every demo is. A demo is a page, not a component.

## Documents to correct

- `src/remix/README.md`: a catalogue entry for `Badge`.
- `docs/design-system.md`: the second contrast promise, beside the first.

## Out of scope

- A solid-fill variant. It doubles the tone contract to twenty-four tokens for
  a component with no caller asking for one, and the subtle fill is what a
  badge looks like. Adding it later is additive and breaks nothing.
- An accent tone, deferred to whatever in `mini` first genuinely reads
  `accent-subtle`.
- A dot or status-dot variant, and a dismiss affordance. A dismissible badge is
  a button in a badge's clothing and belongs in M2 if anything wants one.
- A count or numeric badge with its own metrics. The tokens render one today;
  if counts need different padding they need their own component, not a size
  axis here.
- Retuning any tone value beyond the three named above. `danger` and `info`
  pass both pairs in both axes already.
- Non-text contrast for `<tone>-border`. WCAG 1.4.11 governs the boundary of a
  UI component or a graphical object carrying meaning; a badge is neither, and
  its tone is carried by text that already passes. A border ratio would be a
  number with no requirement behind it.
