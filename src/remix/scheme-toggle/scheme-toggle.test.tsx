import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { markupOf } from "../../../test/styles.ts"
import { documentRootId } from "../document-root.ts"
import { SchemeToggle } from "./scheme-toggle.tsx"

describe("SchemeToggle", () => {
  it("carries command/commandfor pointed at the document root", async () => {
    const markup = markupOf(await renderToHtml(<SchemeToggle />))
    expect(markup).toContain('command="--set-scheme"')
    expect(markup).toContain(`commandfor="${documentRootId}"`)
  })

  it("defaults its label, and takes a custom one", async () => {
    expect(markupOf(await renderToHtml(<SchemeToggle />))).toContain("Toggle theme")
    expect(markupOf(await renderToHtml(<SchemeToggle>Dark mode</SchemeToggle>))).toContain(
      "Dark mode",
    )
  })

  it("renders complete markup with no script", async () => {
    expect(await renderToHtml(<SchemeToggle />)).not.toContain("<script")
  })
})
