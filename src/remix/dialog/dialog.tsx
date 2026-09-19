import { css, type Handle, type MixInput, type RemixNode } from "remix/ui"
import { Heading } from "../heading/heading.tsx"
import type { Invocation } from "../invocation.ts"

const duration = "var(--ui-dialog-transition-duration)"
const timing = `${duration} var(--ui-dialog-transition-easing)`
const offset = "0 calc(var(--ui-dialog-enter-offset) * -1)"

/**
 * The panel, its entry and its exit.
 *
 * `display` is declared **only** inside `&[open]`, and moving it is how this
 * component breaks. A closed `<dialog>` is `display: none` from the user-agent
 * sheet, and any author declaration beats that — cascade layers do not change
 * it, because layered author CSS still outranks the UA origin. A `display:
 * grid` at the top level renders every dialog on the page whether it is open
 * or not.
 *
 * The `transition` shorthand is declared twice, per docs/motion.md: the first
 * keeps `opacity` and `translate` moving on an engine with no
 * `transition-behavior`, the second upgrades it where there is one. A
 * JavaScript object cannot hold the same key twice, so the second sits in a
 * nested `&` block — CSS nesting gives it the same specificity, later in
 * source order, and where `allow-discrete` is unknown the whole declaration is
 * invalid and dropped, leaving the first. The first copy's selector list is
 * `&, &::backdrop`, so the backdrop's own fade rides the same base transition
 * rather than a third declaration: `overlay`/`display` are meaningless on a
 * pseudo-element with neither, so only the panel's own `&` gets the upgrade.
 *
 * `@starting-style` targets `&[open]`, the state being entered. Targeting the
 * resting state is the most common way to get nothing.
 *
 * `overlay` is not Baseline and is absent in Safari, so the exit animation
 * degrades there while the entry animation works. That is accepted rather than
 * replaced with a JavaScript close sequence.
 */
const panelStyle = css({
  maxInlineSize: "min(var(--ui-dialog-max-inline-size), calc(100% - var(--ui-dialog-inset) * 2))",
  maxBlockSize: "calc(100% - var(--ui-dialog-inset) * 2)",
  overflow: "auto",
  gap: "var(--ui-dialog-gap)",
  padding: "var(--ui-dialog-pad)",
  background: "var(--ui-dialog-bg)",
  color: "var(--ui-dialog-ink)",
  borderStyle: "solid",
  borderWidth: "var(--ui-dialog-border-width)",
  borderColor: "var(--ui-dialog-border)",
  borderRadius: "var(--ui-dialog-radius)",
  boxShadow: "var(--ui-dialog-shadow)",
  opacity: 0,
  translate: offset,
  "&, &::backdrop": {
    transition: `opacity ${timing}, translate ${timing}`,
  },
  "&": {
    transition: `opacity ${timing}, translate ${timing}, overlay ${duration} allow-discrete, display ${duration} allow-discrete`,
  },
  "&[open]": {
    display: "grid",
    opacity: 1,
    translate: "0",
  },
  "&::backdrop": {
    background: "var(--ui-dialog-backdrop-bg)",
    opacity: 0,
  },
  "&[open]::backdrop": {
    opacity: 1,
  },
  "@starting-style": {
    "&[open]": { opacity: 0, translate: offset },
    "&[open]::backdrop": { opacity: 0 },
  },
})

const headerStyle = css({
  display: "flex",
  alignItems: "start",
  justifyContent: "space-between",
  gap: "var(--ui-dialog-header-gap)",
})

/**
 * The × is this component's own button rather than a `Button`, because an
 * icon-only button is a square sized by its glyph and `Button` declares
 * `height` and `padding-inline` from its own tokens. Overriding those through
 * `mix` is the thing `mix` cannot reliably do: each `css()` block is its own
 * cascade sub-layer and sub-layer order follows first render, not array order.
 *
 * No `outline`: the reset's `:where(:focus-visible)` rule owns the focus ring.
 */
const closeStyle = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  inlineSize: "var(--ui-dialog-close-size)",
  blockSize: "var(--ui-dialog-close-size)",
  borderStyle: "none",
  borderRadius: "var(--ui-dialog-close-radius)",
  background: "var(--ui-dialog-close-bg)",
  color: "var(--ui-dialog-close-ink)",
  cursor: "pointer",
  "&:hover": {
    background: "var(--ui-dialog-close-bg-hover)",
    color: "var(--ui-dialog-close-ink-hover)",
  },
})

/**
 * Real markup rather than a `background-image` data URI, for the reason
 * Field's chevron gives: `var()` does not resolve inside `url()`, so that
 * glyph's colour would be a literal no theme could retune.
 */
const glyphStyle = css({
  inlineSize: "var(--ui-dialog-close-glyph-size)",
  blockSize: "var(--ui-dialog-close-glyph-size)",
})

export interface DialogPanelProps {
  /** Minted by `overlay()`. Also the stem of the title's id. */
  id: string
  /** Required: a modal with no accessible name is a broken modal. */
  title: string
  /** The dismissal, minted by `overlay()` alongside the id. */
  close: Invocation
  /**
   * Adds properties the panel does not declare. It does not reliably override
   * one it does — sub-layer order, not array order, decides — so reach for the
   * `--ui-dialog-*` token instead.
   */
  mix?: MixInput<HTMLDialogElement> | undefined
  children?: RemixNode | undefined
}

/**
 * Internal to the layer: `src/remix/index.ts` publishes `overlay()` and not
 * this, so no caller can render a dialog whose id was not minted with its
 * trigger.
 */
export function DialogPanel(handle: Handle<DialogPanelProps>) {
  return () => {
    const { id, title, close, mix, children } = handle.props
    const titleId = `${id}-title`
    return (
      <dialog aria-labelledby={titleId} id={id} mix={[panelStyle, mix]}>
        <header mix={headerStyle}>
          <Heading id={titleId} level={2}>
            {title}
          </Heading>
          <button
            aria-label="Close"
            command={close.command}
            commandfor={close.commandfor}
            mix={closeStyle}
            type="button"
          >
            <svg aria-hidden="true" fill="none" mix={glyphStyle} viewBox="0 0 12 12">
              <path
                d="M3.5 3.5L8.5 8.5M8.5 3.5L3.5 8.5"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="1.5"
              />
            </svg>
          </button>
        </header>
        {children}
      </dialog>
    )
  }
}
