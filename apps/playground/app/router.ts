import { render } from "remix/middleware/render"
import { createRouter, type MiddlewareContext, type Router } from "remix/router"
import rootController from "./actions/controller.tsx"
import { assetServer } from "./assets.ts"
import { routes } from "./routes.ts"

/** Passing the asset server to `render()` is what resolves a component's
 * `clientEntry(import.meta.url, …)` to a browser module URL, an import map and
 * its preloads. Without it a hydrated component renders, but never wakes up. */
export function createMiddleware() {
  return [
    render({
      assets: assetServer,
      onError(error) {
        console.error("render failed", error)
      },
    }),
  ] as const
}

/** The request context every controller sees. */
export type PlaygroundContext = MiddlewareContext<ReturnType<typeof createMiddleware>>

declare module "remix" {
  interface RouterTypes {
    context: PlaygroundContext
  }
}

export function createPlaygroundRouter(): Router<PlaygroundContext> {
  const router = createRouter({ middleware: createMiddleware() })
  router.map(routes, rootController)
  return router
}
