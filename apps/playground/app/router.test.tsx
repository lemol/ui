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
    const page = await response.text()
    // Not `toContain("Button")`: <title>Button · lemol ui</title> satisfies
    // that on its own, so the route would pass with the demo body missing
    // entirely. These name things only the demo renders.
    expect(page).toContain("size md")
    expect(page).toContain(">primary</button>")
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
