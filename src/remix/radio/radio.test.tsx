import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, markupOf, sharedProperties, stylesOf, valuesOf } from "../../../test/styles.ts"
import { Radio } from "./radio.tsx"
import { radioTokens } from "./tokens.ts"

const keywords = new Set(["flex", "start", "column", "not-allowed", "0"])

describe("Radio", () => {
  it("renders a radio input bound to its label", async () => {
    const markup = markupOf(
      await renderToHtml(<Radio label="Compact" name="density" value="compact" />),
    )
    expect(markup).toContain('type="radio"')
    expect(markup).toContain('name="density"')
    expect(markup).toContain('value="compact"')
    expect(markup).toContain('id="density-compact"')
    expect(markup).toContain('for="density-compact"')
    expect(markup).toContain("Compact")
  })

  it("derives distinct ids for two options sharing one name", async () => {
    const markup = markupOf(
      await renderToHtml(
        <>
          <Radio label="Compact" name="density" value="compact" />
          <Radio label="Comfortable" name="density" value="comfortable" />
        </>,
      ),
    )
    expect(markup).toContain('id="density-compact"')
    expect(markup).toContain('id="density-comfortable"')
  })

  it("checks and disables from plain props", async () => {
    const markup = markupOf(
      await renderToHtml(<Radio checked disabled label="Compact" name="density" value="compact" />),
    )
    expect(markup).toContain("checked")
    expect(markup).toContain("disabled")
  })

  it("wires a hint and an error the same way Checkbox does", async () => {
    const markup = markupOf(
      await renderToHtml(
        <Radio error="Pick one" hint="Row height" label="Compact" name="density" value="compact" />,
      ),
    )
    expect(markup).toContain('aria-describedby="density-compact-hint density-compact-error"')
    expect(markup).toContain('aria-invalid="true"')
  })

  it("overrides the id stem without touching the label binding", async () => {
    const markup = markupOf(
      await renderToHtml(<Radio id="density-1" label="Compact" name="density" value="compact" />),
    )
    expect(markup).toContain('id="density-1"')
    expect(markup).toContain('for="density-1"')
  })

  it("reads only its own tokens and structural keywords", async () => {
    const html = await renderToHtml(
      <Radio
        disabled
        error="Pick one"
        hint="Row height"
        label="Compact"
        name="density"
        value="compact"
      />,
    )
    const offenders = valuesOf(stylesOf(html)).filter(
      (value) => !keywords.has(value) && !/^var\(--ui-radio-[\w-]+\)$/.test(value),
    )
    expect(offenders).toEqual([])
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    // Both states — see checkbox.test.tsx's own note on why one render is not enough.
    const html = await renderToHtml(
      <>
        <Radio error="Pick one" hint="Row height" label="Compact" name="density" value="compact" />
        <Radio disabled label="Comfortable" name="density" value="comfortable" />
      </>,
    )
    const read = new Set(
      [...stylesOf(html).matchAll(/var\(--(ui-radio-[\w-]+)\)/g)].map((match) => match[1] ?? ""),
    )
    expect([...read].sort()).toEqual(Object.keys(radioTokens).sort())
  })

  it("keeps each element's blocks disjoint by property", async () => {
    const html = await renderToHtml(
      <Radio
        disabled
        error="Pick one"
        hint="Row height"
        label="Compact"
        name="density"
        value="compact"
      />,
    )
    for (const tag of ["input", "label"]) {
      const blocks = blocksOn(html, tag)
      expect(blocks.length).toBeGreaterThan(0)
      expect(sharedProperties(blocks)).toEqual([])
    }
  })
})
