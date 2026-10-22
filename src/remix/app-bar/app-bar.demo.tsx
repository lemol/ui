import { css } from "remix/component"
import { Badge } from "../badge/badge.tsx"
import { Button } from "../button/button.tsx"
import { AppBar } from "./app-bar.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  marginBlockEnd: "var(--sp-2)",
})

const frame = css({
  maxInlineSize: "48rem",
  paddingInline: "var(--sp-4)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--r-lg)",
  marginBlockEnd: "var(--sp-6)",
})

export function AppBarDemo() {
  return () => (
    <>
      <p mix={label}>app bar: a record's head, one row wide and a phone's bar below 48rem</p>
      <div mix={frame}>
        <AppBar
          actions={
            <Button size="sm" tone="ghost">
              ⋯
            </Button>
          }
          back={{ href: "#tasks", label: "Tasks" }}
          controls={
            <Button size="sm" tone="neutral">
              Run
            </Button>
          }
          status={<Badge tone="info">Running</Badge>}
          subtitle="nzila / #598"
          title="Session flow returns every turn to us and lands only our waiting turn"
        />
      </div>
    </>
  )
}
