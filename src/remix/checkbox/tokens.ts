/**
 * Checkbox's contract. Nine names.
 *
 * There is no custom box: `accent-color` retints the native control's check
 * and focus ring on every engine in the browser baseline, so styling it is a
 * one-property job rather than `appearance: none` plus a hand-drawn glyph —
 * the treatment `Switch` needs instead, because no native input type gives it
 * a track/thumb to retint.
 */
export const checkboxTokens = {
  "ui-checkbox-size": "var(--sp-4)",
  "ui-checkbox-accent": "var(--accent)",
  "ui-checkbox-gap": "var(--sp-2)",
  "ui-checkbox-label-ink": "var(--ink)",
  "ui-checkbox-label-size": "var(--fs-sm)",
  "ui-checkbox-hint-ink": "var(--ink-muted)",
  "ui-checkbox-error-ink": "var(--danger)",
  "ui-checkbox-message-size": "var(--fs-sm)",
  "ui-checkbox-disabled-ink": "var(--ink-subtle)",
} as const
