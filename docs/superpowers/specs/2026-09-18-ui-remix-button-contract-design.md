# ui-remix: Button, the token aggregate, ThemeStyle and mini's theme

Date: 2026-09-18
Task: M1 / 12
Status: implemented

The load-bearing task of M1. `Button` and `LinkButton` styled only through
`--ui-btn-*`, the aggregate in `ui-remix/src/tokens.ts`, `ThemeStyle`, `mini`'s
theme with real values for every primitive, the cross-package type wiring, and
`/c/button` rendering in light, dark and compact with no client JavaScript.

If the contract is wrong, it is wrong here. Writing it found five things that
were wrong: two in shipped documents, one in the schema, one in the obvious way
to write the component, and one in `remix/ui`'s cascade behaviour that no
document here had recorded. The fifth was found by a manual browser check after
thirteen passing tests, and it is the one with reach beyond Button.

The plan was amended once before implementation, in commit `3cb99c0`. So
`docs/superpowers/plans/2026-09-18-ui-remix-button-contract.md` is intent as
amended pre-implementation rather than an untouched record of what was first
agreed.

## The five corrections

### 1. `ThemeStyle` belongs in `<head>`, not the body

`docs/design-system.md:188-189` ("Delivery") says a `<style>` element is valid in the body
and applies document-wide, so `ThemeStyle` renders in server mode and inside
the SPA tree with no special casing. The first half is true and the conclusion
is false.

`@remix-run/ui`'s `finalizeHtml` collects every `css({...})` rule into
`<style data-rmx-style>` tags and splices them in immediately before `</head>`
— after all authored head content, before anything in the body:

```js
// @remix-run/ui/dist/server/stream.js:855
let styles = collectStyleTags(context)
let headContent = importMapScript + preloads + styles
let headCloseIndex = html.indexOf('</head>')
html = html.slice(0, headCloseIndex) + headContent + html.slice(headCloseIndex)
```

So a `ThemeStyle` in the body is evaluated after `@layer rmx.*` already exists.
`@layer base, rmx;` then registers `base` at the end of the order rather than
the front, because a layer statement cannot move a layer that exists. Element
defaults start beating components, with no error — precisely the inversion
`packages/ui-design/src/css/layers.ts:9-12` warns about.

**Why head placement rather than splitting the statement out.** The alternative
is a second component emitting only `@layer base, rmx;` into `<head>`, leaving
`ThemeStyle` placement-free. It does not remove the trap, it shrinks what sits
behind it and adds a second thing to place — and forgetting the statement
component outright is worse than misplacing `ThemeStyle`, because misplacement
at least still delivers the tokens.

The risk was also overstated. This is not a rule every component author must
remember; it is a rule the document owner gets right once, and there is one
document per app. `mini`'s `Document` (task 18) encodes it for every app built
on `mini`.

And the split is already reachable without shipping it as the default:
`ui-design` exports `layerStatement` separately
(`packages/ui-design/src/css/index.ts:3`), so an SPA that wants the statement
in `index.html` and the token blocks in the app tree can do that today.

**The guard is a test, not a runtime check.** A dev-only assertion inside
`ThemeStyle` cannot work: `ThemeStyle` renders during the tree walk, and remix
injects its style tags in `finalizeHtml` afterwards, so at render time there is
no remix style tag to detect — not in a string, not in a DOM. Server-side
detection is impossible by construction, and the server case is the one that
matters. The property is a fact about the output string, so it is asserted on
the output string:

```ts
const html = await renderToHtml(<Document title="Button" entry={null} />)
expect(html.indexOf("@layer base, rmx;")).toBeLessThan(html.indexOf("data-rmx-style"))
```

Its honest limit is that it covers documents rendered in tests. An app writing
its own document is not covered, which is why `docs/design-system.md` is
corrected as well as guarded.

### 2. The component needs `background`, not `background-color`

The obvious way to write a tone is wrong:

```ts
// Wrong. --ui-btn-primary-bg accepts a gradient, and background-color does not.
backgroundColor: "var(--ui-btn-primary-bg)"
```

