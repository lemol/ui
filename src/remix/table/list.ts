import type { css } from "remix/component"

type Styles = Parameters<typeof css>[0]

/**
 * The width under which a table marked a list draws as a phone's list: the
 * same width a `TabBar` draws under, where a sidebar beside the pane leaves
 * no room for columns. Not a token: a media condition cannot read `var()`.
 */
export const tableListBreakpoint = "48rem"

export const tableListMedia = `@media (width < ${tableListBreakpoint})`

/**
 * Where a cell goes in a list's row: `lead` (the row's mark, at its start),
 * `body` (under the title, in order), `trail` (at its end, dim and small,
 * one a line) or `hide`.
 */
export type TableCellPlace = "lead" | "body" | "trail" | "hide"

/** A row that heads a group: its one cell is the group's name, `scope="rowgroup"`. */
const groupHead = ":has(> [scope=rowgroup])"

/** The table: no column heads drawn (still read), its rows a list of blocks. */
const table: Styles = {
  display: "block",
  fontSize: "var(--ui-table-list-font-size)",
  "& > thead": {
    position: "absolute",
    inlineSize: "1px",
    blockSize: "1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
  },
  "& > tbody": { display: "block" },
}

/**
 * A row: its mark, its body and what trails it, the whole row the target of
 * the link it marks `data-table-link`, which stretches over it. The row's
 * other controls stay pressable above that link. Packed dense, so each cell
 * takes the first free line of its place whatever the cells' order: a
 * trailing cell written first still leaves the title the row's first line.
 */
const row: Styles = {
  display: "grid",
  gridTemplateColumns: "[lead] auto [body] minmax(0, 1fr) [trail] auto",
  gridAutoFlow: "row dense",
  columnGap: "var(--ui-table-list-gap)",
  alignItems: "start",
  position: "relative",
  paddingBlock: "var(--ui-table-list-pad-y)",
  paddingInline: "var(--ui-table-list-pad-x)",
  WebkitTapHighlightColor: "transparent",
  "&:not(:last-child)": {
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "var(--ui-table-border-width)",
    borderBlockEndColor: "var(--ui-table-border)",
  },
  "&:active": { background: "var(--ui-table-row-bg-hover)" },
  "& [data-table-link]::after": { content: '""', position: "absolute", inset: "0" },
  "& :is(a:not([data-table-link]), button, summary, input, select)": {
    position: "relative",
    zIndex: "1",
  },
}

/** A cell, placed by its `data-table-place`; trailing cells stack down the row's end. */
const cell: Styles = {
  display: "block",
  gridColumn: "body",
  minInlineSize: "0",
  padding: "0",
  borderStyle: "none",
  whiteSpace: "normal",
  "&[data-table-place=lead]": { gridColumn: "lead", gridRow: "1 / span 4" },
  "&[data-table-place=trail]": {
    gridColumn: "trail",
    textAlign: "end",
    color: "var(--ui-table-list-trail-ink)",
    fontSize: "var(--ui-table-list-trail-font-size)",
  },
  "&[data-table-place=hide]": { display: "none" },
}

/** A group's head row: a block holding the group's name, inset as a row is. */
const head: Styles = {
  display: "block",
  "& > *": { display: "block", paddingInline: "var(--ui-table-list-pad-x)" },
}

/**
 * The list's rules for each element's own `css()` block, which is where a
 * rule must sit to win: every block is its own cascade layer, and a later
 * layer beats a more specific selector. `Table` spreads these into its
 * table, row and cell blocks under `tableListMedia`.
 */
export const tableListParts = {
  table: { "&[data-table-list]": table },
  row: {
    [`[data-table-list] &:not(${groupHead})`]: row,
    [`[data-table-list] &${groupHead}`]: head,
  },
  cell: { [`[data-table-list] tr:not(${groupHead}) > &`]: cell },
} as const satisfies Record<string, Styles>

/**
 * The same list, for a host that draws its own table markup in one `css()`
 * block: spread it there under `tableListMedia`, or under the width its own
 * frame turns at. It applies to a table marked `data-table-list`: its cells
 * carry `data-table-place`, a row's own link `data-table-link`, and a group's
 * head row is the one whose cell is `scope="rowgroup"`.
 */
export const tableListRules: Styles = {
  "&[data-table-list]": {
    ...table,
    [`& > tbody > tr:not(${groupHead})`]: row,
    [`& > tbody > tr:not(${groupHead}) > *`]: cell,
    [`& > tbody > tr${groupHead}`]: head,
  },
}
