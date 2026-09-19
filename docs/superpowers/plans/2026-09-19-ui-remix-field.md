# Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `Field` in `@lemol/ui-remix`: a native `<input>`, `<textarea>` or
`<select>` with its label, hint and error wired by the component, validated by
the browser, and styled entirely through `--ui-field-*`.

**Architecture:** One component owns the control element, so the `id`, `for`,
`aria-describedby` and `aria-invalid` wiring cannot be skipped by a caller.
`control` is a discriminated union, so an attribute that means nothing on a
kind is not reachable on that kind. Ids derive from the required `name`. The
invalid state has two sources, a server-supplied `error` and native constraint
validation, and both read the same tokens from selectors co-located in the
control's own `css()` block. `Field` is the first component here to style more
than one element, so `test/styles.ts` gains a per-element companion to
`sharedProperties()` before any component code is written.

**Tech Stack:** TypeScript from `src/` with no build step, `remix` 3.0.0-rc.2
(`remix/ui` only), `bun:test`, biome.

## Global Constraints

- **The gate is `bun run check`** — `biome check .`, then `tsc -p tsconfig.json`,
  then `bun test`. Every task ends green.
- **No component hard-codes a colour, radius, duration or space step.** A
  component with something to retheme declares `--ui-*` tokens beside itself,
  each defaulting to a primitive.
- **A component's `css()` blocks must be property-disjoint per element.** Within
  a cascade layer, layer order beats specificity, and sub-layer order follows
  render order rather than source order. When one block must override another
  on the same element, both declarations go in the same block.
- **No shorthand in one block whose longhand another block on the same element
  declares.** `sharedProperties()` compares property names and cannot see it.
- **Nested selectors lead with `&`.** `&`-led nesting is Chrome 112, below the
  floor; bare-element nesting is Chrome 120, above it.
- **Browser baseline: Chrome 114+ / Safari 17+ / Firefox 125+.**
- **SPA-safe.** No `node:*`, no `bun`, no `effect`, no server-side `remix/*`
  entry in any package. `test/boundaries.test.ts` enforces it.
- **No build step, no bundler, no Effect.** `remix` is the only peer dependency.
- **Every component gets a server-render test** using `bun:test` and the helpers
  at `test/render.ts` and `test/styles.ts` (repo root, imported as
  `../../../../test/styles.ts` from a component directory).
- **Formatting:** biome, 2-space indent, width 100, double quotes. Run
  `bun run fix` before committing rather than hand-sorting exports or props.
  Biome sorts JSX attributes alphabetically; the code below is already in that
  order.
- **Commit style:** imperative subject describing the change's point, body
  explaining why. End every commit message with
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

**Spec:** `docs/superpowers/specs/2026-09-19-ui-remix-field-design.md`. Read it
before Task 3 — it holds the reasoning this plan only summarises, including why
the component owns the control rather than wrapping one.

---

## Pre-flight findings

Four questions were probed against this working tree with a throwaway
`*.test.tsx` and then deleted. All four are settled, so no task below carries a
fallback. Two of them changed the spec.

**`remix/ui` emits nested selectors verbatim.** `&:user-invalid`,
`&[aria-invalid="true"]` and `& > svg` all survive into the `<style>` element
with `&` and `>` intact. The escaping hazard `reset.ts` warns about belongs to
`ThemeStyle`, which passes its sheet as a text child.

**`undefined` attributes and `false` booleans are omitted.**
`required={undefined}`, `placeholder={undefined}` and `disabled={false}` all
render nothing, and `required={true}` renders the bare attribute. So every
optional attribute is passed straight through with no conditional spreading,
and a `{cond ? undefined : <p/>}` child renders nothing.

**A `<textarea>`'s children are dropped.** `<textarea>{value}</textarea>`
renders `<textarea></textarea>`, silently. `<textarea value="hi" />` renders
`<textarea>hi</textarea>`. So `value` is a prop on every kind, and `children`
never reaches a textarea.

**A `<select>` has no `value` content attribute.** `<select value="a">` emits
`value="a"`, which is invalid HTML that selects nothing. `FieldSelect` has no
`value` prop; the caller marks the chosen `<option>` with `selected`.

**The union has to be built up one kind at a time.** Narrowing an optional
discriminant works only when every other member has its own `case`. Three
probes, one per stage:

| Union members declared | `switch` arms | `default` narrows to | Typechecks |
| --- | --- | --- | --- |
| all three | `default` only | the whole union | **no** |
| input, textarea | `case "textarea"`, `default` | input | yes |
| all three | `case "textarea"`, `default` | input \| select | **no** |
| all three | both cases, `default` | input | yes |

So a task that declares a kind it does not yet dispatch on cannot compile.
Each task widens `FieldProps` by exactly the member it implements, and the
`switch` appears in Task 4, where it first has something to switch on.

**`remix/ui` types `<input>` as a union discriminated on `type`.** `jsx.d.ts`
maps `input` to `AccessibleInputHTMLProps`, which is
`Omit<PartialInputHTMLProps, "role"> & InputAriaRoles` — and `InputAriaRoles`
is a union with one arm per type, each restricting the `role` valid beside it
and, for the `text`/`search`/`tel`/`url`/`email` arms, forbidding `list`.

A union-typed `type` selects no arm, so `<input type={props.type ?? "text"} />`
does not compile when `props.type` is `FieldType`. `Field` narrows it with one
documented assertion, `inputTypeAttribute`, which is sound because `Field`
passes neither `role` nor `list` — the only attributes any arm constrains.
The assertion costs the compiler's check on the value, so a test loops over
`fieldTypes` and asserts the rendered attribute for all twelve.

---

## File structure

**Repo root** — the test helper, first because every component test needs it.

| File | Responsibility |
| --- | --- |
| `test/styles.ts` | Gains `blocksOn(html, tag)`: the blocks that landed on one element. |
| `test/styles.test.ts` | New. Covers `blocksOn` only, and Task 1 says why only it. |

**`packages/ui-remix`** — the component.

| File | Responsibility |
| --- | --- |
| `src/field/tokens.ts` | Twenty-seven `--ui-field-*` tokens, each defaulting to a primitive. |
| `src/field/field.tsx` | `Field`, the three kinds, ten `css()` blocks, the id wiring. |
| `src/field/field.demo.tsx` | One `<form method="get">`: three kinds, four states, a submit. |
| `src/field/field.test.tsx` | Render, wiring, contract, per-element disjointness, co-location. |
| `src/tokens.ts` | Aggregates `fieldTokens`. |
| `src/index.ts` | Exports `Field` and its types. |
| `src/demos.ts` | One new catalogue entry. |

No new shared module at the package root. Nothing in `Field` is shared with
another component; `space.ts` and `align.ts` exist because three components use
them.

**Docs:** `packages/ui-remix/README.md`, `docs/design-system.md`,
`todo/TODO.md`, and the task file moving to
`todo/done/m1-foundation-and-contract-proof/`.

---

## Task 0: Branch

**Files:** none.

- [ ] **Step 1: Cut a branch from main**

Task 14 landed as a merge into `main`; this follows it.

```bash
git checkout main && git pull --ff-only && git checkout -b task-15-field
git status
```

Expected: `On branch task-15-field`, working tree clean.

---

## Task 1: `blocksOn`, the per-element style helper

`sharedProperties()` compares every block in a rendered document. That was
correct while every component styled exactly one element. `Field` styles up to
six, so the label block's `color` and the control block's `color` would read as
a collision that cannot happen: they are on different elements and never
contend for the same cascade slot.