The whole point of the contract, and the second "done when" of the task, is
that a skin overrides `ui-btn-primary-bg` with
`linear-gradient(180deg, ...)` and the rendered button changes with no edit to
`button.tsx`. `background-color` rejects a gradient value outright: the
declaration is invalid and drops, and the button renders with no background at
all. Tones use the `background` shorthand.

**The consequence to accept.** `transition-property` names `background` rather
than `background-color`, and gradients do not interpolate — so a gradient skin
gets an instant background swap on hover while the default flat skin still
transitions. That is a property of CSS, not something to work around with a
JavaScript colour interpolation.

### 3. The schema has no `danger-hover`

`schema.color` has `accent-hover` and `link-hover`. It has `danger`,
`danger-ink`, `danger-subtle` and `danger-border`, and no hover value — so
`--ui-btn-danger-bg-hover` has no primitive to default to, and a destructive
button either does not respond to hover or derives its hover value inside the
component, which `docs/design-system.md:72-85` ("Two tiers") forbids.

`danger-hover` is added to `schema.color`, and the line is drawn there.
`accent`, `link` and `danger` are the interactive colours. `success`, `warning`
and `info` are status colours that nothing hovers — Badge (task 16) reads them
on a static element — so they get no hover value until something needs one.

This is a schema widening, so every theme fails to compile until it supplies
the value. Only `mini` exists, and it is written in this task.

### 4. `--ui-btn-border-width` defaults to a literal

`docs/design-system.md:11-13` says each component token defaults relationally
to a primitive. `hairline` is a colour; there is no border-width primitive, and
one property does not justify widening the schema.

So `--ui-btn-border-width: 1px` ships as the one component token in this task
whose default is not a `var()`, with the reason in a comment beside it. The
alternative is a literal `1px` inside `button.tsx`, which is the thing the
contract exists to prevent: a named token with a literal default is the
opposite of a buried one, because a skin can still change it.

`tokens.test.ts` therefore checks defaults against an explicit allow-list of
non-`var()` values rather than rejecting all of them. The allow-list is short
and every entry has to be argued for in review, which is the point.

### 5. `remix/ui` sub-layers every `css()` call, and layer order beats specificity within them

Found by manual browser check during task closeout, after thirteen
`button.test.tsx` tests had already passed. `remix/ui` gives every distinct
`css({...})` style object its own cascade sub-layer — the emitted style element
reads `@layer rmx.rmxc-<hash> { .rmxc-<hash> { … } }` — and within cascade
layers, layer order beats specificity regardless of how specific either rule
is.

Blocks are keyed by content, not by call site: `processStyleClass` hashes the
style object and caches by that hash, so two `css()` calls with equal objects
collapse into one class and one sub-layer, and a factory like
`toneStyle(tone)` is one call site producing four. Counting call sites gets the
number wrong in both directions, which matters because the question that
decides correctness is which declarations share a block.

`Button`'s `&:disabled` override originally lived in `buttonBase`, and the
tone colours lived in a separate per-tone `css()` block. `buttonBase`'s
sub-layer registers before the tone's, so `.tone { color: … }` beat
`.base:disabled { color: … }` and a disabled button rendered in its tone's
colours instead of the disabled ones — a real, user-visible bug that every
existing render test missed, because they only asserted the disabled
declarations were present *somewhere* in the document, not which sub-layer
they landed in relative to the tone. Fixed in commit `4a3b0ea` by moving the
`:disabled` override into each tone's own `css()` block, so both sit in one
sub-layer where ordinary specificity decides.

The trap this leaves behind: reordering the `mix` array does not fix it.
Sub-layer registration order follows render order, not `mix` order — a page
whose first rendered button happens to be disabled registers a trailing
disabled block ahead of any tone block, and the bug returns regardless of how
`mix` is written. The rule that generalizes, now recorded in
`docs/design-system.md`'s "Cascade layers" section: when one `css()` block
must override another on the same element, put both declarations in the same
block, and the corollary that makes it actionable: a component's own blocks
must be property-disjoint, so that no two of them can contend and their order
stops mattering at all. Three tests in `button.test.tsx` pin it — the disabled
declarations live in the same block as the tone's, `buttonBase`'s own block
carries no `:disabled`, and the caller's `mix` block registers before the
tone's when its descriptor rendered earlier.

