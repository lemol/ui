import { describe, expect, it } from "bun:test"
import { css } from "remix/component"
import { renderToHtml } from "../../../test/render.ts"
import {
  markupOf,
  sharedProperties,
  styleBlocksOf,
  stylesOf,
  valuesOf,
} from "../../../test/styles.ts"
import { BadgeDemo } from "./badge.demo.tsx"
import { Badge, type BadgeTone } from "./badge.tsx"
import { badgeTokens } from "./tokens.ts"

const tones: BadgeTone[] = ["neutral", "success", "warning", "danger", "info"]

/**
 * Values a declaration may carry instead of a token. Structural keywords
 * only: nothing here is a colour, a length, a duration or a weight. Badge
 * declares exactly these five, and Button's list is the precedent for the
 * shape — Eyebrow needs none because it declares nothing structural.
 */
const keywords = new Set(["inline-flex", "center", "solid", "inherit", "nowrap"])

describe("Badge", () => {
  it("renders a span carrying its children", async () => {
    const html = await renderToHtml(<Badge>Draft</Badge>)
    expect(html).toContain("<span")
    expect(html).toContain("Draft")
  })

  it("declares border-style: solid, the one structural keyword two tokens depend on", async () => {
    // Unlike Badge's other structural declarations, this one is pinned on
    // purpose: border-color and border-width are var(--ui-badge-*) tokens,
    // but CSS border-style defaults to none, under which a border does not
    // render at all regardless of colour or width. Losing this declaration
    // silently disables two of Badge's tokens while every other test —
    // which asserts border-color and border-width, never border-style —
    // keeps passing.
    const styles = stylesOf(await renderToHtml(<Badge>Draft</Badge>))
    expect(styles).toContain("border-style: solid")
  })

  it("reads only its own tokens and structural keywords", async () => {
    // The whole point of the component: if a semantic primitive did not carry
    // enough meaning, this is where a color-mix() or a literal would appear.
    // Every tone renders, because a literal could hide in any one of them.
    for (const tone of tones) {
      const styles = stylesOf(await renderToHtml(<Badge tone={tone}>Live</Badge>))
      const offenders = valuesOf(styles).filter(
        (value) => !keywords.has(value) && !/^var\(--ui-badge-[\w-]+\)$/.test(value),
      )
      expect(offenders).toEqual([])
    }
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    // A token nothing reads is dead weight a skin will set and watch do
    // nothing; a read with no token is a var() that resolves to nothing.
    // Every tone has to render for the tone tokens to be reachable.
    const html = await renderToHtml(
      tones.map((tone) => (
        <Badge key={tone} tone={tone}>
          {tone}
        </Badge>
      )),
    )
    const read = new Set(
      [...stylesOf(html).matchAll(/var\(--(ui-badge-[\w-]+)\)/g)].map((match) => match[1] ?? ""),
    )
    expect([...read].sort()).toEqual(Object.keys(badgeTokens).sort())
  })

  it("gives every tone its own three tokens and nothing borrowed", async () => {
    for (const tone of tones) {
      const styles = stylesOf(await renderToHtml(<Badge tone={tone}>{tone}</Badge>))
      expect(styles).toContain(`background: var(--ui-badge-${tone}-bg)`)
      expect(styles).toContain(`border-color: var(--ui-badge-${tone}-border)`)
      expect(styles).toContain(`color: var(--ui-badge-${tone}-ink)`)
      const borrowed = tones
        .filter((other) => other !== tone)
        .filter((other) => styles.includes(`--ui-badge-${other}-`))
      expect(borrowed).toEqual([])
    }
  })

  it("wires each semantic tone to the contrast pair mini's theme test holds", () => {
    // This is what connects Badge's contract to the contrast promise held by
    // src/mini/theme.test.ts ("keeps <tone> readable on <tone>-subtle"): that
    // test checks the theme's <tone>/<tone>-subtle pair is readable, but never
    // looks at which values Badge actually reaches for. Reading badgeTokens
    // directly, not rendered output, because the claim is about the contract's
    // values. Derived from the tone list, not written by hand, so a fifth
    // semantic tone added later is covered automatically. Without this test, a
    // one-token edit like ui-badge-success-bg reading var(--success) instead
    // of var(--success-subtle) leaves the whole suite green while producing
    // invisible text: the tone-on-fill or ink-on-subtle pair Badge would then
    // render fails contrast even though the theme's own values are fine.
    const semanticTones: Exclude<BadgeTone, "neutral">[] = ["success", "warning", "danger", "info"]
    for (const tone of semanticTones) {
      expect(badgeTokens[`ui-badge-${tone}-bg`]).toBe(`var(--${tone}-subtle)`)
      expect(badgeTokens[`ui-badge-${tone}-ink`]).toBe(`var(--${tone})`)
      expect(badgeTokens[`ui-badge-${tone}-border`]).toBe(`var(--${tone}-border)`)
    }
  })

  it("defaults to neutral, so a badge with no status has one to use", async () => {
    const styles = stylesOf(await renderToHtml(<Badge>v2.1</Badge>))
    expect(styles).toContain("background: var(--ui-badge-neutral-bg)")
  })

  it("renders two blocks, disjoint by property", async () => {
    // base and tone. Sub-layer order is neither source order nor stable
    // across a client session, so two blocks that could both set `background`
    // would be correct only under the order observed today.
    const blocks = styleBlocksOf(await renderToHtml(<Badge tone="info">Beta</Badge>))
    expect(blocks).toHaveLength(2)
    expect(sharedProperties(blocks)).toEqual([])
  })

  it("adds through mix a property it does not declare itself", async () => {
    const placed = css({ marginInlineStart: "var(--sp-2)" })
    const blocks = styleBlocksOf(await renderToHtml(<Badge mix={placed}>Draft</Badge>))
    expect(
      blocks.filter((block) => block.includes("margin-inline-start: var(--sp-2)")),
    ).toHaveLength(1)
    expect(blocks.filter((block) => block.includes("margin-inline-start:"))).toHaveLength(1)
  })
})

describe("BadgeDemo", () => {
  it("shows every tone and a badge inline in a sentence", async () => {
    // markupOf, not the raw html: every tone name appears in the style blocks
    // as part of a --ui-badge-<tone>-* custom property, so a raw toContain
    // would pass without a single badge having rendered.
    const markup = markupOf(await renderToHtml(<BadgeDemo />))
    // Anchored between the tags, not a bare substring: the demo's own prose
    // says "five tones", and a tone name loose in a sentence would satisfy a
    // bare toContain without a badge having rendered.
    for (const tone of tones) expect(markup).toContain(`>${tone}<`)
    expect(markup).toContain(">mid-sentence<")
  })
})
