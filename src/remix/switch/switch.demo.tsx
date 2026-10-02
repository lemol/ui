import { css } from "remix/component"
import { Stack } from "../stack/stack.tsx"
import { Switch } from "./switch.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

export function SwitchDemo() {
  return () => (
    <>
      <p mix={label}>switch: a real checkbox, drawn as a track/thumb</p>
      <Stack gap={4}>
        <Switch checked hint="Applies to this browser only." label="Dark mode" name="dark-mode" />
        <Switch label="Auto-save" name="auto-save" />
        <Switch disabled label="Beta features (not on this plan)" name="beta" />
      </Stack>
    </>
  )
}
