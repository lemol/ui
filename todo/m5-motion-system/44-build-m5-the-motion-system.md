---
title: 'Build M5: the motion system'
depends_on: [5]
group: M5 — Motion system
---
Execute [the M5 plan](../../docs/superpowers/plans/2026-10-28-ui-remix-motion.md), Tasks A–K in order, one commit per task as the plan writes them. The plan landed as ui:05 (7569b82) after four review rounds; nothing filed its execution, so the milestone had no build task.

**Why.** ui:05 was a planning task: it delivered the plan document and no code. M5 stays empty in `todo/TODO.md` until someone runs the plan.

**What to build.** Exactly what the plan's File Structure table lists: the shared keyframe mixins and the minted `viewTransitionName` factory under `src/remix/motion/`, the twelve micro-interactions on their components (C–H), the opt-in cross-document view-transition CSS (I), the `/pages/motion` playground page with its reduced-motion toggle (J), and the documents (K).

**Tests first.** Each plan task opens with its failing tests; keep that order. `src/remix/motion/no-literals.test.ts` (Task A, extended by C–H) is the guard for "tokens only".

**Done when.** Every plan step is checked off, `bun run check` passes, and the plan's three Verify items hold on the rendered tree: no `@starting-style` dependence for keyframe motion, reduced motion zeroes everything through the reset, and no literal durations or curves in component styles.

**Out of scope.** A same-document view-transition caller: `remix` 3.1.0 ships none (see the plan's Load-bearing findings). Live Tabs morphing, for the same reason.
