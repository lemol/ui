/**
 * The page list `Pagination` renders, pure and DOM-free: always the first
 * and last page, the current page and `siblings` pages either side of it,
 * and an `"ellipsis"` marker wherever a gap is skipped.
 */
export type PageRangeItem = number | "ellipsis"

export function pageRange(current: number, total: number, siblings = 1): PageRangeItem[] {
  if (total <= 0) return []

  if (total <= 1) return [1]

  const start = Math.max(2, current - siblings)
  const end = Math.min(total - 1, current + siblings)

  const items: PageRangeItem[] = [1]

  if (start > 2) items.push("ellipsis")

  for (let page = start; page <= end; page++) items.push(page)

  if (end < total - 1) items.push("ellipsis")

  items.push(total)

  return items
}
