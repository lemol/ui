/**
 * Breadcrumbs' contract. Eight names.
 *
 * The markup shape is `nav` > `ol` > `li`*, the current item as
 * `aria-current="page"` and a separator `li` marked `aria-hidden` — the shape
 * Remix's own styled breadcrumbs used before Remix 3 dropped its styled
 * components, kept here so the semantics carry over unchanged.
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
