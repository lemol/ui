import { css } from "remix/component"
import { Row } from "../row/row.tsx"
import { Text } from "../text/text.tsx"
import { Kbd } from "./kbd.tsx"

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

export function KbdDemo() {
  return () => (
    <>
      <p mix={label}>kbd: one key per cap, side by side for a chord</p>
      <div mix={group}>
        <Row gap={2}>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
          <Kbd>Esc</Kbd>
          <Kbd>j</Kbd>
          <Kbd>k</Kbd>
        </Row>
        <Text>
          Press <Kbd>g</Kbd> then <Kbd>h</Kbd> to go home, without the line moving.
        </Text>
      </div>
    </>
  )
}
