import { describe, expect, it } from "bun:test"
import { v } from "./ref.ts"

describe("v", () => {
  it("wraps a primitive name in a custom-property reference", () => {
    expect(v("accent")).toBe("var(--accent)")
    expect(v("sp-4")).toBe("var(--sp-4)")
  })
})
