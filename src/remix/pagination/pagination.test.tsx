import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, markupOf, sharedProperties, stylesOf, valuesOf } from "../../../test/styles.ts"
import { currentPageOf, Pagination, pageHref } from "./pagination.tsx"
import { paginationTokens } from "./tokens.ts"

const keywords = new Set(["flex", "center", "0", "none", "inline-flex"])

describe("currentPageOf", () => {
  it("defaults to 1 when the query carries no page", () => {
    expect(currentPageOf("/c/pagination")).toBe(1)
  })

  it("reads the page from the query string", () => {
    expect(currentPageOf("/c/pagination?page=5")).toBe(5)
  })

  it("defaults to 1 for a non-positive or non-integer page", () => {
    expect(currentPageOf("/c/pagination?page=0")).toBe(1)
    expect(currentPageOf("/c/pagination?page=-3")).toBe(1)
    expect(currentPageOf("/c/pagination?page=abc")).toBe(1)
    expect(currentPageOf("/c/pagination?page=2.5")).toBe(1)
  })
})

describe("pageHref", () => {
  it("sets the page param", () => {
    expect(pageHref("/c/pagination", 3)).toBe("/c/pagination?page=3")
  })

  it("preserves every other query param", () => {
    expect(pageHref("/c/pagination?q=amara&page=1", 2)).toBe("/c/pagination?q=amara&page=2")
  })
})

describe("Pagination", () => {
  it("renders every control as a real anchor, reachable with no click handler", async () => {
    const markup = markupOf(
      await renderToHtml(<Pagination location="/c/pagination?page=5" totalPages={10} />),
    )
    expect(markup).toContain('href="/c/pagination?page=4"')
    expect(markup).toContain('href="/c/pagination?page=6"')
    expect(markup).toContain('href="/c/pagination?page=1"')
    expect(markup).toContain('href="/c/pagination?page=10"')
  })

  it("marks the current page with aria-current", async () => {
    const markup = markupOf(
      await renderToHtml(<Pagination location="/c/pagination?page=5" totalPages={10} />),
    )
    expect(markup).toContain('aria-current="page"')
    const currentTag = /<a aria-current="page"[^>]*>(\d+)<\/a>/.exec(markup)
    expect(currentTag?.[1]).toBe("5")
  })

  it("renders Previous as plain text, not a broken disabled link, on the first page", async () => {
    const markup = markupOf(
      await renderToHtml(<Pagination location="/c/pagination?page=1" totalPages={10} />),
    )
    expect(markup).not.toContain('href="/c/pagination?page=0"')
    expect(/<span[^>]*>Previous<\/span>/.test(markup)).toBe(true)
    expect(markup).toContain('href="/c/pagination?page=2"')
  })

  it("renders Next as plain text on the last page", async () => {
    const markup = markupOf(
      await renderToHtml(<Pagination location="/c/pagination?page=10" totalPages={10} />),
    )
    expect(markup).not.toContain('href="/c/pagination?page=11"')
    expect(/<span[^>]*>Next<\/span>/.test(markup)).toBe(true)
  })

  it("renders an ellipsis marked aria-hidden, not a link", async () => {
    const markup = markupOf(
      await renderToHtml(<Pagination location="/c/pagination?page=5" totalPages={20} />),
    )
    expect(markup).toContain("…")
    expect([...markup.matchAll(/aria-hidden="true"/g)].length).toBeGreaterThan(0)
  })

  it("reads only its own tokens and structural keywords", async () => {
    const styles = stylesOf(
      await renderToHtml(<Pagination location="/c/pagination?page=5" totalPages={20} />),
    )
    const offenders = valuesOf(styles).filter(
      (value) => !keywords.has(value) && !/^var\(--ui-pagination-[\w-]+\)$/.test(value),
    )
    expect(offenders).toEqual([])
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    // First and last page too, so the disabled-boundary tokens are reachable.
    const html = await renderToHtml(
      <>
        <Pagination location="/c/pagination?page=5" totalPages={20} />
        <Pagination location="/c/pagination?page=1" totalPages={20} />
        <Pagination location="/c/pagination?page=20" totalPages={20} />
      </>,
    )
    const read = new Set(
      [...stylesOf(html).matchAll(/var\(--(ui-pagination-[\w-]+)\)/g)].map(
        (match) => match[1] ?? "",
      ),
    )
    expect([...read].sort()).toEqual(Object.keys(paginationTokens).sort())
  })

  it("keeps each element's blocks disjoint by property", async () => {
    // Not "nav" or "li": neither carries a style of its own — Pagination
    // only forwards the caller's `mix` to `nav`, and every `li` is bare
    // markup around the `a`/`span` that actually reads the contract.
    const html = await renderToHtml(<Pagination location="/c/pagination?page=5" totalPages={20} />)
    for (const tag of ["ul", "a"]) {
      const blocks = blocksOn(html, tag)
      expect(blocks.length).toBeGreaterThan(0)
      expect(sharedProperties(blocks)).toEqual([])
    }
  })
})
