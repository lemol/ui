import { css } from "remix/component"
import { Row } from "../row/row.tsx"
import { Text } from "../text/text.tsx"
import { Shortcut } from "./shortcut.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  marginBlockEnd: "var(--sp-2)",
})

const group = css({
  display: "flex",
  flexDirection: "column",
  gap: "var(--sp-4)",
  marginBlockEnd: "var(--sp-6)",
})

export function ShortcutDemo() {
  return () => (
    <>
      <p mix={label}>shortcut: a chord's caps, gone on a screen with no keyboard to press them</p>
      <div mix={group}>
        <Row gap={4}>
          <Shortcut keys={["⌘", "↵"]} />
          <Shortcut keys={["⌘", "K"]} />
          <Shortcut keys={["Esc"]} />
        </Row>
        <Text>
          Send with <Shortcut keys={["⌘", "↵"]} />, or the button: a phone sees only the button.
        </Text>
      </div>
    </>
  )
}
