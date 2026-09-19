import { css } from "remix/ui"
import { type Align, alignStyles } from "../align.ts"
import type { SpaceStep } from "../space.ts"
import { Stack } from "./stack.tsx"

const aligns = Object.keys(alignStyles) as Align[]

/**
 * The steps this demo shows — a readable sample of the scale rather than all
 * of it. Exported so stack.test.tsx asserts against what is rendered instead
 * of a second copy of the list.
 */
export const demoGaps: SpaceStep[] = [0, 2, 4, 8]

/**
 * Styled from primitives, not from any component's tokens: a demo is a page,
 * not a component, and the same reasoning button.demo.tsx records applies.
 */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const section = css({ marginBlockEnd: "var(--sp-8)" })

/** A visible box, so a gap and an alignment can be seen rather than inferred. */
const item = css({
  background: "var(--surface-raised)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--r-sm)",
  padding: "var(--sp-2) var(--sp-3)",
})

/** Bounded, so `stretch` and `start` differ visibly on the cross axis. */
const frame = css({
  border: "1px dashed var(--hairline-strong)",
  borderRadius: "var(--r-md)",
  padding: "var(--sp-3)",
  inlineSize: "18rem",
})

export function StackDemo() {
  return () => (
    <>
      <div mix={section}>
        <p mix={label}>gap, on the primitive space scale</p>
        {demoGaps.map((gap) => (
          <div key={gap} mix={section}>
            <p mix={label}>gap {gap}</p>
            <Stack gap={gap}>
              <div mix={item}>one</div>
              <div mix={item}>two</div>
              <div mix={item}>three</div>
            </Stack>
          </div>
        ))}
      </div>

      {aligns.map((align) => (
        <div key={align} mix={section}>
          <p mix={label}>align {align}</p>
          <div mix={frame}>
            <Stack align={align} gap={2}>
              <div mix={item}>short</div>
              <div mix={item}>a longer item</div>
            </Stack>
          </div>
        </div>
      ))}
    </>
  )
}
