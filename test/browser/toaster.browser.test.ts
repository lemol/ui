import { afterAll, expect, test } from "bun:test"
import { closeHarness, withPage } from "./harness.ts"

afterAll(closeHarness)

/**
 * `--dismiss-toast` is registered as a side effect of `toaster.tsx` loading,
 * which `/c/toaster` already does to render `ToasterDemo`. So the probe here
 * needs no dynamic import — unlike `runtime.browser.test.ts`'s generic
 * `--probe`, which has no component of its own to load a handler from —
 * only a fresh popover element and button to invoke `--dismiss-toast` on,
 * with a short duration so the test does not wait out the demo's real one.
 */
test("shows the toast and dismisses it itself, with no DOM polling from the page", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/toaster`)

    await page.evaluate(() => {
      const toastEl = document.createElement("div")

      toastEl.id = "probe-toast"
      toastEl.setAttribute("popover", "manual")
      toastEl.setAttribute("data-ui-toast-duration", "50")
      toastEl.textContent = "Probe"
      document.body.append(toastEl)

      const button = document.createElement("button")

      button.id = "probe-toast-trigger"
      button.setAttribute("command", "--dismiss-toast")
      button.setAttribute("commandfor", "probe-toast")
      document.body.append(button)
    })

    const isOpen = "() => document.getElementById('probe-toast')?.matches(':popover-open') === true"

    expect(await page.evaluate<boolean>(`(${isOpen})()`)).toBe(false)

    await page.locator("#probe-toast-trigger").click()
    await page.waitForFunction(isOpen)

    // Auto-dismissal, not a click: nothing here closes the toast itself, and
    // the timer is `--dismiss-toast`'s own — waitForFunction polls state the
    // test does not own, which is different from the page polling its own
    // DOM the way a hand-rolled interval would.
    await page.waitForFunction(
      "() => document.getElementById('probe-toast')?.matches(':popover-open') === false",
    )
  })
})

test("retriggering before the first timer fires resets it instead of racing it", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/toaster`)

    // A script-called `.click()` does not carry the trusted, user-activated
    // flag Chromium's native invoker-command dispatch requires — as opposed
    // to `Dialog`'s own `command="show-modal"`, this is a custom `--`
    // command, and it never reaches the runtime at all under a synthetic
    // click. `page.locator().click()` drives real input instead, so both
    // clicks here go through Playwright rather than `page.evaluate()`.
    await page.evaluate(() => {
      const toastEl = document.createElement("div")

      toastEl.id = "probe-toast-retrigger"
      toastEl.setAttribute("popover", "manual")
      toastEl.setAttribute("data-ui-toast-duration", "400")
      document.body.append(toastEl)

      const button = document.createElement("button")

      button.id = "probe-toast-retrigger-trigger"
      button.textContent = "Retrigger"
      button.setAttribute("command", "--dismiss-toast")
      button.setAttribute("commandfor", "probe-toast-retrigger")
      document.body.append(button)
    })

    const trigger = page.locator("#probe-toast-retrigger-trigger")

    await trigger.click()
    await page.waitForTimeout(250)
    // Retriggered with 150ms left on the first timer. If both timers were
    // live, the first would fire ~150ms from now regardless of this click.
    await trigger.click()
    await page.waitForTimeout(250)

    // 250ms after the second trigger, on a 400ms duration: still open. A
    // first timer left running would have closed it already, 100ms ago.
    const isOpen =
      "() => document.getElementById('probe-toast-retrigger')?.matches(':popover-open') === true"

    expect(await page.evaluate<boolean>(`(${isOpen})()`)).toBe(true)
  })
})
