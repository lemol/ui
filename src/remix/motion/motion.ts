import { type CSSMixinDescriptor } from "remix/component"
import { css } from "../css.ts"

/**
 * The shared keyframes. A `@keyframes` name is global, so two components
 * cannot each own `shake` — but one definition is safe to share, because a
 * keyframe body names no token: *how long* and *how* is the component's own
 * `animation` shorthand, built from its own duration and easing tokens.
 * Reduced motion zeroes those tokens through the reset, and a zero-duration
 * animation completes at once, so nothing here needs its own media query.
 */
export const motionNames = ["shake", "pop", "draw", "dissolve", "shimmer"] as const

export type MotionName = (typeof motionNames)[number]

/** What a component hands the factory: its own tokens, as `var()` strings. */
export interface MotionTiming {
  readonly duration: string
  readonly easing: string
  readonly iterations?: string | undefined
}

/** `[keyframes, animation]`: mix both, or mix the keyframes and place `animation` in a state rule. */
export type Motion = readonly [keyframes: CSSMixinDescriptor, animation: CSSMixinDescriptor]

/**
 * Every value a keyframe body uses, argued once. Small em offsets scale with
 * the element's text; 0.6 is a pop's start scale; 0 and 1 are opacity and
 * dash ends; ±200% is the shimmer sweep. A component's contract test admits
 * these, so a literal duration or colour still fails it.
 */
export const motionKeywords: ReadonlySet<string> = new Set([
  "0",
  "1",
  "0.6",
  "-0.25em 0",
  "0.25em 0",
  "-0.125em 0",
  "0 0.25em",
  "200% 0",
  "-200% 0",
])

// A keyframes-only block: `@keyframes` hoists only at a block's top level, so
// a state-gated animation mixes this and puts `animation` in its own rule.
export const keyframes: Readonly<Record<MotionName, CSSMixinDescriptor>> = {
  shake: css({
    "@keyframes ui-motion-shake": {
      "0%, 100%": { translate: "0" },
      "25%": { translate: "-0.25em 0" },
      "50%": { translate: "0.25em 0" },
      "75%": { translate: "-0.125em 0" },
    },
  }),
  pop: css({
    "@keyframes ui-motion-pop": {
      from: { scale: "0.6", opacity: "0" },
      to: { scale: "1", opacity: "1" },
    },
  }),
  draw: css({
    "@keyframes ui-motion-draw": {
      from: { strokeDashoffset: "1" },
      to: { strokeDashoffset: "0" },
    },
  }),
  dissolve: css({
    "@keyframes ui-motion-dissolve": {
      from: { opacity: "0", translate: "0 0.25em" },
      to: { opacity: "1", translate: "0" },
    },
  }),
  shimmer: css({
    "@keyframes ui-motion-shimmer": {
      "0%": { backgroundPosition: "200% 0" },
      "100%": { backgroundPosition: "-200% 0" },
    },
  }),
}

/** The `animation` shorthand value for a shared keyframe, timed by the caller's tokens. */
export function animation(name: MotionName, timing: MotionTiming): string {
  const base = `ui-motion-${name} ${timing.duration} ${timing.easing}`

  return timing.iterations === undefined ? base : `${base} ${timing.iterations}`
}

const motion = (name: MotionName, timing: MotionTiming): Motion => [
  keyframes[name],
  css({ animation: animation(name, timing) }),
]

export const shake = (timing: MotionTiming): Motion => motion("shake", timing)
export const pop = (timing: MotionTiming): Motion => motion("pop", timing)
export const drawCheck = (timing: MotionTiming): Motion => motion("draw", timing)
export const dissolve = (timing: MotionTiming): Motion => motion("dissolve", timing)
export const shimmer = (timing: MotionTiming): Motion => motion("shimmer", timing)
