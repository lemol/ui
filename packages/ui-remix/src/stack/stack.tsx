import { css, type Handle, type MixInput, type RemixNode } from "remix/ui"
import { type Align, alignStyles } from "../align.ts"
import { gaps, type SpaceStep } from "../space.ts"

/**
 * Stack declares no tokens of its own, and that is the point of it. Every
 * value it emits is a structural keyword or a primitive the caller chose from
 * the space scale — stack.test.tsx fails on a `--ui-` anywhere in its output.
 *
 * A gap token was considered and rejected: a stack's spacing is a per-instance
 * composition decision, so two stacks on one page routinely want different
 * gaps and one themeable value cannot express that. See
 * docs/superpowers/specs/2026-09-18-ui-remix-layout-design.md.
 */
const stackBase = css({
  display: "flex",
  flexDirection: "column",
})

export interface StackProps {
  /**
   * A step on the primitive space scale: `gap={4}` is `var(--sp-4)`, four of
   * the schema's 4px units.
   *
   * Defaults to `0`, presuming no spacing, for the same reason there is no
   * gap token. The block renders either way — two blocks that could both
   * declare `gap` would hand sub-layer order the decision, and that order
   * follows render order rather than source order.
   */
  gap?: SpaceStep | undefined
  /**
   * Cross-axis alignment. Its block renders only when this is passed, so a
   * Stack without it declares no `align-items` at all and a caller's
   * `mix={css({ alignItems: … })}` is reliable.
   */
  align?: Align | undefined
  /**
   * Adds properties Stack does not declare. It does not reliably override one
   * it does: each `css()` block is its own cascade sub-layer, layer order
   * beats specificity within a layer, and sub-layer order follows the order
   * blocks are first encountered during the render rather than the order of
   * this array. For `gap` and `align`, use the props — they exist for this.
   */
  mix?: MixInput<HTMLDivElement> | undefined
  children?: RemixNode | undefined
}

export function Stack(handle: Handle<StackProps>) {
  return () => {
    const { gap = 0, align, mix, children } = handle.props
    return (
      <div mix={[stackBase, gaps[gap], align === undefined ? undefined : alignStyles[align], mix]}>
        {children}
      </div>
    )
  }
}
