import { describe, expect, it } from "bun:test"
import { css, type Handle } from "remix/component"
import { renderToHtml } from "../../../test/render.ts"
import {
  blocksOn,
  markupOf,
  sharedProperties,
  stylesOf,
  topLevelPropertiesOf,
  valuesOf,
} from "../../../test/styles.ts"
import { motionKeywords } from "../motion/motion.ts"
import { FieldDemo } from "./field.demo.tsx"
import { Field, type FieldProps, fieldControls, fieldTypes } from "./field.tsx"
import { fieldTokens } from "./tokens.ts"

/** The first host element of `type` in a render's element tree: props the markup cannot show. */
const hostElement = (
  node: unknown,
  type: string,
): { readonly props: Record<string, unknown> } | undefined => {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = hostElement(child, type)

      if (found !== undefined) return found
    }

    return undefined
  }

  if (typeof node !== "object" || node === null || !("props" in node)) return undefined

  const element = node as { readonly type: unknown; readonly props: Record<string, unknown> }

  return element.type === type ? element : hostElement(element.props.children, type)
}

/**
 * Values a declaration may carry instead of a token. Structural only: nothing
 * here is a colour, a step off the space scale, a duration or a weight.
 */
const keywords = new Set([
  // Motion: the shared keyframes' values, and the one animation Field times
  // from its own error tokens.
  ...motionKeywords,
  "ui-motion-shake var(--ui-field-error-duration) var(--ui-field-error-easing)",
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
  // The customizable select: the appearance value that opts in, the pointer
  // its rows take, the order and margin that put the checkmark last, and the
  // opacity its list closes to.
  "base-select",
  "pointer",
  "1",
  "auto",
  "0",
  // The chosen value in the closed select: a button that takes the select's
  // type and ink, and one line cut with an ellipsis, icons inline beside it.
  // The open list's rows wrap instead: normal flow and anywhere breaking so a
  // long option stays inside the capped picker.
  "inherit",
  "block",
  "hidden",
  "nowrap",
  "normal",
  "anywhere",
  "ellipsis",
  "inline",
  "middle",
])

/** Every var() a value names, so a calc() of two tokens is read as two. */
const referencesOf = (value: string): string[] =>
  [...value.matchAll(/var\(--([\w-]+)\)/g)].map((match) => match[1] ?? "")

/**
 * The values that are neither a listed keyword nor built from this component's
 * own tokens. A calc() is decomposed rather than waved through, so
 * `calc(var(--ui-field-pad-x) + 4px)` is still an offender — which matters,
 * because the select's end padding and the picker's entry offset are calc()s.
 * What may be left of one is its operators, a negation and a bare zero; of a
 * transition, the properties it names and `allow-discrete`.
 */
const offendersIn = (styles: string): string[] =>
  valuesOf(styles).filter((value) => {
    if (keywords.has(value)) return false

    const references = referencesOf(value)

    if (references.length === 0) return true

    if (!references.every((name) => name.startsWith("ui-field-"))) return true

    const rest = value
      .replace(/var\(--[\w-]+\)/g, "")
      .replace(/\b(opacity|translate|overlay|display|allow-discrete)\b/g, "")
      .replace(/\* -1\b|\b0\b/g, "")
      .replace(/min|calc|[()+\-*/\s,%\d]/g, "")

    return rest !== ""
  })

/** The declarations of the rule whose selector is exactly `selector`, innermost rules only. */
const ruleIn = (styles: string, selector: string): string | undefined =>
  [...styles.matchAll(/([^{};]+)\{([^{}]*)\}/g)].find((match) => match[1]?.trim() === selector)?.[2]

/** The select's own block that holds the customizable select, behind its gate. */
const pickerBlockOf = (html: string): string =>
  blocksOn(html, "select").find((block) => block.includes("@supports (appearance: base-select)")) ??
  ""

