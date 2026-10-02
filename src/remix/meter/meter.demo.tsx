import { css } from "remix/component"
import { Stack } from "../stack/stack.tsx"
import { Meter, Progress } from "./meter.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

export function MeterDemo() {
  return () => (
    <>
      <p mix={label}>progress: determinate, then indeterminate — the UA's own animation</p>
      <Stack gap={4}>
        <Progress value={0.6} />
        <Progress />
      </Stack>

      <p mix={label}>meter: the UA's own low/high/optimum semantics</p>
      <Stack gap={4}>
        <Meter high={0.8} low={0.3} max={1} optimum={1} value={0.9} />
        <Meter high={0.8} low={0.3} max={1} optimum={1} value={0.5} />
        <Meter high={0.8} low={0.3} max={1} optimum={1} value={0.1} />
      </Stack>
    </>
  )
}
