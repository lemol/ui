import { css, type Handle, type MixInput, type RemixNode } from "remix/component"

export type CalloutTone = "neutral" | "success" | "warning" | "danger" | "info"

const calloutBase = css({
  display: "flex",
  alignItems: "start",
  gap: "var(--ui-callout-gap)",
  padding: "var(--ui-callout-pad)",
  borderStyle: "solid",
  borderWidth: "var(--ui-callout-border-width)",
  borderRadius: "var(--ui-callout-radius)",
})

/** Same reasoning as Badge's own tone block: one background shorthand, so a skin may set a gradient. */
const toneStyle = (tone: CalloutTone) =>
  css({
    background: `var(--ui-callout-${tone}-bg)`,
    borderColor: `var(--ui-callout-${tone}-border)`,
    color: `var(--ui-callout-${tone}-ink)`,
  })

const toneStyles: Record<CalloutTone, ReturnType<typeof toneStyle>> = {
  danger: toneStyle("danger"),
  info: toneStyle("info"),
  neutral: toneStyle("neutral"),
  success: toneStyle("success"),
  warning: toneStyle("warning"),
}

const iconStyle = css({
  flexShrink: 0,
  inlineSize: "var(--ui-callout-icon-size)",
  blockSize: "var(--ui-callout-icon-size)",
})

const bodyStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "var(--ui-callout-body-gap)",
  minInlineSize: "0",
})

const titleStyle = css({
  fontSize: "var(--ui-callout-title-font-size)",
  fontWeight: "var(--ui-callout-title-font-weight)",
})

const descriptionStyle = css({
  fontSize: "var(--ui-callout-description-font-size)",
})

export interface CalloutProps {
  tone?: CalloutTone | undefined
  title: string
  description?: RemixNode | undefined
  /** A decorative glyph. `aria-hidden` is the caller's, same as `Dialog`'s close glyph. */
  icon?: RemixNode | undefined
  /** A single action row, typically a `Button` or `LinkButton`. */
  action?: RemixNode | undefined
  mix?: MixInput<HTMLDivElement> | undefined
}

export function Callout(handle: Handle<CalloutProps>) {
  return () => {
    const { tone = "neutral", title, description, icon, action, mix } = handle.props
    return (
      <div mix={[calloutBase, toneStyles[tone], mix]}>
        {icon !== undefined ? <div mix={iconStyle}>{icon}</div> : undefined}
        <div mix={bodyStyle}>
          <p mix={titleStyle}>{title}</p>
          {description !== undefined ? <p mix={descriptionStyle}>{description}</p> : undefined}
          {action !== undefined ? <div>{action}</div> : undefined}
        </div>
      </div>
    )
  }
}
