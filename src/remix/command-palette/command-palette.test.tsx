import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { markupOf, stylesOf, valuesOf } from "../../../test/styles.ts"
import { CommandPaletteInput, CommandPaletteItem, CommandPaletteList } from "./command-palette.tsx"
import { commandPaletteTokens } from "./tokens.ts"

const keywords = new Set([
  "100%",
  "solid",
  "grid",
  "0",
  "none",
  "block",
  "transparent",
  "start",
  "inherit",
  "pointer",
])

describe("CommandPaletteInput", () => {
  it("carries command/commandfor pointed at the list, invoked by typing", async () => {
    const markup = markupOf(await renderToHtml(<CommandPaletteInput listId="palette-list" />))

    expect(markup).toContain('command="--palette"')
    expect(markup).toContain('commandfor="palette-list"')
    expect(markup).toContain('aria-controls="palette-list"')
  })

  it("renders complete markup with no script", async () => {
    const html = await renderToHtml(<CommandPaletteInput listId="palette-list" />)

    expect(html).not.toContain("<script")
  })
})

describe("CommandPaletteList and CommandPaletteItem", () => {
  it("renders every item visible, with no hidden attribute", async () => {
    const markup = markupOf(
      await renderToHtml(
        <CommandPaletteList id="palette-list">
          <CommandPaletteItem href="#a" id="a" label="A" />
          <CommandPaletteItem id="b" label="B" />
        </CommandPaletteList>,
      ),
    )

    expect(markup).not.toContain("hidden")
    expect(markup).toContain('id="a"')
    expect(markup).toContain('id="b"')
  })

  it("carries its label (and keywords, when given) as data attributes for --palette to read", async () => {
    const markup = markupOf(
      await renderToHtml(
        <CommandPaletteItem id="settings" keywords="preferences config" label="Settings" />,
      ),
    )

    expect(markup).toContain('data-palette-label="Settings"')
    expect(markup).toContain('data-palette-keywords="preferences config"')
  })

  it("renders a link item as an anchor and a bare item as a button", async () => {
    const markup = markupOf(
      await renderToHtml(
        <>
          <CommandPaletteItem href="#a" id="a" label="Link item" />
          <CommandPaletteItem id="b" label="Button item" />
        </>,
      ),
    )

    expect(markup).toContain('<a href="#a"')
    expect(markup).toContain("<button")
  })

  it("shows custom children instead of the bare label when given", async () => {
    const markup = markupOf(
      await renderToHtml(
        <CommandPaletteItem id="a" label="A">
          <strong>A</strong>, styled
        </CommandPaletteItem>,
      ),
    )

    expect(markup).toContain("<strong>A</strong>")
  })
})

describe("the token contract", () => {
  it("reads only its own tokens and structural keywords", async () => {
    const html = await renderToHtml(
      <>
        <CommandPaletteInput listId="palette-list" />
        <CommandPaletteList id="palette-list">
          <CommandPaletteItem href="#a" id="a" label="A" />
        </CommandPaletteList>
      </>,
    )

    const offenders = valuesOf(stylesOf(html)).filter(
      (value) => !keywords.has(value) && !/^var\(--ui-palette-[\w-]+\)$/.test(value),
    )

    expect(offenders).toEqual([])
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    const html = await renderToHtml(
      <>
        <CommandPaletteInput listId="palette-list" />
        <CommandPaletteList id="palette-list">
          <CommandPaletteItem href="#a" id="a" label="A" />
        </CommandPaletteList>
      </>,
    )

    const read = new Set(
      [...stylesOf(html).matchAll(/var\(--(ui-palette-[\w-]+)\)/g)].map((match) => match[1] ?? ""),
    )

    expect([...read].sort()).toEqual(Object.keys(commandPaletteTokens).sort())
  })
})
