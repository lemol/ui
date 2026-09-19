import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../test/render.ts"
import { styleBlocksOf, stylesOf, valuesOf } from "../../test/styles.ts"
import { type Align, alignStyles } from "./align.ts"

const aligns = Object.keys(alignStyles) as Align[]

describe("the shared align scale", () => {
  it("declares align-items alone, which is what lets a component stay disjoint", async () => {
    // A block here that also set, say, textAlign would be invisible to the
    // component tests: their disjointness loops only catch a property a
    // component already declares, and nothing else declares text-align. This
    // is where a stray property in the shared Record is caught. Each name is
    // its own CSS keyword — unlike Row's justify names, this Record maps
    // nothing — so the expected value is the key.
    for (const align of aligns) {
      const html = await renderToHtml(<div mix={alignStyles[align]} />)
      expect(styleBlocksOf(html)).toHaveLength(1)
      expect(valuesOf(stylesOf(html))).toEqual([align])
    }
  })
})
