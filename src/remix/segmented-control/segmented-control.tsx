import { css, type Handle, type MixInput } from "remix/component"

/**
 * Visually hidden rather than removed: `display: none` would take the radio
 * out of the accessibility tree and out of tab order along with it, the same
 * reasoning the skip link in `mini/shell.tsx` gives for `clip-path` over
 * `display: none`. The visible surface is the `<label>` that wraps it.
 */
const hiddenInputStyle = css({
  position: "absolute",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  borderStyle: "none",
  inlineSize: "1px",
  blockSize: "1px",
  overflow: "hidden",
})

/**
 * The track. `grid-template-columns` names a literal column count, the same
 * structural (not themeable) value `Grid`'s own `columnStyles` uses.
 */
const trackStyle = (count: number) =>
  css({
    position: "relative",
    display: "inline-grid",
    gridTemplateColumns: `repeat(${count}, 1fr)`,
    padding: "var(--ui-segmented-track-pad)",
    background: "var(--ui-segmented-track-bg)",
    borderRadius: "var(--ui-segmented-radius)",
  })

/**
 * The sliding fill, positioned by `translate` rather than `grid-column`:
 * `grid-column` is not an interpolable value, so a transition on it would
 * snap between segments instead of sliding. `translate: <n>00%` moves it
 * exactly `n` of its own widths — a percentage in `translate` resolves
 * against the element's own box — so one width-sized element plus an integer
 * multiplier reaches every segment with no per-instance measurement.
 *
 * One `:where(...) &` rule per segment, keyed by `label:nth-of-type(n)`
 * rather than by id: position among sibling `<label>`s is all a purely
 * positional, id-free rule needs, and it is what lets `trackStyle` and this
 * block be cached by `count` alone, like `Grid`'s `columnStyles`.
 *
 * The `:where(...)` wrapper exists only so the key starts with `:` — `remix/
 * ui`'s `css()` treats a nested-rule key as a selector solely by its first
 * character (`&`, `@`, `:`, `[` or `.`); `fieldset:has(...) &` fails that
 * silently and renders as `[object Object]` (see `disclosure.tsx`'s own note
 * on the same trap).
 */
const indicatorStyle = (count: number) =>
  css({
    position: "absolute",
    insetBlockStart: "var(--ui-segmented-track-pad)",
    insetBlockEnd: "var(--ui-segmented-track-pad)",
    insetInlineStart: "var(--ui-segmented-track-pad)",
    inlineSize: `calc((100% - var(--ui-segmented-track-pad) * 2) / ${count})`,
    background: "var(--ui-segmented-active-bg)",
    borderRadius: "var(--ui-segmented-active-radius)",
    boxShadow: "var(--ui-segmented-active-shadow)",
    translate: "0",
    pointerEvents: "none",
    transitionProperty: "translate",
    transitionDuration: "var(--ui-segmented-transition-duration)",
    transitionTimingFunction: "var(--ui-segmented-transition-easing)",
    ...Object.fromEntries(
      Array.from({ length: count }, (_, index) => [
        `:where(fieldset:has(label:nth-of-type(${index + 1}) input:checked)) &`,
        { translate: `${index * 100}%` },
      ]),
    ),
  })

const labelStyle = css({
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  paddingInline: "var(--ui-segmented-label-pad-x)",
  paddingBlock: "var(--ui-segmented-label-pad-y)",
  borderRadius: "var(--ui-segmented-active-radius)",
  fontSize: "var(--ui-segmented-label-font-size)",
  fontWeight: "var(--ui-segmented-label-font-weight)",
  color: "var(--ui-segmented-label-ink)",
  cursor: "pointer",
  transitionProperty: "color",
  transitionDuration: "var(--ui-segmented-transition-duration)",
  transitionTimingFunction: "var(--ui-segmented-transition-easing)",
  "&:has(input:checked)": {
    color: "var(--ui-segmented-label-ink-active)",
  },
  "&:has(input:disabled)": {
    color: "var(--ui-segmented-disabled-ink)",
    cursor: "not-allowed",
  },
  // The ring moves here because the input it belongs to is visually hidden —
  // see hiddenInputStyle. The reset's own `:where(:focus-visible)` rule reads
  // the same two primitives, so this is that rule relocated, not a second one.
  "&:has(input:focus-visible)": {
    outline: "var(--focus-ring)",
    outlineOffset: "var(--focus-ring-offset)",
  },
})

const legendStyle = css({
  position: "absolute",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  inlineSize: "1px",
  blockSize: "1px",
  overflow: "hidden",
})

export interface SegmentedControlOption {
  readonly value: string
  readonly label: string
}

export interface SegmentedControlProps {
  /** Required. Names the value in the submission, and groups the radios natively. */
  name: string
  /** Required. An unlabelled group is a broken group — rendered as a visually hidden `<legend>`. */
  label: string
  /** At least two, or there is nothing to segment. */
  options: readonly SegmentedControlOption[]
  /** The selected value. Uncontrolled, like every other native form control here. */
  value?: string | undefined
  disabled?: boolean | undefined
  mix?: MixInput<HTMLFieldSetElement> | undefined
}

export function SegmentedControl(handle: Handle<SegmentedControlProps>) {
  return () => {
    const { name, label, options, value, disabled, mix } = handle.props

    return (
      <fieldset disabled={disabled} mix={[trackStyle(options.length), mix]}>
        <legend mix={legendStyle}>{label}</legend>
        <div mix={indicatorStyle(options.length)} />
        {options.map((option) => (
          <label key={option.value} mix={labelStyle}>
            <input
              checked={option.value === value}
              mix={hiddenInputStyle}
              name={name}
              type="radio"
              value={option.value}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
    )
  }
}
