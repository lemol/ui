import { afterAll, expect, test } from "bun:test"
import { closeHarness, withPage } from "./harness.ts"

afterAll(closeHarness)

/** Whether the demo's dialog is open, read from the element rather than from
 * a class or an animation: `open` is the state the platform owns. */
const isOpen = "() => document.querySelector('dialog')?.open === true"

test("the native path opens and closes the dialog", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/dialog`)
    // `page.evaluate()` with a string evaluates that string as an expression
    // rather than calling it — unlike `waitForFunction()` below, which polls
    // by invoking it. The IIFE wrapper is what actually runs the check.
    expect(await page.evaluate<boolean>(`(${isOpen})()`)).toBe(false)

    await page.getByRole("button", { name: "New task" }).click()
    await page.waitForFunction(isOpen)

    await page.getByRole("button", { name: "Close" }).click()
    await page.waitForFunction(`() => document.querySelector('dialog')?.open === false`)
  })
})

test("the shim path does the same with the platform's own invocation suppressed", async () => {
  // Every engine Playwright bundles has Invoker Commands natively, so the
  // backfill is exercised by forcing it on: it cancels the trusted
  // CommandEvent and drives the dialog with its own. Both halves therefore run
  // on one pinned Chromium.
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/dialog?compat=1`)

    // Proves the shim itself is what ran, not the platform's native support
    // agreeing with it by coincidence: `compat.ts` only sets this flag when
    // `force` actually takes the native-has-it early return away.
    expect(
      await page.evaluate<boolean>("window[Symbol.for('@lemol/ui/invoker-commands')] === true"),
    ).toBe(true)

    await page.getByRole("button", { name: "New task" }).click()
    await page.waitForFunction(isOpen)

    // Exactly once: a shim that does not suppress the native invocation would
    // have called showModal() twice, and the second call throws.
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.getByRole("button", { name: "Close" }).click()
    await page.waitForFunction(`() => document.querySelector('dialog')?.open === false`)
    expect(errors).toEqual([])
  })
})

test("the open dialog's accessibility tree is what a screen reader gets", async () => {
  // An ARIA snapshot rather than a screenshot: it is deterministic, it is
  // readable in a failure without opening an image, and it fails when the
  // dialog loses its accessible name — which a pixel diff would not notice.
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/dialog`)
    await page.getByRole("button", { name: "New task" }).click()
    await page.waitForFunction(isOpen)

    expect(await page.locator("dialog").ariaSnapshot()).toContain('heading "New task"')
    expect(await page.locator("dialog").ariaSnapshot()).toContain('button "Close"')
    expect(await page.locator("dialog").ariaSnapshot()).toContain('textbox "Title')
  })
})

test("the page is complete with no client javascript", async () => {
  // ?nojs drops the entry entirely, which is the premise of these packages:
  // the markup is finished before a script runs. The invocation attributes
  // have to be in the document either way.
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/dialog?nojs`)
    const trigger = page.getByRole("button", { name: "New task" })
    expect(await trigger.getAttribute("command")).toBe("show-modal")
    expect(await trigger.getAttribute("commandfor")).toBe("new-task")
    expect(await page.locator("script").count()).toBe(0)
  })
})
