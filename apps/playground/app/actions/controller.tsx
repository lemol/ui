import * as path from "node:path"
import { demos, isDemoName } from "@lemol/ui-remix/demos"
import { createController } from "remix/router"
import { assetServer } from "../assets.ts"
import { routes } from "../routes.ts"
import { CataloguePage } from "../ui/catalogue.tsx"
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

    /**
     * The catalogue. Scheme and density are query params rather than client
     * state, because rendering is server-side: `?scheme=dark&density=compact`
     * is a full proof of both variant axes with no JavaScript in the page.
     *
     * Both are allow-listed rather than passed through. An attribute value
     * that no selector matches is a silent no-op, so an unrecognised one
     * should render nothing rather than look like it did something.
     */
    async component(context) {
      const name = context.params.component
      if (!isDemoName(name)) return new Response("Not Found", { status: 404 })

      const params = context.url.searchParams
      const scripts = !params.has("nojs")
      const scheme = params.get("scheme")
      const density = params.get("density")

      return context.render(
        <Document
          density={density === "compact" ? density : undefined}
          entry={scripts ? await assetServer.getScriptEntry(browserEntry) : null}
          scheme={scheme === "dark" || scheme === "light" ? scheme : undefined}
          title={demos[name].title}
        >
          <CataloguePage entry={demos[name]} />
        </Document>,
      )
    },

    async assets({ request }) {
      return (await assetServer.fetch(request)) ?? new Response("Not Found", { status: 404 })
    },
  },
})
