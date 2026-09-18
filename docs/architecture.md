# Architecture

Three packages ship, plus a playground. The boundaries are drawn so that a
future renderer can be added without refactoring the ones that exist.

## What each package owns

| Package | Owns | Knows about |
| --- | --- | --- |
| `@lemol/ui-design` | Token schema, theme composition, `v()`, and — on the opt-in `/css` subpath — the stylesheet emitter, cascade-layer setup, element defaults, boot script. | Nothing about components, and nothing about a renderer. |
| `@lemol/ui-remix` | Remix 3 components, the `--ui-*` contract each declares, `ThemeStyle`, the compat shim, the runtime. | `@lemol/ui-design`, `remix/ui`. |
| `@lemol/ui-remix-mini` | One concrete design: a theme plus the app shell. | Both of the above. |

```
                 ui-remix-mini
                 /           \
          ui-remix            \
                \              \
                 ui-design ─────┘
                     │
              (renderer-agnostic:
               strings and data only)
```

## Structure

```
packages/
  ui-design/
    src/tokens.ts           primitive token schema: categories + types
    src/theme.ts            defineTheme, extendTheme
    src/ref.ts              v() -- typed token reference
    src/css/emit.ts         emitTokensCss() -> string
    src/css/layers.ts       @layer base, rmx
    src/css/boot.ts         bootScript (no-flash scheme and density restore)
    src/css/reset.ts        element defaults, in @layer base
  ui-remix/
    src/button/             button.tsx + tokens.ts + button.demo.tsx + test
    src/dialog/             …one directory per component
    src/theme-style.tsx     ThemeStyle — puts the emitted sheet in the document
    src/tokens.ts           aggregates every component's contract
    src/compat.ts           Invoker Commands backfill
    src/runtime.ts          the single capture-phase command listener
  ui-remix-mini/
    src/theme.ts            base + dark + compact
    src/shell.tsx           Document, AppShell, Nav
    src/states.tsx          EmptyState, ErrorState
apps/
  playground/               catalogue, page recipes, theme and no-JS switches
```

## Why `ui-design` holds no components

`ui-design` is strings and data. `emitTokensCss()` returns CSS text; it never
returns a component. The component that puts that text into the document —
`ThemeStyle` — lives in `ui-remix`, because a `.tsx` component built on
`remix/ui` JSX is renderer-specific by definition.

That line is what makes the package reusable. A future `@lemol/ui-opentui`
imports `@lemol/ui-design` and never `/css`, mapping the same themes to
terminal attributes. A future `@lemol/ui-react` imports both and shares the
emitter rather than duplicating it.

The consequence is that **renderers own their own component-token contracts**.
`--ui-btn-primary-bg` is declared in `ui-remix/src/button/tokens.ts`, not in
`ui-design`. Adding a component therefore touches exactly one package. The
alternative — a renderer-neutral component vocabulary in `ui-design` — would
guarantee that every renderer themes identically, but would make every new
component a change in two packages and force `ui-design` to track the whole
catalogue.

## Dependency rules

Enforced by `test/boundaries.test.ts`:

```
may import:       remix/ui, remix/ui/*, @lemol/ui-design
must NOT import:  node:*, bun, effect,
                  remix/router, remix/routes, remix/assets, remix/spa
```

This is what makes SPA portability a checked property. `remix/spa` keeps the
same router contract as the server — `render()` middleware plus
`run(router, { fallback })`, the same controllers, middleware and
`context.render()` — and `remix/ui`'s `css()` emits into the `rmx` cascade
layer identically in both modes. So components are portable by construction,
and the only thing that can break it is a server-only import.

`ui-remix-mini` deliberately does **not** re-export `ui-remix`. A barrel would
need syncing with every new export, and it would hide which layer a component
came from — which matters on the day an app swaps in its own design.

## Consumers

| App | Status |
| --- | --- |
| `todo-md` (`repos/todo-md`, `src/web`) | The first real consumer. Its core modules stay dependency-free; `src/web` is a composition root and may depend on `@lemol/ui-*`. |
| `mionso` (`repos/mionso`, `money-web`) | Deferred. `@mionso/design` is untouched and adopts later under its own spec. |

An application defines its own look as a theme plus `--ui-*` overrides on top of
`ui-design` and `ui-remix`. `ui-remix-mini` is one such design, not a required
layer — an app can skip it and supply its own theme and shell.

## Tooling

**Bun** as package manager, test runner and runtime (`Bun.serve` +
`router.fetch`). **Remix's asset server** as the browser pipeline, configured
in `remix.json`. **No bundler for the packages at all** — see
[principles.md](principles.md) rule 7 for why Vite was considered and rejected.

Otherwise the repo follows its siblings: Biome, `tsconfig.base.json` plus
per-package configs, and `bun run check` = lint + typecheck + test as the
single gate for every change.

## Testing

- A **server-render test per component**, via `remix/ui/server`.
- **Browser tests for the runtime behaviours only.** A DOM shim would be
  testing the shim, which is the same conclusion `@mionso/design` reached.
- **Pure logic extracted and tested directly** — the palette's match rule is
  the model: exported as a pure function so it needs no DOM.
- **A no-JS render test** asserting that dialogs, disclosures and popovers are
  complete markup with the runtime absent.
- **`test/boundaries.test.ts`** for the import rules above.

## Workspace composition

`repos/ui` is composed by `@lemol/workspace` like its siblings: declared in
`workspace.yaml`, its packages listed in the root `workspaces`, and `file:`
overrides redirecting the git dependencies to the local clones. The ui packages
typecheck and test before `todo-md` in `tools/verify-order.ts`.
