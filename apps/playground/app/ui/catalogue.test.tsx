import { describe, expect, it } from "bun:test"
import { demos } from "@lemol/ui/remix/demos"
import { renderToHtml } from "../../../../test/render.ts"
import { CataloguePage } from "./catalogue.tsx"

const button = <CataloguePage entry={demos.button} location="/c/button" name="button" />

describe("CataloguePage", () => {
  it("renders the demo with the component index", async () => {
    const page = await renderToHtml(button)
    expect(page).toContain("size md")
    expect(page).toContain(">primary</button>")
    expect(page).toContain('href="/c/badge"')
  })

  it("reads the button knobs from the query string", async () => {
    const page = await renderToHtml(
      <CataloguePage entry={demos.button} location="/c/button?tone=danger&size=sm" name="button" />,
    )
    expect(page).toContain('tone="danger" size="sm"')
  })

  it("falls back to the defaults for knobs it does not recognise", async () => {
    const page = await renderToHtml(
      <CataloguePage entry={demos.button} location="/c/button?tone=primay&size=xl" name="button" />,
    )
    expect(page).toContain('tone="neutral" size="md"')
  })

  it("keeps the switchers when a knob changes", async () => {
    const page = await renderToHtml(
      <CataloguePage
        entry={demos.button}
        location="/c/button?scheme=dark&tone=primary"
        name="button"
      />,
    )
    // The knobs form preserves the scheme; the scheme forms preserve the knob.
    expect(page).toContain('type="hidden"')
    expect(page).toContain('value="dark"')
    expect(page).toContain('value="primary"')
  })

  it("knobs the badge, text and heading too", async () => {
    const badge = await renderToHtml(
      <CataloguePage entry={demos.badge} location="/c/badge?tone=success" name="badge" />,
    )
    expect(badge).toContain('tone="success"')

    const text = await renderToHtml(
      <CataloguePage entry={demos.text} location="/c/text?tone=muted&size=lg" name="text" />,
    )
    expect(text).toContain('tone="muted" size="lg"')

    const heading = await renderToHtml(
      <CataloguePage entry={demos.heading} location="/c/heading?level=4" name="heading" />,
    )
    expect(heading).toContain("level={4}")
  })

  it("renders no knobs where there are no variant axes", async () => {
    const page = await renderToHtml(
      <CataloguePage entry={demos.stack} location="/c/stack" name="stack" />,
    )
    expect(page).not.toContain("Knobs")
  })
})
