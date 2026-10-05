import { describe, expect, it } from "bun:test"
import { css } from "remix/component"
import { renderToHtml } from "../../../test/render.ts"
import {
  markupOf,
  sharedProperties,
  styleBlocksOf,
  stylesOf,
  valuesOf,
} from "../../../test/styles.ts"
import { resetCss } from "../../design/css/index.ts"
import { type HeadingLevel, headingScale } from "../../design/index.ts"
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

  it("gives every level the size token headingScale names for it", () => {
    // Tautological given today's derivation — sizeTokens in tokens.ts is built
    // by Object.fromEntries over headingScale, so a level cannot be missing —
    // but it starts working the day that derivation is replaced by a literal
    // record, which is why it asserts the value and not just the key's presence.
    for (const level of levels) {
      expect(headingTokens[`ui-heading-${level}-size`]).toBe(`var(--${headingScale[level]})`)
    }
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

  it("renders an id, so something can point at it", async () => {
    // Dialog's aria-labelledby names the title. The alternative — an
    // aria-label repeating the title string — names the dialog twice and
    // drifts the first time one copy is edited.
    const markup = markupOf(
      await renderToHtml(
        <Heading id="new-task-title" level={2}>
          New task
        </Heading>,
      ),
    )

    expect(markup).toContain('id="new-task-title"')
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
    expect(blocks.filter((block) => block.includes("position:"))).toHaveLength(1)
  })

  it("gives a wrapped heading the same weight, tracking and leading as a bare one", () => {
    // font-size derives from headingScale on both sides, which is prevention:
    // one map, so a level cannot drift. weight, tracking and leading cannot be
    // derived the same way — the reset rule is a grouped selector list, not
    // data — so this test is detection standing in for the prevention that
    // isn't available here.
    for (const [token, property] of [
      ["ui-heading-weight", "font-weight"],
      ["ui-heading-tracking", "letter-spacing"],
      ["ui-heading-leading", "line-height"],
    ] as const) {
      expect(resetCss).toContain(`${property}: ${headingTokens[token]}`)
    }
  })
})

describe("HeadingDemo", () => {
  it("renders every level it demonstrates", async () => {
    const html = await renderToHtml(<HeadingDemo />)

    for (const level of demoLevels) expect(html).toContain(`<h${level}`)
  })
})
