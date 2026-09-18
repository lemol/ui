import { describe, expect, it } from "bun:test"
import { groupOf, type PrimitiveName, primitiveNames, schema, tokenGroups } from "./tokens.ts"

describe("schema", () => {
  it("exposes every group", () => {
    expect(tokenGroups).toEqual([
      "color",
      "space",
      "radius",
      "type",
      "motion",
      "sizing",
      "elevation",
    ])
  })

  it("has no empty group", () => {
    for (const group of tokenGroups) expect(schema[group].length).toBeGreaterThan(0)
  })

  it("flattens to the sum of its groups", () => {
    const sum = tokenGroups.reduce((n, group) => n + schema[group].length, 0)
    expect(primitiveNames).toHaveLength(sum)
  })

  it("names no token twice", () => {
    expect(new Set(primitiveNames).size).toBe(primitiveNames.length)
  })
})

describe("groupOf", () => {
  it("round-trips every name to the group it came from", () => {
    for (const group of tokenGroups)
      for (const name of schema[group]) expect(groupOf(name)).toBe(group)
  })

  it("throws on a name that is not in the schema", () => {
    expect(() => groupOf("nope" as PrimitiveName)).toThrow("Unknown primitive token: nope")
  })
})
