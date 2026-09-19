import { describe, expect, it } from "bun:test"
import { emitTokensCss } from "../design/css/index.ts"
import { extendTheme, primitiveNames, schema } from "../design/index.ts"
import { type ComponentTokenName, componentTokens } from "../remix/index.ts"
import { miniTheme } from "./theme.ts"

describe("miniTheme", () => {
  it("supplies every primitive the schema names", () => {
    // emitTokensCss throws on a missing primitive, but the message lists them
    // and this failure names them without rendering anything.
    const missing = primitiveNames.filter((name) => !(name in miniTheme.base))
    expect(missing).toEqual([])
  })

  it("keeps sp-N at N four-pixel units", () => {
    // design-system.md: the multiplier is not enforced by the compiler,
    // because the schema holds no values. It is checked here, in the package
    // that supplies them.
    const wrong = schema.space.flatMap((name) => {
      const multiplier = Number(name.slice("sp-".length))
      const expected = `${multiplier * 4}px`
      const actual = miniTheme.base[name]
      return actual === expected ? [] : [`${name}: ${actual} is not ${expected}`]
    })
    expect(wrong).toEqual([])
  })

  it("sets scheme-mode in both schemes, or the page pairs dark with light chrome", () => {
    expect(miniTheme.base["scheme-mode"]).toBe("light")
    expect(miniTheme.dark?.["scheme-mode"]).toBe("dark")
  })

  it("swaps exactly the four density tokens", () => {
    expect(Object.keys(miniTheme.compact ?? {}).sort()).toEqual([
      "control-h",
      "control-h-sm",
      "row-h",
      "row-pad-y",
    ])
  })

  it("retunes the dark axis rather than reusing light shadows", () => {
    // A shadow tuned for a light canvas disappears on a dark one.
    expect(miniTheme.dark?.["shadow-md"]).not.toBe(miniTheme.base["shadow-md"])
  })

  it("emits without the emitter rejecting a value", () => {
    expect(() => emitTokensCss(miniTheme, { componentTokens })).not.toThrow()
  })
})

describe("a skin is a set of token values", () => {
  it("takes a gradient for a tone background, with no component edit", () => {
    // The second "done when" of the task. The component reads `background`
    // and not background-color precisely so this value is legal.
    const gradient = "linear-gradient(180deg, #2FA08C, #1F6B5C 65%, #17554A)"
    const skinned = extendTheme(miniTheme, {
      base: {
        // Literal key, not a spread: see theme.ts for why that matters.
        "ui-btn-primary-bg": gradient,
      },
    })
    const sheet = emitTokensCss(skinned, { componentTokens })

    expect(sheet).toContain(`--ui-btn-primary-bg: ${gradient};`)
    // Component default first, theme value second, same selector, same
    // specificity: later wins.
    expect(sheet.indexOf("--ui-btn-primary-bg: var(--accent);")).toBeLessThan(
      sheet.indexOf(`--ui-btn-primary-bg: ${gradient};`),
    )
  })

  it("fails the typecheck on a token name ui-remix does not declare", () => {
    // The first "done when", asserted at the type level. The inversion is the
    // point: if excess property checking ever stops reaching this object, the
    // directive below goes unused and tsc fails with TS2578 — so the proof
    // cannot rot silently.
    const wrong = extendTheme(miniTheme, {
      // @ts-expect-error - ui-btn-primary-background is not a token ui-remix declares
      base: { "ui-btn-primary-background": "red" },
    })

    // At runtime the bogus name passes straight through and would emit a
    // custom property no component reads — which is why the type layer has to
    // be the thing that catches it. `tsc` is the real assertion here; this one
    // records what happens when it does not run.
    expect(wrong.base["ui-btn-primary-background" as ComponentTokenName]).toBe("red")
  })
})
