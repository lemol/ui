import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { sharedProperties, styleBlocksOf, stylesOf, valuesOf } from "../../../test/styles.ts"
import { TabsDemo } from "./tabs.demo.tsx"
import { Tabs } from "./tabs.tsx"
import { tabsTokens } from "./tokens.ts"

/** Structural keywords Tabs declares; nothing here is a colour or a length. */
const keywords = new Set([
  "flex",
  "inline-flex",
  "stretch",
  "center",
  "0",
  "auto",
  "none",
  "nowrap",
  "solid",
  "transparent",
  "default",
  "fit-content",
  "100%",
  "color, background, border-color, box-shadow",
])

/**
 * Every var() a value names, so a calc() of a token is read as the token, and
 * the rule's inset shadow as its two tokens with zero offsets.
 */
const offendersIn = (styles: string): string[] =>
  valuesOf(styles).filter((value) => {
    if (keywords.has(value)) return false

    const names = [...value.matchAll(/var\(--([\w-]+)\)/g)].map((match) => match[1] ?? "")

    if (names.length === 0 || !names.every((name) => name.startsWith("ui-tabs-"))) return true

    return (
      value.replace(/var\(--[\w-]+\)/g, "").replace(/\b(calc|inset)\b|[()+\-*/\s01]/g, "") !== ""
    )
  })

/** The declarations of the rule whose selector is exactly `selector`, innermost rules only. */
const ruleIn = (styles: string, selector: string): string | undefined =>
  [...styles.matchAll(/([^{};]+)\{([^{}]*)\}/g)].find((match) => match[1]?.trim() === selector)?.[2]

const items = [
  { label: "Task", href: "/t/1", current: true },
  { label: "Run", href: "/t/1/runs/a", meta: "3" },
  { label: "Artifacts", href: "/t/1/runs/a/artifacts", disabled: true },
]

describe("Tabs", () => {
  it("renders a named nav of links, the current one marked for assistive technology", async () => {
    const html = await renderToHtml(<Tabs items={items} label="Views" />)

    expect(html).toContain('<nav aria-label="Views"')
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*href="\/t\/1"/)
    expect(html).toContain('href="/t/1/runs/a"')
  })

  it("draws a tab with no target as a dim span, never a disabled link", async () => {
    const html = await renderToHtml(<Tabs items={items} label="Views" />)

    expect(html).not.toContain('href="/t/1/runs/a/artifacts"')
    expect(html).toMatch(/<span aria-disabled="true"/)
  })

  it("reads only its own tokens and structural keywords, in both looks", async () => {
    for (const variant of ["line", "pill"] as const) {
      const styles = stylesOf(
        await renderToHtml(<Tabs items={items} label="V" variant={variant} />),
      )

      expect(offendersIn(styles)).toEqual([])
    }
  })

  it("draws the reset's focus ring inside each tab, where the scrolling strip cannot clip it", async () => {
    // overflow-x: auto clips the strip on every side, and the reset draws its
    // ring outside the tab. Tabs moves the ring in by its width and draws no
    // ring of its own.
    for (const variant of ["line", "pill"] as const) {
      const styles = stylesOf(
        await renderToHtml(<Tabs items={items} label="V" variant={variant} />),
      )

      expect(ruleIn(styles, "& > :focus-visible")).toContain(
        "outline-offset: calc(var(--ui-tabs-ring-inset) * -1);",
      )
      expect(styles).not.toMatch(/\boutline:/)
    }
  })

  it("draws the line look's rule inside the strip, under the tabs, and pulls no tab past it", async () => {
    // The strip clips at its padding box, so a border there is out of every
    // tab's reach, and a tab given a negative margin to cover it was clipped
    // and scrolled the strip by the rule's width instead.
    const styles = stylesOf(await renderToHtml(<Tabs items={items} label="V" />))

    expect(styles).toContain(
      "box-shadow: inset 0 calc(var(--ui-tabs-rule-width) * -1) 0 var(--ui-tabs-rule);",
    )
    expect(styles).not.toContain("border-block-end-width: var(--ui-tabs-rule-width)")
    expect(styles).not.toMatch(/\bmargin/)
  })

  it("keeps each look property-disjoint from the shared block", async () => {
    for (const variant of ["line", "pill"] as const) {
      const blocks = styleBlocksOf(
        await renderToHtml(<Tabs items={items} label="V" variant={variant} />),
      )

      expect(blocks).toHaveLength(2)
      expect(sharedProperties(blocks)).toEqual([])
    }
  })

  it("reads every token it declares across its two looks", async () => {
    const styles = [
      stylesOf(await renderToHtml(<Tabs items={items} label="V" />)),
      stylesOf(await renderToHtml(<Tabs items={items} label="V" variant="pill" />)),
    ].join("\n")

    const read = new Set([...styles.matchAll(/var\(--(ui-tabs-[\w-]+)\)/g)].map((m) => m[1]))

    expect([...read].sort()).toEqual(Object.keys(tabsTokens).sort())
  })

  it("has a demo that renders", async () => {
    expect(await renderToHtml(<TabsDemo />)).toContain("<nav")
  })
})
