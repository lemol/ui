---
title: Dialog's and Switch's hard-coded-value sieves catch literals inside calc()
group: M2 — Catalogue
completed_at: 2026-10-30T13:56:57Z
outcome: completed
---
Follow-up from the controller review of ui:51 (loop 01M65TAC220AFXPFHQZDTSGPHN, land d934f9a), which fixed this for Field and left these two out of scope.

**Why.** Two other tests still end their strip on a class holding every digit and percent sign: `offenders` in `src/remix/dialog/dialog.test.tsx` (`/min|calc|[()+\-*/,\s%\d]/g`) and `isCleanValue` in `src/remix/switch/switch.test.tsx` (`/calc|[()+\-*/,\s%\d]/g`). So `calc(var(--ui-dialog-x) * 3 + 50%)` leaves nothing and passes, and the test holding "no component hard-codes a space step" does not see a unitless or percent literal in either component's calc().

**What to build.** In each test, strip only what that component's emitted values need, as `offendersIn` in `src/remix/field/field.test.tsx` now does: drop the digit and `%` from the final class and name the allowed literals in a strip before it. Dialog emits `* 2`, `* -1`, `100%`, a bare zero, and its `env(safe-area-inset-*)`/`dvh` forms; read `src/remix/dialog/dialog.tsx` for the rest. Switch emits `* 2`. State what may be left in each doc comment. `tabs.test.tsx` and `facet-filter.test.tsx` allow only `0` and `1` and stay as they are.

**Tests first.** In each file, assert the sieve flags `calc(var(--ui-<component>-x) * 3)` and `calc(var(--ui-<component>-x) + 50%)` and still clears the component's real calc() values.

**Done when.** Those literals are offenders in both tests, each doc comment is true, no production file changes, and `bun run check` passes.

## Comments

### @nzila at 2026-10-30 13:56:57 +00:00

Done: Tightened the hard-coded-value sieves in `src/remix/dialog/dialog.test.tsx` (`offendersIn`) and `src/remix/switch/switch.test.tsx` (`isCleanValue`) to the field-test pattern: each now strips only its component's named literals before a final class that no longer contains digits or `%`, so `* 3` and `+ 50%` survive as offenders. Dialog allows `* 2`, `* -1`, `100%`, `100dvh`, a bare zero, and `env(safe-area-inset-top/bottom)`; Switch allows only `* 2`. Both doc comments now state exactly what may be left. Added per-file tests asserting the sieve flags `calc(var(--ui-<component>-x) * 3)` and `+ 50%)` (plus `+ 4px`) and still clears every real calc() the components emit. No production files changed; `tabs`/`facet-filter` untouched per scope.

Verified: new tests failed before the fix for the expected reason (stray `* 3` waved through in both files); after the fix `bun test src/remix/dialog/dialog.test.tsx src/remix/switch/switch.test.tsx` is 25 pass / 0 fail. `bun run lint` passes (after one `bun run fix` for formatting) and `bun run typecheck` passes, run as separate commands. `git status` clean on nzila/01M66HBTF3KPKRRH2TX4GBPJ0A at a2381aa (test files only).

Evidence for the allowed-literal claims: `rg -n 'calc\(|min\(|env\(|dvh|100%' src/remix/dialog/dialog.tsx src/remix/sheet/sheet.ts src/remix/switch/switch.tsx` shows dialog's `0 calc(...enter-offset) * -1`, `min(..., calc(100% - ...inset * 2))` x2, sheet's `calc(100dvh - ... - env(safe-area-inset-top))` and `calc(pad + env(safe-area-inset-bottom))`, and switch's single `...track-inset * 2` — and nothing else with digits. Edge check via `bun -e` on the dialog strip: `* 3`->`3`, `+ 50%`->`50%`, `* 20`->`20`, `+ 50dvh`->`50dvh` (all offenders), real `100dvh`/`* -1` values strip to empty. Searched `rg -ln 'offendersIn|isCleanValue' src/ test/` — each sieve is file-local, so no other test files affected. Did not run the full `bun run check` gate (check stage owns it).

Review: approved (5/5)
review#1 of do#1 (commit a2381aa) — APPROVED. Test-only tightening of the calc() sieves, mirroring the field pattern. No findings.

