/**
 * Text's contract. Three sizes because prose varies by that much and no more —
 * a fourth would be a heading or an eyebrow, both of which exist.
 *
 * No weight token, because Text declares no font-weight: an undeclared property
 * is reliably `mix`'s, which is the half of the always/optional rule that makes
 * an escape hatch dependable rather than accidental.
 */
export const textTokens = {
  "ui-text-size-sm": "var(--fs-sm)",
  "ui-text-size-md": "var(--fs-md)",
  "ui-text-size-lg": "var(--fs-lg)",
  "ui-text-leading": "var(--lh-base)",

  // Three inks rather than an opacity ratio, so every default names a
  // primitive and there is no literal percentage to retune.
  "ui-text-ink": "var(--ink)",
  "ui-text-ink-muted": "var(--ink-muted)",
  "ui-text-ink-subtle": "var(--ink-subtle)",
} as const
