import { css, type Handle, type MixInput, type RemixNode } from "remix/ui"

/**
 * The page's inline measure, and the component that proves the primitives
 * were the right answer rather than a workaround: `--page-max` and `--gutter`
 * exist in `schema.sizing` precisely so Container needs no tokens of its own.
 *
 * Inline axis only. Block spacing belongs to the Stack inside it, which knows
 * what it is stacking; a container that also owned vertical rhythm would be
 * two decisions in one component.
 */
const containerBase = css({
  maxInlineSize: "var(--page-max)",
  paddingInline: "var(--gutter)",
  marginInline: "auto",
})

export interface ContainerProps {
  /**
   * Adds properties Container does not declare. It does not reliably override
   * one it does — and unlike the other three, Container has no props to reach
   * for instead, because both of its lengths are primitives a theme sets.
   *
   * It also cannot change the tag: a caller wanting `<main>` or `<section>`
   * wraps the Container rather than configuring it. An `as` prop belongs to
   * whichever later task first needs one, with the accessibility question
   * considered then.
   */
  mix?: MixInput<HTMLDivElement> | undefined
  children?: RemixNode | undefined
}

export function Container(handle: Handle<ContainerProps>) {
  return () => {
    const { mix, children } = handle.props
    return <div mix={[containerBase, mix]}>{children}</div>
  }
}
