import { describe, expect, it } from "bun:test"
import { css } from "remix/component"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, markupOf, sharedProperties, stylesOf, valuesOf } from "../../../test/styles.ts"
import { tableListBreakpoint, tableListMedia, tableListRules } from "./list.ts"
import {
  SortableColumnHeader,
  sortDirectionOf,
  sortHrefFor,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "./table.tsx"
import { tableTokens } from "./tokens.ts"

const keywords = new Set([
  "start",
  "collapse",
  "100%",
  "solid",
  "inline-flex",
  "center",
  "none",
  "inherit",
  "underline",
  // A list's layout: blocks and a grid whose lines are named for where a
  // cell goes, a stretched link's box, and the column heads read, not seen.
  "block",
  "grid",
  "[lead] auto [body] minmax(0, 1fr) [trail] auto",
  "lead",
  "body",
  "trail",
  "1 / span 4",
  "row dense",
  "end",
  "normal",
  "relative",
  "absolute",
  "transparent",
  '""',
  "0",
  "1",
  "1px",
  "hidden",
  "inset(50%)",
])

const list = (
  <Table list>
    <TableHead>
      <TableRow>
        <TableHeaderCell>State</TableHeaderCell>
        <TableHeaderCell>Name</TableHeaderCell>
        <TableHeaderCell>Seen</TableHeaderCell>
      </TableRow>
    </TableHead>
    <TableBody>
      <TableRow>
        <TableCell place="lead">●</TableCell>
        <TableCell>
          <a data-table-link="" href="/people/amara">
            Amara
          </a>
        </TableCell>
        <TableCell place="trail">2m</TableCell>
      </TableRow>
    </TableBody>
  </Table>
)

describe("Table", () => {
  it("renders a table with a head, a body and cells", async () => {
    const markup = markupOf(
      await renderToHtml(
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Amara</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      ),
    )

    expect(markup).toContain("<table")
    expect(markup).toContain("<thead")
    expect(markup).toContain("<tbody")
    expect(markup).toContain('scope="col"')
    expect(markup).toContain("Amara")
  })

  it("reads only its own tokens and structural keywords", async () => {
    const html = await renderToHtml(
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>Amara</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )

    const offenders = valuesOf(stylesOf(html)).filter(
      (value) => !keywords.has(value) && !/^var\(--ui-table-[\w-]+\)$/.test(value),
    )

    expect(offenders).toEqual([])
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    const html = await renderToHtml(
      <>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Amara</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <SortableColumnHeader field="name" location="/c/table?sort=name&dir=asc">
          Name
        </SortableColumnHeader>
      </>,
    )

    const read = new Set(
      [...stylesOf(html).matchAll(/var\(--(ui-table-[\w-]+)\)/g)].map((match) => match[1] ?? ""),
    )

    expect([...read].sort()).toEqual(Object.keys(tableTokens).sort())
  })

  it("keeps its blocks disjoint by property", async () => {
    const html = await renderToHtml(
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>Amara</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )

    for (const tag of ["table", "tr", "th", "td"]) {
      const blocks = blocksOn(html, tag)

      expect(blocks.length).toBeGreaterThan(0)
      expect(sharedProperties(blocks)).toEqual([])
    }
  })
})

describe("Table as a list", () => {
  it("marks the table and places each cell", async () => {
    const markup = markupOf(await renderToHtml(list))

    expect(markup).toMatch(/<table data-table-list=""[^>]*role="table"/)
    expect(markup).toContain('data-table-place="lead"')
    expect(markup).toContain('data-table-place="trail"')
  })

  it("writes out the roles a browser drops with the table's layout", async () => {
    const markup = markupOf(await renderToHtml(list))

    expect(markup).toMatch(/<thead role="rowgroup"/)
    expect(markup).toMatch(/<tbody role="rowgroup"/)
    expect(markup.match(/<tr[^>]*role="row"/g) ?? []).toHaveLength(2)
    expect(markup.match(/role="columnheader"/g) ?? []).toHaveLength(3)
    expect(markup.match(/role="cell"/g) ?? []).toHaveLength(3)
  })

  it("writes no roles and no marks for a table that is not one", async () => {
    const markup = markupOf(
      await renderToHtml(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Amara</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      ),
    )

    expect(markup).not.toContain("role=")
    expect(markup).not.toContain("data-table-list")
  })

  it("draws as a list below its breakpoint only, in each element's own block", async () => {
    const html = await renderToHtml(list)

    expect(tableListMedia).toBe(`@media (width < ${tableListBreakpoint})`)

    // Each rule sits in the block of the element it styles, where a cascade
    // layer of its own cannot lose to the cell's or the row's.
    for (const [tag, rule] of [
      ["table", "display: block"],
      ["tr", "grid-template-columns: [lead] auto [body] minmax(0, 1fr) [trail] auto"],
      ["td", "grid-column: body"],
    ] as const) {
      const blocks = blocksOn(html, tag, tag === "tr" ? 1 : 0).join("\n")

      expect(blocks).toContain(tableListMedia.replace("@media ", ""))
      expect(blocks).toContain(rule)
    }
  })

  it("gives a host's own table markup the same list, in one block", async () => {
    const styles = stylesOf(
      await renderToHtml(
        <table data-table-list="" mix={css({ [tableListMedia]: tableListRules })} />,
      ),
    )

    expect(styles).toContain("&[data-table-list]")
    expect(styles).toContain("& > tbody > tr:not(:has(> [scope=rowgroup]))")
    expect(styles).toContain("&[data-table-place=trail]")
    expect(styles).toContain("& [data-table-link]::after")
  })
})

describe("sortDirectionOf", () => {
  it("is undefined when the column is not the current sort", () => {
    expect(sortDirectionOf("/c/table", "name")).toBeUndefined()
    expect(sortDirectionOf("/c/table?sort=role&dir=asc", "name")).toBeUndefined()
  })

  it("reads the direction for the current sort column, defaulting to asc", () => {
    expect(sortDirectionOf("/c/table?sort=name", "name")).toBe("asc")
    expect(sortDirectionOf("/c/table?sort=name&dir=desc", "name")).toBe("desc")
  })
})

describe("sortHrefFor", () => {
  it("sorts ascending the first time", () => {
    expect(sortHrefFor("/c/table", "name")).toBe("/c/table?sort=name&dir=asc")
  })

  it("flips direction when the column is already sorted", () => {
    expect(sortHrefFor("/c/table?sort=name&dir=asc", "name")).toBe("/c/table?sort=name&dir=desc")
    expect(sortHrefFor("/c/table?sort=name&dir=desc", "name")).toBe("/c/table?sort=name&dir=asc")
  })

  it("resets to ascending when switching to a different column", () => {
    expect(sortHrefFor("/c/table?sort=name&dir=desc", "role")).toBe("/c/table?sort=role&dir=asc")
  })

  it("preserves every other query param", () => {
    expect(sortHrefFor("/c/table?q=amara&page=2", "name")).toBe(
      "/c/table?q=amara&page=2&sort=name&dir=asc",
    )
  })
})

describe("SortableColumnHeader", () => {
  it("renders a plain link toggling sort and dir, with no script", async () => {
    const html = await renderToHtml(
      <SortableColumnHeader field="name" location="/c/table">
        Name
      </SortableColumnHeader>,
    )

    expect(html).not.toContain("<script")
    const markup = markupOf(html)

    // & is HTML-escaped as &amp; in an attribute value.
    expect(markup).toContain('href="/c/table?sort=name&amp;dir=asc"')
    expect(markup).toContain("Name")
  })

  it("marks the active column with aria-sort", async () => {
    const active = markupOf(
      await renderToHtml(
        <SortableColumnHeader field="name" location="/c/table?sort=name&dir=desc">
          Name
        </SortableColumnHeader>,
      ),
    )

    expect(active).toContain('aria-sort="descending"')
    const inactive = markupOf(
      await renderToHtml(
        <SortableColumnHeader field="role" location="/c/table?sort=name&dir=desc">
          Role
        </SortableColumnHeader>,
      ),
    )

    expect(inactive).not.toContain("aria-sort")
  })
})
