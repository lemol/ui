import { afterAll, expect, test } from "bun:test"
import { closeHarness, withPage } from "./harness.ts"

afterAll(closeHarness)

/**
 * Stubs `navigator.clipboard.writeText` before the click that would call it,
 * so the assertion does not depend on a headless browser's clipboard
 * permission prompt — which `--copy`'s handler neither grants nor needs.
 */
const stubClipboard = (page: import("playwright").Page): Promise<void> =>
  page.evaluate(() => {
    const written: string[] = []

    ;(window as unknown as { written: string[] }).written = written
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: (text: string) => Promise.resolve(void written.push(text)) },
    })
  })

test("copies the literal value and swaps the label, then reverts", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/copyButton`)
    await stubClipboard(page)

    const button = page.getByRole("button", { name: "Copy API key" })

    await button.click()

    expect(await page.evaluate(() => (window as unknown as { written: string[] }).written)).toEqual(
      ["sk_live_4242424242424242"],
    )
    await page.waitForFunction(
      () => document.getElementById("api-key-copy")?.textContent === "Copied!",
    )

    await page.waitForFunction(
      () => document.getElementById("api-key-copy")?.textContent === "Copy API key",
      { timeout: 5000 },
    )
  })
})

test("copies another element's text when pointed at it with `for`", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/copyButton`)
    await stubClipboard(page)

    await page.getByRole("button", { name: "Copy", exact: true }).click()

    expect(await page.evaluate(() => (window as unknown as { written: string[] }).written)).toEqual(
      ["4000 1234 5678 9010"],
    )
  })
})

test("retriggering before the revert resets it instead of racing it", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/copyButton`)
    await stubClipboard(page)

    const button = page.getByRole("button", { name: "Copy API key" })

    await button.click()
    await page.waitForFunction(
      () => document.getElementById("api-key-copy")?.textContent === "Copied!",
    )
    // Second click while still showing the confirmation: the label must not
    // flip back to the original mid-copy, and clicking again still counts
    // as a real copy.
    await button.click()
    expect(await page.evaluate(() => (window as unknown as { written: string[] }).written)).toEqual(
      ["sk_live_4242424242424242", "sk_live_4242424242424242"],
    )
    expect(await page.evaluate(() => document.getElementById("api-key-copy")?.textContent)).toBe(
      "Copied!",
    )
  })
})

test("the page is complete with no client javascript: the button is inert", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/copyButton?nojs`)
    const button = page.getByRole("button", { name: "Copy API key" })

    expect(await button.getAttribute("command")).toBe("--copy")
    expect(await button.getAttribute("commandfor")).toBe("api-key-copy")
    expect(await page.locator("script").count()).toBe(0)
  })
})
