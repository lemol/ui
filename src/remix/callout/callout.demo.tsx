import { css } from "remix/component"
import { LinkButton } from "../button/button.tsx"
import { Stack } from "../stack/stack.tsx"
import { Callout, type CalloutTone } from "./callout.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const tones: CalloutTone[] = ["neutral", "success", "warning", "danger", "info"]

export function CalloutDemo() {
  return () => (
    <>
      <p mix={label}>callout: badge's tone pair, scaled to a block</p>
      <Stack gap={3}>
        {tones.map((tone) => (
          <Callout description={`This is a ${tone} callout.`} key={tone} title={tone} tone={tone} />
        ))}
        <Callout
          action={<LinkButton href="#billing">Update payment method</LinkButton>}
          description="Your card ending in 4242 expires this month."
          title="Payment method expiring"
          tone="warning"
        />
      </Stack>
    </>
  )
}
