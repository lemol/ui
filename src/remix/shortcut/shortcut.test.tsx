import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { stylesOf } from "../../../test/styles.ts"
import { ShortcutDemo } from "./shortcut.demo.tsx"
import { Shortcut } from "./shortcut.tsx"

describe("Shortcut", () => {
  it("draws one cap per key, in the order they are held", async () => {
    const html = await renderToHtml(<Shortcut keys={["⌘", "↵"]} />)
    const caps = [...html.matchAll(/<kbd[^>]*>([^<]*)<\/kbd>/g)].map((match) => match[1])

    expect(caps).toEqual(["⌘", "↵"])
  })

  it("is hidden from assistive technology, which hears the shortcut on its control", async () => {
    expect(await renderToHtml(<Shortcut keys={["Esc"]} />)).toMatch(
      /<span[^>]*aria-hidden="true"[^>]*data-shortcut=""/,
    )
  })

  it("leaves a device with no hover, a touch screen, without the hint", async () => {
    const styles = stylesOf(await renderToHtml(<Shortcut keys={["Esc"]} />))

    expect(styles).toContain("@media (hover: none)")
    expect(styles).toMatch(/@media \(hover: none\)\s*\{[^}]*display:\s*none/)
  })

  it("has a demo that renders", async () => {
    expect(await renderToHtml(<ShortcutDemo />)).toContain("data-shortcut")
  })
})
