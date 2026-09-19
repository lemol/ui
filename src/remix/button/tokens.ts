/**
 * Button's contract. The component reads these and nothing else, so a skin is
 * a set of values here and never a forked component.
 *
 * Height and padding come from the sizing group, which is what makes
 * `[data-density="compact"]` retune the control without the component knowing
 * density exists.
 */
export const buttonTokens = {
  "ui-btn-radius": "var(--r-sm)",
  "ui-btn-height": "var(--control-h)",
  "ui-btn-height-sm": "var(--control-h-sm)",
  "ui-btn-pad-x": "var(--sp-4)",
  "ui-btn-pad-x-sm": "var(--sp-3)",
  "ui-btn-gap": "var(--sp-2)",
  "ui-btn-font-size": "var(--fs-md)",
  "ui-btn-font-size-sm": "var(--fs-sm)",
  "ui-btn-font-weight": "var(--fw-medium)",
  // The one default here that is not a primitive: border width has no
  // primitive to reference, and one property does not justify widening the
  // schema. Named rather than written into button.tsx, because a named token
  // with a literal default is the opposite of a buried literal.
  "ui-btn-border-width": "1px",
  "ui-btn-transition-duration": "var(--dur-fast)",
  "ui-btn-transition-easing": "var(--ease-out-quad)",

  // Each border defaults to its own fill rather than `transparent`, so every
  // tone is the same size and a skin can still give one a contrasting edge.
  "ui-btn-primary-bg": "var(--accent)",
  "ui-btn-primary-ink": "var(--accent-ink)",
  "ui-btn-primary-border": "var(--accent)",
  "ui-btn-primary-bg-hover": "var(--accent-hover)",

  "ui-btn-neutral-bg": "var(--surface)",
  "ui-btn-neutral-ink": "var(--ink)",
  "ui-btn-neutral-border": "var(--hairline-strong)",
  "ui-btn-neutral-bg-hover": "var(--surface-hover)",

  // `transparent` keeps a ghost button the same size as a neutral one.
  "ui-btn-ghost-bg": "transparent",
  "ui-btn-ghost-ink": "var(--ink-muted)",
  "ui-btn-ghost-border": "transparent",
  "ui-btn-ghost-bg-hover": "var(--surface-hover)",

  "ui-btn-danger-bg": "var(--danger)",
  "ui-btn-danger-ink": "var(--danger-ink)",
  "ui-btn-danger-border": "var(--danger)",
  "ui-btn-danger-bg-hover": "var(--danger-hover)",

  // Tone-independent: a disabled button stops being primary or dangerous.
  // Explicit colours rather than an opacity ratio, so there is no literal to
  // retune and every default still names a primitive.
  "ui-btn-disabled-bg": "var(--surface-active)",
  "ui-btn-disabled-ink": "var(--ink-subtle)",
  "ui-btn-disabled-border": "var(--hairline)",
} as const
