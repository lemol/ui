import { afterAll, expect, test } from "bun:test"
import { closeHarness, withPage } from "./harness.ts"

afterAll(closeHarness)

test("changing the field resubmits the form after the debounce window, with no click", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/liveForm`)

    const navigated = page.waitForURL((url) => url.searchParams.get("role") === "editor")

    await page.getByLabel("Role").selectOption("editor")
    await navigated

    expect(new URL(page.url()).searchParams.get("role")).toBe("editor")
  })
})

test("the page is complete with no client javascript: the field is a plain select in a plain form", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/liveForm?nojs`)
    // liveSubmit() lands on Field's own wrapper, not the <select> itself —
    // the input bridge finds it with closest() from wherever the event
    // actually targets.
    const trigger = page.locator('[command="--live-submit"]')

    expect(await trigger.getAttribute("commandfor")).toBe("live-filter")
    expect(await page.getByLabel("Role").isVisible()).toBe(true)
    expect(await page.locator("script").count()).toBe(0)
  })
})
