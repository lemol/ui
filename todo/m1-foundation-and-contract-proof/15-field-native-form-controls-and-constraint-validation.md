---
title: 'Field: native form controls and constraint validation'
tags: [ui-remix, forms]
depends_on: [12]
---
`Field` — native form controls and constraint validation. It is in the M1 slice
deliberately: form integration is one of the two places a token contract breaks,
and `Button` will not reveal it.

## Scope

- Native `<input>`, `<textarea>` and `<select>` with label, hint and error
  wiring, driven by constraint validation. No JavaScript validation.
- Contract tokens for control height, hairline, focus ring and invalid state,
  each defaulting relationally to a primitive.
- Server-render test plus a `field.demo.tsx`.

## From the spec

> `Field` and `Dialog` are in the slice deliberately — form integration and
> overlay behaviour are where a contract breaks, not `Button`.

> | Inputs, select, checkbox, radio, validation | native controls + constraint
> validation | none |

> **Native platform** where it fully covers the need. Zero client code.

## Done when

- A form submits and reports validation errors with the runtime absent.
- `bun run check` is green.
