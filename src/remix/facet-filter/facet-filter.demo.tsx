import { css } from "remix/component"
import { Row } from "../row/row.tsx"
import { FacetFilter } from "./facet-filter.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  marginBlockEnd: "var(--sp-2)",
})

const group = css({ marginBlockEnd: "var(--sp-6)" })

export function FacetFilterDemo() {
  return () => (
    <>
      <p mix={label}>facet filter: a dashed facet, then one with a value chosen</p>
      <div mix={group}>
        <Row gap={2}>
          <FacetFilter
            label="Status"
            name="demo-facet-status"
            options={[
              { value: "open", label: "Open", href: "?status=open", count: 48 },
              { value: "done", label: "Done", href: "?status=done", count: 312 },
            ]}
          />
          <FacetFilter
            clear="?"
            label="Project"
            name="demo-facet-project"
            options={[
              { value: "nzila", label: "nzila", href: "?", selected: true, count: 31 },
              { value: "xonton", label: "xonton", href: "?project=xonton", count: 12 },
            ]}
          />
        </Row>
      </div>
    </>
  )
}
