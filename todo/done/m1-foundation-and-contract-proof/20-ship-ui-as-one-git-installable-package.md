---
title: Ship ui as one git-installable package
tags: [packaging]
group: M1 — Foundation and contract proof
completed_at: 2026-09-19T17:57:55Z
outcome: completed
---
Every other lemol repository can be taken as a dependency. `@lemol/framework`
and `@lemol/todo-md` are each one package at the repository root with subpath
exports, so a consumer writes
`"@lemol/todo-md": "git+ssh://git@github.com/lemol/todo.md.git#todo-md@0.1.0"`
and imports `@lemol/todo-md/hub`. ui is the odd one out: `@lemol/ui-design` and
`@lemol/ui-remix` live in `packages/`, and a Bun git dependency always installs
the repository's *root* package — there is no subdirectory form of the
specifier. So no consumer outside a shared Bun workspace can name them at all.

The first external consumer hit this straight away. Its packages declare
`"@lemol/ui-design": "workspace:*"`, which resolves only inside a shared
workspace and makes a standalone clone of that consumer uninstallable. That
exception disappears when this task lands.

## What to build

- One package at the repository root — `@lemol/ui` — with subpath exports in
  the shape `framework` and `todo-md` use. Something like `./design`,
  `./design/css`, `./remix`, `./remix/compat`, `./remix/runtime`, `./mini`;
  the names are yours, the constraint is that a consumer reaches everything
  through one installable package.
- Cross-package imports inside `src/` become relative. This is the part that
  actually forces the restructure: `ui-remix`'s source imports
  `@lemol/ui-design` by name, and in a git-installed checkout there is no
  `node_modules` to resolve that through, so a root package that merely
  re-exported `packages/*/src` would still fail on first import.
- `apps/playground` keeps working, on `workspace:*`.
- `test/boundaries.test.ts` keeps enforcing the same rules across the new
  layout — the SPA floor and the design/renderer split are unchanged by this;
  only where the files sit changes.
- A tag, so consumers have a ref to pin.
- The documents that describe the old layout: `AGENTS.md`'s layout block,
  `docs/architecture.md`'s package table and structure, and the per-package
  READMEs.

## Blast radius outside this repository

- A composing workspace: three `file:` overrides collapse to one.
- The first external consumer: its manifests switch to the git specifier, and
  the documents that name `@lemol/ui-design` / `@lemol/ui-remix` follow.

Coordinated commits, one per repository.

## Done when

- `bun run check` is green here.
- A repository outside any shared workspace can depend on ui by git specifier and
  import a component and a theme from it.