The fifth correction is the highest-value one: it is a document-worthy fact
about `remix/ui` itself rather than anything specific to Button, and it is the
reason the `mix` claim above had to be narrowed too.

## Button's surface

### Sizes are `sm` and `md`, because the schema says so

`schema.sizing` holds exactly `control-h` and `control-h-sm`. A third size
would need a primitive that does not exist, so the size axis is decided by the
schema rather than by taste. Density comes free: `compact` retunes both
heights, and `Button` never learns density exists.

### Tones are `primary`, `neutral`, `ghost` and `danger`

`danger` earns its place now rather than later because task 17's `Dialog` demo
is a destructive confirm, and a tone added after the catalogue is written is a
tone added to every demo file at once.

### Three deliberate omissions

**No focus tokens.** `resetCss` already sets `outline: var(--focus-ring)` and
`outline-offset: var(--focus-ring-offset)` on `:where(:focus-visible)` in
`@layer base`. `Button` never declares `outline`, so nothing competes and the
base rule applies even though `base` loses to `rmx`. A per-component focus ring
is how a focus ring drifts.

**No `:active` tokens.** `:active` reuses the hover background. A separate press
colour is four more tokens for an effect that lasts a hundred milliseconds.

**No disabled opacity.** One tone-independent triple — `disabled-bg`,
`disabled-ink`, `disabled-border` — instead of `opacity: 0.5`. Every default is
a primitive, there is no literal ratio to retune later, and a flat disabled
fill reads better than a washed-out accent.

`LinkButton` has no disabled state. `aria-disabled` on an `<a>` does not prevent
navigation, so a disabled link is a broken link. Omit the `href` instead.

### The token record

```ts
// packages/ui-remix/src/button/tokens.ts
export const buttonTokens = {
  // Shape. Height and padding come from the sizing group, so `compact`
  // retunes the control without the component knowing density exists.
  "ui-btn-radius": "var(--r-sm)",
  "ui-btn-height": "var(--control-h)",
  "ui-btn-height-sm": "var(--control-h-sm)",
  "ui-btn-pad-x": "var(--sp-4)",
  "ui-btn-pad-x-sm": "var(--sp-3)",
  "ui-btn-gap": "var(--sp-2)",
  "ui-btn-font-size": "var(--fs-md)",
  "ui-btn-font-size-sm": "var(--fs-sm)",
  "ui-btn-font-weight": "var(--fw-medium)",
  // The one default that is not a primitive: border width has no primitive to
  // reference, and one property does not justify widening the schema. Named
  // here rather than written into button.tsx so a skin can still change it.
  "ui-btn-border-width": "1px",
  "ui-btn-transition-duration": "var(--dur-fast)",
  "ui-btn-transition-easing": "var(--ease-out-quad)",

  // Tones. Each border defaults to its own fill rather than `transparent`, so
  // every tone is the same size and a skin can give one a contrasting edge.
  "ui-btn-primary-bg": "var(--accent)",
  "ui-btn-primary-ink": "var(--accent-ink)",
  "ui-btn-primary-border": "var(--accent)",
  "ui-btn-primary-bg-hover": "var(--accent-hover)",

  "ui-btn-neutral-bg": "var(--surface)",
  "ui-btn-neutral-ink": "var(--ink)",
  "ui-btn-neutral-border": "var(--hairline-strong)",
  "ui-btn-neutral-bg-hover": "var(--surface-hover)",

  // `transparent` keeps a ghost button the same size as a neutral one, so a
  // toolbar does not reflow when a tone changes.
  "ui-btn-ghost-bg": "transparent",
  "ui-btn-ghost-ink": "var(--ink-muted)",
  "ui-btn-ghost-border": "transparent",
  "ui-btn-ghost-bg-hover": "var(--surface-hover)",

  "ui-btn-danger-bg": "var(--danger)",
  "ui-btn-danger-ink": "var(--danger-ink)",
  "ui-btn-danger-border": "var(--danger)",
  "ui-btn-danger-bg-hover": "var(--danger-hover)",

  // Tone-independent: a disabled button stops being primary or dangerous.
  "ui-btn-disabled-bg": "var(--surface-active)",
  "ui-btn-disabled-ink": "var(--ink-subtle)",
  "ui-btn-disabled-border": "var(--hairline)",
} as const
```

