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

Two routes and the pipeline underneath them. The page recipes and the visible
switchers arrive with the components they display.

| Path | |
| --- | --- |
| `/` | server-rendered, with the browser entry resolved through the asset server |
| `/c/:component` | one component's demo, by its name in `@lemol/ui/remix/demos` |
| `/assets/*` | the asset server |

Four query switches, each a full proof of one axis with no client state:

| Query | |
| --- | --- |
| `?nojs` | the same page with no `<script>` at all |
| `?compat` | forces the Invoker Commands backfill on over native support |
| `?scheme=dark` / `?scheme=light` | beats the media query |
| `?density=compact` | retunes every control |

`?nojs` is the premise these packages are built on, made checkable: a page is
finished before a script runs. It renders interactive markup *dead* rather than
*absent*, so the unenhanced page shows exactly what the enhanced one does.

`?compat` exists because every engine a test can drive has Invoker Commands
natively, so the backfill would otherwise ship unexercised. Forced on, it
cancels the platform's own trusted `CommandEvent` and drives the invocation
itself — which is what `test/browser/dialog.browser.test.ts` uses to tell the
two paths apart.

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
  ui/document.tsx                the document shell — replaced by mini's in task 18
  ui/home.tsx                    the page
  ui/public/runtime-probe.tsx    a client entry, to prove hydration works
```

`public/` marks browser-reachable source, beside its narrowest owner. Everything
else under `app/` is server-only, and `app/assets.test.ts` holds that line —
a controller cannot leak into the browser by being imported.

## Asset configuration

`remix.json` is the single source of asset mapping and access rules, so
`remix assets`, `remix doctor` and the running server cannot disagree.
`app/assets.ts` loads it and adds only what JSON cannot express: the browser
target, watching and sourcemaps in development, fingerprinting and minification
otherwise, and the Bun store mount.

The store mount is derived at runtime rather than written down. Bun installs into
one store at the composed workspace root and symlinks packages into each
consumer's `node_modules`, so the files behind `remix` sit outside this app's
`rootDir` — and an allow-list cannot reach files that no mount covers. The store
also sits at a different depth standalone than composed, which is why it is
computed from `import.meta.resolve` instead of hard-coded.

One consequence: the `remix` CLI resolves `remix` from the project directory, so
`remix doctor` needs `apps/playground/node_modules` to exist, which only a
composed install creates. Until then:

```sh
bun install                                    # from the composed workspace root
cd apps/playground && bunx --bun remix doctor
```

## Tests

`bun test` from the repo root.

- `app/router.test.tsx` drives the composition through real requests: the
  document, the resolved browser entry, the client-entry metadata, and `?nojs`.
- `app/assets.test.ts` fetches every module in each browser entry's graph and
  confirms server-only source 404s.
- `app/ui/home.test.tsx` is the server-render pattern every component test
  copies — one node through `test/render.ts`, assertions on the string.
