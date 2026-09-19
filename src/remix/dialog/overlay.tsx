import type { Handle, MixInput, RemixNode } from "remix/ui"
import { Button, type ButtonProps } from "../button/button.tsx"
import { invoke } from "../invocation.ts"
import { DialogPanel } from "./dialog.tsx"

/** A trigger and a close button are Buttons; only `invoke` is the factory's. */
export type OverlayButtonProps = Omit<ButtonProps, "invoke">

export interface OverlayDialogProps {
  title: string
  mix?: MixInput<HTMLDialogElement> | undefined
  children?: RemixNode | undefined
}

export interface Overlay {
  /** The minted id, for an `aria-controls` a caller needs to write. */
  readonly id: string
  readonly Trigger: (handle: Handle<OverlayButtonProps>) => () => RemixNode
  readonly Dialog: (handle: Handle<OverlayDialogProps>) => () => RemixNode
  readonly Close: (handle: Handle<OverlayButtonProps>) => () => RemixNode
}

/**
 * Mints an id and binds both halves of `commandfor` to it, so there is no
 * string to mistype:
 *
 * ```tsx
 * const NewTask = overlay("new-task")
 *
 * <NewTask.Trigger tone="primary">New task</NewTask.Trigger>
 * <NewTask.Dialog title="New task">
 *   <form method="post" action={…}>
 *     …
 *     <NewTask.Close tone="ghost">Cancel</NewTask.Close>
 *   </form>
 * </NewTask.Dialog>
 * ```
 *
 * `name` is used as the id verbatim, with no sanitising, exactly as `Field`
 * uses its `name`. Two overlays sharing a name render two elements with one
 * id, which is a duplicate-id bug — and sanitising would hide its cause rather
 * than prevent it.
 *
 * Call it at module scope or at the top of a render, once per overlay. It
 * closes over nothing but strings, so calling it twice with the same name is
 * harmless in itself; rendering both results is not.
 */
export function overlay(name: string): Overlay {
  const show = invoke("show-modal", name)
  const close = invoke("close", name)

  function Trigger(handle: Handle<OverlayButtonProps>) {
    return () => <Button {...handle.props} invoke={show} />
  }

  function Close(handle: Handle<OverlayButtonProps>) {
    return () => <Button {...handle.props} invoke={close} />
  }

  function Dialog(handle: Handle<OverlayDialogProps>) {
    return () => {
      const { title, mix, children } = handle.props
      return (
        <DialogPanel close={close} id={name} mix={mix} title={title}>
          {children}
        </DialogPanel>
      )
    }
  }

  return { id: name, Trigger, Dialog, Close }
}
