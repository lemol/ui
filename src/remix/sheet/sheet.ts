import type { css } from "remix/component"

type Styles = Parameters<typeof css>[0]

/** A block under a selector only known at the call, which a literal key cannot name. */
const under = (selector: string, rules: Styles): Styles => ({ [selector]: rules }) as Styles

/**
 * The width under which an overlay becomes a sheet: docked to the bottom
 * edge, the screen's width, sliding up from below, as a phone's own sheets
 * do. A thumb reaches the bottom of a phone, not a menu opened under a
 * trigger near its top, and a dialog centred on a 390px screen is a box with
 * a margin nobody uses.
 *
 * Not a token, and it cannot be one: every token is emitted as a custom
 * property, and a media condition cannot read `var()`. Exported so an app
 * that lays its own pages out around the same width can name it.
 */
export const sheetBreakpoint = "40rem"

export const sheetMedia = `@media (width < ${sheetBreakpoint})`

/**
 * The rules that turn an overlay into a sheet, for a component to spread into
 * its own `css()` block under `sheetMedia`, after any `@supports` block that
 * anchors it, so these win by source order.
 *
 * `open` is the overlay's open state as a nested selector — `&[open]` for a
 * dialog, `&:popover-open` for a popover — and `pad` the inline padding it
 * already keeps, which the sheet adds the home indicator's inset to at its
 * foot. Only the slide moves: a sheet is opaque from its first frame, as a
 * phone draws one.
 */
export const sheetRules = (open: string, pad: string): Styles => ({
  position: "fixed",
  insetBlock: "auto 0",
  insetInline: "0",
  margin: "0",
  inlineSize: "100%",
  maxInlineSize: "100%",
  // Clear of a notch or a status bar drawn over the page, as well as its inset.
  maxBlockSize: "calc(100dvh - var(--ui-sheet-inset) - env(safe-area-inset-top))",
  overflow: "auto",
  overscrollBehavior: "contain",
  positionArea: "none",
  borderInlineWidth: "0",
  borderBlockEndWidth: "0",
  borderStartStartRadius: "var(--ui-sheet-radius)",
  borderStartEndRadius: "var(--ui-sheet-radius)",
  borderEndStartRadius: "0",
  borderEndEndRadius: "0",
  paddingBlockEnd: `calc(${pad} + env(safe-area-inset-bottom))`,
  opacity: 1,
  translate: "0 100%",
  transitionDuration: "var(--ui-sheet-transition-duration)",
  transitionTimingFunction: "var(--ui-sheet-transition-easing)",
  ...under(open, { translate: "0" }),
  "@starting-style": under(open, { translate: "0 100%" }),
  "&::backdrop": { background: "var(--ui-sheet-backdrop-bg)" },
})
