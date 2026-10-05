import { afterAll, expect, test } from "bun:test"
import { closeHarness, withPage } from "./harness.ts"

afterAll(closeHarness)

test("typing filters the list, hiding items the query does not match", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/commandPalette`)
    await page.getByRole("button", { name: "Open command palette" }).click()
    await page.waitForFunction(() => document.querySelector("dialog")?.open === true)

    const isHidden = (id: string) =>
      page.evaluate((elementId) => document.getElementById(elementId)?.hidden === true, id)

    // Untouched: every item visible.
    for (const id of ["cmd-new-task", "cmd-new-project", "cmd-settings", "cmd-sign-out"]) {
      expect(await isHidden(id)).toBe(false)
    }

    await page.getByPlaceholder("Type a command…").fill("settings")
    await page.waitForFunction(() => document.getElementById("cmd-new-task")?.hidden === true)
    expect(await isHidden("cmd-settings")).toBe(false)
    expect(await isHidden("cmd-new-task")).toBe(true)
    expect(await isHidden("cmd-new-project")).toBe(true)
    expect(await isHidden("cmd-sign-out")).toBe(true)

    // Clearing the query shows every item again — this is a live filter,
    // not a one-shot narrowing.
    await page.getByPlaceholder("Type a command…").fill("")
    await page.waitForFunction(() => document.getElementById("cmd-new-task")?.hidden === false)

    for (const id of ["cmd-new-task", "cmd-new-project", "cmd-settings", "cmd-sign-out"]) {
      expect(await isHidden(id)).toBe(false)
    }
  })
})

test("keywords are matchable even when absent from the visible label", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/commandPalette`)
    await page.getByRole("button", { name: "Open command palette" }).click()
    await page.waitForFunction(() => document.querySelector("dialog")?.open === true)

    // "Settings" carries keywords="preferences config"; "prefs" appears
    // nowhere in the visible label "Settings" itself.
    await page.getByPlaceholder("Type a command…").fill("pref")
    await page.waitForFunction(() => document.getElementById("cmd-settings")?.hidden === false)
    expect(
      await page.evaluate(() => document.getElementById("cmd-new-task")?.hidden === true),
    ).toBe(true)
  })
})

test("the page is complete with no client javascript: every item carries no hidden attribute", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/commandPalette?nojs`)

    for (const id of ["cmd-new-task", "cmd-new-project", "cmd-settings", "cmd-sign-out"]) {
      expect(
        await page.evaluate((elementId) => document.getElementById(elementId)?.hidden, id),
      ).toBe(false)
    }

    const input = page.getByPlaceholder("Type a command…")

    expect(await input.getAttribute("command")).toBe("--palette")
    expect(await page.locator("script").count()).toBe(0)
  })
})
