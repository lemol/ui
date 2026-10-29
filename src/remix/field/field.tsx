import { type Handle, type MixInput, type RemixNode } from "remix/component"
import { css } from "../css.ts"
import { givenProps } from "../form-control.ts"
import { animation, keyframes } from "../motion/motion.ts"

/**
 * `<selectedcontent>`, the element a customizable select clones its chosen
 * option into. `remix/component`'s JSX does not know it yet; this names it
 * with no attributes, which is all the platform reads from it.
 */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      selectedcontent: Record<string, never>
    }
  }
}

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
  /**
   * Rendered under the control, as a description, and named by its
   * `aria-describedby`, so a screen reader still reads it the moment the
   * control takes focus. Under rather than above so that fields set side by
   * side keep their controls on one line whatever each one's hint says: a
   * long hint above pushed its control below its neighbour's.
   *
   * `""` is treated the same as `undefined` — absent — rather than as a
   * message to render. `""` is the obvious way a form controller encodes "no
   * hint for this field", and rendering it would still add an empty `<p>` and
   * an `aria-describedby` that points at it.
   */
  hint?: string | undefined
  /**
   * A server-supplied error, for the half of validation no attribute can
   * express: "that address is already registered". Sets `aria-invalid`.
   *
   * It stays set while the user corrects the field, until the next round trip.
   * Clearing it early would need client JavaScript, and Field ships none.
   *
   * `""` is treated the same as `undefined` — absent — rather than as an
   * error to render. `""` is the obvious way a form controller encodes "no
   * error for this field", and a bare falsy check would already have caught
   * it; the reason to say so explicitly is that treating it as a value
   * instead would redden the control, set `aria-invalid="true"`, and point
   * `aria-describedby` at an empty paragraph — a false positive with no
   * message to show for it.
   */
  error?: string | undefined
  /**
   * Replaces the id stem, for two forms on one page sharing a field name.
   *
   * `""` is treated the same as `undefined` — absent — for the same reason
   * `hint` and `error` are: a controller writing `id={override ?? ""}` is
   * ordinary, and falling through to `name` at least keeps the label bound to
   * something rather than emitting `for=""`/`id=""`, which bind nothing.
   * `name` and `label` get no such treatment — they are required, so there is
   * no fallback value to fall through *to*.
   */
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
  /**
   * The value, controlled. In a hydrated component the runtime puts it back
   * after every keystroke until a render passes a new one, so the component
   * that passes it updates it on `input`. A form that never hydrates can pass
   * either this or `defaultValue`.
   */
  value?: string | undefined
  /**
   * The starting value, and the person's after that: for a field in a
   * hydrated component whose form, not the component, holds what was typed.
   * The server renders it as the same `value` attribute.
   */
  defaultValue?: string | undefined
  placeholder?: string | undefined
  minlength?: number | undefined
  maxlength?: number | undefined
}

export interface FieldInputProps extends FieldEditable {
  control?: "input" | undefined
  /** Defaults to `text`, which is also what a bare input defaults to. */
  type?: FieldType | undefined
  autocomplete?: string | undefined
  /**
   * The keyboard a phone offers, for a text field whose value is a number:
   * `numeric` for a count, `decimal` for an amount. A `type="number"` input
   * would bring spinners and refuse what it cannot parse before the server
   * can say why.
   */
  inputmode?: "numeric" | "decimal" | undefined
  pattern?: string | undefined
  min?: string | number | undefined
  max?: string | number | undefined
  step?: string | number | undefined
}

export interface FieldTextareaProps extends FieldEditable {
  control: "textarea"
  rows?: number | undefined
}

export interface FieldSelectProps extends FieldCommon {
  control: "select"
  /**
   * The `<option>`s. Required, because a select with none is an empty box.
   *
   * There is no `value` prop, and that is not an omission. `<select>` has no
   * `value` content attribute — the IDL property exists, the attribute does
   * not — so rendering one emits invalid markup that selects nothing. The
   * chosen option carries `selected`, which is where HTML puts it.
   *
   * There is no `readonly` either, for the same reason: HTML gives `select` no
   * such attribute, so the prop would render something inert. That is why
   * `readonly` sits on `FieldEditable` rather than on `FieldCommon`.
   */
  children: RemixNode
}

