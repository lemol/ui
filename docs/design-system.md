# The design system

The token layer is the contract. Components are opinions about how to combine
tokens; the tokens are the part that must not drift.

## Two tiers

**Primitive tokens** are the design vocabulary — `--accent`, `--surface`,
`--ink-muted`, `--sp-4`, `--r-md`, `--dur-fast`. A theme supplies their values.

**Component tokens** are the retheming surface — `--ui-btn-primary-bg`,
`--ui-field-border`, `--ui-dialog-surface`. A component whose every value is a
structural keyword or a primitive — one a theme sets, or one a caller picks off
a scale — declares none; the layout components are all four of them. A
component with something to retheme declares its own, defaulting relationally
to a primitive:

```ts
// ui-remix/src/button/tokens.ts
export const buttonTokens = {
  "ui-btn-primary-bg":  "var(--accent)",
  "ui-btn-primary-ink": "var(--ink-inverse)",
  "ui-btn-radius":      "var(--r-sm)",
}
```

The component reads only its own tier, through `css()`:

```ts
// ui-remix/src/button/button.tsx
const toneStyle = (tone: ButtonTone) =>
  css({
    background:  `var(--ui-btn-${tone}-bg)`,
    color:       `var(--ui-btn-${tone}-ink)`,
    borderColor: `var(--ui-btn-${tone}-border)`,
    // In this block and not a shared one, because each css() call is its own
    // cascade sub-layer and layer order beats specificity. See "Cascade
    // layers" below before splitting a block.
    "&:disabled": {
      background: "var(--ui-btn-disabled-bg)",
      color:      "var(--ui-btn-disabled-ink)",
    },
  })
```

