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

const written = (page: import("playwright").Page) =>
  page.evaluate(() => (window as unknown as { written: string[] }).written)

test("copies the literal value, swaps the accessible label, then reverts", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/copyButton`)
    await stubClipboard(page)

    const button = page.locator("#api-key-copy")

    await button.click()
    expect(await written(page)).toEqual(["sk_live_4242424242424242"])
    await page.getByRole("button", { name: "Copied!", exact: true }).waitFor()
    expect(await button.getAttribute("data-copy-confirmed")).not.toBeNull()
    // The check survived the swap: nothing rewrote the button's text.
    expect(await button.locator("svg path").count()).toBe(1)

    await page.getByRole("button", { name: "Copy API key", exact: true }).waitFor({ timeout: 5000 })
    expect(await button.getAttribute("data-copy-confirmed")).toBeNull()
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

    const button = page.locator("#api-key-copy")

    await button.click()
    await page.getByRole("button", { name: "Copied!", exact: true }).waitFor()
    await button.click()
    expect(await written(page)).toEqual(["sk_live_4242424242424242", "sk_live_4242424242424242"])
    expect(await page.getByRole("button", { name: "Copied!", exact: true }).count()).toBe(1)
  })
})

test("swaps a bare invoker's own text, which has no labels to toggle", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/copyButton`)
    await stubClipboard(page)
    await page.evaluate(() =>
      document.body.insertAdjacentHTML(
        "beforeend",
        '<button id="raw" command="--copy" commandfor="raw" data-copy-value="v">Raw</button>',
      ),
    )
    await page.locator("#raw").click()
    await page.waitForFunction(() => document.getElementById("raw")?.textContent === "Copied!")
    expect(await written(page)).toEqual(["v"])
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
