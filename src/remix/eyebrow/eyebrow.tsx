import { css, type Handle, type MixInput, type RemixNode } from "remix/component"

/**
 * The kicker above a heading: small, uppercase, widely tracked.
 *
 * One block, because Eyebrow has no axes — every instance looks the same, and
 * what varies between brands varies through the tokens rather than through a
 * prop. text-transform reads a token for that reason: caps are taste, not
 * structure, and a skin has to be able to say `none`.
 */
const eyebrowBase = css({
  fontSize: "var(--ui-eyebrow-size)",
  fontWeight: "var(--ui-eyebrow-weight)",
  letterSpacing: "var(--ui-eyebrow-tracking)",
  textTransform: "var(--ui-eyebrow-transform)",
  color: "var(--ui-eyebrow-ink)",
})

export interface EyebrowProps {
  /**
   * Adds properties Eyebrow does not declare — spacing below it, for instance,
   * though a `Stack` around the pair is the better answer. It does not reliably
   * override one Eyebrow declares; those go through the tokens.
   */
  mix?: MixInput<HTMLParagraphElement> | undefined
  children?: RemixNode | undefined
}

export function Eyebrow(handle: Handle<EyebrowProps>) {
  return () => {
    const { mix, children } = handle.props

    return <p mix={[eyebrowBase, mix]}>{children}</p>
  }
}