This helper is the one in `test/styles.ts` that gets its own test, and the
reason is specific. It returns a list, and `sharedProperties([])` is `[]`, so a
bug that returns nothing would make every disjointness assertion in
`field.test.tsx` pass for the wrong reason. The other helpers fail loudly when
they are wrong. This one fails silently, so it is tested directly.

**Files:**
- Modify: `test/styles.ts` (append after `sharedProperties`)
- Create: `test/styles.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `blocksOn(html: string, tag: string): string[]` — the inner text of
  each `<style data-rmx-style="…">` whose hash appears in the class list of the
  first element whose tag is `tag`. Empty when the tag is absent or carries no
  class.

- [ ] **Step 1: Write the failing test**

Create `test/styles.test.ts`:

```ts
import { describe, expect, it } from "bun:test"
import { blocksOn } from "./styles.ts"

/**
 * A document shaped exactly as `remix/ui` writes one: the hash is both the
 * style element's `data-rmx-style` and the class on the element it styles.
 * Built from helpers rather than pasted, so an expectation cannot drift from
 * the fixture it is asserting against.
 */
const block = (hash: string, declaration: string) =>
  `@layer rmx.${hash} { .${hash} {\n  ${declaration};\n} }`

const styleElement = (hash: string, declaration: string) =>
  `<style data-rmx-style="${hash}">${block(hash, declaration)}</style>`

const html =
  "<head>" +
  styleElement("rmxc-aaa", "color: red") +
  styleElement("rmxc-bbb", "gap: 1px") +
  styleElement("rmxc-ccc", "inline-size: 1px") +
  styleElement("rmxc-ddd", "stroke: red") +
  "</head>" +
  '<div class="rmxc-bbb">' +
  '<input class="rmxc-aaa rmxc-ccc" />' +
  // <path> before <p> on purpose: with the <p> first, a substring match would
  // find it anyway and the word-boundary test below would pass for free.
  '<svg><path d="M0 0" /></svg>' +
  '<p class="rmxc-ddd">hint</p>' +
  "</div>"

