import { describe, expect, it } from "bun:test"
import { defineTheme } from "../theme.ts"
import { type PrimitiveTokens, primitiveNames } from "../tokens.ts"
import { emitTokensCss } from "./emit.ts"

/** A complete theme whose every value names itself, so a declaration is traceable. */
function fullBase(overrides: Record<string, string> = {}): PrimitiveTokens {
  const entries: [string, string][] = primitiveNames.map((name) => [
    name,
    overrides[name] ?? `val-${name}`,
  ])

  return Object.fromEntries(entries) as PrimitiveTokens
}

const threeAxes = defineTheme({
  base: fullBase(),
  dark: { canvas: "dark-canvas" },
  compact: { "row-h": "compact-row" },
  touch: { "control-h": "touch-control" },
})

const sheet = emitTokensCss(threeAxes)

const at = (needle: string) => sheet.indexOf(needle)

describe("the sheet", () => {
  it("opens with the layer statement", () => {
    // Layer order is fixed by the first @layer statement the browser sees, so
    // nothing may precede it.
    expect(sheet.startsWith("@layer rmx-reset, base, rmx;\n")).toBe(true)
  })

  it("emits the blocks in the documented order", () => {
    expect(at(":root {")).toBeGreaterThan(at("@layer rmx-reset, base, rmx;"))
    expect(at("@media (prefers-color-scheme: dark)")).toBeGreaterThan(at(":root {"))
    expect(at(':root[data-scheme="dark"]')).toBeGreaterThan(at("@media (prefers-color-scheme"))
    expect(at(':root[data-density="compact"]')).toBeGreaterThan(at(':root[data-scheme="dark"]'))
    expect(at("@media (pointer: coarse)")).toBeGreaterThan(at(':root[data-density="compact"]'))
    expect(at("@layer base {")).toBeGreaterThan(at("@media (pointer: coarse)"))
    expect(at("[hidden] {")).toBeGreaterThan(at("@layer base {"))
    expect(at("@media (prefers-reduced-motion: reduce)")).toBeGreaterThan(at("[hidden] {"))
    expect(at(':root[data-motion="reduce"]')).toBeGreaterThan(
      at("@media (prefers-reduced-motion: reduce)"),
    )
  })

  it("guards the media block so a manual choice beats the system preference", () => {
    expect(sheet).toContain(
      '@media (prefers-color-scheme: dark) {\n  :root:not([data-scheme="light"]) {\n',
    )
    expect(sheet).toContain(':root[data-scheme="dark"] {\n  --canvas: dark-canvas;\n}')
  })

  it("lets a coarse pointer beat the compact density", () => {
    // `:root[data-density]` ties `:root[data-density="compact"]` and comes
    // later, so a finger keeps its target size on a compact page.
    expect(sheet).toContain(
      "@media (pointer: coarse) {\n  :root, :root[data-density] {\n    --control-h: touch-control;\n  }\n}",
    )
  })

  it("declares primitives in schema order", () => {
    expect(at("--scheme-mode:")).toBeLessThan(at("--canvas:"))
    expect(at("--canvas:")).toBeLessThan(at("--sp-0:"))
    expect(at("--sp-0:")).toBeLessThan(at("--focus-ring-offset:"))
  })

  it("carries nothing a style element would escape", () => {
    for (const character of ["`", "<", ">", "&"]) {
      expect(sheet).not.toContain(character)
    }
  })

  it("ends with a single newline", () => {
    expect(sheet.endsWith("}\n")).toBe(true)
  })
})

describe("the view-transition opt-in", () => {
  const optedIn = emitTokensCss(threeAxes, { viewTransitions: "auto" })

  it("is absent by default, leaving the sheet byte-identical", () => {
    expect(sheet).not.toContain("view-transition")
    expect(emitTokensCss(threeAxes, {})).toBe(sheet)
  })

  it("comes last, at the top level, outside every block", () => {
    expect(optedIn.startsWith(sheet.slice(0, -1))).toBe(true)
    expect(optedIn).toContain("\n@view-transition {\n  navigation: auto;\n}\n")
  })

  it("times every transition pseudo-element from tokens the reset zeroes", () => {
    expect(optedIn).toContain(
      "\n::view-transition-group(*),\n::view-transition-old(*),\n::view-transition-new(*) {\n  animation-duration: var(--dur-base);\n  animation-timing-function: var(--ease-in-out-smooth);\n}\n",
    )
    expect(optedIn.slice(sheet.length - 1)).not.toMatch(/\b\d+(\.\d+)?m?s\b|cubic-bezier/)
  })
})

