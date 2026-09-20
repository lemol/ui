import { afterAll, expect, test } from "bun:test"
import { closeHarness, withPage } from "./harness.ts"

afterAll(closeHarness)

test("the SPA route renders the same components in the browser", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/spa/button`)
    // The fallback is replaced by the routed node on boot; the demo markers
    // are the same ones the server catalogue asserts.
    await page.waitForFunction(`() => document.body.textContent?.includes("size md") === true`)
    expect(
      await page.evaluate<boolean>(`(() => document.body.textContent?.includes("primary"))()`),
    ).toBe(true)
    expect(await page.evaluate<string>(`(() => document.querySelector("h1")?.textContent)()`)).toBe(
      "Button",
    )
  })
})

test("SPA links resolve in the browser without a document load", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/spa`)
    await page.waitForFunction(`() => document.body.textContent?.includes("SPA demo") === true`)
    // A document load would reset this; a frame navigation preserves it.
    await page.evaluate("window.__spaAlive = true")
    await page.getByRole("link", { name: "Button" }).first().click()
    await page.waitForFunction(`() => location.pathname === "/spa/button"`)
    await page.waitForFunction(`() => document.body.textContent?.includes("size md") === true`)
    expect(await page.evaluate<boolean>("window.__spaAlive")).toBe(true)
  })
})

test("an unknown SPA demo is a client-rendered 404", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/spa/nope`)
    await page.waitForFunction(
      `() => document.body.textContent?.includes("No such component") === true`,
    )
  })
})
