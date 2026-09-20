import { run } from "remix/ui"
import { installInvokerCommands } from "../../../../../src/remix/compat.ts"
import { installCommandRuntime } from "../../../../../src/remix/runtime.ts"

/**
 * Importing `compat` is what installs the backfill: the module installs
 * itself, and the named import is here for the line below.
 *
 * `?compat` forces it on over the platform's own Invoker Commands, the same
 * way `?nojs` drops this entry entirely. Every engine a test can drive has the
 * feature natively, so without this switch the backfill is the one piece of
 * client code that would ship unexercised.
 */
if (new URLSearchParams(location.search).has("compat")) {
  installInvokerCommands({ force: true })
}

installCommandRuntime()

/**
 * The document's browser entry. It hydrates the client entries the server
 * marked up, and nothing else: no framework of our own boots here.
 *
 * `loadModule` is required because the runtime will not guess how to reach a
 * browser module. The import map the document rendered is what makes the bare
 * `moduleUrl` resolvable.
 */
const app = run({
  async loadModule(moduleUrl, exportName) {
    const module: Record<string, unknown> = await import(moduleUrl)
    const component = module[exportName]
    if (typeof component !== "function") {
      throw new Error(`Unknown component: ${moduleUrl}#${exportName}`)
    }
    return component
  },
})

// Top-level `await` is avoided deliberately: this is a deferred module script,
// so the server's markup is already parsed, and nothing should wait on
// hydration to finish.
void app.ready()
