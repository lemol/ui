import { css } from "remix/component"
import { Stack } from "../stack/stack.tsx"
import { Text } from "../text/text.tsx"
import { toast } from "./toaster.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const Saved = toast("saved-toast")

export function ToasterDemo() {
  return () => (
    <>
      <p mix={label}>toaster: --dismiss-toast is the timing, dismissal itself is native</p>
      <Stack gap={4}>
        <Saved.Trigger tone="primary">Save</Saved.Trigger>
        <Text>
          The trigger's command is <code>--dismiss-toast</code>, the one rung-three behaviour this
          component needs: no native attribute expresses a timed auto-close.
        </Text>
      </Stack>
      <Saved.Toast duration={4000} tone="success">
        Saved.
      </Saved.Toast>
    </>
  )
}
