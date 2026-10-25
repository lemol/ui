import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, markupOf, sharedProperties, stylesOf, valuesOf } from "../../../test/styles.ts"
import { Checkbox } from "./checkbox.tsx"
import { checkboxTokens } from "./tokens.ts"

const keywords = new Set(["flex", "start", "column", "not-allowed", "0"])

describe("Checkbox", () => {
  it("renders a checkbox input bound to its label", async () => {
    const markup = markupOf(await renderToHtml(<Checkbox label="Subscribe" name="newsletter" />))

    expect(markup).toContain('type="checkbox"')
    expect(markup).toContain('id="newsletter"')
    expect(markup).toContain('for="newsletter"')
    expect(markup).toContain("Subscribe")
  })

  it("checks and disables from plain props, no controlled state", async () => {
    const markup = markupOf(
      await renderToHtml(<Checkbox checked disabled label="Subscribe" name="newsletter" />),
    )

    expect(markup).toContain("checked")
    expect(markup).toContain("disabled")
  })

  it("starts ticked from defaultChecked, leaving the tick to the person", async () => {
    const ticked = markupOf(
      await renderToHtml(<Checkbox defaultChecked label="Subscribe" name="newsletter" />),
    )

    const plain = markupOf(await renderToHtml(<Checkbox label="Subscribe" name="newsletter" />))

    expect(ticked).toMatch(/<input[^>]*\bchecked\b/)
    expect(plain).not.toMatch(/<input[^>]*\bchecked\b/)
  })

  it("wires a hint through aria-describedby", async () => {
    const markup = markupOf(
      await renderToHtml(<Checkbox hint="Weekly digest" label="Subscribe" name="newsletter" />),
    )

    expect(markup).toContain('aria-describedby="newsletter-hint"')
    expect(markup).toContain('id="newsletter-hint"')
    expect(markup).toContain("Weekly digest")
  })

  it("wires an error through aria-describedby and aria-invalid", async () => {
    const markup = markupOf(
      await renderToHtml(<Checkbox error="Required" label="Subscribe" name="newsletter" />),
    )

    expect(markup).toContain('aria-describedby="newsletter-error"')
    expect(markup).toContain('aria-invalid="true"')
    expect(markup).toContain("Required")
  })

  it("renders no message paragraph when hint and error are absent", async () => {
    const markup = markupOf(await renderToHtml(<Checkbox label="Subscribe" name="newsletter" />))

    expect(markup).not.toContain("<p")
    expect(markup).not.toContain("aria-describedby")
  })

  it("overrides the id stem without touching the label binding", async () => {
    const markup = markupOf(
      await renderToHtml(<Checkbox id="newsletter-2" label="Subscribe" name="newsletter" />),
    )

    expect(markup).toContain('id="newsletter-2"')
    expect(markup).toContain('for="newsletter-2"')
  })

  it("reads only its own tokens and structural keywords", async () => {
    const html = await renderToHtml(
      <Checkbox
        disabled
        error="Required"
        hint="Weekly digest"
        label="Subscribe"
        name="newsletter"
      />,
    )

    const offenders = valuesOf(stylesOf(html)).filter(
      (value) => !keywords.has(value) && !/^var\(--ui-checkbox-[\w-]+\)$/.test(value),
    )

    expect(offenders).toEqual([])
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    // Both states: the disabled label ink and the ordinary label ink are two
    // different blocks (see checkbox.tsx's own note), so only one renders at
    // a time — both have to render for both tokens to be reachable.
    const html = await renderToHtml(
      <>
        <Checkbox error="Required" hint="Weekly digest" label="Subscribe" name="newsletter" />
        <Checkbox disabled label="Subscribe" name="newsletter-2" />
      </>,
    )

    const read = new Set(
      [...stylesOf(html).matchAll(/var\(--(ui-checkbox-[\w-]+)\)/g)].map((match) => match[1] ?? ""),
    )

    expect([...read].sort()).toEqual(Object.keys(checkboxTokens).sort())
  })

  it("keeps each element's blocks disjoint by property", async () => {
    // Per tag, not across the whole document: label, hint and error
    // legitimately share properties like font-size with each other, the
    // same reasoning dialog.test.tsx's own version of this test gives.
    const html = await renderToHtml(
      <Checkbox
        disabled
        error="Required"
        hint="Weekly digest"
        label="Subscribe"
        name="newsletter"
      />,
    )

    for (const tag of ["input", "label"]) {
      const blocks = blocksOn(html, tag)

      expect(blocks.length).toBeGreaterThan(0)
      expect(sharedProperties(blocks)).toEqual([])
    }
  })
})
