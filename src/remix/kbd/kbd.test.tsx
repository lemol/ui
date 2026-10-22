import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { stylesOf, valuesOf } from "../../../test/styles.ts"
import { KbdDemo } from "./kbd.demo.tsx"
import { Kbd } from "./kbd.tsx"
import { kbdTokens } from "./tokens.ts"

/** Structural keywords Kbd declares; nothing here is a colour or a length. */
const keywords = new Set(["inline-flex", "center", "solid", "inherit", "nowrap"])

describe("Kbd", () => {
  it("renders a native kbd carrying the key", async () => {
    const html = await renderToHtml(<Kbd>Esc</Kbd>)

    expect(html).toMatch(/<kbd[^>]*>Esc<\/kbd>/)
  })

  it("reads only its own tokens and structural keywords", async () => {
    const styles = stylesOf(await renderToHtml(<Kbd>K</Kbd>))
    const offenders = valuesOf(styles).filter(
      (value) => !keywords.has(value) && !/^var\(--ui-kbd-[\w-]+\)$/.test(value),
    )

    expect(offenders).toEqual([])
  })

  it("declares no minimum width, which its own padding would always exceed", async () => {
    // The cap is its padding either side of the key, so a minimum of one pad
    // never bound, and a minimum Kbd declares is one a caller's `mix` cannot set.
    expect(stylesOf(await renderToHtml(<Kbd>K</Kbd>))).not.toContain("min-inline-size")
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    const styles = stylesOf(await renderToHtml(<Kbd>K</Kbd>))
    const read = new Set([...styles.matchAll(/var\(--(ui-kbd-[\w-]+)\)/g)].map((m) => m[1]))

    expect([...read].sort()).toEqual(Object.keys(kbdTokens).sort())
  })

  it("has a demo that renders", async () => {
    expect(await renderToHtml(<KbdDemo />)).toContain("<kbd")
  })
})
