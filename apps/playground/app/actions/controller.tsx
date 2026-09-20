import * as path from "node:path"
import { createController } from "remix/router"
import { Document } from "../../../../src/mini/document.tsx"
import { demos, isDemoName } from "../../../../src/remix/demos.ts"
import { assetServer } from "../assets.ts"
import { routes } from "../routes.ts"
import { CataloguePage, UnknownComponentPage } from "../ui/catalogue.tsx"
import { DashboardPage } from "../ui/dashboard.tsx"
import { HomePage } from "../ui/home.tsx"
import { SpaLoading, SpaNoJs } from "../ui/spa.tsx"

const browserEntry = path.resolve(import.meta.dirname, "public/entry.ts")
const spaEntry = path.resolve(import.meta.dirname, "../spa/public/entry.tsx")

/** Appended after every page title by `mini`'s Document. */
const site = "lemol ui"

interface PageQuery {
  scripts: boolean
  scheme: "light" | "dark" | undefined
  density: "compact" | undefined
  /** Path plus query string, for the switchers and knobs to preserve. */
  location: string
}

/**
 * Every page reads the same four axes. Both variant params are allow-listed
 * rather than passed through: an attribute value no selector matches is a
 * silent no-op, so an unrecognised one renders nothing rather than looking
 * like it did something. `scheme=system` and `density=default` are the
 * switchers' explicit spellings of unset — a submit button always sends its
 * own name/value, so "back to the default" cannot be a dropped param.
 */
function pageQuery(url: URL): PageQuery {
  const params = url.searchParams
  const scheme = params.get("scheme")
  const density = params.get("density")
  return {
    scripts: !params.has("nojs"),
    scheme: scheme === "dark" || scheme === "light" ? scheme : undefined,
    density: density === "compact" ? density : undefined,
    location: `${url.pathname}${url.search}`,
  }
}

export default createController(routes, {
  actions: {
    /**
     * Resolved per request rather than once at boot, so the rendered script,
     * import map and preloads always carry the asset server's current URLs —
     * fingerprinted in production, freshly compiled while watching.
     *
     * `?nojs` drops the entry entirely, and the no-flash boot script with it.
     * The premise of these packages is that a page is finished before a script
     * runs, so that has to be one request away rather than something to
     * remember to check — and "no client JavaScript" has to mean no script
     * element at all, or the assertion is weaker than it reads.
     */
    async home(context) {
      const query = pageQuery(context.url)
      return context.render(
        <Document
          boot={query.scripts}
          density={query.density}
          entry={query.scripts ? await assetServer.getScriptEntry(browserEntry) : null}
          scheme={query.scheme}
          site={site}
          title="Playground"
        >
          <HomePage location={query.location} scripts={query.scripts} />
        </Document>,
      )
    },

    /**
     * The catalogue. The knobs live in the query string beside the switchers
     * — `?tone=danger&size=sm&scheme=dark` — and the page preserves all of
     * them across every form, because rendering is server-side and no axis
     * needs client state.
     */
    async component(context) {
      const name = context.params.component
      const query = pageQuery(context.url)
      if (!isDemoName(name)) {
        return context.render(
          <Document
            boot={query.scripts}
            density={query.density}
            entry={query.scripts ? await assetServer.getScriptEntry(browserEntry) : null}
            scheme={query.scheme}
            site={site}
            title="No such component"
          >
            <UnknownComponentPage location={query.location} name={name} />
          </Document>,
          { status: 404 },
        )
      }

      return context.render(
        <Document
          boot={query.scripts}
          density={query.density}
          entry={query.scripts ? await assetServer.getScriptEntry(browserEntry) : null}
          scheme={query.scheme}
          site={site}
          title={demos[name].title}
        >
          <CataloguePage entry={demos[name]} location={query.location} name={name} />
        </Document>,
      )
    },

    /** The composed recipe: stats, tasks, settings and a dialog in one layout. */
    async dashboard(context) {
      const query = pageQuery(context.url)
      return context.render(
        <Document
          boot={query.scripts}
          density={query.density}
          entry={query.scripts ? await assetServer.getScriptEntry(browserEntry) : null}
          scheme={query.scheme}
          site={site}
          title="Dashboard"
        >
          <DashboardPage location={query.location} />
        </Document>,
      )
    },

    /**
     * The SPA shell. With scripts, every path under `/spa` serves the shell
     * with the SPA entry — routing is the browser router's job, including
     * the 404, exactly as an `index.html` fallback behaves. With `?nojs`,
     * the same paths render the same components on the server, so the
     * no-JS toggle holds here too.
     */
    async spa(context) {
      const query = pageQuery(context.url)
      const segments = (context.params.path ?? "").split("/").filter((segment) => segment !== "")
      const first = segments.length === 1 ? segments[0] : undefined
      // Exactly one known segment is a demo; anything deeper is unknown, the
      // way the browser router's `/spa/:component` would not match it either.
      const name =
        segments.length === 0 ? null : first !== undefined && isDemoName(first) ? first : false

      if (query.scripts) {
        return context.render(
          <Document
            boot
            density={query.density}
            entry={await assetServer.getScriptEntry(spaEntry)}
            scheme={query.scheme}
            site={site}
            title={typeof name === "string" ? demos[name].title : "SPA demo"}
          >
            <SpaLoading location={query.location} />
          </Document>,
        )
      }

      if (name === false) {
        return context.render(
          <Document boot={false} entry={null} site={site} title="No such component">
            <UnknownComponentPage
              backHref="/spa"
              backLabel="Back to the SPA index"
              location={query.location}
              name={segments.join("/")}
              nav="spa"
            />
          </Document>,
          { status: 404 },
        )
      }

      return context.render(
        <Document
          boot={false}
          density={query.density}
          entry={null}
          scheme={query.scheme}
          site={site}
          title={name === null ? "SPA demo" : demos[name].title}
        >
          <SpaNoJs location={query.location} name={name} />
        </Document>,
      )
    },

    async assets({ request }) {
      return (await assetServer.fetch(request)) ?? new Response("Not Found", { status: 404 })
    },
  },
})