Thirty-one tokens: twelve shape, sixteen tone, three disabled.

### The components

```tsx
// packages/ui-remix/src/button/button.tsx
export type ButtonTone = "primary" | "neutral" | "ghost" | "danger"
export type ButtonSize = "sm" | "md"
```

`Button` renders a `<button>` and defaults `type` to `"button"` explicitly. A
bare `<button>` inside a `<form>` submits it, which is the classic silent bug,
and `remix/ui`'s own button mixin defaults the attribute for the same reason.

`LinkButton` renders an `<a>` and requires `href`. It needs
`text-decoration: none` to beat the reset's `:where(a)` underline; `base` loses
to `rmx`, so the component's own `css()` wins with no unlayered rule. That is
asserted rather than assumed: `docs/design-system.md:229-238` describes the
neighbouring hazard — an *unlayered* `a` rule, which `rmx` would lose to — and
the assertion is what tells us which side of that line the reset is on.

Both compose through `mix`, which accepts an array, with the caller's `mix`
last:

```tsx
mix={[buttonBase, toneStyles[tone], sizeStyles[size], mix]}
```

**Composing it last does not make it win, and this spec originally claimed it
did.** Correction 5 applies to the caller's block exactly as it applies to the
component's own: sub-layer order follows the order blocks are first encountered
during the render, not the order of this array. Put the caller's descriptor on
an earlier element in the same document and the order becomes
`caller → buttonBase → tone → size`, so Button's own tone beats the override
with no error. Client-side it is worse: `createStyleManager.remove()` drops a
rule at refcount zero and the next `insert()` appends it at the end of the
sheet, so the order can change mid-session.

The honest guarantee, which is what the doc comments and
`packages/ui-remix/README.md` now state:

- `mix` reliably **adds** properties the component does not declare.
- It does **not** reliably override one the component does declare.
- Overriding a declared property goes through its `--ui-btn-*` token. That is
  the intended path and the reason the component tier exists. `!important`
  also works — `remix/ui` emits none of its own and passes one through — but
  needing it means a token is missing.

Nothing in the repo depended on the wrong claim; no caller overrides a property
Button sets. The defect was the documented guarantee, and a wrong mental model
here is what produced the disabled bug in the first place.

### `remix/ui/button` is not used, and that is not a ladder violation

`remix/ui/button` hard-codes `"Inter Variable"`, `light-dark()` hex pairs, a
`999px` radius and `26px` heights. Nothing in it can read the contract.

The native-first ladder in `docs/interactivity.md` ranks *behaviour*
primitives, and a `<button>` needs no behaviour. `remix/ui/button` is a styling
mixin, so the ladder's second rung does not apply to it at all. Recorded here
so that nobody later reads the rule and "upgrades" the component.

## The aggregate and the type wiring

```ts
// packages/ui-remix/src/tokens.ts
export const componentTokens = { ...buttonTokens } satisfies Record<string, string>
export type ComponentTokenName = keyof typeof componentTokens
```

```ts
// packages/ui-remix-mini/src/theme.ts
export const miniTheme = defineTheme<ComponentTokenName>({ base, dark, compact })
```

### The sharp edge that makes the proof work

Excess property checking only fires on **object literals**. Renaming a key in
`button/tokens.ts` makes `mini`'s override an excess property error — which is
the first "done when" — but only if the override is written as a literal key in
the `base`, `dark` or `compact` object. Assemble those from a spread and
TypeScript stops checking, and the proof silently stops proving anything.

