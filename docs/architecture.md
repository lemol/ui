# Architecture

One package ships, in three layers, plus a playground. The boundaries are drawn
so that a future renderer can be added without refactoring the ones that exist.

## The shipping shape

`@lemol/ui` is one package at the repository root, and the layers are subpaths
of it. That is forced from outside: a Bun git dependency always installs a
repository's *root* package, and the specifier has no subdirectory form — so
anything under `packages/` is unreachable to every consumer outside the composed
workspace. A root package re-exporting `packages/*/src` would not have fixed it
either, because the source imported its siblings by name and a git-installed
checkout has no `node_modules` to resolve that through.

```json
{ "@lemol/ui": "git+ssh://git@github.com/lemol/ui.git#ui@0.1.0" }
```

| Subpath | Holds |
| --- | --- |
| `@lemol/ui/design` | The primitive token schema, `defineTheme` / `extendTheme`, `v()`. |
| `@lemol/ui/design/css` | The stylesheet emitter, cascade-layer setup, element defaults, boot script. |
| `@lemol/ui/remix` | The components, their token records, `ThemeStyle`. |
| `@lemol/ui/remix/compat` | The Invoker Commands backfill. |
| `@lemol/ui/remix/runtime` | The single capture-phase `command` listener. |
| `@lemol/ui/remix/demos` | The demo for each component, for the playground. |
| `@lemol/ui/mini` | One concrete design: a theme, `AppShell`, `Nav` and the state components. |
| `@lemol/ui/mini/document` | `Document` — the `<html>` wiring, which only a server renders. |

There is no `.` export. A root barrel would merge the three layers into one
name and hide which one a component came from — the same reason `mini` does not
re-export `remix`. `test/package.test.ts` pins that, and
`test/git-consumer.test.ts` installs the tagged repository into a scratch
consumer and renders a component from it, which is the only test that can fail
when the shipping shape breaks.

## What each layer owns

| Layer | Owns | Knows about |
| --- | --- | --- |
| `design` | Token schema, theme composition, `v()`, and — on the opt-in `/css` subpath — the stylesheet emitter, cascade-layer setup, element defaults, boot script. | Nothing about components, and nothing about a renderer. |
| `remix` | Remix 3 components, the `--ui-*` contract each declares, `ThemeStyle`, the compat shim, the runtime. | `design`, `remix/ui`. |
| `mini` | One concrete design: a theme plus the app shell. | Both of the above. |

```
                      mini
                     /    \
               remix       \
                    \       \
                     design ─┘
                        │
                 (renderer-agnostic:
                  strings and data only)
```

## Structure

A layer is a directory under `src/`, and `index.ts` is the whole of what the
layer offers the ones above it.

```
src/
  design/
    index.ts              the layer's entry point
    tokens.ts             primitive token schema: categories + types
    theme.ts              defineTheme, extendTheme
    ref.ts                v() -- typed token reference
    css/index.ts          the /css entry point
    css/emit.ts           emitTokensCss() -> string
    css/layers.ts         @layer rmx-reset, base, rmx
    css/boot.ts           schemeBootScript (no-flash scheme and density restore)
    css/reset.ts          element defaults in @layer base, and the reduced-motion reset
  remix/
    index.ts              the layer's entry point
    button/               button.tsx + tokens.ts + button.demo.tsx + test
    stack/                …and no tokens.ts, when primitives are all it reads
    field/                …one directory per component
    space.ts              blocks more than one component uses: the gap scale
    align.ts              …and cross-axis alignment
    theme-style.tsx       ThemeStyle — puts the emitted sheet in the document
    tokens.ts             aggregates every component's contract
    compat.ts             Invoker Commands backfill
    runtime.ts            the single capture-phase command listener
    demos.ts              every component's demo, for the catalogue
  mini/
    index.ts              the layer's entry point
    theme.ts              base + dark + compact
    shell.tsx             AppShell and Nav
    states.tsx            EmptyState and ErrorState
    document.tsx          Document — its own subpath, and the only file here
                          that reaches for remix/ui/server
apps/
  playground/             catalogue, page recipes, theme and no-JS switches
```

## Why `design` holds no components

