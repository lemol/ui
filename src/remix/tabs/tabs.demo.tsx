import { css } from "remix/component"
import { Tabs } from "./tabs.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  marginBlockEnd: "var(--sp-2)",
})

const group = css({
  display: "flex",
  flexDirection: "column",
  gap: "var(--sp-4)",
  marginBlockEnd: "var(--sp-6)",
})

const items = [
  { label: "Overview", href: "?tab=overview", current: true },
  { label: "Runs", href: "?tab=runs", meta: "12" },
  { label: "Changes", href: "?tab=changes" },
  { label: "Artifacts", href: "?tab=artifacts", disabled: true },
]

export function TabsDemo() {
  return () => (
    <>
      <p mix={label}>tabs: route links, a line under a title or a pill switch</p>
      <div mix={group}>
        <Tabs items={items} label="Views" />
        <Tabs items={items} label="Views, compact" variant="pill" />
      </div>
    </>
  )
}
