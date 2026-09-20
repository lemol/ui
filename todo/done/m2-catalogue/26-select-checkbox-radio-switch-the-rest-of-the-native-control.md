---
title: "Select / Checkbox / Radio / Switch: the rest of the native control family"
tags: [ui-remix]
group: M2 — Catalogue
completed_at: 2026-09-20T12:14:02Z
outcome: completed
---
The rest of the native form-control family `Field` deliberately excluded in
M1 (see the doc comment in `src/remix/field/field.tsx`): controls that are not
a bordered box of `--control-h` height.

## Scope

- `src/remix/select/` — wraps `<select>`, following `Field`'s label/hint/error
  id-stem convention. Layer `remix/ui/select` or `remix/ui/combobox/primitives`
  over it only if filtering is needed for the demo; otherwise the bare native
  element is the whole component per the ladder.
- `src/remix/checkbox/`, `src/remix/radio/`, `src/remix/switch/` — each wraps
  its native `<input type="checkbox|radio">`, `Switch` styling a checkbox as a
  track/thumb (CSS only, no ARIA reinvention — it stays a real checkbox).
- Each gets its own `tokens.ts` (`ui-checkbox-*`, `ui-radio-*`,
  `ui-switch-*`, `ui-select-*`) and its own `*.test.tsx` / `*.demo.tsx`.
- Constraint validation (`required`, `aria-invalid`, error message wiring)
  follows `Field`'s existing pattern exactly — read it before writing new
  validation plumbing.
- Register all four in `src/remix/demos.ts`.

## Done when

- All four submit correctly in a plain `<form method="post">` with the
  runtime absent.
- `Switch`'s track/thumb motion uses transition tokens, not literals.
- No component here duplicates `Field`'s id/label/hint/error scaffolding by
  copy-paste — factor the shared bit out if three copies start drifting.

## Comments

### @lemol at 2026-09-20 12:14:02 +00:00

Select needed no new component: Field's control="select" arm already covers it from M1 (confirmed field.tsx's own doc comment, which schedules exactly Checkbox/Radio/Switch for M2, not Select), and the playground's knobs.tsx already uses Field for its selects. Built Checkbox, Radio and Switch instead, sharing a new src/remix/form-control.ts (fieldMessages()) for the id/aria-describedby scaffold. Checkbox/Radio use accent-color to retint the native glyph; Switch draws its own track/thumb since no native input type has one.
