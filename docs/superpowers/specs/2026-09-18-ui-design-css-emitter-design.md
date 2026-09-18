# ui-design/css: the emitter, the layers, the reset and the boot script

Date: 2026-09-18
Task: M1 / 11
Status: agreed, not yet implemented

`packages/ui-design/src/css/{emit,layers,reset,boot}.ts` behind the opt-in
`/css` subpath. `emitTokensCss()` returns CSS text and never a component, so
the package stays the one a future `ui-opentui` can share. The sheet it returns
is delivered as the text of a `<style>` element, and that single fact drives
half the decisions below.

## The six decisions

### 1. Reduced motion zeroes the duration tokens, not every animation

Inside `@media (prefers-reduced-motion: reduce)`, the emitter writes `0ms` for
every `dur-`-prefixed name in `schema.motion`. It does not ship a universal
`*, *::before, *::after { animation-duration: 0ms !important }` block.

**Why.** Token zeroing reaches everything the contract covers, including
`::view-transition-old(root)` and `::view-transition-new(root)`, which a `*`
selector cannot match at all — and view transitions are the motion most worth
suppressing, because they animate the whole viewport. It also needs no blanket
`!important`, so an app that has a genuinely reduce-safe animation keeps it.

The universal block catches one extra case: CSS that hard-codes a duration.
Inside these packages that case is a violation of principle 1, and masking it
is the wrong response — a component that keeps animating under `reduce` is how
you discover it hard-coded `200ms`. Third-party widget CSS is the honest gap,
and it belongs to the app that chose the widget.

The universal block also carries `animation-iteration-count: 1`, which freezes
a loading spinner mid-signal. Zeroing the duration instead leaves an infinite
animation running with no visible motion, which is the correct reading of the
preference: no motion, not no feedback.

**The zeroed declarations do carry `!important`, for a different reason.** The
block selects `:root`, while the density block selects
`:root[data-density="compact"]` — higher specificity. A theme that put a
duration in its `compact` axis would beat the zeroing and silently keep
animating. `!important` on a generated custom-property declaration nobody
should want to override is cheaper than a second rule forbidding durations
outside `base`.

### 2. The reset ships element defaults, admitted by one test

`reset.ts` carries a `@layer base` block of element defaults, not just a
structural reset. A rule is admitted only if it is:

- cross-browser normalization with no aesthetic content, or
- wiring a bare element to the token contract at zero specificity through
  `:where()`, with every value coming from a token.

Anything needing a literal number is either given a token name or does not
ship.

**Why.** `docs/architecture.md` already places element defaults here, and
`docs/design-system.md` already says the *emitted sheet* carries them. The
rules at stake are mostly accessibility-load-bearing: a visible
`:focus-visible` ring, underlined links, and `[hidden]` beating a component's
own `display`. Pushing those to applications means each one re-derives them,
and one of them gets it wrong with nothing to catch it.

The package's stated limit is no *values*, not no CSS, and the admission test
is what keeps that distinction from eroding into a skin. It is also what
excluded most of what `@mionso/design` has in the same position: the radial
background wash, scrollbar theming, `text-decoration-thickness: 1px`,
`text-underline-offset: 2px`, the focus ring's `border-radius`, and
`-webkit-font-smoothing: antialiased`.

The two alternatives both cost more. A structural-only reset leaves every app
writing its own link and focus rules. Moving the look into `ui-remix-mini`
needs a second sheet to deliver and a new CSS-emitting export in a package
whose theme is currently pure data, and gives every consumer that is not `mini`
nothing.

### 3. Unsafe values throw at emit time

