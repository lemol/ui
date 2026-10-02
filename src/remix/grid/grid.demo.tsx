import { css } from "remix/component"
import type { SpaceStep } from "../space.ts"
import { type ColumnCount, columnStyles, Grid } from "./grid.tsx"

const counts = Object.keys(columnStyles).map(Number) as ColumnCount[]

/**
 * The steps this demo shows — a readable sample of the scale rather than all
 * of it. Exported so grid.test.tsx asserts against what is rendered instead of
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

const cell = css({
  background: "var(--surface-raised)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--r-sm)",
  padding: "var(--sp-3)",
  textAlign: "center",
})

export function GridDemo() {
  return () => (
    <>
      {counts.map((cols) => (
        <div key={cols} mix={section}>
          <p mix={label}>cols {cols}</p>
          <Grid cols={cols} gap={3}>
            {Array.from({ length: cols * 2 }, (_, index) => (
              <div key={index} mix={cell}>
                {index + 1}
              </div>
            ))}
          </Grid>
        </div>
      ))}

      <div mix={section}>
        <p mix={label}>gap, on the primitive space scale</p>
        {demoGaps.map((gap) => (
          <div key={gap} mix={section}>
            <p mix={label}>gap {gap}</p>
            <Grid cols={4} gap={gap}>
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} mix={cell}>
                  {index + 1}
                </div>
              ))}
            </Grid>
          </div>
        ))}
      </div>
    </>
  )
}
