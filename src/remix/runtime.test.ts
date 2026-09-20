import { describe, expect, it } from "bun:test"
import { installCommandRuntime, registerCommand } from "./runtime.ts"

describe("registerCommand", () => {
  it("refuses the same name twice", () => {
    // Two handlers for one command is a silent half-behaviour: whichever
    // registered second either wins or is ignored, and nothing says which.
    registerCommand("--test-once", () => {})
    expect(() => registerCommand("--test-once", () => {})).toThrow("--test-once")
  })

  it("does nothing where there is no document", () => {
    expect(() => installCommandRuntime()).not.toThrow()
  })
})
