import { css } from "remix/ui"
import { Pagination } from "./pagination.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

export function PaginationDemo() {
  return () => (
    <>
      <p mix={label}>pagination: server-rendered ?page=n links, pairs with Table</p>
      <Pagination location="/c/pagination?page=5" totalPages={12} />
    </>
  )
}
