import { css, type Handle, type MixInput } from "remix/ui"

/**
 * Derived from the list, not the other way around: a kind added only to the
 * union would compile, ship, and be covered by no test and no demo.
 */
export const fieldControls = ["input", "textarea", "select"] as const
export type FieldControl = (typeof fieldControls)[number]

/**
 * The text-box family, and nothing else.
 *
 * `checkbox`, `radio`, `file`, `range` and `color` are excluded because none
 * of them is a bordered box of `--control-h` height — they are different
 * controls sharing a tag name, and every token here would style them wrongly.
 * M2 schedules `Checkbox`, `Radio` and `Switch` for that reason.
 */
export const fieldTypes = [
  "text",
  "email",
  "url",
  "tel",
  "password",
  "search",
  "number",
  "date",
  "time",
  "datetime-local",
  "month",
  "week",
] as const
export type FieldType = (typeof fieldTypes)[number]

interface FieldCommon {
  /**
   * Required. Names the value in the submission, and is the id stem: `email`
   * for the control, `email-hint` and `email-error` for the messages.
   *
   * Used as written, with no sanitising. An id may hold anything but
   * whitespace, so `user[email]` is a valid stem. Sanitising would map two
   * names onto one id, which is a duplicate-id bug with its cause hidden.
   */
  name: string
  /** Required. An unlabelled control is a broken control. */
  label: string
  /** Rendered above the control, so it is read before the user types. */
  hint?: string | undefined
  /**
   * A server-supplied error, for the half of validation no attribute can
   * express: "that address is already registered". Sets `aria-invalid`.
   *
   * It stays set while the user corrects the field, until the next round trip.
   * Clearing it early would need client JavaScript, and Field ships none.
   */
  error?: string | undefined
  /** Replaces the id stem, for two forms on one page sharing a field name. */
  id?: string | undefined
  required?: boolean | undefined
  disabled?: boolean | undefined
  /**
   * Adds properties Field does not declare, **to the wrapper**. There is no
   * second `mix` for the control: a property of the control goes through a
   * `--ui-field-*` token, which is what the component tier is for.
   *
   * It does not reliably override a property the wrapper already declares.
   * Each `css()` block is its own cascade sub-layer, layer order beats
   * specificity inside a layer, and sub-layer order follows the order blocks
   * are first encountered during the render rather than the order of the array.
   */
  mix?: MixInput<HTMLDivElement> | undefined
}

/** Inputs and textareas take `readonly`; a `<select readonly>` is inert. */
interface FieldEditable extends FieldCommon {
  readonly?: boolean | undefined
  value?: string | undefined
  placeholder?: string | undefined
  minlength?: number | undefined
  maxlength?: number | undefined
}

export interface FieldInputProps extends FieldEditable {
  control?: "input" | undefined
  /** Defaults to `text`, which is also what a bare input defaults to. */
  type?: FieldType | undefined
  autocomplete?: string | undefined
  pattern?: string | undefined
  min?: string | number | undefined
  max?: string | number | undefined
  step?: string | number | undefined
}

export interface FieldTextareaProps extends FieldEditable {
  control: "textarea"
  rows?: number | undefined
}

/**
 * The union grows a member per task because it has to. Narrowing an optional
 * discriminant works only when every other member has its own `case`, so a
 * task that declared `FieldSelectProps` before it dispatched on
 * `control === "select"` would leave every input-only property unreachable
 * and the package would not compile.
 */
export type FieldProps = FieldInputProps | FieldTextareaProps

/**
 * The `type` attribute, narrowed to one literal for the compiler's benefit.
 *
 * `remix/ui` types `<input>` as a union discriminated on `type`, so that each
 * type can restrict what sits beside it: `role` is limited per type, and the
 * `text`/`search`/`tel`/`url`/`email` arms forbid `list` unless the combobox
 * arm is selected. A union-typed `type` selects no arm at all, and `Field`'s
 * `type` is a union by design — so the element does not typecheck without
 * this.
 *
 * The assertion is sound rather than convenient: every arm differs only in
 * `role` and `list`, `Field` passes neither, and the runtime value is
 * whatever the caller gave. It narrows the compiler's view, not the data.
 *
 * The cost is real and worth naming: if a future `remix/ui` adds an arm that
 * restricts an attribute `Field` does pass, this hides it. `field.test.tsx`
 * asserts the rendered `type` for every member of `fieldTypes`, so the value
 * reaching the DOM stays checked even though the attribute's type does not.
 */
const inputTypeAttribute = (type: FieldType | undefined): "text" => (type ?? "text") as "text"

const fieldBase = css({
  display: "flex",
  flexDirection: "column",
  gap: "var(--ui-field-gap)",
})

const labelStyle = css({
  fontSize: "var(--ui-field-label-size)",
  fontWeight: "var(--ui-field-label-weight)",
  color: "var(--ui-field-label-ink)",
})

const requiredStyle = css({
  color: "var(--ui-field-required-ink)",
})

const hintStyle = css({
  fontSize: "var(--ui-field-message-size)",
  color: "var(--ui-field-hint-ink)",
})

const errorStyle = css({
  fontSize: "var(--ui-field-message-size)",
  color: "var(--ui-field-error-ink)",
})

// The two sources of invalidity, native and server-supplied, deliberately
// look identical — so they share one declaration object rather than two
// copies that can drift.
const invalidDeclarations = {
  background: "var(--ui-field-invalid-bg)",
  borderColor: "var(--ui-field-invalid-border)",
}

