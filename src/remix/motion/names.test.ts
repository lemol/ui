import { describe, expect, it } from "bun:test"
import { viewTransitionName as exported } from "../index.ts"
import { viewTransitionName } from "./names.ts"

const ident = /^[A-Za-z_][A-Za-z0-9_-]*$/

describe("viewTransitionName", () => {
  it("joins an id and a part with the reserved --", () => {
    expect(viewTransitionName("new-task", "dialog")).toBe("new-task--dialog")
    expect(viewTransitionName("saved")).toBe("saved")
  })

  it("keeps single-dash splits apart", () => {
    expect(viewTransitionName("new", "task-dialog")).not.toBe(
      viewTransitionName("new-task", "dialog"),
    )
    expect(viewTransitionName("a-b", "c")).not.toBe(viewTransitionName("a", "b-c"))
  })

  it("refuses, naming it, what it could not keep unique or valid", () => {
    const refused: ReadonlyArray<readonly [string, string | undefined, string]> = [
      ["a--b", "c", '"a--b"'],
      ["a", "b--c", '"b--c"'],
      ["x--toast", undefined, '"x--toast"'],
      ["", undefined, '""'],
      ["x", "", '""'],
      ["1st", undefined, '"1st"'],
      ["my toast", undefined, '"my toast"'],
      ["none", undefined, '"none"'],
    ]

    for (const [id, part, named] of refused) {
      expect(() => viewTransitionName(id, part)).toThrow(named)
    }
  })

  it("returns a custom-ident for everything it accepts", () => {
    for (const name of [
      viewTransitionName("new-task", "dialog"),
      viewTransitionName("saved"),
      viewTransitionName("_x", "y_2"),
      viewTransitionName("none", "toast"),
    ]) {
      expect(name).toMatch(ident)
    }
  })

  it("ships from the remix entry point", () => {
    expect(exported).toBe(viewTransitionName)
  })
})
