---
title: A Field select shows its chosen value on one line with an ellipsis instead of
  wrapping out of its box
tags: [bug]
filed_by: 01M63485MG12R9H42M7SB11W2H
completed_at: 2026-10-29T07:50:25Z
outcome: completed
---
**Why.** In `src/remix/field/field.tsx`, the customizable select's `"& selectedcontent"` rule is `display: flex` with no `min-inline-size: 0`, `white-space: nowrap` or `text-overflow: ellipsis`. A long chosen option wraps to a second line and runs past the select's bottom border at desktop widths. At 390px the box grows taller and the value stays whole.

**What to build.** Keep the chosen value inside the select box on one line, cut with an ellipsis, at every width. The open picker still lists each option in full. Give the full value as a title or an accessible name, so the cut text can still be read.

**Tests first.** A browser test renders a Field select whose chosen option is longer than its box, at 1440px and 390px. It asserts the selectedcontent fits inside the select's border box and is one line high.

**Done when.** No select value spills its box at either width, and the existing Field tests pass.

## Comments

### @nzila at 2026-10-29 07:50:25 +00:00

Done: Every Field select now renders the `<button><selectedcontent>` pair, and the chosen value is cut to one line with an ellipsis inside the select's box. I made the change as one commit, folding plan tasks 1 and 2 (the README edit) together.

**Changes**
- `field.tsx`:
  - `selectedcontent` is now `display:block`, `min-inline-size:0`, `overflow:hidden`, `white-space:nowrap`, `text-overflow:ellipsis`.
  - Its children are `display:inline`, `vertical-align:middle`, with the option-gap token as `margin-inline-end`.
  - The `rich` prop is removed and the pair always renders. The plan found no consumer of `rich`, and the plain select's UA-shadow label can't take an ellipsis.
- `field.demo.tsx`: a "Workspace" select whose chosen option is long, in a 24rem wrapper.
- `field.test.tsx`: one test replaced and one added, plus new keywords in the allow-list.
- `test/browser/field.browser.test.ts` (new): at 1440px and 390px it asserts that the value is cut, sits inside the select's border box and clear of the chevron, is one line high, and has `text-overflow: ellipsis`. It also asserts that the button's accessible name is the full value and that the open option isn't cut. No `title` is needed because the button is named by the full value.
- `src/remix/README.md` updated for the always-present pair.

**Verified** (each run to completion)
- `bun test src/remix/field/field.test.tsx`: 61 pass.
- `bun test test/browser/field.browser.test.ts test/browser/live-form.browser.test.ts`: 4 pass.
- `bun test src/remix/live-form apps/playground/app/ui/dashboard.test.tsx apps/playground/app/router.test.tsx`: 47 pass.
- `bun run lint` and `bun run typecheck`: both clean after `bun run fix`.
- Search: `grep -rnE 'selectedcontent|\brich\b' src test apps docs` shows no `rich` left in `src/`. The only other `rich` hit is unrelated prose in a spec doc.

**Gaps**
- I did not run the new browser test or the new unit tests against base, so a red-first run is unobserved; the plan reported that it ran them against a simulation.
- Firefox is unobserved: the claim that an engine without customizable select drops the pair while parsing rests on the same assumption as before.
- At 390px the open picker is about 730px wide and runs past the viewport. This was already true at base and I left it alone.

Review: approved (4/5)
Approved. The fix does what ui:46 asks. Every Field select now renders `<button><selectedcontent>`, and the `& selectedcontent` rule changes from flex to block + min-inline-size:0 + overflow:hidden + nowrap + ellipsis (field.tsx, `pickerRules`). Its children go inline with `--ui-field-option-gap`. The values are keywords and an existing token, so no literal is added. The check stage's `bun run check` passed on e1d81ba (704 tests, 82 files), and the same command runs again at the land.

**Task cases**
- Tests first, the browser test at 1440 and 390: pinned in test/browser/field.browser.test.ts, "a chosen value longer than its select stays on one line inside the box at ${width}px". It asserts the value fits the border box and is one line high (height ≈ line-height).
  - Red-first, which I ran. In a base scratch worktree with HEAD's test and demo, both widths fail at `expect(layout).not.toBeNull()`, because base renders no selectedcontent without `rich`. With `rich` added to the demo at base, both fail at `expect(layout?.cut).toBe(true)`.
  - Reversals at HEAD, one property each:
    - Dropping `whiteSpace: "nowrap"` fails the test (2 fail).
    - Dropping `textOverflow: "ellipsis"` fails it (2 fail).
    - Dropping `overflow: "hidden"` still passes.
    - Dropping `minInlineSize: "0"` still passes.
    - `display: "flex"` still passes.
  - I screenshotted the two bad modes. With `overflow` dropped the text runs under the chevron. With flex it clips with no ellipsis. The browser test misses both, but the server test "cuts the chosen value to one line with an ellipsis, its icons inline beside it" fails on each (60 pass / 1 fail), so both are pinned. Weakness, not blocking: the browser test's `inside` check measures the selectedcontent box rather than the drawn text, and its `textOverflow` check reads the computed value, which stays "ellipsis" even when no ellipsis is drawn. The plan said the test fails in "three known-bad modes", but that was only predicted against a simulation; on the real page two of the bad modes pass it.
- Done when, no spill at either width: the browser test above, plus my screenshots of HEAD at 1440 and 390. Both show one line with an ellipsis, clear of the chevron, inside the border.
- Done when, the existing Field tests pass: `bun test src/remix/field/field.test.tsx` gives 61 pass. The check stage passed the whole suite.

**What to build**
1. One line with an ellipsis at every width: done (field.tsx `& selectedcontent`; the block, ellipsis and inline-children rules are pinned by the server test).
2. The open picker lists options in full: done. The browser test asserts `:open` and, for the long option, scrollWidth ≤ clientWidth.
3. The full value as a title or an accessible name: done as an accessible name, asserted by `getByRole("button", { name: chosen, exact: true })` with count 1. No `title`, which the task allows ("a title or an accessible name").

**Comments**: the task is inline in todo/TODO.md, filed by 01M63485MG12R9H42M7SB11W2H. It has no Comments section and no pre-start comments: 0 comments.

**Gaps**
- Red-first unobserved: closed. I ran it at base, results above.
- Firefox unobserved: pushed back. The parser drop of the pair is the same assumption base already shipped under `rich`. The change widens it to every select, but in an engine without base-select the select renders only its options. I could not run Firefox here, so this stays an open question rather than a verified claim.
- The open picker is ~730px at 390px: pushed back. It is pre-existing, and the task asks only about the closed value.

**Scope**: removing `rich` is a small unrequested API change. The reason is sound: the plain select's label sits in a UA-shadow box, and the ellipsis needs the pair. To check for consumers, `rg -n '\brich\b' src test apps docs todo .agents scripts` and a search of the workspace's repos turned up only unrelated prose. The base field.tsx holds 3 hits for `\brich\b`, which shows the search works. The README entry is updated. The other `selectedcontent` hits (README:214, the new test, todo/TODO.md) are all live and consistent with the change.

**Lint**: 0 warnings, 0 errors in the check's output.log ("Found 0 warnings and 0 errors."). Base had 0.

**Proof**: skipped (no scenarios). For fit I judged my own screenshots of the Workspace select at 1440 and 390: they are drawn by the Field component, the chevron stays in place, and the box is whole.

Branch: nzila/01M638ARB3YVE5JY1JSK69JVGP

nzila run 01M638ARB3YVE5JY1JSK69JVGP
