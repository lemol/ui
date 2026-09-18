/**
 * The primitive token schema: names, and no values at all.
 *
 * A theme supplies every value. That is what lets a future @lemol/ui-opentui
 * share this package without inheriting hex colours it cannot use, and it is
 * why `defineTheme` requires the full set rather than patching a default.
 *
 * Names are grouped so a category is derivable from membership: the
 * prefers-reduced-motion reset in /css selects the `dur-`-prefixed names
 * within `schema.motion` rather than keeping a second list of durations
 * that can drift.
 *
 * Naming rule: ramps you do arithmetic on are numeric and the number is a
 * multiplier, so `sp-4` is four 4px units. Sets you choose from are t-shirt
 * sized. Space is the only ramp.
 */
export const schema = {
  color: [
    // The value `color-scheme` takes, so the emitter needs no rule of its own:
    // a theme says `light` in `base` and `dark` in its dark axis, and the axis
    // carries it like any other name. Emitter logic cannot replace it, because
    // a dark-only theme has no dark axis to infer from.
    "scheme-mode",
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
    "danger-hover",
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
  // `focus-ring` holds the whole `outline` shorthand. `outline-offset` is a
  // separate property that cannot be folded into it, so it gets its own name
  // rather than a literal in the reset or a borrowed space step.
  elevation: ["shadow-sm", "shadow-md", "shadow-lg", "focus-ring", "focus-ring-offset"],
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

/**
 * Which primitive sizes a bare heading, by element.
 *
 * `h1`–`h6` are HTML elements, not components, so this tells a package that
 * holds no values nothing about which components exist — /css derives its six
 * font-size rules from it, and ui-remix's Heading defaults its size tokens from
 * it. Deriving both from one map is why the floor a bare <h2> lands on and the
 * token <Heading level={2}> reads cannot drift apart, and it is the same move
 * reducedMotionCss makes with the dur- names in schema.motion.
 *
 * h5 lands on body size and h6 below it. Both stay distinct through the
 * fw-bold, tr-tight and lh-tight the reset's heading rule already carries, and
 * stopping at fs-sm leaves fs-xs and fs-2xs to the smaller UI that needs them.
 */
export const headingScale = {
  1: "fs-3xl",
  2: "fs-2xl",
  3: "fs-xl",
  4: "fs-lg",
  5: "fs-md",
  6: "fs-sm",
} as const satisfies Record<number, PrimitiveName>

export type HeadingLevel = keyof typeof headingScale