/** The ids `aria-describedby` points at, in the order it lists them. */
const describedIds = (html: string): string[] =>
  (/aria-describedby="([^"]*)"/.exec(html)?.[1] ?? "").split(" ").filter((id) => id !== "")

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

  it("treats an empty id the same as absent, falling back to name", async () => {
    // `id={override ?? ""}` from a controller is ordinary, and `??` alone
    // would let "" through: `for=""`/`id=""` bind nothing, and the message
    // ids would collapse to bare "-hint"/"-error" suffixes.
    const html = markupOf(
      await renderToHtml(<Field hint="Work address" id="" label="Email" name="email" />),
    )

    expect(html).toContain('id="email"')
    expect(html).toContain('for="email"')
    expect(html).toContain('id="email-hint"')
    expect(html).not.toContain('id=""')
    expect(html).not.toContain('for=""')
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
      for (const id of describedIds(html)) {
        // Exactly once, not merely present: the spec is "every id in
        // aria-describedby exists exactly once in the markup", and toContain
        // cannot fail on a duplicate id.
        const count = [...html.matchAll(new RegExp(`id="${id}"`, "g"))].length

        expect(count).toBe(1)
      }
    }
  })

  it("treats an empty hint or error as absent", async () => {
    // "" is the obvious way a form controller encodes "no message for this
    // field" — a bare falsy check already treats it as absent, but this
    // pins the behaviour down: no aria-describedby, no aria-invalid, no
    // empty <p>.
    const html = markupOf(await renderToHtml(<Field error="" hint="" label="Email" name="email" />))

    expect(html).not.toContain("aria-describedby")
    expect(html).not.toContain("aria-invalid")
    expect(html).not.toContain("<p")
  })

  it("renders the hint and error text, not just their ids", async () => {
    // Two empty <p>s would satisfy the id assertions above without
    // rendering anything a user could read.
    const html = await renderToHtml(
      <Field error="Already registered" hint="Work address" label="Email" name="email" />,
    )

    expect(html).toContain("Work address")
    expect(html).toContain("Already registered")
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
    // The "only" in this test's name: a hint with no error must not be read as
    // invalid. Mutating `invalid` to `(hasError || hasHint) ? "true" : undefined`
    // would announce a non-existent error and redden the control, and nothing
    // above renders this case.
    const hintOnly = markupOf(
      await renderToHtml(<Field hint="Work address" label="Email" name="email" />),
    )

    expect(hintOnly).not.toContain("aria-invalid")
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

  it("renders no asterisk when required is explicitly false", async () => {
    // A `=== true` check loosened to `!== undefined` would still pass every
    // other test here, since none of them renders `required={false}`.
    const html = markupOf(await renderToHtml(<Field label="Email" name="email" required={false} />))

    expect(html).not.toContain("aria-hidden")
    expect(html).not.toContain(" *</span>")
  })

  it("renders every type it offers, which the compiler no longer checks", async () => {
    // `inputTypeAttribute` asserts the union down to one literal, because
    // remix/component types <input> as a union discriminated on `type`. That buys
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

  it("asks a phone for the keyboard a number takes", async () => {
    const html = markupOf(
      await renderToHtml(<Field inputmode="decimal" label="Budget" name="budget" />),
    )

    expect(html).toContain('inputmode="decimal"')
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
    // With border-width set and no border-style, the control paints no
    // border at all — border-style: solid is what makes border-width visible.
    expect(base).toContain("border-style: solid")
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

  it("carries the wrapper's gap token in its own block", async () => {
    const html = await renderToHtml(<Field label="Email" name="email" />)

    expect(blocksOn(html, "div")[0]).toContain("gap: var(--ui-field-gap)")
  })

  it("carries the label's ink token in its own block", async () => {
    const html = await renderToHtml(<Field label="Email" name="email" />)

    expect(blocksOn(html, "label")[0]).toContain("color: var(--ui-field-label-ink)")
  })

  it("carries the required marker's ink token in its own block", async () => {
    const html = await renderToHtml(<Field label="Email" name="email" required />)

    expect(blocksOn(html, "span")[0]).toContain("color: var(--ui-field-required-ink)")
  })

  it("carries the hint's ink token in its own block", async () => {
    // hint only, no error: blocksOn reads the first <p>, and a render with
    // both messages would make this assertion true of whichever message
    // happens to come first rather than of the hint specifically.
    const html = await renderToHtml(<Field hint="Work address" label="Email" name="email" />)

    expect(blocksOn(html, "p")[0]).toContain("color: var(--ui-field-hint-ink)")
  })

  it("carries the error's ink token in its own block", async () => {
    // error only, no hint — the complement of the hint assertion above.
    const html = await renderToHtml(<Field error="Already registered" label="Email" name="email" />)

    expect(blocksOn(html, "p")[0]).toContain("color: var(--ui-field-error-ink)")
  })

  it("carries the input's height token in its own block", async () => {
    const html = await renderToHtml(<Field label="Email" name="email" />)

    expect(
      blocksOn(html, "input").some((block) => block.includes("height: var(--ui-field-height)")),
    ).toBe(true)
  })

  it("emits no --ui-field-* variable outside its own token contract", async () => {
    // offendersIn accepts any var(--ui-field-*) reference without checking it
    // resolves to anything, so a typo'd token name — e.g.
    // --ui-field-chevron-inks — would satisfy it, resolve to nothing at
    // runtime, and fail no other test.
    //
    // What this does not cover: that a token is read by the *right*
    // declaration. Swapping controlBase's `font-size` to read
    // `--ui-field-label-size` instead of `--ui-field-font-size` still names a
    // token this test recognises and offendersIn cannot see, so both pass.
    const renders = [
      await renderToHtml(<Field error="e" hint="h" label="Email" name="email" required />),
      await renderToHtml(
        <Field control="textarea" error="e" hint="h" label="Notes" name="notes" required />,
      ),
      await renderToHtml(
        <Field control="select" error="e" hint="h" label="Plan" name="plan" required>
          <option value="a">A</option>
        </Field>,
      ),
    ]

    const names = renders.flatMap((html) =>
      [...stylesOf(html).matchAll(/var\(--(ui-field-[\w-]+)\)/g)].map((match) => match[1] ?? ""),
    )

    expect(names.length).toBeGreaterThan(0)

    for (const name of names) expect(Object.hasOwn(fieldTokens, name)).toBe(true)
  })
})

describe("Field, as a textarea", () => {
  it("renders a labelled textarea", async () => {
    const html = await renderToHtml(<Field control="textarea" label="Notes" name="notes" />)

    expect(html).toContain("<textarea")
    expect(html).toContain('id="notes"')
    expect(html).toContain('for="notes"')
    expect(html).toContain('name="notes"')
  })

  it("wires aria-describedby and aria-invalid on the textarea", async () => {
    // The wiring the component exists to make unskippable, and the reason
    // this branch is tested separately from the input's: the suite already
    // caught these gaps disappearing here without noticing.
    const html = await renderToHtml(
      <Field control="textarea" error="Too short" hint="Optional" label="Notes" name="notes" />,
    )

    expect(describedIds(html)).toEqual(["notes-hint", "notes-error"])
    expect(markupOf(html)).toContain('aria-invalid="true"')
  })

  it("renders the disabled attribute on the textarea", async () => {
    const html = markupOf(
      await renderToHtml(<Field control="textarea" disabled label="Notes" name="notes" />),
    )

    expect(html).toContain(" disabled")
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

  it("leaves value and defaultValue off its control unless given", () => {
    // remix clears a host prop present as undefined on every re-render, so a
    // hydrated field holding the key with no value lost what was typed.
    const tree = Field({ props: { label: "Email", name: "email" } } as Handle<FieldProps>)()
    const input = hostElement(tree, "input")

    expect(input === undefined ? [] : Object.keys(input.props)).not.toContain("value")
    expect(input === undefined ? [] : Object.keys(input.props)).not.toContain("defaultValue")
    expect(input).toBeDefined()
  })

  it("keeps a required select's prompt out of its list, where the engine draws the list", async () => {
    const html = await renderToHtml(
      <Field control="select" label="Project" name="project" required>
        <option value="">Choose one</option>
        <option value="shop">shop</option>
      </Field>,
    )

    const styles = stylesOf(html)

    expect(styles).toMatch(
      /@supports \(appearance: base-select\)[\s\S]*&:required option\[value=''\]\s*\{\s*display: none;/,
    )
  })

  it("renders a starting value as the same attribute, for a field the person then owns", async () => {
    const input = await renderToHtml(<Field defaultValue="a@b.co" label="Email" name="email" />)
    const notes = await renderToHtml(
      <Field control="textarea" defaultValue="typed earlier" label="Notes" name="notes" />,
    )

    expect(input).toContain('value="a@b.co"')
    expect(notes).toContain("typed earlier</textarea>")
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

  it("passes readonly through, spelled camelCase because that is the only spelling remix/component's textarea props declare", async () => {
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
    expect(html).toContain('name="plan"')
  })

  it("wires aria-describedby and aria-invalid on the select", async () => {
    const html = await renderToHtml(
      <Field control="select" error="Pick one" hint="Change anytime" label="Plan" name="plan">
        {plans}
      </Field>,
    )

    expect(describedIds(html)).toEqual(["plan-hint", "plan-error"])
    expect(markupOf(html)).toContain('aria-invalid="true"')
  })

  it("keeps the select frame a grid, so the chevron overlays it", async () => {
    // Without this, the frame stops being a grid and the chevron falls out
    // of its cell below the select — invisible to the disjointness test,
    // which only checks that properties don't collide, not what they are.
    const html = await renderToHtml(
      <Field control="select" label="Plan" name="plan">
        {plans}
      </Field>,
    )

    // The first div is the wrapper; the frame is the second. Self-checking
    // rather than trusting the index: a <div> added before the frame would
    // silently retarget occurrence 1 at the wrapper without this failing, so
    // the wrapper's own block set is asserted to differ from the frame's.
    const wrapper = blocksOn(html, "div", 0)
    const frame = blocksOn(html, "div", 1)

    expect(frame[0]).toContain("display: grid")
    expect(frame).not.toEqual(wrapper)
  })

  it("gives the control and the chevron the same grid cell", async () => {
    // The frame's display: grid check catches the chevron falling out of the
    // grid entirely; this catches either child losing its own grid-area,
    // which breaks the overlay one step down without breaking that check.
    const html = await renderToHtml(
      <Field control="select" label="Plan" name="plan">
        {plans}
      </Field>,
    )

    expect(blocksOn(html, "select").some((block) => block.includes("grid-area: 1 / 1"))).toBe(true)
    expect(blocksOn(html, "svg").some((block) => block.includes("grid-area: 1 / 1"))).toBe(true)
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

    expect(blocksOn(html, "select").some((block) => block.includes("appearance: none"))).toBe(true)
    expect(html).toContain("<svg")
    expect(html).toContain("<path")
  })

  it("gives the select no block padding, so its text centres in the fixed height", async () => {
    // Chromium lays a select's text out from the top of its content box: two
    // pad-y steps and a line taller than the height left clip it at the
    // bottom. An input centres its text, so it keeps the padding.
    const select = await renderToHtml(
      <Field control="select" label="Plan" name="plan">
        {plans}
      </Field>,
    )

    // Its own box only: the customizable select's option rows nest their
    // padding inside the same block, and those rows are not the select.
    const own = blocksOn(select, "select").flatMap((block) => topLevelPropertiesOf(block))

    expect(own.some((property) => property.startsWith("padding-block"))).toBe(false)
    const input = await renderToHtml(<Field label="Email" name="email" />)

    expect(blocksOn(input, "input").some((block) => block.includes("padding-block-start"))).toBe(
      true,
    )
  })

  it("draws the chevron with the exact glyph geometry, not just some path", async () => {
    // toContain("<path") passes for a path drawing nothing, or the wrong
    // shape. viewBox, d, fill and stroke-width can each drift independently,
    // so each is pinned. The glyph is a design decision, so this is
    // intentional pinning, not over-fitting.
    const html = await renderToHtml(
      <Field control="select" label="Plan" name="plan">
        {plans}
      </Field>,
    )

    expect(html).toContain('viewBox="0 0 12 12"')
    expect(html).toContain('fill="none"')
    expect(html).toContain('d="M3 4.5L6 7.5L9 4.5"')
    expect(html).toContain('stroke-width="1.5"')
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
    expect(blocksOn(html, "svg")[0]).toContain("pointer-events: none")
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
    // offendersIn scans CSS only, so a hard-coded colour on the <path>
    // markup attribute is invisible to the contract check.
    expect(html).toContain('stroke="currentColor"')
  })

  it("leaves room for the chevron in the control's end padding", async () => {
    const html = await renderToHtml(
      <Field control="select" label="Plan" name="plan">
        {plans}
      </Field>,
    )

    expect(
      blocksOn(html, "select").some((block) =>
        block.includes(
          "padding-inline-end: calc(var(--ui-field-pad-x) + var(--ui-field-chevron-space))",
        ),
      ),
    ).toBe(true)
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

  it("puts the chosen option's whole content in every closed select", async () => {
    // A customizable select clones the chosen option into <selectedcontent>
    // inside a <button> that leads the select. Every select renders the pair:
    // the platform's own label is a UA-shadow box no author rule can cut with
    // an ellipsis. An engine without customizable select drops it while parsing.
    const html = await renderToHtml(
      <Field control="select" label="Plan" name="plan">
        {plans}
      </Field>,
    )

    expect(html).toMatch(/<select[^>]*><button[^>]*><selectedcontent><\/selectedcontent><\/button>/)
  })

  it("cuts the chosen value to one line with an ellipsis, its icons inline beside it", async () => {
    // A flex selectedcontent clips but draws no ellipsis: text-overflow needs a
    // block container. Its children go inline, or the reset's svg { display:
    // block } puts an icon on a line of its own.
    const picker = pickerBlockOf(
      await renderToHtml(
        <Field control="select" label="Plan" name="plan">
          {plans}
        </Field>,
      ),
    )

    const content = ruleIn(picker, "& selectedcontent")
    const child = ruleIn(picker, "& selectedcontent > *")

    for (const declaration of [
      "display: block;",
      "min-inline-size: 0;",
      "overflow: hidden;",
      "white-space: nowrap;",
      "text-overflow: ellipsis;",
    ]) {
      expect(content).toContain(declaration)
    }

    expect(child).toContain("display: inline;")
    expect(child).toContain("vertical-align: middle;")
    expect(child).toContain("margin-inline-end: var(--ui-field-option-gap);")
  })

  it("keeps the native control under a customizable select, gated on support", async () => {
    // The picker is the platform's: appearance: base-select on the select
    // and its ::picker(select), behind @supports so an engine without it
    // keeps the plain select.
    const styles = stylesOf(
      await renderToHtml(
        <Field control="select" label="Plan" name="plan">
          {plans}
        </Field>,
      ),
    )

    expect(styles).toContain("@supports (appearance: base-select)")
    expect(styles).toContain("::picker(select)")
    expect(styles).toContain("appearance: base-select")
    expect(styles).toContain("::checkmark")
  })

  it("leaves a disabled select to controlBase's cursor and ink, where the engine draws the list", async () => {
    // The picker's rules sit in selectBox's block, the later sub-layer, so an
    // unconditional pointer or prompt ink there would beat controlBase's
    // `&:disabled`. Both wait for `:enabled` instead.
    const picker = pickerBlockOf(
      await renderToHtml(
        <Field control="select" label="Project" name="project">
          <option value="">Choose one</option>
          <option value="shop">shop</option>
        </Field>,
      ),
    )

    expect(ruleIn(picker, "&")).toBeDefined()
    expect(ruleIn(picker, "&")).not.toContain("cursor")
    expect(ruleIn(picker, "&:enabled")).toContain("cursor: pointer;")
    expect(ruleIn(picker, "&:has(option[value='']:checked)")).toBeUndefined()
    expect(ruleIn(picker, "&:enabled:has(option[value='']:checked)")).toContain(
      "color: var(--ui-field-placeholder-ink);",
    )
  })

  it("moves its list in and out as Popover's surface does, on tokens reduced motion zeroes", async () => {
    // An overlay ships its entry and exit (docs/motion.md): the transition on
    // the picker, held in the top layer and displayed through its exit, and
    // a starting style for the state being entered.
    const picker = pickerBlockOf(
      await renderToHtml(
        <Field control="select" label="Plan" name="plan">
          {plans}
        </Field>,
      ),
    )

    const duration = "var(--ui-field-picker-transition-duration)"
    const timing = `${duration} var(--ui-field-picker-transition-easing)`
    const starting = picker.indexOf("@starting-style")
    const resting =
      /opacity: 0;\s*translate: 0 calc\(var\(--ui-field-picker-enter-offset\) \* -1\);/

    expect(ruleIn(picker, "&::picker(select)")).toContain(
      `transition: opacity ${timing}, translate ${timing}, overlay ${duration} allow-discrete, display ${duration} allow-discrete;`,
    )
    // Closed on :not(:open), so an engine that drew the list without knowing
    // :open would drop the rule and show it, rather than never show it.
    expect(ruleIn(picker, "&::picker(select)")).not.toMatch(/\bopacity:/)
    expect(ruleIn(picker, "&:not(:open)::picker(select)")).toMatch(resting)
    expect(starting).toBeGreaterThan(-1)
    expect(ruleIn(picker.slice(starting), "&:open::picker(select)")).toMatch(resting)
    // The reset zeroes every --dur-* token under prefers-reduced-motion, so a
    // duration read from one is a list that arrives still.
    expect(fieldTokens["ui-field-picker-transition-duration"]).toStartWith("var(--dur-")
  })

  it("caps the open picker's inline size at the viewport's available space, on a token", async () => {
    // At 390px the longest option forced a ~730px picker past the viewport.
    // The cap is min(token, available space) like Popover's surface, so a
    // skin retunes the bound without restating the property.
    const picker = pickerBlockOf(
      await renderToHtml(
        <Field control="select" label="Plan" name="plan">
          {plans}
        </Field>,
      ),
    )

    expect(ruleIn(picker, "&::picker(select)")).toContain(
      "max-inline-size: min(var(--ui-field-picker-max-inline-size), calc(100% - var(--ui-field-picker-gap) * 2));",
    )
    expect(fieldTokens["ui-field-picker-max-inline-size"]).toBe("var(--overlay-max)")
  })

  it("wraps long options inside the capped picker", async () => {
    // Wrapping keeps scrollWidth <= clientWidth, which the browser test
    // asserts on the open option; an ellipsis there would overflow instead.
    const picker = pickerBlockOf(
      await renderToHtml(
        <Field control="select" label="Plan" name="plan">
          {plans}
        </Field>,
      ),
    )

    const option = ruleIn(picker, "& option")

    expect(option).toContain("max-inline-size: 100%;")
    expect(option).toContain("min-inline-size: 0;")
    expect(option).toContain("white-space: normal;")
    expect(option).toContain("overflow-wrap: anywhere;")
  })

  it("shakes a server-invalid control on insertion, on tokens reduced motion zeroes", async () => {
    const shake =
      "animation: ui-motion-shake var(--ui-field-error-duration) var(--ui-field-error-easing);"

    const renders = [
      ["input", await renderToHtml(<Field error="Taken" label="Email" name="email" />)],
      [
        "textarea",
        await renderToHtml(
          <Field control="textarea" error="Too long" label="Notes" name="notes" />,
        ),
      ],
      [
        "select",
        await renderToHtml(
          <Field control="select" error="Pick one" label="Plan" name="plan">
            <option value="a">A</option>
          </Field>,
        ),
      ],
    ] as const

    for (const [tag, html] of renders) {
      const blocks = blocksOn(html, tag)
      const base =
        blocks.find((block) => block.includes("border-color: var(--ui-field-border)")) ?? ""

      expect(ruleIn(base, '&[aria-invalid="true"]')).toContain(shake)
      expect(ruleIn(base, "&:user-invalid")).not.toContain("animation")
      expect(blocks.some((block) => block.includes("@keyframes ui-motion-shake"))).toBe(true)
    }

    expect(fieldTokens["ui-field-error-duration"]).toStartWith("var(--dur-")
    expect(fieldTokens["ui-field-error-easing"]).toStartWith("var(--ease-")
  })

  it("dissolves a search field's clear button on its own tokens, and only on a search field", async () => {
    const html = await renderToHtml(<Field label="Find" name="q" type="search" />)
    const search = blocksOn(html, "input")

    const ruleOf = (selector: string) =>
      search.map((block) => ruleIn(block, selector)).find((found) => found !== undefined)

    const shown = ruleOf("&::-webkit-search-cancel-button")
    const resting = ruleOf("&:placeholder-shown::-webkit-search-cancel-button")

    expect(shown).toContain("opacity: 1;")
    expect(shown).toContain(
      "transition: opacity var(--ui-field-clear-duration) var(--ui-field-clear-easing);",
    )
    expect(resting).toContain("opacity: 0;")
    // :placeholder-shown needs a placeholder to match at all.
    expect(markupOf(html)).toContain('placeholder=" "')
    expect(
      stylesOf(await renderToHtml(<Field label="Email" name="email" type="email" />)),
    ).not.toContain("search-cancel-button")
    expect(fieldTokens["ui-field-clear-duration"]).toStartWith("var(--dur-")
    expect(fieldTokens["ui-field-clear-easing"]).toStartWith("var(--ease-")
  })

  it("keeps a search field's own placeholder, and gives no other field one", async () => {
    const own = await renderToHtml(
      <Field label="Find" name="q" placeholder="Search docs" type="search" />,
    )

    const email = await renderToHtml(<Field label="Email" name="email" type="email" />)

    expect(markupOf(own)).toContain('placeholder="Search docs"')
    expect(markupOf(own)).not.toContain('placeholder=" "')
    expect(markupOf(email)).not.toContain("placeholder=")
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
