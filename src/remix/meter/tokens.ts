/**
 * Meter's contract, kept deliberately thin: two names.
 *
 * `appearance: none` is not used on either element, unlike `Field`'s
 * `<select>` chevron trick. On `<progress>` it would also discard the UA's
 * indeterminate-state animation — the striped pulse a valueless `<progress>`
 * already renders with no markup and no script — and the M2 plan is explicit
 * that this animation is not to be reimplemented. So there is no track
 * background or radius token here: styling stays to what `accent-color` and
 * sizing can do without opting out of native rendering.
 *
 * `<meter>` gets no fill-colour token at all. Its colour is the UA's own
 * low/high/optimum semantics (green/amber/red), and `accent-color` support
 * for `<meter>` specifically is inconsistent across the engines in the
 * baseline — retinting it would trade a real semantic for an unreliable one.
 */
export const meterTokens = {
  "ui-meter-height": "var(--sp-2)",
  "ui-meter-fill": "var(--accent)",
} as const
