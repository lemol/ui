---
title: link-worktree's rerun test pins that it changes nothing
---
Follow-up from the approval of ui:43 (review#1 and review#2 both noted it, as minor).

**Why.** `test/link-worktree.test.ts:123-132` checks a second `bun proof/link-worktree.ts` run only by its link targets (`realpathSync` / `readlinkSync`). A run that deletes and recreates every link passes that test too, so the Done-when clause "a second run changes nothing" is not pinned.

**What to build.** Record `lstatSync(...).ino` and `mtimeMs` for each mirrored link before the second run, and assert they are unchanged after it. Prove the test catches the fault: make `mirrorLink` always remove and relink in a scratch copy, and the test must fail.

**Done when.** The assertion is in, the reversal fails it, and `bun run check` passes.
