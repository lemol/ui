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

/** The root element's open tag, so an attribute assertion cannot be satisfied
 *  by a selector inside the emitted stylesheet. */
const htmlTag = (page: string) => /<html[^>]*>/.exec(page)?.[0] ?? ""

describe("the catalogue route", () => {
  it("renders the demo for a component it knows", async () => {
    const response = await get("/c/button")
    expect(response.status).toBe(200)
    expect(await response.text()).toContain("Button")
  })

  it("is a 404 for one it does not", async () => {
    expect((await get("/c/nope")).status).toBe(404)
  })

  it("delivers the token sheet ahead of remix's component styles", async () => {
    // Layer order is fixed by the first @layer statement the browser sees, and
    // remix splices its own style elements in immediately before </head>. If
    // ours arrived second, `base` would register after `rmx` and element
    // defaults would start beating components — with no error at all.
    const page = await html("/c/button")
    const ours = page.indexOf("@layer base, rmx;")
    const theirs = page.indexOf("data-rmx-style")
    expect(ours).toBeGreaterThan(-1)
    expect(theirs).toBeGreaterThan(-1)
    expect(ours).toBeLessThan(theirs)
  })

  it("carries the theme's own values, and lets them beat the component defaults", async () => {
    const page = await html("/c/button")
    expect(page).toContain("--accent: #1F6B5C;")
    // mini softens the button: the component default is emitted first and the
    // theme's value second, under one selector at one specificity.
    expect(page.indexOf("--ui-btn-radius: var(--r-sm);")).toBeLessThan(
      page.indexOf("--ui-btn-radius: var(--r-md);"),
    )
  })

  it("renders light, dark and compact with no client JavaScript", async () => {
    // Assertions read the <html> open tag, not the page. The emitted sheet
    // carries `:root[data-scheme="dark"]` and `:root[data-density="compact"]`
    // selectors of its own, so a whole-page `not.toContain("data-scheme")`
    // would fail on every request.
    const light = await html("/c/button?nojs")
    expect(light).not.toContain("<script")
    expect(htmlTag(light)).not.toContain("data-scheme")
    expect(htmlTag(light)).not.toContain("data-density")

    const dark = await html("/c/button?nojs&scheme=dark")
    expect(htmlTag(dark)).toContain('data-scheme="dark"')
    expect(dark).not.toContain("<script")

    const compact = await html("/c/button?nojs&density=compact")
    expect(htmlTag(compact)).toContain('data-density="compact"')
    expect(compact).not.toContain("<script")
  })

  it("ignores a scheme or density it does not recognise", async () => {
    const tag = htmlTag(await html("/c/button?scheme=sepia&density=roomy"))
    expect(tag).not.toContain("data-scheme")
    expect(tag).not.toContain("data-density")
  })

  it("still renders every tone with the runtime absent", async () => {
    const page = await html("/c/button?nojs")
    for (const tone of ["primary", "neutral", "ghost", "danger"]) {
      expect(page).toContain(`>${tone}</button>`)
    }
  })
})
