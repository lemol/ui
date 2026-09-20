import { describe, expect, it } from "bun:test"
import { css } from "remix/ui"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, markupOf, stylesOf } from "../../../test/styles.ts"
import { Skeleton } from "./skeleton.tsx"
import { skeletonTokens } from "./tokens.ts"

const keywords = new Set(["block", "100%", "1em", "200% 100%", "200% 0", "-200% 0"])

describe("Skeleton", () => {
  it("renders a div hidden from assistive tech", async () => {
    const markup = markupOf(await renderToHtml(<Skeleton />))
    expect(markup).toContain("<div")
    expect(markup).toContain('aria-hidden="true"')
  })

  it("declares an animation naming its own keyframes, duration and easing tokens", async () => {
    const html = await renderToHtml(<Skeleton />)
    const block = blocksOn(html, "div")[0] ?? ""
    expect(block).toContain(
      "animation: ui-skeleton-shimmer var(--ui-skeleton-duration) var(--ui-skeleton-easing) infinite",
    )
    expect(block).toContain("@keyframes ui-skeleton-shimmer")
  })

  it("reads only its own tokens and structural keywords", async () => {
    const styles = stylesOf(await renderToHtml(<Skeleton />))
    const offenders = [...styles.matchAll(/([\w-]+)\s*:\s*([^;{}]+)[;}]/g)]
      .filter(([, property]) => property !== "animation" && property !== "background-image")
      .map(([, , value]) => (value ?? "").trim())
      .filter((value) => !keywords.has(value) && !/^var\(--ui-skeleton-[\w-]+\)$/.test(value))
    expect(offenders).toEqual([])
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    const html = await renderToHtml(<Skeleton />)
    const read = new Set(
      [...stylesOf(html).matchAll(/var\(--(ui-skeleton-[\w-]+)\)/g)].map((match) => match[1] ?? ""),
    )
    expect([...read].sort()).toEqual(Object.keys(skeletonTokens).sort())
  })

  it("adds through mix a property it does not declare itself", async () => {
    const placed = css({ inlineSize: "2.5rem" })
    const html = await renderToHtml(<Skeleton mix={placed} />)
    const blocks = blocksOn(html, "div")
    expect(blocks.filter((block) => block.includes("2.5rem"))).toHaveLength(1)
  })

  it("renders complete markup with no script", async () => {
    expect(await renderToHtml(<Skeleton />)).not.toContain("<script")
  })
})
