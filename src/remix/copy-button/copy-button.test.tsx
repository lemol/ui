import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, markupOf, styleBlocksOf, stylesOf } from "../../../test/styles.ts"
import { CopyButton } from "./copy-button.tsx"
import { copyTokens } from "./tokens.ts"

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

  it("renders both labels and the check, the confirm label hidden from assistive tech", async () => {
    const markup = markupOf(
      await renderToHtml(
        <CopyButton id="a" value="x">
          Copy API key
        </CopyButton>,
      ),
    )

    const idle = /<span[^>]*data-copy-label="idle"[^>]*>/.exec(markup)?.[0] ?? ""
    const confirm = /<span[^>]*data-copy-label="confirm"[^>]*>/.exec(markup)?.[0] ?? ""

    expect(idle).not.toBe("")
    expect(idle).not.toContain("aria-hidden")
    expect(confirm).toContain('aria-hidden="true"')
    expect(markup).toContain('pathLength="1"')
    expect(markup).toContain("Copied!")
    expect(markup).not.toContain("data-copy-confirmed")
  })

  it("draws the check and dissolves the confirm label in under data-copy-confirmed", async () => {
    const styles = stylesOf(await renderToHtml(<CopyButton id="a" value="x" />))
    const timing = "var(--ui-copy-confirm-duration) var(--ui-copy-confirm-easing)"

    expect(styles).toContain(`animation: ui-motion-draw ${timing};`)
    expect(styles).toContain(`animation: ui-motion-dissolve ${timing};`)
    expect(styles).toContain("@keyframes ui-motion-draw")
    expect(styles).toContain("@keyframes ui-motion-dissolve")
    expect(styles).toContain('&[data-copy-confirmed] [data-copy-label="idle"]')
    expect(copyTokens["ui-copy-confirm-duration"]).toStartWith("var(--dur-")
    expect(copyTokens["ui-copy-confirm-easing"]).toStartWith("var(--ease-")
  })

  it("keeps every label rule in one block, so specificity and not layer order picks the state", async () => {
    const html = await renderToHtml(<CopyButton id="a" value="x" />)
    const labelBlocks = [...new Set(styleBlocksOf(html))].filter((block) =>
      block.includes("data-copy-label"),
    )

    expect(labelBlocks).toHaveLength(1)
    expect([0, 1, 2].flatMap((n) => blocksOn(html, "span", n)).join("\n")).not.toMatch(/\bopacity:/)
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    const styles = stylesOf(await renderToHtml(<CopyButton id="a" value="x" />))
    const read = new Set(
      [...styles.matchAll(/var\(--(ui-copy-[\w-]+)\)/g)].map((match) => match[1] ?? ""),
    )

    expect([...read].sort()).toEqual(Object.keys(copyTokens).sort())
  })
})