describe("component tokens", () => {
  const themed = defineTheme<"ui-btn-bg">({
    base: { ...fullBase(), "ui-btn-bg": "theme-value" },
  })

  const overridden = emitTokensCss(themed, {
    componentTokens: { "ui-btn-bg": "component-default" },
  })

  it("writes the component default first and the theme value second", () => {
    // Same selector, same specificity: the theme wins on source order alone.
    const defaultAt = overridden.indexOf("--ui-btn-bg: component-default;")
    const themeAt = overridden.indexOf("--ui-btn-bg: theme-value;")

    expect(defaultAt).toBeGreaterThan(-1)
    expect(themeAt).toBeGreaterThan(defaultAt)
    expect(themeAt).toBeLessThan(overridden.indexOf("@layer base {"))
  })

  it("puts a theme's component overrides after its primitives", () => {
    expect(overridden.indexOf("--ui-btn-bg: theme-value;")).toBeGreaterThan(
      overridden.indexOf("--focus-ring-offset:"),
    )
  })

  it("needs none", () => {
    expect(emitTokensCss(threeAxes)).toContain(":root {\n  --scheme-mode:")
  })
})

describe("the variant axes", () => {
  it("omits both when the theme has neither", () => {
    const single = emitTokensCss(defineTheme({ base: fullBase() }))

    expect(single).not.toContain("prefers-color-scheme")
    expect(single).not.toContain("data-scheme")
    expect(single).not.toContain("data-density")
  })

  it("omits an axis a theme declared empty", () => {
    const empty = emitTokensCss(defineTheme({ base: fullBase(), dark: {}, compact: {} }))

    expect(empty).not.toContain("prefers-color-scheme")
    expect(empty).not.toContain("data-density")
  })
})

describe("emitTokensCss", () => {
  it("throws on a value that cannot ship inside a style element", () => {
    // A raw SVG data URL is the realistic case: legal CSS, fatal here.
    const theme = defineTheme({ base: fullBase({ canvas: 'url("data:image/svg+xml,<svg/>")' }) })

    expect(() => emitTokensCss(theme)).toThrow("theme.base: canvas contains <")
  })

  it("throws on an unsafe value in a variant axis", () => {
    const theme = defineTheme({ base: fullBase(), dark: { canvas: "a & b" } })

    expect(() => emitTokensCss(theme)).toThrow("theme.dark: canvas contains &")
  })

  it("throws on an unsafe component token value", () => {
    expect(() =>
      emitTokensCss(defineTheme({ base: fullBase() }), {
        componentTokens: { "ui-btn-bg": "a > b" } as Record<never, string>,
      }),
    ).toThrow("componentTokens: ui-btn-bg contains >")
  })

  it("throws on a key that is neither a primitive nor a component token", () => {
    // The cast is the point: this is the typo the types already refuse, kept
    // loud for a theme built without them.
    const theme = defineTheme({ base: { ...fullBase(), canvass: "oops" } as PrimitiveTokens })

    expect(() => emitTokensCss(theme)).toThrow("theme.base: canvass is neither a primitive name")
  })

  it("throws, listing them, when base is missing primitives", () => {
    const partial = Object.fromEntries(
      Object.entries(fullBase()).filter(([name]) => name !== "canvas"),
    ) as PrimitiveTokens

    expect(() => emitTokensCss(defineTheme({ base: partial }))).toThrow(
      "theme.base is missing 1 primitives: canvas",
    )
  })

  it("reports every problem at once", () => {
    const theme = defineTheme({ base: fullBase({ canvas: "a<b", ink: "a&b" }) })
    const message = (() => {
      try {
        emitTokensCss(theme)

        return ""
      } catch (error) {
        return error instanceof Error ? error.message : ""
      }
    })()

    expect(message).toContain("canvas contains <")
    expect(message).toContain("ink contains &")
  })
})
