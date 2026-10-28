import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../test/render.ts"
import { extendTheme } from "../design/index.ts"
import { Document } from "./document.tsx"
import { miniTheme } from "./theme.ts"

/** A resolved script entry, shaped as the asset server returns one. */
const entry = {
  href: "/assets/app/entry.ts",
  preloads: ["/assets/app/dep.ts"],
  importMap: { imports: { "app/entry.ts": "/assets/app/entry.ts" } },
}

/** The root element's open tag, so an attribute assertion cannot be satisfied
 *  by a selector inside the emitted stylesheet. */
const htmlTag = (page: string) => /<html[^>]*>/.exec(page)?.[0] ?? ""

describe("Document", () => {
  it("renders a whole document around its children", async () => {
    const page = await renderToHtml(<Document title="Tasks">body content</Document>)

    expect(page).toContain("<html")
    expect(page).toContain("<head>")
    expect(page).toContain("<body>")
    expect(page).toContain("body content")
  })

  it("names the page, and appends the site when there is one", async () => {
    expect(await renderToHtml(<Document title="Tasks" />)).toContain("<title>Tasks</title>")
    expect(await renderToHtml(<Document site="todo-md" title="Tasks" />)).toContain(
      "<title>Tasks · todo-md</title>",
    )
  })

  it("declares its charset inside the first 1024 bytes", async () => {
    // The spec only honours <meta charset> in the first 1024 bytes, and the
    // token sheet below it is kilobytes long. Bytes, not characters: the limit
    // is a byte limit, and the title's separator is not ASCII.
    const page = await renderToHtml(<Document site="todo-md" title="Tasks" />)
    const at = page.indexOf("<meta charset")

    expect(at).toBeGreaterThan(-1)
    expect(new TextEncoder().encode(page.slice(0, at)).length).toBeLessThan(1024)
  })

  it("puts the boot script ahead of the token sheet, which is what stops the flash", async () => {
    // The boot script sets data-scheme and data-density on the root element.
    // After the sheet, the first paint is the wrong scheme and the correction
    // is visible; before it, the sheet's scheme selectors are evaluated once.
    const page = await renderToHtml(<Document title="Tasks" />)
    const boot = page.indexOf("localStorage.getItem")
    const sheet = page.indexOf("@layer rmx-reset, base, rmx;")

    expect(boot).toBeGreaterThan(-1)
    expect(sheet).toBeGreaterThan(-1)
    expect(boot).toBeLessThan(sheet)
  })

  it("inlines the boot script rather than escaping it into a syntax error", async () => {
    // A renderer escapes &, < and > in element text. The script carries none
    // of the three by construction, and this is the half of that defence that
    // does not depend on boot.ts keeping the rule.
    const page = await renderToHtml(<Document title="Tasks" />)

    expect(page).toContain('r.setAttribute("data-scheme"')
    expect(page).not.toContain("&quot;data-scheme&quot;")
  })

  it("drops every script when the boot script is off and there is no entry", async () => {
    // The no-JS assertion a page makes about itself: complete markup, no
    // script element of any kind. The boot script is not an enhancement, so
    // it is a separate switch from `entry`.
    const page = await renderToHtml(<Document boot={false} title="Tasks" />)

    expect(page).not.toContain("<script")
    expect(page).toContain("@layer rmx-reset, base, rmx;")
  })

  it("keeps the boot script on a page that carries no browser entry", async () => {
    const page = await renderToHtml(<Document entry={null} title="Tasks" />)

    expect(page).toContain("localStorage.getItem")
    expect(page).not.toContain('type="module"')
  })

  it("renders the entry behind its import map and its preloads", async () => {
    // A module script that outruns its import map fails on a bare specifier,
    // and a preload after the script it preloads is wasted bytes.
    const page = await renderToHtml(<Document entry={entry} title="Tasks" />)
    const map = page.indexOf('type="importmap"')
    const preload = page.indexOf('rel="modulepreload"')
    const script = page.indexOf('src="/assets/app/entry.ts"')

    expect(map).toBeGreaterThan(-1)
    expect(preload).toBeGreaterThan(map)
    expect(script).toBeGreaterThan(preload)
  })

  it("renders the scheme and density the server chose, and nothing when it chose neither", async () => {
    // Read the open tag, not the page: the emitted sheet carries
    // :root[data-scheme="dark"] selectors of its own.
    expect(htmlTag(await renderToHtml(<Document title="Tasks" />))).not.toContain("data-scheme=")
    expect(htmlTag(await renderToHtml(<Document title="Tasks" />))).not.toContain("data-density=")

    const chosen = htmlTag(
      await renderToHtml(<Document density="compact" scheme="dark" title="T" />),
    )

    expect(chosen).toContain('data-scheme="dark"')
    expect(chosen).toContain('data-density="compact"')
  })

  it("declares a language, defaulting to en", async () => {
    expect(htmlTag(await renderToHtml(<Document title="Tasks" />))).toContain('lang="en"')
    expect(htmlTag(await renderToHtml(<Document lang="pt" title="Tasks" />))).toContain('lang="pt"')
  })

  it("emits mini's theme by default, and an extension when given one", async () => {
    expect(await renderToHtml(<Document title="Tasks" />)).toContain("--accent: #1F6B5C;")

    const branded = extendTheme(miniTheme, { base: { accent: "#7A3E9D" } })
    const page = await renderToHtml(<Document theme={branded} title="Tasks" />)

    expect(page).toContain("--accent: #7A3E9D;")
  })

  it("renders app head content before the sheet, where it can push nothing out of place", async () => {
    const page = await renderToHtml(
      <Document head={<link rel="icon" href="/icon.svg" />} title="Tasks" />,
    )

    const icon = page.indexOf('href="/icon.svg"')

    expect(page.indexOf("<meta charset")).toBeLessThan(icon)
    expect(icon).toBeLessThan(page.indexOf("@layer rmx-reset, base, rmx;"))
  })
})

describe("Document preserved axes", () => {
  it("names both axes when neither is set", async () => {
    const page = await renderToHtml(<Document title="Tasks" />)

    expect(htmlTag(page)).toContain('data-rmx-preserve-attrs="data-scheme data-density"')
  })

  it("names only density when the scheme is set", async () => {
    const page = await renderToHtml(<Document scheme="dark" title="Tasks" />)

    expect(htmlTag(page)).toContain('data-rmx-preserve-attrs="data-density"')
  })

  it("names only the scheme when density is set", async () => {
    const page = await renderToHtml(<Document density="compact" title="Tasks" />)

    expect(htmlTag(page)).toContain('data-rmx-preserve-attrs="data-scheme"')
  })

  it("omits the attribute when both are set", async () => {
    const page = await renderToHtml(<Document density="compact" scheme="dark" title="Tasks" />)

    expect(htmlTag(page)).not.toContain("data-rmx-preserve-attrs")
  })
})
