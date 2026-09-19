# Dialog, `overlay()` and the Invoker Commands shim — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `Dialog` and the `overlay()` factory on native `<dialog>` + Invoker Commands, with the compat backfill, the single capture-phase runtime listener, the entry/exit transition, and the first browser test this workspace has ever run.

**Architecture:** Nine tasks. A and B widen contracts other layers own — one schema primitive, one branded type, two props — so the component that follows never reaches past its tier. C and D build the panel and the factory, server-rendered and fully tested with no client code. E registers them, which is what puts the tokens in the emitted sheet. F and G write the two client modules. H wires the playground for the browser and adds the Playwright harness that proves both the native and the shim path. I corrects the documents and closes the task.

**Tech Stack:** TypeScript, `remix/ui` (`css()`, `Handle`, `MixInput`), `bun:test`, Playwright 1.63 as a library, Biome.

## Global Constraints

Copied from the spec, `CLAUDE.md` and `docs/`. Every task's requirements include these.

- **No hard-coded colour, radius, duration, easing or space step in a component.** Every declaration reads a `--ui-dialog-*` token or a structural keyword the component's own test names.
- **A component token default must be `var(--primitive)` or an allowed literal.** `allowedLiterals` in `src/remix/tokens.test.ts` is `transparent`, `1px`, `uppercase`. Dialog adds none.
- **No `color-mix()` in a token default.**
- **SPA-safe.** Nothing under `src/` imports `node:*`, `bun`, `effect`, or a server-side `remix/*` entry. `test/` is exempt; `src/` is not. `test/boundaries.test.ts` enforces it and scans `src/` only.
- **Cross-layer imports inside `src/` are relative and go through the layer's entry point** — `../design/index.ts`, never an arbitrary file inside another layer.
- **A nested selector in a `css()` block must lead with `&`.**
- **Never hand-write a `commandfor`.** Only `overlay()` mints an `Invocation`.
- **Motion names tokens, never literals.** No `200ms`, no `cubic-bezier(...)`.
- **The gate for every change is `bun run check`** (lint + typecheck + test).
- **Commit messages** end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## File Structure

| File | Responsibility | Task |
| --- | --- | --- |
| `src/design/tokens.ts` | Modify: `overlay-max` joins `schema.sizing` | A |
| `src/design/tokens.test.ts` | Modify: assert the new name | A |
| `src/mini/theme.ts` | Modify: a value for `overlay-max` | A |
| `src/remix/invocation.ts` | Create: the branded `Invocation` and its internal mint | B |
| `src/remix/invocation.test.ts` | Create: the brand's runtime shape and its compile-time refusal | B |
| `src/remix/button/button.tsx` | Modify: the `invoke` prop | B |
| `src/remix/button/button.test.tsx` | Modify: invocation renders as attributes | B |
| `src/remix/heading/heading.tsx` | Modify: the `id` prop | B |
| `src/remix/heading/heading.test.tsx` | Modify: `id` reaches the tag | B |
| `src/remix/dialog/tokens.ts` | Create: the 22-token contract | C |
| `src/remix/dialog/dialog.tsx` | Create: `DialogPanel`, internal to the layer | C |
| `src/remix/dialog/dialog.test.tsx` | Create: the panel's suite | C |
| `src/remix/dialog/overlay.tsx` | Create: the `overlay()` factory | D |
| `src/remix/dialog/overlay.test.tsx` | Create: the factory's suite | D |
| `src/remix/dialog/dialog.demo.tsx` | Create: `DialogDemo` | D |
| `src/remix/tokens.ts` | Modify: aggregate `dialogTokens` | E |
| `src/remix/tokens.test.ts` | Modify: the prefix list | E |
| `src/remix/index.ts` | Modify: export `overlay` and its types | E |
| `src/remix/demos.ts` | Modify: register `DialogDemo` | E |
| `src/remix/compat.ts` | Replace the stub: the Invoker Commands backfill | F |
| `src/remix/compat.test.ts` | Create: the no-document guard | F |
| `src/remix/runtime.ts` | Replace the stub: the registry and the one listener | G |
| `src/remix/runtime.test.ts` | Create: registration rules | G |
| `apps/playground/remix.json` | Modify: `allowPackages` | H |
| `apps/playground/app/assets.ts` | Modify: the `ui` mount | H |
| `apps/playground/app/actions/public/entry.ts` | Modify: install both modules, honour `?compat` | H |
| `test/browser/harness.ts` | Create: browser + server lifecycle | H |
| `test/browser/dialog.browser.test.ts` | Create: native path, shim path, ARIA snapshot | H |
| `docs/design-system.md`, `docs/motion.md`, `docs/interactivity.md`, `docs/architecture.md`, `AGENTS.md`, `src/remix/README.md`, `src/design/README.md` | Modify: the documents the work contradicts | I |
| `todo/TODO.md`, `todo/m1-foundation-and-contract-proof/17-*.md` | Modify / move: close task 17 | I |

---

### Task A: `overlay-max` joins the schema

`Dialog` needs a maximum panel width. `schema.sizing` has no name for one and `page-max` is 72rem in `mini` — a page container. A component token must default to a primitive, so the schema is what is short a name.

**Files:**
- Modify: `src/design/tokens.ts`
- Modify: `src/design/tokens.test.ts`
- Modify: `src/mini/theme.ts`

**Interfaces:**
- Produces: the primitive name `overlay-max`, reachable as `var(--overlay-max)` and as a member of `PrimitiveName`.

- [ ] **Step 1: Write the failing test**

In `src/design/tokens.test.ts`, inside the existing `describe("schema", …)` block, after the `it("names no token twice", …)` block:

```ts
  it("names a maximum width for an overlay panel", () => {
    // Dialog is the first component to need a panel width, and page-max is a
    // page container rather than a panel. A component token must default to a
    // primitive, so a size the schema cannot name is the schema's gap, not a
    // licence for a literal in the component.
    expect(schema.sizing).toContain("overlay-max")
  })
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/design/tokens.test.ts`

Expected: FAIL — the received array does not contain `"overlay-max"`.

- [ ] **Step 3: Add the name**

In `src/design/tokens.ts`, in `schema.sizing`, between `"page-max"` and `"gutter"`:

```ts
    "overlay-max",
```

- [ ] **Step 4: Run the typecheck to see the theme break**

Run: `bun run typecheck`

Expected: FAIL — `miniTheme`'s base axis is missing `overlay-max`. That failure is the schema doing its job: a name with no value cannot ship.

- [ ] **Step 5: Give it a value**

In `src/mini/theme.ts`, in `basePrimitives`, immediately after the `"page-max": "72rem",` line:

```ts
  // A dialog, a drawer, a command palette. Narrower than page-max by a lot:
  // this is a panel over a page, not the page.
  "overlay-max": "32rem",
```

- [ ] **Step 6: Run the gate**

Run: `bun run check`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/design/tokens.ts src/design/tokens.test.ts src/mini/theme.ts
git commit -m "$(cat <<'EOF'
Add the overlay-max primitive (M1 task 17)

Dialog needs a maximum panel width and the sizing group has no name for
one; page-max is 72rem in mini, a page container rather than a panel. A
component token must default to a primitive, so the missing name is the
schema's gap. mini gives it 32rem.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task B: the branded `Invocation`, and the two props that carry it

A mismatched `commandfor` fails silently — no error, no event, no warning. The rule is that nobody writes one, and this task makes the type checker hold that rule rather than a reviewer.

**Files:**
- Create: `src/remix/invocation.ts`
- Create: `src/remix/invocation.test.ts`
- Modify: `src/remix/button/button.tsx`
- Modify: `src/remix/button/button.test.tsx`
- Modify: `src/remix/heading/heading.tsx`
- Modify: `src/remix/heading/heading.test.tsx`

**Interfaces:**
- Produces, for Tasks C and D:
  - `interface Invocation { readonly command: string; readonly commandfor: string }`, carrying a module-private brand
  - `function invoke(command: string, commandfor: string): Invocation`
  - `ButtonProps.invoke?: Invocation | undefined`
  - `HeadingProps.id?: string | undefined`

- [ ] **Step 1: Write the failing test**

Create `src/remix/invocation.test.ts`:

