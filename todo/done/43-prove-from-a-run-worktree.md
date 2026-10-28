---
title: Prove from a run worktree
tags: [onboarding]
completed_at: 2026-10-28T09:13:53Z
outcome: completed
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

## Comments

### @nzila at 2026-10-28 09:13:53 +00:00

Done: Addressed both review notes on ui:43 (now at 64d9d23, on top of 13e718f).

R1 — test pins the main-checkout guard: `test/link-worktree.test.ts` fixture now also creates non-symlink entries in the fake main `proof/node_modules` (a real directory `realpkg/index.js` and a file `.bun-tag`), and after the main-checkout run asserts each is still a non-symlink with its content intact. Verified the test fails with the guard removed: in a scratch detached worktree I deleted line 45 (`if (realpathSync(mainCheckout) === realpathSync(worktreeRoot)) return`) from `proof/link-worktree.ts` and ran the test — it fails at the `realpkg` non-symlink assertion (0 pass, 1 fail), while it passes with the guard (1 pass, 27 expect() calls).

R2 — docs current: `docs/architecture.md` "## Proof" tree now lists `proof/link-worktree.ts` with its one-line role, plus a sentence that a run worktree needs `bun proof/link-worktree.ts` (the config's `setup`) before `bun proof/run.ts` because it has no `node_modules`.

Verification commands run:
- `bun run fix` then `bun run lint` — clean (fixed formatting in the edited test).
- `bun run typecheck` (`tsc -p tsconfig.json`) — no diagnostics.
- `bun test test/link-worktree.test.ts test/boundaries.test.ts` — 14 pass, 0 fail (boundaries confirms the kit stays out of src/apps).
- Done-when in a fresh detached scratch worktree (`git worktree add --detach .nzila-scratch-$NZILA_ATTEMPT HEAD`, removed afterwards): `(cd scratch && bun proof/link-worktree.ts)` exit 0, mirrored `.bin`, `@lemol/proof`, `effect`, `playwright` links; `(cd scratch && PROOF_DIR=<empty> bun proof/run.ts)` exit 0 writing scenario-001/002/003 + manifest.json.
- No value/list/guard searches needed beyond the touched files: the change adds no new literals consumed elsewhere; `grep` for `link-worktree` shows only `nzila.config.yaml`, the script, its test, and the new docs lines.
- No nzila-output corpus decisions in this change (no parser/matcher over gate output), so no corpus sampling applied.

Committed as 64d9d23 "test(proof): pin main-checkout no-op and document link-worktree" (2 files, +27/-1).

Review: approved (5/5)
Review#2 of ui:43 (base 8d71bf8, HEAD 64d9d23). I read the whole diff `git diff 8d71bf8...HEAD`: docs/architecture.md +6, nzila.config.yaml +1, proof/link-worktree.ts +79, test/link-worktree.test.ts +134. Both review#1 findings are fixed, and this round raises nothing new. Approved.

Comments: I read todo/43-prove-from-a-run-worktree.md. `grep -n -i comment` finds no match (exit 1), so it has no Comments section: 0 comments, no authors. The brief has no pre-start comments.
What to build: the task has no numbered list. All four Settled decisions are done, as walked in review#1, and the code is unchanged since then (the second commit touches only the test and docs):
- link by link, with scopes and .bin one level down, each keeping its target: proof/link-worktree.ts `mirrorLink` and the `@*`/`.bin` branch at line 61.
- main checkout is dirname(--git-common-dir), with the no-op guard at line 45 `if (realpathSync(mainCheckout) === realpathSync(worktreeRoot)) return`.
- setup is configured: nzila.config.yaml:1 `setup: bun proof/link-worktree.ts`.
- dev-only with no dependency: it imports only node:*, and test/boundaries.test.ts covers proof/.
Commits: 13e718f and 64d9d23, both by Leza Lutonda, both in scope, and each message matches its change.

Earlier findings:
- R1 is fixed. The fixture now adds a real `realpkg/index.js` dir and a `.bun-tag` file to main's proof/node_modules (test/link-worktree.test.ts, test "mirrors proof/node_modules into a worktree link by link"). After the main run the test asserts that each is still a non-symlink with its content intact. I reversed it in a detached scratch worktree by deleting line 45 with sed (grep count afterwards was 0). The test then failed: "Expected: false Received: true … 0 pass 1 fail". With the guard in place it passes: 1 pass, 27 expect() calls.
- R2 is fixed. docs/architecture.md:244 lists `link-worktree.ts` in the proof/ tree, and the paragraph at :249-252 says a run worktree needs `bun proof/link-worktree.ts` (the config's `setup`) before `bun proof/run.ts`. `rg -n link-worktree` over the repo returns only todo/43, test/link-worktree.test.ts, nzila.config.yaml:1 and docs/architecture.md:244/250. All of these are live and consistent. The diff states no quantities.

Tests and Done-when:
- Scoped, plain and .bin links resolve to main's target: pinned in the test above. Review#1's mutations M2 (link the whole dir) and M3 (copy the readlink text) fail it.
- Second run changes nothing: pinned as same targets (wtRun2).
- A run in main writes nothing: now pinned (R1).
- Done-when, which I ran in a fresh detached scratch worktree at HEAD with no install:
  - `PROOF_DIR=<empty> bun proof/run.ts` before setup exited 1.
  - `bun proof/link-worktree.ts` exited 0 and created links .bin/playwright, @lemol/proof, effect and playwright.
  - `PROOF_DIR=<empty> bun proof/run.ts` then exited 0 and wrote scenario-001, scenario-002, scenario-003 and manifest.json.
  I removed the scratch worktree afterwards, and `git status` is clean.
- "`bun run check` passes there" is discharged by the check stage: check.command `bun run check` passed at 64d9d23 (output.log: 701 pass, 0 fail).

Implementer's stated gap: "did not rerun bun run check in the scratch worktree" is pushed back, because the check stage's `bun run check` pass at 64d9d23 discharges it.
Lint: "Found 0 warnings and 0 errors." in the check output.log; the base had 0.
Gate divergence (remix): the check ran in a worktree that resolves remix from its own node_modules. This diff touches no remix code, so that evidence still holds for this change.
Class checks I tried: the real main install, a second run, a main run with non-link entries, and removing the guard.
Not tried, as in review#1:
- a dangling link in main (realpathSync would throw; noted, not open)
- a stale worktree link (worktrees are fresh per run)
- a --separate-git-dir clone (not this repository's shape)
Tests sit under test/, which is the repo convention.
Proof: prove.skipped "no scenarios". The diff changes no UI surface, so there are no screenshots to judge.

Branch: nzila/01M60SVW4AH7NF0GBTDSBX368Z

nzila run 01M60SVW4AH7NF0GBTDSBX368Z
