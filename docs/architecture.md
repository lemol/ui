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
| `@lemol/ui/mini` | One concrete design: a theme plus the app shell. |

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

**`allowPackages` admits a package root, not a package.** The playground's
`@lemol/ui` is a `file:` dependency pointing at this repository's own root, so
naming it in `allowPackages` would make the app's own controllers, router,
document and pages browser-reachable too — and `allowFiles` cannot claw that
back, because the package check is a fallback that runs only after a file has
failed every `allowFiles` pattern. `apps/playground/remix.json` instead admits
the path, `../../src/**`, and leaves `allowPackages` at `remix` alone.

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

`repos/ui` is composed by `@lemol/workspace` like its siblings: declared in
`workspace.yaml`, `repos/ui/apps/*` listed in the root `workspaces`, and one
`file:` override redirecting `@lemol/ui` to the local clone. It typechecks and
tests before `todo-md` in `tools/verify-order.ts`.

Inside this repository the catalogue does the same thing one level down:
`apps/playground` takes `"@lemol/ui": "file:../.."`, so it reaches the source
through the exports map rather than through a relative path into `src/`. It is
`file:` and not `workspace:*` because Bun cannot name the workspace root as a
workspace member — `workspaces: ["."]` fails to resolve.
