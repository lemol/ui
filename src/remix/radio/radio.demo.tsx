import { css } from "remix/ui"
import { Stack } from "../stack/stack.tsx"
import { Radio } from "./radio.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

export function RadioDemo() {
  return () => (
    <>
      <p mix={label}>radio: one native group, native mutual exclusion</p>
      <Stack gap={4}>
        <Radio checked label="Compact" name="density" value="compact" />
        <Radio label="Comfortable" name="density" value="comfortable" />
        <Radio
          disabled
          label="Spacious (not available on this plan)"
          name="density"
          value="spacious"
        />
      </Stack>
    </>
  )
}
