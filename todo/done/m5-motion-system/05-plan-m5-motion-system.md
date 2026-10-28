---
title: 'Plan M5: motion system'
tags: [planning]
depends_on: [2]
group: M5 — Motion system
completed_at: 2026-10-28T09:56:09Z
outcome: completed
---
Plan M5: the motion system and polish layer. Depends on M2 (the catalogue), not on M3 or M4. Reference: `docs/motion.md`.

The motion *mechanism* is not here — M1 and M2 ship each overlay component's entry/exit transition as it is built. M5 is the polish layer on top.

## Micro-interaction catalogue

Reviewed [transitions.dev](https://transitions.dev/) as a reference for what is worth having. Take its taxonomy and quality bar, not its CSS — it is a commercial product with a Pro tier.

The items that map onto our catalogue: icon swap, success check, error state shake, number pop-in, notification badge, input clear with dissolve, skeleton loader and reveal, shimmer text, tabs sliding, banner stacking, like/toggle feedback, dropdown menu morph.

Its AI-agent cluster (thinking states, reasoning stream, streaming text, matrix dot loader) is not our need.

## View transitions

Two distinct features with different support. Both are opt-in CSS with no JavaScript, and both fail benignly.

- **Same-document** — covers Remix frame navigation, since a frame response swaps DOM in place. Cross-browser: Chrome 111, Safari 18, Firefox 144.
- **Cross-document** — `@view-transition { navigation: auto; }` for full document loads. Chrome 126+, Safari 18.2+, and **not in stable Firefox**. MDN lists it as limited availability, explicitly not Baseline; several 2026 write-ups claim otherwise and are wrong. No support means an ordinary navigation.

## Shared-element morphs, with minted names

Two visible elements sharing a `view-transition-name` **throw and skip the transition entirely**. In a reusable component library that is a live hazard: render two cards with the same name and the whole page's transition dies.

Same failure class as `commandfor`, so same treatment — names are minted and scoped by the component, never hand-written. Extend the `overlay()` pattern.

## Playground

A motion page, plus a reduced-motion toggle beside the existing no-JS toggle, so both degraded paths are one click away rather than something to remember to check.

## Verify

- Every transition degrades to nothing on an engine without `@starting-style`.
- `prefers-reduced-motion: reduce` zeroes everything through the global reset; no component fights the media query.
- No literal durations or easing curves anywhere — tokens only.

## Comments

### @nzila at 2026-10-28 09:56:09 +00:00

Done: # M5 motion system plan revised (visit 4, review#3)

Addressed all four open findings (F13 through F16) in `docs/superpowers/plans/2026-10-28-ui-remix-motion.md`, committed as `b08f7b7`.

#### Findings addressed

- **F13 (Task D Step 5 commit block):** Restored the missing `git commit -m` line in Task D's Step 5 bash snippet:
  `git add src/remix/copy-button/ src/remix/runtime.ts test/browser/copy-button.browser.test.ts src/remix/motion/no-literals.test.ts && git commit -m "feat(copy-button): confirm check and dissolve...`.
- **F14 (Task G Step 1 test assertions):**
  - Explicitly specified expected assertion: `view-transition-name: views--indicator` via `viewTransitionName("views", "indicator")` (and no `::view-transition` group selector).
  - Corrected pointer to "see the *Group timing* note above".
  - Completed the truncated sentence: "Without `name`: assert the indicator carries no `view-transition-name`."
- **F15 (Task H Step 1 & Step 3):**
  - Restored checklist header `- [ ] **Step 1: Write the failing tests** in src/remix/toaster/toaster.test.tsx.` above the test description.
  - Aligned Step 3 with the F10 decision: "Apply `viewTransitionName(toast.id, "toast")` to the toast shell block (no group timing; timing comes from Task I's document-level rules)."
- **F16 (Task J router test scope):**
  - Clarified in Global Constraints (line 46) and Task J Step 1 that the no-literals regex applies to component styles (`stylesOf()` / `data-rmx-style` blocks only, excluding the emitted `:root` token definitions and the reduced-motion reset) on `/pages/motion`, avoiding false positives on emitted token values.

#### Verification commands run

- `bun fmt --check`: All matched files use the correct format.
- `oxlint`: Found 0 warnings and 0 errors across 253 files.
- `bun run typecheck`: Passed cleanly with zero TypeScript errors.
- `bun test src/remix/tokens.test.ts src/design/css/reset.test.ts`: 16 pass, 0 fail.
- `git status`: Working tree clean, commit `b08f7b7` on branch `nzila/01M60WM25Y3R3AEPNMDQRJNAQM`.

Review: approved (4/5)
Review#4 of b08f7b7. The whole diff from 4e78b1c is one file, docs/superpowers/plans/2026-10-28-ui-remix-motion.md (629 lines by `wc -l`; review#3 counted 626, and +10 -7 since c0acd68 makes 629). It lands in four docs(plan) commits, all inside this planning task's scope.

Gate: the brief's check.command is `bun run check`. check#4 carried the pass from c0acd68 to b08f7b7, and the original run on b9171f0 reported 701 tests across 81 files. Lint: the diff is Markdown only. review#1 read "Found 0 warnings and 0 errors" from the gate log, with the base at 0, and do#4 reports oxlint at 0 warnings / 0 errors. Proof: prove.skipped (no scenarios), so there are no screenshots to judge. Fit is N/A.

Comments: I checked the task file and the brief. `grep -n -i comment todo/m5-motion-system/05-plan-m5-motion-system.md` gives rc=1, and the brief has no pre-start comments. That is 0 comments and no authors.

Tests / Done-when: the task has neither section. Its Verify list was walked in review#3 and still holds: Verify 1 is an accepted pushback, Verify 2 is done, and Verify 3 is done with its scope now fixed (F16). The task has no numbered What-to-build list. The section walk from review#3 is unchanged by this round: 12 catalogue items mapped, with the menu size morph pushed back; same-document VT pushed back with grep evidence; cross-document done in Task I; minted names in Task B; the playground page and reduced-motion toggle in Task J.

Earlier findings, all fixed:
- F13: FIXED. Task D Step 5 now reads `git add ... && git commit -m "feat(copy-button): confirm check and dissolve` followed by the trailer. `grep -c "git commit -m"` gives 11, one per task A–K (11 `### Task` headings).
- F14: FIXED. Task G Step 1 (line 441) asserts `view-transition-name: views--indicator` via `viewTransitionName("views", "indicator")` with no `::view-transition` group selector, and points to the note "above" (the note is at line 438). Line 443 reads "Without `name`: assert the indicator carries no `view-transition-name`."
- F15: FIXED. Task H gains `- [ ] **Step 1: Write the failing tests** in src/remix/toaster/toaster.test.tsx` (line 479). Step 3 now says "(no group timing; timing comes from Task I's document-level rules)". `grep -n view-transition-group` on the plan returns only lines 55, 69, 438, 477, 517 and 520, each either document-level (Task I) or a statement that components must not emit it. No component-level timing instruction remains.
- F16: FIXED, in Global Constraints line 46 and in Task J Step 1's router-test bullet, both scoped to `stylesOf()` / `data-rmx-style` blocks. I checked that the class of inputs holds on real pages, not just in the prose. In a scratch worktree, I ran the plan's regex `/\b\d+(\.\d+)?m?s\b/` plus `cubic-bezier` over `router.fetch` output for `/` and `/pages/dashboard`, both with and without `?motion=reduce`:
  - Component styles (stylesOf; 7166 and 18717 chars, hashed class names included) gave ms-hit null and cb false.
  - The whole-page `<style>` text gave ["80ms","140ms","240ms"].
  So the scoped guard is clean on a correct tree, and the unscoped wording would have failed. ThemeStyle's `<style innerHTML={...emitTokensCss(...)}>` (theme-style.tsx:39) carries no data-rmx-style, so stylesOf excludes the token sheet and the reset by construction. Not tried: `/pages/motion` itself, because that route does not exist until Task J. `/catalogue` returned 404 and proves nothing.

Implementer's stated gaps: none stated beyond verification. The fmt and typecheck runs claim nothing for a Markdown-only diff, which is correct for a #planning task.

Commits: b9171f0 still carries "Claude Opus 5". That was an accepted pushback in review#3 and is closed. c0acd68 and b08f7b7 carry Sonnet 5.5, matching their authoring agent.

Not blocking: none of the plan's predicted test outputs ("Expected: FAIL/PASS") can be observed until the plan runs. They are predictions, and that is fine for a plan.

Score: 4. The plan is now executable and internally consistent, and every review finding is closed.

Branch: nzila/01M60WM25Y3R3AEPNMDQRJNAQM

nzila run 01M60WM25Y3R3AEPNMDQRJNAQM
