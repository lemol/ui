import { describe, expect, it } from "bun:test"
import { pageRange } from "./page-range.ts"

describe("pageRange", () => {
  it("is empty for zero or fewer pages", () => {
    expect(pageRange(1, 0)).toEqual([])
    expect(pageRange(1, -1)).toEqual([])
  })

  it("is just the one page when there is only one", () => {
    expect(pageRange(1, 1)).toEqual([1])
  })

  it("shows every page with no ellipsis when the total is small", () => {
    expect(pageRange(1, 3)).toEqual([1, 2, 3])
    expect(pageRange(2, 3)).toEqual([1, 2, 3])
    expect(pageRange(3, 3)).toEqual([1, 2, 3])
  })

  it("shows every page when the total barely exceeds the sibling window", () => {
    // total=5, siblings=1: worst case (current in the middle) still touches
    // every page once ellipsis would only save one entry.
    expect(pageRange(3, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it("ellipses both sides when the current page is in the middle of a long range", () => {
    expect(pageRange(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10])
  })

  it("ellipses only the trailing side when the current page is near the start", () => {
    expect(pageRange(1, 10)).toEqual([1, 2, "ellipsis", 10])
  })

  it("ellipses only the leading side when the current page is near the end", () => {
    expect(pageRange(10, 10)).toEqual([1, "ellipsis", 9, 10])
  })

  it("widens the window with a larger siblings count", () => {
    expect(pageRange(5, 20, 2)).toEqual([1, "ellipsis", 3, 4, 5, 6, 7, "ellipsis", 20])
  })

  it("never duplicates the first or last page", () => {
    for (let current = 1; current <= 10; current++) {
      const items = pageRange(current, 10)
      const pages = items.filter((item): item is number => item !== "ellipsis")
      expect(new Set(pages).size).toBe(pages.length)
    }
  })
})
