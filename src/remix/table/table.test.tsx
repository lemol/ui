import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, markupOf, sharedProperties, stylesOf, valuesOf } from "../../../test/styles.ts"
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
])

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
