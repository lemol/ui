import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, markupOf, sharedProperties, stylesOf, valuesOf } from "../../../test/styles.ts"
import { Breadcrumbs } from "./breadcrumbs.tsx"
import { breadcrumbsTokens } from "./tokens.ts"

const keywords = new Set(["flex", "wrap", "center", "0", "none", "anywhere", "inline-flex"])

const items = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { label: "Redesign the catalogue" },
]

describe("Breadcrumbs", () => {
  it("renders a nav > ol > li structure with every item's label", async () => {
    const markup = markupOf(await renderToHtml(<Breadcrumbs items={items} />))
    expect(markup).toContain("<nav")
    expect(markup).toContain("<ol")
    expect([...markup.matchAll(/<li/g)]).toHaveLength(3)
    for (const item of items) expect(markup).toContain(item.label)
  })

  it("defaults its accessible name to Breadcrumb", async () => {
    const markup = markupOf(await renderToHtml(<Breadcrumbs items={items} />))
    expect(markup).toContain('aria-label="Breadcrumb"')
  })

  it("takes a custom accessible name", async () => {
    const markup = markupOf(await renderToHtml(<Breadcrumbs items={items} label="You are here" />))
    expect(markup).toContain('aria-label="You are here"')
  })

  it("renders every non-final item with an href as a real link", async () => {
    const markup = markupOf(await renderToHtml(<Breadcrumbs items={items} />))
    expect(markup).toContain('<a href="/"')
    expect(markup).toContain('<a href="/projects"')
  })

  it("marks the final item with no href as the current page, not a link", async () => {
    const markup = markupOf(await renderToHtml(<Breadcrumbs items={items} />))
    expect(markup).toContain('aria-current="page"')
    expect(markup).not.toContain('<a href="undefined"')
    const currentTag = /<span aria-current="page"[^>]*>([^<]*)<\/span>/.exec(markup)
    expect(currentTag?.[1]).toBe("Redesign the catalogue")
  })

  it("renders a non-final item with no href as plain text, not a link", async () => {
    const markup = markupOf(
      await renderToHtml(
        <Breadcrumbs items={[{ label: "Home" }, { label: "Archived" }, { label: "Current" }]} />,
      ),
    )
    // No item here has an href, so nothing should be a link at all — the
    // last one is still the current page, just via aria-current rather
    // than by having somewhere to link to.
    expect(markup).not.toContain("<a")
    expect(markup).toContain("Home")
    expect(markup).toContain("Archived")
  })

  it("hides the separator from assistive tech and omits it after the last item", async () => {
    const markup = markupOf(await renderToHtml(<Breadcrumbs items={items} />))
    expect([...markup.matchAll(/aria-hidden="true"/g)]).toHaveLength(2)
  })

  it("breaks a crumb wider than the line instead of overflowing it", async () => {
    const long = [{ href: "/", label: "Home" }, { label: "x".repeat(200) }]
    const html = await renderToHtml(<Breadcrumbs items={long} />)
    expect(stylesOf(html)).toContain("overflow-wrap: anywhere")
    expect(stylesOf(html)).not.toContain("white-space: nowrap")
  })

  it("reads only its own tokens and structural keywords", async () => {
    const styles = stylesOf(await renderToHtml(<Breadcrumbs items={items} />))
    const offenders = valuesOf(styles).filter(
      (value) => !keywords.has(value) && !/^var\(--ui-breadcrumbs-[\w-]+\)$/.test(value),
    )
    expect(offenders).toEqual([])
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    const html = await renderToHtml(<Breadcrumbs items={items} />)
    const read = new Set(
      [...stylesOf(html).matchAll(/var\(--(ui-breadcrumbs-[\w-]+)\)/g)].map(
        (match) => match[1] ?? "",
      ),
    )
    expect([...read].sort()).toEqual(Object.keys(breadcrumbsTokens).sort())
  })

  it("keeps each element's blocks disjoint by property", async () => {
    const html = await renderToHtml(<Breadcrumbs items={items} />)
    for (const tag of ["nav", "ol", "li", "a", "span"]) {
      const blocks = blocksOn(html, tag)
      expect(blocks.length).toBeGreaterThan(0)
      expect(sharedProperties(blocks)).toEqual([])
    }
  })
})
