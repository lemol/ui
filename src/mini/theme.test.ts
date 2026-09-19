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

/**
 * sRGB relative luminance, per WCAG 2.1. Local to this file on purpose: the
 * schema forbids a component deriving one colour from another, and an
 * exported contrast helper is an invitation to do it at render time.
 */
const luminance = (hex: string): number => {
  const int = Number.parseInt(hex.slice(1), 16)
  const channels = [(int >> 16) & 255, (int >> 8) & 255, int & 255].map((value) => {
    const srgb = value / 255
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0)
}

const contrast = (a: string, b: string): number => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((high ?? 0) + 0.05) / ((low ?? 0) + 0.05)
}

/** Every tone that names a full set of arms: a fill, an ink, and a subtle. */
const tonesWithSubtle = ["accent", "success", "warning", "danger", "info"] as const

/**
 * AA for normal text. Badge sets fs-xs, so the 3:1 large-text threshold is
 * not available to it, and nothing else reading these pairs is large either.
 */
const aaNormal = 4.5

describe("miniTheme colour contrast", () => {
  const axes = [
    { name: "base", values: miniTheme.base },
    { name: "dark", values: { ...miniTheme.base, ...miniTheme.dark } },
  ] as const

  it("keeps <tone>-ink readable on <tone>", () => {
    // The promise docs/design-system.md has always made. warning has never
    // had a consumer, so this pair has never been looked at.
    const failures = axes.flatMap(({ name, values }) =>
      tonesWithSubtle.flatMap((tone) => {
        const ratio = contrast(values[`${tone}-ink`], values[tone])
        return ratio >= aaNormal ? [] : [`${name}/${tone}: ink on fill is ${ratio.toFixed(2)}`]
      }),
    )
    expect(failures).toEqual([])
  })

  it("keeps <tone> readable on <tone>-subtle", () => {
    // The second promise, named in docs/design-system.md alongside the first
    // because a subtle-filled Badge reads this pair and nothing else.
    const failures = axes.flatMap(({ name, values }) =>
      tonesWithSubtle.flatMap((tone) => {
        const ratio = contrast(values[tone], values[`${tone}-subtle`])
        return ratio >= aaNormal ? [] : [`${name}/${tone}: fill on subtle is ${ratio.toFixed(2)}`]
      }),
    )
    expect(failures).toEqual([])
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
