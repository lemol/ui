---
title: 'Playground: catalogue, page recipe, switchers, no-JS toggle and SPA route'
tags: [playground]
depends_on: [15, 16, 17, 18]
---
Finish the playground: the catalogue, one composed page recipe, the switchers,
the no-JS toggle and the SPA route.

## Scope

      /c/:component      the catalogue, one route per component
      /pages/dashboard   one composed page recipe
      /spa/*             one SPA-mode route proving portability

- The catalogue is built from the `*.demo.tsx` files colocated with each
  component and exposed as `@lemol/ui-remix/demos`. Colocation is what makes
  drift impossible.
- Knobs are query params and a form — rendering is server-side, so variant
  controls need no JavaScript. Same for the theme, scheme and density switchers.
- The **no-JS toggle** renders the page with the runtime and compat scripts
  omitted.
- One `/spa/*` route, proving the components are portable by construction.

## From the spec

> **Demos live beside their component** (`button.demo.tsx` next to `button.tsx`),
> exposed as `@lemol/ui-remix/demos`. Co-location is what makes drift impossible.

> **Knobs need no JavaScript.** Rendering is server-side, so variant controls are
> query params and a form: `?tone=primary&size=sm` re-renders on the server.

> One control is built deliberately: a **no-JS toggle** that renders the page
> with the runtime and compat scripts omitted. The whole premise is that pages
> work before any client JavaScript, so that assertion should be one click away
> rather than something to remember to check.

> Composed page recipes: real multi-component layouts, where contract gaps
> actually surface.

## Done when

- Every M1 component appears in the catalogue through its own demo file.
- The composed recipe renders, and any contract gap it exposes is recorded as a
  comment here or fixed.
- The page recipe works with the no-JS toggle on.
- The `/spa/*` route renders the same components.
