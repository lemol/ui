import { describe, expect, it } from "bun:test"
import { css } from "remix/ui"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, markupOf, sharedProperties } from "../../../test/styles.ts"
import { invoke } from "../invocation.ts"
import { DialogPanel } from "./dialog.tsx"
import { dialogTokens } from "./tokens.ts"

/**
 * Values a declaration may carry instead of a token. Structural only: no
 * colour, no space step, no duration, no weight.
 */
const keywords = new Set([
  "grid",
  "flex",
  "start",
  "space-between",
  "center",
  "solid",
  "none",
  "auto",
  "pointer",
  "100%",
  // The two ends of a fade. A token for "invisible" would be a token whose
  // only sane value is the one it has.
  "0",
  "1",
  // transitionProperty's value is a bare keyword list naming CSS properties,
  // not a themeable quantity — there is no token for "which properties
  // transition", only for how long and with what easing, which the close
  // button already reads from --ui-dialog-transition-duration/-easing.
  "background, color",
])

/** Every var() a value names, so a calc() of two tokens reads as two. */
const referencesOf = (value: string): string[] =>
  [...value.matchAll(/var\(--([\w-]+)\)/g)].map((match) => match[1] ?? "")

/**
 * Offenders, with `transition` held out and asserted separately below. The
 * shorthand names properties and the `allow-discrete` keyword beside its
 * tokens, so a generic value check reads it as a literal — and the point of
 * checking it is the pair of declarations, not the vocabulary inside one.
 */
const offendersIn = (styles: string): string[] =>
  [...styles.matchAll(/([\w-]+)\s*:\s*([^;{}]+)[;}]/g)]
    .filter(([, property]) => property !== "transition")
    .map(([, , value]) => (value ?? "").trim())
    .filter((value) => {
      if (keywords.has(value)) return false
      const references = referencesOf(value)
      if (references.length === 0) return true
      if (!references.every((name) => name.startsWith("ui-dialog-"))) return true
      const rest = value.replace(/var\(--[\w-]+\)/g, "").replace(/min|calc|[()+\-*/,\s%\d]/g, "")
      return rest !== ""
    })

const panel = (children?: string) => (
  <DialogPanel close={invoke("close", "new-task")} id="new-task" title="New task">
    {children ?? "Body"}
  </DialogPanel>
)

/**
 * The style blocks this component owns, joined.
 *
 * Not `stylesOf`: DialogPanel renders a `Heading`, whose own `--ui-heading-*`
 * blocks land in the same render output. They are correct and they are not
 * ours, so a contract check that reads them is asserting about another
 * component's tier.
 */
const ownStyles = (html: string): string =>
  ["dialog", "header", "button", "svg"].flatMap((tag) => blocksOn(html, tag)).join("\n")

/** The panel's own block — the `<dialog>` element's, and only it. */
const panelBlockOf = (html: string): string => blocksOn(html, "dialog")[0] ?? ""

