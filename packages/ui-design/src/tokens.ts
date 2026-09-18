/**
 * The primitive token schema: names, and no values at all.
 *
 * A theme supplies every value. That is what lets a future @lemol/ui-opentui
 * share this package without inheriting hex colours it cannot use, and it is
 * why `defineTheme` requires the full set rather than patching a default.
 *
 * Names are grouped so a category is derivable from membership: the
 * prefers-reduced-motion reset in /css iterates `schema.motion` rather than
 * keeping a second list of durations that can drift.
 *
 * Naming rule: ramps you do arithmetic on are numeric and the number is a
 * multiplier, so `sp-4` is four 4px units. Sets you choose from are t-shirt
 * sized. Space is the only ramp.
 */
export const schema = {
  color: [
    "canvas",
    "surface",
    "surface-raised",
    "surface-hover",
    "surface-active",
    "hairline",
    "hairline-strong",
    "ink",
    "ink-muted",
    "ink-subtle",
    "ink-inverse",
    "scrim",
    "focus",
    "accent",
    "accent-hover",
    "accent-ink",
    "accent-subtle",
    "accent-border",
    "link",
    "link-hover",
    "success",
    "success-ink",
    "success-subtle",
    "success-border",
    "warning",
    "warning-ink",
    "warning-subtle",
    "warning-border",
    "danger",
    "danger-ink",
    "danger-subtle",
    "danger-border",
    "info",
    "info-ink",
    "info-subtle",
    "info-border",
  ],
  space: [
    "sp-0",
    "sp-1",
    "sp-2",
    "sp-3",
    "sp-4",
    "sp-5",
    "sp-6",
    "sp-8",
    "sp-10",
    "sp-12",
    "sp-16",
    "sp-24",
  ],
  radius: ["r-xs", "r-sm", "r-md", "r-lg", "r-xl", "r-pill"],
  type: [
    "font-sans",
    "font-mono",
    "fs-2xs",
    "fs-xs",
    "fs-sm",
    "fs-md",
    "fs-lg",
    "fs-xl",
    "fs-2xl",
    "fs-3xl",
    "lh-tight",
    "lh-snug",
    "lh-base",
    "lh-relaxed",
    "tr-tight",
    "tr-normal",
    "tr-wide",
    "tr-wider",
    "fw-regular",
    "fw-medium",
    "fw-semibold",
    "fw-bold",
  ],
  motion: [
    "dur-instant",
    "dur-fast",
    "dur-base",
    "dur-slow",
    "ease-out-quad",
    "ease-spring",
    "ease-in-out-smooth",
  ],
  sizing: ["control-h", "control-h-sm", "row-h", "row-pad-y", "page-max", "gutter"],
  elevation: ["shadow-sm", "shadow-md", "shadow-lg", "focus-ring"],
} as const

export type TokenGroup = keyof typeof schema
export type PrimitiveName = (typeof schema)[TokenGroup][number]
export type PrimitiveTokens = { readonly [K in PrimitiveName]: string }

export const tokenGroups = Object.keys(schema) as readonly TokenGroup[]

export const primitiveNames: readonly PrimitiveName[] = tokenGroups.flatMap(
  (group) => schema[group] as readonly PrimitiveName[],
)

const groupByName: ReadonlyMap<PrimitiveName, TokenGroup> = new Map(
  tokenGroups.flatMap((group) =>
    (schema[group] as readonly PrimitiveName[]).map((name) => [name, group] as const),
  ),
)

export function groupOf(name: PrimitiveName): TokenGroup {
  const group = groupByName.get(name)
  if (group === undefined) throw new Error(`Unknown primitive token: ${name}`)
  return group
}
