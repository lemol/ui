import { css, type Handle, type MixInput } from "remix/component"
import { fieldMessages } from "../form-control.ts"

const rowStyle = css({
  display: "flex",
  alignItems: "start",
  gap: "var(--ui-switch-gap)",
})

/**
 * The track is the real `<input>`, `appearance: none` and drawn as a pill;
 * the thumb is its `::before`, translated on `:checked`. `role="switch"` is
 * the only addition to a native checkbox, and `aria-checked` mirrors the
 * same `checked` prop explicitly: `role="switch"` requires it in the
 * accessibility tree even though the browser already maps a checkbox's own
 * `checked` state there, so this is belt-and-braces rather than new state.
 */
const trackStyle = css({
  appearance: "none",
  position: "relative",
  display: "inline-block",
  flexShrink: 0,
  inlineSize: "var(--ui-switch-track-width)",
  blockSize: "var(--ui-switch-track-height)",
  borderStyle: "none",
  borderRadius: "var(--ui-switch-radius)",
  background: "var(--ui-switch-track-bg)",
  cursor: "pointer",
  transitionProperty: "background",
  transitionDuration: "var(--ui-switch-transition-duration)",
  transitionTimingFunction: "var(--ui-switch-transition-easing)",
  "&::before": {
    content: '""',
    position: "absolute",
    insetBlockStart: "var(--ui-switch-track-inset)",
    insetInlineStart: "var(--ui-switch-track-inset)",
    inlineSize: "var(--ui-switch-thumb-size)",
    blockSize: "var(--ui-switch-thumb-size)",
    borderRadius: "var(--ui-switch-radius)",
    background: "var(--ui-switch-thumb-bg)",
    translate: "0",
    transitionProperty: "translate",
    transitionDuration: "var(--ui-switch-transition-duration)",
    transitionTimingFunction: "var(--ui-switch-transition-easing)",
  },
  "&:checked": {
    background: "var(--ui-switch-track-bg-checked)",
  },
  "&:checked::before": {
    translate:
      "calc(var(--ui-switch-track-width) - var(--ui-switch-thumb-size) - var(--ui-switch-track-inset) * 2)",
  },
  "&:disabled": {
    background: "var(--ui-switch-track-bg-disabled)",
    cursor: "not-allowed",
  },
})

const bodyStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "var(--ui-switch-gap)",
})

/** One block per state — see checkbox.tsx's own note on why not a base block plus an override. */
const labelStyle = (disabled: boolean) =>
  css({
    fontSize: "var(--ui-switch-label-size)",
    color: disabled ? "var(--ui-switch-disabled-ink)" : "var(--ui-switch-label-ink)",
  })

const hintStyle = css({
  fontSize: "var(--ui-switch-message-size)",
  color: "var(--ui-switch-hint-ink)",
})

const errorStyle = css({
  fontSize: "var(--ui-switch-message-size)",
  color: "var(--ui-switch-error-ink)",
})

export interface SwitchProps {
  /** Required. Names the value in the submission, and is the id stem — see `Field`'s `name`. */
  name: string
  /** Required. An unlabelled control is a broken control. */
  label: string
  hint?: string | undefined
  error?: string | undefined
  id?: string | undefined
  checked?: boolean | undefined
  value?: string | undefined
  required?: boolean | undefined
  disabled?: boolean | undefined
  mix?: MixInput<HTMLInputElement> | undefined
}

export function Switch(handle: Handle<SwitchProps>) {
  return () => {
    const { name, label, hint, error, checked, value, required, disabled, mix } = handle.props
    const stem = handle.props.id !== undefined && handle.props.id !== "" ? handle.props.id : name
    const messages = fieldMessages(stem, hint, error)

    return (
      <div mix={rowStyle}>
        <input
          aria-checked={checked === true}
          aria-describedby={messages.describedBy}
          aria-invalid={messages.invalid}
          checked={checked}
          disabled={disabled}
          id={stem}
          mix={[trackStyle, mix]}
          name={name}
          required={required}
          role="switch"
          type="checkbox"
          value={value}
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
