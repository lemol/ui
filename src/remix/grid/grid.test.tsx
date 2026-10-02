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
import type { SpaceStep } from "../space.ts"
import { demoGaps, GridDemo } from "./grid.demo.tsx"
import { type ColumnCount, columnStyles, Grid } from "./grid.tsx"

const counts = Object.keys(columnStyles).map(Number) as ColumnCount[]

/** Derived, not restated: a step the schema gains is a step these loops cover. */
const steps = schema.space.map((name) => Number(name.slice(3)) as SpaceStep)

/** Grid's structural vocabulary: the display keyword and the track lists. */
const keywords = new Set(["grid", ...counts.map((count) => `repeat(${count}, 1fr)`)])

/** Passed to nonPrimitiveValues, which cannot import this from test/. */
const primitives = new Set<string>(primitiveNames)

describe("Grid", () => {
  it("renders a div carrying its children", async () => {
    const html = await renderToHtml(<Grid>content</Grid>)
    expect(html).toContain("<div")
    expect(html).toContain("content")
  })

  it("reads no contract token, only primitives and structural keywords", async () => {
    for (const cols of counts) {
      for (const step of steps) {
        const styles = stylesOf(await renderToHtml(<Grid cols={cols} gap={step} />))
        expect(nonPrimitiveValues(styles, keywords, primitives)).toEqual([])
        expect(styles).not.toContain("--ui-")
      }
    }
  })

  it("emits exactly one gap block, default included", async () => {
    const blocks = styleBlocksOf(await renderToHtml(<Grid />))
    expect(blocks.filter((block) => block.includes("gap:"))).toHaveLength(1)
  })

  it("defaults its gap to sp-0, presuming no spacing", async () => {
    expect(stylesOf(await renderToHtml(<Grid />))).toContain("gap: var(--sp-0)")
  })

  it("takes each step straight from the primitive scale", async () => {
    for (const step of steps) {
      expect(stylesOf(await renderToHtml(<Grid gap={step} />))).toContain(`gap: var(--sp-${step})`)
    }
  })

  it("declares no grid-template-columns until cols is passed", async () => {
    // A bare Grid leaves the track list entirely to the caller, which is what
    // makes mix reliable for the layouts cols cannot express — and cols
    // cannot express a responsive one, by design.
    expect(stylesOf(await renderToHtml(<Grid gap={4} />))).not.toContain("grid-template-columns")
  })

  it("emits an equal track list for each count", async () => {
    for (const cols of counts) {
      expect(stylesOf(await renderToHtml(<Grid cols={cols} />))).toContain(
        `grid-template-columns: repeat(${cols}, 1fr)`,
      )
    }
  })

  it("keeps its own css() blocks property-disjoint across every combination", async () => {
    for (const cols of counts) {
      for (const step of steps) {
        const blocks = styleBlocksOf(await renderToHtml(<Grid cols={cols} gap={step} />))
        expect(sharedProperties(blocks)).toEqual([])
      }
    }
  })

  it("adds through mix a property it does not declare itself", async () => {
    const pinned = css({ position: "fixed" })
    const blocks = styleBlocksOf(await renderToHtml(<Grid mix={pinned} />))
    expect(blocks.filter((block) => block.includes("position: fixed"))).toHaveLength(1)
    expect(blocks.filter((block) => block.includes("position:"))).toHaveLength(1)
  })
})

describe("GridDemo", () => {
  it("renders every value of both axes it demonstrates", async () => {
    // Counts come from columnStyles and gaps from the demo's own sample, so a
    // count added to the Record is covered here instead of being skipped by a
    // loop that keeps passing over the old six.
    const html = await renderToHtml(<GridDemo />)
    for (const cols of counts) expect(html).toContain(`cols ${cols}`)
    for (const gap of demoGaps) expect(html).toContain(`gap ${gap}`)
  })
})