```ts
import { describe, expect, it } from "bun:test"
import { type Invocation, invoke } from "./invocation.ts"

describe("invoke", () => {
  it("carries the pair a button needs and nothing else", () => {
    expect({ ...invoke("show-modal", "new-task") }).toEqual({
      command: "show-modal",
      commandfor: "new-task",
    })
  })

  it("refuses a hand-written pair at compile time", () => {
    // The whole point of the brand. This is a typecheck assertion, not a
    // runtime one: `bun run typecheck` covers test files, so the
    // @ts-expect-error fails the gate the day the brand stops working.
    // @ts-expect-error a plain object is not an Invocation
    const forged: Invocation = { command: "show-modal", commandfor: "new-task" }
    expect(forged.commandfor).toBe("new-task")
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/remix/invocation.test.ts`

Expected: FAIL — the module `./invocation.ts` does not resolve.

- [ ] **Step 3: Write the module**

Create `src/remix/invocation.ts`:

```ts
/**
 * The `command`/`commandfor` pair, as a value only this package can make.
 *
 * A mismatched or unsupported `commandfor` produces no error, no event and no
 * console warning — a dead click. Every other guard against that is a
 * convention someone has to remember; this one is the type checker. The brand
 * is a `declare`d symbol, so it exists at compile time and not at runtime, and
 * there is no expression outside this module that produces a value the type
 * accepts.
 *
 * Two limits worth naming. It protects components in this package, not a
 * consumer's own `<button command=… commandfor=…>`, which nothing here can
 * see. And it is compile-time only, so a JavaScript consumer gets nothing from
 * it.
 */
declare const invocationBrand: unique symbol

export interface Invocation {
  readonly [invocationBrand]: true
  readonly command: string
  readonly commandfor: string
}

/**
 * Internal. `src/remix/index.ts` publishes the type and never this function,
 * so a consumer reaches an `Invocation` through `overlay()` or not at all.
 */
export function invoke(command: string, commandfor: string): Invocation {
  return { command, commandfor } as unknown as Invocation
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `bun test src/remix/invocation.test.ts`

Expected: PASS, both tests.

- [ ] **Step 5: Write the failing test for Button**

Append to `src/remix/button/button.test.tsx`, inside the existing `describe("Button", …)` block:

```tsx
  it("renders an invocation as the attribute pair, and nothing when absent", async () => {
    // commandfor only works on <button>, and only as an attribute pair. The
    // invocation is destructured rather than spread because it carries a
    // symbol key that no element's props accept.
    const markup = markupOf(
      await renderToHtml(<Button invoke={invoke("show-modal", "new-task")}>Open</Button>),
    )
    expect(markup).toContain('command="show-modal"')
    expect(markup).toContain('commandfor="new-task"')

    const bare = markupOf(await renderToHtml(<Button>Plain</Button>))
    expect(bare).not.toContain("command")
  })
```

Add the imports it needs at the top of the file: `invoke` from `../invocation.ts`, and `markupOf` from `../../../test/styles.ts` if the file does not already import it.

- [ ] **Step 6: Run it to verify it fails**

Run: `bun test src/remix/button/button.test.tsx`

Expected: FAIL — `invoke` is not a known property of `ButtonProps`, and the rendered markup carries no `command` attribute.

- [ ] **Step 7: Add the prop**

In `src/remix/button/button.tsx`, add the import at the top:

```ts
import type { Invocation } from "../invocation.ts"
```

In `ButtonProps`, after the `value` property:

```ts
  /**
   * What this button invokes, minted by `overlay()`. There is deliberately no
   * `command`/`commandfor` pair here: a mismatched id fails silently, so the
   * only way to set the attributes is with a value the factory produced.
   */
  invoke?: Invocation | undefined
