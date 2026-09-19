import { describe, expect, it } from "bun:test"
import { css } from "remix/ui"
import { renderToHtml } from "../../../test/render.ts"
import { sharedProperties, styleBlocksOf, stylesOf, valuesOf } from "../../../test/styles.ts"
import { ButtonDemo } from "./button.demo.tsx"
import { Button, type ButtonSize, type ButtonTone, LinkButton } from "./button.tsx"
import { buttonTokens } from "./tokens.ts"

const tones: ButtonTone[] = ["primary", "neutral", "ghost", "danger"]
const sizes: ButtonSize[] = ["sm", "md"]

/**
 * Values a declaration may carry instead of a token. Structural keywords only:
 * nothing here is a colour, a length, a duration or a weight.
 */
const keywords = new Set([
  "inline-flex",
  "center",
  "solid",
  "inherit",
  "nowrap",
  "none",
  "pointer",
  "not-allowed",
  "background, border-color, color",
])

describe("Button", () => {
  it("defaults its type, because a bare button in a form submits it", async () => {
    expect(await renderToHtml(<Button>Save</Button>)).toContain('type="button"')
  })

  it("takes an explicit type for the case where submitting is the point", async () => {
    expect(await renderToHtml(<Button type="submit">Save</Button>)).toContain('type="submit"')
  })

  it("renders its children", async () => {
    expect(await renderToHtml(<Button>Save</Button>)).toContain("Save")
  })

  it("renders the disabled attribute", async () => {
    expect(await renderToHtml(<Button disabled>Save</Button>)).toContain("disabled")
  })

  it("reads only its own tokens and structural keywords", async () => {
    // The machine-checkable form of "no component hard-codes a colour,
    // radius, duration or space step".
    for (const tone of tones) {
      for (const size of sizes) {
        const styles = stylesOf(
          await renderToHtml(
            <Button size={size} tone={tone}>
              Save
            </Button>,
          ),
        )
        const offenders = valuesOf(styles).filter(
          (value) => !keywords.has(value) && !/^var\(--ui-btn-[\w-]+\)$/.test(value),
        )
        expect(offenders).toEqual([])
      }
    }
  })

  it("declares a token for every tone and part it reads", async () => {
    // button.tsx composes token names from the tone, so this is what stops a
    // tone from reading a name the record does not hold.
    const parts = ["bg", "ink", "border", "bg-hover"]
    const missing = tones.flatMap((tone) =>
      parts
        .map((part) => `ui-btn-${tone}-${part}`)
        .filter((name) => !Object.hasOwn(buttonTokens, name)),
    )
    expect(missing).toEqual([])
  })

  it("takes its height from the size axis, so density reaches it", async () => {
    expect(stylesOf(await renderToHtml(<Button size="md">Save</Button>))).toContain(
      "var(--ui-btn-height)",
    )
    expect(stylesOf(await renderToHtml(<Button size="sm">Save</Button>))).toContain(
      "var(--ui-btn-height-sm)",
    )
  })

  it("styles no focus ring, leaving the reset's to apply", async () => {
    expect(stylesOf(await renderToHtml(<Button>Save</Button>))).not.toContain("outline")
  })

  it("adds through mix a property it does not declare itself", async () => {
    // The half of the escape hatch that does work: `position` appears nowhere
    // in buttonBase, sizeStyles or toneStyles, so no block of Button's can
    // contend with the caller's and sub-layer order cannot matter.
    const pinned = css({ position: "fixed" })
    const blocks = styleBlocksOf(await renderToHtml(<Button mix={pinned}>Save</Button>))
    expect(blocks.filter((block) => block.includes("position: fixed"))).toHaveLength(1)
    expect(blocks.filter((block) => block.includes("position:"))).toHaveLength(1)
  })

  it("gives the caller's mix no later sub-layer than its own tone", async () => {
    // The guarantee `mix` actually carries, pinned so the prose cannot drift
    // from it. `mix` was documented as "composed last, so it wins" — it is
    // not, for the same reason the disabled bug happened. Sub-layer order
    // follows the order blocks are first encountered during the render, so
    // rendering the caller's descriptor on an *earlier* element registers it
    // first, and a later sub-layer beats an earlier one regardless of
    // specificity. Overriding a declared property goes through the token.
    const callerMix = css({ color: "rebeccapurple" })
    const blocks = styleBlocksOf(
      await renderToHtml(
        <div>
          <span mix={callerMix}>earlier</span>
          <Button mix={callerMix} tone="primary">
            Save
          </Button>
        </div>,
      ),
    )
    const caller = blocks.findIndex((block) => block.includes("rebeccapurple"))
    const tone = blocks.findIndex((block) => block.includes("var(--ui-btn-primary-ink)"))
    expect(caller).toBeGreaterThanOrEqual(0)
    expect(tone).toBeGreaterThanOrEqual(0)
    // Both set `color`. The caller's block is earlier, so Button's tone wins.
    expect(caller).toBeLessThan(tone)
  })

  it("wins the disabled cascade from within the tone's own sub-layer", async () => {
    // remix/ui gives every css() call its own cascade sub-layer, and within
    // layers, layer order beats specificity — not just "more specific wins".
    // buttonBase's sub-layer is registered before the tone's, so a
    // `.base:disabled` rule sitting in buttonBase would lose to
    // `.tone { color: … }` even though `:disabled` is more specific. A test
    // that only checks the disabled declarations are *present somewhere* in
    // the document (as every prior test here does) cannot see that: the text
    // is there, but the wrong rule wins at paint time. The only reliable fix
    // is to put the disabled override in the *same* css() block as the tone
    // declarations it must beat, so ordinary specificity applies within one
    // sub-layer. This test asserts the two live together, block by block.
    for (const tone of tones) {
      const blocks = styleBlocksOf(await renderToHtml(<Button tone={tone}>Save</Button>))
      const toneBlock = blocks.find(
        (block) => block.includes(`var(--ui-btn-${tone}-bg)`) && block.includes(":disabled"),
      )
      expect(toneBlock).toBeDefined()
      expect(toneBlock).toContain("var(--ui-btn-disabled-bg)")
      expect(toneBlock).toContain("var(--ui-btn-disabled-border)")
      expect(toneBlock).toContain("var(--ui-btn-disabled-ink)")
      expect(toneBlock).toContain("cursor: not-allowed")
    }
  })

  it("keeps the disabled override out of buttonBase's own sub-layer", async () => {
    // The regression this guards against is silent: buttonBase would still
    // read correctly as CSS text, it would just be beaten by the tone's
    // layer again. Asserting buttonBase's own block (the one carrying the
    // shared, tone-independent declarations) does NOT also carry `:disabled`
    // is what stops that split from reintroducing itself unnoticed.
    const blocks = styleBlocksOf(await renderToHtml(<Button>Save</Button>))
    const baseBlock = blocks.find((block) => block.includes("inline-flex"))
    expect(baseBlock).toBeDefined()
    expect(baseBlock).not.toContain(":disabled")
  })

  it("keeps its own css() blocks property-disjoint", async () => {
    // The checkable form of the cascade-layers rule: no two of the blocks a
    // single Button renders — buttonBase, its size and its tone — may
    // declare the same top-level property, or sub-layer order (not either
    // block's author) decides which one paints (see docs/design-system.md,
    // "A component's own blocks must be property-disjoint"). Checked per
    // tone and size, because two different tones sharing "color" is not a
    // violation — a button only ever renders one tone at a time — but a tone
    // sharing a property with buttonBase or its own size block is.
    for (const tone of tones) {
      for (const size of sizes) {
        const blocks = styleBlocksOf(await renderToHtml(<Button size={size} tone={tone} />))
        expect(sharedProperties(blocks)).toEqual([])
      }
    }
  })
})

