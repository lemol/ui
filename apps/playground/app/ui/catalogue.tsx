import type { DemoEntry } from "@lemol/ui-remix/demos"
import { css, type Handle } from "remix/ui"

export interface CataloguePageProps {
  entry: DemoEntry
}

const page = css({
  maxWidth: "var(--page-max)",
  margin: "0 auto",
  padding: "var(--sp-8) var(--gutter)",
})

const heading = css({
  fontSize: "var(--fs-2xl)",
  marginBlockEnd: "var(--sp-6)",
})

/**
 * The frame around a demo: a title and the demo's own markup, and nothing
 * else yet. Knobs, the switcher form and the component index are still to
 * come; scheme and density are query params in the meantime. The route exists
 * this early so that Button's contract is provable in a real document rather
 * than only in a render test.
 */
export function CataloguePage(handle: Handle<CataloguePageProps>) {
  return () => {
    const { title, Demo } = handle.props.entry
    return (
      <main mix={page}>
        <h1 mix={heading}>{title}</h1>
        <Demo />
      </main>
    )
  }
}
