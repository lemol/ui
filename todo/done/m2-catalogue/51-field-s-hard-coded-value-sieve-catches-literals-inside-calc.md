---
title: Field's hard-coded-value sieve catches literals inside calc() again
group: M2 — Catalogue
completed_at: 2026-10-30T08:39:40Z
outcome: completed
---
Follow-up from the controller review of ui:49 (loop 01M65TAC220AFXPFHQZDTSGPHN, land 58b4fa3).

**Why.** ui:49 had to let `min(var(--ui-field-picker-max-inline-size), calc(100% - var(--ui-field-picker-gap) * 2))` past `offendersIn` in `src/remix/field/field.test.tsx`, and did it by copying Dialog's final strip, `/min|calc|[()+\-*/\s,%\d]/g`, which removes every digit and every percent sign. Before it, `calc(var(--ui-field-x) * 3 + 50%)` left `350%` and was an offender; now it leaves nothing and passes (run against both regexes). So the test that holds "no component hard-codes a space step" no longer sees a unitless or percent literal in a Field calc(). It also leaves the JSDoc above it false ("What may be left of one is its operators, a negation and a bare zero"), and makes the `\* -1\b|\b0\b` strip on the line before dead.

**What to build.** In `offendersIn`, strip only what the emitted values need: `min`, `100%`, `* 2`, and the existing negation and bare zero, keeping the operators. Update the JSDoc to name what may be left. Field only: Dialog's sieve in `src/remix/dialog/dialog.test.tsx` has the same breadth, but it is out of scope here.

**Tests first.** Assert `offendersIn` flags a Field value with a stray literal, for `calc(var(--ui-field-x) * 3)` and `calc(var(--ui-field-x) + 50%)`, and still clears the picker's `max-inline-size` value. Export nothing: if `offendersIn` cannot be reached with a synthetic value in the file as it stands, add a small local helper or block in the same test file.

**Done when.** Those literals are offenders again, the JSDoc is true, no production file changes, and `bun run check` passes.

## Comments

### @nzila at 2026-10-30 08:39:40 +00:00

