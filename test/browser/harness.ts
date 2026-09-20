import { type Browser, chromium, type Page } from "playwright"
import { createPlaygroundRouter } from "../../apps/playground/app/router.ts"

/**
 * One browser and one server for the whole browser suite.
 *
 * Playwright is used as a library rather than through `@playwright/test`, so
 * `bun test` stays the only runner and `bun run check` the only gate. See
 * docs/superpowers/research/2026-09-19-browser-testing-harness.md.
 *
 * The page is served by the playground's own router, so what the test drives
 * is the real document, the real asset pipeline and the real demo — not a
 * fixture that can agree with a broken component.
 */
let browser: Browser | undefined
let server: ReturnType<typeof Bun.serve> | undefined

const launch = async (): Promise<Browser> => {
  try {
    return await chromium.launch()
  } catch (error) {
    throw new Error(
      `Could not launch Chromium. Run: bunx playwright install chromium\n${String(error)}`,
    )
  }
}

/**
 * Runs `body` against a fresh page. The browser and server start on first use
 * and are closed by `closeHarness()`, which every browser test file calls in
 * its `afterAll`.
 */
export async function withPage(
  body: (page: Page, baseUrl: string) => Promise<void>,
): Promise<void> {
  browser ??= await launch()
  if (server === undefined) {
    const router = createPlaygroundRouter()
    server = Bun.serve({ port: 0, fetch: (request) => router.fetch(request) })
  }
  const page = await browser.newPage()
  try {
    await body(page, `http://localhost:${server.port}`)
  } finally {
    await page.close()
  }
}

export async function closeHarness(): Promise<void> {
  await browser?.close()
  browser = undefined
  server?.stop(true)
  server = undefined
}
