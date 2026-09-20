import { css, type Handle, type MixInput } from "remix/ui"
import { pageRange } from "./page-range.ts"

const listStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "var(--ui-pagination-gap)",
  margin: 0,
  padding: 0,
  listStyle: "none",
  fontSize: "var(--ui-pagination-font-size)",
})

const controlStyle = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minInlineSize: "var(--ui-pagination-control-size)",
  blockSize: "var(--ui-pagination-control-size)",
  paddingInline: "var(--ui-pagination-gap)",
  borderRadius: "var(--ui-pagination-radius)",
  color: "var(--ui-pagination-ink)",
  textDecoration: "none",
  "&:hover": {
    background: "var(--ui-pagination-bg-hover)",
    color: "var(--ui-pagination-ink-hover)",
  },
})

const activeStyle = css({
  background: "var(--ui-pagination-active-bg)",
  color: "var(--ui-pagination-active-ink)",
  "&:hover": {
    background: "var(--ui-pagination-active-bg)",
    color: "var(--ui-pagination-active-ink)",
  },
})

const disabledStyle = css({
  color: "var(--ui-pagination-disabled-ink)",
})

const ellipsisStyle = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minInlineSize: "var(--ui-pagination-control-size)",
  color: "var(--ui-pagination-disabled-ink)",
})

/** `?page=n` on `location`, every other query param preserved. */
export function pageHref(location: string, page: number): string {
  const url = new URL(location, "http://localhost")
  url.searchParams.set("page", String(page))
  return `${url.pathname}?${url.searchParams.toString()}`
}

/** The current page, read from `location`'s own query string — 1 when absent or not a positive integer. */
export function currentPageOf(location: string): number {
  const raw = Number(new URL(location, "http://localhost").searchParams.get("page"))
  return Number.isInteger(raw) && raw > 0 ? raw : 1
}

export interface PaginationProps {
  /** Path plus query string of the current page — see `currentPageOf`. */
  location: string
  totalPages: number
  /** Pages shown either side of the current one. See `pageRange`. */
  siblings?: number | undefined
  mix?: MixInput<HTMLElement> | undefined
}

/**
 * Server-rendered `?page=n` links. Every control is a real `<a href>` — a
 * page is reachable with the runtime absent and without a click handler.
 * The boundary controls (`Previous` at page 1, `Next` at the last page)
 * render as plain text rather than an `aria-disabled` anchor: `aria-disabled`
 * does not prevent navigation, so a "disabled" link is a broken link — the
 * same reasoning `LinkButton` gives for requiring a real `href`.
 */
export function Pagination(handle: Handle<PaginationProps>) {
  return () => {
    const { location, totalPages, siblings = 1, mix } = handle.props
    const current = currentPageOf(location)
    const items = pageRange(current, totalPages, siblings)
    const isFirst = current <= 1
    const isLast = current >= totalPages

    return (
      <nav aria-label="Pagination" mix={mix}>
        <ul mix={listStyle}>
          <li>
            {isFirst ? (
              <span mix={[controlStyle, disabledStyle]}>Previous</span>
            ) : (
              <a href={pageHref(location, current - 1)} mix={controlStyle}>
                Previous
              </a>
            )}
          </li>
          {items.map((item, index) =>
            item === "ellipsis" ? (
              <li aria-hidden="true" key={`ellipsis-${index}`} mix={ellipsisStyle}>
                …
              </li>
            ) : (
              <li key={item}>
                <a
                  aria-current={item === current ? "page" : undefined}
                  href={pageHref(location, item)}
                  mix={[controlStyle, item === current ? activeStyle : undefined]}
                >
                  {item}
                </a>
              </li>
            ),
          )}
          <li>
            {isLast ? (
              <span mix={[controlStyle, disabledStyle]}>Next</span>
            ) : (
              <a href={pageHref(location, current + 1)} mix={controlStyle}>
                Next
              </a>
            )}
          </li>
        </ul>
      </nav>
    )
  }
}
