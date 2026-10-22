/**
 * Tabs' contract. Two looks share one tab: `line` underlines the current tab
 * on a rule, `pill` raises it out of a track. Each look has its own tokens,
 * so a skin retunes one without touching the other.
 *
 * Heights come from the sizing group, so density reaches the tabs the way it
 * reaches a button; widths of the rule, the indicator and the focus ring are
 * border widths, which the schema has no primitive for.
 */
export const tabsTokens = {
  "ui-tabs-gap": "var(--sp-1)",
  "ui-tabs-height": "var(--control-h-sm)",
  "ui-tabs-pad-x": "var(--sp-2)",
  "ui-tabs-item-gap": "var(--sp-1)",
  "ui-tabs-font-size": "var(--fs-sm)",
  "ui-tabs-font-weight": "var(--fw-medium)",
  "ui-tabs-ink": "var(--ink-muted)",
  "ui-tabs-ink-hover": "var(--ink)",
  "ui-tabs-ink-current": "var(--ink)",
  "ui-tabs-ink-disabled": "var(--ink-subtle)",
  "ui-tabs-transition-duration": "var(--dur-fast)",
  "ui-tabs-transition-easing": "var(--ease-out-quad)",
  // How far inside a tab its focus ring is drawn, so the scrolling strip
  // cannot clip it: the ring's own width. `--focus-ring` is the whole outline
  // shorthand and its width cannot be read back out of it, so a skin that
  // thickens the ring sets this to match.
  "ui-tabs-ring-inset": "2px",

  // `line`: the tabs stand on a rule, and the current one's indicator covers it.
  "ui-tabs-rule": "var(--hairline)",
  "ui-tabs-rule-width": "1px",
  "ui-tabs-indicator": "var(--ink)",
  "ui-tabs-indicator-width": "2px",

  // `pill`: a recessed track, the current tab raised out of it.
  "ui-tabs-track-bg": "var(--surface-hover)",
  "ui-tabs-track-pad": "var(--sp-1)",
  "ui-tabs-track-radius": "var(--r-md)",
  "ui-tabs-tab-radius": "var(--r-sm)",
  "ui-tabs-current-bg": "var(--surface)",
  "ui-tabs-current-shadow": "var(--shadow-sm)",
} as const