Done: Only src/remix/field/field.test.tsx changed (no production file).
- Added a test (it failed first on `calc(var(--ui-field-x) * 3)`, 0 offenders). It runs `offendersIn` on synthetic `.x{width: …}` styles. `* 3`, `+ 50%` and `+ 4px` are now offenders, and the picker's `min(…, calc(100% - … * 2))` value is still clear. Nothing exported.
- `offendersIn` now strips `* -1`, `* 2`, a standalone `100%` and bare `0`, then only `min|calc|operators|parens|commas|whitespace`. The digit and `%` class is gone.
- Rewrote the JSDoc to list what may be left.
- Ran: the focused field test file (67 pass), `bun run lint` and `bun run typecheck`, which are clean. I did not run `bun run check` (the check stage does).
- Search for changed values: I only grepped the calc()/min() values in src/remix/field/*.ts*. I did not search `test/` or the rest of `src/` for other users of this sieve.
- Dialog's sieve is untouched, as scoped.

Review: approved (5/5)
Approved ui:51, commit 0d660f9. No open findings.

Diff: `git diff <base>...HEAD --stat` shows one file, src/remix/field/field.test.tsx, +21 -4. No production file changed. dialog.test.tsx is untouched, as scoped.

What to build (the brief has no numbered list; each sentence walked):
- Strip only `min`, `100%`, `* 2`, the negation and bare zero, keeping operators: done, field.test.tsx:109-110. `.replace(/\* -1\b|\* 2\b|(?<![\d.])100%|\b0\b/g, "")`, then `.replace(/min|calc|[()+\-*/\s,]/g, "")`. The `%\d` class is gone. `calc` is kept because emitted values need it; the old strip already had it.
- JSDoc names what may be left: done, field.test.tsx:91-94. It is true: of 38 literal probes (below), every value with a digit or % outside those named allowances was an offender.
- Dialog stays out of scope: done, not in the diff.

Tests and Done when:
- `calc(var(--ui-field-x) * 3)` is an offender: pinned in test "flags a stray literal inside a calc() and clears the picker's own value" (Field). Reversed in a scratch worktree by restoring the base strip on the HEAD test: `(fail) Field > flags a stray literal...`, "Expected length: 1 / Received length: 0" at the `* 3` line, 66 pass 1 fail.
- `calc(var(--ui-field-x) + 50%)` is an offender: same test. Reversed on its own by deleting the `* 3` line and keeping the base strip: the test still fails. `+ 4px` and the picker value behave the same under both sieves in the probe, so the `+ 50%` assertion is the one that failed. The `+ 4px` line is a guard that passes at base too.
- The picker's `max-inline-size` value clears: same test. Not vacuous: dropping `100%` from the strip fails it, and dropping `* 2` fails it (65 pass 2 fail each, the second failure being "reads only its own tokens and structural keywords, calc included"). That test holds the real rendered value.
- Export nothing: the `declared` helper is local to the test and offendersIn stays unexported.
- `bun run check` passes: discharged by check#1. check.command is `bun run check`, the same command the Done when names, passed at 0d660f9, "Ran 752 tests across 85 files".

Mutations of each strip, in a scratch worktree (my first run of the first two had a broken pattern; these are the rerun):
- Dropping `\* -1\b` fails "reads only its own tokens...", 66 pass 1 fail. So the strip the task called dead is live again.
- Dropping `\b0\b` fails the same test, 66 pass 1 fail.
- Dropping `\* 2\b` or the `100%` alternative fails 2 tests each.

Class check of the changed predicate, the sieve's strips run over synthetic values at HEAD and base, 48 inputs. Offender at HEAD (clear at base unless marked):
- `* 3`, `+ 50%`, `* 3 + 50%` (left `350%`, matching the task's Why), `* 2%`, `* 20`, `* 2 + 1`, `2 *`, `/ 2`, `*2`, `*  2`, `* -2`, `* -10`, `* -1%`, `+ 0%`, `+ 200%`, `+ 10%`, `+ 1100%`, `min(x, 90%)`, `calc(100 - x)`.
- Also offender at base too: `+ 4px`, `* 2.5`, `* 2px`, `* -1.5`, `* 0.5`, `+ .5`, `+ 1.0`, `+ 0.0`, `+ 0px`, `+ 0.100%`, `+ .100%`, `+ 100.0%`, `+ 1e100%`, `min(x, 100px)`, `calc(100vw - x)`, `calc(100dvh - x)`, `max()`, `clamp()`, `minmax()`.
Clear: the three real emitted values (picker size, `0 calc(... * -1)`, the select's end padding). Also clear, by the allowances the task itself names, with the same result at base: `* 2 * 2`, `* -1 * 2`, `+ -100%`, `* 100%`, `- 100%`, `* 0`, `+ 0`. Those strips are position-free; the task asked for that shape, so I do not hold it against the attempt.
The lookbehind `(?<![\d.])` turns out not to be needed for flagging (a leading digit or dot survives either way). It is harmless and matches the JSDoc's "span".
Not tried: uppercase `CALC(`, because references and values come from the emitter and an unknown spelling leaves letters, which is an offender. `var()` with a fallback, because referencesOf and the var strip match the bare form only, so the fallback's text stays; that code is unchanged here.

Comments: read the task file (no Comments section) and the brief (no Pre-start task comments section). Count 0, authors none.

Implementer's stated gaps:
- `bun run check` not run: discharged by check#1 as above.
- Did not search test/ or the rest of src/ for other users of this sieve: closed here. `grep -n offendersIn -r src test docs todo .agents scripts` finds separate local copies in tabs, tab-bar, facet-filter and dialog test files, nothing importing Field's, plus two dated plans.

Value search for the removed text:
- `git grep -n "operators, a negation"` finds only todo/m2-catalogue/51-...md:6, the task's own quotation (dated). Proved against the base file, which holds it at line 91.
- The removed regex `min|calc|` finds dialog.test.tsx:74 (live, a variant, out of scope) and docs/superpowers/plans/2026-09-19-ui-remix-dialog.md:514 (dated). The task file also quotes it (dated). No stale live copy for Field.
- field.tsx:468 "a literal smuggled in here still fails" and field.test.tsx:841 "a literal hidden inside the end padding is still an offender" are made true again by this change.

Quantities: do's "67 pass" re-derived: `bun test src/remix/field/field.test.tsx` gives 67 pass, 0 fail, 44ms. The test run also measures cost; the change adds a few regexes to a unit test, no scale concern. The brief has no Decisions section. Branch commits: only 0d660f9, the implementer's; no nzila commit on the branch to check.

Linter: 0 warnings, no class; check#1's log for HEAD says "Found 0 warnings and 0 errors.". At base `bun run lint` exits 0 and its captured output has no warning line, so 0 there too.

Proof: prove.skipped "no scenarios", no surface changed, no screenshots to judge. No new module, config, command or event; no external event or error reaction applies.

Not a defect and left alone: Dialog's sieve keeps the same breadth, as the task records.


Citations that do not open (the verdict stands; a finding may still be right):
- `todo/m2-catalogue/51-...md:6` path does not exist
Branch: nzila/01M65Z5TB622YTNHW1W7FSTCRY

nzila run 01M65Z5TB622YTNHW1W7FSTCRY
