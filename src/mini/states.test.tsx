import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../test/render.ts"
import {
  blocksOn,
  markupOf,
  nonPrimitiveValues,
  sharedProperties,
  stylesOf,
} from "../../test/styles.ts"
import { primitiveNames } from "../design/index.ts"
import { LinkButton } from "../remix/index.ts"
import { EmptyState, ErrorState } from "./states.tsx"

/**
 * The panel's structural vocabulary. `1px` is the hairline literal the schema
 * has no primitive for; `42ch` is the reading measure, which is a count of
 * characters rather than a length a theme sets.
 */
const keywords = new Set([
  "grid",
  "center",
  "dashed",
  "solid",
  "1px",
  "42ch",
  // Contributed by the components inside the panel, which own their own
  // contracts and are checked in their own tests.
  "inline-flex",
  "nowrap",
])

const primitives = new Set<string>(primitiveNames)

/** The panel's own blocks: the base and whichever tone it rendered. */
const panelBlocks = (html: string) => blocksOn(html, "div")

describe("EmptyState", () => {
  it("names what is missing and how to fix it", async () => {
    const html = markupOf(
      await renderToHtml(
        <EmptyState
          action={<LinkButton href="/tasks/new">New task</LinkButton>}
          description="Everything you capture here shows up in this list."
          eyebrow="Today"
          title="No tasks yet"
        />,
      ),
    )

    expect(html).toContain("Today")
    expect(html).toContain("No tasks yet")
    expect(html).toContain("Everything you capture here")
    expect(html).toContain('href="/tasks/new"')
  })

  it("renders no eyebrow when it was given none", async () => {
    const html = markupOf(await renderToHtml(<EmptyState title="No tasks yet" />))

    expect(html).not.toContain("<p")
    expect(html).toContain("No tasks yet")
  })

  it("heads the panel at level 2, because the page already has its h1", async () => {
    const html = markupOf(await renderToHtml(<EmptyState title="No tasks yet" />))

    expect(html).toContain("<h2")
    const deeper = markupOf(await renderToHtml(<EmptyState level={3} title="No tasks yet" />))

    expect(deeper).toContain("<h3")
  })

  it("draws its edge dashed, which is the state said without a sentence", async () => {
    const styles = stylesOf(await renderToHtml(<EmptyState title="No tasks yet" />))

    expect(styles).toContain("border-style: dashed")
    expect(styles).toContain("border-color: var(--hairline-strong)")
    // canvas, not surface: the panel recedes from the page rather than
    // floating above it.
    expect(styles).toContain("background: var(--canvas)")
  })

  it("holds the description to a reading measure", async () => {
    const styles = stylesOf(await renderToHtml(<EmptyState description="d" title="t" />))

    expect(styles).toContain("max-inline-size: 42ch")
  })
})

describe("ErrorState", () => {
  it("carries a status a user can quote, defaulting to Error", async () => {
    const plain = markupOf(await renderToHtml(<ErrorState title="Something broke" />))

    expect(plain).toContain("Error")

    const found = markupOf(await renderToHtml(<ErrorState status="404" title="No such page" />))

    expect(found).toContain("404")
    expect(found).not.toContain(">Error<")
  })

  it("marks the status with the danger tone rather than a kicker", async () => {
    // Badge already owns the semantic vocabulary, and the tone is what makes
    // the panel legible before a word of it is read.
    const html = await renderToHtml(<ErrorState status="503" title="Unavailable" />)

    // The badge reads its own tier, which mini's theme resolves to the danger
    // tone — so the assertion is that the panel delegated to Badge rather than
    // painting a status pill of its own.
    expect(stylesOf(html)).toContain("var(--ui-badge-danger-bg)")
    expect(stylesOf(html)).toContain("background: var(--danger-subtle)")
  })

  it("tints the panel solid, because an error is not a placeholder", async () => {
    const styles = stylesOf(await renderToHtml(<ErrorState title="Something broke" />))

    expect(styles).toContain("border-style: solid")
    expect(styles).toContain("border-color: var(--danger-border)")
  })

  it("takes detail between the description and the way out", async () => {
    const html = markupOf(
      await renderToHtml(
        <ErrorState
          action={<LinkButton href="/">Back to tasks</LinkButton>}
          description="The request did not reach the server."
          title="Something broke"
        >
          <code>request 8f21c</code>
        </ErrorState>,
      ),
    )

    expect(html.indexOf("did not reach")).toBeLessThan(html.indexOf("request 8f21c"))
    expect(html.indexOf("request 8f21c")).toBeLessThan(html.indexOf("Back to tasks"))
  })
})

describe("the shared panel", () => {
  it("reads no contract token of its own, only primitives and keywords", async () => {
    // The components inside it — Heading, Text, Badge, Eyebrow — read their
    // own --ui-* tiers, which is why this filters on the panel's own blocks
    // rather than on every style in the document.
    for (const html of [
      await renderToHtml(<EmptyState description="d" eyebrow="e" title="t" />),
      await renderToHtml(<ErrorState description="d" title="t" />),
    ]) {
      const styles = panelBlocks(html).join("\n")

      expect(nonPrimitiveValues(styles, keywords, primitives)).toEqual([])
      expect(styles).not.toContain("--ui-")
    }
  })

  it("keeps the base and the tone property-disjoint", async () => {
    // The base owns the geometry and each tone owns the three paint
    // properties, so no sub-layer order can produce a different panel.
    for (const html of [
      await renderToHtml(<EmptyState title="t" />),
      await renderToHtml(<ErrorState title="t" />),
    ]) {
      const blocks = panelBlocks(html)

      expect(blocks).toHaveLength(2)
      expect(sharedProperties(blocks)).toEqual([])
    }
  })

  it("gives both states the same geometry, so one product renders both", async () => {
    const empty = stylesOf(await renderToHtml(<EmptyState title="t" />))
    const failed = stylesOf(await renderToHtml(<ErrorState title="t" />))

    for (const declaration of ["padding-block: var(--sp-12)", "border-radius: var(--r-lg)"]) {
      expect(empty).toContain(declaration)
      expect(failed).toContain(declaration)
    }
  })
})
