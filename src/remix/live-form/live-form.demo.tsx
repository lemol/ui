import { css } from "remix/ui"
import { Field } from "../field/field.tsx"
import { LiveForm, liveSubmit } from "./live-form.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

export function LiveFormDemo() {
  return () => (
    <>
      <p mix={label}>liveform: a filter resubmits the form itself, debounced</p>
      <LiveForm id="live-filter">
        <Field control="select" label="Role" mix={liveSubmit("live-filter")} name="role">
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </Field>
      </LiveForm>
    </>
  )
}