/**
 * The union grows a member per task because it has to. Narrowing an optional
 * discriminant works only when every other member has its own `case`, so a
 * task that declared `FieldSelectProps` before it dispatched on
 * `control === "select"` would leave every input-only property unreachable
 * and the package would not compile.
 */
export type FieldProps = FieldInputProps | FieldTextareaProps | FieldSelectProps

/**
 * The `type` attribute, narrowed to one literal for the compiler's benefit.
 *
 * `remix/component` types `<input>` as a union discriminated on `type`, so that each
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
 * The cost is real and worth naming: if a future `remix/component` adds an arm that
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

// A server-invalid control shakes as it is inserted: frame navigation replaces
// the control after a failed submission, so the shake is the round-trip signal.
// `:user-invalid` does not shake, since blur is not that signal.
const errorTiming = {
  duration: "var(--ui-field-error-duration)",
  easing: "var(--ui-field-error-easing)",
}

const clearTiming = "var(--ui-field-clear-duration) var(--ui-field-clear-easing)"

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
  '&[aria-invalid="true"]': { ...invalidDeclarations, animation: animation("shake", errorTiming) },
})

/**
 * The clear button a search input draws, dissolved in and out on its own
 * tokens: a skin slowing the shake should not slow the clear. A vendor
 * pseudo-element, so an engine without it drops the rule whole, which is the
 * documented degradation.
 */
const searchClear = css({
  "&::-webkit-search-cancel-button": {
    transition: `opacity ${clearTiming}`,
  },
})

/**
 * The box metrics an input takes. Disjoint from `controlBase`, which declares
 * neither `height` nor the end or block padding.
 */
const inputBox = css({
  height: "var(--ui-field-height)",
  paddingBlockStart: "var(--ui-field-pad-y)",
  paddingBlockEnd: "var(--ui-field-pad-y)",
  paddingInlineEnd: "var(--ui-field-pad-x)",
})

/**
 * A textarea's metrics. No `height`: it is as tall as its `rows`, and a fixed
 * height would fight that. `resize: vertical` rather than `both`, because
 * horizontal resize breaks the surrounding layout.
 */
const textareaBox = css({
  paddingBlockStart: "var(--ui-field-pad-y)",
  paddingBlockEnd: "var(--ui-field-pad-y)",
  paddingInlineEnd: "var(--ui-field-pad-x)",
  resize: "vertical",
})

/**
 * The frame that lets the chevron overlay the control.
 *
 * A grid with one implicit cell, rather than `position: relative` with an
 * absolutely positioned chevron: both the control and the glyph take
 * `grid-area: 1 / 1`, so centring is `align-self` instead of a `50%` offset
 * and a translate. No stacking context, and no magic numbers.
 */
const selectFrame = css({
  display: "grid",
})

const pickerDuration = "var(--ui-field-picker-transition-duration)"
const pickerTiming = `${pickerDuration} var(--ui-field-picker-transition-easing)`
const pickerEnter = "0 calc(var(--ui-field-picker-enter-offset) * -1)"

/**
 * The customizable select, where the engine has it (Chrome 135, Safari 27):
 * `appearance: base-select` on the select and on its `::picker(select)` turns
 * the list into a styleable top-layer popover that is still the native
 * control — the keyboard model, the screen reader's reading, form submission
 * and validation are all the platform's. Elsewhere the `@supports` gate drops
 * the lot and the select stays the plain one above, so there is no fallback to
 * write.
 *
 * Kept inside `selectBox`'s own block rather than a block of its own, because
 * it redeclares `appearance`, which that block declares: in a second block,
 * sub-layer order would decide which one wins. That makes this the later
 * sub-layer over `controlBase`, so the pointer and the prompt's ink wait for
 * `:enabled`: unconditional, they beat `controlBase`'s disabled cursor and ink.
 *
 * The platform's own picker icon is hidden; the drawn chevron beside the
 * control stays the one arrow in both engines. The checkmark moves to the
 * option's end edge, after its label, as a menu marks its chosen row.
 *
 * The list enters and leaves as Popover's surface does (docs/motion.md), on
 * duration tokens reduced motion zeroes. One `transition`, not Popover's two:
 * every engine that draws this list parses `allow-discrete`, which is what the
 * second declaration exists for. The closed state is written on
 * `:not(:open)` rather than on the picker itself, so an engine that draws the
 * list without knowing `:open` drops that rule and shows a list that does not
 * move, where a hidden resting state would never show it at all.
 */
