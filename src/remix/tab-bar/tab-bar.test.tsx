import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { markupOf, stylesOf, valuesOf } from "../../../test/styles.ts"
import { motionKeywords } from "../motion/motion.ts"
import { TabBarDemo } from "./tab-bar.demo.tsx"
import { TabBar, tabBarBreakpoint, type TabBarItem } from "./tab-bar.tsx"
import { tabBarTokens } from "./tokens.ts"

/** Structural keywords TabBar declares; nothing here is a colour or a length a skin would retune. */
const keywords = new Set([
  // Motion: the shared keyframes' values, and the one animation TabBar times
  // from its own badge-pop tokens.
  ...motionKeywords,
  "ui-motion-pop var(--ui-tabbar-badge-pop-duration) var(--ui-tabbar-badge-pop-easing)",
  "none",
  "block",
  "grid",
  "column",
  "minmax(0, 1fr)",
  "stretch",
  "100%",
  "0",
  "relative",
  "absolute",
  "flex",
  "center",
  "transparent",
  "inherit",
  "pointer",
  "inline-grid",
  "background, color",
  "tabular-nums",
  "1",
  "inset(50%)",
  "nowrap",
  "1px",
  "hidden",
  "50%",
])

/** Every value that is not a keyword reads TabBar's own tokens alone, a calc() of one included. */
const offendersIn = (styles: string): string[] =>
  valuesOf(styles).filter((value) => {
    if (keywords.has(value)) return false

    const names = [...value.matchAll(/var\(--([\w-]+)\)/g)].map((match) => match[1] ?? "")

    if (names.length === 0 || !names.every((name) => name.startsWith("ui-tabbar-"))) return true

    return value.replace(/var\(--[\w-]+\)/g, "").replace(/\bcalc\b|[()*\s1-]/g, "") !== ""
  })

const items: ReadonlyArray<TabBarItem> = [
  {
    key: "home",
    label: "Home",
    icon: <span>h</span>,
    href: "/",
    current: true,
    badge: { count: 3, label: "3 waiting on you", tone: "attention" },
  },
  {
    key: "loops",
    label: "Loops",
    icon: <span>l</span>,
    href: "/loops",
    badge: { count: 0, label: "0 open" },
  },
  { key: "more", label: "More", icon: <span>m</span>, popoverTarget: "side", dot: "a notice" },
]

describe("TabBar", () => {
  it("is a named landmark of links, and a popover button for what opens a sheet", async () => {
    const html = await renderToHtml(<TabBar items={items} label="Main" />)

    expect(html).toMatch(/<nav aria-label="Main" data-tab-bar=""/)
    expect(html).toMatch(/<a aria-current="page" data-tab-bar-item="home" href="\/"/)
    expect(html).toMatch(/<a data-tab-bar-item="loops" href="\/loops"/)
    expect(html).toMatch(
      /<button data-tab-bar-item="more"[^>]*popovertarget="side"[^>]*type="button"/,
    )
  })

  it("draws a count on its mark, the accent for what needs a person, and reads it after the name", async () => {
    const html = await renderToHtml(<TabBar items={items} label="Main" />)

    expect(html).toMatch(/<span aria-hidden="true" data-tone="attention"[^>]*>3<\/span>/)
    expect(html).toContain(", 3 waiting on you")
    // A zero draws nothing, and says nothing.
    expect(html).not.toContain("0 open")
    expect(html).toContain(", a notice")
  })

  it("caps a count at 99+", async () => {
    const html = await renderToHtml(
      <TabBar
        items={[{ ...items[0]!, badge: { count: 140, label: "140 waiting on you" } }]}
        label="Main"
      />,
    )

    expect(html).toMatch(/>99\+<\/span>/)
  })

  it("draws only below its breakpoint, the landmark leaving a wide screen whole", async () => {
    const styles = stylesOf(await renderToHtml(<TabBar items={items} label="Main" />))

    expect(styles).toContain(`@media (width < ${tabBarBreakpoint})`)
  })

  it("carries a host's attributes on an item", async () => {
    const html = await renderToHtml(
      <TabBar items={[{ ...items[1]!, attrs: { "data-nav": "loops" } }]} label="Main" />,
    )

    expect(html).toContain('data-nav="loops"')
  })

  it("reads only its own tokens and structural keywords", async () => {
    const styles = stylesOf(await renderToHtml(<TabBar items={items} label="Main" />))

    expect(offendersIn(styles)).toEqual([])
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    const styles = stylesOf(await renderToHtml(<TabBar items={items} label="Main" />))
    const read = new Set([...styles.matchAll(/var\(--(ui-tabbar-[\w-]+)\)/g)].map((m) => m[1]))

    expect([...read].sort()).toEqual(Object.keys(tabBarTokens).sort())
  })

  it("pops its count and its dot in on insertion, on tokens reduced motion zeroes", async () => {
    const html = await renderToHtml(<TabBar items={items} label="Main" />)
    const popHash = [...html.matchAll(/<style data-rmx-style="([^"]*)">([\s\S]*?)<\/style>/g)].find(
      ([, , block]) =>
        block?.includes(
          "animation: ui-motion-pop var(--ui-tabbar-badge-pop-duration) var(--ui-tabbar-badge-pop-easing);",
        ),
    )?.[1]

    expect(popHash).toBeDefined()
    // The fixture draws one count (3) and one dot; the zero count draws nothing.
    expect(markupOf(html).match(new RegExp(`class="[^"]*\\b${popHash}\\b`, "g"))).toHaveLength(2)
    expect(tabBarTokens["ui-tabbar-badge-pop-duration"]).toStartWith("var(--dur-")
    expect(tabBarTokens["ui-tabbar-badge-pop-easing"]).toStartWith("var(--ease-")
  })

  it("has a demo that renders", async () => {
    expect(await renderToHtml(<TabBarDemo />)).toContain("data-tab-bar")
  })
})
