import { css, type Handle, type MixInput, type RemixNode } from "remix/component"
import { invoke } from "../invocation.ts"

/**
 * One facet of a filtered collection, as a data table's toolbar draws it: a
 * dashed button naming what it narrows by, which shows the chosen value once
 * there is one and opens the choices in a native popover.
 *
 * Each choice is a link to the page's own URL with that value set, written by
 * the server, so choosing is a navigation the browser already knows how to
 * make and the runtime can make in place: no client state, nothing to submit,
 * and the popover opens with no script through `command="toggle-popover"`.
 * A facet a list cannot enumerate, such as a free-text tag, passes a form of
 * its own as children instead of options.
 *
 * Built on `invoke()` rather than `popover()`'s trigger, because the trigger
 * is not a `Button`: its dashed edge is a border style `Button` declares
 * itself, which `mix` cannot reliably override. Both halves of the
 * `commandfor` pair are bound here from the one `name`, so neither is a
 * string a caller writes twice.
 */
export interface FacetOption {
  readonly value: string
  readonly label: RemixNode
  /** The page's URL with this value chosen (or, for the chosen one, cleared). */
  readonly href: string
  readonly selected?: boolean | undefined
  /** A drawn mark before the label, hidden from assistive technology by the caller. */
  readonly icon?: RemixNode | undefined
  /** How many the value would leave, dim at the row's end. */
  readonly count?: number | string | undefined
}

const duration = "var(--ui-facet-transition-duration)"
const timing = `${duration} var(--ui-facet-transition-easing)`
const enter = "0 calc(var(--ui-facet-enter-offset) * -1)"

const triggerStyle = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--ui-facet-gap)",
  blockSize: "var(--ui-facet-height)",
  paddingInline: "var(--ui-facet-pad-x)",
  borderStyle: "dashed",
  borderWidth: "var(--ui-facet-border-width)",
  borderColor: "var(--ui-facet-border)",
  borderRadius: "var(--ui-facet-radius)",
  background: "var(--ui-facet-bg)",
  color: "var(--ui-facet-ink)",
  fontFamily: "inherit",
  fontSize: "var(--ui-facet-font-size)",
  fontWeight: "var(--ui-facet-font-weight)",
  whiteSpace: "nowrap",
  cursor: "pointer",
  transitionProperty: "background, border-color",
  transitionDuration: "var(--ui-facet-transition-duration)",
  transitionTimingFunction: "var(--ui-facet-transition-easing)",
  "&:hover": { background: "var(--ui-facet-bg-hover)" },
  "&[data-facet-active]": {
    borderStyle: "solid",
    borderColor: "var(--ui-facet-active-border)",
    background: "var(--ui-facet-active-bg)",
  },
  "& > svg": {
    inlineSize: "var(--ui-facet-icon-size)",
    blockSize: "var(--ui-facet-icon-size)",
    color: "var(--ui-facet-icon-ink)",
    flexShrink: "0",
  },
})

/** The rule between the facet's name and its chosen value. */
const separatorStyle = css({
  alignSelf: "stretch",
  marginBlock: "var(--ui-facet-gap)",
  marginInline: "var(--ui-facet-gap)",
  borderInlineStartStyle: "solid",
  borderInlineStartWidth: "var(--ui-facet-border-width)",
  borderInlineStartColor: "var(--ui-facet-separator)",
})

const valueStyle = css({
  paddingInline: "var(--ui-facet-value-pad-x)",
  borderRadius: "var(--ui-facet-value-radius)",
  background: "var(--ui-facet-value-bg)",
  color: "var(--ui-facet-value-ink)",
})

/**
 * The list: a popover anchored under the trigger's start edge, with
 * Popover's entry and exit (docs/motion.md): the `transition` shorthand twice,
 * `@starting-style` on the open state, `display` only inside it.
 */