So `mini`'s theme writes its primitives as literal object members, and
`theme.ts` carries a comment saying why it must not be refactored into a
spread. The alternative — a runtime check that every override names a known
token — moves a compile-time failure to a render-time one, which is the wrong
direction.

`mini` does not export a pre-bound `defineTheme`. An app writing its own theme
repeats `defineTheme<ComponentTokenName>`, which is explicit and costs one type
argument. A bound helper waits for the second consumer that wants it.

## `ThemeStyle`

```tsx
// packages/ui-remix/src/theme-style.tsx
export interface ThemeStyleProps {
  theme: Theme<ComponentTokenName>
  /** Defaults to this package's aggregate; supply a wider record to add to it. */
  componentTokens?: Readonly<Record<string, string>>
}
```

It renders one `<style>` and nothing else.

**It uses `innerHTML`, not text children.** Remix escapes `&`, `<` and `>` in
element text content (`stream.js:380`), which is what the emitter's character
ban in `emit.ts:26` exists to survive. But `innerHTML` is a first-class
framework prop on both the server (`stream.js:353`) and the client
(`reconcile.ts:597`), and it emits raw.

So escaping stops being a failure mode, and the emitter's ban stays as policy
rather than as the only thing standing between a theme and a silently dead
declaration. That matters for one concrete future case: a `@container
(width > 400px)` or a range media query in the reset is unshippable through
escaped text and fine through `innerHTML`. Theme values are first-party source,
not untrusted input, so raw insertion adds no attack surface that
`emitTokensCss` returning a string did not already have.

The emitter's ban is not relaxed in this task. Removing a guard and adding the
thing it guarded against are separate changes.

`ThemeStyle` is not generic. A theme typed `Theme<ComponentTokenName | "ui-app-x">`
is still structurally assignable to `Theme<ComponentTokenName>`, because the
component-token half of `Base<C>` is `Partial`, so an app with extra tokens
passes its theme in and supplies the wider record through `componentTokens`.

**Correction to this spec's original test description.** This spec and the
plan (`theme-style.test.tsx`, step 1) originally described a test asserting the
rendered HTML "carries the emitter's string verbatim" as the check that
escaping is not happening. During implementation that test was found unable to
distinguish `innerHTML` from text children: `emitTokensCss()` already bans `&`,
`<` and `>`, so a sheet with neither `innerHTML` nor a text-child rewrite would
render byte-identical HTML either way, and the "verbatim" test would pass
regardless of which one shipped. It was checking the output string, not the
choice this section argues for. Two stronger tests were added in commit
`c4548b5` instead: one inspects the `RemixElement` `ThemeStyle` builds directly
and asserts `innerHTML` is set with no `children`, and one pins the escaping
asymmetry itself — that remix escapes `&`, `<` and `>` in text children but not
in `innerHTML` — using a literal string carrying those characters rather than
`emitTokensCss()`'s output. The plan is left as written; this is the record of
where the shipped test diverged from it.

## mini's theme

Ninety-six primitives with values, including the new `danger-hover`. Warm-grey
neutrals with a deep teal accent: warm neutrals against a cool accent is the
pairing, and teal rather than blue keeps `accent` and `info` distinguishable
when both appear on one screen.

Nothing here is derived from `@mionso/design`. The mechanisms in these packages
came from there; none of the values did.

### Units

Space, radius and sizing are `px`. Type sizes are `rem`, so a reader who raises
their browser font size gets larger text without the layout grid stretching
with it. Two unit systems in one theme is a deliberate split, not an oversight:
one axis follows the user's preference and the other follows the design's
density.

### base

