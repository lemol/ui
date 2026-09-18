import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../../test/render.ts"
import { HomePage } from "./home.tsx"

/**
 * The pattern every component test copies: one node, `renderToHtml`, assertions
 * on the string. No router, no asset server, no DOM.
 */
describe("HomePage", () => {
  it("renders complete markup with scripts off", async () => {
    const page = await renderToHtml(<HomePage scripts={false} />)
    expect(page).toContain("<h1>lemol ui playground</h1>")
    expect(page).toContain('<button type="button"')
    expect(page).toContain("Not clicked yet")
  })

  it("emits the css it declares alongside the markup", async () => {
    const page = await renderToHtml(<HomePage scripts={false} />)
    expect(page).toContain("@layer rmx.")
    expect(page).toContain("max-width: 42rem")
  })

  it("says which mode it is in", async () => {
    expect(await renderToHtml(<HomePage scripts />)).toContain("Client JavaScript is on")
    expect(await renderToHtml(<HomePage scripts={false} />)).toContain("Client JavaScript is off")
  })
})
