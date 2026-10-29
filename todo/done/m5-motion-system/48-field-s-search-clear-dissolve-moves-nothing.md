---
title: Field's search-clear dissolve moves nothing
group: M5 — Motion system
completed_at: 2026-10-29T09:04:42Z
outcome: completed
---
Follow-up from the controller review of ui:44 (loop 01M6389J86R6C07DQ3RW0D09V4, slice motion-core, f4a4436).

**Why.** Plan Task C, Step 3 asks for the search cancel button styled with "`opacity` + `transition: opacity <tokens>`". `searchClear` in `src/remix/field/field.tsx` declares only the `transition`; no rule ever changes the pseudo-element's `opacity`. The UA shows and hides `::-webkit-search-cancel-button` by value, not by opacity, so the transition has nothing to animate and the clear button still appears and vanishes instantly. The playground's *Search* section on `/pages/motion` demonstrates a dissolve that does not happen. The Field test only checks the transition declaration, so it passes either way.

**What to build.** Give the cancel button a resting and a shown opacity the transition can run between, keyed off a state the input really has — e.g. `opacity: 0` on `:placeholder-shown`, `1` otherwise (a search Field then needs a `placeholder`, even `" "`, or pick another selector and argue it). Keep it in its own block on `--ui-field-clear-*` tokens; an engine without the vendor pseudo drops the rule whole, as now.

**Tests first.** Extend the Field search test to assert both opacity states, not just the transition. Check it in Chromium on `/pages/motion` (type, then clear) — a browser test only if the state needs runtime code, which it should not.

**Done when.** The clear button fades in Chromium and Safari, reduced motion makes it instant, and `bun run check` passes.

## Comments

### @nzila at 2026-10-29 09:04:42 +00:00

Done: Implemented plan Task 1, test-first.
- Tests: extended the Field search test (asserts `opacity: 1` + transition on `&::-webkit-search-cancel-button`, `opacity: 0` on `&:placeholder-shown::-webkit-search-cancel-button`, `placeholder=" "` rendered) and added a test that a caller's placeholder wins and other types get none. Watched it fail on base (`opacity: 1;` missing).
- Code: `searchClear` in src/remix/field/field.tsx gains the two opacity states in the same block; search `<input>` defaults `placeholder=" "`; JSDoc records the engine limit (WebKit drops the button instantly on clear). Playground Search note reworded (Chrome fades both ways, Safari fades in, Firefox none).
- Verified: `bun run lint` and `bun run typecheck` clean; `bun test src/remix/field src/remix/motion/no-literals.test.tsx apps/playground/app/router.test.tsx apps/playground/app/ui/home.test.tsx` → 116 pass, 0 fail. Search for changed values followed the plan's grep (search-cancel / type="search" / motion-search / pages/motion). Did not run `bun run check`.
- Commit: fix(field): give the search clear button opacities its dissolve can run between.

Review: approved (4/5)
Approved. The diff from base 6359d3c is 653ab08 alone: 3 files, +38/−13 (field.tsx, field.test.tsx, playground motion.tsx).

What to build: done.
- Resting and shown opacity: `searchClear` in src/remix/field/field.tsx now has `opacity: 1` beside the transition, plus `"&:placeholder-shown::-webkit-search-cancel-button": { opacity: 0 }`. Both sit in the same css() block and use the `--ui-field-clear-*` tokens (`clearTiming`, field.tsx:250). The block is vendor-only, so an engine without the pseudo-element drops it whole, as before.
- The placeholder the selector needs: field.tsx:605 is `placeholder={props.placeholder ?? (props.type === "search" ? " " : undefined)}`. The textarea arm (field.tsx:544) is untouched. The task allowed this choice, and the JSDoc and the plan argue `:placeholder-shown` over the alternatives.

Tests first:
- "dissolves a search field's clear button on its own tokens, and only on a search field" (field.test.tsx) asserts `opacity: 1;` and the transition on the shown rule, `opacity: 0;` on the `:placeholder-shown` rule, and `placeholder=" "` in the markup.
- New test "keeps a search field's own placeholder, and gives no other field one".
- I checked that each assertion can fail by mutating a scratch worktree at HEAD and running `bun test src/remix/field` (64 tests at HEAD, all passing):
  - Removing the opacity:0 rule, removing opacity:1, or dropping the default placeholder each fails the first test (63 pass, 1 fail).
  - Forcing " " on every search field, which overrides the caller's "Search docs", fails the second test.
  - Forcing " " on every type also fails the second test.
- No browser test was added, which is correct: the state is pure CSS.

Done when:
- Fade in Chromium and Safari, and instant under reduced motion. I verified these myself with a Playwright probe that renders the real `<Field type="search">` from field.tsx via test/render.ts, with `--ui-field-clear-duration` set to 600ms or 0ms. The numbers are PNG byte sizes of the clear-button region, used as a proxy for how much of the button is drawn:
  \```
  chromium field-600ms    show:[785 1015 1103 1191 1221] hide:[1181 1142 1053 956 629]
  chromium field-0ms      show:[1221 x5]                 hide:[277 x5]
  webkit   field-600ms    show:[973 1258 1344 1422 1493] hide:[314 x5]
  webkit   field-0ms      show:[1515 x5]                 hide:[314 x5]
  webkit   field-ph-empty show:[869 1179 1308 1415 1479] (caller placeholder="")
  \```
  - Chromium fades both ways; WebKit fades in and drops instantly on clear; 0ms is instant in both.
  - Reduced motion comes through the token default `var(--dur-fast)` (tokens.ts:60), which the reset's reduced-motion block zeroes. The 0ms run stands in for that; I did not toggle the media query itself.
- `bun run check`: the check stage ran `check.command` = `bun run check` on 653ab08 and it passed: "Ran 749 tests across 85 files". The land gate runs it again.
- Linter: the check output.log reads "Found 0 warnings and 0 errors." (0 warnings, no class). `bun run lint` is clean in the worktree; the base also passed the gate.

Implementer's stated gaps:
1. Probes not re-run after the change: closed by me with the real-Field probe above.
2. Safari's fade-out on clear: pushed back, and it does not block. The Done-when asks for "fades in Chromium and Safari", which both do. The probe confirms WebKit's exit is instant even with the shipped CSS, and the JSDoc and the playground note now say so honestly instead of claiming a dissolve.

Task comments: I read todo/m5-motion-system/48-field-s-search-clear-dissolve-moves-nothing.md. It has 0 comments, so there are no authors, and the brief has no pre-start comments.

Stale text: I grepped `dissolves in and out` across apps, src, docs, test, todo and .agents. The only hit was the line this diff replaced, and nothing else pins it. src/remix/README.md:229 ("the search clear button's opacity dissolve (`ui-field-clear-*`)") is still accurate and live. docs/superpowers/plans/2026-10-28-ui-remix-motion.md is a dated record.

Rules: the change follows them. It uses tokens rather than literals (0 and 1 are structural values), adds no runtime code and no node:* imports, and gets formatting and blank-line style right (oxlint clean).

Non-blocking notes:
- A search Field now renders `placeholder=" "` by default. That is documented in the searchClear JSDoc but not in the Field section of src/remix/README.md.
- The two tests sit under `describe("Field, as a select")`, a placement inherited from the base.
- A caller passing `placeholder=""` keeps it, because `??` passes the empty string through. The WebKit probe still shows a fade-in in that case, so I let it be.
- No proof scenarios exist (prove skipped), so I judged no screenshots. I checked behaviour with the probe instead of in the playground UI.

Branch: nzila/01M63DK1V6T78NWEDFV907HT0K

nzila run 01M63DK1V6T78NWEDFV907HT0K
