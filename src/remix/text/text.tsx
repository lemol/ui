import {
  type CSSMixinDescriptor,
  css,
  type Handle,
  type MixInput,
  type RemixNode,
} from "remix/component"

export type TextSize = "sm" | "md" | "lg"
export type TextTone = "default" | "muted" | "subtle"

/**
 * Three interchangeable tags. They differ in block-versus-inline layout and in
 * nothing an assistive technology reports, which is why this is not the
 * polymorphism question Container's spec deferred — one that could reach
 * `section` or `main` would be.
 *
 * The type comes from the list, not the other way around: a fourth tag added
 * only to the union would compile, ship, and be covered by no test and no demo.
 */
export const textTags = ["p", "span", "div"] as const
export type TextTag = (typeof textTags)[number]

/**
 * Leading only. font-size belongs to the size block and color to the tone
 * block, each of which always renders: three blocks, three properties, no two
 * of them able to declare the same one.
 *
 * font-weight is absent on purpose. See TextProps.mix.
 */
const textBase = css({
  lineHeight: "var(--ui-text-leading)",
})

export const sizeStyles: Record<TextSize, CSSMixinDescriptor> = {
  sm: css({ fontSize: "var(--ui-text-size-sm)" }),
  md: css({ fontSize: "var(--ui-text-size-md)" }),
  lg: css({ fontSize: "var(--ui-text-size-lg)" }),
}

export const toneStyles: Record<TextTone, CSSMixinDescriptor> = {
  default: css({ color: "var(--ui-text-ink)" }),
  muted: css({ color: "var(--ui-text-ink-muted)" }),
  subtle: css({ color: "var(--ui-text-ink-subtle)" }),
}

export interface TextProps {
  /** Defaults to `md`. Its block always renders, carrying that default. */
  size?: TextSize | undefined
  /** Defaults to `default`. Its block always renders, carrying that default. */
  tone?: TextTone | undefined
  /**
   * Defaults to `p`. Pass `span` for text inside a sentence: a `<p>` nested in
   * a `<p>` is invalid markup that the parser silently unnests, which is how
   * inline muted text ends up styled by hand and off the contract.
   */
  as?: TextTag | undefined
  /**
   * Adds properties Text does not declare, and `font-weight` is deliberately
   * one of them: `mix={css({ fontWeight: "var(--fw-semibold)" })}` is reliable
   * because Text declares no weight at all. It does not reliably override
   * `line-height`, `font-size` or `color`, which Text does declare — those go
   * through `size`, `tone`, or the token.
   */
  mix?: MixInput<HTMLParagraphElement | HTMLSpanElement | HTMLDivElement> | undefined
  children?: RemixNode | undefined
}

export function Text(handle: Handle<TextProps>) {
  return () => {
    const { size = "md", tone = "default", as = "p", mix, children } = handle.props
    const Tag = as

    return <Tag mix={[textBase, sizeStyles[size], toneStyles[tone], mix]}>{children}</Tag>
  }
}