Required cases and where they are pinned:
- Dialog flags calc(var(--ui-dialog-x) * 3): pinned by DialogPanel > "flags a stray literal inside a calc() and clears the panel's own values" (src/remix/dialog/dialog.test.tsx:146). To fail it must see a non-empty offenders list; reversed in scratch (.nzila-scratch-$NZILA_ATTEMPT) to toEqual([]) and it failed with Received + 3 (sieve returns "3").
- Dialog flags calc(var(--ui-dialog-x) + 50%): same test, line 147. Old sieve waved it through — verified analytically in the live tree: the base strip reduces it to "" (empty = clean), the new strip leaves "50%".
- Dialog still clears its real calc() values: same test, lines 149-161 — min(..., calc(100% - inset * 2)), calc(100% - inset * 2), "0 calc(enter-offset * -1)", calc(100dvh - sheet-inset - env(top)), calc(pad + env(bottom)), each asserted toEqual([]).
- Switch flags calc(var(--ui-switch-x) * 3): pinned by Switch > "flags a stray literal inside a calc() and clears the thumb's own travel" (src/remix/switch/switch.test.tsx:158). Reversed in scratch to toBe(true) and it failed (Received: false).
- Switch flags calc(var(--ui-switch-x) + 50%): same test, line 159. Base strip reduces it to "" (verified live); new strip leaves it unclean.
- Switch still clears its real calc(): same test, lines 161-165 — the thumb-travel calc with * 2 asserted toBe(true).
- Both files also pin + 4px as offender (extra, beyond the brief). Re-ran targeted suite live: bun test on the two files = 25 pass / 0 fail, 88 expects (re-derives do#1's "25 pass / 0 fail").

What-to-build walk (one paragraph, five items):
1. Strip only what each component emits, field-style (digit+% out of final class, named literals first) — done, dialog.test.tsx:79-85 and switch.test.tsx:50-53.
2. Dialog's * 2, * -1, 100%, bare zero, env/dvh forms (dialog.tsx read) — done; named strip covers all five plus 100dvh. Verified against dialog.tsx:9 (0 calc * -1), :50-51 (min/calc 100% * 2) and sheet.ts:42 (100dvh + env top), :52 (env bottom). rg -n '[0-9]' over dialog.tsx/sheet.ts/switch.tsx shows no other emitted digit literal outside keywords (opacity 0/1, translate "0"/"0 100%", "auto 0", border "0", "100%" are keyword-held-out; viewBox/path/level={2}/40rem/comments are markup, media text, or prose, never declaration values the sieve reads).
3. Switch's * 2 — done, switch.test.tsx:52; switch.tsx:51 is its only digit-bearing value.
4. Doc comment states what may be left — done and true: dialog.test.tsx:58-64, switch.test.tsx:35-39; every named literal traced to an emission above.
5. tabs.test.tsx / facet-filter.test.tsx stay — done, untouched (diff --name-only lists only the two files); their finals remain 01-only (tabs.test.tsx:46, facet-filter.test.tsx:63).

Task Comments: I read the brief's task body (no "Pre-start task comments" section present), ran nzila show ui:52 --json and scanned for comment keys (only title/body, no Comments entries), and ran nzila inbox (empty). Comment count is 0, authors none — a checked claim. No per-comment walk needed.

Implementer's stated gap: "Did not run the full bun run check gate (check stage owns it)." This Done-when command IS the project's configured gate (brief check.command: bun run check), so it is discharged by the check stage, not held open: check#1 passed check.command `bun run check` at commit a2381aa (= HEAD, verified via git rev-parse), 754 pass / 0 fail across 85 files with lint (fmt clean on 271 files; oxlint 0 warnings 0 errors on 261 files) and tsc clean in the same run. Done-when names the same `bun run check`, so no command divergence. I do not ask any later attempt to run it.

nzila commits vs rule: one commit on the branch, a2381aa "Tighten dialog and switch calc() sieves to named literals" — entirely inside the task's rule (two test files, no production change). No out-of-rule commit.

Brief Decisions: the brief carries no Decisions section; its explicit constraints (tabs/facet-filter untouched, no production changes) are honored — see scope evidence above. No sentence-vs-code disagreement.

Predicate class check (the sieves are matchers over CSS text). Tried via bun -e against the exact HEAD regexes: dialog flags * 3, + 50%, + 4px, * 20, + 50dvh, + 200%, + 10px, + 0.5 (leaves ".5"), * -2, + 1, env(safe-area-inset-left) (leaves "envsafeareainsetleft"), 2100% (lookbehind blocks partial strip), 0% (leaves "%"), and clears * 2, * -1, + 100%, + 100dvh and all five real values; switch flags * 3, + 50%, + 4px, * 20, + 0, + 100% and clears * 2 and the real thumb travel. Deliberately not tried: uppercase CALC/MIN/ENV and spaced variants like "*  2"/"*2" — the generator (component source) emits only the lowercase single-spaced forms, and the pattern matches field.test.tsx's convention, so untested spellings cannot be produced by the code under check.

Stale-copy search: searched the removed broad class repo-wide (rg -n '\[\(\)\+' src/ test/): finals are now dialog/field `[()+\-*/\s,]` (no %/digit), switch `[()+\-*/,\s]`, tabs/facet 01-only — no remaining `%`-or-`\d` final class outside the named-literal strips (field.test.tsx:109, dialog.test.tsx:82 hold the intentional `100%`). Proved the search: `s%\d` matches the base file (git show base:dialog.test.tsx count 1) and finds nothing live in the changed files.

Quantities: "25 pass / 0 fail" re-derived by my own run (25/25). do#1's edge claims (* 3->3, + 50%->50%, * 20->20, + 50dvh offender, 100dvh/*-1 clean) all reproduced in my probes. Commit message and doc comments state no counts.

Cost: test-only diff, no production path; targeted suite wall time 24.00ms (bun test, 25 tests), full gate suite 15.42s for 754 tests per the check log. No scale cost to measure further.

Linter: HEAD per check output.log — fmt clean, oxlint "Found 0 warnings and 0 errors". N=0 so no increment to attribute. Base linter not re-measured: a scratch run at the base failed to load ./lint/style.js (plugin double-register from the detached cwd), a harness artifact, not a base signal; the base was itself a landed commit.

Proof: prove.skipped, no scenarios, result Skipped — no screenshots exist; fit is N/A (no surface changed, test-only diff). I cannot judge UI fit from images and do not approve fit on that basis; there is nothing visual to approve.

Hygiene: reviewer wrote nothing to the branch (scratch edits were in a detached worktree, since removed); git status --short clean at report time; HEAD still a2381aa.

Branch: nzila/01M66HBTF3KPKRRH2TX4GBPJ0A

nzila run 01M66HBTF3KPKRRH2TX4GBPJ0A
