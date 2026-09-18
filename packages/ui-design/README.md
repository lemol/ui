# @lemol/ui-design

The token layer, with no renderer in it. Everything here is strings and data —
`emitTokensCss()` returns CSS text, never a component.

That constraint is the point of the package. A future `@lemol/ui-opentui`
imports this and never touches `/css`, mapping the same themes onto terminal
attributes; `@lemol/ui-remix` imports both and shares the emitter rather than
growing its own.

## Entry points

| Import | Holds |
| --- | --- |
| `@lemol/ui-design` | The primitive token schema, `defineTheme` / `extendTheme`, and `v()` — the typed token reference. |
| `@lemol/ui-design/css` | `emitTokensCss()`, the `@layer rmx-reset, base, rmx` setup, the element defaults, the reduced-motion reset, and `schemeBootScript`. |

`/css` is a separate subpath so that taking the schema does not mean taking the
stylesheet with it.

Interactive colours name their own hover value — `accent-hover`, `link-hover`,
`danger-hover`. Status colours do not: `success`, `warning` and `info` are read
on static elements, and a component deriving a hover from a fill is the
violation the two-tier split exists to prevent.

## Limits

- **No components, and no JSX.** The component that puts an emitted sheet into
  the document — `ThemeStyle` — lives in `@lemol/ui-remix`, because a component
  built on `remix/ui` JSX is renderer-specific by definition.
- **No dependencies at all**, not even `remix`. Adding one would make this
  package renderer-aware and cost it the reuse above.
- **Primitive tokens only.** `--ui-btn-primary-bg` and its siblings are
  declared by the package that owns the component, not here. See
  [why `ui-design` holds no components](../../docs/architecture.md#why-ui-design-holds-no-components).
- **No build step.** The package ships TypeScript from `src/`.

## Reading

[design-system.md](../../docs/design-system.md) covers the two tiers, emission
order, typing, themes and the cascade layers.
[motion.md](../../docs/motion.md) covers the duration and easing tokens.

## Status

`@lemol/ui-design` holds 96 primitive names across seven groups, and no values.
`@lemol/ui-design/css` emits the stylesheet: the layer statement, a block per
variant axis, the element defaults, the one unlayered rule, and the
reduced-motion reset.

Two things the entry table above deliberately does not hold: the component that
puts an emitted sheet into a document, and the boot script that also stamps the
JS-enhanced marker. Both need to know what a component is, so both live in
`@lemol/ui-remix`.