```ts
const base = {
  "scheme-mode": "light",

  canvas: "#FAF9F7",
  surface: "#FFFFFF",
  "surface-raised": "#FFFFFF",
  "surface-hover": "#F3F1ED",
  "surface-active": "#EAE7E1",
  hairline: "#E6E3DC",
  "hairline-strong": "#CFCBC2",
  ink: "#1A1917",
  "ink-muted": "#5C5852",
  "ink-subtle": "#8B867D",
  "ink-inverse": "#FFFFFF",
  scrim: "rgba(26, 25, 23, 0.45)",
  // Deliberately not the accent: the ring has to read against an
  // accent-filled button, which it cannot do if it is the same hue.
  focus: "#2F6FEB",

  accent: "#1F6B5C",
  "accent-hover": "#18564A",
  "accent-ink": "#FFFFFF",
  "accent-subtle": "#E4F0ED",
  "accent-border": "#A9CFC6",
  link: "#1B5E52",
  "link-hover": "#124338",

  success: "#2F7D51",
  "success-ink": "#FFFFFF",
  "success-subtle": "#E7F3EC",
  "success-border": "#B7D9C4",
  warning: "#A8700F",
  "warning-ink": "#FFFFFF",
  "warning-subtle": "#FBF1DF",
  "warning-border": "#E8CF9B",
  danger: "#B3392F",
  "danger-hover": "#942D25",
  "danger-ink": "#FFFFFF",
  "danger-subtle": "#FBEAE8",
  "danger-border": "#E8B8B2",
  info: "#2B5C8A",
  "info-ink": "#FFFFFF",
  "info-subtle": "#E8F0F7",
  "info-border": "#B9CFE2",

  // sp-N is N four-pixel units. Checked by a test, not by the compiler.
  "sp-0": "0px",
  "sp-1": "4px",
  "sp-2": "8px",
  "sp-3": "12px",
  "sp-4": "16px",
  "sp-5": "20px",
  "sp-6": "24px",
  "sp-8": "32px",
  "sp-10": "40px",
  "sp-12": "48px",
  "sp-16": "64px",
  "sp-24": "96px",

  "r-xs": "2px",
  "r-sm": "6px",
  "r-md": "10px",
  "r-lg": "14px",
  "r-xl": "20px",
  "r-pill": "9999px",

  // No web font: the packages have no build step and no asset to ship.
  "font-sans": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  "font-mono": 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  "fs-2xs": "0.6875rem",
  "fs-xs": "0.75rem",
  "fs-sm": "0.8125rem",
  "fs-md": "0.9375rem",
  "fs-lg": "1.125rem",
  "fs-xl": "1.375rem",
  "fs-2xl": "1.75rem",
  "fs-3xl": "2.25rem",
  "lh-tight": "1.15",
  "lh-snug": "1.3",
  "lh-base": "1.55",
  "lh-relaxed": "1.75",
  "tr-tight": "-0.015em",
  "tr-normal": "0em",
  "tr-wide": "0.02em",
  "tr-wider": "0.08em",
  "fw-regular": "400",
  "fw-medium": "500",
  "fw-semibold": "600",
  "fw-bold": "700",

  "dur-instant": "80ms",
  "dur-fast": "140ms",
  "dur-base": "240ms",
  "dur-slow": "400ms",
  "ease-out-quad": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  "ease-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
  "ease-in-out-smooth": "cubic-bezier(0.4, 0, 0.2, 1)",

  "control-h": "36px",
  "control-h-sm": "28px",
  "row-h": "44px",
  "row-pad-y": "12px",
  "page-max": "72rem",
  gutter: "24px",

  "shadow-sm": "0 1px 2px rgba(23, 21, 18, 0.06)",
  "shadow-md": "0 4px 12px rgba(23, 21, 18, 0.08)",
  "shadow-lg": "0 16px 40px rgba(23, 21, 18, 0.12)",
  // The whole outline shorthand, so the reset needs no rule of its own.
  "focus-ring": "2px solid var(--focus)",
  "focus-ring-offset": "2px",
}
```

### dark