describe("LinkButton", () => {
  it("renders an anchor carrying its href", async () => {
    const html = await renderToHtml(<LinkButton href="/docs">Docs</LinkButton>)
    expect(html).toContain('<a href="/docs"')
    expect(html).toContain("Docs")
  })

  it("drops the underline the reset gives every anchor", async () => {
    // The reset's :where(a) rule lives in @layer base and the component's css
    // lives in rmx, which is ordered after it. This asserts which side of
    // that line the reset is on.
    const styles = stylesOf(await renderToHtml(<LinkButton href="/docs">Docs</LinkButton>))
    expect(styles).toContain("text-decoration: none")
    expect(styles).toContain("@layer rmx.")
  })

  it("shares the tone contract with Button", async () => {
    const styles = stylesOf(
      await renderToHtml(
        <LinkButton href="/x" tone="primary">
          X
        </LinkButton>,
      ),
    )
    expect(styles).toContain("var(--ui-btn-primary-bg)")
  })
})

describe("ButtonDemo", () => {
  it("renders every tone within each size's own section", async () => {
    // Each size section is led by its "size <name>" label. Slicing the html
    // at those labels scopes the tone check to the section it claims to be
    // in, so dropping a tone from only one size's section fails here even
    // though the tone still occurs somewhere in the full document.
    const html = await renderToHtml(<ButtonDemo />)
    const starts = sizes.map((size) => html.indexOf(`size ${size}`)).sort((a, b) => a - b)

    for (const [i, start] of starts.entries()) {
      // The real guard. A missing label gives -1, and slicing from -1 would
      // widen the section to most of the document and pass on a tone that
      // only appears in the other size's section.
      expect(start).toBeGreaterThanOrEqual(0)
      const section = html.slice(start, starts[i + 1] ?? html.length)
      for (const tone of tones) expect(section).toContain(`>${tone}</button>`)
      expect(section).toContain("disabled")
    }
  })
})
