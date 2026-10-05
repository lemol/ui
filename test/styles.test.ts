import { describe, expect, it } from "bun:test"
import { blocksOn, markupOf } from "./styles.ts"

/**
 * A document shaped exactly as `remix/component` writes one: the hash is both the
 * style element's `data-rmx-style` and the class on the element it styles.
 * Built from helpers rather than pasted, so an expectation cannot drift from
 * the fixture it is asserting against.
 */
const block = (hash: string, declaration: string) =>
  `@layer rmx.${hash} { .${hash} {\n  ${declaration};\n} }`

const styleElement = (hash: string, declaration: string) =>
  `<style data-rmx-style="${hash}">${block(hash, declaration)}</style>`

const html =
  "<head>" +
  styleElement("rmxc-aaa", "color: red") +
  styleElement("rmxc-bbb", "gap: 1px") +
  styleElement("rmxc-ccc", "inline-size: 1px") +
  styleElement("rmxc-ddd", "stroke: red") +
  "</head>" +
  '<div class="rmxc-bbb">' +
  '<input class="rmxc-aaa rmxc-ccc" />' +
  // <path> before <p> on purpose: with the <p> first, a substring match would
  // find it anyway and the word-boundary test below would pass for free.
  '<svg><path d="M0 0" /></svg>' +
  '<p class="rmxc-ddd">hint</p>' +
  "</div>"

describe("blocksOn", () => {
  it("returns every block whose class the element carries", () => {
    expect(blocksOn(html, "input")).toEqual([
      block("rmxc-aaa", "color: red"),
      block("rmxc-ccc", "inline-size: 1px"),
    ])
  })

  it("leaves out a block that landed on a different element", () => {
    expect(blocksOn(html, "div")).toEqual([block("rmxc-bbb", "gap: 1px")])
  })

  it("matches whole tag names, so p does not find path", () => {
    // Field renders both a <p> and, inside its chevron, a <path>. A substring
    // match would attribute one element's blocks to the other.
    expect(blocksOn(html, "p")).toEqual([block("rmxc-ddd", "stroke: red")])
  })

  it("returns nothing for a tag the document does not hold", () => {
    // The empty list is why this helper is tested at all: an assertion of
    // sharedProperties([]) passes, so a silent empty return would hide a bug
    // rather than surface one.
    expect(blocksOn(html, "textarea")).toEqual([])
  })

  it("returns nothing for an element remix gave no class", () => {
    expect(blocksOn(html, "svg")).toEqual([])
  })

  const twoDivs =
    "<head>" +
    styleElement("rmxc-eee", "display: flex") +
    styleElement("rmxc-fff", "display: grid") +
    "</head>" +
    '<div class="rmxc-eee"><div class="rmxc-fff"></div></div>'

  it("reads the nth occurrence of the tag when given one", () => {
    expect(blocksOn(twoDivs, "div", 1)).toEqual([block("rmxc-fff", "display: grid")])
  })

  it("defaults to the first occurrence when none is given", () => {
    expect(blocksOn(twoDivs, "div")).toEqual([block("rmxc-eee", "display: flex")])
  })

  it("returns nothing for an occurrence past the last match", () => {
    expect(blocksOn(twoDivs, "div", 5)).toEqual([])
  })
})

describe("markupOf", () => {
  it("strips a single style block, leaving the markup around it", () => {
    const withStyle = `${styleElement("rmxc-aaa", "color: red")}<div class="rmxc-aaa">hi</div>`

    expect(markupOf(withStyle)).toBe('<div class="rmxc-aaa">hi</div>')
  })

  it("strips multiple separate style blocks and leaves the markup between them intact", () => {
    // A greedy `<style>[\s\S]*<\/style>` would span from the first opening
    // tag to the *last* closing tag, swallowing the markup in between along
    // with it. The markup between the two style blocks below has to survive.
    const doc =
      styleElement("rmxc-aaa", "color: red") +
      "<div>between the style blocks</div>" +
      styleElement("rmxc-bbb", "gap: 1px") +
      "<p>after</p>"

    const stripped = markupOf(doc)

    expect(stripped).toContain("<div>between the style blocks</div>")
    expect(stripped).toContain("<p>after</p>")
    expect(stripped).not.toContain("<style")
    expect(stripped).not.toContain("color: red")
    expect(stripped).not.toContain("gap: 1px")
  })

  it("leaves markup with no style block untouched", () => {
    expect(markupOf("<div>plain</div>")).toBe("<div>plain</div>")
  })

  it("does not touch an aria-invalid attribute that isn't inside a style block", () => {
    // The reason markupOf exists at all: controlBase's own selector text,
    // `&[aria-invalid="true"]`, sits inside every rendered stylesheet, which
    // would make a raw-html assertion about aria-invalid unfalsifiable in
    // both directions. This pins that the attribute survives when it is on
    // the actual markup, not just inside a <style> block.
    const html = `${styleElement("rmxc-aaa", "color: red")}<input aria-invalid="true" />`

    expect(markupOf(html)).toContain('aria-invalid="true"')
  })
})