```

In the `Button` function, widen the destructure and pass the pair:

```tsx
export function Button(handle: Handle<ButtonProps>) {
  return () => {
    const { tone = "neutral", size = "md", type = "button" } = handle.props
    const { disabled, name, value, invoke, mix, children } = handle.props
    return (
      <button
        command={invoke?.command}
        commandfor={invoke?.commandfor}
        disabled={disabled}
        mix={[buttonBase, toneStyles[tone], sizeStyles[size], mix]}
        name={name}
        type={type}
        value={value}
      >
        {children}
      </button>
    )
  }
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `bun test src/remix/button/button.test.tsx`

Expected: PASS, every test in the file.

- [ ] **Step 9: Write the failing test for Heading**

Append to `src/remix/heading/heading.test.tsx`, inside the existing `describe("Heading", …)` block:

```tsx
  it("renders an id, so something can point at it", async () => {
    // Dialog's aria-labelledby names the title. The alternative — an
    // aria-label repeating the title string — names the dialog twice and
    // drifts the first time one copy is edited.
    const markup = markupOf(await renderToHtml(<Heading id="new-task-title" level={2}>New task</Heading>))
    expect(markup).toContain('id="new-task-title"')
  })
```

Add `markupOf` to the file's import from `../../../test/styles.ts` if it is not already there.

- [ ] **Step 10: Run it to verify it fails**

Run: `bun test src/remix/heading/heading.test.tsx`

Expected: FAIL — `id` is not a known property of `HeadingProps`.

- [ ] **Step 11: Add the prop**

In `src/remix/heading/heading.tsx`, in `HeadingProps`, after `size`:

```ts
  /**
   * For an `aria-labelledby` or a deep link. `Field` already carries one for
   * the same reason: a label that points at nothing is worse than no label.
   */
  id?: string | undefined
```

and in the render:

```tsx
export function Heading(handle: Handle<HeadingProps>) {
  return () => {
    const { level, size = level, id, mix, children } = handle.props
    const Tag = tags[level]
    return (
      <Tag id={id} mix={[headingBase, sizeStyles[size], mix]}>
        {children}
      </Tag>
    )
  }
}
```

- [ ] **Step 12: Run the gate**

Run: `bun run check`

Expected: PASS.

- [ ] **Step 13: Commit**

```bash
git add src/remix/invocation.ts src/remix/invocation.test.ts src/remix/button src/remix/heading
git commit -m "$(cat <<'EOF'
Make a commandfor impossible to hand-write (M1 task 17)

A mismatched commandfor produces no error and no event, so the pair now
travels as a branded Invocation that only this package can construct.
Button takes it as one opaque prop and destructures it onto the element;
the brand is a declared symbol, so there is no expression outside
invocation.ts that satisfies the type. The refusal is asserted with a
@ts-expect-error, which the typecheck step of the gate covers.

Heading gains an id so Dialog's aria-labelledby can name the real title
instead of duplicating it into an aria-label.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task C: the panel, its contract and its motion

**Files:**
- Create: `src/remix/dialog/tokens.ts`
- Create: `src/remix/dialog/dialog.tsx`
- Create: `src/remix/dialog/dialog.test.tsx`

**Interfaces:**
- Consumes: `Invocation` from `../invocation.ts`; `Heading` from `../heading/heading.tsx`; `css`, `Handle`, `MixInput`, `RemixNode` from `remix/ui`.
- Produces, for Task D:
  - `dialogTokens: { readonly [name: string]: string }` from `./dialog/tokens.ts`
  - `DialogPanel(handle: Handle<DialogPanelProps>): () => RemixNode` from `./dialog/dialog.tsx`
  - `interface DialogPanelProps { id: string; title: string; close: Invocation; mix?: MixInput<HTMLDialogElement> | undefined; children?: RemixNode | undefined }`

- [ ] **Step 1: Write the token contract**

Create `src/remix/dialog/tokens.ts`:

```ts
/**
 * Dialog's contract. Twenty-two names, every default a primitive except the
 * two literals `allowedLiterals` already holds for Button and Field.
 *
 * `backdrop-bg` reads `scrim`, the primitive that exists for exactly this. It
 * resolves only where `::backdrop` inherits from its originating element —
 * Chromium 122, Safari 17.4, Firefox 120 — and below that the modal opens over
 * an undimmed page. That degradation is accepted and documented in
 * docs/design-system.md; the alternatives are a pseudo-element in the emitter
 * or a hard-coded colour here.
 *
 * `enter-offset` is how far the panel travels on entry, as a space step rather
 * than a literal: how much a dialog moves is a brand's decision.
 *
 * There are no title tokens. The title is a `Heading`, so it reads the
 * typographic contract every other heading reads.
 */
export const dialogTokens = {
  "ui-dialog-max-inline-size": "var(--overlay-max)",
  "ui-dialog-inset": "var(--gutter)",
  "ui-dialog-bg": "var(--surface-raised)",
  "ui-dialog-ink": "var(--ink)",
  "ui-dialog-border": "var(--hairline)",
  "ui-dialog-border-width": "1px",
  "ui-dialog-radius": "var(--r-lg)",
  "ui-dialog-shadow": "var(--shadow-lg)",
  "ui-dialog-pad": "var(--sp-6)",
  "ui-dialog-gap": "var(--sp-4)",
  "ui-dialog-header-gap": "var(--sp-4)",

  "ui-dialog-close-size": "var(--control-h-sm)",
  "ui-dialog-close-radius": "var(--r-sm)",
  "ui-dialog-close-bg": "transparent",
  "ui-dialog-close-bg-hover": "var(--surface-hover)",
  "ui-dialog-close-ink": "var(--ink-muted)",
  "ui-dialog-close-ink-hover": "var(--ink)",
  "ui-dialog-close-glyph-size": "var(--fs-md)",

  "ui-dialog-backdrop-bg": "var(--scrim)",

  "ui-dialog-transition-duration": "var(--dur-fast)",
  "ui-dialog-transition-easing": "var(--ease-out-quad)",
  "ui-dialog-enter-offset": "var(--sp-2)",
} as const
```

- [ ] **Step 2: Write the failing test**

Create `src/remix/dialog/dialog.test.tsx`:

```tsx
import { describe, expect, it } from "bun:test"
import { css } from "remix/ui"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, markupOf, sharedProperties, stylesOf } from "../../../test/styles.ts"
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
    expect(markup).not.toContain("aria-label=\"New task\"")
  })

  it("renders a close button bound to its own dialog", async () => {
    const markup = markupOf(await renderToHtml(panel()))
    expect(markup).toContain('command="close"')
    expect(markup).toContain('commandfor="new-task"')
    expect(markup).toContain('aria-label="Close"')
  })

  it("reads only its own tokens and structural keywords", async () => {
    expect(offendersIn(stylesOf(await renderToHtml(panel())))).toEqual([])
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    const read = new Set(
      [...stylesOf(await renderToHtml(panel())).matchAll(/var\(--(ui-dialog-[\w-]+)\)/g)].map(
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
    const styles = stylesOf(await renderToHtml(panel()))
    const openBlock = /&\[open\]\s*\{([^}]*)\}/.exec(styles)?.[1] ?? ""
    expect(openBlock).toContain("display: grid")
    expect(styles.replace(/&\[open\][^}]*\}/g, "")).not.toContain("display: grid")
  })

  it("declares the transition twice, the second with allow-discrete", async () => {
    // motion.md: the first keeps opacity and translate moving where
    // transition-behavior is unknown, and the second upgrades it where it is
    // not. A JS object cannot hold one key twice, so the second sits in a
    // nested `&` block — same specificity, later in source order.
    const styles = stylesOf(await renderToHtml(panel()))
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
  })

  it("animates from the state being entered, not the resting one", async () => {
    // @starting-style targeting `dialog` rather than `dialog[open]` is the
    // most common way to get no animation at all.
    const styles = stylesOf(await renderToHtml(panel()))
    const startingStyle = /@starting-style\s*\{([\s\S]*?)\n\}/.exec(styles)?.[1] ?? ""
    expect(startingStyle).toContain("&[open]")
    expect(startingStyle).toContain("&[open]::backdrop")
  })

  it("tints the backdrop from its own token", async () => {
    const styles = stylesOf(await renderToHtml(panel()))
    expect(styles).toContain("&::backdrop")
    expect(styles).toContain("background: var(--ui-dialog-backdrop-bg)")
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
```

- [ ] **Step 3: Run it to verify it fails**

Run: `bun test src/remix/dialog/dialog.test.tsx`

Expected: FAIL — the module `./dialog.tsx` does not resolve.

- [ ] **Step 4: Write the component**

Create `src/remix/dialog/dialog.tsx`:

```tsx
import { css, type Handle, type MixInput, type RemixNode } from "remix/ui"
import { Heading } from "../heading/heading.tsx"
import type { Invocation } from "../invocation.ts"

const duration = "var(--ui-dialog-transition-duration)"
const timing = `${duration} var(--ui-dialog-transition-easing)`
const offset = "0 calc(var(--ui-dialog-enter-offset) * -1)"

/**
 * The panel, its entry and its exit.
 *
 * `display` is declared **only** inside `&[open]`, and moving it is how this
 * component breaks. A closed `<dialog>` is `display: none` from the user-agent
 * sheet, and any author declaration beats that — cascade layers do not change
 * it, because layered author CSS still outranks the UA origin. A `display:
 * grid` at the top level renders every dialog on the page whether it is open
 * or not.
 *
 * The `transition` shorthand is declared twice, per docs/motion.md: the first
 * keeps `opacity` and `translate` moving on an engine with no
 * `transition-behavior`, the second upgrades it where there is one. A
 * JavaScript object cannot hold the same key twice, so the second sits in a
 * nested `&` block — CSS nesting gives it the same specificity, later in
 * source order, and where `allow-discrete` is unknown the whole declaration is
 * invalid and dropped, leaving the first.
 *
 * `@starting-style` targets `&[open]`, the state being entered. Targeting the
 * resting state is the most common way to get nothing.
 *
 * `overlay` is not Baseline and is absent in Safari, so the exit animation
 * degrades there while the entry animation works. That is accepted rather than
 * replaced with a JavaScript close sequence.
 */
const panelStyle = css({
  maxInlineSize: "min(var(--ui-dialog-max-inline-size), calc(100% - var(--ui-dialog-inset) * 2))",
  maxBlockSize: "calc(100% - var(--ui-dialog-inset) * 2)",
  overflow: "auto",
  gap: "var(--ui-dialog-gap)",
  padding: "var(--ui-dialog-pad)",
  background: "var(--ui-dialog-bg)",
  color: "var(--ui-dialog-ink)",
  borderStyle: "solid",
  borderWidth: "var(--ui-dialog-border-width)",
  borderColor: "var(--ui-dialog-border)",
  borderRadius: "var(--ui-dialog-radius)",
  boxShadow: "var(--ui-dialog-shadow)",
  opacity: 0,
  translate: offset,
  transition: `opacity ${timing}, translate ${timing}`,
  "&": {
    transition: `opacity ${timing}, translate ${timing}, overlay ${duration} allow-discrete, display ${duration} allow-discrete`,
  },
  "&[open]": {
    display: "grid",
    opacity: 1,
    translate: "0 0",
  },
  "&::backdrop": {
    background: "var(--ui-dialog-backdrop-bg)",
    opacity: 0,
    transition: `opacity ${timing}`,
  },
  "&[open]::backdrop": {
    opacity: 1,
  },
  "@starting-style": {
    "&[open]": { opacity: 0, translate: offset },
    "&[open]::backdrop": { opacity: 0 },
  },
})

const headerStyle = css({
  display: "flex",
  alignItems: "start",
  justifyContent: "space-between",
  gap: "var(--ui-dialog-header-gap)",
})

/**
 * The × is this component's own button rather than a `Button`, because an
 * icon-only button is a square sized by its glyph and `Button` declares
 * `height` and `padding-inline` from its own tokens. Overriding those through
 * `mix` is the thing `mix` cannot reliably do: each `css()` block is its own
 * cascade sub-layer and sub-layer order follows first render, not array order.
 *
 * No `outline`: the reset's `:where(:focus-visible)` rule owns the focus ring.
 */
const closeStyle = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  inlineSize: "var(--ui-dialog-close-size)",
  blockSize: "var(--ui-dialog-close-size)",
  borderStyle: "none",
  borderRadius: "var(--ui-dialog-close-radius)",
  background: "var(--ui-dialog-close-bg)",
  color: "var(--ui-dialog-close-ink)",
  cursor: "pointer",
  "&:hover": {
    background: "var(--ui-dialog-close-bg-hover)",
    color: "var(--ui-dialog-close-ink-hover)",
  },
})

/**
 * Real markup rather than a `background-image` data URI, for the reason
 * Field's chevron gives: `var()` does not resolve inside `url()`, so that
 * glyph's colour would be a literal no theme could retune.
 */
const glyphStyle = css({
  inlineSize: "var(--ui-dialog-close-glyph-size)",
  blockSize: "var(--ui-dialog-close-glyph-size)",
})

export interface DialogPanelProps {
  /** Minted by `overlay()`. Also the stem of the title's id. */
  id: string
  /** Required: a modal with no accessible name is a broken modal. */
  title: string
  /** The dismissal, minted by `overlay()` alongside the id. */
  close: Invocation
  /**
   * Adds properties the panel does not declare. It does not reliably override
   * one it does — sub-layer order, not array order, decides — so reach for the
   * `--ui-dialog-*` token instead.
   */
  mix?: MixInput<HTMLDialogElement> | undefined
  children?: RemixNode | undefined
}

