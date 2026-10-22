/**
 * The sheet's contract: how an overlay looks once a narrow screen docks it to
 * its bottom edge. Shared by every overlay that can become one — Dialog, a
 * popover minted with `{ sheet: true }`, Menu, FacetFilter's list — because a
 * phone's sheets are one family, and a skin retunes them once.
 *
 * `inset` is the room a sheet leaves above itself at its tallest, a space
 * step rather than a viewport fraction, so the page it opened over is always
 * in sight and a tap there closes it. The slide reads the base duration rather
 * than the fast one an overlay's fade uses: a sheet travels its own height,
 * and the same 120ms over that distance reads as a jump.
 */
export const sheetTokens = {
  "ui-sheet-radius": "var(--r-xl)",
  "ui-sheet-inset": "var(--sp-12)",
  "ui-sheet-backdrop-bg": "var(--scrim)",
  "ui-sheet-transition-duration": "var(--dur-base)",
  "ui-sheet-transition-easing": "var(--ease-spring)",
} as const
