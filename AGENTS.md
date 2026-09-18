# AGENTS.md — @lemol/ui

UI packages shared by lemol projects: a renderer-agnostic design-token core, a
Remix 3 component library, and one concrete minimal design built on both.

## Read first

- [docs/README.md](docs/README.md) is the index.
- [docs/principles.md](docs/principles.md) — the rules below, each with the
  reason it exists. Read this before arguing with one of them.
- [docs/architecture.md](docs/architecture.md) — package boundaries, structure,
  dependency rules, tooling, testing.
- [docs/design-system.md](docs/design-system.md) — tokens, the contract,
  themes, cascade layers.
- [docs/interactivity.md](docs/interactivity.md) — the native-first ladder, the
  command protocol, the browser baseline.
- [docs/motion.md](docs/motion.md) — motion tokens, native entry/exit, reduced
  motion, view transitions.

Each `packages/<name>/README.md` covers that package's contents and limits.
Dated decision records live in `docs/superpowers/specs/` — read those for why a
choice was made, and the documents above for what is true now.

## Layout

```
packages/
  ui-design/       @lemol/ui-design      token schema, themes, CSS emission
  ui-remix/        @lemol/ui-remix       components + their own token contracts
  ui-remix-mini/   @lemol/ui-remix-mini  one concrete design: theme + app shell
apps/
  playground/      catalogue, page recipes, theme and no-JS switches
```

## Commands

```sh
bun install
bun run check         # lint + typecheck + test: the gate for every change
bun test
bun run fix
bun run playground    # the catalogue
```

## Rules

- **Styling goes through the contract.** No component hard-codes a colour,
  radius, duration, or space step. A component with something to retheme
  declares its own `--ui-*` tokens beside itself, defaulting to a primitive;
  one styled from structural keywords and primitives alone declares none. A
  skin is a set of token values, never a forked component.
- **Native first, then `remix/ui`, then hand-written.** Check the ladder in
  [interactivity.md](docs/interactivity.md) before writing DOM code.
- **SPA-safe.** The packages must not import `node:*`, `bun`, `effect`, or any
  server-side `remix/*` entry. `test/boundaries.test.ts` enforces it.
- **One delegated, capturing listener.** Behaviours use `--` custom commands
  read by a single `command` listener on `document`, registered with `true`.
  `CommandEvent` does not bubble, and a non-delegated listener dies on the
  first frame navigation.
- **Never hand-write a `commandfor` id.** A mismatch fails silently. Use the
  `overlay()` factory.
- **Element defaults go in `@layer base`.** Unlayered CSS beats layered CSS, so
  reach for unlayered only when a rule must beat a component, and say why.
- **Motion is native and tokenised.** Overlay components ship their entry/exit
  transition with `@starting-style` + `allow-discrete` when they are built, not
  as a later pass. Name duration and easing tokens, never literals. Mint
  `view-transition-name` values; never hand-write one.
- **No build step.** Packages ship TypeScript from `src/`. Browser assets are
  the Remix asset server's job, configured in `remix.json`. Do not add a
  bundler.
- **No Effect.** `remix` is the only peer dependency.
- **Tests** use `bun:test`. Every component gets a server-render test. Browser
  tests cover only the runtime behaviours.
- **Docs** stay short and local. Package specifics go in that package's README.
  Keep the documents in `docs/` current — if code and a document disagree, fix
  one of them deliberately.

## Browser baseline

Chrome 114+ / Safari 17+ / Firefox 125+ — the Popover API floor. Invoker
Commands are used natively with a shim behind them; CSS anchor positioning sits
behind `@supports`. Apps built here are shared with browsers we do not control,
so a dead click on an older engine is a real failure. See
[interactivity.md](docs/interactivity.md#browser-baseline).
