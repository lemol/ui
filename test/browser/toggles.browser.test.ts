import { afterAll, expect, test } from "bun:test"
import type { Page } from "playwright"
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

/** Marks the document, so a full navigation — which discards `window` — fails
 *  the assertion that follows rather than passing for the wrong reason. */
const markDocument = (page: Page) => page.evaluate(() => Object.assign(window, { marker: true }))
const sameDocument = (page: Page) =>
  page.evaluate(() => (window as unknown as { marker?: boolean }).marker === true)

const attribute = (page: Page, name: string) =>
  page.evaluate((n) => document.documentElement.getAttribute(n), name)

test("a toggled scheme survives a client-side navigation", async () => {
  await withPage(async (page, baseUrl) => {
    await page.emulateMedia({ colorScheme: "light" })
    await page.goto(`${baseUrl}/c/schemeToggle`)
    await markDocument(page)
    await page.getByRole("button", { name: "Toggle theme" }).click()
    expect(await attribute(page, "data-scheme")).toBe("dark")

    await page.getByRole("link", { name: "Dashboard" }).click()
    await page.waitForFunction(() => document.title.startsWith("Dashboard"))

    expect(await sameDocument(page)).toBe(true)
    expect(await attribute(page, "data-scheme")).toBe("dark")
  })
})

test("a toggled density survives a client-side navigation", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/densityToggle`)
    await markDocument(page)
    await page.getByRole("button", { name: "Compact density" }).click()
    expect(await attribute(page, "data-density")).toBe("compact")

    await page.getByRole("link", { name: "Dashboard" }).click()
    await page.waitForFunction(() => document.title.startsWith("Dashboard"))

    expect(await sameDocument(page)).toBe(true)
    expect(await attribute(page, "data-density")).toBe("compact")
  })
})

test("a server-chosen scheme beats the one the previous page carried", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/schemeToggle?scheme=dark`)
    expect(await attribute(page, "data-scheme")).toBe("dark")
    await page.evaluate(() => {
      const link = document.createElement("a")

      link.href = "/pages/dashboard?scheme=light"
      link.id = "to-light"
      link.textContent = "to light"
      document.body.append(link)
    })
    await markDocument(page)
    await page.locator("#to-light").click()
    await page.waitForFunction(() => document.title.startsWith("Dashboard"))

    expect(await sameDocument(page)).toBe(true)
    expect(await attribute(page, "data-scheme")).toBe("light")
  })
})

test("switching the scheme back to system leaves no data-scheme", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/schemeToggle?scheme=dark`)
    expect(await attribute(page, "data-scheme")).toBe("dark")

    await page.getByRole("button", { name: "System", exact: true }).click()
    await page.waitForURL("**scheme=system**")
    await page.waitForLoadState("load")

    expect(await attribute(page, "data-scheme")).toBeNull()
  })
})
