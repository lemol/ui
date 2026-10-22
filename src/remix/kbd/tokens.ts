/**
 * Kbd's contract: a key cap, quiet enough to sit in a line of hints and
 * distinct enough to read as a key rather than as code.
 *
 * The bottom edge is its own width token so a skin can give the cap a
 * keyboard's heavier lower lip; both widths are border widths, which the
 * schema has no primitive for.
 */
export const kbdTokens = {
  "ui-kbd-bg": "var(--surface-raised)",
  "ui-kbd-ink": "var(--ink-muted)",
  "ui-kbd-border": "var(--hairline)",
  "ui-kbd-border-width": "1px",
  "ui-kbd-border-bottom-width": "2px",
  "ui-kbd-radius": "var(--r-sm)",
  "ui-kbd-pad-x": "var(--sp-1)",
  "ui-kbd-font-size": "var(--fs-xs)",
  "ui-kbd-font-weight": "var(--fw-medium)",
  "ui-kbd-leading": "var(--lh-snug)",
  "ui-kbd-gap": "var(--sp-1)",
} as const
