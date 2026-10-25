---
title: Register the ui packages in the workspace composition root
tags: [workspace]
depends_on: [6]
group: M1 — Foundation and contract proof
completed_at: 2026-09-18T04:27:06Z
---
Make the ui packages visible to a Bun workspace that composes this clone with
other repositories.

**These edits land in the composing repository, not in this checkout.**

## Scope

- Its list of repositories — add the `ui` entry.
- Its root `package.json` — add the clone's `packages/*` and `apps/*` to
  `workspaces`, and a `file:` override per package.
- Its verification order — the ui packages typecheck and test before todo-md.

## Done when

- `bun install` at the workspace root resolves `@lemol/ui-*` to the local clone.
- The verification order runs the ui packages before todo-md.
