import { css } from "remix/ui"
import { Button } from "../button/button.tsx"
import { Field } from "./field.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const group = css({
  display: "flex",
  flexDirection: "column",
  gap: "var(--sp-5)",
  marginBlockEnd: "var(--sp-8)",
})

const actions = css({
  marginBlockStart: "var(--sp-4)",
})

/**
 * A real form, submitted with no client JavaScript.
 *
 * `method="get"` and no `action`, so submitting reloads the catalogue route
 * with the values in the query string. Leaving the email empty and pressing
 * Save is the manual check the done-when asks for: the browser's own
 * validation blocks the submission and reports the error itself.
 *
 * The last field's error is static. A server-produced one needs a round trip,
 * and the playground has no route for it until the shell arrives.
 */
export function FieldDemo() {
  return () => (
    <>
      <p mix={label}>field: the three controls, in one submitting form</p>
      <form method="get">
        <div mix={group}>
          <Field
            autocomplete="email"
            hint="We only use this to send receipts."
            label="Email"
            name="email"
            required
            type="email"
          />
          <Field control="select" hint="Change it whenever you like." label="Plan" name="plan">
            <option value="free">Free</option>
            <option selected value="team">
              Team
            </option>
            <option value="enterprise">Enterprise</option>
          </Field>
          <Field
            control="textarea"
            label="Notes"
            maxlength={500}
            name="notes"
            placeholder="Anything we should know?"
            rows={4}
          />
        </div>
        <div mix={actions}>
          <Button tone="primary" type="submit">
            Save
          </Button>
        </div>
      </form>

      <p mix={label}>field: the states</p>
      <div mix={group}>
        <Field disabled label="Account id" name="account" value="acct_9f21" />
        <Field
          hint="Set when the account was created."
          label="Created"
          name="created"
          readonly
          type="date"
          value="2026-04-02"
        />
        <Field
          error="That address is already registered."
          label="Email"
          name="existing-email"
          type="email"
          value="ada@example.com"
        />
      </div>
    </>
  )
}
