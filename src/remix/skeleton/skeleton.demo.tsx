import { css } from "remix/component"
import { Stack } from "../stack/stack.tsx"
import { Skeleton } from "./skeleton.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const wideStyle = css({ inlineSize: "12rem" })
const avatarStyle = css({ inlineSize: "2.5rem", blockSize: "2.5rem", borderRadius: "50%" })

export function SkeletonDemo() {
  return () => (
    <>
      <p mix={label}>skeleton: a shimmering placeholder, sized entirely through mix</p>
      <Stack gap={2}>
        <Skeleton mix={wideStyle} />
        <Skeleton />
        <Skeleton mix={avatarStyle} />
      </Stack>
    </>
  )
}
