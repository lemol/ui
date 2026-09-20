/**
 * Breadcrumbs' contract. Eight names.
 *
 * `remix/ui` ships its own `Breadcrumbs` at `remix/ui/breadcrumbs`, checked
 * before writing this — its markup shape (`nav` > `ol` > `li`*, the current
 * item as `aria-current="page"`, a separator `li` marked `aria-hidden`) is
 * followed here too, but its styling reads a hardcoded internal style-values
 * module, not this package's `--ui-*` contract, so reusing the component
 * itself would import colours no theme here can retune.
 */
export const breadcrumbsTokens = {
  "ui-breadcrumbs-gap": "var(--sp-2)",
  "ui-breadcrumbs-font-size": "var(--fs-sm)",
  "ui-breadcrumbs-link-ink": "var(--ink-muted)",
  "ui-breadcrumbs-link-ink-hover": "var(--ink)",
  "ui-breadcrumbs-current-ink": "var(--ink)",
  "ui-breadcrumbs-current-font-weight": "var(--fw-medium)",
  "ui-breadcrumbs-separator-ink": "var(--ink-subtle)",
  "ui-breadcrumbs-separator-size": "var(--fs-sm)",
} as const
