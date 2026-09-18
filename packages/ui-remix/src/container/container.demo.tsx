import { css } from "remix/ui"
import { Container } from "./container.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

/**
 * A full-bleed band behind the Container, so the measure it holds is visible
 * as a difference rather than described. Without it a Container on a narrow
 * viewport looks like a plain div.
 */
const bleed = css({
  background: "var(--surface)",
  borderBlock: "1px solid var(--hairline)",
  paddingBlock: "var(--sp-6)",
  marginBlockEnd: "var(--sp-8)",
})

const body = css({
  background: "var(--surface-raised)",
  border: "1px dashed var(--hairline-strong)",
  borderRadius: "var(--r-md)",
  padding: "var(--sp-4)",
})

export function ContainerDemo() {
  return () => (
    <>
      <p mix={label}>container: page-max wide, gutter padded, centred</p>
      <div mix={bleed}>
        <Container>
          <div mix={body}>
            This sits inside a Container. The band behind it runs the full width of the viewport;
            the dashed box stops at <code>--page-max</code> and keeps <code>--gutter</code> clear on
            each side. Narrow the window past the maximum and the gutter is what remains.
          </div>
        </Container>
      </div>
    </>
  )
}