const surfaceStyle = css({
  minInlineSize: "var(--ui-facet-surface-min-inline-size)",
  maxInlineSize: "var(--ui-facet-surface-max-inline-size)",
  padding: "var(--ui-facet-surface-pad)",
  borderStyle: "solid",
  borderWidth: "var(--ui-facet-border-width)",
  borderColor: "var(--ui-facet-surface-border)",
  borderRadius: "var(--ui-facet-surface-radius)",
  background: "var(--ui-facet-surface-bg)",
  color: "var(--ui-facet-surface-ink)",
  boxShadow: "var(--ui-facet-surface-shadow)",
  opacity: 0,
  translate: enter,
  transition: `opacity ${timing}, translate ${timing}`,
  "&": {
    transition: `opacity ${timing}, translate ${timing}, overlay ${duration} allow-discrete, display ${duration} allow-discrete`,
  },
  "&:popover-open": { display: "grid", opacity: 1, translate: "0" },
  "@starting-style": { "&:popover-open": { opacity: 0, translate: enter } },
  "@supports (anchor-name: --a)": {
    positionArea: "bottom span-right",
    positionTryFallbacks: "flip-block, flip-inline",
    margin: "var(--ui-facet-surface-offset) 0 0 0",
  },
})

const optionStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "var(--ui-facet-option-gap)",
  paddingInline: "var(--ui-facet-option-pad-x)",
  paddingBlock: "var(--ui-facet-option-pad-y)",
  borderRadius: "var(--ui-facet-option-radius)",
  color: "var(--ui-facet-option-ink)",
  fontSize: "var(--ui-facet-font-size)",
  textDecoration: "none",
  whiteSpace: "nowrap",
  "&:hover, &:focus-visible": { background: "var(--ui-facet-option-bg-hover)" },
})

/** The tick box: empty, or filled with a tick for the chosen value. */
const checkStyle = css({
  display: "inline-grid",
  placeItems: "center",
  flexShrink: "0",
  inlineSize: "var(--ui-facet-icon-size)",
  blockSize: "var(--ui-facet-icon-size)",
  borderStyle: "solid",
  borderWidth: "var(--ui-facet-border-width)",
  borderColor: "var(--ui-facet-check-border)",
  borderRadius: "var(--ui-facet-check-radius)",
  "[aria-checked=true] > &": {
    borderColor: "var(--ui-facet-check-bg-on)",
    background: "var(--ui-facet-check-bg-on)",
    color: "var(--ui-facet-check-ink-on)",
  },
})

const countStyle = css({
  marginInlineStart: "auto",
  paddingInlineStart: "var(--ui-facet-option-gap)",
  color: "var(--ui-facet-option-count-ink)",
  fontVariantNumeric: "tabular-nums",
})

/**
 * The rule above *Clear*. `margin-inline: 0` because an `<hr>` keeps the
 * user agent's `auto` there, and a grid item with auto inline margins is as
 * wide as its content, which for an `<hr>` is nothing.
 */
const ruleStyle = css({
  marginBlock: "var(--ui-facet-surface-pad)",
  marginInline: "0",
  borderStyle: "none",
  borderBlockStartStyle: "solid",
  borderBlockStartWidth: "var(--ui-facet-border-width)",
  borderBlockStartColor: "var(--ui-facet-rule)",
})

/** A circled plus: what a facet with nothing chosen offers. */
/**
 * The plus in a circle, as one path: the circle is two arcs, and the stroke
 * is set once on the `<svg>`. A toolbar draws one per facet on every page.
 */
function PlusMark() {
  return () => (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-width="1.5"
      viewBox="0 0 16 16"
    >
      <path d="M8 1.75a6.25 6.25 0 1 0 0 12.5a6.25 6.25 0 1 0 0-12.5M8 5.25v5.5M5.25 8h5.5" />
    </svg>
  )
}

function Tick() {
  return () => (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
      />
    </svg>
  )
}

