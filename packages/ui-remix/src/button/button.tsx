import { type CSSMixinDescriptor, css, type Handle, type MixInput, type RemixNode } from "remix/ui"

export type ButtonTone = "primary" | "neutral" | "ghost" | "danger"

/**
 * Two sizes, because `schema.sizing` holds exactly `control-h` and
 * `control-h-sm`. A third would need a primitive that does not exist, so the
 * size axis is decided by the schema rather than by taste.
 */
export type ButtonSize = "sm" | "md"

/**
 * Every declaration reads a --ui-btn-* token or a structural keyword. A literal
 * colour, radius, duration or space step here is the failure this component
 * exists to make impossible, and button.test.tsx checks for one.
 */
const buttonBase = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--ui-btn-gap)",
  borderStyle: "solid",
  borderWidth: "var(--ui-btn-border-width)",
  borderRadius: "var(--ui-btn-radius)",
  fontFamily: "inherit",
  fontWeight: "var(--ui-btn-font-weight)",
  whiteSpace: "nowrap",
  textDecoration: "none",
  appearance: "none",
  cursor: "pointer",
  // `background` and not `background-color`: a skin may set --ui-btn-<tone>-bg
  // to a gradient, and background-color drops a gradient value as invalid.
  // Naming the shorthand here means gradients do not interpolate, so a
  // gradient skin swaps instantly on hover while the flat default transitions.
  transitionProperty: "background, border-color, color",
  transitionDuration: "var(--ui-btn-transition-duration)",
  transitionTimingFunction: "var(--ui-btn-transition-easing)",
  // No outline anywhere in here. The reset's :where(:focus-visible) rule owns
  // the focus ring, and it applies precisely because nothing here competes
  // with it. A per-component ring is how a focus ring drifts.
  "&:disabled": {
    background: "var(--ui-btn-disabled-bg)",
    borderColor: "var(--ui-btn-disabled-border)",
    color: "var(--ui-btn-disabled-ink)",
    cursor: "not-allowed",
  },
})

const sizeStyles: Record<ButtonSize, CSSMixinDescriptor> = {
  md: css({
    height: "var(--ui-btn-height)",
    paddingInline: "var(--ui-btn-pad-x)",
    fontSize: "var(--ui-btn-font-size)",
  }),
  sm: css({
    height: "var(--ui-btn-height-sm)",
    paddingInline: "var(--ui-btn-pad-x-sm)",
    fontSize: "var(--ui-btn-font-size-sm)",
  }),
}

/**
 * `:active` deliberately reuses the hover background. A separate press colour
 * is four more tokens for an effect that lasts a hundred milliseconds.
 */
const toneStyle = (tone: ButtonTone): CSSMixinDescriptor =>
  css({
    background: `var(--ui-btn-${tone}-bg)`,
    borderColor: `var(--ui-btn-${tone}-border)`,
    color: `var(--ui-btn-${tone}-ink)`,
    "&:hover:not(:disabled)": { background: `var(--ui-btn-${tone}-bg-hover)` },
  })

const toneStyles: Record<ButtonTone, CSSMixinDescriptor> = {
  primary: toneStyle("primary"),
  neutral: toneStyle("neutral"),
  ghost: toneStyle("ghost"),
  danger: toneStyle("danger"),
}

export interface ButtonProps {
  tone?: ButtonTone | undefined
  size?: ButtonSize | undefined
  /** Defaulted to "button": a bare <button> inside a <form> submits it. */
  type?: "button" | "submit" | "reset" | undefined
  disabled?: boolean | undefined
  name?: string | undefined
  value?: string | undefined
  /** The structural escape hatch. Composed last, so it wins. */
  mix?: MixInput<HTMLButtonElement> | undefined
  children?: RemixNode | undefined
}

export function Button(handle: Handle<ButtonProps>) {
  return () => {
    const { tone = "neutral", size = "md", type = "button" } = handle.props
    const { disabled, name, value, mix, children } = handle.props
    return (
      <button
        disabled={disabled}
        mix={[buttonBase, toneStyles[tone], sizeStyles[size], mix]}
        name={name}
        type={type}
        value={value}
      >
        {children}
      </button>
    )
  }
}

export interface LinkButtonProps {
  /**
   * Required. `aria-disabled` on an anchor does not prevent navigation, so a
   * disabled link is a broken link — omit the LinkButton instead.
   */
  href: string
  tone?: ButtonTone | undefined
  size?: ButtonSize | undefined
  mix?: MixInput<HTMLAnchorElement> | undefined
  children?: RemixNode | undefined
}

export function LinkButton(handle: Handle<LinkButtonProps>) {
  return () => {
    const { href, tone = "neutral", size = "md", mix, children } = handle.props
    return (
      <a href={href} mix={[buttonBase, toneStyles[tone], sizeStyles[size], mix]}>
        {children}
      </a>
    )
  }
}
