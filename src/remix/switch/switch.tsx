import { type Handle, type MixInput, type RemixNode } from "remix/component"
import { css } from "../css.ts"
import { fieldMessages, givenProps } from "../form-control.ts"

const rowStyle = css({
  display: "flex",
  alignItems: "start",
  gap: "var(--ui-switch-gap)",
})

/**
 * The track is the real `<input>`, `appearance: none` and drawn as a pill;
 * the thumb is its `::before`, translated on `:checked`. `role="switch"` is
 * the only addition to a native checkbox. `aria-checked` mirrors `checked`
 * only when controlled; otherwise it is omitted so the native checked state
 * follows the person's clicks rather than a fixed ARIA value going stale.
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
  label: RemixNode
  hint?: string | undefined
  error?: string | undefined
  id?: string | undefined
  /**
   * On, controlled. In a hydrated component the runtime puts it back after
   * every click until a render passes a new one. A form that never hydrates
   * can pass either this or `defaultChecked`.
   */
  checked?: boolean | undefined
  /**
   * On to start, and the person's after that: for a switch in a hydrated
   * component whose form, not the component, holds the choice. The server
   * renders it as the same `checked` attribute.
   */
  defaultChecked?: boolean | undefined
  value?: string | undefined
  required?: boolean | undefined
  disabled?: boolean | undefined
  mix?: MixInput<HTMLInputElement> | undefined
}

export function Switch(handle: Handle<SwitchProps>) {
  return () => {
    const { name, label, hint, error, checked, defaultChecked, value, required, disabled, mix } =
      handle.props

    const stem = handle.props.id !== undefined && handle.props.id !== "" ? handle.props.id : name
    const messages = fieldMessages(stem, hint, error)

    return (
      <div mix={rowStyle}>
        <input
          aria-checked={checked === undefined ? undefined : checked ? "true" : "false"}
          aria-describedby={messages.describedBy}
          aria-invalid={messages.invalid}
          disabled={disabled}
          id={stem}
          mix={[trackStyle, mix]}
          name={name}
          required={required}
          role="switch"
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
