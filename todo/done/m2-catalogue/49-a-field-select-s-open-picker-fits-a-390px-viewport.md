---
title: A Field select's open picker fits a 390px viewport
group: M2 — Catalogue
completed_at: 2026-10-30T08:15:10Z
outcome: completed
---
Follow-up from the ui:46 review (loop 01M6389J86R6C07DQ3RW0D09V4, run 01M638ARB3YVE5JY1JSK69JVGP). The reviewer and the implementer both noted it as out of scope, and the controller did not file it.

**Why.** At 390px the open picker of a Field select (`appearance: base-select`) is about 730px wide and runs past the viewport. This was already true before ui:46. The closed value now fits on one line, but the list it opens does not.

**What to build.** Cap the picker's inline size at the viewport (or at the anchor's available space), and let long options wrap or truncate inside it. Keep the existing `--ui-field-picker-*` tokens: no literal widths, and declare a token if a new value needs one.

**Tests first.** Extend the Field select browser test at 390px: open the picker and assert its bounding box sits inside the viewport.

**Done when.** At 390px and 1440px the open picker stays inside the viewport, the closed state is unchanged, and `bun run check` passes.

## Comments

### @nzila at 2026-10-30 08:15:10 +00:00

Done: Addressed R2 in commit 329da12 (test(field): assert settled picker block bounds). No review notes rejected. Working tree clean.

Only test/browser/field.browser.test.ts changed. The existing 390px and 1440px cases now reconstruct top from the first option and bottom from the last option, including picker padding and borders, and assert all four edges against the viewport. They wait for computed picker translate=none and opacity=1 before measuring, avoiding entry-motion measurements. Closed-state and wrapping assertions remain. No production or proof-scenario changes.

Regression evidence:
- Previous assertions with test-local translateY(2000px): 2 pass, demonstrating R2.
- Strengthened assertions with that mutant: 2 expected failures, bottom 2439.15625/2442 > 900.
- translateY(-2000px): 2 expected failures, top -1102.34375/-711 < 0.
- Both mutants removed: 2 pass. All failures recorded with nzila note before correction.

Verification:
- bun run lint: initially failed for one missing blank line; corrected, rerun passes.
- bun run typecheck: passes.
- bun test src/remix/field/field.test.tsx src/remix/tokens.test.ts test/browser/field.browser.test.ts: 73 pass, 0 fail.
- git diff --check: passes.
- Post-commit bun test test/browser/field.browser.test.ts: 2 pass, 0 fail.

Focused-test discovery: rg -n 'pickerEnter|transition|translate|pickerBox|viewportWidth|paddingTop|ui-field-picker' src/remix/field test/; rg --files test/ | rg 'support|harness'. Read unchanged test/browser/harness.ts; no separate harness tests found. No shared harness rule or production value changed. Loaded lemol:prove; no named scenarios and no scenario changes for this test-only review correction. Full gate left to check stage.

Review: approved (5/5)
Reviewed the whole diff 149a4e0...329da12 (771a874 production + tests, 1e9c6bd, 329da12 test-only). Branch clean, no production change this round.

Earlier findings: R1 (picker chrome in inline bounds) FIXED in 1e9c6bd. R2 (block edges missing) FIXED in 329da12: test/browser/field.browser.test.ts now waits for computed ::picker(select) translate=none and opacity=1, rebuilds top (first option top minus paddingTop/borderTopWidth) and bottom (last option bottom plus paddingBottom/borderBottomWidth), and asserts all four edges against window.innerWidth/innerHeight at 1440 and 390. Nothing new found.

Observed by me: bun test test/browser/field.browser.test.ts -> 2 pass, 0 fail. In a detached scratch copy of HEAD with transform: translateY(2000px) added to &::picker(select): 0 pass, 2 fail ("Expected <= 900, Received 2439.15625" and "2442"). Scratch removed; worktree clean. The settle wait removes the pickerEnter block-axis translate from the measurement.

Task/comments: task file and brief carry 0 comments, no authors. No numbered build items. What to build: cap inline size (field.tsx pickerRules, min(token, calc(100% - gap*2))), wrap long options, token ui-field-picker-max-inline-size defaulting to var(--overlay-max): all done. Done when: open picker inside viewport at 390/1440 pinned by "a chosen value longer than its select stays on one line inside the box at ${width}px" (all four edges); closed state unchanged, pinned by that test's pre-click assertions; unit tests cover cap and wrap declarations. Gate: check.command bun run check (same as Done when) passed at 329da12 (check#3, 751 tests/85 files). Implementer's gap (no full check): discharged by that pass.

Quantities: README "Forty-nine" verified earlier (49 tokens), unchanged this round. Lint: check output 0 warnings, 0 errors. Proof skipped, no scenarios; settled screenshots from review#2 judged fit and the production CSS is unchanged since. No nzila-authored commits, no new modules.

Branch: nzila/01M65TBGEPQ09E3QTM7B75ZKV8

nzila run 01M65TBGEPQ09E3QTM7B75ZKV8
