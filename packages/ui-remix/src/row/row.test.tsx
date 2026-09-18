import { describe, expect, it } from "bun:test"
import { primitiveNames, schema } from "@lemol/ui-design"
import { css } from "remix/ui"
import { renderToHtml } from "../../../../test/render.ts"
import {
  nonPrimitiveValues,
  sharedProperties,
  styleBlocksOf,
  stylesOf,
} from "../../../../test/styles.ts"
import { type Align, alignStyles } from "../align.ts"
import type { SpaceStep } from "../space.ts"
import { demoGaps, RowDemo } from "./row.demo.tsx"
import { type Justify, justifyStyles, Row } from "./row.tsx"

const aligns = Object.keys(alignStyles) as Align[]
const justifies = Object.keys(justifyStyles) as Justify[]

/** Derived, not restated: a step the schema gains is a step these loops cover. */
const steps = schema.space.map((name) => Number(name.slice(3)) as SpaceStep)

/** Row's structural vocabulary. Nothing here is a length or a colour. */
const keywords = new Set([
  "flex",
  "start",
  "center",
  "end",
  "baseline",
  "stretch",
  "space-between",
  "space-around",
  "space-evenly",
  "wrap",
])

/** Passed to nonPrimitiveValues, which cannot import this from test/. */
const primitives = new Set<string>(primitiveNames)

describe("Row", () => {
  it("renders a div carrying its children", async () => {
    const html = await renderToHtml(<Row>content</Row>)
    expect(html).toContain("<div")
    expect(html).toContain("content")
  })

  it("reads no contract token, only primitives and structural keywords", async () => {
    for (const align of aligns) {
      for (const justify of justifies) {
        for (const step of steps) {
          const styles = stylesOf(
            await renderToHtml(<Row align={align} gap={step} justify={justify} wrap />),
          )
          expect(nonPrimitiveValues(styles, keywords, primitives)).toEqual([])
          expect(styles).not.toContain("--ui-")
        }
      }
    }
  })

  it("emits exactly one gap block and one align block, defaults included", async () => {
    const blocks = styleBlocksOf(await renderToHtml(<Row />))
    expect(blocks.filter((block) => block.includes("gap:"))).toHaveLength(1)
    expect(blocks.filter((block) => block.includes("align-items:"))).toHaveLength(1)
  })

  it("centres by default, because stretched items of unequal height is the bug", async () => {
    expect(stylesOf(await renderToHtml(<Row />))).toContain("align-items: center")
  })

  it("defaults its gap to sp-0, presuming no spacing", async () => {
    expect(stylesOf(await renderToHtml(<Row />))).toContain("gap: var(--sp-0)")
  })

  it("takes each step straight from the primitive scale", async () => {
    for (const step of steps) {
      expect(stylesOf(await renderToHtml(<Row gap={step} />))).toContain(`gap: var(--sp-${step})`)
    }
  })

  it("emits the alignment a caller asks for", async () => {
    for (const align of aligns) {
      expect(stylesOf(await renderToHtml(<Row align={align} />))).toContain(`align-items: ${align}`)
    }
  })

  it("declares neither justify-content nor flex-wrap until asked", async () => {
    const styles = stylesOf(await renderToHtml(<Row gap={4} />))
    expect(styles).not.toContain("justify-content")
    expect(styles).not.toContain("flex-wrap")
  })

  it("maps its justify names onto the CSS keywords", async () => {
    const expected: Record<Justify, string> = {
      start: "start",
      center: "center",
      end: "end",
      between: "space-between",
      around: "space-around",
      evenly: "space-evenly",
    }
    for (const justify of justifies) {
      expect(stylesOf(await renderToHtml(<Row justify={justify} />))).toContain(
        `justify-content: ${expected[justify]}`,
      )
    }
  })

  it("wraps only when told to", async () => {
    expect(stylesOf(await renderToHtml(<Row wrap />))).toContain("flex-wrap: wrap")
    expect(stylesOf(await renderToHtml(<Row wrap={false} />))).not.toContain("flex-wrap")
  })

  it("keeps its own css() blocks property-disjoint across every combination", async () => {
    for (const align of aligns) {
      for (const justify of justifies) {
        for (const step of steps) {
          const blocks = styleBlocksOf(
            await renderToHtml(<Row align={align} gap={step} justify={justify} wrap />),
          )
          expect(sharedProperties(blocks)).toEqual([])
        }
      }
    }
  })

  it("adds through mix a property it does not declare itself", async () => {
    const pinned = css({ position: "fixed" })
    const blocks = styleBlocksOf(await renderToHtml(<Row mix={pinned} />))
    expect(blocks.filter((block) => block.includes("position: fixed"))).toHaveLength(1)
    expect(blocks.filter((block) => block.includes("position:"))).toHaveLength(1)
  })
})

describe("RowDemo", () => {
  it("renders every value of every axis it demonstrates", async () => {
    // The demo shows four axes, so all four are checked. Each list comes from
    // the Record the component itself keys off, or from the demo's own gap
    // sample, so a value added to any of them cannot slip past a loop that
    // covers the old set and still passes.
    const html = await renderToHtml(<RowDemo />)
    for (const justify of justifies) expect(html).toContain(`justify ${justify}`)
    for (const align of aligns) expect(html).toContain(`align ${align}`)
    for (const gap of demoGaps) expect(html).toContain(`gap ${gap}`)
    // wrap is a boolean, so its one value is checked by the CSS it produces
    // rather than by a label, which a Row that forgot the prop would still
    // print.
    expect(stylesOf(html)).toContain("flex-wrap: wrap")
  })
})
