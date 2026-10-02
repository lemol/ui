import { css } from "remix/component"
import { Stack } from "../stack/stack.tsx"
import { Checkbox } from "./checkbox.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

export function CheckboxDemo() {
  return () => (
    <>
      <p mix={label}>checkbox: native accent-color, no custom box</p>
      <Stack gap={4}>
        <Checkbox
          hint="Occasional product updates."
          label="Subscribe to the newsletter"
          name="newsletter"
        />
        <Checkbox checked label="Remember me" name="remember" />
        <Checkbox disabled label="Two-factor authentication (managed by admin)" name="two-factor" />
        <Checkbox
          error="You must accept the terms to continue."
          label="I accept the terms"
          name="terms"
          required
        />
      </Stack>
    </>
  )
}
