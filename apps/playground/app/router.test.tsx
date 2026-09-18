import { describe, expect, it } from "bun:test"
import { createPlaygroundRouter } from "./router.ts"

/**
 * The bring-up test. Everything else in M1 assumes this composition works, so
 * it is driven the way a browser drives it — a real `Request` through
 * `router.fetch` — rather than by calling the renderer directly.
 */
const router = createPlaygroundRouter()

const get = (path: string) => router.fetch(new Request(new URL(path, "http://localhost")))
const html = async (path: string) => (await get(path)).text()

describe("the home route", () => {
  it("renders a document on the server", async () => {
    const response = await get("/")
    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toContain("text/html")
    expect(await response.text()).toContain("<h1>lemol ui playground</h1>")
  })

  it("resolves its browser entry through the asset server", async () => {
    const page = await html("/")
    expect(page).toContain('<script type="module" src="/assets/app/actions/public/entry.ts">')
    expect(page).toContain('type="importmap"')
    expect(page).toContain('rel="modulepreload"')
  })

  it("collects component css into the document, in the rmx layer", async () => {
    expect(await html("/")).toContain("@layer rmx.")
  })
})

describe("client entries", () => {
  it("hands the runtime a module url and an export name", async () => {
    const page = await html("/")
    expect(page).toContain('<script type="application/json" id="rmx-data">')
    expect(page).toContain('"exportName":"RuntimeProbe"')
    expect(page).toContain('"moduleUrl":"/assets/app/ui/public/runtime-probe.tsx"')
  })

  it("marks up the entry so the runtime can find the nodes it already rendered", async () => {
    const page = await html("/")
    expect(page).toContain("<!-- rmx:h:")
    expect(page).toContain("<!-- /rmx:h -->")
  })

  it("serves the module url it advertised", async () => {
    const response = await get("/assets/app/ui/public/runtime-probe.tsx")
    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toContain("application/javascript")
  })
})

// The premise of these packages is that a page is finished before a script
// runs. `?nojs` is the assertion, not the aspiration.
describe("with ?nojs", () => {
  it("renders the page with no script element at all", async () => {
    const page = await html("/?nojs")
    expect(page).not.toContain("<script")
  })

  it("still renders the interactive markup, dead", async () => {
    const page = await html("/?nojs")
    expect(page).toContain('<button type="button"')
    expect(page).toContain("Not clicked yet")
  })

  it("still carries the styles", async () => {
    expect(await html("/?nojs")).toContain("@layer rmx.")
  })
})

describe("unknown asset paths", () => {
  it("are a 404 rather than an unhandled rejection", async () => {
    expect((await get("/assets/app/ui/public/nope.tsx")).status).toBe(404)
  })
})
