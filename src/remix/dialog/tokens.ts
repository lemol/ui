/**
 * Dialog's contract. Twenty-two names, every default a primitive except the
 * two literals `allowedLiterals` already holds for Button and Field.
 *
 * `backdrop-bg` reads `scrim`, the primitive that exists for exactly this. It
 * resolves only where `::backdrop` inherits from its originating element —
 * Chromium 122, Safari 17.4, Firefox 120 — and below that the modal opens over
 * an undimmed page. That degradation is accepted and documented in
 * docs/design-system.md; the alternatives are a pseudo-element in the emitter
 * or a hard-coded colour here.
 *
 * `enter-offset` is how far the panel travels on entry, as a space step rather
 * than a literal: how much a dialog moves is a brand's decision.
 *
 * There are no title tokens. The title is a `Heading`, so it reads the
 * typographic contract every other heading reads.
 */
export const dialogTokens = {
  "ui-dialog-max-inline-size": "var(--overlay-max)",
  "ui-dialog-inset": "var(--gutter)",
  "ui-dialog-bg": "var(--surface-raised)",
  "ui-dialog-ink": "var(--ink)",
  "ui-dialog-border": "var(--hairline)",
  "ui-dialog-border-width": "1px",
  "ui-dialog-radius": "var(--r-lg)",
  "ui-dialog-shadow": "var(--shadow-lg)",
  "ui-dialog-pad": "var(--sp-6)",
  "ui-dialog-gap": "var(--sp-4)",
  "ui-dialog-header-gap": "var(--sp-4)",

  "ui-dialog-close-size": "var(--control-h-sm)",
  "ui-dialog-close-radius": "var(--r-sm)",
  "ui-dialog-close-bg": "transparent",
  "ui-dialog-close-bg-hover": "var(--surface-hover)",
  "ui-dialog-close-ink": "var(--ink-muted)",
  "ui-dialog-close-ink-hover": "var(--ink)",
  "ui-dialog-close-glyph-size": "var(--fs-md)",

  "ui-dialog-backdrop-bg": "var(--scrim)",

  "ui-dialog-transition-duration": "var(--dur-fast)",
  "ui-dialog-transition-easing": "var(--ease-out-quad)",
  "ui-dialog-enter-offset": "var(--sp-2)",
} as const
