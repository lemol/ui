import { css } from "remix/ui"
import { type Align, alignStyles } from "../align.ts"
import type { SpaceStep } from "../space.ts"
import { type Justify, justifyStyles, Row } from "./row.tsx"

const aligns = Object.keys(alignStyles) as Align[]
const justifies = Object.keys(justifyStyles) as Justify[]

/**
 * The steps this demo shows — a readable sample of the scale rather than all
 * of it. Exported so row.test.tsx asserts against what is rendered instead of
 * a second copy of the list.
 */
export const demoGaps: SpaceStep[] = [0, 2, 4, 8]

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const section = css({ marginBlockEnd: "var(--sp-8)" })

const item = css({
  background: "var(--surface-raised)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--r-sm)",
  padding: "var(--sp-2) var(--sp-3)",
})

/** Bounded, so a distribution has room to distribute into. */
const frame = css({
  border: "1px dashed var(--hairline-strong)",
  borderRadius: "var(--r-md)",
  padding: "var(--sp-3)",
})

/** Taller than its siblings, so centring is visible rather than asserted. */
const tall = css({
  background: "var(--surface-raised)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--r-sm)",
  padding: "var(--sp-5) var(--sp-3)",
})

export function RowDemo() {
  return () => (
    <>
      <div mix={section}>
        <p mix={label}>gap, on the primitive space scale</p>
        {demoGaps.map((gap) => (
          <div key={gap} mix={section}>
            <p mix={label}>gap {gap}</p>
            <Row gap={gap}>
              <div mix={item}>one</div>
              <div mix={item}>two</div>
              <div mix={item}>three</div>
            </Row>
          </div>
        ))}
      </div>

      {aligns.map((align) => (
        <div key={align} mix={section}>
          <p mix={label}>align {align}</p>
          <div mix={frame}>
            <Row align={align} gap={3}>
              <div mix={item}>short</div>
              <div mix={tall}>taller</div>
              <div mix={item}>short</div>
            </Row>
          </div>
        </div>
      ))}

      {justifies.map((justify) => (
        <div key={justify} mix={section}>
          <p mix={label}>justify {justify}</p>
          <div mix={frame}>
            <Row gap={2} justify={justify}>
              <div mix={item}>one</div>
              <div mix={item}>two</div>
              <div mix={item}>three</div>
            </Row>
          </div>
        </div>
      ))}

      <div mix={section}>
        <p mix={label}>wrap</p>
        <div mix={frame}>
          <Row gap={2} wrap>
            {Array.from({ length: 24 }, (_, index) => (
              <div key={index} mix={item}>
                item {index + 1}
              </div>
            ))}
          </Row>
        </div>
      </div>
    </>
  )
}