`design` is strings and data. `emitTokensCss()` returns CSS text; it never
returns a component. The component that puts that text into the document —
`ThemeStyle` — lives in `remix`, because a `.tsx` component built on
`remix/ui` JSX is renderer-specific by definition.

That line is what makes the layer reusable. A future `@lemol/ui/opentui`
imports `@lemol/ui/design` and never `/css`, mapping the same themes to
terminal attributes. A future `@lemol/ui/react` imports both and shares the
emitter rather than duplicating it. Collapsing three packages into one changed
nothing here: the subpaths are still separate entry points, and a consumer that
imports only `@lemol/ui/design` still pulls in no renderer.

The consequence is that **renderers own their own component-token contracts**.
`--ui-btn-primary-bg` is declared in `src/remix/button/tokens.ts`, not in
`design`. Adding a component therefore touches exactly one layer. The
alternative — a renderer-neutral component vocabulary in `design` — would
guarantee that every renderer themes identically, but would make every new
component a change in two layers and force `design` to track the whole
catalogue.

## Dependency rules

Enforced by `test/boundaries.test.ts`:

```
must NOT import:  node:*, bun, bun:*, effect,
                  remix/router, remix/routes, remix/assets, remix/spa

may import:       design   nothing
                  remix    remix/ui, remix/ui/*, ../design
                  mini     remix/ui, remix/ui/*, ../design, ../remix
```

The deny list is the SPA floor and applies to all three. The allow list is the
graph above it: `design` reaches for no renderer, which is the rule that keeps
it reusable. A sibling layer is reached only where the exports map publishes it
— `../design/index.ts`, `../design/css/index.ts`, `../remix/index.ts` — and
never at some other file inside it, so `package.json` still records every edge
in the graph, as it did when the edges were `dependencies`. A test file beside
its component may also import `bun:test` and `test/render.ts`; runtime code may
import neither.

This is what makes SPA portability a checked property. `remix/spa` keeps the
same router contract as the server — `render()` middleware plus
`run(router, { fallback })`, the same controllers, middleware and
`context.render()` — and `remix/ui`'s `css()` emits into the `rmx` cascade
layer identically in both modes. So components are portable by construction,
and the only thing that can break it is a server-only import.

`Document` sits on its own subpath for a related reason. `<html>` exists only
on the server — an SPA has an `index.html` carrying the same boot script — and
it is the one file in `mini` that imports `remix/ui/server`. Through the barrel
it would follow `miniTheme` into every browser bundle, since the packages ship
unbundled source and the asset server compiles a module graph rather than
tree-shaking it.

`mini` deliberately does **not** re-export `remix`. A barrel would need syncing
with every new export, and it would hide which layer a component came from —
which matters on the day an app swaps in its own design. That argument is also
why the package has no `.` export.

## Consumers

| App | Status |
| --- | --- |
| `todo-md` (`repos/todo-md`, `src/web`) | The first real consumer. Its core modules stay dependency-free; `src/web` is a composition root and may depend on `@lemol/ui`. |
| `mionso` (`repos/mionso`, `money-web`) | Deferred. `@mionso/design` is untouched and adopts later under its own spec. |

An application defines its own look as a theme plus `--ui-*` overrides on top of
`@lemol/ui/design` and `@lemol/ui/remix`. `@lemol/ui/mini` is one such design,
not a required layer — an app can skip it and supply its own theme and shell.

## Tooling

**Bun** as package manager, test runner and runtime (`Bun.serve` +
`router.fetch`). **Remix's asset server** as the browser pipeline, configured
in `remix.json`. **No bundler for the package at all** — see
[principles.md](principles.md) rule 7 for why Vite was considered and rejected.

**Browser reachability is admitted by path, not by package.** The playground
reaches the package source at `../../src/**` for the compat shim, the runtime
and the demos, and `apps/playground/remix.json` admits exactly that path,
leaving `allowPackages` at `remix` alone — so the app's own controllers,
router, document and pages stay unreachable, and the allow-list never becomes
a deny-list chasing them.

Otherwise the repo follows its siblings: Biome, one root `tsconfig.json` over
`src`, `apps` and `test` with the playground extending it, and `bun run check` =
lint + typecheck + test as the single gate for every change.

**Playwright** supplies the browser for `test/browser/`, as a library rather
than a runner; `bunx playwright install chromium` once per machine.

