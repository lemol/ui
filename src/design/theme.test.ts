import { describe, expect, it } from "bun:test"
import { defineTheme, extendTheme } from "./theme.ts"
import { type PrimitiveTokens, primitiveNames } from "./tokens.ts"

const base = Object.fromEntries(primitiveNames.map((name) => [name, "initial"])) as PrimitiveTokens

describe("defineTheme", () => {
  it("leaves dark and compact undefined when they are omitted", () => {
    const theme = defineTheme({ base })
    expect(theme.dark).toBeUndefined()
    expect(theme.compact).toBeUndefined()
  })

  it("freezes every axis it returns", () => {
    const theme = defineTheme({ base, dark: { canvas: "#000" } })
    expect(Object.isFrozen(theme)).toBe(true)
    expect(Object.isFrozen(theme.base)).toBe(true)
    expect(Object.isFrozen(theme.dark)).toBe(true)
  })
})

describe("extendTheme", () => {
  it("merges base and leaves the original untouched", () => {
    const theme = defineTheme({ base })
    const next = extendTheme(theme, { base: { canvas: "#FBFBFA" } })
    expect(next.base.canvas).toBe("#FBFBFA")
    expect(next.base.ink).toBe("initial")
    expect(theme.base.canvas).toBe("initial")
  })

  it("keeps an axis the overrides do not mention", () => {
    const theme = defineTheme({ base, dark: { canvas: "#191919" } })
    const next = extendTheme(theme, { compact: { "row-h": "32px" } })
    expect(next.dark?.canvas).toBe("#191919")
    expect(next.compact?.["row-h"]).toBe("32px")
  })

  it("adds an axis the original theme did not have", () => {
    const theme = defineTheme({ base })
    const next = extendTheme(theme, { dark: { canvas: "#191919" } })
    expect(next.dark?.canvas).toBe("#191919")
    expect(theme.dark).toBeUndefined()
  })
})

type Comp = "ui-btn-primary-bg"

// A theme omitting `dark` typechecks -- task 10's stated "done when".
export const noDark = defineTheme({ base })

// Component tokens are accepted once the seam is supplied.
export const wired = defineTheme<Comp>({
  base: { ...base, "ui-btn-primary-bg": "var(--accent)" },
  dark: { "ui-btn-primary-bg": "var(--accent-hover)" },
})

// @ts-expect-error - `base` must carry every primitive
export const missing = defineTheme({ base: { canvas: "#fff" } })

// @ts-expect-error - `nope` is neither a primitive nor a component token
export const unknownKey = defineTheme({ base, dark: { nope: "x" } })

// @ts-expect-error - a typo'd component token is rejected once C is supplied
export const typoedComponentToken = defineTheme<Comp>({ base, dark: { "ui-btn-primry-bg": "x" } })
