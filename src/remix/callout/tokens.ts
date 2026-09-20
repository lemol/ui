/**
 * Callout's contract. `Badge`'s tone set — the `<tone>` on `<tone>-subtle`
 * pair, `neutral` reading the surface vocabulary rather than a semantic —
 * scaled from a pill to a block. Twenty-four names.
 */
export const calloutTokens = {
  "ui-callout-pad": "var(--sp-4)",
  "ui-callout-gap": "var(--sp-3)",
  "ui-callout-body-gap": "var(--sp-1)",
  "ui-callout-radius": "var(--r-md)",
  "ui-callout-border-width": "1px",
  "ui-callout-icon-size": "var(--fs-lg)",
  "ui-callout-title-font-size": "var(--fs-sm)",
  "ui-callout-title-font-weight": "var(--fw-semibold)",
  "ui-callout-description-font-size": "var(--fs-sm)",

  "ui-callout-neutral-bg": "var(--surface)",
  "ui-callout-neutral-ink": "var(--ink-muted)",
  "ui-callout-neutral-border": "var(--hairline)",

  "ui-callout-success-bg": "var(--success-subtle)",
  "ui-callout-success-ink": "var(--success)",
  "ui-callout-success-border": "var(--success-border)",

  "ui-callout-warning-bg": "var(--warning-subtle)",
  "ui-callout-warning-ink": "var(--warning)",
  "ui-callout-warning-border": "var(--warning-border)",

  "ui-callout-danger-bg": "var(--danger-subtle)",
  "ui-callout-danger-ink": "var(--danger)",
  "ui-callout-danger-border": "var(--danger-border)",

  "ui-callout-info-bg": "var(--info-subtle)",
  "ui-callout-info-ink": "var(--info)",
  "ui-callout-info-border": "var(--info-border)",
} as const
