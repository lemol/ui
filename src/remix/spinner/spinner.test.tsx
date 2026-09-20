import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, markupOf, stylesOf } from "../../../test/styles.ts"
import { Spinner } from "./spinner.tsx"
import { spinnerTokens } from "./tokens.ts"

const keywords = new Set(["inline-block", "solid", "0deg", "360deg", "linear", "infinite"])

describe("Spinner", () => {
  it("renders a status role with an accessible name", async () => {
    const markup = markupOf(await renderToHtml(<Spinner />))
    expect(markup).toContain('role="status"')
    expect(markup).toContain('aria-label="Loading"')
  })

  it("takes a custom label", async () => {
    const markup = markupOf(await renderToHtml(<Spinner label="Saving" />))
    expect(markup).toContain('aria-label="Saving"')
  })

  it("declares an animation naming its own keyframes and duration token", async () => {
    const html = await renderToHtml(<Spinner />)
    const block = blocksOn(html, "span")[0] ?? ""
    expect(block).toContain("animation: ui-spinner-spin var(--ui-spinner-duration) linear infinite")
    expect(block).toContain("@keyframes ui-spinner-spin")
  })

  it("reads only its own tokens and structural keywords", async () => {
    // `animation` is held out and checked on its own below, the same
    // reasoning dialog.test.tsx gives for its `transition` shorthand: the
    // value is a whole shorthand naming a keyframes identifier and the
    // `linear`/`infinite` keywords beside its token, not a single value a
    // generic scan should judge.
    const styles = stylesOf(await renderToHtml(<Spinner />))
    const offenders = [...styles.matchAll(/([\w-]+)\s*:\s*([^;{}]+)[;}]/g)]
      .filter(([, property]) => property !== "animation")
      .map(([, , value]) => (value ?? "").trim())
      .filter((value) => !keywords.has(value) && !/^var\(--ui-spinner-[\w-]+\)$/.test(value))
    expect(offenders).toEqual([])
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    const html = await renderToHtml(<Spinner />)
    const read = new Set(
      [...stylesOf(html).matchAll(/var\(--(ui-spinner-[\w-]+)\)/g)].map((match) => match[1] ?? ""),
    )
    expect([...read].sort()).toEqual(Object.keys(spinnerTokens).sort())
  })

  it("renders complete markup with no script", async () => {
    expect(await renderToHtml(<Spinner />)).not.toContain("<script")
  })
})
