import { run } from "remix/ui"

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
