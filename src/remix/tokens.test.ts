import { describe, expect, it } from "bun:test"
import { primitiveNames } from "../design/index.ts"
import { componentTokens } from "./tokens.ts"

/**
 * Values a default may be even though they are not a var(). Every entry has to
 * be argued for in review; the list existing is what keeps "just this once"
 * from becoming the norm.
 *
 * - `transparent` keeps a ghost control the same size as a filled one, so a
 *   toolbar does not reflow when a tone changes.
 * - `1px` and `2px` are border widths, and the schema has no border-width
 *   primitive. Named here rather than written into the component, so a skin
 *   can change one. `Spinner`'s ring reads `2px` for a visible arc at its
 *   default size; `1px` is every bordered surface's default elsewhere.
 * - `uppercase` is Eyebrow's whole look. `display: inline-flex` in Button is
 *   structural — change it and the component stops working — but caps are
 *   taste, and a brand that sets things in sentence case has to be able to say
 *   `--ui-eyebrow-transform: none` rather than fork the component.
 * - `bottom span-all` is where Popover opens against its trigger: a placement
 *   keyword, not a design value, a token so a menu can open toward the
 *   trigger's start edge without restating the property in a second block.
 */
const allowedLiterals = new Set(["transparent", "1px", "2px", "uppercase", "bottom span-all"])

const primitives = new Set<string>(primitiveNames)
const entries = Object.entries(componentTokens)

describe("the component token aggregate", () => {
  it("holds something", () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  it("prefixes every name with ui- and writes no leading dashes", () => {
    const problems = entries.flatMap(([name]) => {
      if (name.startsWith("--")) return [`${name}: carries its own leading dashes`]

      if (!name.startsWith("ui-")) return [`${name}: is not ui- prefixed`]

      return []
    })

    expect(problems).toEqual([])
  })

  it("defaults every token to a primitive that exists", () => {
    // A var() on an undeclared property resolves to nothing, so a default
    // naming a primitive the schema dropped is invisible until someone looks
    // at the rendered page.
    const problems = entries.flatMap(([name, value]) => {
      if (allowedLiterals.has(value)) return []

      const referenced = /^var\(--([\w-]+)\)$/.exec(value)?.[1]

      if (referenced === undefined) {
        return [`${name}: ${value} is neither var(--primitive) nor an allowed literal`]
      }

      if (!primitives.has(referenced)) {
        return [`${name}: --${referenced} is not a name the schema holds`]
      }

      return []
    })

    expect(problems).toEqual([])
  })

  it("derives no tone from another", () => {
    // A mix ratio inside a component is the same kind of bug as a literal
    // duration: correct today, impossible to retune centrally.
    const problems = entries
      .filter(([, value]) => value.includes("color-mix("))
      .map(([name]) => `${name}: contains color-mix()`)

    expect(problems).toEqual([])
  })

  it("holds every component's tokens, Badge included", () => {
    // The aggregate is what emitTokensCss writes ahead of a theme's values.
    // A component missing from it ships a contract whose every default
    // resolves to nothing, and no component test can see that.
    const prefixes = new Set(entries.map(([name]) => name.split("-").slice(0, 2).join("-")))

    expect([...prefixes].sort()).toEqual([
      "ui-badge",
      "ui-breadcrumbs",
      "ui-btn",
      "ui-callout",
      "ui-checkbox",
      "ui-dialog",
      "ui-disclosure",
      "ui-eyebrow",
      "ui-facet",
      "ui-field",
      "ui-heading",
      "ui-kbd",
      "ui-menu",
      "ui-meter",
      "ui-pagination",
      "ui-palette",
      "ui-popover",
      "ui-radio",
      "ui-segmented",
      "ui-sheet",
      "ui-skeleton",
      "ui-spinner",
      "ui-switch",
      "ui-tabbar",
      "ui-table",
      "ui-tabs",
      "ui-text",
      "ui-toast",
    ])
  })
})
