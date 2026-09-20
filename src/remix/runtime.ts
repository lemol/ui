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
 * on the first frame navigation, which is the lesson `@mionso/design` paid
 * for. Delegation needs no MutationObserver and survives markup that arrives
 * in a frame response.
 *
 * M1 registers no commands. The table ships anyway so that M2 adds a command
 * rather than adding plumbing, and the subpath exists from the start so an app
 * imports the runtime without pulling the component library in behind it.
 */

/** The `--` namespace, which browsers guarantee never to claim. */
export type CommandName = `--${string}`

export interface CommandContext {
  /** The button that invoked it, when the event carries one. */
  readonly source: HTMLButtonElement | null
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
    source: source instanceof HTMLButtonElement ? source : null,
    target,
    event,
  })
}

export function installCommandRuntime(): void {
  if (listening || typeof document === "undefined") return
  listening = true
  document.addEventListener("command", onCommand, true)
}

installCommandRuntime()
