import { css, type Handle, type MixInput } from "remix/ui"

/**
 * A gradient sweeping across itself, not an opacity pulse: a shimmer reads
 * as "content is coming" rather than "something is wrong with this box",
 * which a flashing block can look like.
 *
 * Sized 100% × 1em by default — a text-line shape — and resized entirely
 * through `mix`, the same way `Container`/`Grid` leave arbitrary structural
 * lengths to the caller rather than inventing a `width`/`height` prop pair
 * for values that are about the content being replaced, not a design choice.
 */
const skeletonStyle = css({
  display: "block",
  inlineSize: "100%",
  blockSize: "1em",
  borderRadius: "var(--ui-skeleton-radius)",
  backgroundImage:
    "linear-gradient(90deg, var(--ui-skeleton-bg) 25%, var(--ui-skeleton-shimmer) 50%, var(--ui-skeleton-bg) 75%)",
  backgroundSize: "200% 100%",
  animation: "ui-skeleton-shimmer var(--ui-skeleton-duration) var(--ui-skeleton-easing) infinite",
  "@keyframes ui-skeleton-shimmer": {
    "0%": { backgroundPosition: "200% 0" },
    "100%": { backgroundPosition: "-200% 0" },
  },
})

export interface SkeletonProps {
  mix?: MixInput<HTMLElement> | undefined
}

export function Skeleton(handle: Handle<SkeletonProps>) {
  return () => {
    const { mix } = handle.props
    // aria-hidden: a skeleton stands in for content that has not arrived, so
    // it names nothing to assistive tech — the region it sits in is what
    // should carry the loading announcement, once, rather than one per
    // placeholder.
    return <div aria-hidden="true" mix={[skeletonStyle, mix]} />
  }
}
