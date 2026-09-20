import { describe, expect, it } from "bun:test"
import { demos } from "../../../src/remix/demos.ts"
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
    const page = await response.text()
    expect(page).toContain("lemol ui playground")
    expect(page).toContain("Skip to content")
    expect(page).toContain('href="/c/button"')
    expect(page).toContain('href="/pages/dashboard"')
    expect(page).toContain('href="/spa"')
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

  it("carries the switchers as GET forms", async () => {
    const page = await html("/")
    expect(page).toContain('name="scheme"')
    expect(page).toContain('name="density"')
    expect(page).toContain('name="nojs"')
    expect(page).toContain('name="compat"')
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
    const page = await response.text()
    // Not `toContain("Button")`: <title>Button · lemol ui</title> satisfies
    // that on its own, so the route would pass with the demo body missing
    // entirely. These name things only the demo renders.
    expect(page).toContain("size md")
    expect(page).toContain(">primary</button>")
  })

  it("renders every M1 component through its own demo file", async () => {
    const names = Object.keys(demos) as (keyof typeof demos)[]
    expect(names.length).toBeGreaterThan(0)
    for (const name of names) {
      const response = await get(`/c/${name}`)
      expect({ name, status: response.status }).toEqual({ name, status: 200 })
      // The heading, not the title element: the demo body must be present.
      expect(await response.text()).toContain(`>${demos[name].title}</h1>`)
    }
  })

  it("is a 404 page, not a bare status, for one it does not", async () => {
    const response = await get("/c/nope")
    expect(response.status).toBe(404)
    const page = await response.text()
    expect(page).toContain("No such component")
    expect(page).toContain("404")
    expect(page).toContain("Back to the catalogue")
  })

  it("reads the knobs from the query string", async () => {
    expect(await html("/c/button?tone=danger&size=sm")).toContain('tone="danger" size="sm"')
    expect(await html("/c/badge?tone=success")).toContain('tone="success"')
  })

  it("falls back to the defaults for knobs it does not recognise", async () => {
    expect(await html("/c/button?tone=primay&size=xl")).toContain('tone="neutral" size="md"')
  })

  it("delivers the token sheet ahead of remix's component styles", async () => {
    // Layer order is fixed by the first @layer statement the browser sees, and
    // remix splices its own style elements in immediately before </head>. If
    // ours arrived second, `base` would register after `rmx` and element
    // defaults would start beating components — with no error at all.
    const page = await html("/c/button")
    const ours = page.indexOf("@layer rmx-reset, base, rmx;")
    const theirs = page.indexOf("data-rmx-style")
    expect(ours).toBeGreaterThan(-1)
    expect(theirs).toBeGreaterThan(-1)
    expect(ours).toBeLessThan(theirs)
  })

  it("declares its charset inside the first 1024 bytes", async () => {
    // The spec only honours <meta charset> in the first 1024 bytes, and the
    // emitted token sheet is kilobytes long — so ThemeStyle ahead of it put
    // charset past 8KB. That still decoded correctly over HTTP, because the
    // response carries a Content-Type; it broke the moment the page was saved
    // to disk, opened over file:// or embedded as an iframe srcdoc, and the
    // title's U+00B7 came out as mojibake. Bytes, not characters, because the
    // limit is a byte limit and the sheet ahead of it is not all ASCII.
    const page = await html("/c/button")
    const at = page.indexOf("<meta charset")
    expect(at).toBeGreaterThan(-1)
    const offset = new TextEncoder().encode(page.slice(0, at)).length
    expect(offset).toBeLessThan(1024)
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

  it("renders unset, light, dark and compact with no client JavaScript", async () => {
    // Assertions read the <html> open tag, not the page. The emitted sheet
    // carries `:root[data-scheme="dark"]` and `:root[data-density="compact"]`
    // selectors of its own, so a whole-page `not.toContain("data-scheme")`
    // would fail on every request.
    // Unset: no attribute at all, so the media query decides the scheme.
    const unset = await html("/c/button?nojs")
    expect(unset).not.toContain("<script")
    expect(htmlTag(unset)).not.toContain("data-scheme")
    expect(htmlTag(unset)).not.toContain("data-density")

    // The value with a job the others do not have: the emitter guards its
    // dark block with `:root:not([data-scheme="light"])`, so `light` is what
    // beats a dark system preference. Unset renders no attribute and does not
    // exercise it.
    const light = await html("/c/button?nojs&scheme=light")
    expect(htmlTag(light)).toContain('data-scheme="light"')
    expect(light).not.toContain("<script")

    const dark = await html("/c/button?nojs&scheme=dark")
    expect(htmlTag(dark)).toContain('data-scheme="dark"')
    expect(dark).not.toContain("<script")

    const compact = await html("/c/button?nojs&density=compact")
    expect(htmlTag(compact)).toContain('data-density="compact"')
    expect(compact).not.toContain("<script")
  })

  it("treats the switchers' explicit defaults as unset", async () => {
    const tag = htmlTag(await html("/c/button?scheme=system&density=default"))
    expect(tag).not.toContain("data-scheme")
    expect(tag).not.toContain("data-density")
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

describe("the dashboard route", () => {
  it("renders the composed recipe", async () => {
    const response = await get("/pages/dashboard")
    expect(response.status).toBe(200)
    const page = await response.text()
    expect(page).toContain("Dashboard")
    expect(page).toContain("Open tasks")
    expect(page).toContain("Renew the TLS certificate")
    expect(page).toContain("Project settings")
    expect(page).toContain("No activity yet")
  })

  it("works with the no-JS toggle on", async () => {
    const page = await html("/pages/dashboard?nojs")
    expect(page).not.toContain("<script")
    expect(page).toContain("Open tasks")
    expect(page).toContain("Project settings")
    // The dialog trigger is a native invoker, so the dialog opens with no
    // runtime at all.
    expect(page).toContain("commandfor=")
    expect(page).toContain("<dialog")
  })

  it("confirms a form round trip from the query string", async () => {
    const page = await html("/pages/dashboard?nojs&project=Beta&plan=free")
    expect(page).toContain("Saved")
    expect(page).toContain("Beta")
  })

  it("carries the variant axes like every other page", async () => {
    const dark = await html("/pages/dashboard?scheme=dark")
    expect(htmlTag(dark)).toContain('data-scheme="dark"')
    expect(dark).toContain('name="density"')
  })
})

describe("the SPA route", () => {
  it("serves a shell resolving the SPA entry through the asset server", async () => {
    const response = await get("/spa")
    expect(response.status).toBe(200)
    const page = await response.text()
    expect(page).toContain('<script type="module" src="/assets/app/spa/public/entry.tsx">')
    expect(page).toContain('type="importmap"')
    expect(page).toContain("Loading the client")
  })

  it("renders the same components with the no-JS toggle on", async () => {
    const server = await html("/c/button?nojs")
    const spa = await html("/spa/button?nojs")
    expect(spa).not.toContain("<script")
    // The same demo markers the catalogue route asserts.
    for (const marker of ["size md", ">primary</button>"]) {
      expect(server).toContain(marker)
      expect(spa).toContain(marker)
    }
  })

  it("serves an index with no scripts either", async () => {
    const page = await html("/spa?nojs")
    expect(page).not.toContain("<script")
    expect(page).toContain("SPA demo")
    expect(page).toContain('href="/spa/button"')
  })

  it("lets the browser router own the 404 with scripts", async () => {
    // An index.html fallback serves the shell for unknown paths too; the
    // client router renders the 404 after boot.
    const response = await get("/spa/nope")
    expect(response.status).toBe(200)
    expect(await response.text()).toContain("Loading the client")
  })

  it("is a 404 page with no scripts", async () => {
    const response = await get("/spa/nope?nojs")
    expect(response.status).toBe(404)
    const page = await response.text()
    expect(page).toContain("No such component")
    expect(page).toContain("Back to the SPA index")
  })

  it("rejects paths deeper than one demo", async () => {
    expect((await get("/spa/button/extra?nojs")).status).toBe(404)
  })
})
