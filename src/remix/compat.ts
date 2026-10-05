/**
 * The Invoker Commands backfill.
 *
 * It exists for one reason: below Baseline December 2025, `command` and
 * `commandfor` are inert attributes. No error, no event, no console warning —
 * a dead click. That silent failure is worse than a thrown exception, and this
 * closes it with markup that is identical either way.
 *
 * Import it for its side effect — `import "@lemol/ui/remix/compat"` — and it
 * installs itself when the platform needs it. The named export exists for the
 * one caller that has to install it deliberately: see `force` below.
 *
 * The architecture note estimated fifteen lines. With six built-in commands,
 * the idempotence guard, the trusted-event suppressor and the event
 * construction it is about seventy. The estimate was the size of the idea, not
 * a budget, and a half-backfill that covers dialogs while leaving popovers
 * dead is not worth the saving.
 */

const installedFlag = Symbol.for("@lemol/ui/invoker-commands")

type InstallFlags = Record<symbol, boolean | undefined>

export interface InstallInvokerCommandsOptions {
  /**
   * Install over a platform that already has Invoker Commands.
   *
   * This is not only a test affordance. Without the suppression it turns on,
   * a page that loaded this backfill on an engine which later gains native
   * support would act twice on every click — the platform's own invocation
   * and this one — and the second `showModal()` throws. That is the ordinary
   * upgrade path for every browser we do not control.
   */
  force?: boolean | undefined
}

/** The commands the platform defines. A `--` command performs nothing here. */
const builtins = new Set([
  "show-modal",
  "close",
  "request-close",
  "toggle-popover",
  "show-popover",
  "hide-popover",
])

const isDialog = (element: Element): element is HTMLDialogElement =>
  element instanceof HTMLDialogElement

const perform = (element: Element, command: string): void => {
  if (!builtins.has(command)) return

  if (isDialog(element)) {
    if (command === "show-modal" && !element.open) element.showModal()

    if (command === "close" && element.open) element.close()

    if (command === "request-close" && element.open) {
      // requestClose() is Chrome 135, the same floor as the feature this
      // module backfills, so on the engines that need this it is absent.
      const dialog = element as HTMLDialogElement & { requestClose?: () => void }

      if (typeof dialog.requestClose === "function") dialog.requestClose()
      else element.close()
    }

    return
  }

  const popover = element as Element & {
    togglePopover?: () => void
    showPopover?: () => void
    hidePopover?: () => void
  }

  if (command === "toggle-popover") popover.togglePopover?.()

  if (command === "show-popover") popover.showPopover?.()

  if (command === "hide-popover") popover.hidePopover?.()
}

const onClick = (event: MouseEvent): void => {
  if (event.defaultPrevented || event.button !== 0) return

  const origin = event.target

  if (!(origin instanceof Element)) return

  const button = origin.closest("button[command][commandfor]")

  if (!(button instanceof HTMLButtonElement) || button.disabled) return

  const receiver = document.getElementById(button.getAttribute("commandfor") ?? "")

  if (receiver === null) return

  const command = button.getAttribute("command") ?? ""

  // A real CommandEvent where the constructor exists, and an Event carrying
  // the same two properties where it does not — which is every engine that
  // needs this module. Non-bubbling, composed and cancellable, as the
  // platform's own is, so `runtime.ts` reads one shape either way.
  const invocation = new Event("command", { bubbles: false, composed: true, cancelable: true })

  Object.defineProperties(invocation, {
    command: { value: command, enumerable: true },
    source: { value: button, enumerable: true },
  })

  receiver.dispatchEvent(invocation)

  if (invocation.defaultPrevented) return

  perform(receiver, command)
}

/** Cancels the platform's own invocation so a forced install does not double. */
const suppressNative = (event: Event): void => {
  if (event.isTrusted) event.preventDefault()
}

export function installInvokerCommands(options?: InstallInvokerCommandsOptions): void {
  if (typeof document === "undefined") return

  const flags = globalThis as unknown as InstallFlags

  if (flags[installedFlag] === true) return

  const native = "commandForElement" in HTMLButtonElement.prototype

  if (native && options?.force !== true) return

  flags[installedFlag] = true

  // Only when forced over a platform that has the feature. WHATWG HTML
  // initialises CommandEvent with cancelable: true and checks it before the
  // default action, so cancelling the trusted event hands authority here.
  //
  // Registered on `window`, not `document`: the capture phase descends
  // window → document → … → target, so a `window` listener always runs
  // before a `document` one regardless of which module happened to import
  // first. `runtime.ts` self-installs its own `document` listener at import
  // time, so pinning this to `document` would make the ordering — and
  // therefore whether a `--` command is suppressed before the runtime sees
  // it — a coin flip decided by import order rather than a property of the
  // DOM.
  if (native) window.addEventListener("command", suppressNative, true)

  document.addEventListener("click", onClick, true)
}

installInvokerCommands()
