import { describe, expect, it } from "bun:test"
import { css } from "remix/ui"
import { renderToHtml } from "../../../../test/render.ts"
import { blocksOn, sharedProperties, stylesOf, valuesOf } from "../../../../test/styles.ts"
import { FieldDemo } from "./field.demo.tsx"
import { Field, fieldControls, fieldTypes } from "./field.tsx"

/**
 * Values a declaration may carry instead of a token. Structural only: nothing
 * here is a colour, a step off the space scale, a duration or a weight.
 */
const keywords = new Set([
  "flex",
  "column",
  "grid",
  "1 / 1",
  "center",
  "end",
  "solid",
  "100%",
  "none",
  "vertical",
  "not-allowed",
])

/** Every var() a value names, so a calc() of two tokens is read as two. */
const referencesOf = (value: string): string[] =>
  [...value.matchAll(/var\(--([\w-]+)\)/g)].map((match) => match[1] ?? "")

/**
 * The values that are neither a listed keyword nor built from this component's
 * own tokens. A calc() is decomposed rather than waved through, so
 * `calc(var(--ui-field-pad-x) + 4px)` is still an offender — which matters,
 * because the select's end padding is the one calc() in the component.
 */
const offendersIn = (styles: string): string[] =>
  valuesOf(styles).filter((value) => {
    if (keywords.has(value)) return false
    const references = referencesOf(value)
    if (references.length === 0) return true
    if (!references.every((name) => name.startsWith("ui-field-"))) return true
    const rest = value.replace(/var\(--[\w-]+\)/g, "").replace(/calc|[()+\-*/\s]/g, "")
    return rest !== ""
  })

/** The ids `aria-describedby` points at, in the order it lists them. */
const describedIds = (html: string): string[] =>
  (/aria-describedby="([^"]*)"/.exec(html)?.[1] ?? "").split(" ").filter((id) => id !== "")

/**
 * The rendered markup with remix's style elements dropped — the complement of
 * `stylesOf`.
 *
 * `renderToHtml` returns the markup and the collected `<style>` blocks in one
 * string, so an assertion about an attribute has to exclude the stylesheet or
 * it is really an assertion about both. `controlBase` emits the selector
 * `&[aria-invalid="true"]` on every render, which makes
 * `expect(html).not.toContain("aria-invalid")` impossible to satisfy and
 * `expect(html).toContain('aria-invalid="true"')` impossible to fail. Both
 * directions are wrong for the same reason.
 */
const markupOf = (html: string): string => html.replace(/<style[\s\S]*?<\/style>/g, "")