/**
 * Internal to the layer: `src/remix/index.ts` publishes `overlay()` and not
 * this, so no caller can render a dialog whose id was not minted with its
 * trigger.
 */
export function DialogPanel(handle: Handle<DialogPanelProps>) {
  return () => {
    const { id, title, close, mix, children } = handle.props
    const titleId = `${id}-title`
    return (
      <dialog aria-labelledby={titleId} id={id} mix={[panelStyle, mix]}>
        <header mix={headerStyle}>
          <Heading id={titleId} level={2}>
            {title}
          </Heading>
          <button
            aria-label="Close"
            command={close.command}
            commandfor={close.commandfor}
            mix={closeStyle}
            type="button"
          >
            <svg aria-hidden="true" fill="none" mix={glyphStyle} viewBox="0 0 12 12">
              <path
                d="M3.5 3.5L8.5 8.5M8.5 3.5L3.5 8.5"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="1.5"
              />
            </svg>
          </button>
        </header>
        {children}
      </dialog>
    )
  }
}
```

- [ ] **Step 5: Run the tests and make them pass**

Run: `bun test src/remix/dialog/dialog.test.tsx`

Expected: PASS, all twelve tests.

If "reads only its own tokens and structural keywords" reports a keyword the component genuinely needs — `start` and `space-between` are the two most likely to differ from what `remix/ui` emits — add it to the `keywords` set with a one-line reason rather than changing the component. If it reports a `var(--sp-…)` or a colour, the component is wrong: route it through a `--ui-dialog-*` token.

- [ ] **Step 6: Run the gate**

Run: `bun run check`

Expected: PASS. `src/remix/tokens.test.ts` does not see `dialogTokens` yet — Task E wires it — so its assertions pass trivially here.

- [ ] **Step 7: Commit**

```bash
git add src/remix/dialog
git commit -m "$(cat <<'EOF'
Add the dialog panel and its motion (M1 task 17)

Twenty-two tokens, no derivation, and no literal beyond the 1px and
transparent that Button and Field already established. The entry and
exit transition ships with the component rather than in a later pass:
the transition shorthand twice — the second in a nested & block, because
a JS object cannot hold one key twice — and @starting-style on the state
being entered.

display is declared only inside &[open]. A closed <dialog> is
display:none from the UA sheet and any author declaration beats it, so a
top-level display would render every dialog on the page. A test holds
that line.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task D: the factory and the demo

**Files:**
- Create: `src/remix/dialog/overlay.tsx`
- Create: `src/remix/dialog/overlay.test.tsx`
- Create: `src/remix/dialog/dialog.demo.tsx`

**Interfaces:**
- Consumes: `DialogPanel`, `DialogPanelProps` from `./dialog.tsx`; `invoke`, `Invocation` from `../invocation.ts`; `Button`, `ButtonProps` from `../button/button.tsx`.
- Produces, for Task E:
  - `overlay(name: string): Overlay`
  - `interface Overlay { readonly id: string; readonly Trigger: …; readonly Dialog: …; readonly Close: … }`
  - `type OverlayButtonProps = Omit<ButtonProps, "invoke">`
  - `interface OverlayDialogProps { title: string; mix?: MixInput<HTMLDialogElement> | undefined; children?: RemixNode | undefined }`
  - `DialogDemo(): () => RemixNode` from `./dialog.demo.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/remix/dialog/overlay.test.tsx`:

```tsx
import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { markupOf } from "../../../test/styles.ts"
import { DialogDemo } from "./dialog.demo.tsx"
import { overlay } from "./overlay.tsx"

describe("overlay", () => {
  it("binds a trigger to the dialog it opens, with one string written once", async () => {
    const NewTask = overlay("new-task")
    const markup = markupOf(
      await renderToHtml(
        <>
          <NewTask.Trigger tone="primary">New task</NewTask.Trigger>
          <NewTask.Dialog title="New task">Body</NewTask.Dialog>
        </>,
      ),
    )
    expect(markup).toContain('command="show-modal"')
    expect(markup).toContain('commandfor="new-task"')
    expect(markup).toContain('<dialog aria-labelledby="new-task-title" id="new-task"')
  })

  it("gives Close the dismissal, so a caller's cancel button needs no id", async () => {
    const NewTask = overlay("new-task")
    const markup = markupOf(
      await renderToHtml(<NewTask.Close tone="ghost">Cancel</NewTask.Close>),
    )
    expect(markup).toContain('command="close"')
    expect(markup).toContain('commandfor="new-task"')
    expect(markup).toContain("Cancel")
  })

  it("passes a trigger's button props through", async () => {
    // Trigger is a Button, so tone, size and disabled are not reinvented here.
    const NewTask = overlay("new-task")
    const markup = markupOf(
      await renderToHtml(
        <NewTask.Trigger disabled size="sm">
          New task
        </NewTask.Trigger>,
      ),
    )
    expect(markup).toContain("disabled")
  })

  it("exposes the id it minted", () => {
    expect(overlay("new-task").id).toBe("new-task")
  })

  it("keeps two overlays apart", async () => {
    const First = overlay("first")
    const Second = overlay("second")
    const markup = markupOf(
      await renderToHtml(
        <>
          <First.Trigger>One</First.Trigger>
          <Second.Trigger>Two</Second.Trigger>
        </>,
      ),
    )
    expect(markup).toContain('commandfor="first"')
    expect(markup).toContain('commandfor="second"')
  })

  it("renders complete markup with no script", async () => {
    // The no-JS claim, asserted where it is cheap. The invocation is in the
    // markup the server sent; nothing waits for a client module to arrive.
    const NewTask = overlay("new-task")
    const html = await renderToHtml(
      <>
        <NewTask.Trigger>New task</NewTask.Trigger>
        <NewTask.Dialog title="New task">Body</NewTask.Dialog>
      </>,
    )
    expect(html).not.toContain("<script")
  })
})

describe("DialogDemo", () => {
  it("shows a trigger, a dialog and a form that cancels", async () => {
    const markup = markupOf(await renderToHtml(<DialogDemo />))
    expect(markup).toContain('command="show-modal"')
    expect(markup).toContain('command="close"')
    expect(markup).toContain("<form")
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/remix/dialog/overlay.test.tsx`

Expected: FAIL — the module `./overlay.tsx` does not resolve.

- [ ] **Step 3: Write the factory**

Create `src/remix/dialog/overlay.tsx`:

```tsx
import type { Handle, MixInput, RemixNode } from "remix/ui"
import { Button, type ButtonProps } from "../button/button.tsx"
import { invoke } from "../invocation.ts"
import { DialogPanel } from "./dialog.tsx"

/** A trigger and a close button are Buttons; only `invoke` is the factory's. */
export type OverlayButtonProps = Omit<ButtonProps, "invoke">

export interface OverlayDialogProps {
  title: string
  mix?: MixInput<HTMLDialogElement> | undefined
  children?: RemixNode | undefined
}

export interface Overlay {
  /** The minted id, for an `aria-controls` a caller needs to write. */
  readonly id: string
  readonly Trigger: (handle: Handle<OverlayButtonProps>) => () => RemixNode
  readonly Dialog: (handle: Handle<OverlayDialogProps>) => () => RemixNode
  readonly Close: (handle: Handle<OverlayButtonProps>) => () => RemixNode
}

/**
 * Mints an id and binds both halves of `commandfor` to it, so there is no
 * string to mistype:
 *
 * ```tsx
 * const NewTask = overlay("new-task")
 *
 * <NewTask.Trigger tone="primary">New task</NewTask.Trigger>
 * <NewTask.Dialog title="New task">
 *   <form method="post" action={…}>
 *     …
 *     <NewTask.Close tone="ghost">Cancel</NewTask.Close>
 *   </form>
 * </NewTask.Dialog>
 * ```
 *
 * `name` is used as the id verbatim, with no sanitising, exactly as `Field`
 * uses its `name`. Two overlays sharing a name render two elements with one
 * id, which is a duplicate-id bug — and sanitising would hide its cause rather
 * than prevent it.
 *
 * Call it at module scope or at the top of a render, once per overlay. It
 * closes over nothing but strings, so calling it twice with the same name is
 * harmless in itself; rendering both results is not.
 */
export function overlay(name: string): Overlay {
  const show = invoke("show-modal", name)
  const close = invoke("close", name)

  function Trigger(handle: Handle<OverlayButtonProps>) {
    return () => <Button {...handle.props} invoke={show} />
  }

  function Close(handle: Handle<OverlayButtonProps>) {
    return () => <Button {...handle.props} invoke={close} />
  }

  function Dialog(handle: Handle<OverlayDialogProps>) {
    return () => {
      const { title, mix, children } = handle.props
      return (
        <DialogPanel close={close} id={name} mix={mix} title={title}>
          {children}
        </DialogPanel>
      )
    }
  }

  return { id: name, Trigger, Dialog, Close }
}
```

