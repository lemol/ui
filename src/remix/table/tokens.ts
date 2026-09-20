/**
 * Table's contract. Twelve names.
 *
 * `cell-pad-y` defaults to `row-pad-y`, the same primitive
 * `[data-density="compact"]` already overrides — a table retunes its density
 * for free because it reads the sizing group rather than declaring its own
 * pixel value. There is no row-height token: an explicit height on `<tr>` is
 * not reliably respected by table layout across engines, so density is cell
 * padding's job here, not a height's.
 */
export const tableTokens = {
  "ui-table-header-bg": "var(--surface)",
  "ui-table-header-ink": "var(--ink-muted)",
  "ui-table-header-font-weight": "var(--fw-medium)",
  "ui-table-border": "var(--hairline)",
  "ui-table-border-width": "1px",
  "ui-table-row-bg-hover": "var(--surface-hover)",
  "ui-table-cell-pad-x": "var(--sp-3)",
  "ui-table-cell-pad-y": "var(--row-pad-y)",
  "ui-table-font-size": "var(--fs-sm)",
  "ui-table-sort-ink": "var(--ink-subtle)",
  "ui-table-sort-gap": "var(--sp-1)",
  "ui-table-sort-indicator-size": "var(--fs-2xs)",
} as const
