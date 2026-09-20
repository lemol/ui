import { css } from "remix/ui"
import { Breadcrumbs } from "./breadcrumbs.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

export function BreadcrumbsDemo() {
  return () => (
    <>
      <p mix={label}>breadcrumbs: route links, aria-current on the current page</p>
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/projects", label: "Projects" },
          { label: "Redesign the catalogue" },
        ]}
      />
    </>
  )
}
