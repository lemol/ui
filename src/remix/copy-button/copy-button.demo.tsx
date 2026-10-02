import { css } from "remix/component"
import { CopyButton } from "./copy-button.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const codeStyle = css({
  fontFamily: "var(--font-mono)",
})

export function CopyButtonDemo() {
  return () => (
    <>
      <p mix={label}>copybutton: its own value, --copy writes it and swaps the label back</p>
      <CopyButton id="api-key-copy" tone="neutral" value="sk_live_4242424242424242">
        Copy API key
      </CopyButton>

      <p mix={label}>copybutton: pointed at another element's text</p>
      <p>
        Account number:{" "}
        <code id="account-number" mix={codeStyle}>
          4000 1234 5678 9010
        </code>{" "}
        <CopyButton for="account-number" id="account-number-copy" size="sm" tone="ghost">
          Copy
        </CopyButton>
      </p>
    </>
  )
}
