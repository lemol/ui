import { describe, expect, it } from "bun:test"
import { css } from "remix/component"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, markupOf, stylesOf, valuesOf } from "../../../test/styles.ts"
import { AppBarDemo } from "./app-bar.demo.tsx"
import { appBarBreakpoint, appBarMedia, appBarParts } from "./app-bar.ts"
import { AppBar } from "./app-bar.tsx"
import { appBarTokens } from "./tokens.ts"

/** Structural keywords AppBar declares: layout, grid areas and the safe area, no colour or size. */
const keywords = new Set([
  "sticky",
  "0",
  "1",
  "grid",
  "auto minmax(0, 1fr) auto auto auto",
  '"back title status controls actions" "back subtitle status controls actions"',
  "auto minmax(0, 1fr) auto auto",
  '"back title title actions" "back subtitle subtitle actions" "status status controls controls"',
  "center",
  "back",
  "title",
  "subtitle",
  "status",
  "controls",
  "actions",
  "inline-grid",
  "none",
  "anywhere",
  "balance",
  "-webkit-box",
  "vertical",
  "2",
  "hidden",
  "flex",
  "start",
  "end",
  "100%",
  "block",
  "nowrap",
  "ellipsis",
  "transparent",
  "env(safe-area-inset-top)",
  "calc(var(--ui-appbar-back-inset) * -1) 0",
])

const bar = (
  <AppBar
    actions={<button type="button">⋯</button>}
    back={{ href: "/loops", label: "Loops" }}
    controls={<a href="?view=runs">Runs</a>}
    status={<span>Open</span>}
    subtitle="nzila / L32"
    title="L32 · supervised by dogfood"
    titleId="loop-title"
  />
)

describe("AppBar", () => {
  it("is a header with a way back, the title as the page's h1, and its subtitle", async () => {
    const markup = markupOf(await renderToHtml(bar))

    expect(markup).toMatch(
      /<a aria-label="Back to Loops" data-app-bar-back="" href="\/loops"[^>]*title="Back to Loops"/,
    )
    expect(markup).toMatch(/<h1 id="loop-title"[^>]*title="L32 · supervised by dogfood"/)
    expect(markup).toContain(">nzila / L32</p>")
    expect(markup).toMatch(/<svg aria-hidden="true"/)
  })

  it("draws the app's own glyph for the way back when given one", async () => {
    const markup = markupOf(
      await renderToHtml(
        <AppBar
          back={{ href: "/", label: "Home", icon: <span data-glyph="">←</span> }}
          title="t"
        />,
      ),
    )

    expect(markup).toContain('<span data-glyph="">←</span>')
    expect(markup).not.toContain("<svg")
  })

  it("leaves out what it is not given", async () => {
    const markup = markupOf(
      await renderToHtml(<AppBar back={{ href: "/", label: "Home" }} title="t" />),
    )

    expect(markup).not.toMatch(/<p[\s>]/)
    expect(markup.match(/<div/g) ?? []).toHaveLength(1)
  })

  it("is a phone's app bar below its breakpoint, each rule in its element's own block", async () => {
    const html = await renderToHtml(bar)

    expect(appBarMedia).toBe(`@media (width < ${appBarBreakpoint})`)

    for (const [tag, rule] of [
      ["header", "padding-block-start: env(safe-area-inset-top)"],
      ["div", '"status status controls controls"'],
      ["a", "margin-inline: calc(var(--ui-appbar-back-inset) * -1) 0"],
      ["h1", "font-size: var(--ui-appbar-title-size)"],
      ["p", "text-overflow: ellipsis"],
    ] as const) {
      const blocks = blocksOn(html, tag).join("\n")

      expect(blocks).toContain(appBarMedia.replace("@media ", ""))
      expect(blocks).toContain(rule)
    }
  })

  it("folds the second row and the title's second line once a host marks it stuck", async () => {
    const styles = stylesOf(await renderToHtml(bar))

    expect(styles).toMatch(/\[data-app-bar-stuck\] & \{\s*-webkit-line-clamp: 1;/)
    expect(styles).toMatch(/\[data-app-bar-stuck\] & \{\s*display: none;/)
  })

  it("gives a host's own head the same bar, under its own stuck mark", async () => {
    const parts = appBarParts("[data-page-head-stuck]")
    const styles = stylesOf(
      await renderToHtml(
        <h1 mix={css({ [appBarMedia]: parts.title })}>
          <span mix={css({ [appBarMedia]: parts.slot("controls") })} />
        </h1>,
      ),
    )

    expect(styles).toMatch(/\[data-page-head-stuck\] & \{\s*-webkit-line-clamp: 1;/)
    expect(styles).toContain("grid-area: controls")
    expect(styles).toContain("justify-self: end")
  })

  it("reads only its own tokens and structural keywords", async () => {
    const offenders = valuesOf(stylesOf(await renderToHtml(bar))).filter(
      (value) => !keywords.has(value) && !/^var\(--ui-appbar-[\w-]+\)$/.test(value),
    )

    expect(offenders).toEqual([])
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    const styles = stylesOf(await renderToHtml(bar))
    const read = new Set([...styles.matchAll(/var\(--(ui-appbar-[\w-]+)\)/g)].map((m) => m[1]))

    expect([...read].sort()).toEqual(Object.keys(appBarTokens).sort())
  })

  it("has a demo that renders", async () => {
    expect(await renderToHtml(<AppBarDemo />)).toContain("data-app-bar")
  })
})
