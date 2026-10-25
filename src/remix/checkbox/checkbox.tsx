import { type Handle, type MixInput } from "remix/component"
import { css } from "../css.ts"
import { fieldMessages, givenProps } from "../form-control.ts"

const rowStyle = css({
  display: "flex",
  alignItems: "start",
  gap: "var(--ui-checkbox-gap)",
})

const inputStyle = css({
  inlineSize: "var(--ui-checkbox-size)",
  blockSize: "var(--ui-checkbox-size)",
  flexShrink: 0,
  accentColor: "var(--ui-checkbox-accent)",
  "&:disabled": { cursor: "not-allowed" },
})

const bodyStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "var(--ui-checkbox-gap)",
})

/**
 * One block per state rather than a base block plus a disabled override on
 * top: both would declare `color`, and which one paints is decided by
 * sub-layer registration order, not array order — see button.tsx's own
 * `:disabled` co-location note. Parameterizing keeps exactly one block live
 * on the label at a time.
 */
const labelStyle = (disabled: boolean) =>
  css({
    fontSize: "var(--ui-checkbox-label-size)",
    color: disabled ? "var(--ui-checkbox-disabled-ink)" : "var(--ui-checkbox-label-ink)",
  })

const hintStyle = css({
  fontSize: "var(--ui-checkbox-message-size)",
  color: "var(--ui-checkbox-hint-ink)",
})

const errorStyle = css({
  fontSize: "var(--ui-checkbox-message-size)",
  color: "var(--ui-checkbox-error-ink)",
})

export interface CheckboxProps {
  /** Required. Names the value in the submission, and is the id stem — see `Field`'s `name`. */
  name: string
  /** Required. An unlabelled control is a broken control. */
  label: string
  hint?: string | undefined
  error?: string | undefined
  id?: string | undefined
  /**
   * Ticked, controlled. In a hydrated component the runtime puts it back
   * after every click until a render passes a new one. A form that never
   * hydrates can pass either this or `defaultChecked`.
   */
  checked?: boolean | undefined
  /**
   * Ticked to start, and the person's after that: for a checkbox in a
   * hydrated component whose form, not the component, holds the choice. The
   * server renders it as the same `checked` attribute.
   */
  defaultChecked?: boolean | undefined
  value?: string | undefined
  required?: boolean | undefined
  disabled?: boolean | undefined
  mix?: MixInput<HTMLInputElement> | undefined
}

export function Checkbox(handle: Handle<CheckboxProps>) {
  return () => {
    const { name, label, hint, error, checked, defaultChecked, value, required, disabled, mix } =
      handle.props

    const stem = handle.props.id !== undefined && handle.props.id !== "" ? handle.props.id : name
    const messages = fieldMessages(stem, hint, error)

    return (
      <div mix={rowStyle}>
        <input
          aria-describedby={messages.describedBy}
          aria-invalid={messages.invalid}
          disabled={disabled}
          id={stem}
          mix={[inputStyle, mix]}
          name={name}
          required={required}
          type="checkbox"
          {...givenProps({ checked, defaultChecked, value })}
        />
        <div mix={bodyStyle}>
          <label for={stem} mix={labelStyle(disabled === true)}>
            {label}
          </label>
          {messages.hasHint ? (
            <p id={messages.hintId} mix={hintStyle}>
              {hint}
            </p>
          ) : undefined}
          {messages.hasError ? (
            <p id={messages.errorId} mix={errorStyle}>
              {error}
            </p>
          ) : undefined}
        </div>
      </div>
    )
  }
}
