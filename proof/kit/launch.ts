import type { App } from "@lemol/proof"
import { assetServer } from "../../apps/playground/app/assets.ts"
import { createPlaygroundRouter } from "../../apps/playground/app/router.ts"

/**
 * The app under proof: the playground's own router on an ephemeral port, the
 * way `test/browser/harness.ts` serves it. What the kit replays is the real
 * document, the real asset pipeline and the real demos — there are no
 * fixtures to agree with a broken component.
 */
export const launch = async (): Promise<App> => {
  const router = createPlaygroundRouter()
  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    fetch: (request) => router.fetch(request),
  })

  return {
    baseURL: `http://127.0.0.1:${server.port}`,
    close: async () => {
      await server.stop(true)
      await assetServer.close()
    },
  }
}
