import { css } from "remix/ui"
import {
  SortableColumnHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "./table.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const rows = [
  { email: "amara@example.com", name: "Amara", role: "Admin" },
  { email: "jonas@example.com", name: "Jonas", role: "Editor" },
  { email: "priya@example.com", name: "Priya", role: "Viewer" },
]

/**
 * `demos.ts` renders every demo with no props (see `apps/playground/app/ui/
 * catalogue.tsx`), so the location a sortable header reads is this demo's
 * own fixed page rather than the catalogue's actual query string. Clicking a
 * header still sorts for real — `SortableColumnHeader` reads whatever
 * `location` it is given, and this one just is not wired to the address bar.
 */
const location = "/c/table"

export function TableDemo() {
  return () => (
    <>
      <p mix={label}>table: server-rendered rows, sorting is a plain link</p>
      <Table>
        <TableHead>
          <TableRow>
            <SortableColumnHeader field="name" location={location}>
              Name
            </SortableColumnHeader>
            <TableHeaderCell>Email</TableHeaderCell>
            <SortableColumnHeader field="role" location={location}>
              Role
            </SortableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.email}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{row.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
