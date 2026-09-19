import { describe, expect, it } from "bun:test"
import {
  groupOf,
  headingScale,
  type PrimitiveName,
  primitiveNames,
  schema,
  tokenGroups,
} from "./tokens.ts"

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

  it("names a maximum width for an overlay panel", () => {
    // Dialog is the first component to need a panel width, and page-max is a
    // page container rather than a panel. A component token must default to a
    // primitive, so a size the schema cannot name is the schema's gap, not a
    // licence for a literal in the component.
    expect(schema.sizing).toContain("overlay-max")
  })

  it("gives every interactive colour a hover value, and no status colour one", () => {
    // accent, link and danger are the colours something hovers. success,
    // warning and info are read on static elements — Badge, not Button — so
    // they get no hover value until something needs one. Deriving one inside a
    // component is what design-system.md forbids.
    const interactive = ["accent", "link", "danger"]
    const status = ["success", "warning", "info"]
    const colors = schema.color as readonly string[]

    expect(interactive.filter((name) => !colors.includes(`${name}-hover`))).toEqual([])
    expect(status.filter((name) => colors.includes(`${name}-hover`))).toEqual([])
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

describe("the heading scale", () => {
  it("covers h1 through h6 and nothing else", () => {
    expect(Object.keys(headingScale)).toEqual(["1", "2", "3", "4", "5", "6"])
  })

  it("names only sizes the type group holds", () => {
    // A name the schema dropped would resolve to nothing: no error, no style.
    const sizes: readonly string[] = schema.type
    for (const name of Object.values(headingScale)) expect(sizes).toContain(name)
  })

  it("gives each level a size of its own", () => {
    // Two levels on one step is a scale with a rung missing, and it reads as a
    // heading that did not change when the level did.
    expect(new Set(Object.values(headingScale)).size).toBe(6)
  })

  it("descends", () => {
    // The order the type group declares its sizes in is the order the scale
    // walks, so h1 is the largest without this file knowing any value.
    const order: readonly string[] = schema.type
    const positions = Object.values(headingScale).map((name) => order.indexOf(name))
    expect(positions).toEqual([...positions].sort((a, b) => b - a))
  })
})
