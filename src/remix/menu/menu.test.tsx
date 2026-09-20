import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, markupOf, sharedProperties, stylesOf, valuesOf } from "../../../test/styles.ts"
import { MenuItem, MenuSeparator, menu } from "./menu.tsx"
import { menuTokens } from "./tokens.ts"

/** Structural keywords Menu's own blocks may carry instead of a token. */
const keywords = new Set([
  "grid",
  "flex",
  "center",
  "100%",
  "none",
  "transparent",
  "start",
  "inherit",
  "pointer",
  "not-allowed",
  "solid",
  "1px",
])

describe("menu", () => {
  it("binds a trigger to a role=menu surface, with one string written once", async () => {
    const View = menu("view-menu")
    const markup = markupOf(
      await renderToHtml(
        <>
          <View.Trigger>View</View.Trigger>
          <View.List>
            <MenuItem href="#a">A</MenuItem>
          </View.List>
        </>,
      ),
    )
    expect(markup).toContain('command="toggle-popover"')
    expect(markup).toContain('commandfor="view-menu"')
    expect(markup).toContain('role="menu"')
  })

  it("exposes the id it minted, matching the underlying popover", () => {
    expect(menu("view-menu").id).toBe("view-menu")
  })

  it("renders complete, clickable markup with no script", async () => {
    const View = menu("view-menu")
    const html = await renderToHtml(
      <>
        <View.Trigger>View</View.Trigger>
        <View.List>
          <MenuItem href="#a">A</MenuItem>
          <MenuItem>B</MenuItem>
        </View.List>
      </>,
    )
    expect(html).not.toContain("<script")
    const markup = markupOf(html)
    expect(markup).toContain('href="#a"')
    expect(markup).toContain("<button")
  })

  it("renders a link item as an anchor and a bare item as a button, both role=menuitem", async () => {
    const markup = markupOf(
      await renderToHtml(
        <>
          <MenuItem href="#a">Link item</MenuItem>
          <MenuItem>Button item</MenuItem>
        </>,
      ),
    )
    expect(markup).toContain('<a href="#a"')
    expect(markup).toContain("<button")
    expect([...markup.matchAll(/role="menuitem"/g)]).toHaveLength(2)
  })

  it("disables a button item without breaking a link item", async () => {
    const markup = markupOf(await renderToHtml(<MenuItem disabled>Zoom in</MenuItem>))
    expect(markup).toContain("disabled")
  })

  it("renders a separator", async () => {
    // <hr>'s role is separator implicitly; an explicit one is redundant.
    const markup = markupOf(await renderToHtml(<MenuSeparator />))
    expect(markup).toContain("<hr")
  })

  it("reads only its own tokens and structural keywords", async () => {
    const html = await renderToHtml(
      <>
        <MenuItem href="#a">A</MenuItem>
        <MenuItem disabled>B</MenuItem>
        <MenuSeparator />
      </>,
    )
    const styles = stylesOf(html)
    const offenders = valuesOf(styles).filter(
      (value) => !keywords.has(value) && !/^var\(--ui-menu-[\w-]+\)$/.test(value),
    )
    expect(offenders).toEqual([])
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    const View = menu("view-menu")
    const html = await renderToHtml(
      <>
        <View.Trigger>View</View.Trigger>
        <View.List>
          <MenuItem href="#a">A</MenuItem>
          <MenuItem disabled>B</MenuItem>
          <MenuSeparator />
        </View.List>
      </>,
    )
    const read = new Set(
      [...stylesOf(html).matchAll(/var\(--(ui-menu-[\w-]+)\)/g)].map((match) => match[1] ?? ""),
    )
    expect([...read].sort()).toEqual(Object.keys(menuTokens).sort())
  })

  it("keeps the item and separator blocks disjoint by property", async () => {
    const html = await renderToHtml(
      <>
        <MenuItem href="#a">A</MenuItem>
        <MenuSeparator />
      </>,
    )
    for (const tag of ["a", "hr"]) {
      const blocks = blocksOn(html, tag)
      expect(blocks.length).toBeGreaterThan(0)
      expect(sharedProperties(blocks)).toEqual([])
    }
  })
})
