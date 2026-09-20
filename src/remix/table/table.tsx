import { css, type Handle, type MixInput, type RemixNode } from "remix/ui"

const tableStyle = css({
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "var(--ui-table-font-size)",
})

const headCellStyle = css({
  textAlign: "start",
  paddingInline: "var(--ui-table-cell-pad-x)",
  paddingBlock: "var(--ui-table-cell-pad-y)",
  background: "var(--ui-table-header-bg)",
  color: "var(--ui-table-header-ink)",
  fontWeight: "var(--ui-table-header-font-weight)",
  borderBlockEndStyle: "solid",
  borderBlockEndWidth: "var(--ui-table-border-width)",
  borderBlockEndColor: "var(--ui-table-border)",
})

const rowStyle = css({
  "&:hover": { background: "var(--ui-table-row-bg-hover)" },
})

const cellStyle = css({
  textAlign: "start",
  paddingInline: "var(--ui-table-cell-pad-x)",
  paddingBlock: "var(--ui-table-cell-pad-y)",
  borderBlockEndStyle: "solid",
  borderBlockEndWidth: "var(--ui-table-border-width)",
  borderBlockEndColor: "var(--ui-table-border)",
})

const sortLinkStyle = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--ui-table-sort-gap)",
  color: "inherit",
  textDecoration: "none",
  "&:hover": { textDecoration: "underline" },
})

const sortIndicatorStyle = css({
  color: "var(--ui-table-sort-ink)",
  fontSize: "var(--ui-table-sort-indicator-size)",
})

export interface TableProps {
  mix?: MixInput<HTMLTableElement> | undefined
  children?: RemixNode | undefined
}

export function Table(handle: Handle<TableProps>) {
  return () => {
    const { mix, children } = handle.props
    return <table mix={[tableStyle, mix]}>{children}</table>
  }
}

export interface TableHeadProps {
  children?: RemixNode | undefined
}

export function TableHead(handle: Handle<TableHeadProps>) {
  return () => <thead>{handle.props.children}</thead>
}

export interface TableBodyProps {
  children?: RemixNode | undefined
}

export function TableBody(handle: Handle<TableBodyProps>) {
  return () => <tbody>{handle.props.children}</tbody>
}

export interface TableRowProps {
  mix?: MixInput<HTMLTableRowElement> | undefined
  children?: RemixNode | undefined
}

export function TableRow(handle: Handle<TableRowProps>) {
  return () => {
    const { mix, children } = handle.props
    return <tr mix={[rowStyle, mix]}>{children}</tr>
  }
}

export interface TableHeaderCellProps {
  mix?: MixInput<HTMLTableCellElement> | undefined
  children?: RemixNode | undefined
}

/** A plain, unsortable column header. See `SortableColumnHeader` for one that is. */
export function TableHeaderCell(handle: Handle<TableHeaderCellProps>) {
  return () => {
    const { mix, children } = handle.props
    return (
      <th mix={[headCellStyle, mix]} scope="col">
        {children}
      </th>
    )
  }
}

export interface TableCellProps {
  mix?: MixInput<HTMLTableCellElement> | undefined
  children?: RemixNode | undefined
}

export function TableCell(handle: Handle<TableCellProps>) {
  return () => {
    const { mix, children } = handle.props
    return <td mix={[cellStyle, mix]}>{children}</td>
  }
}

export type SortDirection = "asc" | "desc"

/**
 * The current sort field and direction, read from `location`'s own query
 * string — a server-rendered table has no other state to read it from.
 */
export function sortDirectionOf(location: string, field: string): SortDirection | undefined {
  const params = new URL(location, "http://localhost").searchParams
  if (params.get("sort") !== field) return undefined
  return params.get("dir") === "desc" ? "desc" : "asc"
}

/**
 * The link that would sort by `field` next: ascending the first time, and
 * flipped from whatever direction it is already sorted by otherwise. Every
 * other query param survives, the same rule the playground's own switchers
 * follow, so sorting a column does not drop a filter.
 */
export function sortHrefFor(location: string, field: string): string {
  const url = new URL(location, "http://localhost")
  const current = sortDirectionOf(location, field)
  const next: SortDirection = current === "asc" ? "desc" : "asc"
  url.searchParams.set("sort", field)
  url.searchParams.set("dir", next)
  return `${url.pathname}?${url.searchParams.toString()}`
}

export interface SortableColumnHeaderProps {
  /** The query param value this column sorts by. */
  field: string
  /** Path plus query string of the current page — see `sortDirectionOf`. */
  location: string
  mix?: MixInput<HTMLTableCellElement> | undefined
  children?: RemixNode | undefined
}

/**
 * A column header that is a plain link toggling `?sort=field&dir=asc|desc` —
 * no client state, and it works with the runtime absent because the request
 * that follows is an ordinary navigation.
 */
export function SortableColumnHeader(handle: Handle<SortableColumnHeaderProps>) {
  return () => {
    const { field, location, mix, children } = handle.props
    const direction = sortDirectionOf(location, field)
    const ariaSort =
      direction === undefined ? undefined : direction === "asc" ? "ascending" : "descending"
    return (
      <th aria-sort={ariaSort} mix={[headCellStyle, mix]} scope="col">
        <a href={sortHrefFor(location, field)} mix={sortLinkStyle}>
          {children}
          {direction !== undefined && (
            <span aria-hidden="true" mix={sortIndicatorStyle}>
              {direction === "asc" ? "▲" : "▼"}
            </span>
          )}
        </a>
      </th>
    )
  }
}
