/**
 * CommandPalette's contract. Twelve names — the input and the item list only.
 * The shell is `Dialog`'s own: `overlay()`'s `Dialog` is what renders the
 * panel, so `--ui-dialog-*` already covers the surface, the motion and the
 * close button, and duplicating those here would be a second contract for
 * one shell.
 */
export const commandPaletteTokens = {
  "ui-palette-input-pad-x": "var(--sp-3)",
  "ui-palette-input-pad-y": "var(--sp-2)",
  "ui-palette-input-border": "var(--hairline-strong)",
  "ui-palette-input-border-width": "1px",
  "ui-palette-input-radius": "var(--r-sm)",
  "ui-palette-input-font-size": "var(--fs-md)",
  "ui-palette-list-gap": "var(--sp-1)",
  "ui-palette-item-pad-x": "var(--sp-3)",
  "ui-palette-item-pad-y": "var(--sp-2)",
  "ui-palette-item-radius": "var(--r-sm)",
  "ui-palette-item-ink": "var(--ink)",
  "ui-palette-item-bg-hover": "var(--surface-hover)",
} as const
