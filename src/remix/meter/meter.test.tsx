import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { markupOf, stylesOf, valuesOf } from "../../../test/styles.ts"
import { Meter, Progress } from "./meter.tsx"
import { meterTokens } from "./tokens.ts"

const keywords = new Set(["100%"])

describe("Progress", () => {
  it("renders determinate with its value and max", async () => {
    const markup = markupOf(await renderToHtml(<Progress max={100} value={60} />))
    expect(markup).toContain("<progress")
    expect(markup).toContain('value="60"')
    expect(markup).toContain('max="100"')
  })

  it("renders indeterminate with no value attribute at all", async () => {
    const markup = markupOf(await renderToHtml(<Progress />))
    expect(markup).not.toContain("value=")
  })

  it("defaults max to 1, for a value already expressed as a fraction", async () => {
    const markup = markupOf(await renderToHtml(<Progress value={0.6} />))
    expect(markup).toContain('max="1"')
    expect(markup).toContain('value="0.6"')
  })

  it("reads only its own tokens and structural keywords", async () => {
    const styles = stylesOf(await renderToHtml(<Progress value={0.6} />))
    const offenders = valuesOf(styles).filter(
      (value) => !keywords.has(value) && !/^var\(--ui-meter-[\w-]+\)$/.test(value),
    )
    expect(offenders).toEqual([])
  })
})

describe("Meter", () => {
  it("renders a gauge with its value and range", async () => {
    const markup = markupOf(
      await renderToHtml(<Meter high={0.8} low={0.3} max={1} min={0} optimum={1} value={0.9} />),
    )
    expect(markup).toContain("<meter")
    expect(markup).toContain('value="0.9"')
    expect(markup).toContain('min="0"')
    expect(markup).toContain('max="1"')
    expect(markup).toContain('low="0.3"')
    expect(markup).toContain('high="0.8"')
    expect(markup).toContain('optimum="1"')
  })

  it("defaults max to 1", async () => {
    const markup = markupOf(await renderToHtml(<Meter value={0.5} />))
    expect(markup).toContain('max="1"')
  })

  it("carries no fill-colour token — the UA's own low/high/optimum semantics decide it", async () => {
    const styles = stylesOf(await renderToHtml(<Meter value={0.5} />))
    expect(styles).not.toContain("accent-color")
  })

  it("reads only its own tokens and structural keywords", async () => {
    const styles = stylesOf(await renderToHtml(<Meter value={0.5} />))
    const offenders = valuesOf(styles).filter(
      (value) => !keywords.has(value) && !/^var\(--ui-meter-[\w-]+\)$/.test(value),
    )
    expect(offenders).toEqual([])
  })
})

describe("the shared token contract", () => {
  it("reads every token across both components", async () => {
    const html = await renderToHtml(
      <>
        <Progress value={0.6} />
        <Meter value={0.5} />
      </>,
    )
    const read = new Set(
      [...stylesOf(html).matchAll(/var\(--(ui-meter-[\w-]+)\)/g)].map((match) => match[1] ?? ""),
    )
    expect([...read].sort()).toEqual(Object.keys(meterTokens).sort())
  })
})
