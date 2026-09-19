import { describe, expect, it } from "bun:test"
import { blocksOn } from "./styles.ts"

/**
 * A document shaped exactly as `remix/ui` writes one: the hash is both the
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
})
