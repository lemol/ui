---
title: SegmentedControl's hard-coded-value sieve decomposes its calc()
group: M2 — Catalogue
completed_at: 2026-10-30T14:02:04Z
outcome: completed
---
Found in the close of loop 01M65TAC220AFXPFHQZDTSGPHN, while checking how far ui:52 reaches. ui:52 names Dialog and Switch only; this test has the same gap in a stronger form.

**Why.** `isCleanValue` in `src/remix/segmented-control/segmented-control.test.tsx` (the "reads only its own tokens and structural keywords" test) passes any value that starts with `calc(` and mentions `--ui-segmented-`. So `calc(var(--ui-segmented-x) + 4px)` passes, as does a foreign token beside it, and the test holding "no component hard-codes a space step" sees nothing inside this component's calc().

**What to build.** Decompose the calc() as `offendersIn` in `src/remix/field/field.test.tsx` does: every `var()` in it must be a `--ui-segmented-*` token, then strip only what the emitted value needs and require nothing left. The component emits `calc((100% - var(--ui-segmented-track-pad) * 2) / ${count})` (`segmented-control.tsx:59`), so the allowed literals are `100%`, `* 2` and the `/ <count>` divisor. State what may be left in a doc comment. The bare `^\d+%$` branch for the per-index `translate` stays.

**Tests first.** Assert the sieve flags `calc(var(--ui-segmented-x) + 4px)`, `calc(var(--ui-segmented-x) * 3)` and `calc(var(--ui-segmented-x) + var(--other))`, and still clears the real inline-size value. Move `isCleanValue` out of the test body if the new test needs it.

**Done when.** Those values are offenders, the real value clears, the doc comment is true, no production file changes, and `bun run check` passes.

## Comments

### @nzila at 2026-10-30 14:02:04 +00:00

Done: Committed 17ecaf8 (test: decompose segmented control calc values). Only src/remix/segmented-control/segmented-control.test.tsx changed; no production changes.

Extracted isCleanValue, checked every calc var reference belongs to ui-segmented-, stripped only own vars and the emitted arithmetic vocabulary, and required an empty remainder. Doc comment states allowed residual syntax; bare integer percentage branch remains.

Test-first: the three requested fixtures (+ 4px, * 3, foreign var) each failed with true instead of false (8 pass / 3 fail), recorded before fixing. The real inline-size fixture cleared. Final focused verification: bun test src/remix/segmented-control/segmented-control.test.tsx test/styles.test.ts: 23 pass, 0 fail. bun run lint and bun run typecheck separately completed successfully; git diff --check passed. Working tree clean after commit.

Scope search: rg -n 'ui-segmented-|isCleanValue|valuesOf' src/ test/ --glob '*test*'; rg --files test; rg -n 'segmented|valuesOf|stylesOf' test/ --glob '*test*' (last search had no matches). Included test/styles.test.ts for the shared CSS extraction harness. No shared harness changes.

Comment evidence: rg -n 'calc|count|translate' src/remix/segmented-control/segmented-control.tsx showed line 59 emits calc((100% - var(--ui-segmented-track-pad) * 2) / ${count}) and line 71 emits ${index * 100}% for translate. No nzila-output predicate involved, so recorded log corpus sampling not applicable.

Reporting CLI: standalone nzila done --gap attempts were rejected for missing --outcome; gaps are included on this final report instead.

Review: approved (5/5)
Approved. Whole diff from base 20cad2a read: one commit, 17ecaf8, one file. `git diff --name-status` shows `M src/remix/segmented-control/segmented-control.test.tsx` and nothing else, so no production file changed. No findings.

#### Task brief: required cases
All are in src/remix/segmented-control/segmented-control.test.tsx.
- `calc(var(--ui-segmented-x) + 4px)`, `calc(var(--ui-segmented-x) * 3)` and `calc(var(--ui-segmented-x) + var(--other))` are offenders: pinned by "flags an offender inside calc(): %s". To fail, `isCleanValue` must return true for the value.
  - Reversed to `toBe(true)` in a scratch copy: 8 pass / 3 fail, all three cases.
  - Old predicate restored in scratch: the same 3 fail, so these cases do catch the original bug.
- Real inline-size value clears: pinned by "clears the indicator's own inline-size calculation". Reversed to `toBe(false)` in scratch: 10 pass / 1 fail.
- The fixture is not self-sealing. "reads only its own tokens and structural keywords" still sieves the rendered component. These mutations of segmented-control.tsx:59 in scratch each gave 10 pass / 1 fail on that test:
  - `* 2 + 4px`
  - `* 3`
  - `var(--space-2)` in place of the own token
  - `50%` in place of `100%`
  The sieve now reaches the emitted value, which is what the task was after. My first +4px and *3 attempts did not apply (empty diff, 11 pass). I re-ran them with a checked replacement, and these are those results.
