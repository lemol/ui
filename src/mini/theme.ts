import { defineTheme, type PrimitiveTokens } from "../design/index.ts"
import type { ComponentTokenName } from "../remix/index.ts"

/**
 * Warm-grey neutrals with a deep teal accent.
 *
 * Typed as PrimitiveTokens rather than inferred, so a missing or misspelled
 * name fails here, on the line that wrote it, instead of at the defineTheme
 * call or — worse — at render time, where a var() on an undeclared property
 * just resolves to nothing.
 *
 * Space, radius and sizing are px; type sizes are rem, so raising the browser
 * font size enlarges text without stretching the layout grid with it.
 */
const basePrimitives: PrimitiveTokens = {
  "scheme-mode": "light",

  canvas: "#FAF9F7",
  surface: "#FFFFFF",
  "surface-raised": "#FFFFFF",
  "surface-hover": "#F3F1ED",
  "surface-active": "#EAE7E1",
  hairline: "#E6E3DC",
  "hairline-strong": "#CFCBC2",
  ink: "#1A1917",
  "ink-muted": "#5C5852",
  "ink-subtle": "#8B867D",
  "ink-inverse": "#FFFFFF",
  scrim: "rgba(26, 25, 23, 0.45)",
  // Deliberately not the accent: the ring has to read against an
  // accent-filled button, which it cannot do if it is the same hue.
  focus: "#2F6FEB",

  accent: "#1F6B5C",
  "accent-hover": "#18564A",
  "accent-ink": "#FFFFFF",
  "accent-subtle": "#E4F0ED",
  "accent-border": "#A9CFC6",
  link: "#1B5E52",
  "link-hover": "#124338",

  success: "#2F7D51",
  "success-ink": "#FFFFFF",
  "success-subtle": "#E7F3EC",
  "success-border": "#B7D9C4",
  warning: "#A8700F",
  "warning-ink": "#FFFFFF",
  "warning-subtle": "#FBF1DF",
  "warning-border": "#E8CF9B",
  danger: "#B3392F",
  "danger-hover": "#942D25",
  "danger-ink": "#FFFFFF",
  "danger-subtle": "#FBEAE8",
  "danger-border": "#E8B8B2",
  info: "#2B5C8A",
  "info-ink": "#FFFFFF",
  "info-subtle": "#E8F0F7",
  "info-border": "#B9CFE2",

  // sp-N is N four-pixel units. Checked by theme.test.ts, not the compiler.
  "sp-0": "0px",
  "sp-1": "4px",
  "sp-2": "8px",
  "sp-3": "12px",
  "sp-4": "16px",
  "sp-5": "20px",
  "sp-6": "24px",
  "sp-8": "32px",
  "sp-10": "40px",
  "sp-12": "48px",
  "sp-16": "64px",
  "sp-24": "96px",

  "r-xs": "2px",
  "r-sm": "6px",
  "r-md": "10px",
  "r-lg": "14px",
  "r-xl": "20px",
  "r-pill": "9999px",

  // No web font: the packages have no build step and no asset to ship.
  "font-sans": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  "font-mono": 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  "fs-2xs": "0.6875rem",
  "fs-xs": "0.75rem",
  "fs-sm": "0.8125rem",
  "fs-md": "0.9375rem",
  "fs-lg": "1.125rem",
  "fs-xl": "1.375rem",
  "fs-2xl": "1.75rem",
  "fs-3xl": "2.25rem",
  "lh-tight": "1.15",
  "lh-snug": "1.3",
  "lh-base": "1.55",
  "lh-relaxed": "1.75",
  "tr-tight": "-0.015em",
  "tr-normal": "0em",
  "tr-wide": "0.02em",
  "tr-wider": "0.08em",
  "fw-regular": "400",
  "fw-medium": "500",
  "fw-semibold": "600",
  "fw-bold": "700",

  "dur-instant": "80ms",
  "dur-fast": "140ms",
  "dur-base": "240ms",
  "dur-slow": "400ms",
  "ease-out-quad": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  "ease-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
  "ease-in-out-smooth": "cubic-bezier(0.4, 0, 0.2, 1)",

  "control-h": "36px",
  "control-h-sm": "28px",
  "row-h": "44px",
  "row-pad-y": "12px",
  "page-max": "72rem",
  gutter: "24px",

  "shadow-sm": "0 1px 2px rgba(23, 21, 18, 0.06)",
  "shadow-md": "0 4px 12px rgba(23, 21, 18, 0.08)",
  "shadow-lg": "0 16px 40px rgba(23, 21, 18, 0.12)",
  // The whole outline shorthand, so the reset needs no rule of its own.
  "focus-ring": "2px solid var(--focus)",
  "focus-ring-offset": "2px",
}

