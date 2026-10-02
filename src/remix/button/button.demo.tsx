import { css } from "remix/component"
import { Button, type ButtonSize, type ButtonTone, LinkButton } from "./button.tsx"

const tones: ButtonTone[] = ["primary", "neutral", "ghost", "danger"]
const sizes: ButtonSize[] = ["md", "sm"]

/**
 * The demo is styled from primitives rather than from Button's own tokens: it
 * is a page, not a component, and no layout component owns this spacing yet.
 */
const row = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--sp-3)",
  marginBlockEnd: "var(--sp-4)",
})

const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
})

export function ButtonDemo() {
  return () => (
    <>
      {sizes.map((size) => (
        <div key={size}>
          <p mix={label}>size {size}</p>
          <div mix={row}>
            {tones.map((tone) => (
              <Button key={tone} size={size} tone={tone}>
                {tone}
              </Button>
            ))}
            {/* Three disabled buttons, not one. neutral's colours are the
                closest to the disabled ones, so a manual browser pass over
                neutral alone is what let a disabled button render in its
                tone's colours. primary and danger are the tones where the
                override failing is obvious at a glance. */}
            <Button disabled size={size}>
              disabled
            </Button>
            <Button disabled size={size} tone="primary">
              disabled primary
            </Button>
            <Button disabled size={size} tone="danger">
              disabled danger
            </Button>
            <LinkButton href="#" size={size} tone="primary">
              link
            </LinkButton>
          </div>
        </div>
      ))}
    </>
  )
}