- `bun run check` passes: see gaps below.
- The doc comment is true, checked against the code. After own var()s go, the residue is the listed `100%`, `* 2`, positive-integer `/ <count>`, calc, parens, `-` and whitespace. `/ 0` and `/ 2.5` are flagged, so "positive integer" holds.

#### What to build (unnumbered; walked by clause)
- Decompose as `offendersIn`: done, `isCleanValue` at segmented-control.test.tsx:42, same references-then-strip-then-empty shape as src/remix/field/field.test.tsx:96.
- Every var() is a `--ui-segmented-*` token: done, the `references.every` check.
- Strip only what the emitted value needs: done, and tighter than Field's because `+`, `*` and `/` are not stripped bare.
- Doc comment: done, above `isCleanValue`.
- Bare `^\d+%$` branch stays: done.
- Move `isCleanValue` out of the test body: done, module level, line 42.

#### Task comments
Read the task file todo/m2-catalogue/53-segmentedcontrol-s-hard-coded-value-sieve-decomposes-its.md and the brief. 0 comments, no authors: the file has no Comments section and the brief has no "Pre-start task comments" section. Nothing to walk.

#### Implementer's gaps
- "bun run check not run": discharged. Check stage ran `bun run check` (the brief's `check.command`, the same command the Done when names) on 17ecaf8 and passed: 758 tests across 85 files. The land gate runs it again.
- "No browser exploration or proof": pushed back, it does not matter here. The diff is one test file with no user-visible surface, and `prove.skipped` is "no scenarios". No screenshots to judge. Tests are colocated; no new module.

#### Predicate class check
Ran the extracted `isCleanValue` over 42 inputs.
Flagged, correctly:
- `* 2.5`, `* 25`, `* 2px`, `/ 4px`, `/ 4%`, `/ 0`, `/ 2.5`, `- 4px`, `- 1`, `+ 100%`
- `1100%`, `0.100%`, `50%` inside calc
- var fallbacks `var(--ui-segmented-x, 4px)` and `var(--other, var(--ui-segmented-x))`
- `--ui-segmentedx`, `--UI-segmented-x`, a foreign var beside `-`, a `/* 4px */` comment
- nested calc, trailing `4px` or a second calc, `min(calc(...), 4px)`, `CALC(`, `calc(4px)`, `calc(100%)`, `calc()`, `*2` without a space

Cleared, correctly: the real value at counts 1, 3 and 12.

Cleared, residual but harmless:
- `calc(var(--ui-segmented-x) - 100%)`, `* 2 * 2 * 2`, `/ 3 / 7` and `calc(var(--ui-segmented-x) - -)`. All are built only from the task's allowed vocabulary, Field's sieve has the same looseness, and the task asks for strip-and-require-empty rather than matching the exact expression. The doc comment does not claim more. Not a finding.

Not tried: uppercase or spaced `var( --x )` beyond the case above, and tokens glued into literals like `1var(...)00%`. These are invalid CSS that a component's template literal would not emit. nzila's output corpus does not apply, because this predicate reads rendered CSS.

#### Other checks
- Stale copies: searched removed-side phrases `checked structurally rather than` and `includes("--ui-segmented-")`. Each was found in the base file (`git show` of base, whitespace-flattened), proving the search. `git grep` at HEAD over the whole repo: no matches (exit 1).
- Other `startsWith("calc(` sieves: `rg` over src and test test files finds only line 49 of this file.
- Value `* 2) / ` occurrences (`ui-segmented-track-pad\) \* 2`): segmented-control.tsx:59 (live source), test.tsx:161 (live fixture, matches source; `/ 3` is the supplied count), and the task file (task text). No drift.
- Linter: 0 warnings and 0 errors, from check's recorded output (attempt 01M66HQPENPASP3PCKF2FQSTA6). Base had 0, from the last ui:52 gate log 01M66HFK3MWJ817V776WMJVMAY.
- Cost at scale: nothing to measure. Regexes run per declaration in a test; the sieve test takes under 1.1 ms (0.69–1.05 ms in the runs above).
- Migrations, config, events, external events, unreachable-state claims: none in this diff.
- nzila's own commits: the brief lists none on this branch. The only branch commit is the implementer's 17ecaf8.
- Scratch worktrees removed; working tree clean.

Branch: nzila/01M66HM6TJ0SPWGW2RQ0H3XJTQ

nzila run 01M66HM6TJ0SPWGW2RQ0H3XJTQ
