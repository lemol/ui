import { attrs, type Handle, type RemixNode } from "remix/component"
import { Button, type ButtonProps } from "../button/button.tsx"
import { invoke } from "../invocation.ts"

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

/**
 * A button whose command is `--copy`, minted the same way `overlay()` mints
 * a dialog id: one variable, `id`, is what both the element's own `id` and
 * — absent `for` — its `commandfor` read, so there is no second string that
 * could drift from the first. Pointing `for` at another element's id is
 * unavoidably a plain string, the same as `<label for>` or `Field`'s own
 * `name` — that id belongs to markup this component does not render.
 *
 * `--copy`'s handler (`runtime.ts`) swaps this button's own text for
 * `confirmLabel`, so `children` has to be plain text for the swap to look
 * right — an icon-plus-text button loses the icon for the confirmation
 * window and gets it back after. With the runtime absent the button is
 * inert: there is no clipboard API without JavaScript, and that is accepted
 * rather than worked around with a fallback nobody asked for.
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
      <Button {...rest} id={id} invoke={copy} mix={[dataAttrs, mix]}>
        {children ?? "Copy"}
      </Button>
    )
  }
}
