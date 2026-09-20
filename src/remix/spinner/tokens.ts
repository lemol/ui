/**
 * Spinner's contract. Six names.
 *
 * No component-local reduced-motion query: `--ui-spinner-duration` defaults
 * to `--dur-slow`, and the global reset zeroes every `--dur-*` token under
 * `prefers-reduced-motion: reduce` (see `docs/motion.md`). A zero-duration
 * `animation` completes instantly, which is the quiet, non-distracting state
 * a spinner should show — reached by reading the token, not by a second rule.
 */
export const spinnerTokens = {
  "ui-spinner-size": "var(--sp-6)",
  "ui-spinner-border-width": "2px",
  "ui-spinner-radius": "var(--r-pill)",
  "ui-spinner-track": "var(--hairline-strong)",
  "ui-spinner-stroke": "var(--accent)",
  "ui-spinner-duration": "var(--dur-slow)",
} as const
