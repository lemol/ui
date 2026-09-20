/**
 * Menu's contract. The surface itself reads `--ui-popover-*` — it is a
 * `Popover` with `role="menu"` and a list of `role="menuitem"` rows, not a
 * second shell — so only the item and separator arms get their own names.
 */
export const menuTokens = {
  "ui-menu-min-inline-size": "var(--sp-24)",
  "ui-menu-item-pad-x": "var(--sp-3)",
  "ui-menu-item-pad-y": "var(--sp-2)",
  "ui-menu-item-radius": "var(--r-sm)",
  "ui-menu-item-gap": "var(--sp-2)",
  "ui-menu-item-font-size": "var(--fs-sm)",
  "ui-menu-item-ink": "var(--ink)",
  "ui-menu-item-bg-hover": "var(--surface-hover)",
  "ui-menu-item-disabled-ink": "var(--ink-subtle)",
  "ui-menu-separator-color": "var(--hairline)",
  "ui-menu-separator-margin": "var(--sp-1)",
} as const
