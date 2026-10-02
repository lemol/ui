import { describe, expect, it } from "bun:test"
import { css } from "remix/component"
import { renderToHtml } from "../../../test/render.ts"
import {
  nonPrimitiveValues,
  sharedProperties,
  styleBlocksOf,
  stylesOf,
} from "../../../test/styles.ts"
import { primitiveNames, schema } from "../../design/index.ts"
import { type Align, alignStyles } from "../align.ts"
import type { SpaceStep } from "../space.ts"
import { demoGaps, StackDemo } from "./stack.demo.tsx"
import { Stack } from "./stack.tsx"

const aligns = Object.keys(alignStyles) as Align[]

/** Derived, not restated: a step the schema gains is a step these loops cover. */
const steps = schema.space.map((name) => Number(name.slice(3)) as SpaceStep)

/** Stack's structural vocabulary. Nothing here is a length or a colour. */
const keywords = new Set(["flex", "column", "start", "center", "end", "baseline", "stretch"])

/** Passed to nonPrimitiveValues, which cannot import this from test/. */
const primitives = new Set<string>(primitiveNames)

describe("Stack", () => {
  it("renders a div carrying its children", async () => {
    const html = await renderToHtml(<Stack>content</Stack>)
    expect(html).toContain("<div")
    expect(html).toContain("content")
  })

  it("reads no contract token, only primitives and structural keywords", async () => {
    // The machine-checkable form of "no tokens of their own". A --ui-* here
    // would mean Stack had quietly grown a contract tier.
    for (const align of aligns) {
      for (const step of steps) {
        const styles = stylesOf(await renderToHtml(<Stack align={align} gap={step} />))
        expect(nonPrimitiveValues(styles, keywords, primitives)).toEqual([])
        expect(styles).not.toContain("--ui-")
      }
    }
  })

  it("emits exactly one gap block, default included", async () => {
    // Two blocks that could both declare gap would put sub-layer order in
    // charge of which one paints, and that order follows render order rather
    // than source order. One block, always, is what makes the default safe.
    const blocks = styleBlocksOf(await renderToHtml(<Stack />))
    expect(blocks.filter((block) => block.includes("gap:"))).toHaveLength(1)
  })

  it("defaults its gap to sp-0, presuming no spacing", async () => {
    expect(stylesOf(await renderToHtml(<Stack />))).toContain("gap: var(--sp-0)")
  })

  it("takes each step straight from the primitive scale", async () => {
    for (const step of steps) {
      expect(stylesOf(await renderToHtml(<Stack gap={step} />))).toContain(`gap: var(--sp-${step})`)
    }
  })

  it("declares no align-items until align is passed", async () => {
    // The half that keeps mix reliable: a block that does not render declares
    // nothing, so a caller's own alignItems has nothing to contend with.
    expect(stylesOf(await renderToHtml(<Stack gap={4} />))).not.toContain("align-items")
  })

  it("emits the alignment a caller asks for", async () => {
    for (const align of aligns) {
      expect(stylesOf(await renderToHtml(<Stack align={align} />))).toContain(
        `align-items: ${align}`,
      )
    }
  })

  it("keeps its own css() blocks property-disjoint across every combination", async () => {
    // Checked over the whole product, not just the default: a default that
    // collides with its own explicit value is precisely the failure the
    // always-render rule prevents, and it only shows up when both are set.
    for (const align of aligns) {
      for (const step of steps) {
        const blocks = styleBlocksOf(await renderToHtml(<Stack align={align} gap={step} />))
        expect(sharedProperties(blocks)).toEqual([])
      }
    }
  })

  it("adds through mix a property it does not declare itself", async () => {
    const pinned = css({ position: "fixed" })
    const blocks = styleBlocksOf(await renderToHtml(<Stack mix={pinned} />))
    expect(blocks.filter((block) => block.includes("position: fixed"))).toHaveLength(1)
    expect(blocks.filter((block) => block.includes("position:"))).toHaveLength(1)
  })
})

describe("StackDemo", () => {
  it("renders every value of both axes it demonstrates", async () => {
    // Both lists come from what the demo renders — alignStyles and its own
    // demoGaps — so an axis value added to either is covered here rather than
    // silently left out of a loop that still passes.
    const html = await renderToHtml(<StackDemo />)
    for (const align of aligns) expect(html).toContain(`align ${align}`)
    for (const gap of demoGaps) expect(html).toContain(`gap ${gap}`)
  })
})
