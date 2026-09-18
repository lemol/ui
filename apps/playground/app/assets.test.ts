import { describe, expect, it } from "bun:test"
import { assetServer } from "./assets.ts"
import { createPlaygroundRouter } from "./router.ts"

const router = createPlaygroundRouter()
const get = (href: string) => router.fetch(new Request(new URL(href, "http://localhost")))

/** Every module the browser is expected to reach, by the path the asset server
 * knows it as. A graph that compiles but cannot be fetched is the failure this
 * catches. */
const browserEntries = ["app/actions/public/entry.ts", "app/ui/public/runtime-probe.tsx"]

describe("browser assets", () => {
  it("serves every module in each entry's graph", async () => {
    const hrefs = await assetServer.getPreloads(browserEntries)
    // The graph reaches into `remix` through the Bun store, so it is much wider
    // than the two entries — which is the part a store mount gets wrong.
    expect(hrefs.length).toBeGreaterThan(browserEntries.length)

    for (const href of hrefs) {
      const response = await get(href)
      expect({ href, status: response.status }).toEqual({ href, status: 200 })
    }
  })

  it("compiles browser source to javascript", async () => {
    const response = await get(await assetServer.getHref("app/ui/public/runtime-probe.tsx"))
    expect(response.headers.get("Content-Type")).toContain("application/javascript")
    expect(await response.text()).toContain("RuntimeProbe")
  })

  it("keeps server-only source, and the tests beside browser source, out of reach", async () => {
    for (const path of [
      "app/actions/controller.tsx",
      "app/assets.ts",
      "app/router.ts",
      "app/ui/document.tsx",
      "app/ui/home.tsx",
      "app/router.test.tsx",
      "server.ts",
      "app/ui/public/does-not-exist.tsx",
    ]) {
      const response = await get(`/assets/${path}`)
      expect({ path, status: response.status }).toEqual({ path, status: 404 })
    }
  })
})
