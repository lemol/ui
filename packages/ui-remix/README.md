# @lemol/ui-remix

Remix 3 components, and the `--ui-*` token contract each one declares beside
itself. Also `ThemeStyle`, which puts an emitted stylesheet into the document,
and the two files that are the whole of this repo's hand-written client code.

Depends on `@lemol/ui-design` and `remix/ui`, and on nothing else.

## Entry points

| Import | Holds | Ships to the browser |
| --- | --- | --- |
| `@lemol/ui-remix` | The components, their token records, `ThemeStyle`. | Only what a page uses. |
| `@lemol/ui-remix/runtime` | The single capture-phase `command` listener. | Yes. |
| `@lemol/ui-remix/compat` | The Invoker Commands backfill. | Yes. |
| `@lemol/ui-remix/demos` | The demo for each component, for the playground. | No. |

**Import the runtime from its own subpath, never from the barrel** — otherwise
the bundle pulls the component library in behind it.

## Catalogue

Documented here as components land, so that this section describes components
that exist rather than components that are planned.

## Limits

- **A component never hard-codes a colour, radius, duration or space step.** It
  declares its own tokens in `src/<name>/tokens.ts`, each defaulting relationally
  to a primitive, and reads only that tier. A skin is a set of token values; it
  is never a forked component.
- **SPA-safe.** No `node:*`, no `bun`, no `effect`, and no server-side `remix/*`
  entry — `remix/router`, `remix/routes`, `remix/assets`, `remix/spa` are all
  out. `test/boundaries.test.ts` enforces it, which is what makes SPA
  portability a checked property rather than an intention.
- **One delegated, capturing listener.** `CommandEvent` does not bubble, and a
  non-delegated listener dies on the first frame navigation, so behaviours go
  through `--` custom commands read by the single listener in `runtime.ts`.
- **Never hand-write a `commandfor` id.** A mismatch is a dead click with no
  error and no warning. Use the `overlay()` factory, which binds both halves.
- **Native first.** Check the ladder in
  [interactivity.md](../../docs/interactivity.md#the-ladder) before writing DOM
  code.
- **No build step, and `remix` is the only peer.**

## Structure

One directory per component, holding the component, its token record, its demo
and its test:

```
src/button/button.tsx  tokens.ts  button.demo.tsx  button.test.tsx
```

Co-location is what keeps the demo from drifting from the component.
`src/tokens.ts` aggregates every component's record and exports the union of
their names as a type.

## Reading

[design-system.md](../../docs/design-system.md) for the contract and emission
order, [interactivity.md](../../docs/interactivity.md) for the command protocol
and the browser baseline, [motion.md](../../docs/motion.md) for entry and exit
transitions.

## Status

Scaffold. `src/` holds stubs; the components arrive across M1 tasks 12–17,
which also fill in the catalogue above.
