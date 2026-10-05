import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../test/render.ts"
import {
  blocksOn,
  markupOf,
  nonPrimitiveValues,
  sharedProperties,
  stylesOf,
} from "../../test/styles.ts"
import { primitiveNames } from "../design/index.ts"
import { AppShell, Nav } from "./shell.tsx"

/**
 * The shell's whole structural vocabulary, and the argument for each literal
 * that is not a keyword:
 *
 * - `1px` is the hairline, the same literal `allowedLiterals` holds for
 *   Button's and Field's borders — the schema has no border-width primitive.
 * - `100dvh` is the viewport, not a quantity a theme sets; `dvh` rather than
 *   `vh` because a collapsing mobile toolbar makes `vh` too tall.
 * - `auto 1fr auto` is the three-band grid itself.
 * - `inset(50%)` is the visually-hidden clip, and `background, color` names
 *   which properties transition — neither is a themeable value.
 */
const keywords = new Set([
  "grid",
  "flex",
  "block",
  "wrap",
  "center",
  "space-between",
  "sticky",
  "absolute",
  "solid",
  "none",
  "transparent",
  "nowrap",
  "auto",
  "0",
  "1",
  "2",
  "1px",
  "100dvh",
  "auto 1fr auto",
  "inset(50%)",
  "background, color",
])

const primitives = new Set<string>(primitiveNames)

const items = [
  { href: "/tasks", label: "Tasks", current: true },
  { href: "/archive", label: "Archive" },
]

describe("AppShell", () => {
  it("renders the three landmarks, with the content in main", async () => {
    const html = markupOf(
      await renderToHtml(
        <AppShell brand="todo-md" footer={<small>© 2026</small>} nav={<Nav items={items} />}>
          page content
        </AppShell>,
      ),
    )

    expect(html).toContain("<header")
    expect(html).toContain("<main")
    expect(html).toContain("<footer")
    expect(html).toContain("page content")
    expect(html).toContain("todo-md")
  })

  it("puts a skip link ahead of the header, pointing at main", async () => {
    // Every page here is a header of links above the content, so a keyboard
    // user pays for the navigation on every page without this.
    const html = markupOf(await renderToHtml(<AppShell nav={<Nav items={items} />}>x</AppShell>))

    expect(html).toContain('href="#main"')
    expect(html).toContain('id="main"')
    expect(html.indexOf('href="#main"')).toBeLessThan(html.indexOf("<header"))
  })

  it("keeps the skip link focusable rather than hiding it", async () => {
    // display:none and visibility:hidden both remove it from the focus order,
    // which makes a skip link decoration.
    const styles = stylesOf(await renderToHtml(<AppShell>x</AppShell>))

    expect(styles).toContain("clip-path: inset(50%)")
    expect(styles).toContain(":focus-visible")
    expect(styles).not.toContain("display: none")
  })

  it("renders no footer band at all when there is nothing in it", async () => {
    const html = markupOf(await renderToHtml(<AppShell>x</AppShell>))

    expect(html).not.toContain("<footer")
  })

  it("makes the brand a link only when it has somewhere to go", async () => {
    const plain = markupOf(await renderToHtml(<AppShell brand="todo-md">x</AppShell>))

    // The skip link is the only anchor a shell with no brand href renders.
    expect([...plain.matchAll(/<a\b/g)]).toHaveLength(1)

    const linked = markupOf(
      await renderToHtml(
        <AppShell brand="todo-md" brandHref="/">
          x
        </AppShell>,
      ),
    )

    expect(linked).toContain('<a href="/"')
  })

  it("gives every band the same measure, so the header lines up with the content", async () => {
    // Container is what holds the measure, and the header agreeing with the
    // content is most of what makes a page look composed rather than assembled.
    const html = await renderToHtml(<AppShell footer="f">x</AppShell>)

    expect(stylesOf(html)).toContain("max-inline-size: var(--page-max)")
    expect([...markupOf(html).matchAll(/max-inline-size/g)]).toHaveLength(0)
  })

  it("stands the footer at the bottom of a short page without knowing its height", async () => {
    const styles = stylesOf(await renderToHtml(<AppShell footer="f">x</AppShell>))

    expect(styles).toContain("grid-template-rows: auto 1fr auto")
    expect(styles).toContain("min-block-size: 100dvh")
  })

  it("separates the header with a hairline and no shadow", async () => {
    // A shadow under a sticky header is what turns a document into an
    // application chrome. The hairline already says where the header ends.
    const styles = stylesOf(await renderToHtml(<AppShell>x</AppShell>))

    expect(styles).toContain("border-block-end-color: var(--hairline)")
    expect(styles).not.toContain("box-shadow")
  })

  it("reads no contract token, only primitives and structural keywords", async () => {
    // mini is the design, so there is no layer above it to retheme these
    // from: the values are the theme's primitives directly, and a different
    // look is a different theme.
    const styles = stylesOf(
      await renderToHtml(
        <AppShell actions="a" brand="b" footer="f" nav={<Nav items={items} />}>
          x
        </AppShell>,
      ),
    )

    expect(nonPrimitiveValues(styles, keywords, primitives)).toEqual([])
    expect(styles).not.toContain("--ui-")
  })

  it("keeps the blocks on one element property-disjoint", async () => {
    // Sub-layer order follows first render, not source order, so two blocks
    // on one element that can both set a property are decided by whichever
    // page rendered first.
    const html = await renderToHtml(<AppShell footer="f">x</AppShell>)

    for (const tag of ["div", "header", "main", "footer"]) {
      const blocks = blocksOn(html, tag)

      expect([tag, blocks.length]).not.toEqual([tag, 0])
      expect([tag, sharedProperties(blocks)]).toEqual([tag, []])
    }
  })
})

