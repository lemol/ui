import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, markupOf, sharedProperties, stylesOf, valuesOf } from "../../../test/styles.ts"
import { Accordion, Disclosure } from "./disclosure.tsx"
import { disclosureTokens } from "./tokens.ts"

/** Structural keywords Disclosure's own blocks may carry instead of a token. */
const keywords = new Set([
  "solid",
  "flex",
  "center",
  "space-between",
  "pointer",
  "none",
  "0deg",
  "90deg",
  "rotate",
  "0",
])

describe("Disclosure", () => {
  it("renders a details/summary pair carrying its children", async () => {
    const markup = markupOf(await renderToHtml(<Disclosure summary="Title">Body</Disclosure>))
    expect(markup).toContain("<details")
    expect(markup).toContain("<summary")
    expect(markup).toContain("Title")
    expect(markup).toContain("Body")
  })

  it("opens with no script: the open attribute is plain markup", async () => {
    const markup = markupOf(
      await renderToHtml(
        <Disclosure open summary="Title">
          Body
        </Disclosure>,
      ),
    )
    const detailsTag = /<details[^>]*>/.exec(markup)?.[0] ?? ""
    expect(detailsTag).toContain("open")
  })

  it("carries the name attribute for accordion grouping", async () => {
    const markup = markupOf(
      await renderToHtml(
        <Disclosure name="faq" summary="Title">
          Body
        </Disclosure>,
      ),
    )
    expect(markup).toContain('name="faq"')
  })

  it("hides the platform marker on the engines that draw it through display", async () => {
    const html = await renderToHtml(<Disclosure summary="Title">Body</Disclosure>)
    const summaryBlock = blocksOn(html, "summary")[0] ?? ""
    expect(summaryBlock).toContain("display: flex")
    expect(summaryBlock).toContain("&::-webkit-details-marker")
  })

  it("rotates the marker from the parent's open state, not a class it toggles itself", async () => {
    const html = await renderToHtml(<Disclosure summary="Title">Body</Disclosure>)
    const markerBlock = blocksOn(html, "svg")[0] ?? ""
    expect(markerBlock).toContain(":where(details[open]) &")
    expect(markerBlock).toContain("rotate: 90deg")
  })

  it("reads only its own tokens and structural keywords", async () => {
    const html = await renderToHtml(<Disclosure summary="Title">Body</Disclosure>)
    const styles = stylesOf(html)
    const offenders = valuesOf(styles).filter(
      (value) => !keywords.has(value) && !/^var\(--ui-disclosure-[\w-]+\)$/.test(value),
    )
    expect(offenders).toEqual([])
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    const html = await renderToHtml(<Disclosure summary="Title">Body</Disclosure>)
    const read = new Set(
      [...stylesOf(html).matchAll(/var\(--(ui-disclosure-[\w-]+)\)/g)].map(
        (match) => match[1] ?? "",
      ),
    )
    expect([...read].sort()).toEqual(Object.keys(disclosureTokens).sort())
  })

  it("keeps its blocks disjoint by property", async () => {
    const html = await renderToHtml(<Disclosure summary="Title">Body</Disclosure>)
    for (const tag of ["details", "summary", "svg", "div"]) {
      const blocks = blocksOn(html, tag)
      expect(blocks.length).toBeGreaterThan(0)
      expect(sharedProperties(blocks)).toEqual([])
    }
  })
})

describe("Accordion", () => {
  const items = [
    { children: "One body", id: "one", summary: "One" },
    { children: "Two body", id: "two", summary: "Two" },
    { children: "Three body", id: "three", summary: "Three" },
  ]

  it("gives every item the same name, the platform's own mutual exclusion", async () => {
    const markup = markupOf(await renderToHtml(<Accordion items={items} name="faq" />))
    const names = [...markup.matchAll(/name="([^"]*)"/g)].map((match) => match[1])
    expect(names).toEqual(["faq", "faq", "faq"])
  })

  it("renders every item's summary and body", async () => {
    const markup = markupOf(await renderToHtml(<Accordion items={items} name="faq" />))
    for (const item of items) {
      expect(markup).toContain(item.summary)
      expect(markup).toContain(item.children)
    }
  })

  it("opens only the item marked open", async () => {
    const markup = markupOf(
      await renderToHtml(
        <Accordion
          items={[
            { id: "one", open: true, summary: "One" },
            { id: "two", summary: "Two" },
          ]}
          name="faq"
        />,
      ),
    )
    const detailsTags = [...markup.matchAll(/<details[^>]*>/g)].map((match) => match[0])
    expect(detailsTags[0]).toContain("open")
    expect(detailsTags[1]).not.toContain("open")
  })
})
