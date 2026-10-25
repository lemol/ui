/**
 * The single delegated listener every behaviour in this package goes through.
 *
 * ```ts
 * document.addEventListener("command", handler, true)
 * ```
 *
 * Two details make that line correct and both are traps. `CommandEvent` does
 * not bubble — it is dispatched on the element named by `commandfor` — so a
 * listener attached the ordinary way never fires; the capture phase descends
 * window → target, which is what the `true` is for. And it must be delegated
 * from `document`: querying elements and binding to them kills the behaviour
 * on the first frame navigation, a lesson an earlier design package paid
 * for. Delegation needs no MutationObserver and survives markup that arrives
 * in a frame response.
 *
 * M1 registers no commands. The table ships anyway so that M2 adds a command
 * rather than adding plumbing, and the subpath exists from the start so an app
 * imports the runtime without pulling the component library in behind it.
 *
 * M2's handlers are registered here, in this file, rather than at the bottom
 * of the component module they belong to. A document's browser entry imports
 * only `runtime.ts` and `compat.ts` — never a component module for its own
 * sake (see `apps/playground/app/actions/public/entry.ts`) — so a
 * `registerCommand()` call sitting in `toaster.tsx` would live in code the
 * browser bundle has no other reason to load, and the command would silently
 * never fire. Each handler still imports only the pure logic its component
 * exports (`scheduleDismiss`, a shared attribute name), not the component
 * itself, so this file stays free of JSX and of the component library it
 * dispatches for.
 *
 * `onInput`, below, is a second delegated listener — not a second dispatch
 * mechanism. `command`/`commandfor` reaches a click through the platform's
 * own Invoker Commands; nothing native does the same for typing, so
 * `--live-submit` and `--palette` need an `input` listener to source their
 * invocation from. It only ever constructs the same synthetic `command`
 * event `compat.ts`'s click bridge does and dispatches it at the named
 * target, so `onCommand` — one function, one place handlers are looked up —
 * is still what runs a handler, regardless of which listener sourced the
 * event.
 */

import { densityStorageKey, schemeStorageKey } from "../design/css/index.ts"
import { matchItems, type PaletteItem } from "./command-palette/match.ts"
import { type Debounced, debounce } from "./live-form/debounce.ts"
import { DEFAULT_TOAST_DURATION_MS, TOAST_DURATION_ATTR } from "./toaster/constants.ts"
import { scheduleDismiss } from "./toaster/dismiss-timer.ts"

/** The `--` namespace, which browsers guarantee never to claim. */
export type CommandName = `--${string}`

export interface CommandContext {
  /** The element that invoked it, when the event carries one — a button for a click, an input for the input bridge below. */
  readonly source: Element | null
  /** The element named by `commandfor`. */
  readonly target: Element
  readonly event: Event
}

export type CommandHandler = (context: CommandContext) => void

const handlers = new Map<string, CommandHandler>()
let listening = false

/**
 * Registers a handler for one custom command. Throws on a duplicate: two
 * handlers for one name is a half-behaviour where nothing says which wins.
 */
export function registerCommand(name: CommandName, handler: CommandHandler): void {
  // Enforced at runtime and not only in the type: a JavaScript caller — or a
  // TypeScript one reaching past the type with a cast — that registers
  // "close" would otherwise fire on every native dialog dismissal, since
  // nothing here would ever have checked the namespace.
  if (!name.startsWith("--")) throw new Error(`Not a custom command: ${name}`)

  if (handlers.has(name)) throw new Error(`Command already registered: ${name}`)

  handlers.set(name, handler)
}

const pendingToastDismissals = new WeakMap<Element, () => void>()

/**
 * Shows the toast and schedules its own dismissal. `showPopover`/
 * `hidePopover` are unconditional: the Popover API is this package's browser
 * floor (see docs/interactivity.md), not a feature to detect.
 */
registerCommand("--dismiss-toast", ({ target }) => {
  pendingToastDismissals.get(target)?.()
  const popoverTarget = target as HTMLElement

  // Retriggering an already-open toast only has to reset its timer:
  // showPopover() throws on an element already showing, so it is called
  // only from the closed state.
  if (!popoverTarget.matches(":popover-open")) popoverTarget.showPopover()

  const ms = Number(target.getAttribute(TOAST_DURATION_ATTR) ?? DEFAULT_TOAST_DURATION_MS)
  const cancel = scheduleDismiss(ms, () => {
    pendingToastDismissals.delete(target)
    popoverTarget.hidePopover()
  })

  pendingToastDismissals.set(target, cancel)
})

const COPY_CONFIRM_DURATION_MS = 2000
const pendingCopyReverts = new WeakMap<Element, () => void>()

/**
 * Writes `target`'s text (or its own `data-copy-value`, when `CopyButton`
 * has no separate `for` target) to the clipboard, then swaps `source`'s own
 * label for its `data-copy-confirm-label` and back — reusing
 * `scheduleDismiss`'s one-shot-timer shape rather than a second
 * implementation, per the M2 plan's own note for this command.
 */
registerCommand("--copy", ({ source, target }) => {
  if (!(source instanceof HTMLButtonElement)) return

  const text = target.getAttribute("data-copy-value") ?? target.textContent ?? ""

  void navigator.clipboard.writeText(text)

  pendingCopyReverts.get(source)?.()
  const original = source.dataset.copyOriginalLabel ?? source.textContent ?? ""

  source.dataset.copyOriginalLabel = original
  source.textContent = source.getAttribute("data-copy-confirm-label") ?? "Copied!"
  const cancel = scheduleDismiss(COPY_CONFIRM_DURATION_MS, () => {
    source.textContent = original
    delete source.dataset.copyOriginalLabel
    pendingCopyReverts.delete(source)
  })

  pendingCopyReverts.set(source, cancel)
})