- [ ] **Step 4: Write the demo**

Create `src/remix/dialog/dialog.demo.tsx`:

```tsx
import { css } from "remix/ui"
import { Button } from "../button/button.tsx"
import { Field } from "../field/field.tsx"
import { Row } from "../row/row.tsx"
import { Stack } from "../stack/stack.tsx"
import { Text } from "../text/text.tsx"
import { overlay } from "./overlay.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const NewTask = overlay("new-task")

export function DialogDemo() {
  return () => (
    <>
      <p mix={label}>dialog: native modal, invoker commands, no client code in the page</p>
      <Stack gap={4}>
        <NewTask.Trigger tone="primary">New task</NewTask.Trigger>
        <Text>
          The trigger is a button carrying <code>command</code> and <code>commandfor</code>. Nothing
          on this page binds a click handler to it.
        </Text>
      </Stack>
      <NewTask.Dialog title="New task">
        <form method="post">
          <Stack gap={4}>
            <Field label="Title" name="title" required />
            <Field control="textarea" label="Notes" name="notes" rows={3} />
            <Row gap={2} justify="end">
              <NewTask.Close tone="ghost">Cancel</NewTask.Close>
              <Button tone="primary" type="submit">
                Create
              </Button>
            </Row>
          </Stack>
        </form>
      </NewTask.Dialog>
    </>
  )
}
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `bun test src/remix/dialog/overlay.test.tsx`

Expected: PASS, all seven tests.

If `Stack`'s or `Row`'s props differ from `gap={4}` / `justify="end"`, read `src/remix/stack/stack.tsx` and `src/remix/row/row.tsx` for the real signatures and use those. The demo is the only place this matters.

- [ ] **Step 6: Run the gate**

Run: `bun run check`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/remix/dialog
git commit -m "$(cat <<'EOF'
Add overlay(), the factory that mints both halves (M1 task 17)

overlay(name) returns the id, a Trigger, a Dialog and a Close. The
trigger and the close button are Buttons carrying the factory's own
Invocation, so tone, size and disabled are not reinvented and the
commandfor string is written once.

The demo is a real form in a real modal, so the catalogue page exercises
the whole protocol rather than an empty panel.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task E: register it

Until this task `overlay` is unreachable from `@lemol/ui/remix` and `dialogTokens` is absent from the emitted stylesheet, so every default resolves to nothing in a real page.

**Files:**
- Modify: `src/remix/tokens.ts`
- Modify: `src/remix/tokens.test.ts`
- Modify: `src/remix/index.ts`
- Modify: `src/remix/demos.ts`

**Interfaces:**
- Consumes: `dialogTokens`, `overlay`, `Overlay`, `OverlayButtonProps`, `OverlayDialogProps`, `Invocation`, `DialogDemo` from Tasks B–D.
- Produces: `overlay` on the `@lemol/ui/remix` entry point; `dialog` as a `DemoName`.

- [ ] **Step 1: Write the failing test**

In `src/remix/tokens.test.ts`, in the existing `it("holds every component's tokens, Badge included", …)`, add `"ui-dialog"` to the expected list, keeping it sorted:

```ts
    expect([...prefixes].sort()).toEqual([
      "ui-badge",
      "ui-btn",
      "ui-dialog",
      "ui-eyebrow",
      "ui-field",
      "ui-heading",
      "ui-text",
    ])
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/remix/tokens.test.ts`

Expected: FAIL — the received array lacks `"ui-dialog"`.

- [ ] **Step 3: Aggregate the tokens**

In `src/remix/tokens.ts`, add the import in alphabetical position, after `buttonTokens`:

```ts
import { dialogTokens } from "./dialog/tokens.ts"
```

and the spread, after `...buttonTokens`:

```ts
  ...dialogTokens,
```

- [ ] **Step 4: Run it to verify it passes**

Run: `bun test src/remix/tokens.test.ts`

Expected: PASS.

- [ ] **Step 5: Export the factory**

In `src/remix/index.ts`, after the `Container` export and before `Eyebrow`, keeping alphabetical order by exported name:

```ts
export type { Invocation } from "./invocation.ts"
export {
  overlay,
  type Overlay,
  type OverlayButtonProps,
  type OverlayDialogProps,
} from "./dialog/overlay.tsx"
```

`DialogPanel` is deliberately not exported: a dialog whose id was not minted with its trigger is the failure `overlay()` exists to prevent.

- [ ] **Step 6: Register the demo**

In `src/remix/demos.ts`, add the import after `ContainerDemo`:

```ts
import { DialogDemo } from "./dialog/dialog.demo.tsx"
```

and the entry after `container`:

```ts
  dialog: { title: "Dialog", Demo: DialogDemo },
```

- [ ] **Step 7: Run the gate**

Run: `bun run check`

Expected: PASS. `src/mini/theme.test.ts` now typechecks the dialog token names through `ComponentTokenName`.

- [ ] **Step 8: Commit**

```bash
git add src/remix/tokens.ts src/remix/tokens.test.ts src/remix/index.ts src/remix/demos.ts
git commit -m "$(cat <<'EOF'
Register Dialog and overlay() (M1 task 17)

Aggregates dialog/tokens.ts into componentTokens — without it every
default resolves to nothing in a real page — publishes overlay() and the
Invocation type on the remix entry point, and registers the demo.

DialogPanel stays internal. A dialog whose id was not minted with its
trigger is the failure the factory exists to prevent, so the factory is
the only way to reach one.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task F: `compat.ts`, the Invoker Commands backfill

**Files:**
- Modify: `src/remix/compat.ts` (currently `export {}`)
- Create: `src/remix/compat.test.ts`

**Interfaces:**
- Produces: `installInvokerCommands(options?: { force?: boolean | undefined }): void`, and the same call at module scope.

- [ ] **Step 1: Write the failing test**

Create `src/remix/compat.test.ts`:

```ts
import { describe, expect, it } from "bun:test"
import { installInvokerCommands } from "./compat.ts"

describe("installInvokerCommands", () => {
  it("does nothing where there is no document", () => {
    // Importing this module on the server must not throw: the package is one
    // installable unit, and a server render reaches the barrel. The browser
    // behaviour is covered in test/browser/dialog.browser.test.ts, because a
    // DOM shim here would be testing the shim.
    expect(() => installInvokerCommands()).not.toThrow()
    expect(() => installInvokerCommands({ force: true })).not.toThrow()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/remix/compat.test.ts`

Expected: FAIL — `installInvokerCommands` is not exported from `./compat.ts`.

- [ ] **Step 3: Write the backfill**

Replace the contents of `src/remix/compat.ts`:

