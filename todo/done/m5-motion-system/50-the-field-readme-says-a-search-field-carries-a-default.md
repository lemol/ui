---
title: The Field README says a search Field carries a default placeholder
group: M5 — Motion system
completed_at: 2026-10-30T08:34:42Z
outcome: completed
---
Follow-up from the controller review of ui:48 (loop 01M6389J86R6C07DQ3RW0D09V4, land 500279c). That controller noted it as a minor gap and did not file it.

**Why.** ui:48 gives a search Field `placeholder=" "` by default (`src/remix/field/field.tsx:605`), so the clear button's `:placeholder-shown` dissolve has a state to key off. The JSDoc on `searchClear` explains this. The Field section of `src/remix/README.md` (around line 226, the `ui-field-clear-*` sentence) does not, so a caller who reads the README cannot tell why an empty search input reports `:placeholder-shown`, or that passing `placeholder` overrides the default.

**What to build.** Add one sentence to the Field section of `src/remix/README.md`: a search Field defaults `placeholder` to `" "` so the clear dissolve has a state to run between, and a caller's own placeholder replaces it.

**Done when.** The README states the default and why, and `bun run check` passes.

## Comments

### @nzila at 2026-10-30 08:34:42 +00:00

Done: Addressed F1 in src/remix/README.md: removed all three stray leading spaces and rewrapped the paragraph to match its neighbours. Wording is unchanged, verified by comparing whitespace-normalized text against 7d28495. No review notes pushed back on.

Committed as 047fd1a (docs(remix): fix Field paragraph whitespace); worktree clean.

Verification:
- Focused Bun assertion rejecting /^ [a-z]/ failed before the fix, then passed after it; expected failure recorded with nzila note. No unexpected failures.
- git diff --check passed.
- bun run lint passed.
- bun run typecheck passed.
- bun test src/remix/field/field.test.tsx: 66 pass, 0 fail.
- Search: rg -n 'placeholder|placeholder-shown' src/remix/field test identified the existing tests pinning the documented default and caller override. grep -nE '^ [a-z]' src/remix/README.md confirmed the review finding before editing.

No behavior changed and no persistent test added for this whitespace-only correction. No proof scenarios named or changed; loaded the prove skill. Full bun run check left to the check stage as instructed (gap recorded).

Review: approved (5/5)
Approved. F1 is fixed, nothing new found, and the whole diff from 4afcc66 is one sentence plus a rewrap.

Earlier findings
- F1 fixed in 047fd1a. `grep -nE '^ [a-z]' src/remix/README.md` returns nothing (rc=1). Lines 226-234 are 49-78 columns, in line with lines 219-224 (66-77). Wording did not move: the whitespace-flattened README at 7d28495 and at HEAD compare equal under `diff`, so the second commit is whitespace only. `git diff 4afcc66...HEAD --stat`: 1 file, +6 -4.
- No new findings.

Task walk
- What to build (one item, unnumbered): done, `src/remix/README.md:229-231`. One sentence states the default `" "`, the reason, and that a caller's placeholder replaces it. Mentioned in do#1 and do#2.
- Done when, "README states the default and why": done, same lines.
- Done when, `bun run check`: discharged by the check stage. `check.command` is `bun run check`, `check.passed` is 047fd1a, 751 tests across 85 files. It is the same command the Done when names. I did not run the gate.
- Tests section: the task has none and the diff adds no test, so no reversal is owed. The documented behaviour was already pinned by ui:48 in `src/remix/field/field.test.tsx` (`expect(markupOf(html)).toContain('placeholder=" "')` line 1040, `expect(markupOf(own)).not.toContain('placeholder=" "')` line 1056). Reran `bun test src/remix/field/field.test.tsx`: 66 pass, 0 fail.
- Comments: read the task file `todo/m5-motion-system/50-the-field-readme-says-a-search-field-carries-a-default.md` (10 lines) and the brief. 0 comments, no authors: `rg -n -i 'comment|author|^by'` over it returns nothing, and the brief has no pre-start comments.
- Implementer's stated gap, did not run `bun run check`: done, discharged by check#2 on 047fd1a as above.
- nzila's own commits: the brief lists none. Both commits on the branch are the implementer's.

Claims checked
- Default and override: `src/remix/field/field.tsx:611` is `placeholder={props.placeholder ?? (props.type === "search" ? " " : undefined)}`, which the sentence matches. review#1's real-engine probe of `:placeholder-shown` stands; the code it read has not changed (the diff touches only the README), so I did not repeat it.
- Value search for the default, over the whole repo excluding `todo/done` (`rg -n 'placeholder=" "|`" "`|placeholder` to'`), proven by hitting README line 230. Every occurrence classified:
  - `src/remix/README.md:230`: live, the new sentence.
  - `src/remix/field/field.tsx:309`: live JSDoc, agrees.
  - `src/remix/field/field.test.tsx:1040,1056`: live tests, agree.
  - The task file lines 6 and 8: dated, this task's own record.
- The moved text "styles no focus ring" still reads whole: `README.md:231` plus the test names and dated plan records, none of which this diff affects.
- Quantity read back: "Forty-nine tokens" is unchanged by the diff and still true (`rg -c 'ui-field-' src/remix/field/tokens.ts` gives 49). The "six of them motion in three pairs" clause is also untouched; review#1 re-derived it at lines the diff does not reach.

Linter: 0 warnings (`Found 0 warnings and 0 errors.` line 9 of the check's recorded output); the base was not run because the diff is one `.md` file the linter does not read, so it can add none. `bun run lint` reran clean.

N/A: no predicate, config field, migration, cost at scale, external event or new module in this diff. No proof: `prove.skipped` is "no scenarios", so there are no screenshots to judge.

Branch: nzila/01M65Y440V1VSSXGNTEGN5CV8D

nzila run 01M65Y440V1VSSXGNTEGN5CV8D
