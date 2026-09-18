import { describe, expect, it } from "bun:test"
import { css } from "remix/ui"
import { renderToHtml } from "../../../../test/render.ts"
import { ButtonDemo } from "./button.demo.tsx"
import { Button, type ButtonSize, type ButtonTone, LinkButton } from "./button.tsx"
import { buttonTokens } from "./tokens.ts"

const tones: ButtonTone[] = ["primary", "neutral", "ghost", "danger"]
const sizes: ButtonSize[] = ["sm", "md"]

/** The css remix collected during the render, with the markup dropped. */
const stylesOf = (html: string) =>
  [...html.matchAll(/<style data-rmx-style="[^"]*">([\s\S]*?)<\/style>/g)]
    .map((match) => match[1] ?? "")
    .join("\n")

/** Every declaration value in a block of css. */
const valuesOf = (styles: string) =>
  [...styles.matchAll(/[\w-]+\s*:\s*([^;{}]+)[;}]/g)].map((match) => (match[1] ?? "").trim())

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

  it("applies mix last, because it is the escape hatch", async () => {
    // A structural override the contract cannot express as a token value.
    const pinned = css({ position: "fixed" })
    const styles = stylesOf(await renderToHtml(<Button mix={pinned}>Save</Button>))
    expect(styles).toContain("position: fixed")
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
    const sections = sizes
      .map((size) => ({ size, start: html.indexOf(`size ${size}`) }))
      .sort((a, b) => a.start - b.start)
      .map(({ size, start }, i, all) => ({
        size,
        start,
        html: html.slice(start, all[i + 1]?.start ?? html.length),
      }))

    expect(sections).toHaveLength(sizes.length)
    for (const section of sections) {
      expect(section.start).toBeGreaterThanOrEqual(0)
      for (const tone of tones) expect(section.html).toContain(`>${tone}</button>`)
      expect(section.html).toContain("disabled")
    }
  })
})
