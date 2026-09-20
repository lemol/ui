import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { markupOf } from "../../../test/styles.ts"
import { LiveForm, liveSubmit } from "./live-form.tsx"

describe("LiveForm", () => {
  it("renders a plain form carrying its id", async () => {
    const markup = markupOf(await renderToHtml(<LiveForm id="filters">Body</LiveForm>))
    expect(markup).toContain("<form")
    expect(markup).toContain('id="filters"')
    expect(markup).toContain("Body")
  })

  it("defaults to a GET form, like a plain filter bar", async () => {
    const markup = markupOf(await renderToHtml(<LiveForm id="filters">Body</LiveForm>))
    expect(markup).toContain('method="get"')
  })

  it("renders complete markup with no script", async () => {
    const html = await renderToHtml(<LiveForm id="filters">Body</LiveForm>)
    expect(html).not.toContain("<script")
  })
})

describe("liveSubmit", () => {
  it("carries command/commandfor pointed at the form, invoked by typing", async () => {
    const markup = markupOf(await renderToHtml(<select mix={liveSubmit("filters")}>{null}</select>))
    expect(markup).toContain('command="--live-submit"')
    expect(markup).toContain('commandfor="filters"')
  })
})