`emitTokensCss()` scans every name and value it is about to write and throws,
naming the token and the character, on `` ` ``, `<`, `>`, `&`, `{` or `}`. It
also throws on a key that is neither a `PrimitiveName` nor `ui-`-prefixed, and
on a `theme.base` missing primitives, listing them.

**Why.** The sheet is the text of a `<style>` element. The renderer escapes
`&`, `<` and `>`, so a value carrying one ships as `&amp;` and the declaration
dies with no error, no warning and no stack — principle 6's silent failure,
arriving as "one colour is wrong in production" months later. A backtick
terminates the template literal if anyone ever inlines the sheet in source,
which is the trap `@mionso/design` records. `{` and `}` in a value would break
out of the block it sits in.

Escaping the characters instead was rejected: CSS escapes are valid in
identifiers and strings but not in arbitrary positions, so an unquoted
`url(a>b)` would be silently mangled. That trades a loud failure for a quiet
wrong answer, and nobody reading the emitted sheet expects escapes in it.

`;` stays legal. `data:image/svg+xml;base64,…` needs it, and a `;` in a value
is a first-party theme's own business, not a boundary this emitter is
defending. A *raw* SVG data URL contains `<` and is therefore rejected — the
theme author base64-encodes it or uses a file, and the error says so.

The missing-primitive check is redundant with the types and kept anyway,
because a `var()` on an undeclared property resolves to nothing: the cheapest
possible thing to get wrong and the hardest to see.

### 4. `color-scheme` is a token, not emitter logic

The reset declares `color-scheme: var(--scheme-mode)` once on `html`, and
`scheme-mode` joins the schema as a name a theme supplies — `light` in `base`,
`dark` in its `dark` axis.

**Why.** Every alternative makes the emitter guess something it cannot know. A
dark-only theme has no `dark` axis, so "write `light` in `:root`" is wrong for
it. Writing `color-scheme: light dark` breaks the manual-light-over-dark-OS
case: the `:not([data-scheme="light"])` guard excludes the media block's token
values but not `:root`'s `color-scheme`, so the page would show light colours
with dark form controls and dark scrollbars. Fixing that by hand means a fifth
emitted block whose only job is to undo a property the emitter chose.

As a token it needs no special case at all, and the `dark` axis carries it
through the same mechanism as everything else. Custom-property substitution
works on any property, `color-scheme` included.

The cost is real but bounded: a theme that omits `scheme-mode` from its `dark`
axis gets light form controls in dark mode. That is a test in the package that
supplies values, alongside the `sp-N` multiplier test already inherited there.

### 5. The boot script restores the two axes; `ui-remix` owns the enhanced marker

`ui-design/css` exports `schemeBootScript`, which restores `data-scheme` and
`data-density` and nothing else, plus `schemeStorageKey` and
`densityStorageKey`. The JS-enhanced marker is stamped by a script in
`ui-remix`, which concatenates this one and exports the composed string for a
document to inline.

**Why.** The two axes are token axes: the emitted sheet's own selectors read
them, so restoring them before first paint is this package's business. The
enhanced marker exists to hide no-JS fallbacks, which is a component concern in
a package that knows what a component is. Putting it here would make
`ui-design` export an attribute name whose only consumer is a runtime it must
not know about.

The dependency direction makes the composition work in exactly one place:
`ui-remix` may import `ui-design`, never the reverse. A document inlines one
string, so nothing is harder to use.

This resolves a disagreement between two documents. `docs/architecture.md`
describes `boot.ts` as "no-flash scheme and density restore";
`docs/design-system.md` says `bootScript` "stamps the enhanced marker and
restores the remembered scheme and density". The former is now right and the
latter gets corrected.

### 6. One string, and layer order makes delivery order load-bearing

`emitTokensCss()` returns the whole sheet: the layer statement, the token
blocks, the reset, the unlayered rule and the reduced-motion block. No flags,
no partial emission.

**Why.** `docs/design-system.md` promises one stylesheet, and every part of it
is inert without the others — a reset that reads tokens no one declared, or
token blocks with no layer statement ahead of them, are not useful products.

The consequence to record: **cascade-layer order is fixed by the first `@layer`
statement the browser sees.** `remix/ui` emits its `css({...})` rules into the
`rmx` layer, and its own README prescribes `@layer base, rmx;` for exactly this
reason. If remix's stylesheet is evaluated first, `rmx` is created first and our
later statement appends `base` *after* it — inverting the order, so element
defaults start beating components. The sheet must therefore be evaluated before
remix's styles. That constraint belongs to task 12's `ThemeStyle` to satisfy
and to `docs/design-system.md` to state; here it is a test that the statement is
the sheet's first line.

## Two names the schema gains

The schema goes from 93 primitives to 95.

| Name | Group | Why |
| --- | --- | --- |
| `scheme-mode` | `color` | Decision 4. The value a theme gives `color-scheme`: `light` in `base`, `dark` in the `dark` axis. It sits in `color` because selecting the UA's colour scheme is what it does. |
| `focus-ring-offset` | `elevation` | `focus-ring` holds the whole `outline` shorthand, but `outline-offset` is a separate property and cannot be folded into it. Without the name, the reset either hard-codes a literal or borrows `--sp-1`, which is four units of the space ramp and too wide for a ring. |

Both are additive: the union widens, `v()` typechecks them immediately, and
every theme fails to compile until it supplies values. No theme exists yet.

## The emitted sheet

Blocks in this order. Blocks 3 through 5 appear only when the matching axis
exists on the theme.

```css
@layer base, rmx;