describe("DialogPanel", () => {
  it("renders a dialog carrying its id, its title and its children", async () => {
    const markup = markupOf(await renderToHtml(panel()))
    expect(markup).toContain("<dialog")
    expect(markup).toContain('id="new-task"')
    expect(markup).toContain("New task")
    expect(markup).toContain("Body")
  })

  it("names its title through aria-labelledby rather than repeating it", async () => {
    // A modal with no accessible name is the same bug as an unlabelled field,
    // and an aria-label duplicating the visible title drifts the first time
    // one copy is edited.
    const markup = markupOf(await renderToHtml(panel()))
    expect(markup).toContain('aria-labelledby="new-task-title"')
    expect(markup).toContain('id="new-task-title"')
    expect(markup).not.toContain('aria-label="New task"')
  })

  it("renders a close button bound to its own dialog", async () => {
    const markup = markupOf(await renderToHtml(panel()))
    expect(markup).toContain('command="close"')
    expect(markup).toContain('commandfor="new-task"')
    expect(markup).toContain('aria-label="Close"')
  })

  it("reads only its own tokens and structural keywords", async () => {
    expect(offendersIn(ownStyles(await renderToHtml(panel())))).toEqual([])
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    const read = new Set(
      [...ownStyles(await renderToHtml(panel())).matchAll(/var\(--(ui-dialog-[\w-]+)\)/g)].map(
        (match) => match[1] ?? "",
      ),
    )
    expect([...read].sort()).toEqual(Object.keys(dialogTokens).sort())
  })

  it("declares display only in the open state", async () => {
    // The trap this component cannot survive getting wrong: a closed <dialog>
    // is display:none from the UA sheet, and any author display declaration
    // beats it — layered or not. A `display: grid` outside &[open] renders
    // every dialog on the page, open or not.
    const styles = panelBlockOf(await renderToHtml(panel()))
    const openBlock = /&\[open\]\s*\{([^}]*)\}/.exec(styles)?.[1] ?? ""
    expect(openBlock).toContain("display: grid")
    expect(styles.replace(/&\[open\][^}]*\}/g, "")).not.toContain("display: grid")
  })

  it("declares the transition twice, the second with allow-discrete", async () => {
    // motion.md: the first keeps opacity and translate moving where
    // transition-behavior is unknown, and the second upgrades it where it is
    // not. A JS object cannot hold one key twice, so the second sits in a
    // nested `&` block — same specificity, later in source order.
    const styles = panelBlockOf(await renderToHtml(panel()))
    const declarations = [...styles.matchAll(/transition:\s*([^;]+);/g)].map(
      (match) => match[1] ?? "",
    )
    expect(declarations).toHaveLength(2)
    expect(declarations[0]).not.toContain("allow-discrete")
    expect(declarations[1]).toContain("overlay var(--ui-dialog-transition-duration) allow-discrete")
    expect(declarations[1]).toContain("display var(--ui-dialog-transition-duration) allow-discrete")
    for (const declaration of declarations) {
      expect(declaration).not.toMatch(/\d+m?s|cubic-bezier/)
    }

    // Counting the declarations is not enough: "&, &::backdrop" narrowed to
    // "&::backdrop" would still produce two transition: lines, but the panel
    // itself would carry only the allow-discrete declaration — no transition
    // at all on an engine without transition-behavior, which is the exact
    // failure the doubled declaration exists to prevent. Each selector list
    // is captured from the rule enclosing its transition: line, so this
    // fails if either declaration's rule stops including the bare `&`.
    const rules = [...styles.matchAll(/([^{}\n]+)\{\s*transition:\s*[^;]+;\s*\}/g)]
    expect(rules).toHaveLength(2)
    for (const [, selectorList] of rules) {
      const selectors = (selectorList ?? "").split(",").map((selector) => selector.trim())
      expect(selectors).toContain("&")
    }
  })

  it("animates from the state being entered, not the resting one", async () => {
    // @starting-style targeting `dialog` rather than `dialog[open]` is the
    // most common way to get no animation at all.
    const styles = panelBlockOf(await renderToHtml(panel()))
    const startingStyle = /@starting-style\s*\{([\s\S]*?)\n\}/.exec(styles)?.[1] ?? ""
    expect(startingStyle).toContain("&[open]")
    expect(startingStyle).toContain("&[open]::backdrop")
  })

  it("tints the backdrop from its own token", async () => {
    const styles = panelBlockOf(await renderToHtml(panel()))
    expect(styles).toContain("&::backdrop")
    expect(styles).toContain("background: var(--ui-dialog-backdrop-bg)")
  })

  it("gives the panel and the close button their own arms of the contract", async () => {
    // Set equality above proves every token is read somewhere. It does not
    // prove the right element reads it: swapping --ui-dialog-bg for
    // --ui-dialog-close-bg keeps the set identical and paints the panel with
    // the button's fill. That is the failure class the previous component's
    // final review found, one component later.
    const html = await renderToHtml(panel())
    const panelBlock = blocksOn(html, "dialog")[0] ?? ""
    const closeBlock = blocksOn(html, "button")[0] ?? ""
    expect(panelBlock).toContain("background: var(--ui-dialog-bg)")
    expect(panelBlock).toContain("color: var(--ui-dialog-ink)")
    expect(panelBlock).not.toContain("--ui-dialog-close-")
    expect(closeBlock).toContain("background: var(--ui-dialog-close-bg)")
    expect(closeBlock).toContain("color: var(--ui-dialog-close-ink)")
    expect(closeBlock).not.toContain("--ui-dialog-bg")
  })

  it("keeps each element's blocks disjoint by property", async () => {
    const html = await renderToHtml(panel())
    for (const tag of ["dialog", "header", "button", "svg"]) {
      const blocks = blocksOn(html, tag)
      expect({ tag, blocks: blocks.length }).toEqual({ tag, blocks: 1 })
      expect(sharedProperties(blocks)).toEqual([])
    }
  })

  it("adds through mix a property it does not declare itself", async () => {
    const placed = css({ zIndex: 2 })
    const html = await renderToHtml(
      <DialogPanel close={invoke("close", "x")} id="x" mix={placed} title="X">
        Body
      </DialogPanel>,
    )
    expect(blocksOn(html, "dialog").filter((block) => block.includes("z-index"))).toHaveLength(1)
  })
})
