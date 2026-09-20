/**
 * Switch's contract. No native input type gives this control a track/thumb
 * to retint the way `accent-color` retints `Checkbox`'s and `Radio`'s native
 * glyphs, so this one draws its own — `appearance: none` on a real
 * `<input type="checkbox">`, styled with `::before` as the thumb. It stays a
 * real checkbox: no ARIA role reinvention, `role="switch"` is the only
 * addition, and every native behaviour — `:checked`, label association,
 * constraint validation — comes free.
 */
export const switchTokens = {
  "ui-switch-track-width": "var(--sp-8)",
  "ui-switch-track-height": "var(--sp-4)",
  "ui-switch-track-inset": "var(--sp-1)",
  "ui-switch-thumb-size": "var(--sp-3)",
  "ui-switch-track-bg": "var(--surface-active)",
  "ui-switch-track-bg-checked": "var(--accent)",
  "ui-switch-track-bg-disabled": "var(--surface-hover)",
  "ui-switch-thumb-bg": "var(--surface)",
  "ui-switch-radius": "var(--r-pill)",
  "ui-switch-transition-duration": "var(--dur-fast)",
  "ui-switch-transition-easing": "var(--ease-out-quad)",
  "ui-switch-gap": "var(--sp-2)",
  "ui-switch-label-ink": "var(--ink)",
  "ui-switch-label-size": "var(--fs-sm)",
  "ui-switch-hint-ink": "var(--ink-muted)",
  "ui-switch-error-ink": "var(--danger)",
  "ui-switch-message-size": "var(--fs-sm)",
  "ui-switch-disabled-ink": "var(--ink-subtle)",
} as const
