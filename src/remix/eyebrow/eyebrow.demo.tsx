import { css } from "remix/component"
import { Heading } from "../heading/heading.tsx"
import { Text } from "../text/text.tsx"
import { Eyebrow } from "./eyebrow.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const group = css({
  display: "flex",
  flexDirection: "column",
  gap: "var(--sp-2)",
  marginBlockEnd: "var(--sp-6)",
})

export function EyebrowDemo() {
  return () => (
    <>
      <p mix={label}>eyebrow: the kicker above a heading, in the position it is for</p>
      <div mix={group}>
        <Eyebrow>Case study</Eyebrow>
        <Heading level={2}>A heading the eyebrow introduces</Heading>
        <Text tone="muted">
          The eyebrow is smaller and more widely tracked than anything else on the page, which is
          what <code>--tr-wider</code> is in the schema for.
        </Text>
      </div>
    </>
  )
}
