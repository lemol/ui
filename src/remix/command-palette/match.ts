/**
 * The palette's match rule, pure and DOM-free — the model the M2 plan names
 * for extracting real logic and testing it directly.
 *
 * A subsequence match: every character of the (lowercased, trimmed) query
 * has to appear in the candidate text in order, not necessarily contiguous —
 * so "cmt" matches "Command Palette". Chosen over a substring match because
 * it tolerates the abbreviations a command palette's users actually type, and
 * over a scored fuzzy ranker (Levenshtein, character-proximity weighting)
 * because there is no visual affordance here for a reordered list — items
 * stay in the order they were authored, only some are hidden — and a ranker
 * would compute a score nothing displays.
 */
export interface PaletteItem {
  readonly id: string
  readonly label: string
  /** Extra matchable text — a keyboard shortcut, an alias — *added* to `label`, not substituted for it: a query matching the visible label must keep matching once an item also carries keywords. */
  readonly keywords?: string | undefined
}

function isSubsequence(needle: string, haystack: string): boolean {
  if (needle === "") return true
  let index = 0
  for (const character of haystack) {
    if (character === needle[index]) index += 1
    if (index === needle.length) return true
  }
  return false
}

/**
 * Every item whose `label`, plus `keywords` when given, contains the query as
 * a subsequence. An empty or whitespace-only query matches everything, which
 * is what an untouched search box should show.
 */
export function matchItems(query: string, items: readonly PaletteItem[]): readonly PaletteItem[] {
  const needle = query.trim().toLowerCase()
  return items.filter((item) => {
    const haystack = item.keywords === undefined ? item.label : `${item.label} ${item.keywords}`
    return isSubsequence(needle, haystack.toLowerCase())
  })
}
