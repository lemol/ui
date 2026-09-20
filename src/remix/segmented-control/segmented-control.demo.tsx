import { css } from "remix/ui"
import { SegmentedControl } from "./segmented-control.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

export function SegmentedControlDemo() {
  return () => (
    <>
      <p mix={label}>segmentedcontrol: a native radio group, one sliding indicator, no JS</p>
      <SegmentedControl
        label="Density"
        name="density"
        options={[
          { label: "Compact", value: "compact" },
          { label: "Comfortable", value: "comfortable" },
          { label: "Spacious", value: "spacious" },
        ]}
        value="comfortable"
      />
    </>
  )
}
