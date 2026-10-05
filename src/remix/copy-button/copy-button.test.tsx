import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { markupOf } from "../../../test/styles.ts"
import { CopyButton } from "./copy-button.tsx"

describe("CopyButton", () => {
  it("commandfors itself when given a literal value, with one id written once", async () => {
    const markup = markupOf(await renderToHtml(<CopyButton id="key-copy" value="abc123" />))

    expect(markup).toContain('command="--copy"')
    expect(markup).toContain('commandfor="key-copy"')
    expect(markup).toContain('id="key-copy"')
    expect(markup).toContain('data-copy-value="abc123"')
  })

  it("commandfors another element when given `for`, and writes no data-copy-value of its own", async () => {
    const markup = markupOf(
      await renderToHtml(<CopyButton for="account-number" id="account-copy" />),
    )

    expect(markup).toContain('commandfor="account-number"')
    expect(markup).toContain('id="account-copy"')
    expect(markup).not.toContain("data-copy-value")
  })

  it("carries a confirm label, defaulting to Copied!", async () => {
    const defaultLabel = markupOf(await renderToHtml(<CopyButton id="a" value="x" />))

    expect(defaultLabel).toContain('data-copy-confirm-label="Copied!"')

    const customLabel = markupOf(
      await renderToHtml(<CopyButton confirmLabel="Done" id="a" value="x" />),
    )

    expect(customLabel).toContain('data-copy-confirm-label="Done"')
  })

  it("defaults its own label to Copy, and takes a custom one", async () => {
    expect(markupOf(await renderToHtml(<CopyButton id="a" value="x" />))).toContain(">Copy<")
    expect(
      markupOf(
        await renderToHtml(
          <CopyButton id="a" value="x">
            Copy link
          </CopyButton>,
        ),
      ),
    ).toContain("Copy link")
  })

  it("passes tone and size through to the underlying Button", async () => {
    const markup = markupOf(
      await renderToHtml(<CopyButton disabled id="a" size="sm" tone="ghost" value="x" />),
    )

    expect(markup).toContain("disabled")
  })

  it("renders complete markup with no script", async () => {
    const html = await renderToHtml(<CopyButton id="a" value="x" />)

    expect(html).not.toContain("<script")
  })
})
