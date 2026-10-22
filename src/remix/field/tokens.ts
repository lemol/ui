/**
 * Field's contract. The component reads these and nothing else, so a skin is a
 * set of values here and never a forked component.
 *
 * `height` comes from the sizing group, which is what makes
 * `[data-density="compact"]` retune every control without the component
 * knowing density exists. There is no `height-sm`: Field has no size axis,
 * because forms are uniform in a way toolbars are not and a second size would
 * turn the box metrics into a kind-by-size matrix.
 *
 * `border-width` is the one default that is not a primitive. The schema has no
 * border-width primitive and one property does not justify widening it;
 * `allowedLiterals` in tokens.test.ts already holds `1px` for Button's.
 *
 * `hint` and `error` share `message-size`. They are the same typographic role
 * at two inks, and a second token would only let them drift.
 *
 * The only transition tokens are the picker's. Button has them because it has
 * a hover; Field's controls have neither a hover nor a focus colour change, so
 * the only thing there to transition is the invalid border arriving on blur.
 * The list a customizable select draws is an overlay, and an overlay ships its
 * entry and exit.
 *
 * No focus ring, deliberately, and Button is the precedent: the reset's
 * `:where(:focus-visible)` rule owns it, and it applies precisely because no
 * component competes with it. See the spec for the argument.
 */
export const fieldTokens = {
  "ui-field-gap": "var(--sp-2)",
  "ui-field-height": "var(--control-h)",
  "ui-field-radius": "var(--r-sm)",
  "ui-field-border-width": "1px",
  "ui-field-border": "var(--hairline-strong)",
  "ui-field-bg": "var(--surface)",
  "ui-field-ink": "var(--ink)",
  "ui-field-placeholder-ink": "var(--ink-subtle)",
  "ui-field-pad-x": "var(--sp-3)",
  "ui-field-pad-y": "var(--sp-2)",
  "ui-field-font-size": "var(--fs-md)",

  "ui-field-label-ink": "var(--ink)",
  "ui-field-label-size": "var(--fs-sm)",
  "ui-field-label-weight": "var(--fw-medium)",
  // The asterisk is information, not an error, so it is muted rather than
  // danger-coloured. A skin that disagrees sets this one token.
  "ui-field-required-ink": "var(--ink-muted)",

  "ui-field-hint-ink": "var(--ink-muted)",
  "ui-field-error-ink": "var(--danger)",
  "ui-field-message-size": "var(--fs-sm)",

  // The first consumer of danger-subtle, which is why the token schema names
  // its semantic arms in full instead of deriving them with color-mix().
  "ui-field-invalid-border": "var(--danger-border)",
  "ui-field-invalid-bg": "var(--danger-subtle)",

  "ui-field-disabled-bg": "var(--surface-active)",
  "ui-field-disabled-ink": "var(--ink-subtle)",
  "ui-field-disabled-border": "var(--hairline)",
  "ui-field-readonly-bg": "var(--surface-hover)",

  // Size and clearance are space steps rather than pixel literals, which is
  // what composing from the scale means for a decorative glyph.
  "ui-field-chevron-ink": "var(--ink-muted)",
  "ui-field-chevron-size": "var(--sp-3)",
  "ui-field-chevron-space": "var(--sp-6)",

  // The customizable select's list, where the engine draws one: a popover's
  // surface, so its defaults are the popover's own primitives.
  "ui-field-picker-bg": "var(--surface-raised)",
  "ui-field-picker-ink": "var(--ink)",
  "ui-field-picker-border": "var(--hairline)",
  "ui-field-picker-radius": "var(--r-md)",
  "ui-field-picker-shadow": "var(--shadow-md)",
  "ui-field-picker-pad": "var(--sp-1)",
  "ui-field-picker-gap": "var(--sp-1)",
  "ui-field-picker-transition-duration": "var(--dur-fast)",
  "ui-field-picker-transition-easing": "var(--ease-out-quad)",
  "ui-field-picker-enter-offset": "var(--sp-1)",
  // Its rows: a menu's, with the chosen one heavier and ticked at the end.
  "ui-field-option-gap": "var(--sp-2)",
  "ui-field-option-pad-x": "var(--sp-2)",
  "ui-field-option-pad-y": "var(--sp-1)",
  "ui-field-option-radius": "var(--r-sm)",
  "ui-field-option-bg-hover": "var(--surface-hover)",
  "ui-field-option-checked-weight": "var(--fw-semibold)",
  "ui-field-option-check-ink": "var(--ink)",
} as const
