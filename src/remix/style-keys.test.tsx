import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../test/render.ts"
import { demos } from "./demos.ts"

// remix reads a nested style key as a selector only when it starts with one of
// `& @ : [ .`. Any other key, `dialog &` or `form:has(…) &`, is written out as
// a property whose value is "[object Object]", and the browser drops the rule
// unseen; `&:is(dialog *)` is the same selector, read. Each component's demo is
// registered in `demos.ts`, so rendering every demo renders every component.
describe("every component's styles", () => {
  it("starts each nested rule where remix reads a selector", async () => {
    const offenders: string[] = []

    for (const [name, { Demo }] of Object.entries(demos)) {
      const html = await renderToHtml(<Demo />)

      if (html.includes("[object Object]")) offenders.push(name)
    }

    expect(offenders).toEqual([])
  })
})
