---
title: Bring up apps/playground and the render-test harness
tags: [playground, remix]
depends_on: [6]
---
`apps/playground` as a Remix 3 app with one server-rendered route, plus the
`remix/ui/server` test harness every component test will copy.

This task exists to *execute* the Remix 3 assumptions the rest of M1 rests on
rather than trust them: `remix` is at `3.0.0-rc.2`, and the asset-server story
is asserted from documentation, not from anything running in this repo.

## Scope

- `remix.json` configuring the asset server.
- `Bun.serve` + `router.fetch`, as money-web does.
- `run(router, { fallback })` with `clientEntry` resolved through the asset
  server.
- One route rendering server-side with no client JavaScript.
- A server-render test via `remix/ui/server` — the pattern every later component
  test copies.

## From the spec

> **Bun** as package manager, test runner and runtime (`Bun.serve` +
> `router.fetch`, as money-web does). **Remix's asset server** as the browser
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
