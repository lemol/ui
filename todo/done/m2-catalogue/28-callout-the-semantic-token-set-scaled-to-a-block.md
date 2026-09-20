---
title: "Callout: the semantic token set, scaled to a block"
tags: [ui-remix]
group: M2 — Catalogue
completed_at: 2026-09-20T15:59:28Z
outcome: completed
---
Static, no interactivity — the semantic token set again, `Badge`'s pattern
scaled up to a block instead of a pill.

## Scope

- `src/remix/callout/` — `callout.tsx` (title, description, optional
  icon slot, optional action), `tokens.ts` following Badge's `<tone>` on
  `<tone>-subtle` contrast pair, `callout.test.tsx`, `callout.demo.tsx`.
- Tones: `neutral` (default), `success`, `warning`, `danger`, `info` — same
  five as `Badge`, reusing the semantic primitives rather than inventing new
  ones.
- Register in `src/remix/demos.ts`.

## Done when

- Every tone renders with the `<tone>` on `<tone>-subtle` pair, matching
  `docs/design-system.md`'s contrast promise.
- No raw colour literal in `tokens.ts` — everything defaults relationally to
  a primitive.