:root {
  /* component-token defaults first, then theme.base */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-scheme="light"]) { /* theme.dark */ }
}

:root[data-scheme="dark"]     { /* theme.dark */ }
:root[data-density="compact"] { /* theme.compact */ }

@layer base { /* the reset */ }

[hidden] { display: none !important }

@media (prefers-reduced-motion: reduce) {
  :root { /* every dur- name at 0ms !important */ }
}
```

Within a block, declarations are written in `primitiveNames` order — which is
`schema` group order — and any `ui-`-prefixed keys follow in insertion order.
Component-token defaults precede `theme.base` under the same selector at the
same specificity, so a theme's override of a component token wins on source
order alone. No cascade-layer subtlety for custom properties, and no
import-order trap.

The `:not([data-scheme="light"])` guard is what lets a manual choice beat the
media query. The `[data-scheme="dark"]` block repeats the same declarations
unguarded so a manual dark choice wins on a light OS.

## The reset

```css
@layer base {
  *, *::before, *::after     { box-sizing: border-box }
  html                       { -webkit-text-size-adjust: 100%;
                               color-scheme: var(--scheme-mode) }
  body                       { margin: 0; background: var(--canvas); color: var(--ink);
                               font-family: var(--font-sans); font-size: var(--fs-md);
                               line-height: var(--lh-base) }
  :where(h1, h2, h3, h4, h5, h6, p, figure, blockquote, dl, dd) { margin: 0 }
  :where(h1, h2, h3, h4, h5, h6) { font-weight: var(--fw-bold);
                               letter-spacing: var(--tr-tight); line-height: var(--lh-tight) }
  :where(img, svg, video, canvas) { display: block; max-width: 100% }
  :where(code, kbd, samp, pre) { font-family: var(--font-mono) }
  :where(button, input, select, textarea, optgroup) { font: inherit; color: inherit }
  :where(table)              { border-collapse: collapse }
  :where(a)                  { color: var(--link); text-decoration: underline }
  :where(a:visited)          { color: var(--link) }
  :where(a:hover)            { color: var(--link-hover) }
  :where(:focus-visible)     { outline: var(--focus-ring);
                               outline-offset: var(--focus-ring-offset) }
  ::selection                { background: var(--accent-subtle); color: var(--ink) }
}
```

`margin: 0` on headings and `p` is in because the layout components own
spacing. A default margin fighting `gap` is the first thing that goes wrong
when `Stack` arrives.

`:where()` everywhere keeps these at zero specificity, so a component's own
rule wins even inside the same layer, and an application's unlayered rule wins
outright. Overriding the look costs one declaration and no `!important`.

`[hidden] { display: none !important }` is the one deliberately unlayered rule.
The user agent's own `[hidden]` loses to any author `display`, and most
components set one — so without it, toggling `element.hidden` from a runtime
silently does nothing. `@mionso/design` has a second unlayered rule that hides
the no-JS submit fallback; that one follows the enhanced marker into
`ui-remix`.

**No CSS nesting anywhere in this sheet, ever.** `&` is HTML-escaped inside
`<style>`, so a nested rule ships broken. Every grouped selector above is a
flat `:where(...)` list for that reason, and it is why decision 3 rejects `&`
in values rather than trusting authors to remember.

The same applies to comments: no backticks, no `<`, `>` or `&` in them either.

## The boot script

```js
(function(){try{var r=document.documentElement
var s=localStorage.getItem("lemol-ui:scheme")
var d=localStorage.getItem("lemol-ui:density")
if(s==="light"||s==="dark")r.setAttribute("data-scheme",s)
if(d==="compact")r.setAttribute("data-density","compact")}catch(e){}})()
```

Emitted as one line, inlined in `<head>` on the server and in `index.html` in
SPA mode, before the stylesheet, so the remembered choice applies on the first
paint instead of flashing.

Values are allow-listed rather than written through: a stale or hand-edited
storage entry cannot put arbitrary text into a root attribute. `try`/`catch`
because a private window that refuses `localStorage` must not take the page
down. `comfortable` and a missing key both mean "set nothing" — `base` is the
default, so there is no third state to represent.

The keys are exported because the switchers that write them live in another
package, and a key that agrees by coincidence is a key that drifts.

## The API

| File | Responsibility |
| --- | --- |
| `src/css/layers.ts` | `layerStatement` and a `base()` wrapper. Constants. |
| `src/css/reset.ts` | The `@layer base` block, the unlayered rule, and the reduced-motion block built from `schema.motion`. Constants. |
| `src/css/boot.ts` | `schemeBootScript`, `schemeStorageKey`, `densityStorageKey`. Constants. |
| `src/css/emit.ts` | `emitTokensCss()`: validation, then composition. The only module that knows what a `Theme` is. |
| `src/css/index.ts` | The `/css` barrel. Modified — currently `export {}`. |

```ts
export interface EmitOptions<C extends string = never> {
  readonly componentTokens?: Readonly<Record<C, string>>
}

