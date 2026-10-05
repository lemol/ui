import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../../test/render.ts"
import { HomePage } from "./home.tsx"

/**
 * The pattern every component test copies: one node, `renderToHtml`, assertions
 * on the string. No router, no asset server, no DOM.
 */
describe("HomePage", () => {
  it("renders the catalogue index in mini's shell", async () => {
    const page = await renderToHtml(<HomePage location="/" scripts={false} />)

    expect(page).toContain("lemol ui playground")
    expect(page).toContain("Skip to content")
    expect(page).toContain('href="/c/button"')
    expect(page).toContain('href="/pages/dashboard"')
    expect(page).toContain('href="/spa"')
  })

  it("renders complete markup with scripts off", async () => {
    const page = await renderToHtml(<HomePage location="/" scripts={false} />)

    expect(page).toContain('<button type="button"')
    expect(page).toContain("Not clicked yet")
  })

  it("says which mode it is in", async () => {
    expect(await renderToHtml(<HomePage location="/" scripts />)).toContain(
      "Client JavaScript is on",
    )
    expect(await renderToHtml(<HomePage location="/" scripts={false} />)).toContain(
      "Client JavaScript is off",
    )
  })

  it("carries the switchers, preserving the current query", async () => {
    const page = await renderToHtml(<HomePage location="/?scheme=dark" scripts />)

    expect(page).toContain('name="scheme"')
    expect(page).toContain('name="density"')
    expect(page).toContain('name="nojs"')
    // The density form preserves the scheme it is not changing.
    expect(page).toContain('type="hidden"')
    expect(page).toContain('value="dark"')
  })

  it("disables the compat switch with the scripts off", async () => {
    // Button open tags only: the emitted stylesheet carries `:disabled`
    // selectors of its own, so a whole-page match proves nothing. The probe
    // button is never disabled and every other switcher stays enabled, so on
    // this page a disabled button can only be the compat pair.
    const disabledButton = /<button[^>]*disabled/

    expect(await renderToHtml(<HomePage location="/" scripts />)).not.toMatch(disabledButton)
    expect(await renderToHtml(<HomePage location="/?nojs" scripts={false} />)).toMatch(
      disabledButton,
    )
  })
})