export interface FacetFilterProps {
  /**
   * The id stem: the list's id and its anchor. Used verbatim, as `overlay()`
   * uses its name, so it must be unique on the page and the same on every
   * render — derive it from the facet, never from a counter.
   */
  readonly name: string
  /** What the facet narrows by: *Status*, *Project*. */
  readonly label: string
  /** The trigger's mark; the circled plus when absent. */
  readonly icon?: RemixNode | undefined
  /** The choices, as links. */
  readonly options?: ReadonlyArray<FacetOption> | undefined
  /** What the trigger shows once chosen, when it is not an option's label: a typed tag. */
  readonly value?: RemixNode | undefined
  /** Where *Clear* goes: the page's URL without this facet. Absent while nothing is chosen. */
  readonly clear?: string | undefined
  /** The word on the clear link; *Clear filter* by default. */
  readonly clearLabel?: string | undefined
  /** In place of options, or after them: a form of the facet's own. */
  readonly children?: RemixNode | undefined
  /** Adds properties FacetFilter does not declare, to the trigger. */
  readonly mix?: MixInput<HTMLButtonElement> | undefined
}

export function FacetFilter(handle: Handle<FacetFilterProps>) {
  return () => {
    const {
      name,
      label,
      icon,
      options = [],
      value,
      clear,
      clearLabel,
      children,
      mix,
    } = handle.props

    const anchor = `--ui-facet-anchor-${name}`
    const toggle = invoke("toggle-popover", name)
    // With no options the list holds the facet's own form, so it is a dialog
    // named for the facet rather than a menu.
    const form = options.length === 0
    const chosen = options.filter((option) => option.selected === true)
    // A radio group holds one value; a facet showing several is a set of checks.
    const itemRole = chosen.length > 1 ? "menuitemcheckbox" : "menuitemradio"
    const shown =
      value ??
      (chosen.length > 2
        ? `${chosen.length} selected`
        : chosen.length > 0
          ? chosen.map((option) => option.label)
          : undefined)

    const active = shown !== undefined

    return (
      <>
        <button
          aria-haspopup={form ? "dialog" : "menu"}
          command={toggle.command}
          commandfor={toggle.commandfor}
          data-facet={name}
          data-facet-active={active ? "" : undefined}
          mix={[triggerStyle, mix]}
          // The anchor is the one declaration that differs per facet, so it
          // rides in the style attribute and every facet shares one block.
          // An engine without anchor positioning drops the property unread.
          style={`anchor-name: ${anchor}`}
          type="button"
        >
          {icon ?? <PlusMark />}
          <span>{label}</span>
          {active ? (
            <>
              <span aria-hidden="true" mix={separatorStyle} />
              {Array.isArray(shown) ? (
                shown.map((part, index) => (
                  <span key={index} mix={valueStyle}>
                    {part}
                  </span>
                ))
              ) : (
                <span mix={valueStyle}>{shown}</span>
              )}
            </>
          ) : null}
        </button>
        <div
          aria-label={form ? label : undefined}
          id={name}
          mix={surfaceStyle}
          popover="auto"
          role={form ? "dialog" : undefined}
          style={`position-anchor: ${anchor}`}
        >
          {form ? null : (
            <div aria-label={label} role="menu">
              {options.map((option) => (
                <a
                  aria-checked={option.selected === true ? "true" : "false"}
                  href={option.href}
                  key={option.value}
                  mix={optionStyle}
                  role={itemRole}
                >
                  <span mix={checkStyle}>{option.selected === true ? <Tick /> : null}</span>
                  {option.icon}
                  <span>{option.label}</span>
                  {option.count === undefined ? null : <span mix={countStyle}>{option.count}</span>}
                </a>
              ))}
            </div>
          )}
          {children}
          {clear === undefined ? null : (
            <>
              <hr mix={ruleStyle} />
              <a href={clear} mix={optionStyle}>
                {clearLabel ?? "Clear filter"}
              </a>
            </>
          )}
        </div>
      </>
    )
  }
}
