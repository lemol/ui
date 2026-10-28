# AGENTS.md — @lemol/ui

UI shared by lemol projects: a renderer-agnostic design-token core, a Remix 3
component library, and one concrete minimal design built on both. Three layers
under `src/`, shipped as one package at the repository root — a member of the
same Bun workspace takes `@lemol/ui` as `workspace:*`, any other project by git
specifier, and either imports a subpath.

## Read first

- [docs/README.md](docs/README.md) is the index.
- [docs/principles.md](docs/principles.md) — the rules below, each with the
  reason it exists. Read this before arguing with one of them.
- [docs/architecture.md](docs/architecture.md) — the shipping shape, layer
  boundaries, structure, dependency rules, tooling, testing.
- [docs/design-system.md](docs/design-system.md) — tokens, the contract,
  themes, cascade layers.
- [docs/interactivity.md](docs/interactivity.md) — the native-first ladder, the
  command protocol, the browser baseline.
- [docs/motion.md](docs/motion.md) — motion tokens, native entry/exit, reduced
  motion, view transitions.

Each `src/<layer>/README.md` covers that layer's contents and limits.
Dated decision records live in `docs/superpowers/specs/` — read those for why a
choice was made, and the documents above for what is true now.

## Layout

```
src/
  design/      @lemol/ui/design      token schema, themes, v()
               @lemol/ui/design/css  the stylesheet emitter and element defaults
  remix/       @lemol/ui/remix       components + their own token contracts
               …/overlay …/compat …/runtime …/demos
  mini/        @lemol/ui/mini        one concrete design: theme + app shell
apps/
  playground/  catalogue, page recipes, theme and no-JS switches
proof/         the playground's proof kit, run by bun proof/run.ts — never a test
```

## Commands

```sh
bun install
bunx playwright install chromium   # once: the browser test/browser/ drives
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
- **Native first, then `@remix-run/ui`, then hand-written.** Check the ladder in
  [interactivity.md](docs/interactivity.md) before writing DOM code.
- **One installable package.** Everything ships as `@lemol/ui` from the
  repository root, because a Bun git dependency always installs a repository's
  root package. So a cross-layer import inside `src/` is relative, and goes
  through the entry point the exports map publishes — never at an arbitrary
  file inside another layer. `test/boundaries.test.ts` holds that line and
  `test/git-consumer.test.ts` proves the shape installs.
- **SPA-safe.** Nothing under `src/` may import `node:*`, `bun`, `effect`, or
  any server-side `remix/*` entry. `test/boundaries.test.ts` enforces it.
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
- **No build step.** The package ships TypeScript from `src/`. Browser assets are
  the Remix asset server's job, configured in `remix.json`. Do not add a
  bundler.
- **No Effect in the shipped package.** `remix` is its only peer dependency.
  Only the dev-only proof kit in `proof/` takes `effect`, at `@lemol/proof`'s
  pin.
- **Blank lines carry structure.** Separate value consts from function
  consts; leave a blank line after a multi-line const, between consts and
  a following call, around every `if`, loop, `switch` and `try`, and before
  `return`. An `if` whose body spans
  lines takes braces; a one-line `if (x) return y` does not. oxlint enforces
  this (`.oxlintrc.json`, local rules in `lint/style.js`) and `bun fmt` formats
  (`.oxfmtrc.json`); `bun run fix` applies both.
- **Tests** use `bun:test`. Every component gets a server-render test. Browser
  tests cover only the runtime behaviours.
- **Docs** stay short and local. Layer specifics go in that layer's README.
  Keep the documents in `docs/` current — if code and a document disagree, fix
  one of them deliberately.

## Browser baseline

Chrome 114+ / Safari 17+ / Firefox 125+ — the Popover API floor. Invoker
Commands are used natively with a shim behind them; CSS anchor positioning sits
behind `@supports`. Apps built here are shared with browsers we do not control,
so a dead click on an older engine is a real failure. See
[interactivity.md](docs/interactivity.md#browser-baseline).
