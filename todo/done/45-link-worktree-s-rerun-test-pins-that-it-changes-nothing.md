---
title: link-worktree's rerun test pins that it changes nothing
completed_at: 2026-10-29T08:49:00Z
outcome: completed
---
Follow-up from the approval of ui:43 (review#1 and review#2 both noted it, as minor).

**Why.** `test/link-worktree.test.ts:123-132` checks a second `bun proof/link-worktree.ts` run only by its link targets (`realpathSync` / `readlinkSync`). A run that deletes and recreates every link passes that test too, so the Done-when clause "a second run changes nothing" is not pinned.

**What to build.** Record `lstatSync(...).ino` and `mtimeMs` for each mirrored link before the second run, and assert they are unchanged after it. Prove the test catches the fault: make `mirrorLink` always remove and relink in a scratch copy, and the test must fail.

**Done when.** The assertion is in, the reversal fails it, and `bun run check` passes.

## Comments

### @nzila at 2026-10-29 08:49 +00:00

Done: test/link-worktree.test.ts: before the second `link-worktree.ts` run, record `lstatSync` ino and mtimeMs for the three mirrored links (plain, @scope/pkg, .bin/tool). After the run, assert they are unchanged. The existing realpath/readlink assertions stay.

Reversal: in a detached scratch worktree I changed `mirrorLink`'s skip check to `if (false) return`, so it always removes and relinks. The test failed on the new assertion, with different ino and mtime values. The scratch worktree is removed. The un-reversed test passes.

I ran the focused test, oxlint on the file, oxfmt --check on the file, and `tsc --noEmit`. All were clean. Lint first flagged blank-line spacing, which I fixed in a second commit. I did not run `bun run check`, as instructed. I searched for no changed values, since the diff only adds assertions to one test file.

Review: approved (5/5)
review#1 of ui:45 (base 766885f1ca7f43f033b066ea5866fb1ab3e3eb0b, HEAD 81040db). Whole diff read via git diff 766885f1ca7f43f033b066ea5866fb1ab3e3eb0b...HEAD: 1 file, 11 insertions(+)/1 deletion(-), all in test/link-worktree.test.ts. No other files changed; git status --short is clean and no scratch worktree remains.

Done-when (task file todo/45-link-worktree-s-rerun-test-pins-that-it-changes-nothing.md:10, 3 clauses):
1. "The assertion is in" — pinned in test/link-worktree.test.ts, test "mirrors proof/node_modules into a worktree link by link": test/link-worktree.test.ts:123 comment "Second run changes nothing: same inodes and mtimes", :124 linkPaths = [wtPlain, wtPkg, wtTool], :126-129 identity() returns { ino, mtimeMs } from lstatSync, :132 before = linkPaths.map(identity), :136 expect(linkPaths.map(identity)).toEqual(before). Existing realpath/readlink assertions at :137-142 stay.
2. "The reversal fails it" — pinned and independently re-verified (see below). What the test must see to fail: any of the three links with a different ino or mtimeMs after the second run.
3. "bun run check passes" — discharged by the check stage, not re-run here: check.command is `bun run check`, passed at 81040db (check#1: 748 pass across 85 files; gate output.log tail confirms 748 pass, 0 fail, 4143 expect() calls). Done-when names the same command as check.command, so no divergence to report.

Reversal (reviewer re-ran; implementer's claim confirmed): detached scratch at HEAD under $PWD/.nzila-scratch-$NZILA_ATTEMPT, patched proof/link-worktree.ts:20 from `if (realpathSync(destination) === target) return` to `if (false) return` so mirrorLink (proof/link-worktree.ts:13, callers :67 and :73) always removes and relinks. `bun test test/link-worktree.test.ts` in the scratch failed at test/link-worktree.test.ts:136 `expect(linkPaths.map(identity)).toEqual(before)` — 0 pass, 1 fail, 22 expect() calls — with all three entries differing in both ino and mtimeMs (e.g. ino 667363355->667363373). Un-reversed live worktree passes: `bun test test/link-worktree.test.ts` → 1 pass, 0 fail, 28 expect() calls. Scratch removed afterwards.

What-to-build (single item in task file :8): done — record lstatSync(...).ino and mtimeMs for each mirrored link before the second run and assert unchanged after (test/link-worktree.test.ts:124-136), covering all three mirrored shapes (plain, @scope/pkg, .bin/tool). Nothing pushed back, nothing missing.

Comments: I read the brief (no Pre-start task comments section), todo/45-link-worktree-s-rerun-test-pins-that-it-changes-nothing.md (10 lines, no Comments section), todo/TODO.md (lists 45), and `nzila inbox` (no messages). Comment count 0, authors none — checked, not defaulted. No comment items to walk.

Implementer's stated gaps (do#1 prose): (a) "did not run bun run check, as instructed" — discharged by check.command pass at 81040db above; per instructions I do not hold it open and do not ask the next attempt to run it. (b) "Lint first flagged blank-line spacing, fixed in a second commit" — confirmed: 81040db is 1 insertion on the same test file and `bun run lint` now exits 0 with fmt clean on 271 files. (c) "searched for no changed values" — confirmed: `rg -n mtimeMs` returns only the task file :8 and test/link-worktree.test.ts:129; no literals consumed elsewhere. No other gaps stated; no brief Gaps section exists.

nzila commits vs rule: the brief lists no commit rules. Both commits touch only test/link-worktree.test.ts (cebd76d +10/-1, 81040db +1) with messages matching the change; no out-of-rule commit. No branch hygiene finding.

Decisions: the brief and task file state no Decisions; nothing for code to contradict.

Fixture check: the fixture creates exactly 3 symlinks (plain, @scope/pkg, .bin/tool) plus non-symlink realpkg/.bun-tag; linkPaths covers exactly the 3 symlinks, so no mirrored link is unpinned and no non-link is wrongly pinned. No numbers asserted beyond that; no test encodes the bug.

Constraints left out: none — SPA boundary (test/boundaries.test.ts) unaffected (test-only diff, lstatSync already imported at test/link-worktree.test.ts:5); styling/contract, native-first, single-package, motion, no-build, no-Effect rules not touched.

Cost at scale: no scale cost; measured: focused `bun test test/link-worktree.test.ts` ~1231ms live (661ms for this test in the gate log), scratch reversal run 1014ms. Command and output quoted above.

Spec match: docs/architecture.md:244/250 proof tree still accurate (lists link-worktree.ts role, setup sentence); no doc claims the old same-targets pin as current. `rg -n "Second run changes nothing"` returns only todo/done/43-prove-from-a-run-worktree.md:58 (dated ui:43 record, stays as history) and test/link-worktree.test.ts:123 (live). Search proven: same rg finds the line via `git show HEAD:test/link-worktree.test.ts | rg -n "Second run"`. No stale live copy.

Reads-twice/crash: test lstatSyncs before/after a synchronous spawnSync second run; no cross-crash window. Migration/backfill: N/A. Predicate/matcher/guard: the diff adds identity(), not a predicate over strings; mirrorLink's guard at proof/link-worktree.ts:20 is unchanged, so no class check owed beyond the reversal above. External events/errors: none. New modules/dirs: none, so colocation N/A.

Linter: `bun run lint` exits 0 (fmt clean 271 files, oxlint silent = 0 warnings); gate output.log at 81040db records "Found 0 warnings and 0 errors. Finished in 364ms on 261 files". Base had 0 (ui:43 record and test-only delta); increment 0, no file attribution needed. Typecheck `bunx tsc --noEmit -p tsconfig.json` exits 0.

New config/command/event/intent: none. Proof: prove.skipped "no scenarios", prove.result Skipped — test-only change with no UI surface, so no screenshots to judge for working/fit; fit N/A. No gap left for review.

No open findings.

Branch: nzila/01M63DC770C09B6862B49HGQE6

nzila run 01M63DC770C09B6862B49HGQE6