## Testing

- A **server-render test per component**, via `remix/ui/server` — `test/render.ts`
  is the harness, and `apps/playground/app/ui/home.test.tsx` the worked example.
  It reaches for no router, no asset server and no DOM, because `remix/ui/server`
  is inside the import allow-list and the other three are not.
- **Browser tests for the runtime behaviours only**, in `test/browser/`, driven
  by Playwright as a library from inside `bun test` — not the `@playwright/test`
  runner, so `bun test` stays the only runner and `bun run check` the only gate.
  They drive the playground's own router through `Bun.serve`, so what is tested
  is the real document and the real asset pipeline. A DOM shim would be testing
  the shim, which is the same conclusion `@mionso/design` reached.
  Two limits: Playwright's WebKit is built from WebKit `main` and is not Safari,
  and every engine it bundles has Invoker Commands natively — so Safari 17 and
  a genuinely unsupporting engine are both out of reach. The backfill is
  exercised by forcing it on instead. See
  `docs/superpowers/research/2026-09-19-browser-testing-harness.md`.
- **Pure logic extracted and tested directly** — the palette's match rule is
  the model: exported as a pure function so it needs no DOM.
- **A no-JS render test** asserting that dialogs, disclosures and popovers are
  complete markup with the runtime absent.
- **`test/boundaries.test.ts`** for the import rules above, and
  **`test/package.test.ts`** for the exports map they are stated against.
- **`test/git-consumer.test.ts`** for the shipping shape: it tags a clone,
  installs it into a scratch consumer by git specifier, and renders a component
  and emits a theme from the installed copy. Every other test imports the source
  by a relative path, so this is the only one that fails when the package stops
  being installable. It tests `HEAD`, not the working tree.

## Workspace composition

`repos/ui` is composed by `@lemol/workspace`: declared in `workspace.yaml`, one
`file:` override redirecting `@lemol/ui` to the local clone, and typechecked and
tested before `todo-md` in `tools/verify-order.ts`.

It is **not** a member of the root `workspaces`, unlike its siblings, and that
is what makes `bun install` here authoritative. Bun resolves a workspace by
walking up to the nearest ancestor whose `workspaces` patterns match the
directory it runs in, so while the root globbed `repos/*`, an install here wrote
`@lemol/workspace`'s lockfile and store rather than this repository's — and the
playground then resolved `@lemol/ui` into a store its asset configuration knows
nothing about. The root now lists its members one by one and `bootstrap` runs
`bun install` inside this clone after its own. There is nothing to configure on
this side: `bunfig.toml`'s `ignoreWorkspace` and `package.json`'s
`installConfig` are Yarn and pnpm vocabulary that Bun 1.4 does not read, which
is why neither is here.

Installing itself means carrying its own version pins. `remix@3.0.0-rc.2`
depends on `@remix-run/ui` at `^0.9.0`, but takes `@remix-run/assets`,
`@remix-run/render-middleware` and `@remix-run/spa` at caret ranges whose later
patches moved to `@remix-run/ui@^0.10.0` — so a fresh resolution puts two copies
of `@remix-run/ui` in the tree: components import `remix/ui` and get `0.9.0`,
while the render middleware gets `0.10.0`, which rejects the string `innerHTML`
that `ThemeStyle` and `Document` depend on. A server-render test passes and the
same markup through `render()` fails. The three `overrides` in `package.json`
hold those packages at the last versions that agree with the rc's own pin, and
they come out when `remix` ships an rc whose dependencies are coherent. The
composition root carries the same three for the same reason.

Inside this repository the catalogue imports the source relatively and takes
no `@lemol/*` dependency at all. A `file:` dependency on the repository root
would resolve through the package name — but Bun hardlinks a path dependency
into the store rather than symlinking the checkout, so the playground would
resolve a stale snapshot instead of the working tree, and every source file
would carry a second hard link. (`workspace:*` is no alternative: Bun cannot
name the workspace root as a member — `workspaces: ["."]` fails to resolve.)
The exports map stays honest through `test/package.test.ts`, which pins its
shape, and `test/git-consumer.test.ts`, which installs the tagged repository
by git specifier and imports it by name for real.