```ts
/**
 * The Invoker Commands backfill.
 *
 * It exists for one reason: below Baseline December 2025, `command` and
 * `commandfor` are inert attributes. No error, no event, no console warning —
 * a dead click. That silent failure is worse than a thrown exception, and this
 * closes it with markup that is identical either way.
 *
 * Import it for its side effect — `import "@lemol/ui/remix/compat"` — and it
 * installs itself when the platform needs it. The named export exists for the
 * one caller that has to install it deliberately: see `force` below.
 *
 * The architecture note estimated fifteen lines. With six built-in commands,
 * the idempotence guard and the event construction it is nearer forty. The
 * estimate was the size of the idea, not a budget, and a half-backfill that
 * covers dialogs while leaving popovers dead is not worth the saving.
 */

const installedFlag = Symbol.for("@lemol/ui/invoker-commands")

type InstallFlags = Record<symbol, boolean | undefined>

export interface InstallInvokerCommandsOptions {
  /**
   * Install over a platform that already has Invoker Commands.
   *
   * This is not only a test affordance. Without the suppression it turns on,
   * a page that loaded this backfill on an engine which later gains native
   * support would act twice on every click — the platform's own invocation
   * and this one — and the second `showModal()` throws. That is the ordinary
   * upgrade path for every browser we do not control.
   */
  force?: boolean | undefined
}

/** The commands the platform defines. A `--` command performs nothing here. */
const builtins = new Set([
  "show-modal",
  "close",
  "request-close",
  "toggle-popover",
  "show-popover",
  "hide-popover",
])

const isDialog = (element: Element): element is HTMLDialogElement =>
  element instanceof HTMLDialogElement

const perform = (element: Element, command: string): void => {
  if (!builtins.has(command)) return
  if (isDialog(element)) {
    if (command === "show-modal" && !element.open) element.showModal()
    if (command === "close" && element.open) element.close()
    if (command === "request-close" && element.open) {
      // requestClose() is Chrome 135, the same floor as the feature this
      // module backfills, so on the engines that need this it is absent.
      const dialog = element as HTMLDialogElement & { requestClose?: () => void }
      if (typeof dialog.requestClose === "function") dialog.requestClose()
      else element.close()
    }
    return
  }
  const popover = element as Element & {
    togglePopover?: () => void
    showPopover?: () => void
    hidePopover?: () => void
  }
  if (command === "toggle-popover") popover.togglePopover?.()
  if (command === "show-popover") popover.showPopover?.()
  if (command === "hide-popover") popover.hidePopover?.()
}

const onClick = (event: MouseEvent): void => {
  if (event.defaultPrevented || event.button !== 0) return
  const origin = event.target
  if (!(origin instanceof Element)) return
  const button = origin.closest("button[command][commandfor]")
  if (!(button instanceof HTMLButtonElement) || button.disabled) return

  const receiver = document.getElementById(button.getAttribute("commandfor") ?? "")
  if (receiver === null) return
  const command = button.getAttribute("command") ?? ""

  // A real CommandEvent where the constructor exists, and an Event carrying
  // the same two properties where it does not — which is every engine that
  // needs this module. Non-bubbling, composed and cancellable, as the
  // platform's own is, so `runtime.ts` reads one shape either way.
  const invocation = new Event("command", { bubbles: false, composed: true, cancelable: true })
  Object.defineProperties(invocation, {
    command: { value: command, enumerable: true },
    source: { value: button, enumerable: true },
  })

  receiver.dispatchEvent(invocation)
  if (invocation.defaultPrevented) return
  perform(receiver, command)
}

/** Cancels the platform's own invocation so a forced install does not double. */
const suppressNative = (event: Event): void => {
  if (event.isTrusted) event.preventDefault()
}

export function installInvokerCommands(options?: InstallInvokerCommandsOptions): void {
  if (typeof document === "undefined") return

  const flags = globalThis as unknown as InstallFlags
  if (flags[installedFlag] === true) return

  const native = "commandForElement" in HTMLButtonElement.prototype
  if (native && options?.force !== true) return

  flags[installedFlag] = true

  // Only when forced over a platform that has the feature. WHATWG HTML
  // initialises CommandEvent with cancelable: true and checks it before the
  // default action, so cancelling the trusted event hands authority here.
  if (native) document.addEventListener("command", suppressNative, true)

  document.addEventListener("click", onClick, true)
}

installInvokerCommands()
```

- [ ] **Step 4: Run it to verify it passes**

Run: `bun test src/remix/compat.test.ts`

Expected: PASS.

- [ ] **Step 5: Run the gate**

Run: `bun run check`

Expected: PASS. `test/boundaries.test.ts` sees the new file: it imports nothing, so the SPA rules are satisfied by construction.

- [ ] **Step 6: Commit**

```bash
git add src/remix/compat.ts src/remix/compat.test.ts
git commit -m "$(cat <<'EOF'
Backfill Invoker Commands (M1 task 17)

Below Baseline December 2025 command and commandfor are inert: no error,
no event, no warning, a dead click. One capturing click listener on
document resolves the pair, dispatches a command event carrying the same
command and source the platform's own does, and performs the built-in
unless something cancelled it.

force installs it over a platform that already has the feature, and that
path cancels the trusted CommandEvent. Without that suppression, a page
that loaded this backfill on an engine which later gains native support
acts twice on every click and the second showModal() throws.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task G: `runtime.ts`, one listener and an empty table

**Files:**
- Modify: `src/remix/runtime.ts` (currently `export {}`)
- Create: `src/remix/runtime.test.ts`

**Interfaces:**
- Produces: `registerCommand(name: CommandName, handler: CommandHandler): void`, `installCommandRuntime(): void`, `type CommandName = \`--${string}\``, `interface CommandContext { source: HTMLButtonElement | null; target: Element; event: Event }`, `type CommandHandler = (context: CommandContext) => void`.

- [ ] **Step 1: Write the failing test**

Create `src/remix/runtime.test.ts`:

```ts
import { describe, expect, it } from "bun:test"
import { installCommandRuntime, registerCommand } from "./runtime.ts"

describe("registerCommand", () => {
  it("refuses the same name twice", () => {
    // Two handlers for one command is a silent half-behaviour: whichever
    // registered second either wins or is ignored, and nothing says which.
    registerCommand("--test-once", () => {})
    expect(() => registerCommand("--test-once", () => {})).toThrow("--test-once")
  })

  it("does nothing where there is no document", () => {
    expect(() => installCommandRuntime()).not.toThrow()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/remix/runtime.test.ts`

Expected: FAIL — `registerCommand` is not exported from `./runtime.ts`.

- [ ] **Step 3: Write the runtime**

Replace the contents of `src/remix/runtime.ts`:

```ts
/**
 * The single delegated listener every behaviour in this package goes through.
 *
 * ```ts
 * document.addEventListener("command", handler, true)
 * ```
 *
 * Two details make that line correct and both are traps. `CommandEvent` does
 * not bubble — it is dispatched on the element named by `commandfor` — so a
 * listener attached the ordinary way never fires; the capture phase descends
 * window → target, which is what the `true` is for. And it must be delegated
 * from `document`: querying elements and binding to them kills the behaviour
 * on the first frame navigation, which is the lesson `@mionso/design` paid
 * for. Delegation needs no MutationObserver and survives markup that arrives
 * in a frame response.
 *
 * M1 registers no commands. The table ships anyway so that M2 adds a command
 * rather than adding plumbing, and the subpath exists from the start so an app
 * imports the runtime without pulling the component library in behind it.
 */

/** The `--` namespace, which browsers guarantee never to claim. */
export type CommandName = `--${string}`

export interface CommandContext {
  /** The button that invoked it, when the event carries one. */
  readonly source: HTMLButtonElement | null
  /** The element named by `commandfor`. */
  readonly target: Element
  readonly event: Event
}

export type CommandHandler = (context: CommandContext) => void

const handlers = new Map<string, CommandHandler>()
let listening = false

/**
 * Registers a handler for one custom command. Throws on a duplicate: two
 * handlers for one name is a half-behaviour where nothing says which wins.
 */
export function registerCommand(name: CommandName, handler: CommandHandler): void {
  if (handlers.has(name)) throw new Error(`Command already registered: ${name}`)
  handlers.set(name, handler)
}

const onCommand = (event: Event): void => {
  const invocation = event as Event & { command?: string; source?: unknown }
  const handler = handlers.get(invocation.command ?? "")
  if (handler === undefined) return
  const target = event.target
  if (!(target instanceof Element)) return
  const source = invocation.source
  handler({
    source: source instanceof HTMLButtonElement ? source : null,
    target,
    event,
  })
}

export function installCommandRuntime(): void {
  if (listening || typeof document === "undefined") return
  listening = true
  document.addEventListener("command", onCommand, true)
}

installCommandRuntime()
```

- [ ] **Step 4: Run it to verify it passes**

Run: `bun test src/remix/runtime.test.ts`

Expected: PASS, both tests.

- [ ] **Step 5: Run the gate**

Run: `bun run check`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/remix/runtime.ts src/remix/runtime.test.ts
git commit -m "$(cat <<'EOF'
Add the command runtime: one capturing listener (M1 task 17)

CommandEvent does not bubble, so the listener captures; querying
elements and binding to them dies on the first frame navigation, so it
delegates from document. One listener, a table keyed by the -- namespace
the browser will never claim, and no commands registered in M1 — the
table is here so M2 adds a command rather than plumbing.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task H: the browser, for the first time

The playground cannot reach `@lemol/ui` from the browser today: `allowPackages` lists only `remix`, and the package's source sits outside every configured mount. Both were verified by experiment while this plan was written — including that a mount at the repository root is rejected, because mounts may not overlap and the root contains `apps/playground/app`.

