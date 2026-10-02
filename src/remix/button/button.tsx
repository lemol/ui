import {
  type CSSMixinDescriptor,
  css,
  type Handle,
  type MixInput,
  type RemixNode,
} from "remix/component"
import type { Invocation } from "../invocation.ts"

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
 *
 * The `:disabled` override lives here, inside the tone's own css() block,
 * rather than in buttonBase. remix/component gives every css() call its own cascade
 * sub-layer, and within layers, layer order beats specificity — so a
 * `.base:disabled` rule in a layer registered before the tone's layer loses
 * to `.tone { color: … }` even though it is more specific. Putting the
 * disabled declarations in the same css() block as the tone declarations
 * they must beat keeps them in the same sub-layer, where normal specificity
 * rules apply and `.cls:disabled` reliably beats `.cls`. The values are
 * tone-independent by design; only their position moved.
 *
 * LinkButton shares these blocks, so every tone carries a `:disabled` rule
 * that can never match an `<a>`. Four inert rules are the price of one
 * sub-layer per tone. Do not "clean them up" by splitting the disabled
 * declarations back into a shared block: that is exactly the arrangement that
 * shipped disabled buttons in their tone's colours.
 */
const toneStyle = (tone: ButtonTone): CSSMixinDescriptor =>
  css({
    background: `var(--ui-btn-${tone}-bg)`,
    borderColor: `var(--ui-btn-${tone}-border)`,
    color: `var(--ui-btn-${tone}-ink)`,
    "&:hover:not(:disabled)": { background: `var(--ui-btn-${tone}-bg-hover)` },
    "&:disabled": {
      background: "var(--ui-btn-disabled-bg)",
      borderColor: "var(--ui-btn-disabled-border)",
      color: "var(--ui-btn-disabled-ink)",
      cursor: "not-allowed",
    },
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
  /**
   * For an `aria-describedby`, a `<label for>`, or — `CopyButton`'s case —
   * a `commandfor` pointing the button at itself. Optional because most
   * buttons need no id at all.
   */
  id?: string | undefined
  name?: string | undefined
  value?: string | undefined
  /**
   * What this button invokes, minted by `overlay()`. There is deliberately no
   * `command`/`commandfor` pair here: a mismatched id fails silently, so the
   * only way to set the attributes is with a value the factory produced.
   */
  invoke?: Invocation | undefined
  /**
   * The structural escape hatch: properties the contract has no token for,
   * such as `position` or a grid placement owned by the layout around it.
   *
   * It reliably **adds** properties Button does not itself declare. It does
   * **not** reliably override one Button does declare, and composing it last
   * here does not make it win. remix/component gives every `css()` block its own
   * cascade sub-layer; within a layer, layer order beats specificity, and
   * sub-layer order follows the order blocks are first encountered during the
   * render rather than the order of this array. A descriptor that already
   * rendered on an earlier element registers first, so Button's own tone then
   * beats the override — silently.
   *
   * To change a property Button declares, set its `--ui-btn-*` token. That is
   * the intended path and the reason the contract exists. `!important` also
   * works, because Button declares nothing important of its own.
   */
  mix?: MixInput<HTMLButtonElement> | undefined
  children?: RemixNode | undefined
}

export function Button(handle: Handle<ButtonProps>) {
  return () => {
    const { tone = "neutral", size = "md", type = "button" } = handle.props
    const { disabled, id, name, value, invoke, mix, children } = handle.props
    return (
      <button
        command={invoke?.command}
        commandfor={invoke?.commandfor}
        disabled={disabled}
        id={id}
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
  /**
   * Adds properties LinkButton does not declare; it does not reliably
   * override one it does. Same mechanism as `ButtonProps.mix` — sub-layer
   * order, not array order, decides — so reach for the `--ui-btn-*` token to
   * change something the component already sets.
   */
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