Which properties share a `css()` block is a correctness question, not a tidiness
one — [Cascade layers](#cascade-layers) is the part to read before writing the
second block.

A skin is then a set of values. An app keeps a distinctive button by overriding
one token and never touching the component:

```ts
"ui-btn-primary-bg":
  "linear-gradient(180deg, var(--accent-highlight), var(--accent) 65%, var(--accent-bronze))",
```

A default that cannot name a primitive is an exception, not a pattern, and the
allow-list in `ui-remix/src/tokens.test.ts` holds every one: `1px` for
`--ui-btn-border-width`, because `hairline` is a colour and there is no
border-width primitive; `transparent` for the ghost tone, which keeps a ghost
button the same size as a filled one; and `uppercase` for
`--ui-eyebrow-transform`, because caps are taste rather than structure and a
brand that sets things in sentence case must be able to say `none` instead of
forking the component. Adding a fourth means editing that list and arguing for
it.

**Naming.** Ramps you do arithmetic on are numeric, and the number is a
multiplier: `sp-4` is four 4px units. Sets you choose from are t-shirt sized:
`r-md`, `fs-lg`, `dur-fast`. Space is the only ramp, so this is one rule with
one exception to remember.

The 4px base is a resolution, not a constraint — a theme on an 8px grid uses
the even steps. The multiplier is not enforced by the compiler, because the
schema holds no values; it is checked by a test in the package that supplies
them.

**A component token default must not contain `color-mix()`.** Semantic tones
are named in full — `<tone>`, `<tone>-ink`, `<tone>-subtle`, `<tone>-border` —
so a component never derives one from another. Deriving would not remove the
mix ratio, it would move it into the component, where a literal `12%` is the
same kind of bug as a literal `200ms`: correct today, and impossible to retune
centrally. A theme that wants derived values may compute them itself; that is
a theme's business.

**A theme owes two contrast pairs per tone, not one.** `<tone>-ink` must be
readable on `<tone>`, which is the pair a solid fill uses. `<tone>` must also
be readable on `<tone>-subtle`, which is the pair a subtle fill uses — a
`Badge`, a callout, an inline status. Both are AA for normal text, 4.5:1, and
both are asserted over `mini`'s values in `src/mini/theme.test.ts`, in the
base axis and the dark one. A theme cannot satisfy the second by computing it:
that is the same `color-mix()` this section already rules out, one tier up.

**Interactive colours get a `-hover`; status colours do not.** `accent`, `link`
and `danger` are the colours something hovers, so each names its own hover
value. `success`, `warning` and `info` are read on static elements — a badge,
not a button — and get none until something needs one. A component deriving a
hover from a fill is the same violation as deriving a subtle from a tone.

**A property can belong to both tiers at once.** This is rare, not disallowed:
it happens when the element is ordinary markup someone else may author
directly, not only through the component. The reset's `:where(h1, …, h6)`
rule is the floor for a bare heading nobody wrapped; `heading/tokens.ts` is the
retheming surface for one that went through `Heading`. Where the two describe
the same property, they must share the data that produces it — `headingScale`
is what keeps a `Heading`'s size and a bare `<h2>`'s size from drifting apart —
because a floor and a retheming surface that happen to agree today, with
nothing tying them together, are one edit away from disagreeing tomorrow.

## Emission order

`ui-remix/src/tokens.ts` aggregates every component's record and exports the
union of their names as a type. One stylesheet is emitted, component defaults
first and theme values second:

```ts
emitTokensCss(theme, { componentTokens })
```

Same selector, same specificity, later wins. Custom properties do participate
in cascade layers, so layering them would work — but plain source order is
simpler, has no import-order trap, and needs no explanation. Layers are used
for element defaults only (see below).

## Typing

`ui-design` never learns which components exist; it takes a record. Because
`ui-remix-mini` depends on both packages, it wires the types together, so
`defineTheme` requires every primitive and type-checks every `--ui-*` override
against the names `ui-remix` actually declares.

A renamed token fails the typecheck instead of the design review. `v()` is
typed against the union of every primitive name, so prefer it over writing
`var(--surface)` by hand where the name is computed or easy to mistype.

## Themes and variants

The engine knows exactly two variant axes.

```ts
export const miniTheme = defineTheme({
  base: {
    "scheme-mode": "light",
    canvas: "#FBFBFA", surface: "#FFFFFF", ink: "#111111", hairline: "#EAEAEA",
    // … and the other 90 primitives
  },
  dark: {
    "scheme-mode": "dark",
    canvas: "#191919", surface: "#242424", ink: "#F4F4F0", hairline: "#3A3A3A",
  },
  compact: { "control-h": "28px", "row-h": "32px" },
})
```

`base` is total: every primitive the schema names, not a sample. `extendTheme`
is how a second theme avoids restating them.

Which emits:

```css
:root { --canvas: #FBFBFA; … }
@media (prefers-color-scheme: dark) {
  :root:not([data-scheme="light"]) { --canvas: #191919; … }
}
:root[data-scheme="dark"]     { --canvas: #191919; … }
:root[data-density="compact"] { --control-h: 28px; … }
```

- **Scheme.** `dark` is optional. A theme omitting it is single-scheme. The
  `:not([data-scheme="light"])` guard is what lets a manual choice beat the
  media query.
- **Density.** A four-token swap — `--control-h`, `--control-h-sm`, `--row-h`,
  `--row-pad-y`. Every control and table row reads those, so one attribute
  retunes the whole app without a single component knowing density exists.
- **`scheme-mode`** is the value `color-scheme` takes; the reset reads it as
  `color-scheme: var(--scheme-mode)`. A theme with a `dark` axis must set it in
  both, or the page pairs dark colours with light form controls and scrollbars.
  The emitter cannot infer it — a dark-only theme has no `dark` axis to infer
  from — which is why it is a token rather than a rule.

A third axis (contrast, brand) waits until something needs one. A general
named-modes mechanism was rejected: it would require designing a
selector-precedence story for combinations that do not yet exist.

## Delivery

`ThemeStyle` renders the emitted sheet, and it belongs in `<head>`:

```tsx
<ThemeStyle theme={miniTheme} />
```

**The placement is load-bearing.** `remix/ui` collects every `css({...})` rule
and splices the resulting `<style>` elements in immediately before `</head>` —
after all authored head content, before anything in the body. A `ThemeStyle` in
the body is therefore evaluated after `@layer rmx.*` already exists, and
`@layer rmx-reset, base, rmx;` then registers `base` at the *end* of the order
rather than the front, because a layer statement cannot move a layer that
exists. Element
defaults start beating components, with no error at all.

**The requirement is that it precede remix's styles, not that it come first in
`<head>`.** Remix splices only its own styles, so anything it does not splice
may sit ahead of `ThemeStyle` — and `<meta charset>` must, because the HTML
spec only honours a charset declaration within the first 1024 bytes and the
emitted sheet is kilobytes long. Put `ThemeStyle` first and the charset lands
past 8KB, where it is ignored. That is invisible over HTTP, since the response
carries a `Content-Type`, and shows up the moment the page is saved to disk,
opened over `file://` or embedded as an `iframe srcdoc`: the document decodes
with a locale default and any non-ASCII text becomes mojibake. So `charset`,
`viewport` and `title` go first, then `ThemeStyle`, then everything else.

A `<style>` element in the body is valid CSS and does apply document-wide; it
is the layer order, not the stylesheet, that body placement breaks.

A runtime assertion cannot catch it. `ThemeStyle` renders during the tree walk
and remix injects its style elements afterwards, so at render time there is no
remix style element to detect. The guard is a render test asserting that
`@layer rmx-reset, base, rmx;` precedes the first `data-rmx-style` in the
document.

`emitTokensCss()` stays exported for anyone who prefers a static file, and
`layerStatement` is exported separately for an SPA that wants the statement in
`index.html` and the token blocks in the app tree.

This also avoids two traps `@mionso/design` carries from injecting a template
literal as `<style>` text, both pinned by tests there: no backticks anywhere in
the sheet, including comments, because they terminate the template literal; and
no `<`, `>` or `&`, because the renderer escapes them, so a child combinator
would ship as `&gt;` and silently break its rule.

`emitTokensCss()` enforces both on the values it is handed: a name or value
carrying a backtick, `<`, `>`, `&`, `{` or `}` throws, naming the token and the
character, because the alternative is a declaration that dies with no error at
all. The same rule means **no CSS nesting anywhere in the sheet** — `&` is
escaped like any other character, so a nested rule ships broken. Grouped
selectors are flat `:where(...)` lists.

`schemeBootScript` stays inline in the document — `<head>` on the server,
`index.html` in SPA. It restores the remembered scheme and density before the
first paint, so nothing reflows, reading `lemol-ui:scheme` and
`lemol-ui:density`. Both are exported as `schemeStorageKey` and
`densityStorageKey`, so a switcher cannot drift from what the script reads, and
the values are allow-listed rather than written through. It is wrapped in
`try`/`catch`, because a private window that refuses `localStorage` must not
take the page down.

Stamping the JS-enhanced marker is `ui-remix`'s job: the marker exists to hide
no-JS fallbacks, which is a component concern in the package that knows what a
component is. `ui-remix` concatenates this script and exports the composed
string, so a document still inlines one.

## Cascade layers

This is the part that is easy to get wrong. `remix/ui` emits every `css({...})`
rule into the `rmx` cascade layer, and **unlayered CSS beats layered CSS
regardless of specificity**. So an unlayered

```css
a { text-decoration: underline; }
```

overrides a component's own `mix={css({ textDecoration: "none" })}` — which is
how a link-styled button ends up blue and underlined.

The emitted sheet therefore opens with

```css
@layer rmx-reset, base, rmx;
```

and puts every element default inside `@layer base`. Base loses to components;
components lose to nothing.

**The three names are ordered weakest to strongest, and the weakest one is
unused.** `rmx-reset` is `@remix-run/ui`'s own reset layer (`REMIX_UI_RESET_LAYER`)
— declared in the package, not yet emitted into by the version this repo
depends on. It is named here anyway, first, so that if a future remix release
starts emitting a generic element reset into it, that reset registers where it
already belongs — beneath `base` — instead of registering wherever first use
happens to land. `base` sits in the middle: our own token-wired element
defaults must beat a generic third-party reset, and must still lose to `rmx`.
`rmx` stays last, because components must beat every reset, including one that
does not exist yet. remix's own README prescribes the two-layer
`@layer base, rmx;` form — reasonably, since it has no reason to name a layer
it does not use — so this repo's three-layer statement is a forward hedge on
top of that, not a disagreement with it.

**Layer order is fixed by the first `@layer` statement the browser sees.** If
remix's stylesheet is evaluated before the emitted sheet, `rmx` already exists
and our statement appends the other two after it — inverting the order with no
error, so element defaults start beating components. The emitted sheet has to
reach the document first. The same rule is why naming `rmx-reset` now, rather
than when remix first emits into it, matters: waiting means that layer
registers on remix's schedule, not this statement's, and nothing would signal
the moment it happened.

**`rmx` is not one layer; every distinct `css({...})` style object gets its own
sub-layer.** The emitted style element reads
`@layer rmx.rmxc-<hash> { .rmxc-<hash> { … } }`. Blocks are content-addressed,
not per call site: `processStyleClass` hashes the style object and caches by
that hash, so two `css()` calls in different files with equal objects collapse
into one class and one sub-layer, while one `css()` call whose object differs by
a single value is a separate sub-layer. Reason about the objects, because "one
block per call site" is wrong in both directions — it over-counts identical
blocks and under-counts a factory like `toneStyle(tone)` that produces four.

Within cascade layers, layer order beats specificity — a rule in an earlier
sub-layer loses to a rule in a later one no matter how specific it is. A
`&:disabled` override sitting in one `css()` block therefore loses to a plain
`color` declaration in a different block whose sub-layer registers second, even
though `:disabled` is the more specific selector. **When one `css()` block must
override another on the same element, put both declarations in the same block**
— relying on specificity across two `css()` calls does not work, no matter
which one is written second.

Sub-layer order follows render order, not source order, and reordering a
component's `mix` array does not fix it: registration happens the first time a
given style object is encountered during the render, so a page whose first
button happens to be disabled registers the disabled block before any tone
block, and the bug reappears on every other page regardless of how `mix` is
written.

**Client-side, the order is not even stable within one session.**
`createStyleManager.remove()` deletes a rule once its refcount reaches zero,
and the next `insert()` appends it at the *end* of the sheet rather than at its
old index. So unmounting the last element using a block and mounting another
one later moves that block behind everything else. This is the stronger reason
for the co-location rule: it holds even where render order is fixed and
predictable, because nothing about the initial order is permanent. Blocks
adopted from the server render are pinned and never removed, so the churn is
confined to blocks first inserted on the client.

**A component's own blocks must be property-disjoint.** If `buttonBase`,
`sizeStyles` and `toneStyles` each declare properties none of the others
declare, no two of them can ever contend and their sub-layer order stops
mattering. That is what makes the component correct under any order rather than
under the order observed today. Adding `padding-inline` to a shared base block
when a size block already sets it reintroduces the bug — and it reintroduces it
silently, since both declarations are present and only one wins.

**Disjointness is a question about one element, not one document.** Two blocks
on two different elements never contend for a cascade slot, so a property both
declare is not a collision: `Field`'s label and its control both set `color`,
legitimately. A component that styles several elements asks the question per
element — `test/styles.ts` has `blocksOn(html, tag)` for exactly that, and a
disjointness assertion should check the list is non-empty first, since an empty
one satisfies it without proving anything.

**A shorthand in one block and its longhand in another collide where no test
can see it.** `padding-inline` in a base block and `padding-inline-end` in a
variant block conflict in CSS, while a check that compares property names sees
two different names and passes. `Field` declares padding as longhands
throughout for this reason, and keeps `background` as a shorthand only because
no other block on the control declares a background longhand. The rule is about
a shorthand and a longhand in two blocks on one element, not about shorthands
generally.

**Write the `&` in a nested selector explicitly.** `remix/ui` emits a `css()`
block's nesting verbatim, so `&:disabled` and `& > svg` reach the browser
intact. `&`-led nesting is Chrome 112, below the baseline; bare-element
nesting, `svg { … }` with no `&`, is Chrome 120, above it. The escaping hazard
that bans nesting in `ui-design/src/css` is a different mechanism: that sheet
ships as the text of a style element, where the renderer escapes `&`.

**An axis with a default takes its property away from `mix`.** Disjointness is
easy to satisfy while a component's axes are independent, as `Button`'s base,
size and tone are. It gets harder the moment an axis has a default, because the
default and the value that replaces it are the same property — and the obvious
arrangement, a default in the base block with a step block over the top, is
exactly what the rule forbids. Two blocks would declare `gap`, so render order,
not the author, would decide which paints.

The resolution is to decide per axis whether it has a default at all:

- **An axis with a default** renders its block always, carrying the default as
  its value. There is one block for that property, so there is nothing to
  order.
- **An axis without one** renders its block only when asked for — when the prop
  is passed, or for a boolean axis when it is `true`. The component then
  declares that property nowhere, and the browser's own default applies.

A block is left out by putting `undefined` in the `mix` array — `remix/ui`
skips undefined entries, so `align === undefined ? undefined : alignStyles[align]`
composes nothing when the prop is absent. That is behaviour of `mix` rather
than of any one component, so it holds anywhere a descriptor is conditional.

The second case has a benefit worth designing for. `mix` reliably adds a
property the component does not declare and reliably overrides nothing — so an
axis that renders no block by default stays fully reachable through `mix`, and
the caller chooses which channel to use. Only passing the prop and setting the
property through `mix` at once is ambiguous, and that is visibly the caller's
error rather than a silent one.

So an axis given a default costs something: it takes that property away from
`mix` for every caller. Give an axis a default when the unset behaviour is
wrong almost every time — a horizontal row stretching items of unequal height —
and leave it out when the component has no business presuming, as with spacing.

**The caller's `mix` is subject to the same rule, so a component's `mix` prop
adds but does not override.** Composing the caller's descriptor last in a `mix`
array does not give it the last sub-layer. If that descriptor already rendered
on an earlier element, it registered first and the component's own declarations
beat it. Document `mix` as what it is: a way to set properties the component
leaves alone. Overriding a property the component declares goes through its
`--ui-*` token, which is the entire purpose of the component tier.
`!important` is the other reliable exit, since `remix/ui` emits no `!important`
of its own and passes one through untouched — but an `!important` in a caller's
one-off is a token that should have existed.

**When you add a global element default, put it in `@layer base`.** Reach for
unlayered only when a rule must override a component, and say why in a comment.
One such rule is load-bearing:

```css
[hidden] { display: none !important; }
```

The user agent's own `[hidden]` rule loses to any author `display`, and most
components set one — so without this, toggling `element.hidden` from the
runtime silently does nothing.

That is the only unlayered rule `ui-design` ships. The other one in this system
— hiding a no-JS fallback once the runtime is live — comes from `ui-remix` with
the marker it reads.

## Adding a token

**A primitive:** add the **name** to the right group in
`ui-design/src/tokens.ts`. That package holds no values. The name union
widens, so `v("your-token")` typechecks immediately, and every theme then
fails to compile until it supplies a value — which is the intended prompt,
not an obstacle.

**A component token:** put it in that component's `tokens.ts`, defaulting to a
primitive. The aggregate in `ui-remix/src/tokens.ts` picks it up and themes can
override it. Name it `--ui-<component>-<part>-<property>`.

**Neither, if you are reaching for a one-off pixel value.** Compose from the
space scale. A one-off is how two screens stop looking like one product.
