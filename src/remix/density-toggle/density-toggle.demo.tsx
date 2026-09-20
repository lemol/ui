import { css } from "remix/ui"
import { DensityToggle } from "./density-toggle.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

export function DensityToggleDemo() {
  return () => (
    <>
      <p mix={label}>
        densitytoggle: --toggle-density, persisted to the same key bootScript reads back
      </p>
      <DensityToggle tone="neutral" />
    </>
  )
}
