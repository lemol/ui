---
title: Ship ui as one git-installable package
tags: [packaging]
---
Every other lemol repository can be taken as a dependency. `@lemol/framework`
and `@lemol/todo-md` are each one package at the repository root with subpath
exports, so a consumer writes
`"@lemol/todo-md": "git+ssh://git@github.com/lemol/todo.md.git#todo-md@0.1.0"`
and imports `@lemol/todo-md/hub`. ui is the odd one out: `@lemol/ui-design` and
`@lemol/ui-remix` live in `packages/`, and a Bun git dependency always installs
the repository's *root* package — there is no subdirectory form of the
specifier. So no consumer outside `@lemol/workspace` can name them at all.

xonton is the first external consumer and hit this in its task 01. Its
`packages/design` and `packages/ui-remix` currently declare
`"@lemol/ui-design": "workspace:*"`, which resolves only inside the composed
workspace and makes a standalone `repos/xonton` clone uninstallable. That
exception is tracked in xonton's `test/packages.test.ts` and disappears when
this task lands.

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

- `@lemol/workspace`: three `file:` overrides collapse to one, and the
  ownership table in `AGENTS.md` names one package instead of three.
- xonton: its two manifests switch to the git specifier, and its
  `docs/architecture.md` dependency table, `docs/specs/milestone-1.md` §3 and
  `AGENTS.md` all name `@lemol/ui-design` / `@lemol/ui-remix` today.

Coordinated commits, one per repository.

## Done when

- `bun run check` is green here.
- A repository outside the workspace can depend on ui by git specifier and
  import a component and a theme from it.
