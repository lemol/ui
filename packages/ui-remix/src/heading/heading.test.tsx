import { describe, expect, it } from "bun:test"
import { type HeadingLevel, headingScale } from "@lemol/ui-design"
import { css } from "remix/ui"
import { renderToHtml } from "../../../../test/render.ts"
import { sharedProperties, styleBlocksOf, stylesOf, valuesOf } from "../../../../test/styles.ts"
import { demoLevels, HeadingDemo } from "./heading.demo.tsx"
import { Heading } from "./heading.tsx"
import { headingTokens } from "./tokens.ts"

/** Derived, not restated: a level the scale gains is a level these loops cover. */
const levels = Object.keys(headingScale).map(Number) as HeadingLevel[]

describe("Heading", () => {
  it("renders the element its level names, carrying its children", async () => {
    for (const level of levels) {
      const html = await renderToHtml(<Heading level={level}>Title</Heading>)
      expect(html).toContain(`<h${level}`)
      expect(html).toContain("Title")
    }
  })

  it("reads only its own tokens", async () => {
    // The machine-checkable form of "no component hard-codes a colour, radius,
    // duration or space step" — the same assertion button.test.tsx makes, and
    // the reason a primitive cannot leak into this tier.
    for (const level of levels) {
      const styles = stylesOf(await renderToHtml(<Heading level={level}>Title</Heading>))
      const offenders = valuesOf(styles).filter(
        (value) => !/^var\(--ui-heading-[\w-]+\)$/.test(value),
      )
      expect(offenders).toEqual([])
    }
  })

  it("declares a token for every size it reads", async () => {
    // heading.tsx composes the size token name from a number, so this is what
    // stops a level from reading a name the record does not hold.
    const missing = levels.filter((level) => !(`ui-heading-${level}-size` in headingTokens))
    expect(missing).toEqual([])
  })

  it("emits exactly one font-size block, default included", async () => {
    // Two blocks that could both declare font-size would hand sub-layer order
    // the decision, and that order follows render order, not source order.
    const blocks = styleBlocksOf(await renderToHtml(<Heading level={2}>Title</Heading>))
    expect(blocks.filter((block) => block.includes("font-size:"))).toHaveLength(1)
  })

  it("sizes a heading from its level by default", async () => {
    for (const level of levels) {
      const styles = stylesOf(await renderToHtml(<Heading level={level}>Title</Heading>))
      expect(styles).toContain(`font-size: var(--ui-heading-${level}-size)`)
    }
  })

  it("keeps the outline when size and level disagree", async () => {
    // The whole reason this component is more than a tag switch: a card title
    // must be an h3 for the document outline and may need to look like an h5.
    const html = await renderToHtml(
      <Heading level={2} size={5}>
        Title
      </Heading>,
    )
    expect(html).toContain("<h2")
    expect(stylesOf(html)).toContain("font-size: var(--ui-heading-5-size)")
    expect(stylesOf(html)).not.toContain("var(--ui-heading-2-size)")
  })

  it("keeps its own css() blocks property-disjoint across every combination", async () => {
    for (const level of levels) {
      for (const size of levels) {
        const blocks = styleBlocksOf(
          await renderToHtml(
            <Heading level={level} size={size}>
              Title
            </Heading>,
          ),
        )
        expect(sharedProperties(blocks)).toEqual([])
      }
    }
  })

  it("adds through mix a property it does not declare itself", async () => {
    const pinned = css({ position: "fixed" })
    const blocks = styleBlocksOf(
      await renderToHtml(
        <Heading level={1} mix={pinned}>
          Title
        </Heading>,
      ),
    )
    expect(blocks.filter((block) => block.includes("position: fixed"))).toHaveLength(1)
  })
})

describe("HeadingDemo", () => {
  it("renders every level it demonstrates", async () => {
    const html = await renderToHtml(<HeadingDemo />)
    for (const level of demoLevels) expect(html).toContain(`<h${level}`)
  })
})
