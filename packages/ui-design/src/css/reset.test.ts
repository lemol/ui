import { describe, expect, it } from "bun:test"
import { headingScale, primitiveNames, schema } from "../tokens.ts"
import { reducedMotionCss, resetCss, unlayeredCss } from "./reset.ts"

const durationNames = schema.motion.filter((name) => name.startsWith("dur-"))

describe("the reset", () => {
  it("keeps every element default inside the base layer", () => {
    expect(resetCss.startsWith("@layer base {")).toBe(true)
    expect(resetCss.endsWith("}")).toBe(true)
    expect(resetCss.slice("@layer base {".length, -1)).not.toContain("@layer")
  })

  it("wires bare elements to tokens at zero specificity", () => {
    for (const selector of [
      ":where(a)",
      ":where(a:visited)",
      ":where(a:hover)",
      ":where(:focus-visible)",
    ]) {
      expect(resetCss).toContain(`${selector} {`)
    }
  })

  it("references only tokens the schema names", () => {
    // A typo here resolves to nothing at all: no error, no warning, no style.
    const referenced = [...resetCss.matchAll(/var\(--([\w-]+)\)/g)].map((match) => match[1] ?? "")
    const names: readonly string[] = primitiveNames
    expect(referenced.length).toBeGreaterThan(0)
    for (const name of referenced) expect(names).toContain(name)
  })

  it("takes color-scheme from a token, so the emitter needs no rule for it", () => {
    expect(resetCss).toContain("color-scheme: var(--scheme-mode);")
  })

  it("spends no literal length or duration", () => {
    expect(resetCss).not.toMatch(/\d+(px|rem|em|ms|s)\b/)
  })

  it("uses no nesting and no child combinator", () => {
    // Both characters are escaped inside a style element, so a nested rule or a
    // child combinator would ship broken.
    expect(resetCss).not.toContain("&")
    expect(resetCss).not.toContain(">")
  })

  it("sizes every bare heading from the scale", () => {
    // Derived from the same map the component's tokens default from, so this
    // fails if either side is edited alone.
    for (const [level, name] of Object.entries(headingScale)) {
      expect(resetCss).toMatch(
        new RegExp(`:where\\(h${level}\\)\\s*\\{[^}]*font-size:\\s*var\\(--${name}\\)`),
      )
    }
  })
})

describe("the unlayered rule", () => {
  it("makes element.hidden beat a component's own display rule", () => {
    expect(unlayeredCss).toContain("[hidden] {\n  display: none !important;\n}")
    expect(unlayeredCss).not.toContain("@layer")
  })
})

describe("the reduced-motion reset", () => {
  it("zeroes every duration the schema names", () => {
    expect(durationNames.length).toBeGreaterThan(0)
    for (const name of durationNames) {
      expect(reducedMotionCss).toContain(`--${name}: 0ms !important;`)
    }
  })

  it("zeroes the durations and nothing else", () => {
    const zeroed = [...reducedMotionCss.matchAll(/--([\w-]+): 0ms/g)].map((match) => match[1] ?? "")
    expect(zeroed).toEqual([...durationNames])
  })

  it("scopes itself to the reduce preference", () => {
    expect(reducedMotionCss.startsWith("@media (prefers-reduced-motion: reduce) {")).toBe(true)
  })
})
