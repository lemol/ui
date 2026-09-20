import { css } from "remix/ui"
import { SchemeToggle } from "./scheme-toggle.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

export function SchemeToggleDemo() {
  return () => (
    <>
      <p mix={label}>schemetoggle: --set-scheme resolves the current scheme and flips it</p>
      <SchemeToggle tone="neutral" />
    </>
  )
}
