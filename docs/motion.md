# Motion

Motion is native. Entry and exit animations on `<dialog>` and `popover`
elements need no JavaScript, which is the same reason the rest of
[interactivity.md](interactivity.md) works the way it does.

## Tokens

Transitions name a duration token and an easing token — never a literal curve.

- **Durations** — `--dur-instant` (80ms) through `--dur-slow` (400ms).
- **Easings** — `--ease-out-quad` for most transitions, `--ease-spring` for
  entrances, `--ease-in-out-smooth` for view transitions.

A literal `200ms` or `cubic-bezier(...)` in a component is a bug. It is how two
screens stop feeling like one product, and it cannot be retuned centrally.

## Entry and exit

Three CSS features do the work:

| Feature | Job | Status |
| --- | --- | --- |
| `@starting-style` | Defines the state to animate *from*, for an element arriving from `display: none` | Baseline 2024 — Chrome 117, Safari 17.5, Firefox 129 |
| `transition-behavior: allow-discrete` | Lets `display` transition instead of snapping: visible immediately on enter, held until complete on exit | Baseline with Firefox 129 |
| `overlay` | Keeps a closing element in the top layer for the duration of its exit | **Not Baseline.** Experimental; absent in Safari |

```css
dialog {
  transition: translate var(--dur-fast) var(--ease-out-quad),
              opacity   var(--dur-fast) var(--ease-out-quad);
  transition: translate var(--dur-fast) var(--ease-out-quad),
              opacity   var(--dur-fast) var(--ease-out-quad),
              overlay   var(--dur-fast) allow-discrete,
              display   var(--dur-fast) allow-discrete;
}

@starting-style {
  dialog[open] { translate: 0 -8px; opacity: 0; }
}
```

Three things about that snippet are deliberate:

- **The shorthand is declared twice.** The first, without `allow-discrete`,
  keeps `translate` and `opacity` transitioning on engines that do not support
  `transition-behavior`. The second upgrades it where they do.

  In a `css()` object the second declaration goes in a nested `&` block, because
  a JavaScript object cannot hold the same key twice:

  ```ts
  transition: `opacity ${timing}, translate ${timing}`,
  "&": { transition: `opacity ${timing}, translate ${timing}, display ${duration} allow-discrete` },
  ```

  CSS nesting gives `&` the same specificity, later in source order, so the
  second wins where `allow-discrete` parses and is dropped whole where it does
  not.
- **`@starting-style` targets the state being entered** — `dialog[open]`, not
  `dialog`; `[popover]:popover-open`, not `[popover]`. Targeting the resting
  state is the most common way to get nothing.
- **`@starting-style` carries no specificity boost**, unlike `@keyframes`. An id
  selector, an inline style, or an `!important` elsewhere will silently beat it.

**Declare `display` only in the open state.** A closed `<dialog>` and a closed
popover are `display: none` from the user-agent sheet, and any author
declaration beats that — cascade layers do not change it, because layered
author CSS still outranks the UA origin. A `display` at the top level of a
component's block renders every one of them, open or not.

`allow-discrete` is not a substitute for `@starting-style`. The first prevents
snapping; the second supplies the initial state. Entry animations need both.

**The `overlay` gap is real and acceptable.** Without it a closing element
leaves the top layer immediately, so **exit animations degrade in Safari while
entry animations work**. Entry is the half users notice, so we take the split
rather than hand-writing a JavaScript close sequence to paper over it.

**A sheet slides, and only slides.** On a narrow screen an overlay becomes a
sheet (`src/remix/sheet/sheet.ts`), which travels its own height from below
over `--ui-sheet-transition-duration` (the base step, not the fast one: the
same 120ms over a whole sheet's height reads as a jump) on the spring easing.
It is opaque from its first frame, as a phone draws one; the entry's fade is
the scrim's. The rules restate `translate` for the closed state, the open state
and `@starting-style`, and come last in the component's block so they win the
desktop entry by source order.

**Degradation is silent by design.** An engine that does not know
`@starting-style` ignores the block — the element appears with no entry
animation and nothing breaks. No polyfill. This is also why `@starting-style`
needing Safari 17.5 does not push our 17.0 floor up.

## Reduced motion

`prefers-reduced-motion: reduce` zeroes **every duration token** in the emitted
sheet, so no component opts in individually. Token zeroing rather than a
universal `*` override, because it also reaches the `::view-transition-*`
pseudo-elements a universal selector cannot match — and those animate the whole
viewport.

The consequence is deliberate: CSS that hard-codes a duration keeps animating.
That is a violation of the token contract, and finding it this way beats
masking it.

Do not fight that media query from inside a component. If an interaction is
unusable without motion, the interaction is the problem.

## View transitions

Two distinct features with different support, both opt-in CSS with no
JavaScript.

**Same-document** — covers **Remix frame navigation**, since a frame response
swaps DOM in place. Cross-browser: Chrome 111, Safari 18, Firefox 144.

**Cross-document** — covers full document loads:

```css
@view-transition { navigation: auto; }
```

Chrome 126+, Safari 18.2+, and **not in stable Firefox**. MDN lists
`@view-transition` as limited availability, explicitly not Baseline; treat 2026
posts claiming otherwise with suspicion. The failure mode is an ordinary
navigation, so it costs nothing to opt in.

### Names must be minted, not written

Two visible elements sharing a `view-transition-name` **throw and skip the
transition entirely**. In a reusable component library that is a live hazard:
render two cards with the same name and the whole page's transition dies.

This is the same failure class as `commandfor`, and it gets the same treatment —
names are minted and scoped by the component, never hand-written. See the
`overlay()` pattern in [interactivity.md](interactivity.md).

## Adding a transition

1. **Name tokens, not values.** A duration token and an easing token.
2. **Check it degrades to nothing.** Turn off `@starting-style` support in your
   head: does the element still arrive and function? It must.
3. **Check it under `prefers-reduced-motion: reduce`.** The global reset should
   already handle it; if the interaction breaks, rethink the interaction.
4. **If it needs a `view-transition-name`, mint it.** Never a literal.
5. **Do not reach for JavaScript.** If a transition seems to need it, the
   markup is probably wrong — start again from `<dialog>`, `popover`, or
   `<details>`.
