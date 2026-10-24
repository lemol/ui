import { describe, expect, it } from "bun:test"
import { css as remixCss } from "remix/component"
import { renderToHtml } from "../../test/render.ts"
import { Button } from "./button/button.tsx"
import { componentStyles, css } from "./css.ts"
import { FacetFilter } from "./facet-filter/facet-filter.tsx"

/** The style blocks a render emits, by the class each names. */
const blocks = (html: string): ReadonlyArray<string> =>
  [...html.matchAll(/<style data-rmx-style="([^"]+)">/g)].map((match) => match[1] ?? "")

/** What a host's sheet would hold: every recorded style, rendered once. */
const sheet = async (): Promise<ReadonlySet<string>> =>
  new Set(
    blocks(
      await renderToHtml(
        <div>
          {componentStyles().map((styles, index) => (
            <i key={index} mix={remixCss(styles)} />
          ))}
        </div>,
      ),
    ),
  )

describe("componentStyles", () => {
  it("holds every block a component draws, so a host's sheet can drop the inline copies", async () => {
    const held = await sheet()
    const drawn = blocks(
      await renderToHtml(
        <div>
          <Button tone="primary">Save</Button>
          <Button size="sm" tone="neutral">
            Cancel
          </Button>
          <FacetFilter
            label="Status"
            name="status"
            options={[{ value: "open", label: "Open", href: "/?status=open", selected: true }]}
          />
        </div>,
      ),
    )

    expect(drawn.length).toBeGreaterThan(3)
    expect(drawn.filter((block) => !held.has(block))).toEqual([])
  })

  it("keeps nothing built after the library loaded, as a render's style is", async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
    const before = componentStyles().length

    css({ color: "var(--ui-test-only)" })

    expect(componentStyles().length).toBe(before)
  })

  // workerd throws on a timer armed at module scope, and a Worker that renders
  // these components must still load. The query asks Bun for a fresh copy.
  it("still loads, and still stops recording, where module scope may arm no timer", async () => {
    const setTimer = globalThis.setTimeout
    const path = "./css.ts?timers-refused"

    globalThis.setTimeout = (() => {
      throw new Error("Disallowed operation called within global scope")
    }) as unknown as typeof setTimeout

    let fresh: typeof import("./css.ts")

    try {
      fresh = await import(path)
    } finally {
      globalThis.setTimeout = setTimer
    }

    await Promise.resolve()
    fresh.css({ color: "var(--ui-test-only)" })

    expect(fresh.componentStyles()).toEqual([])
  })
})