describe("Field", () => {
  it("renders a labelled text input by default", async () => {
    const html = await renderToHtml(<Field label="Email" name="email" />)
    expect(html).toContain("<input")
    expect(html).toContain('type="text"')
    expect(html).toContain('name="email"')
    expect(html).toContain("Email")
  })

  it("binds the label to the control it rendered", async () => {
    // The wiring the component exists to make unskippable: read the id out of
    // `for` and require an element carrying it, rather than asserting the
    // string "email" twice and proving only that both were spelled the same.
    const html = await renderToHtml(<Field label="Email" name="email" />)
    const bound = /for="([^"]*)"/.exec(html)?.[1]
    expect(bound).toBeDefined()
    expect(html).toContain(`id="${bound}"`)
  })

  it("takes the id stem from name, and lets id replace it", async () => {
    // The escape hatch for two forms on one page sharing a field name.
    const html = await renderToHtml(<Field id="billing-email" label="Email" name="email" />)
    expect(html).toContain('id="billing-email"')
    expect(html).toContain('for="billing-email"')
    expect(html).toContain('name="email"')
  })

  it("describes the control with no messages when it has none", async () => {
    const html = await renderToHtml(<Field label="Email" name="email" />)
    expect(markupOf(html)).not.toContain("aria-describedby")
  })

  it("names only the messages it actually rendered", async () => {
    // Pointing aria-describedby at an id that is not in the document is its
    // own silent failure: some assistive technology reads nothing at all.
    const hintOnly = await renderToHtml(<Field hint="Work address" label="Email" name="email" />)
    expect(describedIds(hintOnly)).toEqual(["email-hint"])

    const both = await renderToHtml(
      <Field error="Already registered" hint="Work address" label="Email" name="email" />,
    )
    expect(describedIds(both)).toEqual(["email-hint", "email-error"])

    const errorOnly = await renderToHtml(
      <Field error="Already registered" label="Email" name="email" />,
    )
    expect(describedIds(errorOnly)).toEqual(["email-error"])

    for (const html of [hintOnly, both, errorOnly]) {
      for (const id of describedIds(html)) expect(html).toContain(`id="${id}"`)
    }
  })

  it("marks the control invalid only when an error is passed", async () => {
    // markupOf, not the raw html: controlBase's `&[aria-invalid="true"]`
    // selector is in the stylesheet on every render, so the negative
    // assertion could never pass and the positive one could never fail.
    const plain = markupOf(await renderToHtml(<Field label="Email" name="email" />))
    expect(plain).not.toContain("aria-invalid")
    const withError = markupOf(
      await renderToHtml(<Field error="Already registered" label="Email" name="email" />),
    )
    expect(withError).toContain('aria-invalid="true"')
  })

  it("hides the required marker from assistive technology", async () => {
    // `required` is on the control, and that is what gets announced. The
    // asterisk is for eyes only, so it must not be read out as well.
    const html = markupOf(await renderToHtml(<Field label="Email" name="email" required />))
    expect(html).toContain(" required")
    expect(html).toContain('aria-hidden="true"')
    // A component that dropped the asterisk but kept the span would satisfy
    // both assertions above, so the marker's own content is checked too.
    expect(html).toContain(" *</span>")
    expect(markupOf(await renderToHtml(<Field label="Email" name="email" />))).not.toContain(
      "aria-hidden",
    )
  })

  it("renders every type it offers, which the compiler no longer checks", async () => {
    // `inputTypeAttribute` asserts the union down to one literal, because
    // remix/ui types <input> as a union discriminated on `type`. That buys
    // the element a typecheck at the cost of checking the value, so the
    // value is checked here instead — derived from fieldTypes, so a type
    // added to the list is a type this covers.
    for (const type of fieldTypes) {
      expect(markupOf(await renderToHtml(<Field label="X" name="x" type={type} />))).toContain(
        `type="${type}"`,
      )
    }
  })

  it("passes the constraint attributes through to the control", async () => {
    // No JavaScript validation anywhere: these attributes are the validation.
    const html = await renderToHtml(
      <Field label="Age" max={120} min={18} name="age" required step={1} type="number" />,
    )
    expect(html).toContain('type="number"')
    expect(html).toContain('min="18"')
    expect(html).toContain('max="120"')
    expect(html).toContain('step="1"')
    expect(markupOf(html)).toContain(" required")

    const text = await renderToHtml(
      <Field
        autocomplete="email"
        label="Email"
        maxlength={80}
        minlength={5}
        name="email"
        pattern="[^@]+@[^@]+"
        placeholder="you@example.com"
        readonly
        type="email"
        value="a@b.co"
      />,
    )
    expect(text).toContain('autocomplete="email"')
    expect(text).toContain('minlength="5"')
    expect(text).toContain('maxlength="80"')
    expect(text).toContain('pattern="[^@]+@[^@]+"')
    expect(text).toContain('placeholder="you@example.com"')
    expect(text).toContain('value="a@b.co"')
    expect(markupOf(text)).toContain(" readonly")
  })

  it("renders the disabled attribute", async () => {
    const html = markupOf(await renderToHtml(<Field disabled label="Email" name="email" />))
    expect(html).toContain(" disabled")
  })

  it("reads only its own tokens and structural keywords", async () => {
    // The machine-checkable form of "no component hard-codes a colour,
    // radius, duration or space step".
    const html = await renderToHtml(
      <Field error="Already registered" hint="Work address" label="Email" name="email" required />,
    )
    expect(offendersIn(stylesOf(html))).toEqual([])
  })

  it("keeps the control's own blocks property-disjoint", async () => {
    const html = await renderToHtml(<Field label="Email" name="email" />)
    const blocks = blocksOn(html, "input")
    // Non-empty first: sharedProperties([]) is [], so an empty list would
    // satisfy the assertion below without proving anything.
    expect(blocks.length).toBeGreaterThan(1)
    expect(sharedProperties(blocks)).toEqual([])
  })

  it("declares no padding shorthand, which the disjointness check cannot see", async () => {
    // `padding-inline` in one block and `padding-inline-end` in another
    // conflict in CSS while sharedProperties() sees two different names and
    // passes. Longhands throughout is what closes that.
    const html = await renderToHtml(<Field label="Email" name="email" />)
    const styles = stylesOf(html)
    expect(styles).not.toContain("padding-inline:")
    expect(styles).not.toContain("padding-block:")
    expect(styles).not.toContain("padding:")
    expect(styles).toContain("padding-inline-start:")
    expect(styles).toContain("padding-inline-end:")
    expect(styles).toContain("padding-block-start:")
    expect(styles).toContain("padding-block-end:")
  })

  it("wins the invalid cascade from inside the control's own block", async () => {
    // Both invalid selectors override border-color and background, which the
    // same block declares. In a separate block, sub-layer order would decide
    // which paints, and that order follows render order rather than source.
    const html = await renderToHtml(<Field label="Email" name="email" />)
    const base = blocksOn(html, "input").find((block) =>
      block.includes("border-color: var(--ui-field-border)"),
    )
    expect(base).toBeDefined()
    expect(base).toContain("&:user-invalid")
    expect(base).toContain('&[aria-invalid="true"]')
    expect(base).toContain("&:disabled")
    expect(base).toContain("&[readonly]")
  })

  it("styles no focus ring, leaving the reset's to apply", async () => {
    expect(stylesOf(await renderToHtml(<Field label="Email" name="email" />))).not.toContain(
      "outline",
    )
  })

  it("puts mix on the wrapper and not on the control", async () => {
    // Documented as the wrapper's, because that is the element a surrounding
    // layout has business placing. A control property goes through a token.
    const placed = css({ gridColumn: "span 2" })
    const html = await renderToHtml(<Field label="Email" mix={placed} name="email" />)
    const onWrapper = blocksOn(html, "div").some((block) => block.includes("grid-column"))
    const onControl = blocksOn(html, "input").some((block) => block.includes("grid-column"))
    expect([onWrapper, onControl]).toEqual([true, false])
  })
})

