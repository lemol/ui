import { afterAll, expect, test } from "bun:test"
import { closeHarness, withPage } from "./harness.ts"

afterAll(closeHarness)

test("toggling density sets data-density and the key bootScript restores from", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/densityToggle`)
    const root = () => page.evaluate(() => document.documentElement.getAttribute("data-density"))
    const stored = () => page.evaluate(() => localStorage.getItem("lemol-ui:density"))

    expect(await root()).toBeNull()
    await page.getByRole("button", { name: "Compact density" }).click()
    expect(await root()).toBe("compact")
    expect(await stored()).toBe("compact")

    await page.getByRole("button", { name: "Compact density" }).click()
    expect(await root()).toBeNull()
    expect(await stored()).toBeNull()
  })
})

test("a reload restores the toggled density with no flash — bootScript reads the same key back", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/densityToggle`)
    await page.getByRole("button", { name: "Compact density" }).click()
    await page.reload()
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-density"))).toBe(
      "compact",
    )
  })
})

test("toggling scheme resolves the current one and sets the explicit opposite", async () => {
  await withPage(async (page, baseUrl) => {
    await page.emulateMedia({ colorScheme: "light" })
    await page.goto(`${baseUrl}/c/schemeToggle`)
    const root = () => page.evaluate(() => document.documentElement.getAttribute("data-scheme"))

    // Nothing set yet: the page defers to prefers-color-scheme (light, emulated above).
    expect(await root()).toBeNull()
    await page.getByRole("button", { name: "Toggle theme" }).click()
    expect(await root()).toBe("dark")
    await page.getByRole("button", { name: "Toggle theme" }).click()
    expect(await root()).toBe("light")
  })
})

test("a reload restores the toggled scheme with no flash", async () => {
  await withPage(async (page, baseUrl) => {
    await page.emulateMedia({ colorScheme: "light" })
    await page.goto(`${baseUrl}/c/schemeToggle`)
    await page.getByRole("button", { name: "Toggle theme" }).click()
    await page.reload()
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-scheme"))).toBe(
      "dark",
    )
  })
})

test("both toggles are inert with the runtime absent", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/densityToggle?nojs`)
    const button = page.getByRole("button", { name: "Compact density" })

    expect(await button.getAttribute("command")).toBe("--toggle-density")
    expect(await page.locator("script").count()).toBe(0)
  })
})
