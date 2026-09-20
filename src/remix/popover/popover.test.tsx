import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, markupOf, sharedProperties } from "../../../test/styles.ts"
import { popover } from "./popover.tsx"

describe("popover", () => {
  it("binds a trigger to the surface it opens, with one string written once", async () => {
    const Menu = popover("account-menu")
    const markup = markupOf(
      await renderToHtml(
        <>
          <Menu.Trigger>Account</Menu.Trigger>
          <Menu.Surface>Body</Menu.Surface>
        </>,
      ),
    )
    expect(markup).toContain('command="toggle-popover"')
    expect(markup).toContain('commandfor="account-menu"')
    const surfaceTag = /<div[^>]*id="account-menu"[^>]*>/.exec(markup)?.[0] ?? ""
    expect(surfaceTag).toContain('popover="auto"')
  })

  it("exposes the id it minted", () => {
    expect(popover("account-menu").id).toBe("account-menu")
  })

  it("keeps two popovers apart", async () => {
    const First = popover("first")
    const Second = popover("second")
    const markup = markupOf(
      await renderToHtml(
        <>
          <First.Trigger>One</First.Trigger>
          <Second.Trigger>Two</Second.Trigger>
        </>,
      ),
    )
    const targets = [...markup.matchAll(/commandfor="([^"]*)"/g)].map((match) => match[1])
    expect(targets).toEqual(["first", "second"])
  })

  it("renders complete markup with no script", async () => {
    // The no-JS claim: toggling is native command/commandfor plus the
    // platform's own popover behaviour, so nothing here waits for a client
    // module to arrive.
    const Menu = popover("account-menu")
    const html = await renderToHtml(
      <>
        <Menu.Trigger>Account</Menu.Trigger>
        <Menu.Surface>Body</Menu.Surface>
      </>,
    )
    expect(html).not.toContain("<script")
  })

  it("passes a trigger's button props through", async () => {
    const Menu = popover("account-menu")
    const markup = markupOf(
      await renderToHtml(
        <Menu.Trigger disabled tone="primary">
          Account
        </Menu.Trigger>,
      ),
    )
    expect(markup).toContain("disabled")
  })

  it("declares display only in the open state", async () => {
    // Same trap as Dialog's panel: an unconditional `display: grid` renders
    // every popover on the page, open or not.
    const Menu = popover("account-menu")
    const html = await renderToHtml(<Menu.Surface>Body</Menu.Surface>)
    const surfaceBlock = blocksOn(html, "div")[0] ?? ""
    const openBlock = /&:popover-open\s*\{([^}]*)\}/.exec(surfaceBlock)?.[1] ?? ""
    expect(openBlock).toContain("display: grid")
    expect(surfaceBlock.replace(/&:popover-open[^}]*\}/g, "")).not.toContain("display: grid")
  })

  it("declares the transition twice, the second with allow-discrete", async () => {
    const Menu = popover("account-menu")
    const html = await renderToHtml(<Menu.Surface>Body</Menu.Surface>)
    const surfaceBlock = blocksOn(html, "div")[0] ?? ""
    const declarations = [...surfaceBlock.matchAll(/transition:\s*([^;]+);/g)].map(
      (match) => match[1] ?? "",
    )
    expect(declarations).toHaveLength(2)
    expect(declarations[0]).not.toContain("allow-discrete")
    expect(declarations[1]).toContain(
      "overlay var(--ui-popover-transition-duration) allow-discrete",
    )
    expect(declarations[1]).toContain(
      "display var(--ui-popover-transition-duration) allow-discrete",
    )
    for (const declaration of declarations) {
      expect(declaration).not.toMatch(/\d+m?s|cubic-bezier/)
    }
  })

  it("animates from the state being entered, not the resting one", async () => {
    const Menu = popover("account-menu")
    const html = await renderToHtml(<Menu.Surface>Body</Menu.Surface>)
    const surfaceBlock = blocksOn(html, "div")[0] ?? ""
    const startingStyle = /@starting-style\s*\{([\s\S]*?)\n\}/.exec(surfaceBlock)?.[1] ?? ""
    expect(startingStyle).toContain("&:popover-open")
  })

  it("keeps anchor positioning behind @supports, minting one name per popover", async () => {
    const First = popover("first")
    const Second = popover("second")
    const html = await renderToHtml(
      <>
        <First.Trigger>One</First.Trigger>
        <First.Surface>Body one</First.Surface>
        <Second.Trigger>Two</Second.Trigger>
        <Second.Surface>Body two</Second.Surface>
      </>,
    )
    expect(html).toContain("@supports (anchor-name: --a)")
    const triggerBlocks = blocksOn(html, "button")
    const anchorNames = triggerBlocks
      // The line-start anchor excludes the `@supports (anchor-name: --a)`
      // prelude, which contains the same substring mid-line.
      .map((block) => /^\s*anchor-name:\s*([^;]+);/m.exec(block)?.[1]?.trim())
      .filter((name): name is string => name !== undefined)
    expect(new Set(anchorNames).size).toBe(anchorNames.length)
    const surfaceBlocks = blocksOn(html, "div")
    for (const [index, name] of anchorNames.entries()) {
      expect(surfaceBlocks[index] ?? "").toContain(`position-anchor: ${name}`)
    }
  })

  it("keeps the surface's own block disjoint by property", async () => {
    const Menu = popover("account-menu")
    const html = await renderToHtml(<Menu.Surface>Body</Menu.Surface>)
    const blocks = blocksOn(html, "div")
    expect(blocks).toHaveLength(1)
    expect(sharedProperties(blocks)).toEqual([])
  })
})
