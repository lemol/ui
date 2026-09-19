import { type HeadingLevel, headingScale } from "../../design/index.ts"

type SizeTokens = { [L in HeadingLevel as `ui-heading-${L}-size`]: string }

/**
 * The six sizes, derived from the same map ui-design's reset derives its
 * font-size rules from. Written out here instead, the ramp would be spelled
 * twice in two packages and a skin could leave a bare <h2> behind.
 *
 * The keys stay literal through the mapped type, which is what mini's
 * excess-property rename check needs: an override of a token that no longer
 * exists has to fail at the line that wrote it.
 */
const sizeTokens = Object.fromEntries(
  Object.entries(headingScale).map(([level, name]) => [
    `ui-heading-${level}-size`,
    `var(--${name})`,
  ]),
) as SizeTokens

/**
 * Heading's contract. The three shared properties restate one tier up what the
 * reset gives a bare heading, for the same reason the sizes do: this tier is
 * what a skin can reach, and the reset is the floor for markup nobody wrapped.
 *
 * `ui-heading-ink` is a deliberate trade. Declaring `color` takes the property
 * away from `mix` — see the always/optional rule in docs/design-system.md — and
 * headings in a hue of their own is a routine brand move, so it is better
 * reachable through the contract than through an escape hatch.
 */
export const headingTokens = {
  ...sizeTokens,
  "ui-heading-weight": "var(--fw-bold)",
  "ui-heading-tracking": "var(--tr-tight)",
  "ui-heading-leading": "var(--lh-tight)",
  "ui-heading-ink": "var(--ink)",
} as const
