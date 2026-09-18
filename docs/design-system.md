# The design system

The token layer is the contract. Components are opinions about how to combine
tokens; the tokens are the part that must not drift.

## Two tiers

**Primitive tokens** are the design vocabulary — `--accent`, `--surface`,
`--ink-muted`, `--sp-4`, `--r-md`, `--dur-fast`. A theme supplies their values.

**Component tokens** are the retheming surface — `--ui-btn-primary-bg`,
`--ui-field-border`, `--ui-dialog-surface`. Each component declares its own,
defaulting relationally to a primitive:

```ts
// ui-remix/src/button/tokens.ts
export const buttonTokens = {
  "ui-btn-primary-bg":  "var(--accent)",
  "ui-btn-primary-ink": "var(--ink-inverse)",
  "ui-btn-radius":      "var(--r-sm)",
}
```

The component reads only its own tier:

```ts
// ui-remix/src/button/button.tsx
const toneStyles = {
  primary: {
    background: "var(--ui-btn-primary-bg)",
    color:      "var(--ui-btn-primary-ink)",
  },
}
```

A skin is then a set of values. An app keeps a distinctive button by overriding
one token and never touching the component:

```ts
"ui-btn-primary-bg":
  "linear-gradient(180deg, var(--accent-highlight), var(--accent) 65%, var(--accent-bronze))",
```

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

`ThemeStyle` renders the emitted sheet:

```tsx
<ThemeStyle theme={miniTheme} componentTokens={componentTokens} />
```

A `<style>` element is valid in the body and applies document-wide, so this
works in server mode and inside the SPA tree with no special casing.
`emitTokensCss()` stays exported for anyone who prefers to write a static file
and link it.

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
@layer base, rmx;
```

and puts every element default inside `@layer base`. Base loses to components;
components lose to nothing.

**Layer order is fixed by the first `@layer` statement the browser sees.** If
remix's stylesheet is evaluated before the emitted sheet, `rmx` already exists
and our statement appends `base` after it — inverting the order with no error,
so element defaults start beating components. The emitted sheet has to reach
the document first.

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
