import { describe, expect, it } from "bun:test"
import { css } from "remix/ui"
import { renderToHtml } from "../../../../test/render.ts"
import { sharedProperties, styleBlocksOf, stylesOf, valuesOf } from "../../../../test/styles.ts"
import { sizes, TextDemo, tones } from "./text.demo.tsx"
import { Text, textTags } from "./text.tsx"

/** Derived, not restated: a tag textTags gains is a tag this loop covers. */
const tags = textTags

describe("Text", () => {
  it("renders a p by default, carrying its children", async () => {
    const html = await renderToHtml(<Text>prose</Text>)
    expect(html).toContain("<p")
    expect(html).toContain("prose")
  })

  it("renders every tag it offers", async () => {
    // A <p> inside a <p> is invalid markup the parser silently unnests, so
    // inline text needs a tag of its own or it ends up styled by hand.
    for (const tag of tags) {
      expect(await renderToHtml(<Text as={tag}>prose</Text>)).toContain(`<${tag}`)
    }
  })

  it("reads only its own tokens", async () => {
    for (const size of sizes) {
      for (const tone of tones) {
        const styles = stylesOf(
          await renderToHtml(
            <Text size={size} tone={tone}>
              prose
            </Text>,
          ),
        )
        const offenders = valuesOf(styles).filter(
          (value) => !/^var\(--ui-text-[\w-]+\)$/.test(value),
        )
        expect(offenders).toEqual([])
      }
    }
  })

  it("emits the size and tone a caller asks for", async () => {
    for (const size of sizes) {
      expect(stylesOf(await renderToHtml(<Text size={size}>prose</Text>))).toContain(
        `font-size: var(--ui-text-size-${size})`,
      )
    }
    const inks = {
      default: "ui-text-ink",
      muted: "ui-text-ink-muted",
      subtle: "ui-text-ink-subtle",
    }
    for (const tone of tones) {
      expect(stylesOf(await renderToHtml(<Text tone={tone}>prose</Text>))).toContain(
        `color: var(--${inks[tone]})`,
      )
    }
  })

  it("defaults to md and the plain ink", async () => {
    const styles = stylesOf(await renderToHtml(<Text>prose</Text>))
    expect(styles).toContain("font-size: var(--ui-text-size-md)")
    expect(styles).toContain("color: var(--ui-text-ink)")
  })

  it("keeps its own css() blocks property-disjoint across every combination", async () => {
    for (const size of sizes) {
      for (const tone of tones) {
        const blocks = styleBlocksOf(
          await renderToHtml(
            <Text size={size} tone={tone}>
              prose
            </Text>,
          ),
        )
        expect(sharedProperties(blocks)).toEqual([])
      }
    }
  })

  it("leaves font-weight to mix, and declares none of its own", async () => {
    // The mix-driven half of the always/optional rule, used on purpose: a
    // property the component never declares is reliably the caller's.
    expect(stylesOf(await renderToHtml(<Text>prose</Text>))).not.toContain("font-weight")
    const bold = css({ fontWeight: "var(--fw-semibold)" })
    const blocks = styleBlocksOf(await renderToHtml(<Text mix={bold}>prose</Text>))
    expect(blocks.filter((block) => block.includes("font-weight:"))).toHaveLength(1)
  })
})

describe("TextDemo", () => {
  it("renders every value of every axis it demonstrates", async () => {
    const html = await renderToHtml(<TextDemo />)
    for (const size of sizes) expect(html).toContain(`size ${size}`)
    for (const tone of tones) expect(html).toContain(`tone ${tone}`)
  })
})
