/**
 * Toast's contract. The shell plus five tones, each the `<tone>` on
 * `<tone>-subtle` pair — Badge's pattern, scaled up to a floating panel.
 *
 * There is no duration token: how long a toast stays is a behavioural
 * default (`ToastProps.duration`, milliseconds, read by `--dismiss-toast`),
 * not a themeable CSS quantity, so it is a component prop rather than a
 * `--ui-toast-*` name.
 */
export const toastTokens = {
  "ui-toast-max-inline-size": "var(--overlay-max)",
  "ui-toast-pad": "var(--sp-4)",
  "ui-toast-gap": "var(--sp-3)",
  "ui-toast-radius": "var(--r-md)",
  "ui-toast-shadow": "var(--shadow-md)",
  "ui-toast-border-width": "1px",
  "ui-toast-transition-duration": "var(--dur-fast)",
  "ui-toast-transition-easing": "var(--ease-out-quad)",
  "ui-toast-enter-offset": "var(--sp-2)",

  "ui-toast-close-size": "var(--control-h-sm)",
  "ui-toast-close-radius": "var(--r-sm)",
  "ui-toast-close-ink": "var(--ink-muted)",
  "ui-toast-close-ink-hover": "var(--ink)",
  "ui-toast-close-bg-hover": "var(--surface-hover)",
  "ui-toast-close-glyph-size": "var(--fs-md)",

  "ui-toast-neutral-bg": "var(--surface-raised)",
  "ui-toast-neutral-ink": "var(--ink)",
  "ui-toast-neutral-border": "var(--hairline)",

  "ui-toast-success-bg": "var(--success-subtle)",
  "ui-toast-success-ink": "var(--success)",
  "ui-toast-success-border": "var(--success-border)",

  "ui-toast-warning-bg": "var(--warning-subtle)",
  "ui-toast-warning-ink": "var(--warning)",
  "ui-toast-warning-border": "var(--warning-border)",

  "ui-toast-danger-bg": "var(--danger-subtle)",
  "ui-toast-danger-ink": "var(--danger)",
  "ui-toast-danger-border": "var(--danger-border)",

  "ui-toast-info-bg": "var(--info-subtle)",
  "ui-toast-info-ink": "var(--info)",
  "ui-toast-info-border": "var(--info-border)",
} as const
