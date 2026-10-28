/**
 * The kit's actions: one per step a person takes in the catalogue.
 *
 * Each waits on what the page itself shows, never on a fixed sleep. An
 * assertion throws to fail the step; `expected` says to a reviewer what the
 * screenshot after it should show.
 */
import type { Action } from "@lemol/proof"
import type { Page } from "playwright"
import { type DemoName, demos } from "../src/remix/demos.ts"

/** The document is complete and set in its fonts, so the screenshot after it sees the final raster. */
const settled = async (page: Page): Promise<void> => {
  await page.waitForFunction(() => document.readyState === "complete")
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
}

/** One of the switch forms in mini's header, by the label it carries. */
const switches = (page: Page, label: string) =>
  page.getByRole("banner").locator("form", { hasText: label })

export const openCatalogue: Action = {
  name: "openCatalogue",
  expected: "The catalogue index lists every demo inside mini's shell: header, nav, main, footer",
  run: async (page: Page) => {
    await page.goto("/")
    await settled(page)
    await page.getByRole("banner").getByRole("link", { name: "lemol ui", exact: true }).waitFor()
    await page.locator('nav a[aria-current="page"]', { hasText: "Catalogue" }).waitFor()
    await page.getByRole("main").getByRole("heading", { level: 1 }).waitFor()
    await page.getByRole("contentinfo").waitFor()

    const listed = await page.getByRole("main").locator('a[href^="/c/"]').count()
    const registered = Object.keys(demos).length

    if (listed !== registered) throw new Error(`The index lists ${listed} of ${registered} demos`)
  },
}

/** A component's catalogue page, by its name in the demo registry. */
export const openComponentPage = (name: DemoName): Action => ({
  name: "openComponentPage",
  expected: `/c/${name} renders the ${demos[name].title} demo under its own heading`,
  run: async (page: Page) => {
    await page.goto(`/c/${name}`)
    await settled(page)
    await page
      .getByRole("main")
      .getByRole("heading", { name: demos[name].title, exact: true, level: 1 })
      .waitFor()
  },
})

export const turnScriptsOff: Action = {
  name: "turnScriptsOff",
  expected:
    "The header's Scripts switch reloads the same page as ?nojs, with no <script> left in it",
  run: async (page: Page) => {
    const path = new URL(page.url()).pathname

    await switches(page, "Scripts").getByRole("button", { name: "Off", exact: true }).click()
    await page.waitForURL((url) => url.searchParams.has("nojs"))
    await settled(page)

    if (new URL(page.url()).pathname !== path) throw new Error("The Scripts switch left the page")

    const scripts = await page
      .locator("script")
      .evaluateAll((nodes) => nodes.map((node) => node.outerHTML.slice(0, 120)))

    if (scripts.length > 0) throw new Error(`?nojs still renders ${scripts.join(", ")}`)
  },
}

export const openDialog: Action = {
  name: "openDialog",
  expected: "New task opens the demo's modal <dialog> through command and commandfor alone",
  run: async (page: Page) => {
    const path = new URL(page.url()).pathname
    const trigger = page.getByRole("button", { name: "New task", exact: true })
    const target = await trigger.getAttribute("commandfor")

    if (target === null) throw new Error("New task carries no commandfor")

    await trigger.click()
    await page.waitForFunction(
      (id) => document.getElementById(id)?.matches("dialog[open]:modal") === true,
      target,
    )

    if (new URL(page.url()).pathname !== path) throw new Error("Opening the dialog left the page")

    const drawn = await page.getByRole("dialog").evaluate((dialog) => dialog.clientWidth > 0)

    if (!drawn) throw new Error("The dialog has no drawn panel")
  },
}

export const closeDialog: Action = {
  name: "closeDialog",
  expected: "The dialog's Close button shuts it, leaving the demo page as it was",
  run: async (page: Page) => {
    await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click()
    await page.waitForFunction(() => document.querySelector("dialog")?.open === false)
  },
}

export const switchScheme: Action = {
  name: "switchScheme",
  expected: 'The header\'s Dark switch sets data-scheme="dark" and the page repaints on its canvas',
  run: async (page: Page) => {
    const canvas = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor)

    const before = await canvas()

    await switches(page, "Scheme").getByRole("button", { name: "Dark", exact: true }).click()
    await page.waitForURL((url) => url.searchParams.get("scheme") === "dark")
    await settled(page)

    const scheme = await page.evaluate(() => document.documentElement.dataset.scheme)

    if (scheme !== "dark") throw new Error(`data-scheme is ${String(scheme)}, not dark`)

    const after = await canvas()

    if (after === before) throw new Error(`The canvas stayed ${before} under the dark scheme`)
  },
}
