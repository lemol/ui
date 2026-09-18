import { css } from "remix/ui"
import { type ColumnCount, Grid } from "./grid.tsx"

const counts: ColumnCount[] = [1, 2, 3, 4, 5, 6]

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
        {([0, 2, 4, 8] as const).map((gap) => (
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