```ts
const dark = {
  "scheme-mode": "dark",

  canvas: "#151412",
  surface: "#1D1C19",
  "surface-raised": "#252320",
  "surface-hover": "#2B2926",
  "surface-active": "#33302C",
  hairline: "#33302B",
  "hairline-strong": "#4A4640",
  ink: "#F2F0EB",
  "ink-muted": "#AFAAA1",
  "ink-subtle": "#7E7970",
  "ink-inverse": "#151412",
  scrim: "rgba(0, 0, 0, 0.6)",
  focus: "#6E9DF5",

  // Hover goes lighter here and darker in base. That inversion is why hover
  // values are named tokens and never derived from their fill.
  accent: "#3E9A87",
  "accent-hover": "#4FAE9A",
  "accent-ink": "#0E1A17",
  "accent-subtle": "#1B2E29",
  "accent-border": "#2F5B52",
  link: "#5CB8A4",
  "link-hover": "#7ACBB9",

  success: "#4E9E70",
  "success-ink": "#0D1A12",
  "success-subtle": "#18281E",
  "success-border": "#2C5138",
  warning: "#C9962F",
  "warning-ink": "#1A1405",
  "warning-subtle": "#2B2312",
  "warning-border": "#54421C",
  danger: "#D4675A",
  "danger-hover": "#E07E71",
  "danger-ink": "#1E0E0C",
  "danger-subtle": "#2E1A17",
  "danger-border": "#5C2F28",
  info: "#5E9AC4",
  "info-ink": "#0C1620",
  "info-subtle": "#172530",
  "info-border": "#2C4A60",

  // A shadow tuned for a light canvas disappears on a dark one.
  "shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.4)",
  "shadow-md": "0 4px 12px rgba(0, 0, 0, 0.45)",
  "shadow-lg": "0 16px 40px rgba(0, 0, 0, 0.55)",
}
```

### compact

```ts
const compact = {
  "control-h": "30px",
  "control-h-sm": "24px",
  "row-h": "34px",
  "row-pad-y": "6px",
}
```

The four-token swap and nothing else. `Button` reads `control-h` and
`control-h-sm` through its own tokens, so compact retunes it with no component
change — which is the thing `/c/button?density=compact` demonstrates.

## Playground

A real `/c/:component` route, not a throwaway `/c/button`. The registry is
about ten lines, and task 19 then adds demos to it rather than replacing it.

```
/c/:component            ?scheme=dark  ?density=compact  ?nojs
```

```ts
// packages/ui-remix/src/demos.ts
export const demos = { button: { title: "Button", Demo: ButtonDemo } } as const
export type DemoName = keyof typeof demos
```

`Document` gains `scheme` and `density` props and renders them as
`data-scheme` / `data-density` on `<html>`, plus `<ThemeStyle>` in `<head>`
ahead of remix's spliced styles. Unset props render no attribute, because remix
omits `undefined`.

**Not as the first head child, which this spec first said.** The requirement is
only that `ThemeStyle` precede the styles remix splices in before `</head>`;
tags remix does not splice may go ahead of it, and `<meta charset>` has to.
The spec only honours a charset declaration in the first 1024 bytes, and the
emitted sheet is kilobytes long — so `ThemeStyle` first pushed charset to byte
8058, where it is ignored. HTTP hid it behind the response's `Content-Type`;
saved to disk, opened over `file://` or embedded as an `iframe srcdoc`, the
title's U+00B7 came out as mojibake. `charset`, `viewport` and `title` now
precede it, and `router.test.tsx` pins the byte offset under 1024 alongside the
existing layer-order assertion.

The switchers are query params on the server, so light, dark and compact are
all reachable with the runtime absent — which is the third "done when".
`schemeBootScript` is not wired up here: it restores a remembered choice from
`localStorage`, and nothing in this task remembers a choice. Task 18 owns it
along with `mini`'s document.

## Tests

Per-tone and per-size server renders, plus the ones that enforce a documented
rule directly:

