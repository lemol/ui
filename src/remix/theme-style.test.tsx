import { describe, expect, it } from "bun:test"
import { type Handle, unsafeHTML } from "remix/component"
import { renderToHtml } from "../../test/render.ts"
import { emitTokensCss } from "../design/css/index.ts"
import { defineTheme, type PrimitiveTokens, primitiveNames } from "../design/index.ts"
import { ThemeStyle, type ThemeStyleProps } from "./theme-style.tsx"
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
    expect(html.indexOf("@layer rmx-reset, base, rmx;")).toBeGreaterThan(style)
    expect(html.indexOf("--canvas:")).toBeGreaterThan(html.indexOf("@layer rmx-reset, base, rmx;"))
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

  it("sets innerHTML on the style element and renders no children", async () => {
    // Every test above reads rendered HTML, and emitTokensCss() currently bans
    // &, < and > — so a rewrite to text children (`<style>{css}</style>`)
    // would produce byte-identical HTML and pass all of them. This reads the
    // element remix actually builds, before serialization erases the
    // distinction: a text child fails it even while the emitter's ban still
    // makes the two forms look the same on the wire. If this starts failing,
    // someone switched to text children, which will silently corrupt any
    // future declaration the emitter is allowed to carry (see the doc comment
    // on ThemeStyle for why that's a real future, not a hypothetical one).
    const handle = { props: { theme } } as unknown as Handle<ThemeStyleProps>
    const element = ThemeStyle(handle)()
    expect(element.type).toBe("style")
    expect(element.props.innerHTML).toBeDefined()
    expect(element.props.children).toBeUndefined()
    expect(await renderToHtml(element)).toContain("@layer rmx-reset, base, rmx;")
  })

  it("remix escapes text children but not innerHTML", async () => {
    // Pins the assumption ThemeStyle's innerHTML choice rests on. A literal
    // string is used here, not emitTokensCss(), specifically to carry the
    // characters the emitter refuses to emit today — the point is to check
    // the renderer's behaviour in isolation, not the emitter's ban. If this
    // ever fails, remix stopped escaping text content (or started escaping
    // innerHTML), and the innerHTML decision in theme-style.tsx needs
    // revisiting, not just this test.
    const raw = "a & b < c > d"
    const viaInnerHtml = await renderToHtml(<style innerHTML={unsafeHTML(raw)} />)
    const viaChildren = await renderToHtml(<style>{raw}</style>)
    expect(viaInnerHtml).toContain(raw)
    expect(viaChildren).not.toContain(raw)
    expect(viaChildren).toContain("a &amp; b &lt; c &gt; d")
  })
})
