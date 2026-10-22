/**
 * AppBar's contract: a record's head, a phone's app bar below its breakpoint.
 *
 * The title has two sizes: `title-size-wide` heads a page on a wide screen,
 * `title-size` sits in a phone's bar at the body's size, since the bar is
 * chrome and the page under it the reading. The way back is a control's
 * height, a thumb's target on a phone; `back-inset` is how far it hangs into
 * the gutter, so its glyph, not its box, lines up with the page's edge.
 */
export const appBarTokens = {
  "ui-appbar-bg": "var(--canvas)",
  "ui-appbar-gap": "var(--sp-2)",
  "ui-appbar-pad-y": "var(--sp-1)",
  "ui-appbar-back-size": "var(--control-h)",
  "ui-appbar-back-inset": "var(--sp-2)",
  "ui-appbar-back-radius": "var(--r-md)",
  "ui-appbar-back-ink": "var(--ink-muted)",
  "ui-appbar-back-ink-hover": "var(--ink)",
  "ui-appbar-back-bg-pressed": "var(--surface-hover)",
  "ui-appbar-title-size": "var(--fs-md)",
  "ui-appbar-title-size-wide": "var(--fs-lg)",
  "ui-appbar-title-weight": "var(--fw-bold)",
  "ui-appbar-title-tracking": "var(--tr-tight)",
  "ui-appbar-title-leading": "var(--lh-snug)",
  "ui-appbar-subtitle-ink": "var(--ink-muted)",
  "ui-appbar-subtitle-size": "var(--fs-xs)",
  "ui-appbar-subtitle-leading": "var(--lh-snug)",
  "ui-appbar-slot-gap": "var(--sp-1)",
} as const
