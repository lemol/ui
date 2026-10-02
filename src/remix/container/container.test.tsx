import { describe, expect, it } from "bun:test"
import { css } from "remix/component"
import { renderToHtml } from "../../../test/render.ts"
import {
  nonPrimitiveValues,
  sharedProperties,
  styleBlocksOf,
  stylesOf,
} from "../../../test/styles.ts"
import { primitiveNames } from "../../design/index.ts"
import { ContainerDemo } from "./container.demo.tsx"
import { Container } from "./container.tsx"

/** Container's whole structural vocabulary. */
const keywords = new Set(["auto"])

/** Passed to nonPrimitiveValues, which cannot import this from test/. */
const primitives = new Set<string>(primitiveNames)

describe("Container", () => {
  it("renders a div carrying its children", async () => {
    const html = await renderToHtml(<Container>content</Container>)
    expect(html).toContain("<div")
    expect(html).toContain("content")
  })

  it("reads no contract token, only primitives and structural keywords", async () => {
    const styles = stylesOf(await renderToHtml(<Container />))
    expect(nonPrimitiveValues(styles, keywords, primitives)).toEqual([])
    expect(styles).not.toContain("--ui-")
  })

  it("takes its width and gutter from the sizing primitives", async () => {
    // These two exist in schema.sizing for this component specifically. If
    // either is renamed, this is what says so.
    const styles = stylesOf(await renderToHtml(<Container />))
    expect(styles).toContain("max-inline-size: var(--page-max)")
    expect(styles).toContain("padding-inline: var(--gutter)")
  })

  it("centres itself", async () => {
    expect(stylesOf(await renderToHtml(<Container />))).toContain("margin-inline: auto")
  })

  it("owns no block spacing, leaving that to what it contains", async () => {
    // Container's job is the inline axis. Block rhythm belongs to the Stack
    // inside it, which is the component that knows what it is stacking.
    const styles = stylesOf(await renderToHtml(<Container />))
    expect(styles).not.toContain("padding-block")
    expect(styles).not.toContain("margin-block")
  })

  it("renders a single block, so there is no order to get wrong", async () => {
    // The disjointness check is the invariant the other three components need,
    // and on its own it cannot fail here: one block has no second block to
    // collide with, and sharedProperties de-dupes within a block. The count is
    // what states Container's actual position — it declares everything in one
    // place — and it is what breaks the day a second block appears, at which
    // point the disjointness assertion below starts doing real work.
    const blocks = styleBlocksOf(await renderToHtml(<Container />))
    expect(blocks).toHaveLength(1)
    expect(sharedProperties(blocks)).toEqual([])
  })

  it("adds through mix a property it does not declare itself", async () => {
    const pinned = css({ position: "fixed" })
    const blocks = styleBlocksOf(await renderToHtml(<Container mix={pinned} />))
    expect(blocks.filter((block) => block.includes("position: fixed"))).toHaveLength(1)
    expect(blocks.filter((block) => block.includes("position:"))).toHaveLength(1)
  })
})

describe("ContainerDemo", () => {
  it("frames the container in a full-bleed band, so the measure is visible", async () => {
    // Asserting on "page-max" alone would be vacuous: Container's own CSS
    // emits var(--page-max) into the same document, so that string is there
    // whatever the demo renders. These two come from the demo and nowhere
    // else — the band is the whole point of it, since a Container with no
    // full-width context behind it looks like a plain div.
    const html = await renderToHtml(<ContainerDemo />)
    expect(html).toContain("gutter padded, centred")
    expect(stylesOf(html)).toContain("border-block: 1px solid var(--hairline)")
  })
})
