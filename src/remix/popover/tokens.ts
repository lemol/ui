/**
 * Popover's contract. The surface only — the trigger is a `Button` and reads
 * `--ui-btn-*`, not a parallel set invented here.
 *
 * `anchor-gap` is how far the surface sits from its trigger once anchor
 * positioning is live; it is inert everywhere `@supports (anchor-name: --a)`
 * fails, which is why it defaults to a space step rather than a token that
 * implies "this always applies". `position-area` is where it opens against
 * the trigger, a token so a consumer can open a menu toward the trigger's
 * start edge: a `mix` that restated the property would lose to this block
 * wherever its cascade layer happens to come first.
 *
 * No hover/active arms and no tone: a popover surface is one static shell,
 * same as Dialog's panel.
 */
export const popoverTokens = {
  "ui-popover-max-inline-size": "var(--overlay-max)",
  "ui-popover-bg": "var(--surface-raised)",
  "ui-popover-ink": "var(--ink)",
  "ui-popover-border": "var(--hairline)",
  "ui-popover-border-width": "1px",
  "ui-popover-radius": "var(--r-md)",
  "ui-popover-shadow": "var(--shadow-md)",
  "ui-popover-pad": "var(--sp-4)",
  "ui-popover-gap": "var(--sp-2)",
  "ui-popover-anchor-gap": "var(--sp-2)",
  "ui-popover-position-area": "bottom span-all",

  "ui-popover-transition-duration": "var(--dur-fast)",
  "ui-popover-transition-easing": "var(--ease-out-quad)",
  "ui-popover-enter-offset": "var(--sp-2)",
} as const
