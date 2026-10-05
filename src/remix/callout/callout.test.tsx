import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, markupOf, sharedProperties, stylesOf, valuesOf } from "../../../test/styles.ts"
import { Callout, type CalloutTone } from "./callout.tsx"
import { calloutTokens } from "./tokens.ts"

const tones: CalloutTone[] = ["neutral", "success", "warning", "danger", "info"]

const keywords = new Set(["flex", "start", "solid", "column", "0"])

describe("Callout", () => {
  it("renders a title and, when given, a description", async () => {
    const markup = markupOf(
      await renderToHtml(<Callout description="Body copy." title="Heads up" />),
    )

    expect(markup).toContain("Heads up")
    expect(markup).toContain("Body copy.")
  })

  it("renders no description paragraph when absent", async () => {
    const markup = markupOf(await renderToHtml(<Callout title="Heads up" />))

    expect(markup).toContain("<p")
    expect([...markup.matchAll(/<p/g)]).toHaveLength(1)
  })

  it("renders an icon and an action only when given", async () => {
    const bare = markupOf(await renderToHtml(<Callout title="Heads up" />))

    expect(bare).not.toContain("<svg")
    expect(bare).not.toContain("<button")
    const full = markupOf(
      await renderToHtml(
        <Callout action={<button type="button">Retry</button>} icon={<svg />} title="Heads up" />,
      ),
    )

    expect(full).toContain("<svg")
    expect(full).toContain("Retry")
  })

  it("reads only its own tokens and structural keywords", async () => {
    for (const tone of tones) {
      const styles = stylesOf(
        await renderToHtml(<Callout description="Body copy." title="Heads up" tone={tone} />),
      )

      const offenders = valuesOf(styles).filter(
        (value) => !keywords.has(value) && !/^var\(--ui-callout-[\w-]+\)$/.test(value),
      )

      expect(offenders).toEqual([])
    }
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    const html = await renderToHtml(
      tones.map((tone) => (
        <Callout description="Body copy." icon={<svg />} key={tone} title="Heads up" tone={tone} />
      )),
    )

    const read = new Set(
      [...stylesOf(html).matchAll(/var\(--(ui-callout-[\w-]+)\)/g)].map((match) => match[1] ?? ""),
    )

    expect([...read].sort()).toEqual(Object.keys(calloutTokens).sort())
  })

  it("gives every tone its own three tokens and nothing borrowed", async () => {
    for (const tone of tones) {
      const styles = stylesOf(await renderToHtml(<Callout title="Heads up" tone={tone} />))

      expect(styles).toContain(`background: var(--ui-callout-${tone}-bg)`)
      expect(styles).toContain(`border-color: var(--ui-callout-${tone}-border)`)
      expect(styles).toContain(`color: var(--ui-callout-${tone}-ink)`)
      const borrowed = tones
        .filter((other) => other !== tone)
        .filter((other) => styles.includes(`--ui-callout-${other}-`))

      expect(borrowed).toEqual([])
    }
  })

  it("defaults to neutral", async () => {
    const styles = stylesOf(await renderToHtml(<Callout title="Heads up" />))

    expect(styles).toContain("background: var(--ui-callout-neutral-bg)")
  })

  it("gives its own div two blocks (base and tone), disjoint by property", async () => {
    const blocks = blocksOn(await renderToHtml(<Callout title="Heads up" tone="info" />), "div")

    expect(blocks).toHaveLength(2)
    expect(sharedProperties(blocks)).toEqual([])
  })
})
