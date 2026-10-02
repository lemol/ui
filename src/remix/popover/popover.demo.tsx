import { css } from "remix/component"
import { Stack } from "../stack/stack.tsx"
import { Text } from "../text/text.tsx"
import { popover } from "./popover.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const Account = popover("account-menu")

export function PopoverDemo() {
  return () => (
    <>
      <p mix={label}>popover: native popover, anchor positioning, no client code in the page</p>
      <Stack gap={4}>
        <Account.Trigger tone="neutral">Account</Account.Trigger>
        <Text>
          The trigger carries <code>command="toggle-popover"</code> and{" "}
          <code>commandfor="account-menu"</code>. Opening, dismissal and light dismiss are the
          platform's, not a click handler on this page.
        </Text>
      </Stack>
      <Account.Surface>
        <Stack gap={2}>
          <Text>Signed in as jane@example.com</Text>
          <Text tone="muted">Settings · Sign out</Text>
        </Stack>
      </Account.Surface>
    </>
  )
}
