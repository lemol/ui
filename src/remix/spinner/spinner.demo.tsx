import { css } from "remix/ui"
import { Row } from "../row/row.tsx"
import { Spinner } from "./spinner.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

export function SpinnerDemo() {
  return () => (
    <>
      <p mix={label}>spinner: a rotated border, no reduced-motion query of its own</p>
      <Row gap={4}>
        <Spinner />
        <Spinner label="Saving" />
      </Row>
    </>
  )
}
