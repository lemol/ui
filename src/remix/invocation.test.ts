import { describe, expect, it } from "bun:test"
import { type Invocation, invoke } from "./invocation.ts"

describe("invoke", () => {
  it("carries the pair a button needs and nothing else", () => {
    // Destructured, not spread: spreading the branded Invocation into a new
    // object literal would carry the brand's type into the spread's inferred
    // type too, and this assertion is about the two plain fields a consumer
    // reads, not the brand that keeps them from being forged.
    const { command, commandfor } = invoke("show-modal", "new-task")

    expect({ command, commandfor }).toEqual({
      command: "show-modal",
      commandfor: "new-task",
    })
  })

  it("refuses a hand-written pair at compile time", () => {
    // The whole point of the brand. This is a typecheck assertion, not a
    // runtime one: `bun run typecheck` covers test files, so the assertion
    // below fails the gate the day the brand stops working.
    // @ts-expect-error a plain object is not an Invocation
    const forged: Invocation = { command: "show-modal", commandfor: "new-task" }

    expect(forged.commandfor).toBe("new-task")
  })
})
