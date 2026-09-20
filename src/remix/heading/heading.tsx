import { type CSSMixinDescriptor, css, type Handle, type MixInput, type RemixNode } from "remix/ui"
import { type HeadingLevel, headingScale } from "../../design/index.ts"

/**
 * Every declaration reads a --ui-heading-* token. A literal size, weight or
 * colour here is the failure this component exists to make impossible, and
 * heading.test.tsx checks for one.
 *
 * font-size is deliberately absent: it belongs to the size block, which always
 * renders and carries the level's default. Two blocks that could both declare
 * it would put sub-layer order in charge of which one paints.
 */
const headingBase = css({
  fontWeight: "var(--ui-heading-weight)",
  letterSpacing: "var(--ui-heading-tracking)",
  lineHeight: "var(--ui-heading-leading)",
  color: "var(--ui-heading-ink)",
})

const levels = Object.keys(headingScale).map(Number) as HeadingLevel[]

const sizeStyles = Object.fromEntries(
  levels.map((level) => [level, css({ fontSize: `var(--ui-heading-${level}-size)` })]),
) as Record<HeadingLevel, CSSMixinDescriptor>

/**
 * Literal, not composed: a template literal type would widen to `string` at the
 * JSX call site, where an element name has to be a union of literals. The test
 * pins this against headingScale, so a level added to the scale cannot be left
 * without a tag.
 */
const tags = { 1: "h1", 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } as const

export interface HeadingProps {
  /**
   * The document outline. Required, because a heading with no level is an
   * outline bug and no default is right more often than it is wrong.
   */
  level: HeadingLevel
  /**
   * What it looks like, defaulting to `level`. The two are separate props
   * because they are separate decisions: a card title inside a page that
   * already has an `h2` must be an `h3` and should often look smaller than one.
   *
   * Its block always renders, carrying the default, so `font-size` is not
   * reachable through `mix` — pass `size`, or set `--ui-heading-<n>-size`.
   */
  size?: HeadingLevel | undefined
  /**
   * For an `aria-labelledby` or a deep link. `Field` already carries one for
   * the same reason: a label that points at nothing is worse than no label.
   */
  id?: string | undefined
  /**
   * Adds properties Heading does not declare — `text-wrap`, a grid placement
   * owned by the layout around it. It does not reliably override one it does:
   * each `css()` block is its own cascade sub-layer, layer order beats
   * specificity within a layer, and sub-layer order follows render order rather
   * than the order of this array. To change a property Heading declares, set
   * its token.
   */
  mix?: MixInput<HTMLHeadingElement> | undefined
  children?: RemixNode | undefined
}

export function Heading(handle: Handle<HeadingProps>) {
  return () => {
    const { level, size = level, id, mix, children } = handle.props
    const Tag = tags[level]
    return (
      <Tag id={id} mix={[headingBase, sizeStyles[size], mix]}>
        {children}
      </Tag>
    )
  }
}
