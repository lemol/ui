/**
 * SegmentedControl's contract. Fifteen names.
 *
 * No custom box for the radio itself — it stays a real, native
 * `<input type="radio">`, visually hidden behind the label it sits inside so
 * `:focus-visible` still has something to ring (see `segmented-control.tsx`'s
 * own note on why the ring moves to the label).
 */
export const segmentedControlTokens = {
  "ui-segmented-track-bg": "var(--surface-hover)",
  "ui-segmented-track-pad": "var(--sp-1)",
  "ui-segmented-radius": "var(--r-md)",
  "ui-segmented-active-bg": "var(--surface-raised)",
  "ui-segmented-active-radius": "var(--r-sm)",
  "ui-segmented-active-shadow": "var(--shadow-sm)",
  "ui-segmented-label-pad-x": "var(--sp-3)",
  "ui-segmented-label-pad-y": "var(--sp-2)",
  "ui-segmented-label-ink": "var(--ink-muted)",
  "ui-segmented-label-ink-active": "var(--ink)",
  "ui-segmented-label-font-size": "var(--fs-sm)",
  "ui-segmented-label-font-weight": "var(--fw-medium)",
  "ui-segmented-transition-duration": "var(--dur-fast)",
  "ui-segmented-transition-easing": "var(--ease-out-quad)",
  "ui-segmented-disabled-ink": "var(--ink-subtle)",
} as const