describe("Nav", () => {
  it("renders links in a list inside a named landmark", async () => {
    const html = markupOf(await renderToHtml(<Nav items={items} />))

    expect(html).toContain('aria-label="Primary"')
    expect(html).toContain("<ul")
    expect(html).toContain('<li><a aria-current="page" href="/tasks"')
    expect(html).toContain("Archive")
  })

  it("takes a label, which matters the moment a page has a second nav", async () => {
    const html = markupOf(await renderToHtml(<Nav items={items} label="Sections" />))

    expect(html).toContain('aria-label="Sections"')
  })

  it("marks only the current item, and marks it for a screen reader too", async () => {
    // aria-current is both the announcement and the selector the selected
    // style hangs off — one source of truth rather than a class beside it.
    const html = markupOf(await renderToHtml(<Nav items={items} />))

    expect([...html.matchAll(/aria-current/g)]).toHaveLength(1)
    expect(stylesOf(await renderToHtml(<Nav items={items} />))).toContain('[aria-current="page"]')
  })

  it("gives the selected item the accent's subtle pair", async () => {
    // accent-subtle and accent-border have been in the schema since the design
    // system landed, waiting for a consumer. This is it: a filled accent here
    // would put a button in the header.
    const styles = stylesOf(await renderToHtml(<Nav items={items} />))

    expect(styles).toContain("background: var(--accent-subtle)")
    expect(styles).toContain("border-color: var(--accent-border)")
    expect(styles).toContain("color: var(--accent)")
  })

  it("moves between its states on tokens, never on literals", async () => {
    const styles = stylesOf(await renderToHtml(<Nav items={items} />))

    expect(styles).toContain("transition-duration: var(--dur-fast)")
    expect(styles).toContain("transition-timing-function: var(--ease-out-quad)")
  })

  it("reads no contract token, only primitives and structural keywords", async () => {
    const styles = stylesOf(await renderToHtml(<Nav items={items} />))

    expect(nonPrimitiveValues(styles, keywords, primitives)).toEqual([])
    expect(styles).not.toContain("--ui-")
  })

  it("scrolls its own row rather than wrapping into a second navigation", async () => {
    const styles = stylesOf(await renderToHtml(<Nav items={items} />))

    expect(styles).toContain("overflow-x: auto")
    // Hiding the scrollbar would hide the affordance along with it.
    expect(styles).not.toContain("scrollbar-width")
  })
})