/** Persists to storage without taking the page down in a private window that refuses it — the same tolerance `bootScript` itself has. */
const persist = (key: string, value: string | null): void => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // A private window refusing storage means the choice does not survive a
    // reload, not that this click should throw.
  }
}

/**
 * Toggles `data-density` and writes the same `localStorage` key
 * `bootScript` reads on the next load, so what this sets is what a reload
 * restores. Absent and `"compact"` are the only two states — see
 * `docs/design-system.md` — so toggling off removes the attribute rather
 * than writing a third value.
 */
registerCommand("--toggle-density", ({ target }) => {
  const next = target.getAttribute("data-density") === "compact" ? null : "compact"

  if (next === null) target.removeAttribute("data-density")
  else target.setAttribute("data-density", next)

  persist(densityStorageKey, next)
})

/**
 * Resolves the *current* scheme — the root's own `data-scheme`, or
 * `prefers-color-scheme` when the document left that to the media query —
 * and sets the explicit opposite, so the first click is correct regardless
 * of which one was never written down.
 */
registerCommand("--set-scheme", ({ target }) => {
  const current =
    target.getAttribute("data-scheme") ??
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")

  const next = current === "dark" ? "light" : "dark"

  target.setAttribute("data-scheme", next)
  persist(schemeStorageKey, next)
})

const LIVE_SUBMIT_DELAY_MS = 400
const liveSubmitDebouncers = new WeakMap<Element, Debounced>()

/**
 * Debounces per form, not per keystroke: every field in one `LiveForm`
 * shares the same target (`commandfor` names the form), so the debounce
 * instance is keyed by `target` and reused across every field's own input
 * events rather than one instance per field racing the others.
 */
registerCommand("--live-submit", ({ target }) => {
  if (!(target instanceof HTMLFormElement)) return

  let debounced = liveSubmitDebouncers.get(target)

  if (debounced === undefined) {
    debounced = debounce(LIVE_SUBMIT_DELAY_MS, () => target.requestSubmit())
    liveSubmitDebouncers.set(target, debounced)
  }

  debounced.trigger()
})

/**
 * Filters `target`'s `<li>` rows by `matchItems()`, reading each row's
 * candidate text from the `data-palette-*` attributes `CommandPaletteItem`
 * writes rather than from a separate items array — the rendered list is
 * already the data, so there is nothing else to keep in sync with it.
 */
registerCommand("--palette", ({ source, target }) => {
  const query = source instanceof HTMLInputElement ? source.value : ""
  const rows = Array.from(target.children).filter(
    (child): child is HTMLLIElement => child instanceof HTMLLIElement,
  )

  const items: PaletteItem[] = rows.map((row) => ({
    id: row.id,
    keywords: row.dataset.paletteKeywords,
    label: row.dataset.paletteLabel ?? "",
  }))

  const visible = new Set(matchItems(query, items).map((item) => item.id))

  for (const row of rows) row.hidden = !visible.has(row.id)
})

const onCommand = (event: Event): void => {
  // An invocation something already cancelled has been handled. Under a
  // forced compat shim that "something" is the shim itself: it cancels the
  // platform's trusted CommandEvent from a capturing listener on `window`,
  // which — because capture descends window before document — runs ahead of
  // this listener, and dispatches its own synthetic event carrying the same
  // invocation. Without this guard the trusted event's arrival here, after
  // being cancelled, would run the handler a second time.
  if (event.defaultPrevented) return

  const invocation = event as Event & { command?: string; source?: unknown }
  const handler = handlers.get(invocation.command ?? "")

  if (handler === undefined) return

  const target = event.target

  if (!(target instanceof Element)) return

  const source = invocation.source

  handler({
    source: source instanceof Element ? source : null,
    target,
    event,
  })
}

/**
 * The `input` half of the bridge, for the two `--` commands driven by typing
 * rather than a click: `--live-submit` and `--palette`. `command`/
 * `commandfor` on a form control is not a native browser feature — nothing
 * backfills it, because there is nothing native to backfill — it is this
 * package's own convention, read here exactly once.
 *
 * `closest()`, not `event.target` directly: a native `input`/`change` event
 * bubbles, so the attributes can sit on the control itself
 * (`CommandPaletteInput`) or on a wrapping element such as `Field`'s own
 * wrapper (`liveSubmit()`'s intended use) — whichever ancestor the caller
 * finds it easiest to attach `attrs({ command, commandfor })` to.
 *
 * It still dispatches through `onCommand` rather than calling a handler
 * directly, for the same reason `compat.ts`'s click bridge does: one place
 * constructs the event, one place decides whether it already has a handler
 * and reads `source`/`target` off it, and a behaviour registered once in
 * `runtime.ts` fires the same way regardless of what triggered it.
 */
const onInput = (event: Event): void => {
  const origin = event.target

  if (!(origin instanceof Element)) return

  const trigger = origin.closest("[command][commandfor]")

  if (trigger === null) return

  const command = trigger.getAttribute("command")
  const commandforId = trigger.getAttribute("commandfor")

  if (command === null || commandforId === null || !command.startsWith("--")) return

  const receiver = document.getElementById(commandforId)

  if (receiver === null) return

  const invocation = new Event("command", { bubbles: false, cancelable: true, composed: true })

  Object.defineProperties(invocation, {
    command: { enumerable: true, value: command },
    source: { enumerable: true, value: trigger },
  })
  receiver.dispatchEvent(invocation)
}

export function installCommandRuntime(): void {
  if (listening || typeof document === "undefined") return

  listening = true
  document.addEventListener("command", onCommand, true)
  document.addEventListener("input", onInput, true)
}

installCommandRuntime()
