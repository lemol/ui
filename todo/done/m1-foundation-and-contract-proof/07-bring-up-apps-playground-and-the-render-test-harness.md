---
title: Bring up apps/playground and the render-test harness
tags: [playground, remix]
depends_on: [6]
group: M1 — Foundation and contract proof
completed_at: 2026-09-18T04:11:24Z
---
`apps/playground` as a Remix 3 app with one server-rendered route, plus the
`remix/ui/server` test harness every component test will copy.

This task exists to *execute* the Remix 3 assumptions the rest of M1 rests on
rather than trust them: `remix` is at `3.0.0-rc.2`, and the asset-server story
is asserted from documentation, not from anything running in this repo.

## Scope

- `remix.json` configuring the asset server.
- `Bun.serve` + `router.fetch`.
- `run(router, { fallback })` with `clientEntry` resolved through the asset
  server.
- One route rendering server-side with no client JavaScript.
- A server-render test via `remix/ui/server` — the pattern every later component
  test copies.

## From the spec

> **Bun** as package manager, test runner and runtime (`Bun.serve` +
> `router.fetch`). **Remix's asset server** as the browser
> pipeline. **No bundler for the packages at all.**

> `@remix-run/assets` already is the pipeline: on-demand compilation of browser
> scripts *and* styles, preloads generated from imports, optional fingerprinting,
> ETags, sourcemaps, HMR and script loaders, configured in `remix.json`, shared
> between the running server and the CLI, and checked by `remix doctor`.

> **Server-render test per component**, via `remix/ui/server`.

## Done when

- `bun run playground` serves the route.
- The render test passes under `bun test`.
- Anything the spec asserts about Remix 3 that turns out to be wrong is recorded
  as a comment on this task before it closes — later tasks depend on those
  assumptions.

## Comments

### @leza.lutonda at 2026-09-18 04:04:45 +00:00

Scope reading, on the one bullet that is ambiguous. "`run(router, { fallback })` with `clientEntry` resolved through the asset server" was taken as the *asset-server* half: the document resolves its browser entry through `assetServer.getScriptEntry()`, `render({ assets })` resolves a component's `clientEntry(import.meta.url, …)` to a module URL, import map and preloads, and `run()` from `remix/ui` in `app/actions/public/entry.ts` hydrates it. All executed and verified in a browser.

`run(router, { fallback })` from `remix/spa` — the SPA-mode router — was not, because task 19 owns `/spa/*`, "one SPA-mode route proving portability", and building it here would leave 19 with nothing to prove. The sentence the bullet paraphrases is architecture.md's note that `remix/spa` keeps the same router contract as the server, which is a claim about 08's import boundary rather than about this bring-up. If the intent was to retire the SPA risk early too, that is a small addition here rather than a rewrite.

### @leza.lutonda at 2026-09-18 04:04:23 +00:00

The spec's Remix 3 assertions hold, executed rather than read. `remix` 3.0.0-rc.2 with `@remix-run/assets` compiles TypeScript and TSX browser modules on demand, generates the import map and the modulepreload graph, serves them with ETags, and `remix doctor` reports no issues on the config. `Bun.serve` + `router.fetch` serves it. Hydration was verified in a real headless Chrome, not only asserted on a string: the probe button counts clicks, and the same page under `?nojs` ships `document.scripts.length === 0` with the button present and inert.

Four things the spec does not say that the tasks after this one depend on:

1. **`remix.json` is not quite the single source of asset config.** Bun installs into one store at the composed workspace root and symlinks each package into its consumer's `node_modules`, so the files behind `remix` resolve outside the app's `rootDir`, and an allow-list cannot reach files that no mount covers. The store mount has to be computed from `import.meta.resolve` at runtime — it sits at a different depth standalone than composed, so it cannot be written down. Everything else (basePath, allowFiles, allowPackages, denyFiles) does live in `remix.json`, shared with the CLI. money-web hit the same thing and solved it the same way.

2. **`remix doctor` needs `apps/playground/node_modules` to exist.** The CLI resolves `remix` from the project directory, and only a composed install creates that directory; the running server and `bun test` resolve fine by walking up. Verified by linking it by hand: doctor goes from one warning to clean. This is task 09's to fix, and no install was run here. Same reason this task imports no `@lemol/*` package yet — task 12 is the first that needs one, and it needs 09 first.

3. **`renderToString` from `remix/ui/server` takes no options**, so the harness in `test/render.ts` cannot resolve a `clientEntry()` to a browser module or resolve a `<Frame>`. It renders markup, hydration markers and collected `css()` — which is what a component test asserts on. Anything needing a resolved entry or a frame drives a router instead, as `apps/playground/app/router.test.tsx` does. The spec's "server-render test per component, via `remix/ui/server`" holds; it just has a ceiling worth knowing before task 12.

4. **`css()` emits `@layer rmx.<generated-class>`** — a sublayer per component instance nested under `rmx`, not a flat `rmx` layer. Task 11 sets up the cascade layers; `@layer base, rmx` still orders correctly, but the nesting is what the emitter has to account for.

Two shapes established here that later tasks inherit: `?nojs` renders interactive markup dead rather than absent, which needs a view component separate from its `clientEntry` wrapper (`ui/public/runtime-probe.tsx`) — the pattern every interactive `ui-remix` component will need; and `on(...)` requires an explicit element generic when the mixin is passed as a prop rather than written inline on the element.
