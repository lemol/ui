---
title: SegmentedControl's hard-coded-value sieve decomposes its calc()
---
Found in the close of loop 01M65TAC220AFXPFHQZDTSGPHN, while checking how far ui:52 reaches. ui:52 names Dialog and Switch only; this test has the same gap in a stronger form.

**Why.** `isCleanValue` in `src/remix/segmented-control/segmented-control.test.tsx` (the "reads only its own tokens and structural keywords" test) passes any value that starts with `calc(` and mentions `--ui-segmented-`. So `calc(var(--ui-segmented-x) + 4px)` passes, as does a foreign token beside it, and the test holding "no component hard-codes a space step" sees nothing inside this component's calc().

**What to build.** Decompose the calc() as `offendersIn` in `src/remix/field/field.test.tsx` does: every `var()` in it must be a `--ui-segmented-*` token, then strip only what the emitted value needs and require nothing left. The component emits `calc((100% - var(--ui-segmented-track-pad) * 2) / ${count})` (`segmented-control.tsx:59`), so the allowed literals are `100%`, `* 2` and the `/ <count>` divisor. State what may be left in a doc comment. The bare `^\d+%$` branch for the per-index `translate` stays.

**Tests first.** Assert the sieve flags `calc(var(--ui-segmented-x) + 4px)`, `calc(var(--ui-segmented-x) * 3)` and `calc(var(--ui-segmented-x) + var(--other))`, and still clears the real inline-size value. Move `isCleanValue` out of the test body if the new test needs it.

**Done when.** Those values are offenders, the real value clears, the doc comment is true, no production file changes, and `bun run check` passes.
