import type { Handle } from "remix/component"
import { Button, type ButtonProps } from "../button/button.tsx"
import { documentRootId } from "../document-root.ts"
import { invoke } from "../invocation.ts"

export type SchemeToggleProps = Omit<ButtonProps, "invoke">

const toggle = invoke("--set-scheme", documentRootId)

/**
 * `command="--set-scheme"`, `commandfor` pointing at `documentRootId`. Named
 * "set" rather than "toggle" because that is what the handler does each
 * click: resolves the *current* scheme — the root's own `data-scheme`, or
 * `prefers-color-scheme` when the document left it to the media query — and
 * sets the explicit opposite, so the first click is correct regardless of
 * which one was never written down. Same `localStorage` key `bootScript`
 * restores from, so a value this sets is what the next load reads back.
 */
export function SchemeToggle(handle: Handle<SchemeToggleProps>) {
  return () => {
    const { children, ...rest } = handle.props
    return (
      <Button {...rest} invoke={toggle}>
        {children ?? "Toggle theme"}
      </Button>
    )
  }
}
