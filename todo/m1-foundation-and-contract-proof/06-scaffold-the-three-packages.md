---
title: Scaffold the three packages
tags: [scaffold]
---
Create the three package skeletons: `package.json`, a per-package `tsconfig.json`,
and an empty `src/index.ts`. No bundler and no build step — the packages ship
TypeScript from `src/`.

## Scope

- `packages/ui-design`, `packages/ui-remix`, `packages/ui-remix-mini`.
- `main: "./src/index.ts"`, plus an exports map declaring the subpaths the rest
  of M1 needs: `@lemol/ui-design/css`, `@lemol/ui-remix/demos`,
  `@lemol/ui-remix/runtime`, `@lemol/ui-remix/compat`.
- `remix` as the only peer dependency, pinned to `3.0.0-rc.2` to match the root.
  No `effect`.
- Per-package `tsconfig.json` extending the root config. The root `tsconfig.json`
  already includes `packages`, `apps` and `test`.

## From the spec

> **No Effect dependency.** Every other lemol repo pins `effect` exactly. These
> are presentation packages, so `remix` is the only peer, keeping `ui` out of the
> version-lockstep problem.

> **There is no library build to own.** `@mionso/design` ships
> `main: "./src/index.ts"` — raw TypeScript consumed directly. Vite's strongest
> card, library mode, has nothing to do here.

## Done when

- `bun install` resolves the three workspace packages.
- `bun run check` is green with empty `src` directories.
