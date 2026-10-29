---
title: Field's search-clear dissolve moves nothing
group: M5 — Motion system
---
Follow-up from the controller review of ui:44 (loop 01M6389J86R6C07DQ3RW0D09V4, slice motion-core, f4a4436).

**Why.** Plan Task C, Step 3 asks for the search cancel button styled with "`opacity` + `transition: opacity <tokens>`". `searchClear` in `src/remix/field/field.tsx` declares only the `transition`; no rule ever changes the pseudo-element's `opacity`. The UA shows and hides `::-webkit-search-cancel-button` by value, not by opacity, so the transition has nothing to animate and the clear button still appears and vanishes instantly. The playground's *Search* section on `/pages/motion` demonstrates a dissolve that does not happen. The Field test only checks the transition declaration, so it passes either way.

**What to build.** Give the cancel button a resting and a shown opacity the transition can run between, keyed off a state the input really has — e.g. `opacity: 0` on `:placeholder-shown`, `1` otherwise (a search Field then needs a `placeholder`, even `" "`, or pick another selector and argue it). Keep it in its own block on `--ui-field-clear-*` tokens; an engine without the vendor pseudo drops the rule whole, as now.

**Tests first.** Extend the Field search test to assert both opacity states, not just the transition. Check it in Chromium on `/pages/motion` (type, then clear) — a browser test only if the state needs runtime code, which it should not.

**Done when.** The clear button fades in Chromium and Safari, reduced motion makes it instant, and `bun run check` passes.
