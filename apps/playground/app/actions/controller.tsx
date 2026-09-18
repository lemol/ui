import * as path from "node:path"
import { createController } from "remix/router"
import { assetServer } from "../assets.ts"
import { routes } from "../routes.ts"
import { Document } from "../ui/document.tsx"
import { HomePage } from "../ui/home.tsx"

const browserEntry = path.resolve(import.meta.dirname, "public/entry.ts")

export default createController(routes, {
  actions: {
    /**
     * Resolved per request rather than once at boot, so the rendered script,
     * import map and preloads always carry the asset server's current URLs —
     * fingerprinted in production, freshly compiled while watching.
     *
     * `?nojs` drops the entry entirely. The premise of these packages is that a
     * page is finished before a script runs, so that has to be one request away
     * rather than something to remember to check.
     */
    async home(context) {
      const scripts = !context.url.searchParams.has("nojs")
      return context.render(
        <Document
          title="Playground"
          entry={scripts ? await assetServer.getScriptEntry(browserEntry) : null}
        >
          <HomePage scripts={scripts} />
        </Document>,
      )
    },

    async assets({ request }) {
      return (await assetServer.fetch(request)) ?? new Response("Not Found", { status: 404 })
    },
  },
})
