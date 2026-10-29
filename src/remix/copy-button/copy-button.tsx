import { attrs, type Handle, type RemixNode } from "remix/component"
import { Button, type ButtonProps } from "../button/button.tsx"
import { css } from "../css.ts"
import { invoke } from "../invocation.ts"
import { animation, keyframes } from "../motion/motion.ts"

export interface CopyButtonProps extends Omit<ButtonProps, "children" | "id" | "invoke"> {
  /** This button's own id. Required: `--copy` needs somewhere to dispatch the command, and it doubles as the `commandfor` target when `for` is omitted. */
  id: string
  /** Another element's id, to copy its text content instead of a literal `value`. */
  for?: string | undefined
  /** The literal text to copy. Ignored when `for` is given. */
  value?: string | undefined
  /** Shown in place of the button's own label for a fixed duration after copying. */
  confirmLabel?: string | undefined
  children?: RemixNode | undefined
}

const confirmTiming = {
  duration: "var(--ui-copy-confirm-duration)",
  easing: "var(--ui-copy-confirm-easing)",
}

/**
 * Both labels share one grid cell, so the button keeps the wider one's width
 * and swapping them moves nothing. Layout only: every rule touching their
 * `opacity` or `animation` is in `confirmStyle`.
 */
const labelStack = css({ display: "inline-grid" })
const labelCell = css({ gridArea: "1 / 1" })
const confirmCell = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--ui-copy-confirm-gap)",
})

const checkStyle = css({
  inlineSize: "var(--ui-copy-check-size)",
  blockSize: "var(--ui-copy-check-size)",
})

/**
 * Every rule that touches the labels' `opacity` or `animation`, in one block on
 * the button with descendant selectors. Layer order beats specificity across
 * blocks, so splitting these over the spans would let whichever block rendered
 * last win, not the more specific state. The confirm label rests at zero
 * opacity; `data-copy-confirmed`, which `--copy` sets, swaps the two and plays
 * the dissolve and the drawn check. Both durations are tokens the reset zeroes.
 */
const confirmStyle = css({
  '& [data-copy-label="confirm"]': { opacity: "0" },
  "& [data-copy-label]": {
    transition: `opacity ${confirmTiming.duration} ${confirmTiming.easing}`,
  },
  '&[data-copy-confirmed] [data-copy-label="idle"]': { opacity: "0" },
  '&[data-copy-confirmed] [data-copy-label="confirm"]': {
    opacity: "1",
    animation: animation("dissolve", confirmTiming),
  },
  '&[data-copy-confirmed] [data-copy-label="confirm"] path': {
    strokeDasharray: "1",
    animation: animation("draw", confirmTiming),
  },
})

/**
 * A button whose command is `--copy`, minted the same way `overlay()` mints
 * a dialog id: one variable, `id`, is what both the element's own `id` and
 * — absent `for` — its `commandfor` read, so there is no second string that
 * could drift from the first. Pointing `for` at another element's id is
 * unavoidably a plain string, the same as `<label for>` or `Field`'s own
 * `name` — that id belongs to markup this component does not render.
 *
 * It renders two labels in one grid cell: the idle one (`children`, any
 * node) and a confirm one holding a check and `confirmLabel`, hidden from
 * assistive tech until `--copy` (`runtime.ts`) sets `data-copy-confirmed` and
 * swaps `aria-hidden`. Nothing rewrites the button's text, so an icon in
 * `children` survives. A bare `--copy` invoker with no such labels gets its
 * own text swapped instead. With the runtime absent the button is inert:
 * there is no clipboard API without JavaScript, and that is accepted rather
 * than worked around with a fallback nobody asked for.
 */
export function CopyButton(handle: Handle<CopyButtonProps>) {
  return () => {
    const { id, for: forId, value, confirmLabel = "Copied!", children, mix, ...rest } = handle.props
    const commandforId = forId ?? id
    const copy = invoke("--copy", commandforId)
    const dataAttrs =
      forId === undefined
        ? attrs({ "data-copy-confirm-label": confirmLabel, "data-copy-value": value ?? "" })
        : attrs({ "data-copy-confirm-label": confirmLabel })

    return (
      <Button
        {...rest}
        id={id}
        invoke={copy}
        mix={[dataAttrs, confirmStyle, keyframes.dissolve, keyframes.draw, mix]}
      >
        <span mix={labelStack}>
          <span data-copy-label="idle" mix={labelCell}>
            {children ?? "Copy"}
          </span>
          <span aria-hidden="true" data-copy-label="confirm" mix={[labelCell, confirmCell]}>
            <svg aria-hidden="true" fill="none" mix={checkStyle} viewBox="0 0 12 12">
              <path
                d="M2.5 6.5L5 9L9.5 3.5"
                pathLength="1"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
              />
            </svg>
            {confirmLabel}
          </span>
        </span>
      </Button>
    )
  }
}