describe("Field, as a textarea", () => {
  it("renders a labelled textarea", async () => {
    const html = await renderToHtml(<Field control="textarea" label="Notes" name="notes" />)
    expect(html).toContain("<textarea")
    expect(html).toContain('id="notes"')
    expect(html).toContain('for="notes"')
  })

  it("renders its value as the element's text, where remix puts it", async () => {
    // `<textarea>{value}</textarea>` renders an empty textarea: remix drops a
    // textarea's children, silently. The `value` prop is the only way in, and
    // that inverts the plain-HTML arrangement where the value is the content.
    const html = await renderToHtml(
      <Field control="textarea" label="Notes" name="notes" value="typed earlier" />,
    )
    expect(html).toContain("<textarea")
    expect(html).toContain("typed earlier")
  })

  it("takes rows and the length constraints", async () => {
    const html = await renderToHtml(
      <Field
        control="textarea"
        label="Notes"
        maxlength={500}
        minlength={10}
        name="notes"
        placeholder="Anything else?"
        required
        rows={4}
      />,
    )
    expect(html).toContain('rows="4"')
    expect(html).toContain('minlength="10"')
    expect(html).toContain('maxlength="500"')
    expect(html).toContain('placeholder="Anything else?"')
    expect(markupOf(html)).toContain(" required")
  })

  it("passes readonly through, spelled camelCase because that is the only spelling remix/ui's textarea props declare", async () => {
    // TextareaHTMLProps has only `readOnly`; PartialInputHTMLProps has both
    // spellings. field.tsx's readOnly={props.readonly} on the textarea is that
    // constraint, not an inconsistency with the input branch's readonly=. Both
    // still emit lowercase `readonly` in the markup.
    const html = markupOf(
      await renderToHtml(<Field control="textarea" label="Notes" name="notes" readonly />),
    )
    expect(html).toContain(" readonly")
  })

  it("declares no height, so rows decides it", async () => {
    // An input is a fixed --control-h box. A textarea is as tall as the rows
    // it was given, and a height would fight that.
    const html = await renderToHtml(<Field control="textarea" label="Notes" name="notes" />)
    const blocks = blocksOn(html, "textarea")
    expect(blocks.length).toBeGreaterThan(1)
    expect(blocks.some((block) => block.includes("height:"))).toBe(false)
  })

  it("keeps the textarea's blocks property-disjoint", async () => {
    const html = await renderToHtml(<Field control="textarea" label="Notes" name="notes" />)
    const blocks = blocksOn(html, "textarea")
    expect(blocks.length).toBeGreaterThan(1)
    expect(sharedProperties(blocks)).toEqual([])
  })

  it("reads only its own tokens and structural keywords", async () => {
    const html = await renderToHtml(
      <Field control="textarea" error="Too short" hint="Optional" label="Notes" name="notes" />,
    )
    expect(offendersIn(stylesOf(html))).toEqual([])
  })
})

