import { css } from "remix/component"
import { TabBar } from "./tab-bar.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  marginBlockEnd: "var(--sp-2)",
})

const frame = css({
  maxInlineSize: "24rem",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--r-lg)",
  overflow: "hidden",
  marginBlockEnd: "var(--sp-6)",
})

/** A glyph standing in for an app's icon set, which the library does not ship. */
const glyph = (text: string) => <span aria-hidden="true">{text}</span>

export function TabBarDemo() {
  return () => (
    <>
      <p mix={label}>
        tab bar: a phone's destinations, the current one on its pill (narrow screens only)
      </p>
      <div mix={frame}>
        <TabBar
          items={[
            {
              key: "home",
              label: "Home",
              icon: glyph("⌂"),
              href: "#home",
              current: true,
              badge: { count: 2, label: "2 waiting on you", tone: "attention" },
            },
            { key: "browse", label: "Browse", icon: glyph("☰"), href: "#browse" },
            {
              key: "loops",
              label: "Loops",
              icon: glyph("↻"),
              href: "#loops",
              badge: { count: 1, label: "1 open" },
            },
            {
              key: "more",
              label: "More",
              icon: glyph("⋯"),
              popoverTarget: "demo-more",
              dot: "a notice",
            },
          ]}
          label="Demo"
        />
      </div>
    </>
  )
}
