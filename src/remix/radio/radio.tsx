import { css, type Handle, type MixInput } from "remix/component"
import { fieldMessages, givenProps } from "../form-control.ts"

const rowStyle = css({
  display: "flex",
  alignItems: "start",
  gap: "var(--ui-radio-gap)",
})

const inputStyle = css({
  inlineSize: "var(--ui-radio-size)",
  blockSize: "var(--ui-radio-size)",
  flexShrink: 0,
  accentColor: "var(--ui-radio-accent)",
  "&:disabled": { cursor: "not-allowed" },
})

const bodyStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "var(--ui-radio-gap)",
})

/** One block per state — see checkbox.tsx's own note on why not a base block plus an override. */
const labelStyle = (disabled: boolean) =>
  css({
    fontSize: "var(--ui-radio-label-size)",
    color: disabled ? "var(--ui-radio-disabled-ink)" : "var(--ui-radio-label-ink)",
  })

const hintStyle = css({
  fontSize: "var(--ui-radio-message-size)",
  color: "var(--ui-radio-hint-ink)",
})

const errorStyle = css({
  fontSize: "var(--ui-radio-message-size)",
  color: "var(--ui-radio-error-ink)",
})

export interface RadioProps {
  /** Required. The shared value every option in a group carries, exactly as native `<input type="radio">` groups by it. */
  name: string
  /**
   * Required. What this option submits when checked, and — combined with
   * `name` — the id stem: two options in one group necessarily share `name`,
   * so `name` alone cannot make a unique id the way `Checkbox`'s does.
   */
  value: string
  /** Required. An unlabelled control is a broken control. */
  label: string
  hint?: string | undefined
  error?: string | undefined
  id?: string | undefined
  checked?: boolean | undefined
  required?: boolean | undefined
  disabled?: boolean | undefined
  mix?: MixInput<HTMLInputElement> | undefined
}

export function Radio(handle: Handle<RadioProps>) {
  return () => {
    const { name, value, label, hint, error, checked, required, disabled, mix } = handle.props
    const stem =
      handle.props.id !== undefined && handle.props.id !== "" ? handle.props.id : `${name}-${value}`

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
          type="radio"
          value={value}
          {...givenProps({ checked })}
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
