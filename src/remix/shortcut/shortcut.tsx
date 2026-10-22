import { type Handle, type MixInput } from "remix/component"
import { css } from "../css.ts"
import { Kbd } from "../kbd/kbd.tsx"

/**
 * The chord, cap after cap, with no space between: they read as one key press.
 * A device whose primary pointer cannot hover is a touch screen, which has no
 * keyboard to press them on, so there the hint is gone rather than a promise
 * the person cannot keep. A laptop with a touch screen still hovers, and a
 * tablet with a trackpad attached does too, so both keep it.
 */
const shortcutStyle = css({
  display: "inline-flex",
  alignItems: "center",
  "@media (hover: none)": { display: "none" },
})

export interface ShortcutProps {
  /** The keys of the chord, in the order they are held: `["⌘", "↵"]`. */
  keys: ReadonlyArray<string>
  /**
   * Adds properties Shortcut does not declare — a margin, a grid placement.
   * It does not reliably override one it declares.
   */
  mix?: MixInput<HTMLElement> | undefined
}

/**
 * A keyboard shortcut's hint: the chord as key caps, shown only where there
 * is a keyboard to press it on.
 *
 * Hidden from assistive technology, because the caps are a sighted keyboard
 * user's reminder; name the shortcut on the control it triggers, with
 * `aria-keyshortcuts`, where a screen reader announces it with the control.
 */
export function Shortcut(handle: Handle<ShortcutProps>) {
  return () => {
    const { keys, mix } = handle.props

    return (
      <span aria-hidden="true" data-shortcut="" mix={[shortcutStyle, mix]}>
        {keys.map((key, index) => (
          <Kbd key={`${index}-${key}`}>{key}</Kbd>
        ))}
      </span>
    )
  }
}
