import { css, type Handle, type MixInput, type RemixNode } from "remix/component"

/**
 * A key, as a `<kbd>`: the native element for keyboard input, so a screen
 * reader and a copy-paste both meet the key's own name.
 *
 * `inline-flex` keeps the cap inside a sentence or a row of hints without
 * breaking the line, and centres a glyph such as `⌘` against its border.
 * Several caps pressed together are several `Kbd`s side by side; the
 * component draws one key and says nothing about chords.
 */
const kbdStyle = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--ui-kbd-gap)",
  paddingInline: "var(--ui-kbd-pad-x)",
  borderStyle: "solid",
  borderColor: "var(--ui-kbd-border)",
  borderWidth: "var(--ui-kbd-border-width)",
  borderBlockEndWidth: "var(--ui-kbd-border-bottom-width)",
  borderRadius: "var(--ui-kbd-radius)",
  background: "var(--ui-kbd-bg)",
  color: "var(--ui-kbd-ink)",
  fontFamily: "inherit",
  fontSize: "var(--ui-kbd-font-size)",
  fontWeight: "var(--ui-kbd-font-weight)",
  lineHeight: "var(--ui-kbd-leading)",
  whiteSpace: "nowrap",
})

export interface KbdProps {
  /**
   * Adds properties Kbd does not declare — a margin, a grid placement. It
   * does not reliably override one Kbd declares; set its `--ui-kbd-*` token
   * for that.
   */
  mix?: MixInput<HTMLElement> | undefined
  children?: RemixNode | undefined
}

export function Kbd(handle: Handle<KbdProps>) {
  return () => {
    const { mix, children } = handle.props

    return <kbd mix={[kbdStyle, mix]}>{children}</kbd>
  }
}