describe("Field, as a select", () => {
  const plans = (
    <>
      <option value="free">Free</option>
      <option selected value="team">
        Team
      </option>
    </>
  )

  it("renders a labelled select carrying its options", async () => {
    const html = await renderToHtml(
      <Field control="select" label="Plan" name="plan">
        {plans}
      </Field>,
    )
    expect(html).toContain("<select")
    expect(html).toContain('id="plan"')
    expect(html).toContain('for="plan"')
    expect(html).toContain('<option value="free"')
    expect(html).toContain("selected")
  })

  it("passes required and disabled through to the select", async () => {
    // markupOf, not the raw html: controlBase's &:disabled selector is in the
    // stylesheet on every render, so an unqualified assertion could not fail.
    const html = markupOf(
      await renderToHtml(
        <Field control="select" disabled label="Plan" name="plan" required>
          {plans}
        </Field>,
      ),
    )
    expect(html).toContain(" required")
    expect(html).toContain(" disabled")
  })

  it("drops the native appearance and draws a chevron instead", async () => {
    const html = await renderToHtml(
      <Field control="select" label="Plan" name="plan">
        {plans}
      </Field>,
    )
    expect(stylesOf(html)).toContain("appearance: none")
    expect(html).toContain("<svg")
    expect(html).toContain("<path")
  })

  it("hides the chevron from assistive technology and from the pointer", async () => {
    // It is decoration over a control: announcing it adds noise, and catching
    // a click on it would swallow the click that opens the select.
    const html = await renderToHtml(
      <Field control="select" label="Plan" name="plan">
        {plans}
      </Field>,
    )
    expect(/<svg[^>]*aria-hidden="true"/.test(html)).toBe(true)
    expect(stylesOf(html)).toContain("pointer-events: none")
  })

  it("colours the chevron from a token, so it follows a dark scheme", async () => {
    // The reason it is markup rather than a background-image data URI: var()
    // does not resolve inside url(), so that arrow's colour is a literal no
    // theme can reach.
    const html = await renderToHtml(
      <Field control="select" label="Plan" name="plan">
        {plans}
      </Field>,
    )
    const blocks = blocksOn(html, "svg")
    expect(blocks.length).toBe(1)
    expect(blocks[0]).toContain("color: var(--ui-field-chevron-ink)")
  })

  it("leaves room for the chevron in the control's end padding", async () => {
    const html = await renderToHtml(
      <Field control="select" label="Plan" name="plan">
        {plans}
      </Field>,
    )
    expect(stylesOf(html)).toContain(
      "padding-inline-end: calc(var(--ui-field-pad-x) + var(--ui-field-chevron-space))",
    )
  })

  it("keeps the select's blocks property-disjoint", async () => {
    const html = await renderToHtml(
      <Field control="select" label="Plan" name="plan">
        {plans}
      </Field>,
    )
    const blocks = blocksOn(html, "select")
    expect(blocks.length).toBeGreaterThan(1)
    expect(sharedProperties(blocks)).toEqual([])
  })

  it("reads only its own tokens and structural keywords, calc included", async () => {
    // offendersIn() decomposes a calc() rather than waving it through, so a
    // literal hidden inside the end padding is still an offender.
    const html = await renderToHtml(
      <Field control="select" error="Pick one" hint="Change anytime" label="Plan" name="plan">
        {plans}
      </Field>,
    )
    expect(offendersIn(stylesOf(html))).toEqual([])
  })
})

describe("FieldDemo", () => {
  it("renders every kind Field offers", async () => {
    // Derived from fieldControls, so a kind the component gains is a kind this
    // demo has to show.
    const html = await renderToHtml(<FieldDemo />)
    for (const control of fieldControls) expect(html).toContain(`<${control}`)
  })

  it("submits with no client JavaScript, which is the whole point", async () => {
    // A GET form with no action submits to the current URL, so the catalogue
    // route reloads with the values in the query string.
    const html = await renderToHtml(<FieldDemo />)
    expect(html).toContain('method="get"')
    expect(html).toContain('type="submit"')
  })

  it("shows the states a caller has to be able to see", async () => {
    // markupOf, because controlBase's own selectors put `aria-invalid="true"`
    // and `readonly` in the stylesheet on every render — asserted against the
    // raw html, two of these four would pass with no such field on the page.
    const html = markupOf(await renderToHtml(<FieldDemo />))
    expect(html).toContain(" required")
    expect(html).toContain(" disabled")
    expect(html).toContain(" readonly")
    expect(html).toContain('aria-invalid="true"')
  })
})