/**
 * Everything every control shares, and every state it can be in.
 *
 * The four state overrides are in this block rather than beside it because
 * each one overrides `border-color` or `background`, which this block
 * declares. In a separate `css()` block they would lose to it whenever their
 * sub-layer happened to register first, and sub-layer order follows render
 * order rather than source order. Do not split them out. See "Cascade layers"
 * in docs/design-system.md.
 *
 * `&:user-invalid` and `&[aria-invalid="true"]` are the two sources of
 * invalidity, native and server-supplied, and they deliberately read the same
 * tokens. `:invalid` is not used: it matches an empty required field on first
 * paint, so every form would load pre-reddened. `:user-invalid` is Chrome 119,
 * so Chrome 114 through 118 gets no invalid styling — the validation bubble
 * still blocks submission there, so the field is unstyled rather than dead.
 *
 * Padding is longhand throughout, including `padding-block` itself:
 * `padding-block` is shorthand over `padding-block-start`/`padding-block-end`,
 * so declaring it here would conflict with a kind block that later declares
 * `padding-block-end` while `sharedProperties()` saw two different names and
 * passed. `background` stays a shorthand, deliberately, as Button's tones do,
 * so a skin may set `--ui-field-bg` to a gradient.
 *
 * No `outline` anywhere. The reset's `:where(:focus-visible)` rule owns the
 * focus ring, and it applies because nothing here competes with it.
 */
const controlBase = css({
  borderStyle: "solid",
  borderWidth: "var(--ui-field-border-width)",
  borderColor: "var(--ui-field-border)",
  borderRadius: "var(--ui-field-radius)",
  background: "var(--ui-field-bg)",
  color: "var(--ui-field-ink)",
  fontSize: "var(--ui-field-font-size)",
  inlineSize: "100%",
  paddingBlockStart: "var(--ui-field-pad-y)",
  paddingBlockEnd: "var(--ui-field-pad-y)",
  paddingInlineStart: "var(--ui-field-pad-x)",
  "&::placeholder": {
    color: "var(--ui-field-placeholder-ink)",
  },
  "&:disabled": {
    background: "var(--ui-field-disabled-bg)",
    borderColor: "var(--ui-field-disabled-border)",
    color: "var(--ui-field-disabled-ink)",
    cursor: "not-allowed",
  },
  "&[readonly]": {
    background: "var(--ui-field-readonly-bg)",
  },
  "&:user-invalid": invalidDeclarations,
  '&[aria-invalid="true"]': invalidDeclarations,
})

/**
 * The box metrics an input takes. Disjoint from `controlBase`, which declares
 * neither `height` nor `padding-inline-end`.
 */
const inputBox = css({
  height: "var(--ui-field-height)",
  paddingInlineEnd: "var(--ui-field-pad-x)",
})

/**
 * A textarea's metrics. No `height`: it is as tall as its `rows`, and a fixed
 * height would fight that. `resize: vertical` rather than `both`, because
 * horizontal resize breaks the surrounding layout.
 */
const textareaBox = css({
  paddingInlineEnd: "var(--ui-field-pad-x)",
  resize: "vertical",
})

export function Field(handle: Handle<FieldProps>) {
  return () => {
    const props = handle.props
    const { name, label, hint, error, required, disabled, mix } = props
    const stem = props.id ?? name
    const hintId = `${stem}-hint`
    const errorId = `${stem}-error`
    // Only the ids that actually rendered. An aria-describedby naming an id
    // the document does not hold is read as nothing by some assistive
    // technology and skipped entirely by others.
    const described = [hint === undefined ? "" : hintId, error === undefined ? "" : errorId]
      .filter((id) => id !== "")
      .join(" ")
    const describedBy = described === "" ? undefined : described
    const invalid = error === undefined ? undefined : "true"

    const control = () => {
      switch (props.control) {
        case "textarea":
          return (
            <textarea
              aria-describedby={describedBy}
              aria-invalid={invalid}
              disabled={disabled}
              id={stem}
              maxlength={props.maxlength}
              minlength={props.minlength}
              mix={[controlBase, textareaBox]}
              name={name}
              placeholder={props.placeholder}
              readOnly={props.readonly}
              required={required}
              rows={props.rows}
              value={props.value}
            />
          )
        default:
          return (
            <input
              aria-describedby={describedBy}
              aria-invalid={invalid}
              autocomplete={props.autocomplete}
              disabled={disabled}
              id={stem}
              max={props.max}
              maxlength={props.maxlength}
              min={props.min}
              minlength={props.minlength}
              mix={[controlBase, inputBox]}
              name={name}
              pattern={props.pattern}
              placeholder={props.placeholder}
              readonly={props.readonly}
              required={required}
              step={props.step}
              type={inputTypeAttribute(props.type)}
              value={props.value}
            />
          )
      }
    }

    return (
      <div mix={[fieldBase, mix]}>
        <label for={stem} mix={labelStyle}>
          {label}
          {required === true ? (
            <span aria-hidden="true" mix={requiredStyle}>
              {" *"}
            </span>
          ) : undefined}
        </label>
        {hint === undefined ? undefined : (
          <p id={hintId} mix={hintStyle}>
            {hint}
          </p>
        )}
        {control()}
        {error === undefined ? undefined : (
          <p id={errorId} mix={errorStyle}>
            {error}
          </p>
        )}
      </div>
    )
  }
}
