import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, markupOf, sharedProperties, stylesOf, valuesOf } from "../../../test/styles.ts"
import { Switch } from "./switch.tsx"
import { switchTokens } from "./tokens.ts"

const keywords = new Set([
  "none",
  "relative",
  "inline-block",
  "pointer",
  "not-allowed",
  "flex",
  "start",
  "column",
  "absolute",
  '""',
  "0",
  // transitionProperty's value is a bare keyword naming a CSS property, not a
  // themeable quantity — same reasoning as dialog.test.tsx's own "background,
  // color" entry.
  "background",
  "translate",
])

/** Every var() a value names, so a calc() of several tokens reads as several. */
const referencesOf = (value: string): string[] =>
  [...value.matchAll(/var\(--([\w-]+)\)/g)].map((match) => match[1] ?? "")

/**
 * True for a value that is entirely tokens, keywords and calc() arithmetic —
 * the check `dialog.test.tsx` uses for its own `enter-offset` translate, and
 * the one this component's own `calc()` thumb-travel distance needs too.
 *
 * A calc() is decomposed rather than waved through, so
 * `calc(var(--ui-switch-track-inset) + 4px)` is still an offender. What may
 * be left of one is `calc`, its operators, parentheses and commas, and a
 * `* 2` doubling for the thumb travel's two insets. Any other digit or
 * percent sign survives the sieve and makes the value unclean.
 */
const isCleanValue = (value: string): boolean => {
  if (keywords.has(value)) return true

  const references = referencesOf(value)

  if (references.length === 0) return false

  if (!references.every((name) => name.startsWith("ui-switch-"))) return false

  const rest = value
    .replace(/var\(--[\w-]+\)/g, "")
    .replace(/\* 2\b/g, "")
    .replace(/calc|[()+\-*/,\s]/g, "")

  return rest === ""
}

describe("Switch", () => {
  it("is a real checkbox with role=switch, bound to its label", async () => {
    const markup = markupOf(await renderToHtml(<Switch label="Dark mode" name="dark-mode" />))

    expect(markup).toContain('type="checkbox"')
    expect(markup).toContain('role="switch"')
    expect(markup).toContain('id="dark-mode"')
    expect(markup).toContain('for="dark-mode"')
  })

  it("checks and disables from plain props", async () => {
    const markup = markupOf(
      await renderToHtml(<Switch checked disabled label="Dark mode" name="dark-mode" />),
    )

    expect(markup).toMatch(/<input[^>]*\schecked(?:\s|>)/)
    expect(markup).toContain('aria-checked="true"')
    expect(markup).toContain("disabled")
  })

  it("starts on from defaultChecked, leaving the switch to the person", async () => {
    const on = markupOf(
      await renderToHtml(<Switch defaultChecked label="Dark mode" name="dark-mode" />),
    )

    const off = markupOf(await renderToHtml(<Switch label="Dark mode" name="dark-mode" />))

    expect(on).toMatch(/<input[^>]*\schecked(?:\s|>)/)
    expect(on).not.toContain("aria-checked")
    expect(off).not.toMatch(/<input[^>]*\schecked(?:\s|>)/)
    expect(off).not.toContain("aria-checked")
  })

  it("mirrors a controlled off state explicitly", async () => {
    const markup = markupOf(
      await renderToHtml(<Switch checked={false} label="Dark mode" name="dark-mode" />),
    )

    expect(markup).toContain('aria-checked="false"')
    expect(markup).not.toMatch(/<input[^>]*\schecked(?:\s|>)/)
  })

  it("draws a label node inside its label", async () => {
    const markup = markupOf(
      await renderToHtml(
        <Switch
          label={
            <>
              Interrupt<span data-more=""> current work</span>
            </>
          }
          name="urgent"
        />,
      ),
    )

    expect(markup).toMatch(
      /<label for="urgent"[^>]*>Interrupt<span data-more=""> current work<\/span><\/label>/,
    )
  })

  it("wires a hint and an error through aria-describedby", async () => {
    const markup = markupOf(
      await renderToHtml(
        <Switch error="Required" hint="This browser only" label="Dark mode" name="dark-mode" />,
      ),
    )

    expect(markup).toContain('aria-describedby="dark-mode-hint dark-mode-error"')
    expect(markup).toContain('aria-invalid="true"')
  })

  it("moves the thumb only in the checked state", async () => {
    const html = await renderToHtml(<Switch label="Dark mode" name="dark-mode" />)
    const trackBlock = blocksOn(html, "input")[0] ?? ""
    const checkedBefore = /&:checked::before\s*\{([^}]*)\}/.exec(trackBlock)?.[1] ?? ""

    expect(checkedBefore).toContain("translate:")
    expect(trackBlock.replace(/&:checked::before[^}]*\}/g, "")).not.toContain(
      "calc(var(--ui-switch-track-width)",
    )
  })

  it("reads only its own tokens and structural keywords", async () => {
    const html = await renderToHtml(
      <Switch
        disabled
        error="Required"
        hint="This browser only"
        label="Dark mode"
        name="dark-mode"
      />,
    )

    const offenders = valuesOf(stylesOf(html)).filter((value) => !isCleanValue(value))

    expect(offenders).toEqual([])
  })

  it("flags a stray literal inside a calc() and clears the thumb's own travel", () => {
    expect(isCleanValue("calc(var(--ui-switch-x) * 3)")).toBe(false)
    expect(isCleanValue("calc(var(--ui-switch-x) + 50%)")).toBe(false)
    expect(isCleanValue("calc(var(--ui-switch-x) + 4px)")).toBe(false)
    expect(
      isCleanValue(
        "calc(var(--ui-switch-track-width) - var(--ui-switch-thumb-size) - var(--ui-switch-track-inset) * 2)",
      ),
    ).toBe(true)
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    // Both states — see checkbox.test.tsx's own note on why one render is not enough.
    const html = await renderToHtml(
      <>
        <Switch error="Required" hint="This browser only" label="Dark mode" name="dark-mode" />
        <Switch disabled label="Auto-save" name="auto-save" />
      </>,
    )

    const read = new Set(
      [...stylesOf(html).matchAll(/var\(--(ui-switch-[\w-]+)\)/g)].map((match) => match[1] ?? ""),
    )

    expect([...read].sort()).toEqual(Object.keys(switchTokens).sort())
  })

  it("keeps each element's blocks disjoint by property", async () => {
    const html = await renderToHtml(
      <Switch
        disabled
        error="Required"
        hint="This browser only"
        label="Dark mode"
        name="dark-mode"
      />,
    )

    for (const tag of ["input", "label"]) {
      const blocks = blocksOn(html, tag)

      expect(blocks.length).toBeGreaterThan(0)
      expect(sharedProperties(blocks)).toEqual([])
    }
  })
})
