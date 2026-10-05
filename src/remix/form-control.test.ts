import { describe, expect, it } from "bun:test"
import { fieldMessages } from "./form-control.ts"

describe("fieldMessages", () => {
  it("names both ids from the stem, regardless of whether they render", () => {
    const messages = fieldMessages("newsletter", undefined, undefined)

    expect(messages.hintId).toBe("newsletter-hint")
    expect(messages.errorId).toBe("newsletter-error")
  })

  it("has neither hint nor error, and no describedBy, when both are absent", () => {
    const messages = fieldMessages("newsletter", undefined, undefined)

    expect(messages.hasHint).toBe(false)
    expect(messages.hasError).toBe(false)
    expect(messages.describedBy).toBeUndefined()
    expect(messages.invalid).toBeUndefined()
  })

  it("treats an empty string the same as absent", () => {
    const messages = fieldMessages("newsletter", "", "")

    expect(messages.hasHint).toBe(false)
    expect(messages.hasError).toBe(false)
    expect(messages.describedBy).toBeUndefined()
  })

  it("describes by the hint alone when only a hint is given", () => {
    const messages = fieldMessages("newsletter", "Weekly digest", undefined)

    expect(messages.describedBy).toBe("newsletter-hint")
  })

  it("describes by the error alone, and marks invalid, when only an error is given", () => {
    const messages = fieldMessages("newsletter", undefined, "Required")

    expect(messages.describedBy).toBe("newsletter-error")
    expect(messages.invalid).toBe("true")
  })

  it("describes by both, hint first, when both are given", () => {
    const messages = fieldMessages("newsletter", "Weekly digest", "Required")

    expect(messages.describedBy).toBe("newsletter-hint newsletter-error")
  })
})