**Files:**
- Modify: `apps/playground/remix.json`
- Modify: `apps/playground/app/assets.ts`
- Modify: `apps/playground/app/actions/public/entry.ts`
- Create: `test/browser/harness.ts`
- Create: `test/browser/dialog.browser.test.ts`

**Interfaces:**
- Consumes: `installInvokerCommands` from Task F, `installCommandRuntime` from Task G, the `dialog` demo route from Task E.
- Produces: `withPage(run: (page: Page, baseUrl: string) => Promise<void>): Promise<void>` from `test/browser/harness.ts`.

- [ ] **Step 1: Let the asset server see the package**

In `apps/playground/remix.json`, change the `allowPackages` line:

```json
    "allowPackages": ["remix", "@lemol/ui"],
```

- [ ] **Step 2: Mount the package's source**

In `apps/playground/app/assets.ts`, after the `bunStoreDir` declaration:

```ts
// `@lemol/ui` is a file: dependency pointing at this repository's root, so its
// source resolves outside both the app and the Bun store. Mount `src` rather
// than the root: mounts may not overlap, and the root contains `app`.
const uiRemixDir = path.dirname(fileURLToPath(import.meta.resolve("@lemol/ui/remix")))
const uiDir = path.resolve(uiRemixDir, "..")
```

and replace the `mounts` line:

```ts
  mounts: {
    app: "app",
    npm: path.relative(config.assets.rootDir, bunStoreDir),
    ui: path.relative(config.assets.rootDir, uiDir),
  },
```

- [ ] **Step 3: Install both modules in the browser entry**

In `apps/playground/app/actions/public/entry.ts`, replace the import line and add the installation block above the existing `run(...)` call. The file's first lines become:

```ts
import { installInvokerCommands } from "@lemol/ui/remix/compat"
import { installCommandRuntime } from "@lemol/ui/remix/runtime"
import { run } from "remix/ui"

/**
 * Importing `compat` is what installs the backfill: the module installs
 * itself, and the named import is here for the line below.
 *
 * `?compat` forces it on over the platform's own Invoker Commands, the same
 * way `?nojs` drops this entry entirely. Every engine a test can drive has the
 * feature natively, so without this switch the backfill is the one piece of
 * client code that would ship unexercised.
 */
if (new URLSearchParams(location.search).has("compat")) {
  installInvokerCommands({ force: true })
}

installCommandRuntime()
```

Everything below — the `run({ … })` call, its `loadModule`, and `void app.ready()` — stays exactly as it is.

- [ ] **Step 4: Verify the browser can fetch it**

Run: `bun test apps/playground/app/assets.test.ts`

Expected: PASS. The entry's graph now reaches `ui/remix/compat.ts` and `ui/remix/runtime.ts`, and every module in it serves 200.

- [ ] **Step 5: Write the harness**

Create `test/browser/harness.ts`:

```ts
import { chromium, type Browser, type Page } from "playwright"
import { createPlaygroundRouter } from "../../apps/playground/app/router.ts"

/**
 * One browser and one server for the whole browser suite.
 *
 * Playwright is used as a library rather than through `@playwright/test`, so
 * `bun test` stays the only runner and `bun run check` the only gate. See
 * docs/superpowers/research/2026-09-19-browser-testing-harness.md.
 *
 * The page is served by the playground's own router, so what the test drives
 * is the real document, the real asset pipeline and the real demo — not a
 * fixture that can agree with a broken component.
 */
let browser: Browser | undefined
let server: ReturnType<typeof Bun.serve> | undefined

const launch = async (): Promise<Browser> => {
  try {
    return await chromium.launch()
  } catch (error) {
    throw new Error(
      `Could not launch Chromium. Run: bunx playwright install chromium\n${String(error)}`,
    )
  }
}

/**
 * Runs `body` against a fresh page. The browser and server start on first use
 * and are closed by `closeHarness()`, which every browser test file calls in
 * its `afterAll`.
 */
export async function withPage(
  body: (page: Page, baseUrl: string) => Promise<void>,
): Promise<void> {
  browser ??= await launch()
  if (server === undefined) {
    const router = createPlaygroundRouter()
    server = Bun.serve({ port: 0, fetch: (request) => router.fetch(request) })
  }
  const page = await browser.newPage()
  try {
    await body(page, `http://localhost:${server.port}`)
  } finally {
    await page.close()
  }
}

export async function closeHarness(): Promise<void> {
  await browser?.close()
  browser = undefined
  server?.stop(true)
  server = undefined
}
```

- [ ] **Step 6: Write the browser test**

Create `test/browser/dialog.browser.test.ts`:

```ts
import { afterAll, expect, test } from "bun:test"
import { closeHarness, withPage } from "./harness.ts"

afterAll(closeHarness)

/** Whether the demo's dialog is open, read from the element rather than from
 * a class or an animation: `open` is the state the platform owns. */
const isOpen = "() => document.querySelector('dialog')?.open === true"

test("the native path opens and closes the dialog", async () => {
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/component/dialog`)
    expect(await page.evaluate(`${isOpen}`)).toBe(false)

    await page.getByRole("button", { name: "New task" }).click()
    await page.waitForFunction(isOpen)

    await page.getByRole("button", { name: "Close" }).click()
    await page.waitForFunction(`() => document.querySelector('dialog')?.open === false`)
  })
})

test("the shim path does the same with the platform's own invocation suppressed", async () => {
  // Every engine Playwright bundles has Invoker Commands natively, so the
  // backfill is exercised by forcing it on: it cancels the trusted
  // CommandEvent and drives the dialog with its own. Both halves therefore run
  // on one pinned Chromium.
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/component/dialog?compat=1`)
    await page.getByRole("button", { name: "New task" }).click()
    await page.waitForFunction(isOpen)

    // Exactly once: a shim that does not suppress the native invocation would
    // have called showModal() twice, and the second call throws.
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.getByRole("button", { name: "Close" }).click()
    await page.waitForFunction(`() => document.querySelector('dialog')?.open === false`)
    expect(errors).toEqual([])
  })
})

