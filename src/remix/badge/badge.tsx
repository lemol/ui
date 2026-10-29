import {
  type CSSMixinDescriptor,
  type Handle,
  type MixInput,
  type RemixNode,
} from "remix/component"
import { css } from "../css.ts"
import { pop } from "../motion/motion.ts"

/**
 * Four semantic tones and a neutral. The semantic four are the reason this
 * component is in the M1 slice — they are the test of whether the schema's
 * semantic primitives carry enough meaning for a component to default against
 * without mixing its own colours. Neutral is not a semantic and is here
 * because a status-neutral badge is the most common badge there is.
 *
 * No accent tone. `accent-subtle` and `accent-border` want a first consumer,
 * but theirs is a selected nav item or a callout, not a badge.
 */
export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info"

/**
 * Every declaration reads a --ui-badge-* token or a structural keyword.
 *
 * `inline-flex` lays the contents out internally while the element stays
 * inline externally, so a badge sits inside a sentence or a table cell
 * without breaking the line. `line-height` is a token because a badge
 * inheriting lh-base from a paragraph comes out tall and loose.
 *
 * No outline. The reset's :where(:focus-visible) rule owns the focus ring,
 * and nothing here competes with it — though a badge is not focusable anyway.
 */
const badgeBase = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--ui-badge-gap)",
  borderStyle: "solid",
  borderWidth: "var(--ui-badge-border-width)",
  borderRadius: "var(--ui-badge-radius)",
  paddingInline: "var(--ui-badge-pad-x)",
  paddingBlock: "var(--ui-badge-pad-y)",
  fontFamily: "inherit",
  fontSize: "var(--ui-badge-font-size)",
  fontWeight: "var(--ui-badge-font-weight)",
  lineHeight: "var(--ui-badge-leading)",
  whiteSpace: "nowrap",
})

/**
 * `background` and not `background-color`, for the reason Button gives: a
 * skin may set --ui-badge-<tone>-bg to a gradient, and background-color drops
 * a gradient as invalid.
 *
 * No `:hover` and no transition. Status colours have no `-hover` arm in the
 * schema, so there is nothing to move to.
 */
const toneStyle = (tone: BadgeTone): CSSMixinDescriptor =>
  css({
    background: `var(--ui-badge-${tone}-bg)`,
    borderColor: `var(--ui-badge-${tone}-border)`,
    color: `var(--ui-badge-${tone}-ink)`,
  })

const toneStyles: Record<BadgeTone, CSSMixinDescriptor> = {
  neutral: toneStyle("neutral"),
  success: toneStyle("success"),
  warning: toneStyle("warning"),
  danger: toneStyle("danger"),
  info: toneStyle("info"),
}

/**
 * The insertion pop, on the shared `ui-motion-pop` keyframes. Its own block,
 * property-disjoint from the base and the tone: `animation` appears nowhere
 * else here, so sub-layer order never decides the pop.
 */
const badgePop = pop({
  duration: "var(--ui-badge-pop-duration)",
  easing: "var(--ui-badge-pop-easing)",
})

export interface BadgeProps {
  tone?: BadgeTone | undefined
  /**
   * Adds properties Badge does not declare — a margin, a grid placement owned
   * by the layout around it. It does not reliably override one Badge declares:
   * remix/component gives every css() block its own cascade sub-layer, and sub-layer
   * order follows first render rather than the order of this array. To change
   * something Badge sets, set its `--ui-badge-*` token.
   */
  mix?: MixInput<HTMLSpanElement> | undefined
  children?: RemixNode | undefined
}

export function Badge(handle: Handle<BadgeProps>) {
  return () => {
    const { tone = "neutral", mix, children } = handle.props

    return <span mix={[badgeBase, toneStyles[tone], badgePop, mix]}>{children}</span>
  }
}
