import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, stylesOf, topLevelPropertiesOf, valuesOf } from "../../../test/styles.ts"
import {
  animation,
  dissolve,
  drawCheck,
  keyframes,
  motionKeywords,
  motionNames,
  pop,
  shake,
  shimmer,
} from "./motion.ts"

const timing = { duration: "var(--ui-probe-duration)", easing: "var(--ui-probe-easing)" }
const factories = { shake, pop, draw: drawCheck, dissolve, shimmer } as const

describe("motion", () => {
  it("names each keyframe ui-motion-* and times it from the tokens it is handed", async () => {
    for (const [name, factory] of Object.entries(factories)) {
      const styles = stylesOf(await renderToHtml(<div mix={factory(timing)} />))

      expect(styles).toContain(`@keyframes ui-motion-${name} {`)
      expect(styles).toContain(
        `animation: ui-motion-${name} var(--ui-probe-duration) var(--ui-probe-easing);`,
      )
    }
  })

  it("takes an iteration count, for a loop such as Skeleton's", async () => {
    const styles = stylesOf(
      await renderToHtml(<div mix={shimmer({ ...timing, iterations: "infinite" })} />),
    )

    expect(styles).toContain(
      "animation: ui-motion-shimmer var(--ui-probe-duration) var(--ui-probe-easing) infinite;",
    )
  })

  it("declares only the animation shorthand, which a zeroed duration completes at once", async () => {
    for (const factory of Object.values(factories)) {
      const blocks = blocksOn(await renderToHtml(<div mix={factory(timing)} />), "div")

      expect(blocks.map(topLevelPropertiesOf)).toEqual([[], ["animation"]])
    }
  })

  it("leans on CSS Animations alone, never @starting-style", async () => {
    for (const factory of Object.values(factories)) {
      expect(stylesOf(await renderToHtml(<div mix={factory(timing)} />))).not.toContain(
        "@starting-style",
      )
    }
  })

  it("ships keyframes alone, for a component that animates inside a state rule", async () => {
    for (const name of motionNames) {
      const [block] = blocksOn(await renderToHtml(<div mix={keyframes[name]} />), "div")

      expect(block).toContain(`@keyframes ui-motion-${name} {`)
      expect(topLevelPropertiesOf(block ?? "")).toEqual([])
    }

    expect(animation("shake", timing)).toBe(
      "ui-motion-shake var(--ui-probe-duration) var(--ui-probe-easing)",
    )
  })

  it("moves by values argued here once, never a token or a duration", async () => {
    // Small em offsets scale with the element's text; 0.6 is a pop's start
    // scale; 0/1 are opacity and dash ends; ±200% is the shimmer sweep.
    for (const name of motionNames) {
      const values = valuesOf(stylesOf(await renderToHtml(<div mix={keyframes[name]} />)))

      expect(values.length).toBeGreaterThan(0)
      expect(values.filter((value) => !motionKeywords.has(value))).toEqual([])
    }
  })
})
