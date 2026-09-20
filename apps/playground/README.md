# @lemol/ui-playground

The catalogue. A Remix 3 app in this repo rather than Storybook, because these
components are Remix 3 functions taking a `Handle` — no hooks, no client render,
nothing React-based to plug into. Demos live beside their component and are
exposed as `@lemol/ui/remix/demos`, so the catalogue cannot drift from what
ships.

```sh
bun run playground              # from the repo root
PORT=4200 bun run playground    # 4000 by default
```

## What is here now

Four routes and the pipeline underneath them. Every page is built from
`@lemol/ui/mini` (`AppShell`, `Nav`, the state components) and `@lemol/ui/remix`
— the playground is the first consumer, not a parallel design.

| Path | |
| --- | --- |
| `/` | the catalogue index: every demo by name, the recipes, the hydration probe |
| `/c/:component` | one component's demo, by its name in `@lemol/ui/remix/demos` |
| `/pages/dashboard` | one composed page recipe: stats, tasks, settings, a dialog |
| `/spa/*` | the client-rendered twin: the same demos through the SPA router |
| `/assets/*` | the asset server |

Knobs are query params and a form: `?tone=primary&size=sm` re-renders on the
server, beside a preview of the one combination under test. Button, badge, text
and heading have knobs; the rest enumerate their states in the demo already.

Four query switches, each a full proof of one axis with no client state — and
each a visible GET form in the header, so switching one preserves the rest:

| Query | |
| --- | --- |
| `?nojs` | the same page with no `<script>` at all |
| `?compat` | forces the Invoker Commands backfill on over native support |
| `?scheme=dark` / `?scheme=light` (`=system` is unset) | beats the media query |
| `?density=compact` (`=default` is unset) | retunes every control |

`?nojs` is the premise these packages are built on, made checkable: a page is
finished before a script runs. It renders interactive markup *dead* rather than
*absent*, so the unenhanced page shows exactly what the enhanced one does. On
`/spa/*` it renders the same components on the server that the SPA router would
have resolved in the browser.

`?compat` exists because every engine a test can drive has Invoker Commands
natively, so the backfill would otherwise ship unexercised. Forced on, it
cancels the platform's own trusted `CommandEvent` and drives the invocation
itself — which is what `test/browser/dialog.browser.test.ts` uses to tell the
two paths apart.

There is no theme switcher: M1 ships one theme, and a switcher with one option
is decoration. It arrives with the second theme.

## Structure

```
remix.json                       asset mapping, access rules, doctor
server.ts                        Bun.serve + router.fetch
app/
  assets.ts                      the asset server: remix.json plus runtime-only options
  routes.ts                      the URL contract
  router.ts                      middleware + controllers
  actions/controller.tsx         the actions
  actions/public/entry.ts        the browser entry: run(), and nothing else
  ui/layout.tsx                  every page in mini's AppShell, with the switchers
  ui/switchers.tsx               scheme / density / scripts / compat as GET forms
  ui/forms.tsx                   hidden inputs preserving the query across forms
  ui/knobs.tsx                   per-component knobs: query parsing, form, preview
  ui/home.tsx                    the catalogue index
  ui/catalogue.tsx               the frame around a demo
  ui/dashboard.tsx               the composed page recipe
  ui/spa.tsx                     the SPA shell and its no-JS twin
  ui/public/runtime-probe.tsx    a client entry, to prove hydration works
  spa/public/router.tsx          the browser SPA router, over the same demos
  spa/public/entry.tsx           the SPA shell's browser entry: run(router)
```

There is no document of its own: the controllers render `Document` from
`@lemol/ui/mini/document`, which is the app that proves `mini`'s wiring works
in a real response rather than only in a render test.

`public/` marks browser-reachable source, beside its narrowest owner. Everything
else under `app/` is server-only, and `app/assets.test.ts` holds that line —
a controller cannot leak into the browser by being imported.

## Asset configuration

`remix.json` is the single source of asset mapping and access rules, so
`remix assets`, `remix doctor` and the running server cannot disagree.
`app/assets.ts` loads it and adds only what JSON cannot express: the browser
target, watching and sourcemaps in development, fingerprinting and minification
otherwise, and the Bun store mount.

Both paths that leave this app's `rootDir` are derived at runtime rather than
written down. `bun install` at the `@lemol/ui` repository root keeps the store
under that tree — the composition root deliberately does not list this clone as
a workspace member, so nothing above it claims the install — and symlinks
packages into each consumer's `node_modules`. The files behind `remix` still sit
outside `rootDir`, so an allow-list cannot reach them without a mount.

`@lemol/ui` itself is the second path. Bun hardlinks a `file:` dependency into
the store rather than symlinking the checkout, so `@lemol/ui/remix` normally
resolves *inside* the store: mounting it again would overlap the store mount,
which is a thrown `TypeError` at boot, and `remix.json`'s `../../src/**` would
not match it. `app/assets.ts` therefore mounts it only when it resolves outside
the store, and admits wherever it actually resolved in both cases — still by
path, never by adding `@lemol/ui` to `allowPackages`.

The `remix` CLI resolves `remix` from the project directory, so `remix doctor`
needs `apps/playground/node_modules` to exist:

```sh
bun install              # from the @lemol/ui repository root
cd apps/playground && bunx --bun remix doctor
```

## Tests

`bun test` from the repo root.

- `app/router.test.tsx` drives the composition through real requests: the
  document, the resolved browser entries, the client-entry metadata, the knobs,
  the dashboard, the SPA shell, and `?nojs` on every route.
- `app/assets.test.ts` fetches every module in each browser entry's graph and
  confirms server-only source 404s.
- `app/ui/home.test.tsx` is the server-render pattern every component test
  copies — one node through `test/render.ts`, assertions on the string.
  `app/ui/catalogue.test.tsx` and `app/ui/dashboard.test.tsx` cover the knobs
  and the recipe the same way.
- `test/browser/spa.browser.test.ts` proves the SPA twin in Chromium: the same
  components client-rendered, soft navigation without a document load, and the
  client 404.
