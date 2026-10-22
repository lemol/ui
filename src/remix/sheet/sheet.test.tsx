import { describe, expect, it } from "bun:test"
import { css } from "remix/component"
import { renderToHtml } from "../../../test/render.ts"
import { stylesOf } from "../../../test/styles.ts"
import { popover } from "../popover/popover.tsx"
import { sheetBreakpoint, sheetMedia, sheetRules } from "./sheet.ts"
import { sheetTokens } from "./tokens.ts"

const rendered = async (open: string) =>
  stylesOf(await renderToHtml(<div mix={css({ [sheetMedia]: sheetRules(open, "var(--sp-4)") })} />))

describe("the sheet", () => {
  it("applies under its breakpoint only", () => {
    expect(sheetMedia).toBe(`@media (width < ${sheetBreakpoint})`)
  })

  it("docks to the bottom edge at the screen's width, clear of the home indicator", async () => {
    const styles = await rendered("&[open]")

    expect(styles).toContain("position: fixed")
    expect(styles).toContain("inset-block: auto 0")
    expect(styles).toContain("inline-size: 100%")
    expect(styles).toContain("padding-block-end: calc(var(--sp-4) + env(safe-area-inset-bottom))")
  })

  it("slides its own height in from below, open state and entry both", async () => {
    const styles = await rendered("&:popover-open")

    expect(styles).toContain("translate: 0 100%")
    expect(styles).toMatch(/&:popover-open\s*\{\s*translate: 0;/)
    expect(styles).toMatch(/@starting-style[\s\S]*&:popover-open\s*\{\s*translate: 0 100%;/)
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    const styles = await rendered("&[open]")
    const read = new Set([...styles.matchAll(/var\(--(ui-sheet-[\w-]+)\)/g)].map((m) => m[1]))

    expect([...read].sort()).toEqual(Object.keys(sheetTokens).sort())
  })
})

describe("a popover minted as a sheet", () => {
  it("marks its surface and docks it on a narrow screen", async () => {
    const Sheet = popover("actions", { sheet: true })
    const html = await renderToHtml(<Sheet.Surface>…</Sheet.Surface>)

    expect(html).toMatch(/<div data-sheet="" id="actions"[^>]*popover="auto"/)
    expect(stylesOf(html)).toContain(sheetMedia)
  })

  it("stays a popover anchored to its trigger when not asked", async () => {
    const Plain = popover("note")
    const html = await renderToHtml(<Plain.Surface>…</Plain.Surface>)

    expect(html).not.toContain("data-sheet")
    expect(stylesOf(html)).not.toContain(sheetMedia)
  })
})