| Test | Enforces |
| --- | --- |
| `ui-remix/src/tokens.test.ts` — every key is `ui-` prefixed, every default is `var(--<primitive>)` against imported `primitiveNames`, or an allow-listed literal; no default contains `color-mix(` | `design-system.md:55-79`, and catches a default referencing a primitive that no longer exists |
| Button's emitted CSS block contains no hex colour and no raw length | "reads only `var(--ui-btn-*)`", in machine-checkable form |
| A gradient override of `ui-btn-primary-bg` lands in `:root` after the component default, with `button.tsx` untouched | done-when 2, and decision 2 above |
| Renaming a token is a `tsc` failure at `mini`'s theme | done-when 1 |
| `@layer base, rmx;` precedes the first `data-rmx-style` in the rendered document | decision 1 above |
| `<meta charset>` sits within the first 1024 bytes of a real response | decision 1's real invariant: ahead of remix's styles, not first in `<head>` |
| The disabled declarations share a block with the tone declarations they beat, per tone | decision 5 — the fix itself, asserted block by block rather than document-wide |
| `buttonBase`'s own block carries no `:disabled` at all | decision 5 — stops the split that caused the bug from returning unnoticed |
| The caller's `mix` block registers *before* the tone's when its descriptor also rendered earlier | decision 5 applied to `mix`: the narrow guarantee, so the prose cannot drift from it |
| `mini/src/theme.test.ts` — `sp-N` is N×4px | `design-system.md:62-70`, which asks for this test and has had nothing to put it in until now |
| `LinkButton` renders `<a href>` with no underline | that `rmx` beats `base`, the case `design-system.md:229-238` describes going wrong |
| `/c/button` renders every tone with `entry={null}` | done-when 3 |

The rename check is a type-level failure, so it is asserted with a
`@ts-expect-error` fixture in `mini` rather than by spawning a compiler from a
test. The mechanism is the inversion: the fixture overrides a token name that
does not exist, `@ts-expect-error` swallows the error, and if excess property
checking ever stops reaching that object the directive becomes unused — and an
unused `@ts-expect-error` is error TS2578 with no flag required. So
`bun run typecheck` fails the
day the proof stops proving anything, which is the failure mode that matters
more than the rename itself.

## Documents to correct

- `docs/design-system.md:161-226` ("Delivery") — `ThemeStyle` goes in `<head>`,
  with the reason: remix injects its own styles at the end of head, so body
  placement inverts the layer order. And it goes *after* `<meta charset>`,
  because the invariant is only that it precede remix's styles.
- `docs/design-system.md:80-84` — add `danger-hover` to the interactive-colour
  list and state why `success`/`warning`/`info` have no hover value.
- `docs/design-system.md:55-60` — note the border-width exception and the
  allow-list that keeps it honest.
- `docs/design-system.md:227-325` ("Cascade layers") — sub-layers are
  content-addressed rather than one per call site; a component's own blocks
  must be property-disjoint; the caller's `mix` adds but does not override;
  and the client's refcounted remove/re-insert can reorder blocks mid-session.
- `packages/ui-remix/README.md` — Button, LinkButton, ThemeStyle, the aggregate.
- `packages/ui-remix-mini/README.md` — the theme and the literal-keys constraint.
- `packages/ui-design/README.md` — the `danger-hover` addition.

## Out of scope

- `mini`'s `Document`, `AppShell`, `Nav` and the state components — task 18.
- The catalogue's switcher form, the page recipe, the SPA route — task 19.
- `compat.ts` and `runtime.ts` stay empty. Button needs no client JavaScript,
  and the JS-enhanced marker arrives with the first component that has a no-JS
  fallback to hide — task 17.
- Relaxing the emitter's character ban. `innerHTML` makes it optional; removing
  it is a separate change with its own reason.

## Inherited by later tasks

- Every component after this one copies the `tokens.ts` + `component.tsx` +
  `component.demo.tsx` + test shape, and is picked up by the aggregate and the
  demo registry by being added to them.
- `background` over `background-color` applies to every component token that a
  skin might set to a gradient. Layout and typography tokens are exempt;
  anything named `-bg` is not.
- The literal-keys constraint on theme objects holds for every theme anyone
  writes, not just `mini`'s.