export function emitTokensCss<C extends string = never>(
  theme: Theme<C>,
  options?: EmitOptions<C>,
): string
```

`src/index.ts` must not import `./css`. The subpath exists so that taking the
schema does not mean taking the stylesheet.

## Tests

- Block order, by index comparison, and `@layer base, rmx;` as the first line.
- Component defaults precede theme values under `:root`, proved with a key
  present in both.
- The dark, media and compact blocks are absent when those axes are.
- `:not([data-scheme="light"])` guards the media block and not the explicit one.
- **Reduced motion, iterating `schema.motion`**: every `dur-`-prefixed name is
  zeroed. Adding a duration name later fails this test until the emitter covers
  it, which is the point of grouping the schema.
- Whole-sheet safety: no backtick, `<`, `>` or `&` anywhere, comments included.
- One test per throw: unsafe character, unprefixed key, missing primitives.
- Every element default is inside the base block; `[hidden]` is outside it.
- The boot script through `new Function` against a stub `document`, then
  against a `localStorage` that throws, proving the allow-list and the catch
  without a browser.
- `src/index.ts` carries no `./css` specifier.

`test/boundaries.test.ts` already names `ui-design/src/css/emit.ts` in its
fixtures, and `test/packages.test.ts` already resolves the `/css` subpath, so
neither needs changing.

## Documents to correct

1. **`docs/design-system.md`, "Delivery"** — `bootScript` no longer stamps the
   enhanced marker. It restores scheme and density; the marker is `ui-remix`'s.
   Name the two storage keys.
2. **`docs/design-system.md`, "Cascade layers"** — add that layer order is
   fixed by the first `@layer` statement the browser sees, so the emitted sheet
   must be evaluated before remix's styles or the order inverts. Note that the
   no-JS fallback rule lives in `ui-remix`, leaving `[hidden]` as the only
   unlayered rule here.
3. **`docs/design-system.md`, "Emission order"** — add `scheme-mode`, the
   reduced-motion `!important` and its reason, and the no-nesting rule.
4. **`docs/motion.md`, "Reduced motion"** — the mechanism is duration-token
   zeroing, not a universal override. State the consequence: a hard-coded
   duration survives, and that is how the violation gets found.
5. **`docs/architecture.md`, the file tree** — `boot.ts` exports
   `schemeBootScript`, not `bootScript`; the composed string with the marker is
   `ui-remix`'s. `reset.ts` also carries the reduced-motion block.
6. **`packages/ui-design/README.md`** — the "Status" section says `/css` is
   stubs. Update it.
7. **`packages/ui-design/src/tokens.ts`** — 95 names, and its header comment
   already anticipates the reduced-motion iteration.

## Out of scope

- `ThemeStyle`, the composed boot script with the enhanced marker, and
  `ui-remix/src/tokens.ts` — task 12.
- Any actual colour, pixel, duration or curve, including the values for the two
  new names — task 18.
- A third variant axis. Two is what the engine knows.

## Inherited by later tasks

- **Task 12** satisfies the delivery constraint from decision 6: the emitted
  sheet must be evaluated before `remix/ui`'s styles, or `base` lands after
  `rmx` and element defaults start beating components. It also owns the
  enhanced-marker script and the unlayered rule that reads the marker.
- **Task 18** owns the test that `scheme-mode` is present in both `base` and
  the `dark` axis. Omitting it from `dark` yields light form controls in dark
  mode, and no check here can see it.
- **Task 19**'s scheme and density switchers must write `schemeStorageKey` and
  `densityStorageKey` rather than string literals.
