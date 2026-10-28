---
title: Prove from a run worktree
tags: [onboarding]
---
**Why.** Task 40's kit runs from the main checkout but not from a run worktree, which is where a run is proved. In a `git worktree add` of this repository with nothing installed, `bun run check` passes, but `bun proof/run.ts` fails with `Cannot find module '@lemol/proof' from '<worktree>/proof/run.ts'`. A worktree has no `node_modules`, so resolution walks up to the main checkout's. That reaches the root package's links and nothing else. The install links `@lemol/proof` and `effect` into `proof/node_modules` only, and no directory above the worktree's `proof/` holds them. The gate is unaffected, because `bun run check` neither runs nor typechecks `proof/`.

**Settled decisions.**
- A setup script mirrors the main checkout's `proof/node_modules` into the worktree, link by link, never by linking the whole directory. Scopes (`@lemol/`) and `.bin` are mirrored one level down. Each link keeps its target, the one install the checkout already made. An install inside the worktree then replaces the worktree's own links and cannot write through to the main checkout's.
- The main checkout is the parent of `git rev-parse --path-format=absolute --git-common-dir`. Run from the main checkout itself, the script does nothing. It is idempotent: a second run leaves the same links.
- The root config that already holds `gate` and `prove` names it as `setup`, so a run calls it before it gates or proves.
- It is a dev-only script beside the kit (for example `proof/link-worktree.ts`). Nothing under `src/` or `apps/` imports it, which `test/boundaries.test.ts` already enforces for `proof/`. It takes no dependency.

**Tests first.** A `bun:test` case builds a scratch repository with a fake `proof/node_modules` (a scoped package link, a plain one and a `.bin` entry). It adds a worktree, runs the script there, and asserts that each mirrored link resolves to the main checkout's target. A second run changes nothing, and a run in the main checkout writes nothing.

**Done when.** In a fresh `git worktree add` of this repository with no install, running the setup and then `PROOF_DIR=<empty dir> bun proof/run.ts` replays all three scenarios with exit 0, and `bun run check` passes there.

**Out of scope.** Mirroring any other member's links: only `proof/` needs them. Installing inside a worktree.
