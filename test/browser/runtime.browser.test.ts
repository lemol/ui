import { afterAll, expect, test } from "bun:test"
import type { Page } from "playwright"
import { closeHarness, withPage } from "./harness.ts"

afterAll(closeHarness)

/**
 * The URL the page's own import map gives the command runtime.
 *
 * The key is the source mount plus the module path — the playground imports
 * `src/` relatively, so no bare specifier reaches the browser — and the URL
 * it names is what the entry already loaded. An ES module is cached by
 * resolved URL, so importing it reaches the *same* instance, which is what
 * makes a command registered here land in the live table rather than in a
 * second copy of it.
 */
const runtimeUrlOf = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const map = document.querySelector('script[type="importmap"]')?.textContent ?? "{}"
    const parsed = JSON.parse(map) as {
      imports?: Record<string, string>
      scopes?: Record<string, Record<string, string>>
    }
    const tables = [parsed.imports ?? {}, ...Object.values(parsed.scopes ?? {})]
    for (const entries of tables) {
      const url = entries["/src/remix/runtime.ts"]
      if (url !== undefined) return url
    }
    throw new Error("the import map does not name /src/remix/runtime.ts")
  })

test("a registered command reaches its handler through the capture phase", async () => {
  // The listener is registered with `true` because CommandEvent does not
  // bubble: it is dispatched on the element named by commandfor, so a
  // bubble-phase listener on document never fires. Nothing else in the suite
  // can see that — M1 registers no commands — so this is the test that keeps
  // the capture flag honest, and it fails the moment it flips to false.
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/dialog`)
    const runtimeUrl = await runtimeUrlOf(page)

    const seen = await page.evaluate(async (url) => {
      const runtime = (await import(url)) as {
        registerCommand: (
          name: string,
          handler: (context: { source: unknown; target: Element }) => void,
        ) => void
      }
      const received: { sourceId: string; targetId: string }[] = []
      runtime.registerCommand("--probe", ({ source, target }) => {
        received.push({
          sourceId: (source as HTMLElement | null)?.id ?? "",
          targetId: target.id,
        })
      })

      const button = document.createElement("button")
      button.id = "probe-trigger"
      button.setAttribute("command", "--probe")
      button.setAttribute("commandfor", "new-task")
      document.body.append(button)
      button.click()

      return received
    }, runtimeUrl)

    expect(seen).toEqual([{ sourceId: "probe-trigger", targetId: "new-task" }])
  })
})

test("a `--` command fires its handler once under the forced compat shim", async () => {
  // ?compat forces the Invoker Commands backfill on over a native platform
  // (see docs/interactivity.md and compat.ts). A click on a `--` invoker then
  // produces two `command` events on the target — the shim's synthetic one,
  // then the platform's trusted one — because suppressNative cancels the
  // trusted event's *default action*, and for a `--` command the default
  // action is nothing: the runtime is what acts. Without runtime.ts's
  // defaultPrevented guard, and without compat.ts's suppressor running ahead
  // of runtime.ts's own document listener, the handler below would run
  // twice.
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/c/dialog?compat=1`)
    const runtimeUrl = await runtimeUrlOf(page)

    const count = await page.evaluate(async (url) => {
      const runtime = (await import(url)) as {
        registerCommand: (name: string, handler: () => void) => void
      }
      let count = 0
      runtime.registerCommand("--probe-once", () => {
        count += 1
      })

      const button = document.createElement("button")
      button.id = "probe-once-trigger"
      button.setAttribute("command", "--probe-once")
      button.setAttribute("commandfor", "new-task")
      document.body.append(button)
      button.click()

      return count
    }, runtimeUrl)

    expect(count).toBe(1)
  })
})
