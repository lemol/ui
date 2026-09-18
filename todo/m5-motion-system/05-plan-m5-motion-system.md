---
title: 'Plan M5: motion system'
tags: [planning]
depends_on: [2]
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
