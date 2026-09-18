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
| `@lemol/ui-design/css` | `emitTokensCss()`, the `@layer base, rmx` setup, element defaults, and `bootScript`. |

`/css` is a separate subpath so that taking the schema does not mean taking the
stylesheet with it.

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

The schema, `defineTheme` / `extendTheme` and `v()` have landed (M1 task 10):
93 primitive names across seven groups, and no values. The emitter, cascade
layers, reset and boot script on `/css` are still stubs and land with task 11.
