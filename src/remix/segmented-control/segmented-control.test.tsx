import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, markupOf, stylesOf, valuesOf } from "../../../test/styles.ts"
import { SegmentedControl } from "./segmented-control.tsx"
import { segmentedControlTokens } from "./tokens.ts"

const keywords = new Set([
  "relative",
  "inline-grid",
  "absolute",
  "none",
  "nowrap",
  "1px",
  "hidden",
  "flex",
  "center",
  "pointer",
  "not-allowed",
  "translate",
  "color",
  "0",
  // The visually-hidden recipe (`mini/shell.tsx`'s skip link uses the same
  // clip-path), and `repeat(n, 1fr)`, structural like `Grid`'s own
  // `columnStyles` — neither is a themeable quantity.
  "inset(50%)",
  "repeat(3, 1fr)",
  // The reset's own focus-ring rule, relocated because the input it targets
  // is visually hidden — see labelStyle's own comment. Reading the
  // primitives directly here is what makes it the same rule, not a second
  // one with its own token.
  "var(--focus-ring)",
  "var(--focus-ring-offset)",
])

/**
 * Own tokens and structural values only. Decompose calc() so literals and
 * foreign tokens cannot hide beside an own token. After removing own var()s,
 * only the inline-size's `100%` span, `* 2` doubling, `/ <count>` positive
 * integer divisor, calc, parentheses, subtraction and whitespace may remain.
 * Bare integer percentages are the per-index translate, not calc() literals.
 */
const isCleanValue = (value: string): boolean => {
  if (keywords.has(value)) return true

  if (/^var\(--ui-segmented-[\w-]+\)$/.test(value)) return true

  if (/^\d+%$/.test(value)) return true

  if (!value.startsWith("calc(")) return false

  const references = [...value.matchAll(/var\(--([\w-]+)\)/g)]

  if (references.length === 0) return false

  if (!references.every((match) => match[1]?.startsWith("ui-segmented-"))) return false

  const rest = value
    .replace(/var\(--[\w-]+\)/g, "")
    .replace(/(?<![\d.])100%|\* 2\b|\/ [1-9]\d*\b/g, "")
    .replace(/^calc\(|[()\-\s]/g, "")

  return rest === ""
}

const options = [
  { label: "Compact", value: "compact" },
  { label: "Comfortable", value: "comfortable" },
  { label: "Spacious", value: "spacious" },
]

describe("SegmentedControl", () => {
  it("renders a native radio group inside a fieldset", async () => {
    const markup = markupOf(
      await renderToHtml(<SegmentedControl label="Density" name="density" options={options} />),
    )

    expect(markup).toContain("<fieldset")
    expect(markup).toContain("<legend")
    expect(markup).toContain("Density")
    expect([...markup.matchAll(/type="radio"/g)]).toHaveLength(3)
    expect([...markup.matchAll(/name="density"/g)]).toHaveLength(3)
  })

  it("checks the option matching value, and none when it matches nothing", async () => {
    const markup = markupOf(
      await renderToHtml(
        <SegmentedControl label="Density" name="density" options={options} value="comfortable" />,
      ),
    )

    const inputs = [...markup.matchAll(/<input[^>]*>/g)].map((match) => match[0])

    expect(inputs[0]).not.toContain("checked")
    expect(inputs[1]).toContain("checked")
    expect(inputs[2]).not.toContain("checked")
  })

  it("disables every option through the native fieldset attribute, not a per-input one", async () => {
    const markup = markupOf(
      await renderToHtml(
        <SegmentedControl disabled label="Density" name="density" options={options} />,
      ),
    )

    expect(markup).toContain("<fieldset disabled")
  })

  it("renders no per-input disabled attribute — the fieldset carries it alone", async () => {
    const markup = markupOf(
      await renderToHtml(
        <SegmentedControl disabled label="Density" name="density" options={options} />,
      ),
    )

    const inputs = [...markup.matchAll(/<input[^>]*>/g)].map((match) => match[0])

    expect(inputs).toHaveLength(3)

    for (const input of inputs) expect(input).not.toContain("disabled")
  })

  it("one indicator rule per option, keyed positionally rather than by id", async () => {
    const html = await renderToHtml(
      <SegmentedControl label="Density" name="density" options={options} />,
    )

    const indicatorBlock = blocksOn(html, "div")[0] ?? ""

    for (let index = 1; index <= options.length; index++) {
      expect(indicatorBlock).toContain(`label:nth-of-type(${index})`)
    }

    expect(indicatorBlock).not.toContain(options[0]?.value ?? "")
  })

  it("reads only its own tokens and structural keywords", async () => {
    const html = await renderToHtml(
      <SegmentedControl
        disabled
        label="Density"
        name="density"
        options={options}
        value="compact"
      />,
    )

    const offenders = valuesOf(stylesOf(html)).filter((value) => !isCleanValue(value))

    expect(offenders).toEqual([])
  })

  it.each([
    "calc(var(--ui-segmented-x) + 4px)",
    "calc(var(--ui-segmented-x) * 3)",
    "calc(var(--ui-segmented-x) + var(--other))",
  ])("flags an offender inside calc(): %s", (value) => {
    expect(isCleanValue(value)).toBe(false)
  })

  it("clears the indicator's own inline-size calculation", () => {
    expect(isCleanValue("calc((100% - var(--ui-segmented-track-pad) * 2) / 3)")).toBe(true)
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    const html = await renderToHtml(
      <SegmentedControl
        disabled
        label="Density"
        name="density"
        options={options}
        value="compact"
      />,
    )

    const read = new Set(
      [...stylesOf(html).matchAll(/var\(--(ui-segmented-[\w-]+)\)/g)].map(
        (match) => match[1] ?? "",
      ),
    )

    expect([...read].sort()).toEqual(Object.keys(segmentedControlTokens).sort())
  })
})
