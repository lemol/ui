/**
 * CopyButton's contract: the confirmation it plays when `--copy` runs. The
 * button itself is a Button and reads Button's tokens.
 *
 * The duration reads `--dur-fast` and the easing `--ease-out-quad`, so the
 * global reset zeroes the dissolve and the drawn check under
 * `prefers-reduced-motion: reduce`; the label still swaps, only the motion
 * goes. `gap` and `check-size` are space steps, which is what composing from
 * the scale means for a glyph beside its text.
 */
export const copyTokens = {
  "ui-copy-confirm-duration": "var(--dur-fast)",
  "ui-copy-confirm-easing": "var(--ease-out-quad)",
  "ui-copy-confirm-gap": "var(--sp-1)",
  "ui-copy-check-size": "var(--sp-3)",
} as const