const pickerRules = {
  "&, &::picker(select)": { appearance: "base-select" },
  "&": { display: "flex", alignItems: "center" },
  "&:enabled": { cursor: "pointer" },
  "&::picker-icon": { display: "none" },
  "&::picker(select)": {
    borderStyle: "solid",
    borderWidth: "var(--ui-field-border-width)",
    borderColor: "var(--ui-field-picker-border)",
    borderRadius: "var(--ui-field-picker-radius)",
    background: "var(--ui-field-picker-bg)",
    color: "var(--ui-field-picker-ink)",
    boxShadow: "var(--ui-field-picker-shadow)",
    padding: "var(--ui-field-picker-pad)",
    marginBlock: "var(--ui-field-picker-gap)",
    transition: `opacity ${pickerTiming}, translate ${pickerTiming}, overlay ${pickerDuration} allow-discrete, display ${pickerDuration} allow-discrete`,
  },
  "&:not(:open)::picker(select)": { opacity: 0, translate: pickerEnter },
  "@starting-style": { "&:open::picker(select)": { opacity: 0, translate: pickerEnter } },
  "& option": {
    display: "flex",
    alignItems: "center",
    gap: "var(--ui-field-option-gap)",
    paddingInline: "var(--ui-field-option-pad-x)",
    paddingBlock: "var(--ui-field-option-pad-y)",
    borderRadius: "var(--ui-field-option-radius)",
    cursor: "pointer",
  },
  "& option:hover, & option:focus-visible": {
    background: "var(--ui-field-option-bg-hover)",
    outline: "none",
  },
  "& option:checked": { fontWeight: "var(--ui-field-option-checked-weight)" },
  "& option::checkmark": {
    order: "1",
    marginInlineStart: "auto",
    color: "var(--ui-field-option-check-ink)",
  },
  "& selectedcontent": {
    display: "block",
    minInlineSize: "0",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  // A flex box would clip with no ellipsis; an inline child keeps the gap the
  // flex row gave.
  "& selectedcontent > *": {
    display: "inline",
    verticalAlign: "middle",
    marginInlineEnd: "var(--ui-field-option-gap)",
  },
  // The empty choice is a prompt, not a value: it reads as a placeholder.
  "&:enabled:has(option[value='']:checked)": { color: "var(--ui-field-placeholder-ink)" },
  // A required select's prompt is not a choice its list offers: the closed
  // select still says "Choose one", and the list holds only what can be sent.
  "&:required option[value='']": { display: "none" },
}

/**
 * `appearance: none` is what lets a select match an input, and it takes the
 * disclosure arrow with it — hence the chevron below.
 *
 * No block padding, unlike an input and a textarea. Chromium lays a select's
 * text out from the top of its content box, so `--ui-field-pad-y` twice plus
 * a line of text taller than `--ui-field-height` clips the text at the bottom
 * — which a skin with a larger type step or a compact height reaches. With
 * none, the text centres in the fixed height the way an input's does.
 *
 * The end padding is a calc() whose two terms are both tokens. field.test.tsx
 * decomposes a calc() rather than allowing it wholesale, so a literal
 * smuggled in here still fails.
 */
const selectBox = css({
  gridArea: "1 / 1",
  appearance: "none",
  height: "var(--ui-field-height)",
  paddingInlineEnd: "calc(var(--ui-field-pad-x) + var(--ui-field-chevron-space))",
  "@supports (appearance: base-select)": pickerRules,
})

/**
 * Every select's button, which the platform sets where the closed select's
 * label would be, so the closed select shows the chosen option's whole content
 * (an icon beside its label). The platform's own label is a UA-shadow box no
 * author rule can cut with an ellipsis. It draws no box of its own — the select
 * is the box — so it takes the select's font and ink and lays the cloned option
 * out on one row. An engine without customizable select drops it while parsing.
 */
const selectButtonStyle = css({
  display: "flex",
  alignItems: "center",
  minInlineSize: "0",
  padding: "0",
  borderStyle: "none",
  background: "none",
  font: "inherit",
  color: "inherit",
})

/**
 * The chevron. Real markup, so its colour is a token like every other
 * property and a dark scheme reaches it. A `background-image` data URI could
 * not: `var()` does not resolve inside `url()`, so that arrow's colour would
 * be a literal no theme can retune.
 *
 * `pointer-events: none` because a click on the glyph is a click meant for the
 * select underneath it.
 */
const chevronStyle = css({
  gridArea: "1 / 1",
  alignSelf: "center",
  justifySelf: "end",
  marginInlineEnd: "var(--ui-field-pad-x)",
  inlineSize: "var(--ui-field-chevron-size)",
  blockSize: "var(--ui-field-chevron-size)",
  color: "var(--ui-field-chevron-ink)",
  pointerEvents: "none",
})

export function Field(handle: Handle<FieldProps>) {
  return () => {
    const props = handle.props
    const { name, label, hint, error, required, disabled, mix } = props
    const stem = props.id !== undefined && props.id !== "" ? props.id : name
    const hintId = `${stem}-hint`
    const errorId = `${stem}-error`
    // Only the ids that actually rendered. An aria-describedby naming an id
    // the document does not hold is read as nothing by some assistive
    // technology and skipped entirely by others.
    const hasHint = hint !== undefined && hint !== ""
    const hasError = error !== undefined && error !== ""
    const described = [hasHint ? hintId : "", hasError ? errorId : ""]
      .filter((id) => id !== "")
      .join(" ")

    const describedBy = described === "" ? undefined : described
    const invalid = hasError ? "true" : undefined

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
              mix={[controlBase, keyframes.shake, textareaBox]}
              name={name}
              placeholder={props.placeholder}
              // camelCase, unlike the input branch's `readonly=`: remix/component's
              // TextareaHTMLProps declares only `readOnly`, where
              // PartialInputHTMLProps declares both spellings. It still emits
              // lowercase `readonly` in the markup, so behaviour and the
              // `&[readonly]` selector are unaffected.
              readOnly={props.readonly}
              required={required}
              rows={props.rows}
              {...givenProps({ value: props.value, defaultValue: props.defaultValue })}
            />
          )
        case "select":
          return (
            <div mix={selectFrame}>
              <select
                aria-describedby={describedBy}
                aria-invalid={invalid}
                disabled={disabled}
                id={stem}
                mix={[controlBase, keyframes.shake, selectBox]}
                name={name}
                required={required}
              >
                <button mix={selectButtonStyle} type="button">
                  <selectedcontent />
                </button>
                {props.children}
              </select>
              <svg aria-hidden="true" fill="none" mix={chevronStyle} viewBox="0 0 12 12">
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                />
              </svg>
            </div>
          )
        default:
          return (
            <input
              aria-describedby={describedBy}
              aria-invalid={invalid}
              autocomplete={props.autocomplete}
              inputmode={props.inputmode}
              disabled={disabled}
              id={stem}
              max={props.max}
              maxlength={props.maxlength}
              min={props.min}
              minlength={props.minlength}
              mix={[
                controlBase,
                keyframes.shake,
                inputBox,
                ...(props.type === "search" ? [searchClear] : []),
              ]}
              name={name}
              pattern={props.pattern}
              placeholder={props.placeholder}
              readonly={props.readonly}
              required={required}
              step={props.step}
              type={inputTypeAttribute(props.type)}
              {...givenProps({ value: props.value, defaultValue: props.defaultValue })}
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
        {control()}
        {hasHint ? (
          <p id={hintId} mix={hintStyle}>
            {hint}
          </p>
        ) : undefined}
        {hasError ? (
          <p id={errorId} mix={errorStyle}>
            {error}
          </p>
        ) : undefined}
      </div>
    )
  }
}
