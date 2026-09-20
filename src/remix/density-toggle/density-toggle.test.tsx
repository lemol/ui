import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { markupOf } from "../../../test/styles.ts"
import { documentRootId } from "../document-root.ts"
import { DensityToggle } from "./density-toggle.tsx"

describe("DensityToggle", () => {
  it("carries command/commandfor pointed at the document root", async () => {
    const markup = markupOf(await renderToHtml(<DensityToggle />))
    expect(markup).toContain('command="--toggle-density"')
    expect(markup).toContain(`commandfor="${documentRootId}"`)
  })

  it("defaults its label, and takes a custom one", async () => {
    expect(markupOf(await renderToHtml(<DensityToggle />))).toContain("Compact density")
    expect(markupOf(await renderToHtml(<DensityToggle>Compact</DensityToggle>))).toContain(
      ">Compact<",
    )
  })

  it("passes tone and size through to the underlying Button", async () => {
    const markup = markupOf(await renderToHtml(<DensityToggle disabled tone="ghost" />))
    expect(markup).toContain("disabled")
  })

  it("renders complete markup with no script", async () => {
    expect(await renderToHtml(<DensityToggle />)).not.toContain("<script")
  })
})
