import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../test/render.ts"
import { styleBlocksOf, stylesOf, valuesOf } from "../../test/styles.ts"
import { schema } from "../design/index.ts"
import { gaps, type SpaceStep } from "./space.ts"

const stepOf = (name: string): SpaceStep => Number(name.slice(3)) as SpaceStep

describe("the shared gap scale", () => {
  it("covers every space name the schema holds", () => {
    // Derived from schema.space, so a step can only go missing if the
    // derivation breaks — which is exactly when nothing else would notice.
    const missing = schema.space.filter((name) => !Object.hasOwn(gaps, name.slice(3)))

    expect(missing).toEqual([])
  })

  it("holds no step the schema does not", () => {
    const names = new Set<string>(schema.space.map((name) => name.slice(3)))

    expect(Object.keys(gaps).filter((key) => !names.has(key))).toEqual([])
  })

  it("declares gap alone, which is what lets a component stay disjoint", async () => {
    // A block here that also set, say, row-gap would collide with a
    // component's own base block and hand sub-layer order the decision.
    for (const name of schema.space) {
      const html = await renderToHtml(<div mix={gaps[stepOf(name)]} />)

      expect(styleBlocksOf(html)).toHaveLength(1)
      expect(valuesOf(stylesOf(html))).toEqual([`var(--${name})`])
    }
  })
})
