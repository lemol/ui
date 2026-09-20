import { attrs, css, type Handle, type MixInput, type RemixNode } from "remix/ui"
import { Button, type ButtonProps } from "../button/button.tsx"
import { invoke } from "../invocation.ts"
import { DEFAULT_TOAST_DURATION_MS, TOAST_DURATION_ATTR } from "./constants.ts"

export type ToastTone = "neutral" | "success" | "warning" | "danger" | "info"

const duration = "var(--ui-toast-transition-duration)"
const timing = `${duration} var(--ui-toast-transition-easing)`
const offset = "0 calc(var(--ui-toast-enter-offset) * -1)"

/**
 * The shell, entry and exit — the same shape as `Popover`'s surface and
 * `Dialog`'s panel: `display` only inside `&:popover-open`, the `transition`
 * shorthand twice, `@starting-style` on the state being entered.
 */
const shellStyle = css({
  position: "fixed",
  insetBlockEnd: "var(--ui-toast-gap)",
  insetInlineEnd: "var(--ui-toast-gap)",
  margin: 0,
  alignItems: "start",
  justifyContent: "space-between",
  gap: "var(--ui-toast-gap)",
  maxInlineSize: "min(var(--ui-toast-max-inline-size), calc(100% - var(--ui-toast-gap) * 2))",
  padding: "var(--ui-toast-pad)",
  borderStyle: "solid",
  borderWidth: "var(--ui-toast-border-width)",
  borderRadius: "var(--ui-toast-radius)",
  boxShadow: "var(--ui-toast-shadow)",
  opacity: 0,
  translate: offset,
  transition: `opacity ${timing}, translate ${timing}`,
  "&": {
    transition: `opacity ${timing}, translate ${timing}, overlay ${duration} allow-discrete, display ${duration} allow-discrete`,
  },
  "&:popover-open": {
    display: "flex",
    opacity: 1,
    translate: "0",
  },
  "@starting-style": {
    "&:popover-open": { opacity: 0, translate: offset },
  },
})

const toneStyle = (tone: ToastTone) =>
  css({
    background: `var(--ui-toast-${tone}-bg)`,
    borderColor: `var(--ui-toast-${tone}-border)`,
    color: `var(--ui-toast-${tone}-ink)`,
  })

const toneStyles: Record<ToastTone, ReturnType<typeof toneStyle>> = {
  danger: toneStyle("danger"),
  info: toneStyle("info"),
  neutral: toneStyle("neutral"),
  success: toneStyle("success"),
  warning: toneStyle("warning"),
}

const closeStyle = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  inlineSize: "var(--ui-toast-close-size)",
  blockSize: "var(--ui-toast-close-size)",
  borderStyle: "none",
  borderRadius: "var(--ui-toast-close-radius)",
  background: "transparent",
  color: "var(--ui-toast-close-ink)",
  cursor: "pointer",
  transitionProperty: "background, color",
  transitionDuration: "var(--ui-toast-transition-duration)",
  transitionTimingFunction: "var(--ui-toast-transition-easing)",
  "&:hover": {
    background: "var(--ui-toast-close-bg-hover)",
    color: "var(--ui-toast-close-ink-hover)",
  },
})

const glyphStyle = css({
  inlineSize: "var(--ui-toast-close-glyph-size)",
  blockSize: "var(--ui-toast-close-glyph-size)",
})

export type ToastTriggerProps = Omit<ButtonProps, "invoke">

export interface ToastProps {
  tone?: ToastTone | undefined
  /** Milliseconds before `--dismiss-toast` hides it. Not a token — see `tokens.ts`. */
  duration?: number | undefined
  mix?: MixInput<HTMLElement> | undefined
  children?: RemixNode | undefined
}

export interface Toaster {
  readonly id: string
  readonly Trigger: (handle: Handle<ToastTriggerProps>) => () => RemixNode
  readonly Toast: (handle: Handle<ToastProps>) => () => RemixNode
}

/**
 * Mints a toast id and binds a trigger to it, same reasoning as `overlay()`
 * and `popover()`. The trigger's command is `--dismiss-toast`, not a native
 * one: a *timed* dismissal is not something `[popover]` can express on its
 * own, so unlike `Popover`, `Toaster` sits on the ladder's third rung by
 * necessity — there is no native floor to preserve here. With the runtime
 * absent the trigger is inert, which is the same acceptable degradation
 * `Dialog`'s and `Popover`'s triggers already carry.
 *
 * The `--dismiss-toast` handler itself lives in `runtime.ts`, not here: a
 * document's browser entry imports only `runtime.ts` and `compat.ts` (see
 * `apps/playground/app/actions/public/entry.ts`), never a component module
 * for its own sake, so a handler registered here would sit in code the
 * browser bundle has no other reason to load and would silently never run.
 *
 * ```tsx
 * const Saved = toast("saved")
 *
 * <Saved.Trigger tone="primary">Save</Saved.Trigger>
 * <Saved.Toast tone="success">Saved.</Saved.Toast>
 * ```
 */
export function toast(name: string): Toaster {
  const dismiss = invoke("--dismiss-toast", name)
  const hide = invoke("hide-popover", name)

  function Trigger(handle: Handle<ToastTriggerProps>) {
    return () => <Button {...handle.props} invoke={dismiss} />
  }

  function Toast(handle: Handle<ToastProps>) {
    return () => {
      const {
        tone = "neutral",
        duration: ms = DEFAULT_TOAST_DURATION_MS,
        mix,
        children,
      } = handle.props
      return (
        <div
          aria-live="polite"
          id={name}
          mix={[shellStyle, toneStyles[tone], attrs({ [TOAST_DURATION_ATTR]: String(ms) }), mix]}
          popover="manual"
          role="status"
        >
          {children}
          <button
            aria-label="Dismiss"
            command={hide.command}
            commandfor={hide.commandfor}
            mix={closeStyle}
            type="button"
          >
            <svg aria-hidden="true" fill="none" mix={glyphStyle} viewBox="0 0 12 12">
              <path
                d="M3.5 3.5L8.5 8.5M8.5 3.5L3.5 8.5"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="1.5"
              />
            </svg>
          </button>
        </div>
      )
    }
  }

  return { id: name, Trigger, Toast }
}
