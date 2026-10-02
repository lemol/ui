import { css, type Handle } from "remix/component"

/**
 * A ring drawn from `border`, one arc retinted, rotated by the native
 * `rotate` property — no transform matrix, no pseudo-element. `@keyframes`
 * needs no minted name: unlike a `view-transition-name`, two elements
 * animating the same `@keyframes` is the normal case, not a collision.
 *
 * `linear` is a structural keyword, not a token: every spinner in existence
 * rotates at constant speed, so there is no brand decision here the way
 * there is for `--ease-out-quad` elsewhere.
 */
const spinnerStyle = css({
  display: "inline-block",
  inlineSize: "var(--ui-spinner-size)",
  blockSize: "var(--ui-spinner-size)",
  borderStyle: "solid",
  borderWidth: "var(--ui-spinner-border-width)",
  borderColor: "var(--ui-spinner-track)",
  borderRadius: "var(--ui-spinner-radius)",
  borderBlockStartColor: "var(--ui-spinner-stroke)",
  rotate: "0deg",
  animation: "ui-spinner-spin var(--ui-spinner-duration) linear infinite",
  "@keyframes ui-spinner-spin": {
    from: { rotate: "0deg" },
    to: { rotate: "360deg" },
  },
})

export interface SpinnerProps {
  /** The accessible name a caller should give the loading state — otherwise a spinner is an unlabelled image to assistive tech. */
  label?: string | undefined
}

export function Spinner(handle: Handle<SpinnerProps>) {
  return () => {
    const { label = "Loading" } = handle.props
    return <span aria-label={label} mix={spinnerStyle} role="status" />
  }
}