/**
 * Annotated, not inferred, for the same reason as `basePrimitives`: an
 * annotation makes this an excess-property-checked literal, so a misspelled
 * name fails here. Inferred, it would be a plain object that `defineTheme`
 * accepts structurally — and a token that reaches no selector is invisible.
 */
const darkPrimitives: Partial<PrimitiveTokens> = {
  "scheme-mode": "dark",

  canvas: "#151412",
  surface: "#1D1C19",
  "surface-raised": "#252320",
  "surface-hover": "#2B2926",
  "surface-active": "#33302C",
  hairline: "#33302B",
  "hairline-strong": "#4A4640",
  ink: "#F2F0EB",
  "ink-muted": "#AFAAA1",
  "ink-subtle": "#7E7970",
  "ink-inverse": "#151412",
  scrim: "rgba(0, 0, 0, 0.6)",
  focus: "#6E9DF5",

  // Hover goes lighter here and darker in base. That inversion is why a hover
  // value is a named token and never derived from its fill.
  accent: "#3E9A87",
  "accent-hover": "#4FAE9A",
  "accent-ink": "#0E1A17",
  "accent-subtle": "#1B2E29",
  "accent-border": "#2F5B52",
  link: "#5CB8A4",
  "link-hover": "#7ACBB9",

  success: "#4E9E70",
  "success-ink": "#0D1A12",
  "success-subtle": "#18281E",
  "success-border": "#2C5138",
  warning: "#C9962F",
  "warning-ink": "#1A1405",
  "warning-subtle": "#2B2312",
  "warning-border": "#54421C",
  danger: "#D4675A",
  "danger-hover": "#E07E71",
  "danger-ink": "#1E0E0C",
  "danger-subtle": "#2E1A17",
  "danger-border": "#5C2F28",
  info: "#5E9AC4",
  "info-ink": "#0C1620",
  "info-subtle": "#172530",
  "info-border": "#2C4A60",

  // A shadow tuned for a light canvas disappears on a dark one.
  "shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.4)",
  "shadow-md": "0 4px 12px rgba(0, 0, 0, 0.45)",
  "shadow-lg": "0 16px 40px rgba(0, 0, 0, 0.55)",
}

/** The four-token swap, and nothing else. Every control and row reads these. */
const compactPrimitives: Partial<PrimitiveTokens> = {
  "control-h": "30px",
  "control-h-sm": "24px",
  "row-h": "34px",
  "row-pad-y": "6px",
}

/**
 * One concrete design on @lemol/ui/remix.
 *
 * The type argument is the cross-package wiring, and `mini` is where it can
 * live because `mini` is the package that depends on both: `defineTheme`
 * requires every primitive, and type-checks every `ui-*` override against the
 * names `ui-remix` actually declares.
 *
 * **Write every `ui-*` override as a literal key here.** Excess property
 * checking only fires on object literals — the spread of `basePrimitives`
 * below is not checked, and an override moved out into a referenced object
 * would not be either. The rename check would then pass on a token name that
 * no longer exists, and the failure would surface as an unstyled button
 * instead of a compiler error. `theme.test.ts` pins this with a
 * `@ts-expect-error` whose directive goes unused the day it stops working.
 */
export const miniTheme = defineTheme<ComponentTokenName>({
  base: {
    ...basePrimitives,
    // mini's one skin choice, and the live half of the rename check: a
    // slightly softer button than the r-sm default the component ships.
    "ui-btn-radius": "var(--r-md)",
  },
  dark: darkPrimitives,
  compact: compactPrimitives,
})
