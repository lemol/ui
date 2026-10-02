import { type CSSMixinDescriptor, css } from "remix/component"

/**
 * Cross-axis alignment, shared by Stack and Row for the same reason the gap
 * scale is shared: two copies of one Record drift, and `remix/component` caches a
 * block by content so they would collapse to one sub-layer anyway.
 *
 * `start` and `end` are the logical keywords rather than `flex-start` and
 * `flex-end`. Both are supported across the whole browser baseline
 * (Chrome 114+, Safari 17+, Firefox 125+), and the logical pair flips with
 * writing direction without a second rule.
 */
export type Align = "start" | "center" | "end" | "baseline" | "stretch"

export const alignStyles: Record<Align, CSSMixinDescriptor> = {
  start: css({ alignItems: "start" }),
  center: css({ alignItems: "center" }),
  end: css({ alignItems: "end" }),
  baseline: css({ alignItems: "baseline" }),
  stretch: css({ alignItems: "stretch" }),
}
