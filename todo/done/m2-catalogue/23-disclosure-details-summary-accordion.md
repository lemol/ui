---
title: "Disclosure: details/summary, accordion"
tags: [ui-remix]
group: M2 — Catalogue
completed_at: 2026-09-20T08:42:23Z
outcome: completed
---
Pure native: `<details>` / `<summary>`, zero client JS even for the
accordion case.

## Scope

- `src/remix/disclosure/` — `disclosure.tsx` (`Disclosure`, and `Accordion`
  as a thin wrapper generating a shared `name` attribute for its children so
  only one stays open at a time — the platform's own mutual-exclusion, no JS),
  `tokens.ts`, `disclosure.test.tsx`, `disclosure.demo.tsx`.
- `ui-disclosure-*` tokens: summary padding, marker/chevron, hover surface,
  content padding, border.
- Motion: the marker rotation and content reveal use `@starting-style` +
  `allow-discrete` where `<details>` supports it, duration/easing tokens.
  Where the platform doesn't support animating `<details>` open state
  cross-browser yet, degrade to an instant toggle — note this explicitly in
  the component's doc comment rather than fighting the platform.
- Register in `src/remix/demos.ts`.

## Done when

- `/c/disclosure` opens, closes and (for `Accordion`) mutually excludes with
  the runtime absent.
- No `ui-disclosure-*` value is a raw colour, radius or space literal.
