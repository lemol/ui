import { css } from "remix/component"
import { Row } from "../row/row.tsx"
import { Text } from "../text/text.tsx"
import { Badge, type BadgeTone } from "./badge.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const group = css({
  display: "flex",
  flexDirection: "column",
  gap: "var(--sp-4)",
  marginBlockEnd: "var(--sp-6)",
})

const tones: BadgeTone[] = ["neutral", "success", "warning", "danger", "info"]

export function BadgeDemo() {
  return () => (
    <>
      <p mix={label}>badge: five tones, and one inline where the metrics have to hold</p>
      <div mix={group}>
        <Row gap={2}>
          {tones.map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
        </Row>
        <Text>
          A badge sits <Badge tone="info">mid-sentence</Badge> without pushing the line apart, which
          is what <code>inline-flex</code> and a tokenised line-height are for.
        </Text>
      </div>
    </>
  )
}
