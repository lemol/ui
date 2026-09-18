import { css } from "remix/ui"
import { Text, type TextSize, type TextTone } from "./text.tsx"

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
  gap: "var(--sp-2)",
  marginBlockEnd: "var(--sp-6)",
})

const sizes: TextSize[] = ["sm", "md", "lg"]
const tones: TextTone[] = ["default", "muted", "subtle"]

export function TextDemo() {
  return () => (
    <>
      <p mix={label}>text: three sizes</p>
      <div mix={group}>
        {sizes.map((size) => (
          <Text size={size}>size {size}: the quick brown fox jumps over the lazy dog</Text>
        ))}
      </div>
      <p mix={label}>text: three tones</p>
      <div mix={group}>
        {tones.map((tone) => (
          <Text tone={tone}>tone {tone}: the quick brown fox jumps over the lazy dog</Text>
        ))}
      </div>
      <p mix={label}>text: inline, inside a sentence</p>
      <div mix={group}>
        <Text>
          A paragraph with{" "}
          <Text as="span" size="sm" tone="muted">
            an inline muted aside
          </Text>{" "}
          set in the middle of it, which is what <code>as</code> exists for.
        </Text>
      </div>
    </>
  )
}
