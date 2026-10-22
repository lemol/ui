/**
 * Table's contract. Eighteen names.
 *
 * `cell-pad-y` defaults to `row-pad-y`, the same primitive
 * `[data-density="compact"]` already overrides — a table retunes its density
 * for free because it reads the sizing group rather than declaring its own
 * pixel value. There is no row-height token: an explicit height on `<tr>` is
 * not reliably respected by table layout across engines, so density is cell
 * padding's job here, not a height's.
 *
 * The `list-` names are a table drawn as a phone's list (`list`): its type,
 * the gap between a row's mark, body and trail, the row's own padding, and
 * the trail's dim, small type. Its rows divide on the table's own rule and
 * press to its hover fill.
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
  "ui-table-list-font-size": "var(--fs-sm)",
  "ui-table-list-gap": "var(--sp-3)",
  "ui-table-list-pad-x": "var(--sp-1)",
  "ui-table-list-pad-y": "var(--row-pad-y)",
  "ui-table-list-trail-ink": "var(--ink-muted)",
  "ui-table-list-trail-font-size": "var(--fs-xs)",
} as const
