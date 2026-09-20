import { describe, expect, it } from "bun:test"
import { debounce } from "./debounce.ts"

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

describe("debounce", () => {
  it("calls fn once the delay has elapsed since the last trigger", async () => {
    let calls = 0
    const debounced = debounce(20, () => {
      calls += 1
    })
    debounced.trigger()
    expect(calls).toBe(0)
    await wait(40)
    expect(calls).toBe(1)
  })

  it("restarts the delay on each trigger, so rapid triggers call fn once", async () => {
    let calls = 0
    const debounced = debounce(20, () => {
      calls += 1
    })
    debounced.trigger()
    await wait(10)
    debounced.trigger()
    await wait(10)
    debounced.trigger()
    // 20ms after the first trigger, well past its own delay, but each
    // retrigger reset the clock — nothing should have fired yet.
    expect(calls).toBe(0)
    await wait(40)
    expect(calls).toBe(1)
  })

  it("never calls fn once cancelled", async () => {
    let calls = 0
    const debounced = debounce(10, () => {
      calls += 1
    })
    debounced.trigger()
    debounced.cancel()
    await wait(30)
    expect(calls).toBe(0)
  })

  it("cancelling twice, or before any trigger, does nothing", () => {
    let calls = 0
    const debounced = debounce(10, () => {
      calls += 1
    })
    expect(() => {
      debounced.cancel()
      debounced.cancel()
    }).not.toThrow()
    expect(calls).toBe(0)
  })
})
