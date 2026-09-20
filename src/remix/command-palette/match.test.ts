import { describe, expect, it } from "bun:test"
import { matchItems, type PaletteItem } from "./match.ts"

const items: PaletteItem[] = [
  { id: "new-task", label: "New task" },
  { id: "command-palette", label: "Command Palette" },
  { id: "settings", keywords: "preferences config", label: "Settings" },
]

describe("matchItems", () => {
  it("returns every item for an empty query", () => {
    expect(matchItems("", items).map((item) => item.id)).toEqual([
      "new-task",
      "command-palette",
      "settings",
    ])
  })

  it("returns every item for a whitespace-only query", () => {
    expect(matchItems("   ", items).map((item) => item.id)).toEqual([
      "new-task",
      "command-palette",
      "settings",
    ])
  })

  it("matches a subsequence, not only a substring", () => {
    expect(matchItems("cmt", items).map((item) => item.id)).toEqual(["command-palette"])
  })

  it("matches case-insensitively", () => {
    expect(matchItems("NEW", items).map((item) => item.id)).toEqual(["new-task"])
  })

  it("matches keywords when the label alone would not", () => {
    expect(matchItems("prefz", items).map((item) => item.id)).toEqual([])
    expect(matchItems("pref", items).map((item) => item.id)).toEqual(["settings"])
  })

  it("preserves authored order rather than ranking by quality", () => {
    // Both match "e"; the order below is items' own order, not a re-ranking.
    expect(matchItems("e", items).map((item) => item.id)).toEqual([
      "new-task",
      "command-palette",
      "settings",
    ])
  })

  it("excludes an item whose characters are out of order", () => {
    // "wn" needs a 'w' before an 'n'; "New task" has them the other way
    // round, and neither letter is in the other two items' searchable text.
    expect(matchItems("wn", items).map((item) => item.id)).toEqual([])
  })

  it("matches nothing when the query cannot be found at all", () => {
    expect(matchItems("xyz", items)).toEqual([])
  })

  it("trims the query before matching", () => {
    // Untrimmed, the leading/trailing spaces would themselves have to appear
    // as characters in the candidate text — "new task" has one space, not
    // two, so "  new  " would fail to match at all if trim() were skipped.
    expect(matchItems("  new  ", items).map((item) => item.id)).toEqual(["new-task"])
  })
})