test("the open dialog's accessibility tree is what a screen reader gets", async () => {
  // An ARIA snapshot rather than a screenshot: it is deterministic, it is
  // readable in a failure without opening an image, and it fails when the
  // dialog loses its accessible name — which a pixel diff would not notice.
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/component/dialog`)
    await page.getByRole("button", { name: "New task" }).click()
    await page.waitForFunction(isOpen)

    expect(await page.locator("dialog").ariaSnapshot()).toContain('heading "New task"')
    expect(await page.locator("dialog").ariaSnapshot()).toContain('button "Close"')
    expect(await page.locator("dialog").ariaSnapshot()).toContain('textbox "Title')
  })
})

test("the page is complete with no client javascript", async () => {
  // ?nojs drops the entry entirely, which is the premise of these packages:
  // the markup is finished before a script runs. The invocation attributes
  // have to be in the document either way.
  await withPage(async (page, baseUrl) => {
    await page.goto(`${baseUrl}/component/dialog?nojs`)
    const trigger = page.getByRole("button", { name: "New task" })
    expect(await trigger.getAttribute("command")).toBe("show-modal")
    expect(await trigger.getAttribute("commandfor")).toBe("new-task")
    expect(await page.locator("script").count()).toBe(0)
  })
})
```

- [ ] **Step 7: Run the browser suite**

Run: `bun test test/browser/dialog.browser.test.ts`

Expected: PASS, all four tests, in a few seconds.

If the ARIA snapshot assertions fail on the exact strings, run the test with `console.log(await page.locator("dialog").ariaSnapshot())` once and match what the tree actually says — role names come from the platform, not from us. Do not weaken the assertion to `toBeTruthy()`.

If `page.getByRole("button", { name: "New task" })` is ambiguous because the trigger and the dialog title share a name, scope it: `page.locator("main").getByRole("button", { name: "New task" })`.

- [ ] **Step 8: Run it twenty times to prove it is not flaky**

Run: `bun test test/browser/dialog.browser.test.ts --rerun-each=20`

Expected: 80 passes, no failures. A single flake here is a real finding — fix the wait, do not add a retry.

- [ ] **Step 9: Run the gate**

Run: `bun run check`

Expected: PASS, with the browser tests now part of it.

- [ ] **Step 10: Commit**

```bash
git add apps/playground/remix.json apps/playground/app/assets.ts apps/playground/app/actions/public/entry.ts test/browser
git commit -m "$(cat <<'EOF'
Prove the dialog in a real browser (M1 task 17)

The playground can now serve @lemol/ui to the browser: allowPackages
admits the package and a mount exposes its src. The root cannot be
mounted — mounts may not overlap and the root contains app — so the
mount is src itself.

Four Playwright tests, driven from bun test against the playground's own
router: the native path, the forced-shim path with the trusted
CommandEvent suppressed, the open dialog's ARIA tree, and the ?nojs
render carrying the invocation with no script in the page. ?compat
forces the backfill the same way ?nojs drops the entry, because every
engine we can drive has Invoker Commands natively.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task I: correct the documents and close the task

**Files:**
- Modify: `docs/design-system.md`
- Modify: `docs/motion.md`
- Modify: `docs/interactivity.md`
- Modify: `docs/architecture.md`
- Modify: `AGENTS.md`
- Modify: `src/remix/README.md`
- Modify: `src/design/README.md`
- Modify: `todo/TODO.md`
- Move: `todo/m1-foundation-and-contract-proof/17-dialog-overlay-and-the-invoker-commands-compat-shim.md` → `todo/done/m1-foundation-and-contract-proof/`

- [ ] **Step 1: Name the backdrop limit and the new primitive**

In `docs/design-system.md`, find the paragraph beginning **"A default that cannot name a primitive is an exception"** and insert after it:

```markdown
**`::backdrop` does not see the contract below Chromium 122.** It inherits from
its originating element only since Chromium 122, Safari 17.4 and Firefox 120;
before that it inherits from nothing, `:root` included. So
`--ui-dialog-backdrop-bg` resolves to nothing on Chrome 114–121 and Safari
17.0–17.3 and the modal opens over an undimmed page. That is accepted: the loss
is cosmetic, `showModal()` still takes the top layer and makes the page behind
inert, and the alternatives are a pseudo-element selector in the emitter — which
the dark axis cannot follow — or a hard-coded colour in a component.
```

In the same file, in the two-tiers section, correct the example token name `--ui-dialog-surface` to `--ui-dialog-bg`: the component names its fill `bg`, as `Button` and `Field` do.

- [ ] **Step 2: Show the doubled shorthand as it is actually written**

In `docs/motion.md`, after the paragraph beginning **"The shorthand is declared twice."**, insert:

```markdown
In a `css()` object the second declaration goes in a nested `&` block, because
a JavaScript object cannot hold the same key twice:

```ts
transition: `opacity ${timing}, translate ${timing}`,
"&": { transition: `opacity ${timing}, translate ${timing}, display ${duration} allow-discrete` },
```

CSS nesting gives `&` the same specificity, later in source order, so the
second wins where `allow-discrete` parses and is dropped whole where it does
not.
```

Also add, after the `@starting-style` bullet list:

```markdown
**Declare `display` only in the open state.** A closed `<dialog>` and a closed
popover are `display: none` from the user-agent sheet, and any author
declaration beats that — cascade layers do not change it, because layered
author CSS still outranks the UA origin. A `display` at the top level of a
component's block renders every one of them, open or not.
```

- [ ] **Step 3: Record the protocol as it shipped**

In `docs/interactivity.md`, in the "Ids must not be hand-written" section, after the code block, add:

```markdown
`overlay()` mints an `Invocation`, and `Button`'s `invoke` prop is the only way
to put `command`/`commandfor` on an element from this package. The type carries
a module-private brand, so there is no expression outside `overlay()` that
satisfies it — the rule is held by the type checker rather than by review.
```

In the "The complete list of hand-written client JS" section, replace the two lines describing the subpaths with:

```
@lemol/ui/remix/compat     Invoker Commands backfill; installs itself on import.
                           installInvokerCommands({ force: true }) installs it
                           over native support and cancels the trusted
                           CommandEvent, which is what keeps it from acting twice.
@lemol/ui/remix/runtime    the capture-phase listener and registerCommand().
                           No commands are registered yet; M2 adds:
```

- [ ] **Step 4: Record the harness**

In `docs/architecture.md`, in the Testing section, replace the bullet reading **"Browser tests for the runtime behaviours only…"** with:

```markdown
- **Browser tests for the runtime behaviours only**, in `test/browser/`, driven
  by Playwright as a library from inside `bun test` — not the `@playwright/test`
  runner, so `bun test` stays the only runner and `bun run check` the only gate.
  They drive the playground's own router through `Bun.serve`, so what is tested
  is the real document and the real asset pipeline. A DOM shim would be testing
  the shim, which is the same conclusion `@mionso/design` reached.
  Two limits: Playwright's WebKit is built from WebKit `main` and is not Safari,
  and every engine it bundles has Invoker Commands natively — so Safari 17 and
  a genuinely unsupporting engine are both out of reach. The backfill is
  exercised by forcing it on instead. See
  `docs/superpowers/research/2026-09-19-browser-testing-harness.md`.
```

In the Tooling section, after the sentence naming Biome, add:

```markdown
**Playwright** supplies the browser for `test/browser/`, as a library rather
than a runner; `bunx playwright install chromium` once per machine.
```

- [ ] **Step 5: Tell a new contributor about the browser**

In `AGENTS.md`, in the Commands block, after the `bun install` line:

```sh
bunx playwright install chromium   # once: the browser test/browser/ drives
```

- [ ] **Step 6: Update the layer READMEs**

In `src/remix/README.md`, add a `### Dialog` section after the `### Badge` section:

```markdown
### `Dialog` and `overlay()`

A native `<dialog>` opened by Invoker Commands, with no client code in the page
on an engine that has them. `overlay(name)` mints the id once and returns
`{ id, Trigger, Dialog, Close }`; the `command`/`commandfor` pair travels as a
branded `Invocation` that only the factory can construct, so the string that
fails silently when mistyped cannot be written by hand.

The panel renders a header — the title as a level-2 `Heading`, and a × bound to
`command="close"` — then its children. There is no footer slot: a caller's form
already carries its own submit row.

Entry and exit ship with the component: the `transition` shorthand twice, the
second in a nested `&` block, and `@starting-style` on `[open]`. `display` is
declared only inside `&[open]`, because a top-level one renders every closed
dialog on the page. Exit degrades in Safari, which has no `overlay` property,
and the backdrop is untinted below Chromium 122, which does not inherit custom
properties into `::backdrop`.

Twenty-two tokens in `dialog/tokens.ts`.
```

Replace the Status paragraph at the end of that file with:

```markdown
`Button`, `LinkButton`, `Stack`, `Row`, `Grid`, `Container`, `Heading`, `Text`,
`Eyebrow`, `Field`, `Badge`, `Dialog` and `ThemeStyle` ship. `tokens.ts`
aggregates the component records and exports `ComponentTokenName`; the four
layout components add nothing to it, which is what they exist to demonstrate,
the three typographic ones add twenty-two between them, `Field` adds
twenty-seven, `Badge` twenty-three and `Dialog` twenty-two. `demos.ts`
registers eleven demos. `compat.ts` backfills Invoker Commands and `runtime.ts`
holds the one capture-phase listener; no command is registered yet.
```

In `src/design/README.md`, the Status section ends with a sentence counting the schema:

```markdown
`@lemol/ui/design` holds 96 primitive names across seven groups, and no values.
```

The count is now 97 — `overlay-max` joined `sizing`. Change the number.

- [ ] **Step 7: Run the gate**

Run: `bun run check`

Expected: PASS.

- [ ] **Step 8: Close the task**

```bash
git mv todo/m1-foundation-and-contract-proof/17-dialog-overlay-and-the-invoker-commands-compat-shim.md todo/done/m1-foundation-and-contract-proof/
```

In `todo/TODO.md`, remove the task 17 line from the M1 list.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Document Dialog and close M1 task 17

The documents the work contradicted: the backdrop's inheritance floor and
overlay-max in design-system.md, the nested & block and the display trap
in motion.md, the branded Invocation in interactivity.md, the browser
harness and its two blind spots in architecture.md.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Verification

After Task I, all of the following must hold. Run them; do not assume.

- `bun run check` passes, browser tests included.
- `bun test test/browser --rerun-each=20` passes with no flakes.
- `bun run playground`, then `/component/dialog`: the trigger opens the modal, it fades and rises into place, Esc closes it, the × closes it, and the backdrop is tinted.
- The same page with `?nojs`: the dialog still opens and closes. Nothing in the page is a script.
- The same page with `?compat=1`: identical behaviour, and the console is clean — a double invocation would throw `InvalidStateError`.
- `?scheme=dark`: the panel, its border and its backdrop all follow.
- `?density=compact`: the close button shrinks with `control-h-sm`.
