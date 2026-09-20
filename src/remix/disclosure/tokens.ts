/**
 * Disclosure's contract. Thirteen names, every default a primitive except the
 * one literal `allowedLiterals` already holds for Button, Field and Popover.
 *
 * There is no content-transition token: `<details>` reveals its content by
 * toggling internal visibility, not `display`, and no Baseline CSS feature
 * animates that yet (`calc-size()`/`interpolate-size` are not there). Only
 * the marker rotates, which is why it is the only arm with a duration and an
 * easing.
 */
export const disclosureTokens = {
  "ui-disclosure-summary-pad-x": "var(--sp-3)",
  "ui-disclosure-summary-pad-y": "var(--sp-3)",
  "ui-disclosure-summary-gap": "var(--sp-2)",
  "ui-disclosure-summary-font-weight": "var(--fw-medium)",
  "ui-disclosure-summary-bg-hover": "var(--surface-hover)",
  "ui-disclosure-radius": "var(--r-sm)",
  "ui-disclosure-border": "var(--hairline)",
  "ui-disclosure-border-width": "1px",
  "ui-disclosure-content-pad-x": "var(--sp-3)",
  "ui-disclosure-content-pad-y": "var(--sp-3)",
  "ui-disclosure-marker-size": "var(--fs-sm)",
  "ui-disclosure-marker-transition-duration": "var(--dur-fast)",
  "ui-disclosure-marker-transition-easing": "var(--ease-out-quad)",
} as const
