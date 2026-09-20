/**
 * Pagination's contract. Ten names. `control-size` reads `control-h-sm`, the
 * same primitive `Dialog`'s close button and `Pagination`'s own siblings in a
 * toolbar already use, so density retunes it for free.
 */
export const paginationTokens = {
  "ui-pagination-gap": "var(--sp-1)",
  "ui-pagination-control-size": "var(--control-h-sm)",
  "ui-pagination-radius": "var(--r-sm)",
  "ui-pagination-font-size": "var(--fs-sm)",
  "ui-pagination-ink": "var(--ink-muted)",
  "ui-pagination-ink-hover": "var(--ink)",
  "ui-pagination-bg-hover": "var(--surface-hover)",
  "ui-pagination-active-bg": "var(--accent)",
  "ui-pagination-active-ink": "var(--accent-ink)",
  "ui-pagination-disabled-ink": "var(--ink-subtle)",
} as const
