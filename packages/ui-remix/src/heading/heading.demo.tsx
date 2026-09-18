import { type HeadingLevel, headingScale } from "@lemol/ui-design"
import { css } from "remix/ui"
import { Heading } from "./heading.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const row = css({
  display: "flex",
  flexDirection: "column",
  gap: "var(--sp-1)",
  marginBlockEnd: "var(--sp-6)",
})

/** Derived, so a level added to the scale appears here without an edit. */
export const demoLevels = Object.keys(headingScale).map(Number) as HeadingLevel[]

export function HeadingDemo() {
  return () => (
    <>
      <p mix={label}>heading: one size per level, and a level that keeps its own</p>
      {demoLevels.map((level) => (
        <div key={level} mix={row}>
          <Heading level={level}>The quick brown fox jumps over the lazy dog</Heading>
        </div>
      ))}
      <p mix={label}>size overrides the level, and the outline is unchanged</p>
      <div mix={row}>
        <Heading level={2} size={5}>
          An h2 that looks like an h5
        </Heading>
      </div>
    </>
  )
}
