import type { Handle } from "remix/component"
import { Button, type ButtonProps } from "../button/button.tsx"
import { documentRootId } from "../document-root.ts"
import { invoke } from "../invocation.ts"

export type DensityToggleProps = Omit<ButtonProps, "invoke">

const toggle = invoke("--toggle-density", documentRootId)

/**
 * `command="--toggle-density"`, `commandfor` pointing at `documentRootId` —
 * the same id `mini`'s `Document` gives its `<html>`. `--toggle-density`'s
 * handler (`runtime.ts`) reads and writes `data-density` and the same
 * `localStorage` key `bootScript` restores from, so the two agree exactly:
 * a value this toggle sets is what the next load's no-flash restore reads
 * back. With the runtime absent the button is inert, and the page renders
 * in whatever density the server (or `bootScript`) already chose.
 */
export function DensityToggle(handle: Handle<DensityToggleProps>) {
  return () => {
    const { children, ...rest } = handle.props

    return (
      <Button {...rest} invoke={toggle}>
        {children ?? "Compact density"}
      </Button>
    )
  }
}
