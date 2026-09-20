import { describe, expect, it } from "bun:test"
import { installInvokerCommands } from "./compat.ts"

describe("installInvokerCommands", () => {
  it("does nothing where there is no document", () => {
    // Importing this module on the server must not throw: the package is one
    // installable unit, and a server render reaches the barrel. The browser
    // behaviour is covered in test/browser/dialog.browser.test.ts, because a
    // DOM shim here would be testing the shim.
    expect(() => installInvokerCommands()).not.toThrow()
    expect(() => installInvokerCommands({ force: true })).not.toThrow()
  })
})
