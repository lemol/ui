---
title: Dialog's and Switch's hard-coded-value sieves catch literals inside calc()
---
Follow-up from the controller review of ui:51 (loop 01M65TAC220AFXPFHQZDTSGPHN, land d934f9a), which fixed this for Field and left these two out of scope.

**Why.** Two other tests still end their strip on a class holding every digit and percent sign: `offenders` in `src/remix/dialog/dialog.test.tsx` (`/min|calc|[()+\-*/,\s%\d]/g`) and `isCleanValue` in `src/remix/switch/switch.test.tsx` (`/calc|[()+\-*/,\s%\d]/g`). So `calc(var(--ui-dialog-x) * 3 + 50%)` leaves nothing and passes, and the test holding "no component hard-codes a space step" does not see a unitless or percent literal in either component's calc().

**What to build.** In each test, strip only what that component's emitted values need, as `offendersIn` in `src/remix/field/field.test.tsx` now does: drop the digit and `%` from the final class and name the allowed literals in a strip before it. Dialog emits `* 2`, `* -1`, `100%`, a bare zero, and its `env(safe-area-inset-*)`/`dvh` forms; read `src/remix/dialog/dialog.tsx` for the rest. Switch emits `* 2`. State what may be left in each doc comment. `tabs.test.tsx` and `facet-filter.test.tsx` allow only `0` and `1` and stay as they are.

**Tests first.** In each file, assert the sieve flags `calc(var(--ui-<component>-x) * 3)` and `calc(var(--ui-<component>-x) + 50%)` and still clears the component's real calc() values.

**Done when.** Those literals are offenders in both tests, each doc comment is true, no production file changes, and `bun run check` passes.
