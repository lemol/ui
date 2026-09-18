import { describe, expect, it } from "bun:test"
import { primitiveNames } from "@lemol/ui-design"
import { componentTokens } from "./tokens.ts"

/**
 * Values a default may be even though they are not a var(). Every entry has to
 * be argued for in review; the list existing is what keeps "just this once"
 * from becoming the norm.
 *
 * - `transparent` keeps a ghost control the same size as a filled one, so a
 *   toolbar does not reflow when a tone changes.
 * - `1px` is a border width, and the schema has no border-width primitive.
 *   Named here rather than written into button.tsx, so a skin can change it.
 */
const allowedLiterals = new Set(["transparent", "1px"])

const primitives = new Set<string>(primitiveNames)
const entries = Object.entries(componentTokens)

describe("the component token aggregate", () => {
  it("holds something", () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  it("prefixes every name with ui- and writes no leading dashes", () => {
    const problems = entries.flatMap(([name]) => {
      if (name.startsWith("--")) return [`${name}: carries its own leading dashes`]
      if (!name.startsWith("ui-")) return [`${name}: is not ui- prefixed`]
      return []
    })
    expect(problems).toEqual([])
  })

  it("defaults every token to a primitive that exists", () => {
    // A var() on an undeclared property resolves to nothing, so a default
    // naming a primitive the schema dropped is invisible until someone looks
    // at the rendered page.
    const problems = entries.flatMap(([name, value]) => {
      if (allowedLiterals.has(value)) return []
      const referenced = /^var\(--([\w-]+)\)$/.exec(value)?.[1]
      if (referenced === undefined) {
        return [`${name}: ${value} is neither var(--primitive) nor an allowed literal`]
      }
      if (!primitives.has(referenced)) {
        return [`${name}: --${referenced} is not a name the schema holds`]
      }
      return []
    })
    expect(problems).toEqual([])
  })

  it("derives no tone from another", () => {
    // A mix ratio inside a component is the same kind of bug as a literal
    // duration: correct today, impossible to retune centrally.
    const problems = entries
      .filter(([, value]) => value.includes("color-mix("))
      .map(([name]) => `${name}: contains color-mix()`)
    expect(problems).toEqual([])
  })
})
