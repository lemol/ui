import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, markupOf, stylesOf, valuesOf } from "../../../test/styles.ts"
import { FacetFilterDemo } from "./facet-filter.demo.tsx"
import { FacetFilter, type FacetOption } from "./facet-filter.tsx"
import { facetTokens } from "./tokens.ts"

const options: ReadonlyArray<FacetOption> = [
  { value: "open", label: "Open", href: "/tasks", selected: true, count: 48 },
  { value: "done", label: "Done", href: "/tasks?status=done", count: 312 },
]

/** Structural keywords and the transition grammar the surface shares with Popover. */
const keywords = new Set([
  "inline-flex",
  "inline-grid",
  "flex",
  "grid",
  "center",
  "stretch",
  "dashed",
  "solid",
  "none",
  "inherit",
  "nowrap",
  "pointer",
  "0",
  "1",
  "auto",
  "tabular-nums",
  "bottom span-right",
  "flip-block, flip-inline",
  "background, border-color",
])

/**
 * The values that are neither a keyword nor built from this component's own
 * tokens. A transition shorthand is reduced to its token-free words and those
 * must be its property names and `allow-discrete`.
 */
const offendersIn = (styles: string): string[] =>
  valuesOf(styles).filter((value) => {
    if (keywords.has(value) || value.startsWith("--ui-facet-anchor-")) return false

    const names = [...value.matchAll(/var\(--([\w-]+)\)/g)].map((match) => match[1] ?? "")

    if (names.length === 0) return true

    if (!names.every((name) => name.startsWith("ui-facet-"))) return true

    const rest = value
      .replace(/var\(--[\w-]+\)/g, "")
      .replace(/\b(opacity|translate|overlay|display|allow-discrete|calc)\b/g, "")
      .replace(/[()+\-*/\s,01]/g, "")

    return rest !== ""
  })

describe("FacetFilter", () => {
  it("binds its trigger to its list by the one name, with no script", async () => {
    const html = await renderToHtml(<FacetFilter label="Status" name="status" options={options} />)

    expect(html).toContain('command="toggle-popover"')
    expect(html).toContain('commandfor="status"')
    expect(html).toMatch(/<div id="status"[^>]*popover="auto"/)
  })

  it("anchors each list to its trigger by name, the toolbar sharing one surface block", async () => {
    const html = await renderToHtml(
      <>
        <FacetFilter label="Status" name="status" options={options} />
        <FacetFilter label="State" name="state" options={options} />
      </>,
    )

    const surfaces = [...html.matchAll(/<div id="(status|state)"[^>]*class="([^"]+)"/g)].map(
      (match) => match[2],
    )

    expect(html).toContain('style="anchor-name: --ui-facet-anchor-status"')
    expect(html).toContain('style="position-anchor: --ui-facet-anchor-state"')
    // A facet's own block would put its whole surface on the page once per facet.
    expect(surfaces).toHaveLength(2)
    expect(surfaces[0]).toBe(surfaces[1])
  })

  it("offers each value as a link, the chosen one checked", async () => {
    const html = await renderToHtml(<FacetFilter label="Status" name="status" options={options} />)

    expect(html).toMatch(/<a aria-checked="true" href="\/tasks"[^>]*role="menuitemradio"/)
    expect(html).toMatch(/<a aria-checked="false" href="\/tasks\?status=done"/)
    expect(html).toContain(">312<")
  })

  it("offers the values as checks, not radios, once more than one is chosen", async () => {
    // A radio group holds one value, and the trigger is showing two.
    const both = options.map((option) => ({ ...option, selected: true }))
    const html = markupOf(
      await renderToHtml(<FacetFilter label="Status" name="s" options={both} />),
    )

    expect(html.match(/role="menuitemcheckbox"/g)).toHaveLength(2)
    expect(html).not.toContain("menuitemradio")
  })

  it("shows the chosen value on the trigger and marks it active", async () => {
    const chosen = await renderToHtml(<FacetFilter label="Status" name="s" options={options} />)
    const none = await renderToHtml(
      <FacetFilter
        label="Status"
        name="s"
        options={options.map((option) => ({ ...option, selected: false }))}
      />,
    )

    expect(markupOf(chosen)).toContain("data-facet-active")
    expect(chosen).toMatch(/<span[^>]*>Open<\/span><\/button>/)
    expect(markupOf(none)).not.toContain("data-facet-active")
  })

  it("offers a way back only once something is chosen", async () => {
    const html = await renderToHtml(
      <FacetFilter clear="/tasks?all" label="Status" name="s" options={options} />,
    )

    expect(html).toContain('href="/tasks?all"')
    expect(html).toContain("Clear filter")
  })

  it("draws the rule above the way back across the list", async () => {
    // An <hr> keeps the user agent's auto inline margins, and as an item of
    // the list's grid that leaves it zero wide: no rule at all.
    const html = await renderToHtml(
      <FacetFilter clear="/tasks?all" label="Status" name="s" options={options} />,
    )

    const rule = blocksOn(html, "hr")

    expect(rule).toHaveLength(1)
    expect(rule[0]).toContain("margin-inline: 0;")
  })

  it("takes a form of its own in place of options", async () => {
    const html = await renderToHtml(
      <FacetFilter label="Tag" name="tag" value="bug">
        <form method="get">
          <input name="tag" />
        </form>
      </FacetFilter>,
    )

    expect(html).toContain('<input name="tag"')
    expect(markupOf(html)).toContain("data-facet-active")
    expect(html).not.toContain('role="menu"')
    // A form, not a menu: the trigger says what it opens, and what it opens
    // is the dialog it promised, named for the facet.
    expect(html).toContain('aria-haspopup="dialog"')
    expect(html).toMatch(/<div aria-label="Tag" id="tag"[^>]*popover="auto" role="dialog"/)
  })

  it("leaves a list of options unnamed and roleless, the menu inside it being what it is", async () => {
    const html = markupOf(
      await renderToHtml(<FacetFilter label="Status" name="status" options={options} />),
    )

    expect(html).toMatch(/<div id="status"[^>]*popover="auto"[^>]*>/)
    expect(html.match(/<div id="status"[^>]*>/)?.[0]).not.toMatch(/role=|aria-label=/)
  })

  it("reads only its own tokens and structural keywords", async () => {
    const html = await renderToHtml(
      <FacetFilter clear="/" label="Status" name="s" options={options} />,
    )

    expect(offendersIn(stylesOf(html))).toEqual([])
  })

  it("reads every token it declares", async () => {
    const styles = stylesOf(
      await renderToHtml(<FacetFilter clear="/" label="Status" name="s" options={options} />),
    )

    const read = new Set([...styles.matchAll(/var\(--(ui-facet-[\w-]+)\)/g)].map((m) => m[1]))

    expect([...read].sort()).toEqual(Object.keys(facetTokens).sort())
  })

  it("has a demo that renders", async () => {
    expect(await renderToHtml(<FacetFilterDemo />)).toContain("data-facet")
  })
})
