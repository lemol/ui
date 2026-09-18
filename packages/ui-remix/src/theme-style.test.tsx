import { describe, expect, it } from "bun:test"
import { defineTheme, type PrimitiveTokens, primitiveNames } from "@lemol/ui-design"
import { emitTokensCss } from "@lemol/ui-design/css"
import { renderToHtml } from "../../../test/render.ts"
import { ThemeStyle } from "./theme-style.tsx"
import { type ComponentTokenName, componentTokens } from "./tokens.ts"

/** A complete theme whose every value names itself, so a declaration is traceable. */
const fullBase = Object.fromEntries(
  primitiveNames.map((name) => [name, `val-${name}`]),
) as PrimitiveTokens

const theme = defineTheme<ComponentTokenName>({
  base: fullBase,
  dark: { canvas: "dark-canvas" },
  compact: { "row-h": "compact-row" },
})

describe("ThemeStyle", () => {
  it("renders one style element and nothing else", async () => {
    const html = await renderToHtml(<ThemeStyle theme={theme} />)
    expect(html.match(/<style/g) ?? []).toHaveLength(1)
  })

  it("carries the emitter's string verbatim", async () => {
    // Exact equality is the assertion: remix escapes &, < and > in element
    // text content, and this component uses innerHTML precisely so the sheet
    // is not at the mercy of that.
    const html = await renderToHtml(<ThemeStyle theme={theme} />)
    expect(html).toContain(emitTokensCss(theme, { componentTokens }))
  })

  it("opens with the layer statement, which nothing may precede", async () => {
    const html = await renderToHtml(<ThemeStyle theme={theme} />)
    const style = html.indexOf("<style")
    expect(html.indexOf("@layer base, rmx;")).toBeGreaterThan(style)
    expect(html.indexOf("--canvas:")).toBeGreaterThan(html.indexOf("@layer base, rmx;"))
  })

  it("includes this package's component tokens without being asked", async () => {
    expect(await renderToHtml(<ThemeStyle theme={theme} />)).toContain("--ui-btn-radius:")
  })

  it("writes component defaults before theme values, so a theme wins", async () => {
    const skinned = defineTheme<ComponentTokenName>({
      base: { ...fullBase, "ui-btn-radius": "skinned-radius" },
    })
    const html = await renderToHtml(<ThemeStyle theme={skinned} />)
    expect(html.indexOf("--ui-btn-radius: var(--r-sm);")).toBeLessThan(
      html.indexOf("--ui-btn-radius: skinned-radius;"),
    )
  })

  it("takes a wider record for an app with its own component tokens", async () => {
    const html = await renderToHtml(
      <ThemeStyle componentTokens={{ ...componentTokens, "ui-app-x": "1px" }} theme={theme} />,
    )
    expect(html).toContain("--ui-app-x: 1px;")
  })
})
