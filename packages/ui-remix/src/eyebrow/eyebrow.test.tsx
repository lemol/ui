import { describe, expect, it } from "bun:test"
import { css } from "remix/ui"
import { renderToHtml } from "../../../../test/render.ts"
import { sharedProperties, styleBlocksOf, stylesOf, valuesOf } from "../../../../test/styles.ts"
import { EyebrowDemo } from "./eyebrow.demo.tsx"
import { Eyebrow } from "./eyebrow.tsx"
import { eyebrowTokens } from "./tokens.ts"

describe("Eyebrow", () => {
  it("renders a p carrying its children", async () => {
    const html = await renderToHtml(<Eyebrow>Case study</Eyebrow>)
    expect(html).toContain("<p")
    expect(html).toContain("Case study")
  })

  it("reads only its own tokens", async () => {
    const styles = stylesOf(await renderToHtml(<Eyebrow>Case study</Eyebrow>))
    const offenders = valuesOf(styles).filter(
      (value) => !/^var\(--ui-eyebrow-[\w-]+\)$/.test(value),
    )
    expect(offenders).toEqual([])
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    // A token nothing reads is dead weight a skin will set and watch do
    // nothing; a read with no token is a var() that resolves to nothing.
    const styles = stylesOf(await renderToHtml(<Eyebrow>Case study</Eyebrow>))
    const read = new Set(
      [...styles.matchAll(/var\(--(ui-eyebrow-[\w-]+)\)/g)].map((match) => match[1] ?? ""),
    )
    expect([...read].sort()).toEqual(Object.keys(eyebrowTokens).sort())
  })

  it("puts the case change on a token, so a brand can turn it off", async () => {
    expect(stylesOf(await renderToHtml(<Eyebrow>Case study</Eyebrow>))).toContain(
      "text-transform: var(--ui-eyebrow-transform)",
    )
  })

  it("keeps its own css() blocks property-disjoint", async () => {
    const blocks = styleBlocksOf(await renderToHtml(<Eyebrow>Case study</Eyebrow>))
    expect(sharedProperties(blocks)).toEqual([])
  })

  it("adds through mix a property it does not declare itself", async () => {
    const spaced = css({ marginBlockEnd: "var(--sp-2)" })
    const blocks = styleBlocksOf(await renderToHtml(<Eyebrow mix={spaced}>Case study</Eyebrow>))
    expect(blocks.filter((block) => block.includes("margin-block-end:"))).toHaveLength(1)
  })
})

describe("EyebrowDemo", () => {
  it("renders the eyebrow in the position it is for", async () => {
    const html = await renderToHtml(<EyebrowDemo />)
    expect(html).toContain("Case study")
    expect(html).toContain("<h2")
  })
})
