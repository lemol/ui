/**
 * FacetFilter's contract: a dashed trigger that names a facet and, once one
 * is chosen, its value; and the list it opens. The list is a popover's
 * surface, so its defaults are the popover's primitives.
 *
 * The trigger's dashed edge says *you may narrow by this* before anything is
 * chosen; chosen, the edge turns solid and the ground raises, so a filtered
 * page reads as filtered from across the room.
 */
export const facetTokens = {
  "ui-facet-height": "var(--control-h-sm)",
  "ui-facet-pad-x": "var(--sp-2)",
  "ui-facet-gap": "var(--sp-1)",
  "ui-facet-radius": "var(--r-md)",
  "ui-facet-border-width": "1px",
  "ui-facet-border": "var(--hairline-strong)",
  "ui-facet-bg": "transparent",
  "ui-facet-bg-hover": "var(--surface-hover)",
  "ui-facet-ink": "var(--ink)",
  "ui-facet-icon-ink": "var(--ink-muted)",
  "ui-facet-font-size": "var(--fs-sm)",
  "ui-facet-font-weight": "var(--fw-medium)",
  "ui-facet-active-border": "var(--hairline-strong)",
  "ui-facet-active-bg": "var(--surface-raised)",
  "ui-facet-separator": "var(--hairline)",
  "ui-facet-value-bg": "var(--surface-active)",
  "ui-facet-value-ink": "var(--ink)",
  "ui-facet-value-radius": "var(--r-sm)",
  "ui-facet-value-pad-x": "var(--sp-1)",
  "ui-facet-icon-size": "var(--sp-3)",
  "ui-facet-transition-duration": "var(--dur-fast)",
  "ui-facet-transition-easing": "var(--ease-out-quad)",

  "ui-facet-surface-bg": "var(--surface-raised)",
  "ui-facet-surface-ink": "var(--ink)",
  "ui-facet-surface-border": "var(--hairline)",
  "ui-facet-surface-radius": "var(--r-md)",
  "ui-facet-surface-shadow": "var(--shadow-md)",
  "ui-facet-surface-pad": "var(--sp-1)",
  "ui-facet-surface-min-inline-size": "var(--sp-24)",
  "ui-facet-surface-max-inline-size": "var(--overlay-max)",
  "ui-facet-surface-offset": "var(--sp-1)",
  "ui-facet-enter-offset": "var(--sp-1)",

  "ui-facet-option-gap": "var(--sp-2)",
  "ui-facet-option-pad-x": "var(--sp-2)",
  "ui-facet-option-pad-y": "var(--sp-1)",
  "ui-facet-option-radius": "var(--r-sm)",
  "ui-facet-option-ink": "var(--ink)",
  "ui-facet-option-bg-hover": "var(--surface-hover)",
  "ui-facet-option-count-ink": "var(--ink-muted)",
  "ui-facet-check-border": "var(--hairline-strong)",
  "ui-facet-check-bg-on": "var(--ink)",
  "ui-facet-check-ink-on": "var(--ink-inverse)",
  "ui-facet-check-radius": "var(--r-xs)",
  "ui-facet-rule": "var(--hairline)",
} as const