describe("blocksOn", () => {
  it("returns every block whose class the element carries", () => {
    expect(blocksOn(html, "input")).toEqual([
      block("rmxc-aaa", "color: red"),
      block("rmxc-ccc", "inline-size: 1px"),
    ])
  })

  it("leaves out a block that landed on a different element", () => {
    expect(blocksOn(html, "div")).toEqual([block("rmxc-bbb", "gap: 1px")])
  })

  it("matches whole tag names, so p does not find path", () => {
    // Field renders both a <p> and, inside its chevron, a <path>. A substring
    // match would attribute one element's blocks to the other.
    expect(blocksOn(html, "p")).toEqual([block("rmxc-ddd", "stroke: red")])
  })

  it("returns nothing for a tag the document does not hold", () => {
    // The empty list is why this helper is tested at all: an assertion of
    // sharedProperties([]) passes, so a silent empty return would hide a bug
    // rather than surface one.
    expect(blocksOn(html, "textarea")).toEqual([])
  })

  it("returns nothing for an element remix gave no class", () => {
    expect(blocksOn(html, "svg")).toEqual([])
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

```bash
bun test test/styles.test.ts
```

Expected: FAIL, with `blocksOn is not a function` or a TypeScript error naming
the missing export.

- [ ] **Step 3: Implement the helper**

Append to `test/styles.ts`:

```ts
/** Each style block with the hash `remix/ui` keyed it by. */
const hashedBlocksOf = (html: string): { hash: string; block: string }[] =>
  [...html.matchAll(/<style data-rmx-style="([^"]*)">([\s\S]*?)<\/style>/g)].map((match) => ({
    hash: match[1] ?? "",
    block: match[2] ?? "",
  }))

/**
 * The style blocks that landed on one element, found through the class
 * `remix/ui` wrote on it.
 *
 * `sharedProperties` over every block in a document is the right question for
 * a component that styles one element, and the wrong one for a component that
 * styles several: two blocks on two different elements never contend for a
 * cascade slot, so a property both declare is not a collision. Field's label
 * and its control both declare `color`, legitimately.
 *
 * `tag` matches a whole tag name, not a prefix — Field renders both a `<p>`
 * and a `<path>`, and attributing one's blocks to the other would make a
 * disjointness assertion meaningless. The first element with that tag wins,
 * which is enough because every element these assertions target is unique by
 * tag within one Field.
 *
 * Returns an empty list for a tag that is absent or carries no class. A test
 * asserting disjointness should check the list is non-empty first: an empty
 * list satisfies `sharedProperties(blocks)).toEqual([])` without proving
 * anything.
 */
export const blocksOn = (html: string, tag: string): string[] => {
  const opening = new RegExp(`<${tag}\\b[^>]*>`).exec(html)?.[0] ?? ""
  const names = new Set(
    (/class="([^"]*)"/.exec(opening)?.[1] ?? "").split(/\s+/).filter((name) => name !== ""),
  )
  return hashedBlocksOf(html)
    .filter(({ hash }) => names.has(hash))
    .map(({ block }) => block)
}
```

- [ ] **Step 4: Run it to verify it passes**

```bash
bun test test/styles.test.ts
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Run the gate**

```bash
bun run check
```

Expected: green. `biome check .` passes, `tsc` reports nothing, every existing
test still passes.

- [ ] **Step 6: Commit**

```bash
git add test/styles.ts test/styles.test.ts
git commit -F - <<'EOF'
Ask disjointness per element, not per document

sharedProperties() compares every block in a rendered document, which was the
right question while every component styled exactly one element. Field styles
six, where its label's colour and its control's colour are two different
elements and not a collision at all.

blocksOn() gets the only dedicated test in test/styles.ts, because it is the
only helper there that fails silently: it returns a list, and
sharedProperties([]) is [], so a bug that returned nothing would make every
disjointness assertion pass for the wrong reason.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

## Task 2: `field/tokens.ts` and the aggregate

Twenty-seven tokens. The existing generic test in `src/tokens.test.ts` is the
gate: it checks every name is `ui-` prefixed, every default is either
`var(--primitive)` for a primitive the schema actually holds or a member of
`allowedLiterals`, and that no default contains `color-mix()`. A typo like
`var(--danger-subtel)` fails there, which is the failure this task is guarding
against.

`1px` is already on `allowedLiterals` from `--ui-btn-border-width`, so that
list does not change and no fourth literal needs arguing for.

**Files:**
- Create: `packages/ui-remix/src/field/tokens.ts`
- Modify: `packages/ui-remix/src/tokens.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `fieldTokens`, a `Record<string, string>` of 27 entries keyed
  `ui-field-*` with no leading dashes, spread into `componentTokens`. Task 3
  reads every one of these names from `field.tsx`.

- [ ] **Step 1: Write the token record**

Create `packages/ui-remix/src/field/tokens.ts`:

```ts
/**
 * Field's contract. The component reads these and nothing else, so a skin is a
 * set of values here and never a forked component.
 *
 * `height` comes from the sizing group, which is what makes
 * `[data-density="compact"]` retune every control without the component
 * knowing density exists. There is no `height-sm`: Field has no size axis,
 * because forms are uniform in a way toolbars are not and a second size would
 * turn the box metrics into a kind-by-size matrix.
 *
 * `border-width` is the one default that is not a primitive. The schema has no
 * border-width primitive and one property does not justify widening it;
 * `allowedLiterals` in tokens.test.ts already holds `1px` for Button's.
 *
 * `hint` and `error` share `message-size`. They are the same typographic role
 * at two inks, and a second token would only let them drift.
 *
 * No transition tokens. Button has them because it has a hover; Field has
 * neither a hover nor a focus colour change, so the only thing to transition
 * is the invalid border arriving on blur.
 *
 * No focus ring, deliberately, and Button is the precedent: the reset's
 * `:where(:focus-visible)` rule owns it, and it applies precisely because no
 * component competes with it. See the spec for the argument.
 */
export const fieldTokens = {
  "ui-field-gap": "var(--sp-2)",
  "ui-field-height": "var(--control-h)",
  "ui-field-radius": "var(--r-sm)",
  "ui-field-border-width": "1px",
  "ui-field-border": "var(--hairline-strong)",
  "ui-field-bg": "var(--surface)",
  "ui-field-ink": "var(--ink)",
  "ui-field-placeholder-ink": "var(--ink-subtle)",
  "ui-field-pad-x": "var(--sp-3)",
  "ui-field-pad-y": "var(--sp-2)",
  "ui-field-font-size": "var(--fs-md)",

  "ui-field-label-ink": "var(--ink)",
  "ui-field-label-size": "var(--fs-sm)",
  "ui-field-label-weight": "var(--fw-medium)",
  // The asterisk is information, not an error, so it is muted rather than
  // danger-coloured. A skin that disagrees sets this one token.
  "ui-field-required-ink": "var(--ink-muted)",

  "ui-field-hint-ink": "var(--ink-muted)",
  "ui-field-error-ink": "var(--danger)",
  "ui-field-message-size": "var(--fs-sm)",

  // The first consumer of danger-subtle, which is why the token schema names
  // its semantic arms in full instead of deriving them with color-mix().
  "ui-field-invalid-border": "var(--danger-border)",
  "ui-field-invalid-bg": "var(--danger-subtle)",

  "ui-field-disabled-bg": "var(--surface-active)",
  "ui-field-disabled-ink": "var(--ink-subtle)",
  "ui-field-disabled-border": "var(--hairline)",
  "ui-field-readonly-bg": "var(--surface-hover)",

  // Size and clearance are space steps rather than pixel literals, which is
  // what composing from the scale means for a decorative glyph.
  "ui-field-chevron-ink": "var(--ink-muted)",
  "ui-field-chevron-size": "var(--sp-3)",
  "ui-field-chevron-space": "var(--sp-6)",
} as const
```

- [ ] **Step 2: Add it to the aggregate**

In `packages/ui-remix/src/tokens.ts`, add the import and the spread. The file
becomes:

```ts
import { buttonTokens } from "./button/tokens.ts"
import { eyebrowTokens } from "./eyebrow/tokens.ts"
import { fieldTokens } from "./field/tokens.ts"
import { headingTokens } from "./heading/tokens.ts"
import { textTokens } from "./text/tokens.ts"

/**
 * Every component's token record in one object, for `emitTokensCss()` to write
 * ahead of a theme's values — same selector, same specificity, later wins.
 *
 * `ui-design` never learns which components exist; it takes this record. Adding
 * a component means adding its record here and nowhere else.
 */
export const componentTokens = {
  ...buttonTokens,
  ...eyebrowTokens,
  ...fieldTokens,
  ...headingTokens,
  ...textTokens,
} satisfies Record<string, string>
```

Leave the rest of the file, `ComponentTokenName` included, untouched.

- [ ] **Step 3: Verify the gate actually guards this file**

The record is data, so prove the existing test can reject it before trusting
that it passed. Temporarily break one default:

```bash
sed -i '' 's/var(--danger-subtle)/var(--danger-subtel)/' packages/ui-remix/src/field/tokens.ts
bun test packages/ui-remix/src/tokens.test.ts
```

Expected: FAIL, with
`ui-field-invalid-bg: --danger-subtel is not a name the schema holds`.

- [ ] **Step 4: Put it back and run the gate**

```bash
sed -i '' 's/var(--danger-subtel)/var(--danger-subtle)/' packages/ui-remix/src/field/tokens.ts
bun run check
```

Expected: green.

- [ ] **Step 5: Commit**

```bash
git add packages/ui-remix/src/field/tokens.ts packages/ui-remix/src/tokens.ts
git commit -F - <<'EOF'
Declare Field's twenty-seven tokens

Every default names a primitive except border-width, which has no primitive to
name and is already on the allowed-literals list from Button's.

danger-subtle gets its first consumer, which is the reason the token schema
names semantic arms in full rather than deriving them with color-mix(): a mix
ratio inside a component is a literal nobody can retune centrally.

No focus-ring token, following Button. The reset owns the ring and it applies
because no component competes with it. This contradicts task 15's brief, and
the spec argues it out.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

## Task 3: `Field`, the input kind

The largest task: the wrapper, the label, the messages, the id wiring, the
control block with every state override, and the input kind. Tasks 4 and 5 add
a kind each on top.

**Files:**
- Create: `packages/ui-remix/src/field/field.tsx`
- Create: `packages/ui-remix/src/field/field.test.tsx`
- Modify: `packages/ui-remix/src/index.ts`

**Interfaces:**
- Consumes: `fieldTokens` (Task 2) for the names it reads; `blocksOn` (Task 1)
  in the test.
- Produces:
  - `Field(handle: Handle<FieldProps>)`, the component.
  - `fieldControls: readonly ["input", "textarea", "select"]` and
    `FieldControl`, the union of its members. Task 6's demo and its test loop
    over this list rather than restating it.
  - `fieldTypes: readonly [...]` and `FieldType`, the text-box `type` family.
  - `FieldInputProps`, and `FieldProps` as an alias for it. Tasks 4 and 5
    declare their own member and widen the alias by one line each. The union
    must NOT be declared whole here: narrowing an optional discriminant needs
    every other member to have its own `case`, so a member declared before it
    is dispatched on makes the input-only props unreachable and the package
    stops compiling. See the pre-flight table.

- [ ] **Step 1: Write the failing test**

Create `packages/ui-remix/src/field/field.test.tsx`. Tasks 4 and 5 append
their own `describe` blocks; this is the whole file for now.

```tsx
import { describe, expect, it } from "bun:test"
import { css } from "remix/ui"
import { renderToHtml } from "../../../../test/render.ts"
import { blocksOn, sharedProperties, stylesOf, valuesOf } from "../../../../test/styles.ts"
import { Field, fieldTypes } from "./field.tsx"

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
    expect(html).not.toContain("aria-describedby")
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
    expect(html).toContain("required")
    expect(html).toContain('aria-hidden="true"')
    expect(
      markupOf(await renderToHtml(<Field label="Email" name="email" />)),
    ).not.toContain("aria-hidden")
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
    expect(html).toContain("required")

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
    expect(text).toContain("readonly")
  })

  it("renders the disabled attribute", async () => {
    expect(await renderToHtml(<Field disabled label="Email" name="email" />)).toContain("disabled")
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
    expect(styles).not.toContain("padding:")
    expect(styles).toContain("padding-inline-start:")
    expect(styles).toContain("padding-inline-end:")
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
```

- [ ] **Step 2: Run it to verify it fails**

```bash
bun test packages/ui-remix/src/field/field.test.tsx
```

Expected: FAIL, with a module-not-found error for `./field.tsx`.

- [ ] **Step 3: Write the component**

Create `packages/ui-remix/src/field/field.tsx`. Tasks 4 and 5 extend the
`switch` and add the remaining blocks; the union and the shared parts are all
here.

```tsx
import { css, type Handle, type MixInput } from "remix/ui"

/**
 * Derived from the list, not the other way around: a kind added only to the
 * union would compile, ship, and be covered by no test and no demo.
 */
export const fieldControls = ["input", "textarea", "select"] as const
export type FieldControl = (typeof fieldControls)[number]

/**
 * The text-box family, and nothing else.
 *
 * `checkbox`, `radio`, `file`, `range` and `color` are excluded because none
 * of them is a bordered box of `--control-h` height — they are different
 * controls sharing a tag name, and every token here would style them wrongly.
 * M2 schedules `Checkbox`, `Radio` and `Switch` for that reason.
 */
export const fieldTypes = [
  "text",
  "email",
  "url",
  "tel",
  "password",
  "search",
  "number",
  "date",
  "time",
  "datetime-local",
  "month",
  "week",
] as const
export type FieldType = (typeof fieldTypes)[number]

interface FieldCommon {
  /**
   * Required. Names the value in the submission, and is the id stem: `email`
   * for the control, `email-hint` and `email-error` for the messages.
   *
   * Used as written, with no sanitising. An id may hold anything but
   * whitespace, so `user[email]` is a valid stem. Sanitising would map two
   * names onto one id, which is a duplicate-id bug with its cause hidden.
   */
  name: string
  /** Required. An unlabelled control is a broken control. */
  label: string
  /** Rendered above the control, so it is read before the user types. */
  hint?: string | undefined
  /**
   * A server-supplied error, for the half of validation no attribute can
   * express: "that address is already registered". Sets `aria-invalid`.
   *
   * It stays set while the user corrects the field, until the next round trip.
   * Clearing it early would need client JavaScript, and Field ships none.
   */
  error?: string | undefined
  /** Replaces the id stem, for two forms on one page sharing a field name. */
  id?: string | undefined
  required?: boolean | undefined
  disabled?: boolean | undefined
  /**
   * Adds properties Field does not declare, **to the wrapper**. There is no
   * second `mix` for the control: a property of the control goes through a
   * `--ui-field-*` token, which is what the component tier is for.
   *
   * It does not reliably override a property the wrapper already declares.
   * Each `css()` block is its own cascade sub-layer, layer order beats
   * specificity inside a layer, and sub-layer order follows the order blocks
   * are first encountered during the render rather than the order of the array.
   */
  mix?: MixInput<HTMLDivElement> | undefined
}

export interface FieldInputProps extends FieldCommon {
  control?: "input" | undefined
  /** Defaults to `text`, which is also what a bare input defaults to. */
  type?: FieldType | undefined
  readonly?: boolean | undefined
  value?: string | undefined
  placeholder?: string | undefined
  minlength?: number | undefined
  maxlength?: number | undefined
  autocomplete?: string | undefined
  pattern?: string | undefined
  min?: string | number | undefined
  max?: string | number | undefined
  step?: string | number | undefined
}

/**
 * One member for now, and the type is written as an alias rather than as
 * `FieldInputProps` everywhere so that Tasks 4 and 5 widen one line.
 *
 * The union grows a member per task because it has to. Narrowing an optional
 * discriminant works only when every other member has its own `case`, so a
 * task that declared `FieldTextareaProps` before it dispatched on
 * `control === "textarea"` would leave every input-only property unreachable
 * and the package would not compile. See the table in the plan's pre-flight
 * findings.
 */
export type FieldProps = FieldInputProps

/**
 * The `type` attribute, narrowed to one literal for the compiler's benefit.
 *
 * `remix/ui` types `<input>` as a union discriminated on `type`, so that each
 * type can restrict what sits beside it: `role` is limited per type, and the
 * `text`/`search`/`tel`/`url`/`email` arms forbid `list`. A union-typed
 * `type` selects no arm at all, and `Field`'s `type` is a union by design —
 * so the element does not typecheck without this.
 *
 * The assertion is sound rather than convenient: every arm differs only in
 * `role` and `list`, `Field` passes neither, and the runtime value is
 * whatever the caller gave. It narrows the compiler's view, not the data.
 *
 * The cost is real and worth naming: if a future `remix/ui` adds an arm that
 * restricts an attribute `Field` does pass, this hides it. `field.test.tsx`
 * asserts the rendered `type` for every member of `fieldTypes`, so the value
 * reaching the DOM stays checked even though the attribute's type does not.
 */
const inputTypeAttribute = (type: FieldType | undefined): "text" => (type ?? "text") as "text"

const fieldBase = css({
  display: "flex",
  flexDirection: "column",
  gap: "var(--ui-field-gap)",
})

const labelStyle = css({
  fontSize: "var(--ui-field-label-size)",
  fontWeight: "var(--ui-field-label-weight)",
  color: "var(--ui-field-label-ink)",
})

const requiredStyle = css({
  color: "var(--ui-field-required-ink)",
})

const hintStyle = css({
  fontSize: "var(--ui-field-message-size)",
  color: "var(--ui-field-hint-ink)",
})

const errorStyle = css({
  fontSize: "var(--ui-field-message-size)",
  color: "var(--ui-field-error-ink)",
})

/**
 * Everything every control shares, and every state it can be in.
 *
 * The four state overrides are in this block rather than beside it because
 * each one overrides `border-color` or `background`, which this block
 * declares. In a separate `css()` block they would lose to it whenever their
 * sub-layer happened to register first, and sub-layer order follows render
 * order rather than source order. Do not split them out. See "Cascade layers"
 * in docs/design-system.md.
 *
 * `&:user-invalid` and `&[aria-invalid="true"]` are the two sources of
 * invalidity, native and server-supplied, and they deliberately read the same
 * tokens. `:invalid` is not used: it matches an empty required field on first
 * paint, so every form would load pre-reddened. `:user-invalid` is Chrome 119,
 * so Chrome 114 through 118 gets no invalid styling — the validation bubble
 * still blocks submission there, so the field is unstyled rather than dead.
 *
 * Padding is longhand throughout. `padding-inline` here plus
 * `padding-inline-end` in a kind block would conflict in CSS while
 * `sharedProperties()` saw two different names and passed. `background` stays
 * a shorthand, as Button's tones do, so a skin may set `--ui-field-bg` to a
 * gradient.
 *
 * No `outline` anywhere. The reset's `:where(:focus-visible)` rule owns the
 * focus ring, and it applies because nothing here competes with it.
 */
const controlBase = css({
  borderStyle: "solid",
  borderWidth: "var(--ui-field-border-width)",
  borderColor: "var(--ui-field-border)",
  borderRadius: "var(--ui-field-radius)",
  background: "var(--ui-field-bg)",
  color: "var(--ui-field-ink)",
  fontSize: "var(--ui-field-font-size)",
  inlineSize: "100%",
  paddingBlock: "var(--ui-field-pad-y)",
  paddingInlineStart: "var(--ui-field-pad-x)",
  "&::placeholder": {
    color: "var(--ui-field-placeholder-ink)",
  },
  "&:disabled": {
    background: "var(--ui-field-disabled-bg)",
    borderColor: "var(--ui-field-disabled-border)",
    color: "var(--ui-field-disabled-ink)",
    cursor: "not-allowed",
  },
  "&[readonly]": {
    background: "var(--ui-field-readonly-bg)",
  },
  "&:user-invalid": {
    background: "var(--ui-field-invalid-bg)",
    borderColor: "var(--ui-field-invalid-border)",
  },
  '&[aria-invalid="true"]': {
    background: "var(--ui-field-invalid-bg)",
    borderColor: "var(--ui-field-invalid-border)",
  },
})

/**
 * The box metrics an input takes. Disjoint from `controlBase`, which declares
 * neither `height` nor `padding-inline-end`.
 */
const inputBox = css({
  height: "var(--ui-field-height)",
  paddingInlineEnd: "var(--ui-field-pad-x)",
})

export function Field(handle: Handle<FieldProps>) {
  return () => {
    const props = handle.props
    const { name, label, hint, error, required, disabled, mix } = props
    const stem = props.id ?? name
    const hintId = `${stem}-hint`
    const errorId = `${stem}-error`
    // Only the ids that actually rendered. An aria-describedby naming an id
    // the document does not hold is read as nothing by some assistive
    // technology and skipped entirely by others.
    const described = [hint === undefined ? "" : hintId, error === undefined ? "" : errorId]
      .filter((id) => id !== "")
      .join(" ")
    const describedBy = described === "" ? undefined : described
    const invalid = error === undefined ? undefined : "true"

    return (
      <div mix={[fieldBase, mix]}>
        <label for={stem} mix={labelStyle}>
          {label}
          {required === true ? (
            <span aria-hidden="true" mix={requiredStyle}>
              {" *"}
            </span>
          ) : undefined}
        </label>
        {hint === undefined ? undefined : (
          <p id={hintId} mix={hintStyle}>
            {hint}
          </p>
        )}
        <input
          aria-describedby={describedBy}
          aria-invalid={invalid}
          autocomplete={props.autocomplete}
          disabled={disabled}
          id={stem}
          max={props.max}
          maxlength={props.maxlength}
          min={props.min}
          minlength={props.minlength}
          mix={[controlBase, inputBox]}
          name={name}
          pattern={props.pattern}
          placeholder={props.placeholder}
          readonly={props.readonly}
          required={required}
          step={props.step}
          type={inputTypeAttribute(props.type)}
          value={props.value}
        />
        {error === undefined ? undefined : (
          <p id={errorId} mix={errorStyle}>
            {error}
          </p>
        )}
      </div>
    )
  }
}
```

The `<input>` is rendered inline, with no dispatch around it, because there is
one kind to render. Task 4 introduces the `switch` at the moment it first has
something to switch on, and moves this element into its `default` arm.

- [ ] **Step 4: Export it**

In `packages/ui-remix/src/index.ts`, add:

```ts
export {
  Field,
  fieldControls,
  type FieldControl,
  type FieldInputProps,
  type FieldProps,
  type FieldType,
  fieldTypes,
} from "./field/field.tsx"
```

Tasks 4 and 5 add `FieldTextareaProps` and `FieldSelectProps` to this list as
they declare them.

Then `bun run fix`, which puts the statement in biome's export order rather
than wherever it was pasted.

- [ ] **Step 5: Run the test to verify it passes**

```bash
bun test packages/ui-remix/src/field/field.test.tsx
```

Expected: PASS, 16 tests.

- [ ] **Step 6: Run the gate**

```bash
bun run check
```

Expected: green.

- [ ] **Step 7: Commit**

```bash
git add packages/ui-remix/src/field/field.tsx packages/ui-remix/src/field/field.test.tsx packages/ui-remix/src/index.ts
git commit -F - <<'EOF'
Land Field's input kind and the wiring it exists for

The component renders the control itself, so the id, for, aria-describedby and
aria-invalid wiring cannot be skipped by a caller. A render callback handing a
minted id out would let one ship an input with no label association: no error,
no warning, a broken accessibility tree, and nothing here can test application
code.

aria-describedby names only the messages that rendered, because pointing it at
an absent id is its own silent failure.

Both invalid selectors sit inside the control's own css() block, beside the
border-color they override. Split out, they would lose whenever their sub-layer
registered first, and that order follows render order rather than source order.

Padding is longhand throughout: padding-inline in one block and
padding-inline-end in another conflict in CSS while sharedProperties() sees two
names and passes. A test pins it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

## Task 4: The textarea kind

**Files:**
- Modify: `packages/ui-remix/src/field/field.tsx`
- Modify: `packages/ui-remix/src/field/field.test.tsx`

**Interfaces:**
- Consumes: `FieldCommon`, `FieldInputProps` and the blocks from Task 3.
- Produces: `FieldEditable`, the shape the two editable kinds share, extracted
  here because this is the task where it first has two consumers.
  `FieldTextareaProps`, exported. `FieldProps` widened to
  `FieldInputProps | FieldTextareaProps`. The `control()` switch, introduced
  here because this is the task where there is first something to switch on:
  `case "textarea"` plus `default`, which narrows to `FieldInputProps` because
  the union has exactly two members at this point. Task 6's demo uses the kind.

- [ ] **Step 1: Write the failing test**

Append to `packages/ui-remix/src/field/field.test.tsx`:

```tsx
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
    expect(html).toContain("required")
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
```

- [ ] **Step 2: Run it to verify it fails**

```bash
bun test packages/ui-remix/src/field/field.test.tsx
```

Expected: FAIL. With no dispatch yet, `Field` renders its `<input>` whatever
`control` says, so the first assertion fails on the rendered `<input`.
`bun test` does not typecheck, which is why this runs at all — `bun run check`
would also reject `control="textarea"` as not assignable until Step 3 widens
the union. Do not run the gate yet.

- [ ] **Step 3: Extract the shared shape and widen the union**

In `field.tsx`, replace `FieldInputProps`'s own copy of the editable fields
with an extracted base, and add the textarea member. `FieldEditable` is
internal and deliberately not exported: it is a shape two kinds share, not a
type a caller ever names.

```tsx
/** Inputs and textareas take `readonly`; a `<select readonly>` is inert. */
interface FieldEditable extends FieldCommon {
  readonly?: boolean | undefined
  value?: string | undefined
  placeholder?: string | undefined
  minlength?: number | undefined
  maxlength?: number | undefined
}

export interface FieldInputProps extends FieldEditable {
  control?: "input" | undefined
  /** Defaults to `text`, which is also what a bare input defaults to. */
  type?: FieldType | undefined
  autocomplete?: string | undefined
  pattern?: string | undefined
  min?: string | number | undefined
  max?: string | number | undefined
  step?: string | number | undefined
}

export interface FieldTextareaProps extends FieldEditable {
  control: "textarea"
  rows?: number | undefined
}

export type FieldProps = FieldInputProps | FieldTextareaProps
```

Add `type FieldTextareaProps` to the export list in
`packages/ui-remix/src/index.ts`.

- [ ] **Step 4: Add the block and introduce the switch**

In `field.tsx`, add the block after `inputBox`:

```tsx
/**
 * A textarea's metrics. No `height`: it is as tall as its `rows`, and a fixed
 * height would fight that. `resize: vertical` rather than `both`, because
 * horizontal resize breaks the surrounding layout.
 */
const textareaBox = css({
  paddingInlineEnd: "var(--ui-field-pad-x)",
  resize: "vertical",
})
```

Then move Task 3's inline `<input>` into a `control()` function beside the
other locals in the render, and add the textarea case above it. The `<input>`
element itself does not change — only where it sits.

```tsx
    const control = () => {
      switch (props.control) {
        case "textarea":
          return (
            <textarea
              aria-describedby={describedBy}
              aria-invalid={invalid}
              disabled={disabled}
              id={stem}
              maxlength={props.maxlength}
              minlength={props.minlength}
              mix={[controlBase, textareaBox]}
              name={name}
              placeholder={props.placeholder}
              readonly={props.readonly}
              required={required}
              rows={props.rows}
              value={props.value}
            />
          )
        default:
          return (
            <input
              aria-describedby={describedBy}
              aria-invalid={invalid}
              autocomplete={props.autocomplete}
              disabled={disabled}
              id={stem}
              max={props.max}
              maxlength={props.maxlength}
              min={props.min}
              minlength={props.minlength}
              mix={[controlBase, inputBox]}
              name={name}
              pattern={props.pattern}
              placeholder={props.placeholder}
              readonly={props.readonly}
              required={required}
              step={props.step}
              type={inputTypeAttribute(props.type)}
              value={props.value}
            />
          )
      }
    }
```

and replace the inline `<input>` in the returned tree with `{control()}`.

`default` narrows to `FieldInputProps` here because the union has exactly two
members. It would not if `FieldSelectProps` already existed, which is why
Task 5 adds that member and its `case` together.

- [ ] **Step 5: Run the test to verify it passes**

```bash
bun test packages/ui-remix/src/field/field.test.tsx
```

Expected: PASS, 22 tests.

- [ ] **Step 6: Run the gate**

```bash
bun run check
```

Expected: green.

- [ ] **Step 7: Commit**

```bash
git add packages/ui-remix/src/field/field.tsx packages/ui-remix/src/field/field.test.tsx
git commit -F - <<'EOF'
Add Field's textarea kind

The value goes through the value prop, not children: remix drops a textarea's
children silently, so the plain-HTML arrangement where the value is the content
would render an empty box. A test pins the behaviour so the next person to
reach for children finds out here rather than in a browser.

No height on the block. A textarea is as tall as its rows, and the fixed
--control-h box an input takes would fight that.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

## Task 5: The select kind, its frame and its chevron

`appearance: none` is what lets a select match an input, and it takes the
disclosure arrow with it. The arrow comes back as an inline `<svg>` sharing a
grid cell with the control, so its colour is a token like any other property
and follows a dark scheme for free. A background-image data URI could not:
`var()` does not resolve inside `url()`, so the arrow's colour would be a
literal no theme could reach.

The frame is `display: grid` rather than `position: relative` with an absolute
chevron, which avoids a `50%` offset and a translate as magic numbers.

**Files:**
- Modify: `packages/ui-remix/src/field/field.tsx`
- Modify: `packages/ui-remix/src/field/field.test.tsx`

**Interfaces:**
- Consumes: `FieldCommon`, the `control()` switch and the blocks from Tasks 3
  and 4.
- Produces: `FieldSelectProps`, exported, and `FieldProps` widened to all
  three members. The member and its `case` land in the same commit, because
  either alone breaks the typecheck: the member without the case leaves
  `default` narrowing to `FieldInputProps | FieldSelectProps`, and the case
  without the member has nothing to match. `control="select"` then renders a
  frame `<div>` holding a `<select>` and an `aria-hidden` `<svg>`. Three new
  blocks: `selectFrame`, `selectBox`, `chevronStyle`.

- [ ] **Step 1: Write the failing test**

Append to `packages/ui-remix/src/field/field.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run it to verify it fails**

```bash
bun test packages/ui-remix/src/field/field.test.tsx
```

Expected: FAIL. `control="select"` falls through to `default` and renders an
`<input>`, so the first assertion fails. `bun test` does not typecheck, which
is why this runs at all — `bun run check` would also reject `control="select"`
as not assignable until Step 3 widens the union. Do not run the gate yet.

- [ ] **Step 3: Declare the select member and widen the union**

In `field.tsx`, add the member and widen the alias. `RemixNode` joins the
import from `remix/ui`, unused until now.

```tsx
export interface FieldSelectProps extends FieldCommon {
  control: "select"
  /**
   * The `<option>`s. Required, because a select with none is an empty box.
   *
   * There is no `value` prop, and that is not an omission. `<select>` has no
   * `value` content attribute — the IDL property exists, the attribute does
   * not — so rendering one emits invalid markup that selects nothing. The
   * chosen option carries `selected`, which is where HTML puts it.
   *
   * There is no `readonly` either, for the same reason: HTML gives `select` no
   * such attribute, so the prop would render something inert. That is why
   * `readonly` sits on `FieldEditable` rather than on `FieldCommon`.
   */
  children: RemixNode
}

export type FieldProps = FieldInputProps | FieldTextareaProps | FieldSelectProps
```

Add `type FieldSelectProps` to the export list in
`packages/ui-remix/src/index.ts`.

This step and Step 5 have to land in one commit. The member without its
`case` leaves `default` narrowing to `FieldInputProps | FieldSelectProps`, so
every input-only property access fails; the `case` without the member has
nothing to match. Expect a red typecheck between them, and do not try to make
it green in isolation.

- [ ] **Step 4: Add the three blocks**

In `field.tsx`, after `textareaBox`:

```tsx
/**
 * The frame that lets the chevron overlay the control.
 *
 * A grid with one implicit cell, rather than `position: relative` with an
 * absolutely positioned chevron: both the control and the glyph take
 * `grid-area: 1 / 1`, so centring is `align-self` instead of a `50%` offset
 * and a translate. No stacking context, and no magic numbers.
 */
const selectFrame = css({
  display: "grid",
})

/**
 * `appearance: none` is what lets a select match an input, and it takes the
 * disclosure arrow with it — hence the chevron below.
 *
 * The end padding is the one calc() in the component, and both of its terms
 * are tokens. field.test.tsx decomposes a calc() rather than allowing it
 * wholesale, so a literal smuggled in here still fails.
 */
const selectBox = css({
  gridArea: "1 / 1",
  appearance: "none",
  height: "var(--ui-field-height)",
  paddingInlineEnd: "calc(var(--ui-field-pad-x) + var(--ui-field-chevron-space))",
})

/**
 * The chevron. Real markup, so its colour is a token like every other
 * property and a dark scheme reaches it. A `background-image` data URI could
 * not: `var()` does not resolve inside `url()`, so that arrow's colour would
 * be a literal no theme can retune.
 *
 * `pointer-events: none` because a click on the glyph is a click meant for the
 * select underneath it.
 */
const chevronStyle = css({
  gridArea: "1 / 1",
  alignSelf: "center",
  justifySelf: "end",
  marginInlineEnd: "var(--ui-field-pad-x)",
  inlineSize: "var(--ui-field-chevron-size)",
  blockSize: "var(--ui-field-chevron-size)",
  color: "var(--ui-field-chevron-ink)",
  pointerEvents: "none",
})
```

- [ ] **Step 5: Add the case**

Above `default:` in `control()`:

```tsx
        case "select":
          return (
            <div mix={selectFrame}>
              <select
                aria-describedby={describedBy}
                aria-invalid={invalid}
                disabled={disabled}
                id={stem}
                mix={[controlBase, selectBox]}
                name={name}
                required={required}
              >
                {props.children}
              </select>
              <svg aria-hidden="true" fill="none" mix={chevronStyle} viewBox="0 0 12 12">
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                />
              </svg>
            </div>
          )
```

`stroke="currentColor"` is what connects the path to `--ui-field-chevron-ink`:
the block sets `color` on the svg, and the path inherits it.

- [ ] **Step 6: Run the test to verify it passes**

```bash
bun test packages/ui-remix/src/field/field.test.tsx
```

Expected: PASS, 29 tests.

- [ ] **Step 7: Run the gate**

```bash
bun run check
```

Expected: green.

- [ ] **Step 8: Commit**

```bash
git add packages/ui-remix/src/field/field.tsx packages/ui-remix/src/field/field.test.tsx
git commit -F - <<'EOF'
Add Field's select kind, with a chevron on the contract

appearance: none is what lets a select match an input beside it, and it takes
the disclosure arrow with it. The arrow comes back as an inline svg sharing a
grid cell with the control, so its colour is a token and a dark scheme reaches
it. A background-image data URI could not: var() does not resolve inside
url(), so that arrow's colour is a literal no theme can retune.

The frame is a one-cell grid rather than position: relative with an absolute
chevron, which trades a 50% offset and a translate for align-self.

No value prop on the select kind. HTML gives select no value content
attribute, so the obvious-looking handle would emit invalid markup and select
nothing. The caller marks the option with selected.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

## Task 6: The demo and the catalogue entry

The done-when is "a form submits and reports validation errors with the runtime
absent". A `<form method="get">` with no `action` submits to the current URL,
so the catalogue route reloads with the values in the query string and no route
work is needed. Native validation blocks it while the required field is empty.
Reporting a *server* error needs a round trip the playground has no route for,
so one field carries a static `error` to show the state.

**Files:**
- Create: `packages/ui-remix/src/field/field.demo.tsx`
- Modify: `packages/ui-remix/src/field/field.test.tsx`
- Modify: `packages/ui-remix/src/demos.ts`

**Interfaces:**
- Consumes: `Field`, `fieldControls` (Task 3), `Button` from
  `../button/button.tsx`.
- Produces: `FieldDemo`, registered in `demos` under the key `field`. The
  route `/c/field` resolves through `isDemoName` as soon as the entry exists.

- [ ] **Step 1: Write the failing test**

Append to `packages/ui-remix/src/field/field.test.tsx`, and add
`import { FieldDemo } from "./field.demo.tsx"` and
`import { Field, fieldControls } from "./field.tsx"` at the top:

```tsx
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
    expect(html).toContain("required")
    expect(html).toContain("disabled")
    expect(html).toContain("readonly")
    expect(html).toContain('aria-invalid="true"')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

```bash
bun test packages/ui-remix/src/field/field.test.tsx
```

Expected: FAIL, module not found for `./field.demo.tsx`.

- [ ] **Step 3: Write the demo**

Create `packages/ui-remix/src/field/field.demo.tsx`:

```tsx
import { css } from "remix/ui"
import { Button } from "../button/button.tsx"
import { Field, fieldTypes } from "./field.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const group = css({
  display: "flex",
  flexDirection: "column",
  gap: "var(--sp-5)",
  marginBlockEnd: "var(--sp-8)",
})

const actions = css({
  marginBlockStart: "var(--sp-4)",
})

/**
 * A real form, submitted with no client JavaScript.
 *
 * `method="get"` and no `action`, so submitting reloads the catalogue route
 * with the values in the query string. Leaving the email empty and pressing
 * Save is the manual check the done-when asks for: the browser's own
 * validation blocks the submission and reports the error itself.
 *
 * The last field's error is static. A server-produced one needs a round trip,
 * and the playground has no route for it until the shell arrives.
 */
export function FieldDemo() {
  return () => (
    <>
      <p mix={label}>field: the three controls, in one submitting form</p>
      <form method="get">
        <div mix={group}>
          <Field
            autocomplete="email"
            hint="We only use this to send receipts."
            label="Email"
            name="email"
            required
            type="email"
          />
          <Field control="select" hint="Change it whenever you like." label="Plan" name="plan">
            <option value="free">Free</option>
            <option selected value="team">
              Team
            </option>
            <option value="enterprise">Enterprise</option>
          </Field>
          <Field
            control="textarea"
            label="Notes"
            maxlength={500}
            name="notes"
            placeholder="Anything we should know?"
            rows={4}
          />
        </div>
        <div mix={actions}>
          <Button tone="primary" type="submit">
            Save
          </Button>
        </div>
      </form>

      <p mix={label}>field: the states</p>
      <div mix={group}>
        <Field disabled label="Account id" name="account" value="acct_9f21" />
        <Field
          hint="Set when the account was created."
          label="Created"
          name="created"
          readonly
          type="date"
          value="2026-04-02"
        />
        <Field
          error="That address is already registered."
          label="Email"
          name="existing-email"
          type="email"
          value="ada@example.com"
        />
      </div>
    </>
  )
}
```

- [ ] **Step 4: Register the catalogue entry**

In `packages/ui-remix/src/demos.ts`, add the import and the entry:

```ts
import { FieldDemo } from "./field/field.demo.tsx"
```

and inside `demos`, in alphabetical position:

```ts
  field: { title: "Field", Demo: FieldDemo },
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
bun test packages/ui-remix/src/field/field.test.tsx
```

Expected: PASS, 32 tests.

- [ ] **Step 6: Run the gate**

```bash
bun run check
```

Expected: green.

- [ ] **Step 7: Check it by hand, which is the half no test covers**

```bash
bun run playground
```

Open `/c/field`. Confirm, in this order:

1. Press Save with the email empty. The browser blocks the submission and
   shows its own message. This is the done-when's "reports validation errors",
   and no test can assert it.
2. Fill the email and press Save. The URL becomes
   `/c/field?email=…&plan=team&notes=…`, which is the submission.
3. Type a malformed address, then tab away. On Chrome 119+, Safari 16.5+ or
   Firefox 88+ the border and background turn to the danger tokens through
   `:user-invalid`. Below those versions nothing changes, which is expected.
4. The last field is already tinted, from `aria-invalid` rather than a
   selector.
5. The select's chevron sits inside its end padding and does not overlap the
   text of the longest option.
6. Add `?scheme=dark` and confirm the chevron changed colour with everything
   else, which is what a data URI could not have done.

- [ ] **Step 8: Commit**

```bash
git add packages/ui-remix/src/field/field.demo.tsx packages/ui-remix/src/field/field.test.tsx packages/ui-remix/src/demos.ts
git commit -F - <<'EOF'
Demonstrate Field in a form that submits without JavaScript

A GET form with no action submits to the catalogue route itself, so the
done-when is satisfied with no route work and task 19 can upgrade the same
demo in place once the playground shell can thread values back.

The last field's error is static. A server-produced error needs a round trip,
and putting the playground's first POST route inside a component task buys one
demo at the cost of plumbing that belongs to the shell.

The demo test derives its kinds from fieldControls, so a kind the component
gains is a kind the demo has to show.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

## Task 7: Documents, and closing the task

**Files:**
- Modify: `packages/ui-remix/README.md`
- Modify: `docs/design-system.md`
- Modify: `todo/TODO.md`
- Move: `todo/m1-foundation-and-contract-proof/15-field-native-form-controls-and-constraint-validation.md`
  to `todo/done/m1-foundation-and-contract-proof/`

**Interfaces:**
- Consumes: everything above.
- Produces: nothing code reads.

- [ ] **Step 1: Add the README catalogue entry**

In `packages/ui-remix/README.md`, after the `### Heading / Text / Eyebrow`
section and before `### ThemeStyle`:

```markdown
### `Field`

Native form controls with their label, hint and error wired by the component,
and validation left to the browser. No JavaScript validation anywhere.

| Axis | Values | Comes from |
| --- | --- | --- |
| `control` | `input` (default), `textarea`, `select` | The element rendered |
| `type` | the text-box family: `text`, `email`, `url`, `tel`, `password`, `search`, `number`, `date`, `time`, `datetime-local`, `month`, `week` | `input` only |
| height | one, not an axis | `--control-h`, so density reaches it |

`checkbox`, `radio`, `file`, `range` and `color` are not `type` values. None of
them is a bordered box of `--control-h` height, so every token here would style
them wrongly. There is no `size` axis either: forms are uniform in a way
toolbars are not, and density already retunes the height.

**Ids derive from the required `name`** — `email` for the control,
`email-hint` and `email-error` for the messages — and `aria-describedby` names
only the messages that rendered, because pointing it at an absent id is a
silent failure. Pass `id` when two forms on one page share a field name.

**Two sources of invalidity, one set of tokens.** A server-supplied `error`
sets `aria-invalid`; native constraint validation matches `:user-invalid`. Both
read `--ui-field-invalid-*`. `:invalid` is not used: it matches an empty
required field on first paint, so every form would load pre-reddened.
`:user-invalid` is Chrome 119, so Chrome 114 through 118 shows no invalid
styling and the validation bubble still blocks submission there.

**A `<textarea>` takes its value from `value`, not from children.** `remix/ui`
drops a textarea's children. **A `<select>` takes no `value` at all** — HTML
gives it no such content attribute, so the chosen `<option>` carries
`selected`. It takes no `readonly` either, for the same reason.

`appearance: none` on the select is what lets it match an input, and the
chevron that replaces the native arrow is an inline `<svg>` sharing a grid cell
with the control. Its colour is `--ui-field-chevron-ink`, which a
`background-image` data URI could not manage: `var()` does not resolve inside
`url()`.

Twenty-seven tokens in `field/tokens.ts`. Field styles no focus ring, as
`Button` does not: the reset owns it, and it applies because no component
competes with it. **`mix` reaches the wrapper, not the control** — a property
of the control goes through its token.
```

- [ ] **Step 2: Update the README Status paragraph**

Replace the final paragraph of `packages/ui-remix/README.md` with:

```markdown
`Button`, `LinkButton`, `Stack`, `Row`, `Grid`, `Container`, `Heading`, `Text`,
`Eyebrow`, `Field` and `ThemeStyle` ship. `src/tokens.ts` aggregates the
component records and exports `ComponentTokenName`; the four layout components
add nothing to it, which is what they exist to demonstrate, the three
typographic ones add twenty-two between them, and `Field` adds twenty-seven.
`src/demos.ts` registers nine demos. `runtime.ts` and `compat.ts` are still
stubs — nothing here needs client JavaScript yet.
```

- [ ] **Step 3: Add both cascade rules to design-system.md**

In `docs/design-system.md`, in the "Cascade layers" section, immediately after
the paragraph beginning **"A component's own blocks must be property-disjoint"**
and its closing sentence about `padding-inline`, add:

```markdown
**Disjointness is a question about one element, not one document.** Two blocks
on two different elements never contend for a cascade slot, so a property both
declare is not a collision: `Field`'s label and its control both set `color`,
legitimately. A component that styles several elements asks the question per
element — `test/styles.ts` has `blocksOn(html, tag)` for exactly that, and a
disjointness assertion should check the list is non-empty first, since an empty
one satisfies it without proving anything.

**A shorthand in one block and its longhand in another collide where no test
can see it.** `padding-inline` in a base block and `padding-inline-end` in a
variant block conflict in CSS, while a check that compares property names sees
two different names and passes. `Field` declares padding as longhands
throughout for this reason, and keeps `background` as a shorthand only because
no other block on the control declares a background longhand. The rule is about
a shorthand and a longhand in two blocks on one element, not about shorthands
generally.

**Write the `&` in a nested selector explicitly.** `remix/ui` emits a `css()`
block's nesting verbatim, so `&:disabled` and `& > svg` reach the browser
intact. `&`-led nesting is Chrome 112, below the baseline; bare-element
nesting, `svg { … }` with no `&`, is Chrome 120, above it. The escaping hazard
that bans nesting in `ui-design/src/css` is a different mechanism: that sheet
ships as the text of a style element, where the renderer escapes `&`.
```

- [ ] **Step 4: Close the task in the todo list**

Delete the task 15 line from the M1 list in `todo/TODO.md`, then move the file:

```bash
git mv todo/m1-foundation-and-contract-proof/15-field-native-form-controls-and-constraint-validation.md todo/done/m1-foundation-and-contract-proof/
```

- [ ] **Step 5: Run the gate**

```bash
bun run check
```

Expected: green. `test/packages.test.ts` reads each package's README, so a
malformed edit there fails here.

- [ ] **Step 6: Commit**

```bash
git add packages/ui-remix/README.md docs/design-system.md todo/
git commit -F - <<'EOF'
Document what Field made true

Two cascade rules go into design-system.md because both defeat a check that
looks like it covers them. Disjointness is a question about one element, not
one document, and Field is the first component to style more than one. And a
shorthand in one block with its longhand in another conflicts in CSS while a
name comparison passes.

Also records that nesting in a css() block reaches the browser verbatim, with
the version floor that makes the leading & mandatory rather than stylistic.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

## Status

Field ships when Task 7 is committed and `bun run check` is green: three kinds,
twenty-seven tokens, thirty-two tests, one demo that submits without JavaScript,
and the manual check in Task 6 Step 7 done by a human.

What is deliberately not here, each with its owner:

- `Checkbox`, `Radio`, `Switch`, and a styled `Select` component — M2.
- Multi-select and combobox — M2.
- `fieldset` and `legend` grouping — nothing in M1 needs a grouped control.
- A live round trip in the demo, and the catalogue index — task 19.
- `inputmode` — a one-line addition when something needs it.
- Clearing a stale `aria-invalid` before the next round trip. That needs client
  JavaScript, and Field ships none.
- A focus-ring token, argued out in the spec against task 15's own brief.

## Self-review

**Spec coverage.** Every section maps to a task. The component owning the
control, the surface and the union, and the ids are Task 3. The two renderer
behaviours are Tasks 4 and 5, each pinned by a test that names the behaviour.
The invalid state's two sources are Task 3's `controlBase`. Blocks and the
cascade are split: the per-element helper is Task 1, the shorthand rule is
tested in Task 3 and documented in Task 7, the explicit `&` is documented in
Task 7. Tokens are Task 2. The select's chevron is Task 5. Tests are inside
the task that adds the code they cover, rather than pooled at the end. The demo
is Task 6, and the documents Task 7.

**One gap found and closed.** The spec's block table lists ten blocks;
`requiredStyle` is in Task 3's component but had no assertion of its own. The
`hides the required marker` test covers the markup, and `reads only its own
tokens` covers its declaration, since that test renders a `required` field. No
extra test needed, but worth having checked rather than assumed.

**Type consistency.** `FieldProps`, `FieldInputProps`, `FieldTextareaProps`,
`FieldSelectProps`, `FieldControl`, `FieldType`, `fieldControls`, `fieldTypes`
and `fieldTokens` are spelled the same in every task and in the export list.
`blocksOn(html, tag)` takes the same two arguments everywhere it is called.
`FieldEditable` is internal and deliberately not exported: it is a shape two
kinds share, not a type a caller ever names, and it is extracted in Task 4
where it first has two consumers rather than in Task 3 where it would have
one.

`FieldProps` is the one name that changes meaning across tasks: an alias for
`FieldInputProps` in Task 3, two members after Task 4, three after Task 5.
That is forced rather than chosen — see the narrowing table in the pre-flight
findings — and it means each task's export list grows by the prop type it
declared.

**Test counts.** 16 after Task 3, 22 after Task 4, 29 after Task 5, 32 after
Task 6. If a run disagrees, the plan is wrong about the tests rather than the
code being wrong about the behaviour — recount before changing anything.
