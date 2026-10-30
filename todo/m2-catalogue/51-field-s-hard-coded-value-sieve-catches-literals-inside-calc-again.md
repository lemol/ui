---
title: Field's hard-coded-value sieve catches literals inside calc() again
---
Follow-up from the controller review of ui:49 (loop 01M65TAC220AFXPFHQZDTSGPHN, land 58b4fa3).

**Why.** ui:49 had to let `min(var(--ui-field-picker-max-inline-size), calc(100% - var(--ui-field-picker-gap) * 2))` past `offendersIn` in `src/remix/field/field.test.tsx`, and did it by copying Dialog's final strip, `/min|calc|[()+\-*/\s,%\d]/g`, which removes every digit and every percent sign. Before it, `calc(var(--ui-field-x) * 3 + 50%)` left `350%` and was an offender; now it leaves nothing and passes (run against both regexes). So the test that holds "no component hard-codes a space step" no longer sees a unitless or percent literal in a Field calc(). It also leaves the JSDoc above it false ("What may be left of one is its operators, a negation and a bare zero"), and makes the `\* -1\b|\b0\b` strip on the line before dead.

**What to build.** In `offendersIn`, strip only what the emitted values need: `min`, `100%`, `* 2`, and the existing negation and bare zero, keeping the operators. Update the JSDoc to name what may be left. Field only: Dialog's sieve in `src/remix/dialog/dialog.test.tsx` has the same breadth, but it is out of scope here.

**Tests first.** Assert `offendersIn` flags a Field value with a stray literal, for `calc(var(--ui-field-x) * 3)` and `calc(var(--ui-field-x) + 50%)`, and still clears the picker's `max-inline-size` value. Export nothing: if `offendersIn` cannot be reached with a synthetic value in the file as it stands, add a small local helper or block in the same test file.

**Done when.** Those literals are offenders again, the JSDoc is true, no production file changes, and `bun run check` passes.
