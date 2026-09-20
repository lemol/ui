import { afterAll, expect, test } from "bun:test"
import type { Page } from "playwright"
import { closeHarness, withPage } from "./harness.ts"

afterAll(closeHarness)

/** Whether the demo's dialog is open, read from the element rather than from
 * a class or an animation: `open` is the state the platform owns. */
const isOpen = "() => document.querySelector('dialog')?.open === true"

/**
 * One `command` event as the probe installed below observes it.
 *
 * `isTrusted` distinguishes the platform's own `CommandEvent` from the
 * shim's synthetic one; `defaultPrevented` shows whether the shim's
 * `suppressNative` listener already cancelled it by the time the probe runs.
 */
interface SeenCommand {
  trusted: boolean
  prevented: boolean
}

/**
 * Installs a capturing `command` listener on `document`, run via
 * `page.evaluate` — not `addInitScript` — so it registers *after* the
 * shim's own listener from `compat.ts`, which runs as the page's module
 * script executes. Listeners on the same node in the same phase fire in
 * registration order, so this probe is a behavioural discriminator: it sees
 * whatever the shim already did to the event before the probe's turn.
 */
const installCommandProbe = (page: Page): Promise<void> =>
  page.evaluate(() => {
    const seen: { trusted: boolean; prevented: boolean }[] = []
    ;(window as unknown as { seen: typeof seen }).seen = seen
    document.addEventListener(
      "command",
      (event) => {
        seen.push({ trusted: event.isTrusted, prevented: event.defaultPrevented })
      },
      true,
    )
  })

const readCommandProbe = (page: Page): Promise<SeenCommand[]> =>
  page.evaluate<SeenCommand[]>("window.seen")

test("the native path opens and closes the dialog", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/dialog`)
    // Installed before the first click so it is listening during every
    // action in the test, the same discriminator the shim test below uses.
    await installCommandProbe(page)
    // `page.evaluate()` with a string evaluates that string as an expression
    // rather than calling it — unlike `waitForFunction()` below, which polls
    // by invoking it. The IIFE wrapper is what actually runs the check.
    expect(await page.evaluate<boolean>(`(${isOpen})()`)).toBe(false)

    await page.getByRole("button", { name: "New task" }).click()
    await page.waitForFunction(isOpen)

    // The complement to the shim test's assertion: on a native platform
    // there is exactly one `command` event, it is trusted, and nothing here
    // ever cancels it. Together the two tests prove the discriminator means
    // something — a probe that always saw the same shape either way would
    // not distinguish the shim from the platform.
    expect(await readCommandProbe(page)).toEqual([{ trusted: true, prevented: false }])

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
    // Registered immediately after navigation, before the first click, so it
    // is listening during every action below — including the click whose
    // double-invocation the error-count assertion further down depends on.
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))

    await page.goto(`${baseUrl}/c/dialog?compat=1`)

    // Proves the shim itself is what ran, not the platform's native support
    // agreeing with it by coincidence: the shim cancels the platform's own
    // trusted `CommandEvent` from its capturing listener on `document`
    // before dispatching its own synthetic one. A probe registered after the
    // shim's listener sees the trusted event already cancelled and the
    // synthetic one not — a platform running unshimmed never produces that
    // shape (see the native test's complement above).
    await installCommandProbe(page)

    await page.getByRole("button", { name: "New task" }).click()
    await page.waitForFunction(isOpen)

    expect(await readCommandProbe(page)).toEqual([
      { trusted: false, prevented: false },
      { trusted: true, prevented: true },
    ])

    // Exactly once: a shim that does not suppress the native invocation would
    // have called showModal() twice, and the second call throws.
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
