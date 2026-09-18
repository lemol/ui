# Stack, Row, Grid and Container Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Four layout components in `@lemol/ui-remix` that declare no tokens of
their own, reading only primitives and structural keywords.

**Architecture:** A caller's chosen space step reaches CSS through a static
`Record` of `css()` descriptors keyed by step and derived from
`schema.space`, shared by Stack, Row and Grid. Every `css()` block declares
properties no sibling block declares, which forces the central rule: a block
carrying a default always renders, a block without one renders only when its
prop is passed.

**Tech Stack:** TypeScript 7 (no build step — packages ship `src/` directly),
`remix/ui` only, Bun as package manager and test runner, `bun:test`, Biome.

Spec: `docs/superpowers/specs/2026-09-18-ui-remix-layout-design.md`.

## Global Constraints

- **No component hard-codes a colour, radius, duration or space step.** These
  four declare no `--ui-*` tokens at all; `ui-remix/src/tokens.ts` and every
  theme stay untouched.
- **No new entry in `ui-remix/src/tokens.ts`.** If one of these turns out to
  need a contract token, that is a finding to record as a comment on task 13,
  not a quiet addition.
- **SPA-safe.** No `node:*`, `bun`, `effect`, or server-side `remix/*` entry.
  `ui-remix` may import only `remix/ui` and `@lemol/ui-design`;
  `test/boundaries.test.ts` enforces it.
- **No build step, no bundler, no new dependency.** `remix` stays the only peer.
- **Every `css()` block a component renders must be property-disjoint from its
  siblings.** `sharedProperties(blocks)` returns `[]`. See
  `docs/design-system.md`, "Cascade layers".
- **Every component gets a server-render test.** `bun:test`, using
  `test/render.ts` and `test/styles.ts`.
- Biome: 2-space indent, line width 100, double quotes, semicolons as needed.
  Run `bun run fix` before `bun run check`.
- Work happens on branch `task-13-layout`, which already exists and holds the
  spec commit.

## Two refinements to the spec

Both found while validating the mechanism; neither changes a decision.

1. **`src/align.ts` joins `src/space.ts`.** The spec names `space.ts` as the
   shared module for `gap`, reasoning that three copies would drift and save
   no CSS. `align` is shared by Stack and Row and the reasoning is identical,
   so it gets its own small module rather than living in `stack/` with Row
   importing across component directories. `justify` and `wrap` are Row's
   alone and stay in `row/row.tsx`.

2. **One new helper in `test/styles.ts`.** The spec says no new helper is
   needed. Four components each need the same check — every declaration value
   is a structural keyword or a primitive the schema holds, and no `var(--ui-`
   appears — differing only in their keyword vocabulary. Four copies of that
   filter is the drift the repo avoids elsewhere, and `test/styles.ts` is
   already where shared style assertions were promoted. One function,
   `nonPrimitiveValues(styles, keywords, primitives)`.

   **The helper takes the primitive set as a parameter rather than importing
   it.** Verified while writing this plan: `test/` sits outside every package
   and the workspace symlink for `@lemol/ui-design` exists only inside
   `packages/ui-remix/node_modules/`, so `import { primitiveNames } from
   "@lemol/ui-design"` inside `test/styles.ts` fails to resolve —
   `Cannot find module '@lemol/ui-design' from '…/test/…'`. Reaching across
   with a relative path into another package's `src/` would work and is the
   wrong shape: `test/styles.ts` is a generic CSS-assertion harness and should
   not know the token schema exists. Each component test imports
   `primitiveNames` itself — it lives in `ui-remix`, where the specifier
   resolves — and passes the set in.

## File structure

**Create**

| File | Responsibility |
| --- | --- |
| `packages/ui-remix/src/space.ts` | `SpaceStep` type and the `gaps` Record, both derived from `schema.space`. |
| `packages/ui-remix/src/space.test.tsx` | The Record covers the schema exactly and each block declares `gap` alone. |
| `packages/ui-remix/src/align.ts` | `Align` type and the `alignStyles` Record, shared by Stack and Row. |
| `packages/ui-remix/src/stack/stack.tsx` | Vertical flex. `gap`, `align`. |
| `packages/ui-remix/src/stack/stack.demo.tsx` | Both axes, every value. |
| `packages/ui-remix/src/stack/stack.test.tsx` | Render, contract, disjointness, optional-render. |
| `packages/ui-remix/src/row/row.tsx` | Horizontal flex. `gap`, `align`, `justify`, `wrap`. |
| `packages/ui-remix/src/row/row.demo.tsx` | All four axes. |
| `packages/ui-remix/src/row/row.test.tsx` | As Stack, plus the centring default. |
| `packages/ui-remix/src/grid/grid.tsx` | Grid. `gap`, `cols`. |
| `packages/ui-remix/src/grid/grid.demo.tsx` | Every column count. |
| `packages/ui-remix/src/grid/grid.test.tsx` | As Stack, plus `cols` optional-render. |
| `packages/ui-remix/src/container/container.tsx` | `--page-max`, `--gutter`, centred. No props. |
| `packages/ui-remix/src/container/container.demo.tsx` | A visible edge showing the maximum width. |
| `packages/ui-remix/src/container/container.test.tsx` | Render and contract. |

**Modify**

| File | Change |
| --- | --- |
| `test/styles.ts` | Add `nonPrimitiveValues`. |
| `packages/ui-remix/src/index.ts` | Export the four components and their types. |
| `packages/ui-remix/src/demos.ts` | Four catalogue entries. |
| `packages/ui-remix/README.md` | Catalogue entries, the always/optional rule, Status. |
| `docs/design-system.md` | The always/optional rule in the property-disjointness section. |

**Not modified:** `packages/ui-remix/src/tokens.ts`, `packages/ui-remix-mini/src/theme.ts`.
That they need no change is the deliverable.

---

### Task 1: The shared axes and the test helper

**Files:**
- Create: `packages/ui-remix/src/space.ts`
- Create: `packages/ui-remix/src/space.test.tsx`
- Create: `packages/ui-remix/src/align.ts`
- Modify: `test/styles.ts`

**Interfaces:**
- Consumes: `schema` from `@lemol/ui-design`; `css`, `CSSMixinDescriptor` from `remix/ui`.
- Produces:
  - `type SpaceStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 24` (derived, not written out)
  - `const gaps: Record<SpaceStep, CSSMixinDescriptor>`
  - `type Align = "start" | "center" | "end" | "baseline" | "stretch"`
  - `const alignStyles: Record<Align, CSSMixinDescriptor>`
  - `nonPrimitiveValues(styles: string, keywords: Set<string>, primitives: Set<string>): string[]` in `test/styles.ts`

- [ ] **Step 1: Write the failing test for the gap scale**

Create `packages/ui-remix/src/space.test.tsx`:

```tsx
import { describe, expect, it } from "bun:test"
import { schema } from "@lemol/ui-design"
import { renderToHtml } from "../../../test/render.ts"
import { styleBlocksOf, stylesOf, valuesOf } from "../../../test/styles.ts"
import { gaps, type SpaceStep } from "./space.ts"

const stepOf = (name: string): SpaceStep => Number(name.slice(3)) as SpaceStep

describe("the shared gap scale", () => {
  it("covers every space name the schema holds", () => {
    // Derived from schema.space, so a step can only go missing if the
    // derivation breaks — which is exactly when nothing else would notice.
    const missing = schema.space.filter((name) => !Object.hasOwn(gaps, name.slice(3)))
    expect(missing).toEqual([])
  })

  it("holds no step the schema does not", () => {
    const names = new Set<string>(schema.space.map((name) => name.slice(3)))
    expect(Object.keys(gaps).filter((key) => !names.has(key))).toEqual([])
  })

  it("declares gap alone, which is what lets a component stay disjoint", async () => {
    // A block here that also set, say, row-gap would collide with a
    // component's own base block and hand sub-layer order the decision.
    for (const name of schema.space) {
      const html = await renderToHtml(<div mix={gaps[stepOf(name)]} />)
      expect(styleBlocksOf(html)).toHaveLength(1)
      expect(valuesOf(stylesOf(html))).toEqual([`var(--${name})`])
    }
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `bun test packages/ui-remix/src/space.test.tsx`
Expected: FAIL — `Cannot find module './space.ts'`

- [ ] **Step 3: Write `space.ts`**

Create `packages/ui-remix/src/space.ts`:

```ts
import { schema } from "@lemol/ui-design"
import { type CSSMixinDescriptor, css } from "remix/ui"

/**
 * The space scale as a prop type, derived from the schema rather than
 * restated: add `sp-32` there and every gap prop widens with no edit here.
 *
 * `infer N extends number` turns the token suffix into a number literal, so a
 * caller writes `gap={4}` and reads it as arithmetic on the schema's 4px unit
 * rather than as a token name they had to learn.
 */
type StepName = (typeof schema.space)[number]
export type SpaceStep = StepName extends `sp-${infer N extends number}` ? N : never

/**
 * One `css()` block per step, shared by Stack, Row and Grid.
 *
 * Shared rather than copied into each: `remix/ui` caches a block by content,
 * so three identical copies would collapse to one sub-layer and save nothing
 * — the duplication would cost only source, and drift.
 *
 * Every block declares `gap` and nothing else. That is what lets a component
 * compose one beside its own base block and stay property-disjoint, which is
 * the rule that keeps sub-layer order from deciding anything (see
 * docs/design-system.md, "Cascade layers").
 *
 * The cast is the one unchecked step: `Object.fromEntries` widens to a string
 * index signature. Keys and `SpaceStep` both derive from `schema.space`, so
 * they cannot disagree, and space.test.tsx checks the Record against the
 * schema in both directions.
 */
export const gaps = Object.fromEntries(
  schema.space.map((name) => [name.slice(3), css({ gap: `var(--${name})` })]),
) as Record<SpaceStep, CSSMixinDescriptor>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test packages/ui-remix/src/space.test.tsx`
Expected: PASS, 3 tests

- [ ] **Step 5: Write `align.ts`**

Create `packages/ui-remix/src/align.ts`:

```ts
import { type CSSMixinDescriptor, css } from "remix/ui"

/**
 * Cross-axis alignment, shared by Stack and Row for the same reason the gap
 * scale is shared: two copies of one Record drift, and `remix/ui` caches a
 * block by content so they would collapse to one sub-layer anyway.
 *
 * `start` and `end` are the logical keywords rather than `flex-start` and
 * `flex-end`. Both are supported across the whole browser baseline
 * (Chrome 114+, Safari 17+, Firefox 125+), and the logical pair flips with
 * writing direction without a second rule.
 */
export type Align = "start" | "center" | "end" | "baseline" | "stretch"

export const alignStyles: Record<Align, CSSMixinDescriptor> = {
  start: css({ alignItems: "start" }),
  center: css({ alignItems: "center" }),
  end: css({ alignItems: "end" }),
  baseline: css({ alignItems: "baseline" }),
  stretch: css({ alignItems: "stretch" }),
}
```

- [ ] **Step 6: Add `nonPrimitiveValues` to `test/styles.ts`**

Append to `test/styles.ts`. Add no import: the primitive set is a parameter,
because `@lemol/ui-design` does not resolve from `test/` and because this file
is a generic CSS harness that should not know the token schema exists.

```ts
/**
 * The declaration values a component emits that are neither a structural
 * keyword it named nor a primitive the schema holds.
 *
 * This is the contract check for a component with no token tier of its own.
 * Button's test asserts the inverse — every value *is* a `var(--ui-btn-*)` —
 * because Button owns a tier. A layout component reads primitives directly,
 * so what has to be checked is that it reads nothing else: an unvetted
 * literal, a primitive the schema dropped, or a `--ui-*` borrowed from some
 * other component's contract. The last is the failure these components exist
 * to make visible, and it is the one that would otherwise look correct.
 *
 * `keywords` is the component's own structural vocabulary — `flex`, `column`,
 * `auto`. Each component states its own, because a keyword allowed everywhere
 * is a keyword nobody argued for.
 *
 * `primitives` is passed in rather than imported. `@lemol/ui-design` does not
 * resolve from this directory — the workspace symlink exists only inside the
 * packages that depend on it — and a generic CSS-assertion harness has no
 * business knowing a token schema exists either way.
 *
 * Returns the offending values, empty when the component is clean.
 */
export const nonPrimitiveValues = (
  styles: string,
  keywords: Set<string>,
  primitives: Set<string>,
): string[] =>
  valuesOf(styles).filter((value) => {
    if (keywords.has(value)) return false
    const referenced = /^var\(--([\w-]+)\)$/.exec(value)?.[1]
    return referenced === undefined || !primitives.has(referenced)
  })
```

- [ ] **Step 7: Verify nothing regressed and formatting is clean**

Run:
```bash
bun run fix && bun run check
```
Expected: biome clean, `tsc` silent, all existing tests pass plus the 3 new ones.

- [ ] **Step 8: Commit**

```bash
git add packages/ui-remix/src/space.ts packages/ui-remix/src/space.test.tsx \
        packages/ui-remix/src/align.ts test/styles.ts
git commit -m "$(cat <<'EOF'
Derive the shared gap and align scales from the schema

The gap Record and the step type both come from schema.space, so adding a
step there widens every gap prop with no edit here and the two cannot
disagree. Align is shared on the same reasoning: remix caches a css() block
by content, so a copy in Stack and another in Row would collapse to one
sub-layer and save nothing while still drifting.

nonPrimitiveValues is the contract check for a component with no tier of its
own — the inverse of Button's, asserting a value is a keyword or a primitive
and never a --ui-*.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Stack

**Files:**
- Create: `packages/ui-remix/src/stack/stack.tsx`
- Create: `packages/ui-remix/src/stack/stack.demo.tsx`
- Create: `packages/ui-remix/src/stack/stack.test.tsx`
- Modify: `packages/ui-remix/src/index.ts`
- Modify: `packages/ui-remix/src/demos.ts`

**Interfaces:**
- Consumes: `gaps`, `SpaceStep` from `../space.ts`; `Align`, `alignStyles` from `../align.ts`; `nonPrimitiveValues`, `sharedProperties`, `styleBlocksOf`, `stylesOf` from `test/styles.ts`; `renderToHtml` from `test/render.ts`.
- Produces: `Stack`, `interface StackProps { gap?, align?, mix?, children? }`, `StackDemo`, and a `stack` key in `demos`.

- [ ] **Step 1: Write the failing test**

Create `packages/ui-remix/src/stack/stack.test.tsx`:

```tsx
import { describe, expect, it } from "bun:test"
import { primitiveNames } from "@lemol/ui-design"
import { css } from "remix/ui"
import { renderToHtml } from "../../../../test/render.ts"
import {
  nonPrimitiveValues,
  sharedProperties,
  styleBlocksOf,
  stylesOf,
} from "../../../../test/styles.ts"
import { type Align, alignStyles } from "../align.ts"
import type { SpaceStep } from "../space.ts"
import { StackDemo } from "./stack.demo.tsx"
import { Stack } from "./stack.tsx"

const aligns = Object.keys(alignStyles) as Align[]
const steps: SpaceStep[] = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 24]

/** Stack's structural vocabulary. Nothing here is a length or a colour. */
const keywords = new Set(["flex", "column", "start", "center", "end", "baseline", "stretch"])

/** Passed to nonPrimitiveValues, which cannot import this from test/. */
const primitives = new Set<string>(primitiveNames)

describe("Stack", () => {
  it("renders a div carrying its children", async () => {
    const html = await renderToHtml(<Stack>content</Stack>)
    expect(html).toContain("<div")
    expect(html).toContain("content")
  })

  it("reads no contract token, only primitives and structural keywords", async () => {
    // The machine-checkable form of "no tokens of their own". A --ui-* here
    // would mean Stack had quietly grown a contract tier.
    for (const align of aligns) {
      for (const step of steps) {
        const styles = stylesOf(await renderToHtml(<Stack align={align} gap={step} />))
        expect(nonPrimitiveValues(styles, keywords, primitives)).toEqual([])
        expect(styles).not.toContain("var(--ui-")
      }
    }
  })

  it("emits exactly one gap block, default included", async () => {
    // Two blocks that could both declare gap would put sub-layer order in
    // charge of which one paints, and that order follows render order rather
    // than source order. One block, always, is what makes the default safe.
    const blocks = styleBlocksOf(await renderToHtml(<Stack />))
    expect(blocks.filter((block) => block.includes("gap:"))).toHaveLength(1)
  })

  it("defaults its gap to sp-0, presuming no spacing", async () => {
    expect(stylesOf(await renderToHtml(<Stack />))).toContain("gap: var(--sp-0)")
  })

  it("takes each step straight from the primitive scale", async () => {
    for (const step of steps) {
      expect(stylesOf(await renderToHtml(<Stack gap={step} />))).toContain(`gap: var(--sp-${step})`)
    }
  })

  it("declares no align-items until align is passed", async () => {
    // The half that keeps mix reliable: a block that does not render declares
    // nothing, so a caller's own alignItems has nothing to contend with.
    expect(stylesOf(await renderToHtml(<Stack gap={4} />))).not.toContain("align-items")
  })

  it("emits the alignment a caller asks for", async () => {
    for (const align of aligns) {
      expect(stylesOf(await renderToHtml(<Stack align={align} />))).toContain(
        `align-items: ${align}`,
      )
    }
  })

  it("keeps its own css() blocks property-disjoint across every combination", async () => {
    // Checked over the whole product, not just the default: a default that
    // collides with its own explicit value is precisely the failure the
    // always-render rule prevents, and it only shows up when both are set.
    for (const align of aligns) {
      for (const step of steps) {
        const blocks = styleBlocksOf(await renderToHtml(<Stack align={align} gap={step} />))
        expect(sharedProperties(blocks)).toEqual([])
      }
    }
  })

  it("adds through mix a property it does not declare itself", async () => {
    const pinned = css({ position: "fixed" })
    const blocks = styleBlocksOf(await renderToHtml(<Stack mix={pinned} />))
    expect(blocks.filter((block) => block.includes("position: fixed"))).toHaveLength(1)
    expect(blocks.filter((block) => block.includes("position:"))).toHaveLength(1)
  })
})

describe("StackDemo", () => {
  it("renders every alignment it claims to demonstrate", async () => {
    const html = await renderToHtml(<StackDemo />)
    for (const align of aligns) expect(html).toContain(`align ${align}`)
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `bun test packages/ui-remix/src/stack/`
Expected: FAIL — `Cannot find module './stack.tsx'`

- [ ] **Step 3: Write `stack.tsx`**

Create `packages/ui-remix/src/stack/stack.tsx`:

```tsx
import { css, type Handle, type MixInput, type RemixNode } from "remix/ui"
import { type Align, alignStyles } from "../align.ts"
import { gaps, type SpaceStep } from "../space.ts"

/**
 * Stack declares no tokens of its own, and that is the point of it. Every
 * value it emits is a structural keyword or a primitive the caller chose from
 * the space scale — stack.test.tsx fails on a `--ui-` anywhere in its output.
 *
 * A gap token was considered and rejected: a stack's spacing is a per-instance
 * composition decision, so two stacks on one page routinely want different
 * gaps and one themeable value cannot express that. See
 * docs/superpowers/specs/2026-09-18-ui-remix-layout-design.md.
 */
const stackBase = css({
  display: "flex",
  flexDirection: "column",
})

export interface StackProps {
  /**
   * A step on the primitive space scale: `gap={4}` is `var(--sp-4)`, four of
   * the schema's 4px units.
   *
   * Defaults to `0`, presuming no spacing, for the same reason there is no
   * gap token. The block renders either way — two blocks that could both
   * declare `gap` would hand sub-layer order the decision, and that order
   * follows render order rather than source order.
   */
  gap?: SpaceStep | undefined
  /**
   * Cross-axis alignment. Its block renders only when this is passed, so a
   * Stack without it declares no `align-items` at all and a caller's
   * `mix={css({ alignItems: … })}` is reliable.
   */
  align?: Align | undefined
  /**
   * Adds properties Stack does not declare. It does not reliably override one
   * it does: each `css()` block is its own cascade sub-layer, layer order
   * beats specificity within a layer, and sub-layer order follows the order
   * blocks are first encountered during the render rather than the order of
   * this array. For `gap` and `align`, use the props — they exist for this.
   */
  mix?: MixInput<HTMLDivElement> | undefined
  children?: RemixNode | undefined
}

export function Stack(handle: Handle<StackProps>) {
  return () => {
    const { gap = 0, align, mix, children } = handle.props
    return (
      <div mix={[stackBase, gaps[gap], align === undefined ? undefined : alignStyles[align], mix]}>
        {children}
      </div>
    )
  }
}
```

- [ ] **Step 4: Write `stack.demo.tsx`**

Create `packages/ui-remix/src/stack/stack.demo.tsx`:

```tsx
import { css } from "remix/ui"
import { type Align, alignStyles } from "../align.ts"
import { Stack } from "./stack.tsx"

const aligns = Object.keys(alignStyles) as Align[]

/**
 * Styled from primitives, not from any component's tokens: a demo is a page,
 * not a component, and the same reasoning button.demo.tsx records applies.
 */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const section = css({ marginBlockEnd: "var(--sp-8)" })

/** A visible box, so a gap and an alignment can be seen rather than inferred. */
const item = css({
  background: "var(--surface-raised)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--r-sm)",
  padding: "var(--sp-2) var(--sp-3)",
})

/** Bounded, so `stretch` and `start` differ visibly on the cross axis. */
const frame = css({
  border: "1px dashed var(--hairline-strong)",
  borderRadius: "var(--r-md)",
  padding: "var(--sp-3)",
  inlineSize: "18rem",
})

export function StackDemo() {
  return () => (
    <>
      <div mix={section}>
        <p mix={label}>gap, on the primitive space scale</p>
        {([0, 2, 4, 8] as const).map((gap) => (
          <div key={gap} mix={section}>
            <p mix={label}>gap {gap}</p>
            <Stack gap={gap}>
              <div mix={item}>one</div>
              <div mix={item}>two</div>
              <div mix={item}>three</div>
            </Stack>
          </div>
        ))}
      </div>

      {aligns.map((align) => (
        <div key={align} mix={section}>
          <p mix={label}>align {align}</p>
          <div mix={frame}>
            <Stack align={align} gap={2}>
              <div mix={item}>short</div>
              <div mix={item}>a longer item</div>
            </Stack>
          </div>
        </div>
      ))}
    </>
  )
}
```

- [ ] **Step 5: Wire the export and the catalogue entry**

In `packages/ui-remix/src/index.ts`, add these exports (biome sorts them; run
`bun run fix` afterwards):

```ts
export { type Align, alignStyles } from "./align.ts"
export { type SpaceStep } from "./space.ts"
export { Stack, type StackProps } from "./stack/stack.tsx"
```

In `packages/ui-remix/src/demos.ts`, add the import and the entry:

```ts
import { StackDemo } from "./stack/stack.demo.tsx"
```

```ts
export const demos = {
  button: { title: "Button", Demo: ButtonDemo },
  stack: { title: "Stack", Demo: StackDemo },
} as const
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `bun test packages/ui-remix/src/stack/`
Expected: PASS, 10 tests

- [ ] **Step 7: Run the full gate**

Run: `bun run fix && bun run check`
Expected: biome clean, `tsc` silent, every test passes.

- [ ] **Step 8: Commit**

```bash
git add packages/ui-remix/src/stack packages/ui-remix/src/index.ts \
        packages/ui-remix/src/demos.ts
git commit -m "$(cat <<'EOF'
Add Stack, the first component with no tokens of its own

Vertical flex over the primitive space scale. The gap block always renders,
default included, because two blocks that could both declare gap would hand
sub-layer order the decision; the align block renders only when asked, which
leaves a caller's own alignItems in mix reliable.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Row

**Files:**
- Create: `packages/ui-remix/src/row/row.tsx`
- Create: `packages/ui-remix/src/row/row.demo.tsx`
- Create: `packages/ui-remix/src/row/row.test.tsx`
- Modify: `packages/ui-remix/src/index.ts`
- Modify: `packages/ui-remix/src/demos.ts`

**Interfaces:**
- Consumes: `gaps`, `SpaceStep` from `../space.ts`; `Align`, `alignStyles` from `../align.ts`.
- Produces: `Row`, `type Justify = "start" | "center" | "end" | "between" | "around" | "evenly"`, `interface RowProps { gap?, align?, justify?, wrap?, mix?, children? }`, `RowDemo`, and a `row` key in `demos`.

Row differs from Stack in one way that matters: `align` defaults to `"center"`
and therefore always renders. Stretched items of unequal height is a bug in
almost every horizontal row, so this is the one presumption worth making.

- [ ] **Step 1: Write the failing test**

Create `packages/ui-remix/src/row/row.test.tsx`:

```tsx
import { describe, expect, it } from "bun:test"
import { primitiveNames } from "@lemol/ui-design"
import { css } from "remix/ui"
import { renderToHtml } from "../../../../test/render.ts"
import {
  nonPrimitiveValues,
  sharedProperties,
  styleBlocksOf,
  stylesOf,
} from "../../../../test/styles.ts"
import { type Align, alignStyles } from "../align.ts"
import type { SpaceStep } from "../space.ts"
import { RowDemo } from "./row.demo.tsx"
import { type Justify, Row } from "./row.tsx"

const aligns = Object.keys(alignStyles) as Align[]
const justifies: Justify[] = ["start", "center", "end", "between", "around", "evenly"]
const steps: SpaceStep[] = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 24]

/** Row's structural vocabulary. Nothing here is a length or a colour. */
const keywords = new Set([
  "flex",
  "start",
  "center",
  "end",
  "baseline",
  "stretch",
  "space-between",
  "space-around",
  "space-evenly",
  "wrap",
])

/** Passed to nonPrimitiveValues, which cannot import this from test/. */
const primitives = new Set<string>(primitiveNames)

describe("Row", () => {
  it("renders a div carrying its children", async () => {
    const html = await renderToHtml(<Row>content</Row>)
    expect(html).toContain("<div")
    expect(html).toContain("content")
  })

  it("reads no contract token, only primitives and structural keywords", async () => {
    for (const align of aligns) {
      for (const justify of justifies) {
        for (const step of steps) {
          const styles = stylesOf(
            await renderToHtml(<Row align={align} gap={step} justify={justify} wrap />),
          )
          expect(nonPrimitiveValues(styles, keywords, primitives)).toEqual([])
          expect(styles).not.toContain("var(--ui-")
        }
      }
    }
  })

  it("emits exactly one gap block and one align block, defaults included", async () => {
    const blocks = styleBlocksOf(await renderToHtml(<Row />))
    expect(blocks.filter((block) => block.includes("gap:"))).toHaveLength(1)
    expect(blocks.filter((block) => block.includes("align-items:"))).toHaveLength(1)
  })

  it("centres by default, because stretched items of unequal height is the bug", async () => {
    expect(stylesOf(await renderToHtml(<Row />))).toContain("align-items: center")
  })

  it("defaults its gap to sp-0, presuming no spacing", async () => {
    expect(stylesOf(await renderToHtml(<Row />))).toContain("gap: var(--sp-0)")
  })

  it("takes each step straight from the primitive scale", async () => {
    for (const step of steps) {
      expect(stylesOf(await renderToHtml(<Row gap={step} />))).toContain(`gap: var(--sp-${step})`)
    }
  })

  it("emits the alignment a caller asks for", async () => {
    for (const align of aligns) {
      expect(stylesOf(await renderToHtml(<Row align={align} />))).toContain(`align-items: ${align}`)
    }
  })

  it("declares neither justify-content nor flex-wrap until asked", async () => {
    const styles = stylesOf(await renderToHtml(<Row gap={4} />))
    expect(styles).not.toContain("justify-content")
    expect(styles).not.toContain("flex-wrap")
  })

  it("maps its justify names onto the CSS keywords", async () => {
    const expected: Record<Justify, string> = {
      start: "start",
      center: "center",
      end: "end",
      between: "space-between",
      around: "space-around",
      evenly: "space-evenly",
    }
    for (const justify of justifies) {
      expect(stylesOf(await renderToHtml(<Row justify={justify} />))).toContain(
        `justify-content: ${expected[justify]}`,
      )
    }
  })

  it("wraps only when told to", async () => {
    expect(stylesOf(await renderToHtml(<Row wrap />))).toContain("flex-wrap: wrap")
    expect(stylesOf(await renderToHtml(<Row wrap={false} />))).not.toContain("flex-wrap")
  })

  it("keeps its own css() blocks property-disjoint across every combination", async () => {
    for (const align of aligns) {
      for (const justify of justifies) {
        for (const step of steps) {
          const blocks = styleBlocksOf(
            await renderToHtml(<Row align={align} gap={step} justify={justify} wrap />),
          )
          expect(sharedProperties(blocks)).toEqual([])
        }
      }
    }
  })

  it("adds through mix a property it does not declare itself", async () => {
    const pinned = css({ position: "fixed" })
    const blocks = styleBlocksOf(await renderToHtml(<Row mix={pinned} />))
    expect(blocks.filter((block) => block.includes("position: fixed"))).toHaveLength(1)
    expect(blocks.filter((block) => block.includes("position:"))).toHaveLength(1)
  })
})

describe("RowDemo", () => {
  it("renders every justification it claims to demonstrate", async () => {
    const html = await renderToHtml(<RowDemo />)
    for (const justify of justifies) expect(html).toContain(`justify ${justify}`)
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `bun test packages/ui-remix/src/row/`
Expected: FAIL — `Cannot find module './row.tsx'`

- [ ] **Step 3: Write `row.tsx`**

Create `packages/ui-remix/src/row/row.tsx`:

```tsx
import { type CSSMixinDescriptor, css, type Handle, type MixInput, type RemixNode } from "remix/ui"
import { type Align, alignStyles } from "../align.ts"
import { gaps, type SpaceStep } from "../space.ts"

/**
 * Row declares no tokens of its own. Every value it emits is a structural
 * keyword or a primitive the caller chose from the space scale, and
 * row.test.tsx fails on a `--ui-` anywhere in its output.
 */
const rowBase = css({
  display: "flex",
})

/**
 * Short names for the main-axis keywords. `between` rather than
 * `space-between` because the `space-` prefix says nothing a caller choosing
 * between six values needs, and the mapping is one table checked by a test.
 */
export type Justify = "start" | "center" | "end" | "between" | "around" | "evenly"

const justifyStyles: Record<Justify, CSSMixinDescriptor> = {
  start: css({ justifyContent: "start" }),
  center: css({ justifyContent: "center" }),
  end: css({ justifyContent: "end" }),
  between: css({ justifyContent: "space-between" }),
  around: css({ justifyContent: "space-around" }),
  evenly: css({ justifyContent: "space-evenly" }),
}

/** Its own block, so a Row that does not wrap declares no `flex-wrap` at all. */
const wrapStyle = css({ flexWrap: "wrap" })

export interface RowProps {
  /**
   * A step on the primitive space scale: `gap={3}` is `var(--sp-3)`. Defaults
   * to `0`, and its block renders either way — see `StackProps.gap`.
   */
  gap?: SpaceStep | undefined
  /**
   * Cross-axis alignment, defaulting to `center`.
   *
   * This is the one presumption these components make, and unlike `gap` it is
   * worth making: items of unequal height stretched to match is a bug in
   * almost every horizontal row, and centring is right in almost every one.
   * Because it has a default, the block always renders — so to change it,
   * pass the prop rather than reaching for `mix`.
   */
  align?: Align | undefined
  /**
   * Main-axis distribution. Its block renders only when passed, so a Row
   * without it declares no `justify-content` and a caller's own is reliable
   * through `mix`.
   */
  justify?: Justify | undefined
  /** Allows wrapping. Its block renders only when true. */
  wrap?: boolean | undefined
  /**
   * Adds properties Row does not declare; it does not reliably override one
   * it does. `gap` and `align` always have a block, so those two go through
   * their props. `justify` and `wrap` are yours through `mix` as long as you
   * do not also pass the prop.
   */
  mix?: MixInput<HTMLDivElement> | undefined
  children?: RemixNode | undefined
}

export function Row(handle: Handle<RowProps>) {
  return () => {
    const { gap = 0, align = "center", justify, wrap, mix, children } = handle.props
    return (
      <div
        mix={[
          rowBase,
          gaps[gap],
          alignStyles[align],
          justify === undefined ? undefined : justifyStyles[justify],
          wrap ? wrapStyle : undefined,
          mix,
        ]}
      >
        {children}
      </div>
    )
  }
}
```

- [ ] **Step 4: Write `row.demo.tsx`**

Create `packages/ui-remix/src/row/row.demo.tsx`:

```tsx
import { css } from "remix/ui"
import { type Align, alignStyles } from "../align.ts"
import { type Justify, Row } from "./row.tsx"

const aligns = Object.keys(alignStyles) as Align[]
const justifies: Justify[] = ["start", "center", "end", "between", "around", "evenly"]

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const section = css({ marginBlockEnd: "var(--sp-8)" })

const item = css({
  background: "var(--surface-raised)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--r-sm)",
  padding: "var(--sp-2) var(--sp-3)",
})

/** Bounded, so a distribution has room to distribute into. */
const frame = css({
  border: "1px dashed var(--hairline-strong)",
  borderRadius: "var(--r-md)",
  padding: "var(--sp-3)",
})

/** Taller than its siblings, so centring is visible rather than asserted. */
const tall = css({
  background: "var(--surface-raised)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--r-sm)",
  padding: "var(--sp-5) var(--sp-3)",
})

export function RowDemo() {
  return () => (
    <>
      <div mix={section}>
        <p mix={label}>gap, on the primitive space scale</p>
        {([0, 2, 4, 8] as const).map((gap) => (
          <div key={gap} mix={section}>
            <p mix={label}>gap {gap}</p>
            <Row gap={gap}>
              <div mix={item}>one</div>
              <div mix={item}>two</div>
              <div mix={item}>three</div>
            </Row>
          </div>
        ))}
      </div>

      {aligns.map((align) => (
        <div key={align} mix={section}>
          <p mix={label}>align {align}</p>
          <div mix={frame}>
            <Row align={align} gap={3}>
              <div mix={item}>short</div>
              <div mix={tall}>taller</div>
              <div mix={item}>short</div>
            </Row>
          </div>
        </div>
      ))}

      {justifies.map((justify) => (
        <div key={justify} mix={section}>
          <p mix={label}>justify {justify}</p>
          <div mix={frame}>
            <Row gap={2} justify={justify}>
              <div mix={item}>one</div>
              <div mix={item}>two</div>
              <div mix={item}>three</div>
            </Row>
          </div>
        </div>
      ))}

      <div mix={section}>
        <p mix={label}>wrap</p>
        <div mix={frame}>
          <Row gap={2} wrap>
            {Array.from({ length: 24 }, (_, index) => (
              <div key={index} mix={item}>
                item {index + 1}
              </div>
            ))}
          </Row>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 5: Wire the export and the catalogue entry**

In `packages/ui-remix/src/index.ts`:

```ts
export { type Justify, Row, type RowProps } from "./row/row.tsx"
```

In `packages/ui-remix/src/demos.ts`, add the import and the entry:

```ts
import { RowDemo } from "./row/row.demo.tsx"
```

```ts
  row: { title: "Row", Demo: RowDemo },
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `bun test packages/ui-remix/src/row/`
Expected: PASS, 13 tests

- [ ] **Step 7: Run the full gate**

Run: `bun run fix && bun run check`
Expected: biome clean, `tsc` silent, every test passes.

- [ ] **Step 8: Commit**

```bash
git add packages/ui-remix/src/row packages/ui-remix/src/index.ts \
        packages/ui-remix/src/demos.ts
git commit -m "$(cat <<'EOF'
Add Row, which centres by default

Horizontal flex sharing Stack's gap and align scales. Alignment is the one
axis here that presumes a value: stretched items of unequal height is a bug
in almost every horizontal row. justify and wrap render no block until asked,
so both stay reachable through mix.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Grid

**Files:**
- Create: `packages/ui-remix/src/grid/grid.tsx`
- Create: `packages/ui-remix/src/grid/grid.demo.tsx`
- Create: `packages/ui-remix/src/grid/grid.test.tsx`
- Modify: `packages/ui-remix/src/index.ts`
- Modify: `packages/ui-remix/src/demos.ts`

**Interfaces:**
- Consumes: `gaps`, `SpaceStep` from `../space.ts`.
- Produces: `Grid`, `type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6`, `interface GridProps { gap?, cols?, mix?, children? }`, `GridDemo`, and a `grid` key in `demos`.

Grid has **no responsive mode**, deliberately. See the recorded finding on
task 13: auto-fit needs a track minimum and `schema.sizing` holds no primitive
for one. Do not add a `min` prop taking a caller-supplied length.

- [ ] **Step 1: Write the failing test**

Create `packages/ui-remix/src/grid/grid.test.tsx`:

```tsx
import { describe, expect, it } from "bun:test"
import { primitiveNames } from "@lemol/ui-design"
import { css } from "remix/ui"
import { renderToHtml } from "../../../../test/render.ts"
import {
  nonPrimitiveValues,
  sharedProperties,
  styleBlocksOf,
  stylesOf,
} from "../../../../test/styles.ts"
import type { SpaceStep } from "../space.ts"
import { GridDemo } from "./grid.demo.tsx"
import { type ColumnCount, Grid } from "./grid.tsx"

const counts: ColumnCount[] = [1, 2, 3, 4, 5, 6]
const steps: SpaceStep[] = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 24]

/** Grid's structural vocabulary: the display keyword and the track lists. */
const keywords = new Set(["grid", ...counts.map((count) => `repeat(${count}, 1fr)`)])

/** Passed to nonPrimitiveValues, which cannot import this from test/. */
const primitives = new Set<string>(primitiveNames)

describe("Grid", () => {
  it("renders a div carrying its children", async () => {
    const html = await renderToHtml(<Grid>content</Grid>)
    expect(html).toContain("<div")
    expect(html).toContain("content")
  })

  it("reads no contract token, only primitives and structural keywords", async () => {
    for (const cols of counts) {
      for (const step of steps) {
        const styles = stylesOf(await renderToHtml(<Grid cols={cols} gap={step} />))
        expect(nonPrimitiveValues(styles, keywords, primitives)).toEqual([])
        expect(styles).not.toContain("var(--ui-")
      }
    }
  })

  it("emits exactly one gap block, default included", async () => {
    const blocks = styleBlocksOf(await renderToHtml(<Grid />))
    expect(blocks.filter((block) => block.includes("gap:"))).toHaveLength(1)
  })

  it("defaults its gap to sp-0, presuming no spacing", async () => {
    expect(stylesOf(await renderToHtml(<Grid />))).toContain("gap: var(--sp-0)")
  })

  it("takes each step straight from the primitive scale", async () => {
    for (const step of steps) {
      expect(stylesOf(await renderToHtml(<Grid gap={step} />))).toContain(`gap: var(--sp-${step})`)
    }
  })

  it("declares no grid-template-columns until cols is passed", async () => {
    // A bare Grid leaves the track list entirely to the caller, which is what
    // makes mix reliable for the layouts cols cannot express — and cols
    // cannot express a responsive one, by design.
    expect(stylesOf(await renderToHtml(<Grid gap={4} />))).not.toContain("grid-template-columns")
  })

  it("emits an equal track list for each count", async () => {
    for (const cols of counts) {
      expect(stylesOf(await renderToHtml(<Grid cols={cols} />))).toContain(
        `grid-template-columns: repeat(${cols}, 1fr)`,
      )
    }
  })

  it("keeps its own css() blocks property-disjoint across every combination", async () => {
    for (const cols of counts) {
      for (const step of steps) {
        const blocks = styleBlocksOf(await renderToHtml(<Grid cols={cols} gap={step} />))
        expect(sharedProperties(blocks)).toEqual([])
      }
    }
  })

  it("adds through mix a property it does not declare itself", async () => {
    const pinned = css({ position: "fixed" })
    const blocks = styleBlocksOf(await renderToHtml(<Grid mix={pinned} />))
    expect(blocks.filter((block) => block.includes("position: fixed"))).toHaveLength(1)
    expect(blocks.filter((block) => block.includes("position:"))).toHaveLength(1)
  })
})

describe("GridDemo", () => {
  it("renders every column count it claims to demonstrate", async () => {
    const html = await renderToHtml(<GridDemo />)
    for (const cols of counts) expect(html).toContain(`cols ${cols}`)
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `bun test packages/ui-remix/src/grid/`
Expected: FAIL — `Cannot find module './grid.tsx'`

- [ ] **Step 3: Write `grid.tsx`**

Create `packages/ui-remix/src/grid/grid.tsx`:

```tsx
import { type CSSMixinDescriptor, css, type Handle, type MixInput, type RemixNode } from "remix/ui"
import { gaps, type SpaceStep } from "../space.ts"

/**
 * Grid declares no tokens of its own. Every value it emits is a structural
 * keyword or a primitive the caller chose from the space scale.
 */
const gridBase = css({
  display: "grid",
})

/**
 * Six, not twelve. Twelve is the convention for grid systems that count
 * *spans*; these are equal `1fr` tracks, and more than six of them is
 * unreadable at any width `--page-max` permits. A judgement, not a schema
 * constraint.
 */
export type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6

const columnStyles: Record<ColumnCount, CSSMixinDescriptor> = {
  1: css({ gridTemplateColumns: "repeat(1, 1fr)" }),
  2: css({ gridTemplateColumns: "repeat(2, 1fr)" }),
  3: css({ gridTemplateColumns: "repeat(3, 1fr)" }),
  4: css({ gridTemplateColumns: "repeat(4, 1fr)" }),
  5: css({ gridTemplateColumns: "repeat(5, 1fr)" }),
  6: css({ gridTemplateColumns: "repeat(6, 1fr)" }),
}

export interface GridProps {
  /**
   * A step on the primitive space scale, applying to both axes. Defaults to
   * `0`, and its block renders either way — see `StackProps.gap`.
   */
  gap?: SpaceStep | undefined
  /**
   * Equal columns. Its block renders only when passed, so a bare Grid leaves
   * the track list entirely to the caller.
   *
   * There is no responsive mode. Auto-fit needs a track minimum for
   * `repeat(auto-fit, minmax(<min>, 1fr))`, and `schema.sizing` holds no
   * primitive for one — a caller-supplied length would be the single
   * open-ended value in a package built to have none. Recorded as a finding
   * on task 13 rather than added; until then, a responsive track list goes
   * through `mix`, which is reliable precisely because `cols` was not passed.
   */
  cols?: ColumnCount | undefined
  /**
   * Adds properties Grid does not declare; it does not reliably override one
   * it does. `gap` always has a block, so it goes through its prop.
   */
  mix?: MixInput<HTMLDivElement> | undefined
  children?: RemixNode | undefined
}

export function Grid(handle: Handle<GridProps>) {
  return () => {
    const { gap = 0, cols, mix, children } = handle.props
    return (
      <div mix={[gridBase, gaps[gap], cols === undefined ? undefined : columnStyles[cols], mix]}>
        {children}
      </div>
    )
  }
}
```

- [ ] **Step 4: Write `grid.demo.tsx`**

Create `packages/ui-remix/src/grid/grid.demo.tsx`:

```tsx
import { css } from "remix/ui"
import { type ColumnCount, Grid } from "./grid.tsx"

const counts: ColumnCount[] = [1, 2, 3, 4, 5, 6]

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const section = css({ marginBlockEnd: "var(--sp-8)" })

const cell = css({
  background: "var(--surface-raised)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--r-sm)",
  padding: "var(--sp-3)",
  textAlign: "center",
})

export function GridDemo() {
  return () => (
    <>
      {counts.map((cols) => (
        <div key={cols} mix={section}>
          <p mix={label}>cols {cols}</p>
          <Grid cols={cols} gap={3}>
            {Array.from({ length: cols * 2 }, (_, index) => (
              <div key={index} mix={cell}>
                {index + 1}
              </div>
            ))}
          </Grid>
        </div>
      ))}

      <div mix={section}>
        <p mix={label}>gap, on the primitive space scale</p>
        {([0, 2, 4, 8] as const).map((gap) => (
          <div key={gap} mix={section}>
            <p mix={label}>gap {gap}</p>
            <Grid cols={4} gap={gap}>
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} mix={cell}>
                  {index + 1}
                </div>
              ))}
            </Grid>
          </div>
        ))}
      </div>
    </>
  )
}
```

- [ ] **Step 5: Wire the export and the catalogue entry**

In `packages/ui-remix/src/index.ts`:

```ts
export { type ColumnCount, Grid, type GridProps } from "./grid/grid.tsx"
```

In `packages/ui-remix/src/demos.ts`, add the import and the entry:

```ts
import { GridDemo } from "./grid/grid.demo.tsx"
```

```ts
  grid: { title: "Grid", Demo: GridDemo },
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `bun test packages/ui-remix/src/grid/`
Expected: PASS, 10 tests

- [ ] **Step 7: Run the full gate**

Run: `bun run fix && bun run check`
Expected: biome clean, `tsc` silent, every test passes.

- [ ] **Step 8: Commit**

```bash
git add packages/ui-remix/src/grid packages/ui-remix/src/index.ts \
        packages/ui-remix/src/demos.ts
git commit -m "$(cat <<'EOF'
Add Grid, with a fixed column count and no responsive mode

Six equal tracks at most: twelve is the convention for counting spans, not
equal columns. Responsive auto-fit needs a track minimum the schema has no
primitive for, so it is the finding recorded on task 13 rather than a prop
taking a caller-supplied length. A bare Grid declares no track list, which
leaves that case reachable through mix.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Container

**Files:**
- Create: `packages/ui-remix/src/container/container.tsx`
- Create: `packages/ui-remix/src/container/container.demo.tsx`
- Create: `packages/ui-remix/src/container/container.test.tsx`
- Modify: `packages/ui-remix/src/index.ts`
- Modify: `packages/ui-remix/src/demos.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks except the test helpers.
- Produces: `Container`, `interface ContainerProps { mix?, children? }`, `ContainerDemo`, and a `container` key in `demos`.

Container is the component that proves the primitives were the right answer:
`--page-max` and `--gutter` exist in `schema.sizing` precisely so it needs no
tokens. It therefore has no props beyond `mix` and `children`.

- [ ] **Step 1: Write the failing test**

Create `packages/ui-remix/src/container/container.test.tsx`:

```tsx
import { describe, expect, it } from "bun:test"
import { primitiveNames } from "@lemol/ui-design"
import { css } from "remix/ui"
import { renderToHtml } from "../../../../test/render.ts"
import {
  nonPrimitiveValues,
  sharedProperties,
  styleBlocksOf,
  stylesOf,
} from "../../../../test/styles.ts"
import { ContainerDemo } from "./container.demo.tsx"
import { Container } from "./container.tsx"

/** Container's whole structural vocabulary. */
const keywords = new Set(["auto"])

/** Passed to nonPrimitiveValues, which cannot import this from test/. */
const primitives = new Set<string>(primitiveNames)

describe("Container", () => {
  it("renders a div carrying its children", async () => {
    const html = await renderToHtml(<Container>content</Container>)
    expect(html).toContain("<div")
    expect(html).toContain("content")
  })

  it("reads no contract token, only primitives and structural keywords", async () => {
    const styles = stylesOf(await renderToHtml(<Container />))
    expect(nonPrimitiveValues(styles, keywords, primitives)).toEqual([])
    expect(styles).not.toContain("var(--ui-")
  })

  it("takes its width and gutter from the sizing primitives", async () => {
    // These two exist in schema.sizing for this component specifically. If
    // either is renamed, this is what says so.
    const styles = stylesOf(await renderToHtml(<Container />))
    expect(styles).toContain("max-inline-size: var(--page-max)")
    expect(styles).toContain("padding-inline: var(--gutter)")
  })

  it("centres itself", async () => {
    expect(stylesOf(await renderToHtml(<Container />))).toContain("margin-inline: auto")
  })

  it("owns no block spacing, leaving that to what it contains", async () => {
    // Container's job is the inline axis. Block rhythm belongs to the Stack
    // inside it, which is the component that knows what it is stacking.
    const styles = stylesOf(await renderToHtml(<Container />))
    expect(styles).not.toContain("padding-block")
    expect(styles).not.toContain("margin-block")
  })

  it("keeps its own css() blocks property-disjoint", async () => {
    expect(sharedProperties(styleBlocksOf(await renderToHtml(<Container />)))).toEqual([])
  })

  it("adds through mix a property it does not declare itself", async () => {
    const pinned = css({ position: "fixed" })
    const blocks = styleBlocksOf(await renderToHtml(<Container mix={pinned} />))
    expect(blocks.filter((block) => block.includes("position: fixed"))).toHaveLength(1)
    expect(blocks.filter((block) => block.includes("position:"))).toHaveLength(1)
  })
})

describe("ContainerDemo", () => {
  it("renders the edge that makes the maximum width visible", async () => {
    expect(await renderToHtml(<ContainerDemo />)).toContain("page-max")
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `bun test packages/ui-remix/src/container/`
Expected: FAIL — `Cannot find module './container.tsx'`

- [ ] **Step 3: Write `container.tsx`**

Create `packages/ui-remix/src/container/container.tsx`:

```tsx
import { css, type Handle, type MixInput, type RemixNode } from "remix/ui"

/**
 * The page's inline measure, and the component that proves the primitives
 * were the right answer rather than a workaround: `--page-max` and `--gutter`
 * exist in `schema.sizing` precisely so Container needs no tokens of its own.
 *
 * Inline axis only. Block spacing belongs to the Stack inside it, which knows
 * what it is stacking; a container that also owned vertical rhythm would be
 * two decisions in one component.
 */
const containerBase = css({
  maxInlineSize: "var(--page-max)",
  paddingInline: "var(--gutter)",
  marginInline: "auto",
})

export interface ContainerProps {
  /**
   * Adds properties Container does not declare. It does not reliably override
   * one it does — and unlike the other three, Container has no props to reach
   * for instead, because both of its lengths are primitives a theme sets.
   *
   * It also cannot change the tag: a caller wanting `<main>` or `<section>`
   * wraps the Container rather than configuring it. An `as` prop belongs to
   * whichever later task first needs one, with the accessibility question
   * considered then.
   */
  mix?: MixInput<HTMLDivElement> | undefined
  children?: RemixNode | undefined
}

export function Container(handle: Handle<ContainerProps>) {
  return () => {
    const { mix, children } = handle.props
    return <div mix={[containerBase, mix]}>{children}</div>
  }
}
```

- [ ] **Step 4: Write `container.demo.tsx`**

Create `packages/ui-remix/src/container/container.demo.tsx`:

```tsx
import { css } from "remix/ui"
import { Container } from "./container.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

/**
 * A full-bleed band behind the Container, so the measure it holds is visible
 * as a difference rather than described. Without it a Container on a narrow
 * viewport looks like a plain div.
 */
const bleed = css({
  background: "var(--surface)",
  borderBlock: "1px solid var(--hairline)",
  paddingBlock: "var(--sp-6)",
  marginBlockEnd: "var(--sp-8)",
})

const body = css({
  background: "var(--surface-raised)",
  border: "1px dashed var(--hairline-strong)",
  borderRadius: "var(--r-md)",
  padding: "var(--sp-4)",
})

export function ContainerDemo() {
  return () => (
    <>
      <p mix={label}>container: page-max wide, gutter padded, centred</p>
      <div mix={bleed}>
        <Container>
          <div mix={body}>
            This sits inside a Container. The band behind it runs the full width of the viewport;
            the dashed box stops at <code>--page-max</code> and keeps <code>--gutter</code> clear on
            each side. Narrow the window past the maximum and the gutter is what remains.
          </div>
        </Container>
      </div>
    </>
  )
}
```

- [ ] **Step 5: Wire the export and the catalogue entry**

In `packages/ui-remix/src/index.ts`:

```ts
export { Container, type ContainerProps } from "./container/container.tsx"
```

In `packages/ui-remix/src/demos.ts`, add the import and the entry:

```ts
import { ContainerDemo } from "./container/container.demo.tsx"
```

```ts
  container: { title: "Container", Demo: ContainerDemo },
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `bun test packages/ui-remix/src/container/`
Expected: PASS, 8 tests

- [ ] **Step 7: Verify the aggregate is genuinely untouched**

The deliverable is as much what did not change as what did.

Run:
```bash
git diff --stat main -- packages/ui-remix/src/tokens.ts packages/ui-remix-mini/src/theme.ts
```
Expected: no output. If either file appears, a component grew a token — stop
and raise it as the finding task 13 asks for.

- [ ] **Step 8: Run the full gate**

Run: `bun run fix && bun run check`
Expected: biome clean, `tsc` silent, every test passes.

- [ ] **Step 9: Verify all four render in the real catalogue**

Run:
```bash
bun run playground
```
Visit `/c/stack`, `/c/row`, `/c/grid` and `/c/container`. Confirm each renders,
then append `?scheme=dark` and `?density=compact` to `/c/row` and confirm the
gaps retune and nothing hard-codes a colour. Stop the server.

This is a manual step and it is not optional: task 12 found its most
consequential bug in a browser after thirteen passing tests.

- [ ] **Step 10: Commit**

```bash
git add packages/ui-remix/src/container packages/ui-remix/src/index.ts \
        packages/ui-remix/src/demos.ts
git commit -m "$(cat <<'EOF'
Add Container, which needs no tokens because the schema anticipated it

page-max and gutter were added to schema.sizing for this component
specifically, so it reads two primitives and declares nothing else. Inline
axis only: block rhythm belongs to the Stack inside it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: The documents

**Files:**
- Modify: `packages/ui-remix/README.md`
- Modify: `docs/design-system.md`

**Interfaces:**
- Consumes: the four components as shipped in tasks 2–5.
- Produces: nothing code depends on.

Two rules from the repo apply here. Documents state what is true now, so no
task numbers in either file. And `docs/` is the general rule while a package
README is that package's specifics — the always/optional rule goes in
`docs/design-system.md` because every later component with a defaulted axis
faces it, and the four components' surfaces go in the README.

- [ ] **Step 1: Read the section you are extending**

Run:
```bash
grep -n "property-disjoint" -A 40 docs/design-system.md | head -70
```

Read it before writing. The new rule is a corollary of what is already there
and must read as one, not as a second rule that happens to be nearby.

- [ ] **Step 2: Add the always/optional rule to `docs/design-system.md`**

The "Cascade layers" section is flat: `##` heading, bold-lead paragraphs, no
`###` anywhere in the file. Match that. Insert immediately after the
property-disjointness paragraph (which ends "…both declarations are present
and only one wins.") and before the paragraph beginning "**The caller's
`mix` is subject to the same rule**", so the `mix` discussion follows the rule
that constrains it:

```markdown
**An axis with a default takes its property away from `mix`.**
Disjointness is easy to satisfy when a component's axes are independent, as
`Button`'s base, size and tone are. It is harder the moment an axis has a
default, because the default and the value that replaces it are the same
property — and the obvious arrangement, a default in the base block with a
step block over the top, is exactly what the rule forbids. Two blocks could
declare `gap`, so render order, not the author, would decide which paints.

The resolution is to decide per axis whether it has a default at all:

- An axis **with** a default renders its block always, carrying the default as
  its value. There is one block for that property, so there is nothing to
  order.
- An axis **without** one renders its block only when its prop is passed. The
  component then declares that property nowhere, and the browser's own default
  applies.

The second case has a benefit worth designing for. `mix` reliably adds a
property the component does not declare and reliably overrides nothing — so an
axis that renders no block by default stays fully reachable through `mix`, and
the caller chooses which channel to use. Only passing the prop and setting the
property through `mix` at once is ambiguous, and that is visibly the caller's
error rather than a silent one.

So an axis given a default costs something: it takes that property away from
`mix` for every caller. Give an axis a default when the unset behaviour is
wrong almost every time — a horizontal row stretching items of unequal height
— and leave it out when the component has no business presuming, as with
spacing.
```

- [ ] **Step 3: Add the catalogue entries to `packages/ui-remix/README.md`**

After the `Button` / `LinkButton` section and before `### ThemeStyle`, add:

```markdown
### `Stack` / `Row` / `Grid` / `Container`

Layout, and **no tokens of their own** — the contract proved from the opposite
side to `Button`. Each reads primitives directly and declares no `--ui-*`, so
none of them appears in `src/tokens.ts` and a skin retunes them by changing the
space scale rather than by changing them.

| | Props | Declares |
| --- | --- | --- |
| `Stack` | `gap`, `align` | `display: flex`, `flex-direction: column` |
| `Row` | `gap`, `align`, `justify`, `wrap` | `display: flex` |
| `Grid` | `gap`, `cols` | `display: grid` |
| `Container` | — | `max-inline-size: var(--page-max)`, `padding-inline: var(--gutter)`, `margin-inline: auto` |

`gap` is a step on the primitive space scale — `gap={4}` is `var(--sp-4)` —
and its type derives from `schema.space`, so a step the schema does not hold
is a typecheck failure. The Record of blocks is shared in `src/space.ts`, and
`align` in `src/align.ts`, because `remix/ui` caches a `css()` block by content:
a copy per component would collapse to one sub-layer anyway and save nothing
while still drifting.

**Which axes have defaults, and why it matters.** `gap` defaults to `0` and
`Row`'s `align` to `center`; both blocks therefore always render. `Stack`'s
`align`, `Row`'s `justify` and `wrap`, and `Grid`'s `cols` render no block
until their prop is passed, which leaves those properties fully reachable
through `mix`. See
[design-system.md](../../docs/design-system.md#cascade-layers)
for the rule and the cost of giving an axis a default.

`Container` takes no props because it has nothing to decide: both of its
lengths are primitives a theme sets. It cannot change its tag either, so a
caller wanting `<main>` wraps it rather than configuring it.

`Grid` has no responsive mode. `repeat(auto-fit, minmax(…))` needs a track
minimum and the schema holds no primitive for one; a caller-supplied length
would be the only open-ended value in the package. Until a sizing ramp exists,
a responsive track list goes through `mix`, which is reliable precisely because
`cols` was not passed.
```

- [ ] **Step 4: Update the README's Status section**

Replace the existing Status paragraph with:

```markdown
`Button`, `LinkButton`, `Stack`, `Row`, `Grid`, `Container` and `ThemeStyle`
ship. `src/tokens.ts` aggregates the component records and exports
`ComponentTokenName`; the four layout components add nothing to it, which is
what they exist to demonstrate. `src/demos.ts` registers five demos.
`runtime.ts` and `compat.ts` are still stubs — nothing here needs client
JavaScript yet.
```

- [ ] **Step 5: Check the structure section still describes the tree**

The README's Structure section shows `src/button/` with a `tokens.ts`. Confirm
it reads correctly now that three directories have no `tokens.ts`, and adjust
if it implies one is mandatory:

```bash
grep -n "Structure" -A 14 packages/ui-remix/README.md
```

If it states a `tokens.ts` per component without qualification, change that
sentence to note a component declaring no tokens has none — the absence is
meaningful, not an omission.

- [ ] **Step 6: Verify no task numbers leaked into either document**

Run:
```bash
grep -nE "task [0-9]|M1|M2" packages/ui-remix/README.md docs/design-system.md
```
Expected: no output. Documents state what is true now; task numbers belong in
specs, plans and commits.

- [ ] **Step 7: Run the full gate**

Run: `bun run fix && bun run check`
Expected: biome clean, `tsc` silent, every test passes.

- [ ] **Step 8: Commit**

```bash
git add packages/ui-remix/README.md docs/design-system.md
git commit -m "$(cat <<'EOF'
Record the rule that a default takes a property away from mix

Property-disjointness was easy for Button, whose axes are independent. An
axis with a default is harder: the default and the value replacing it are the
same property, so the block must always render and mix loses that property
for every caller. Worth stating generally, since every later component with a
defaulted axis meets it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Close the task

**Files:**
- Modify: `todo/m1-foundation-and-contract-proof/13-layout-stack-row-grid-and-container.md` (via the CLI, not by hand)

- [ ] **Step 1: Confirm the "Done when" conditions**

The task's own criteria are `bun run check` green, and the four components in
the catalogue via their demos.

Run:
```bash
bun run check && bun -e 'import("@lemol/ui-remix/demos").then((m) => console.log(Object.keys(m.demos).join(" ")))'
```
Expected: the gate green, then `button stack row grid container`.

- [ ] **Step 2: Complete the task**

```bash
todo done 13
todo check
```
Expected: `todo check` reports no problems, and task 18 is listed as newly
ready.

- [ ] **Step 3: Commit the list change**

```bash
git add todo
git commit -m "$(cat <<'EOF'
Complete task 13

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Hand back**

Report: the branch, the commits, what `bun run check` printed, and the one
finding recorded on the task. Do not merge — landing the branch is the user's
call.

---

## Self-review

**Spec coverage.** Every section maps to a task: the gap channel and `space.ts`
to Task 1; the surface table to Tasks 2–5; Grid's deferral to Task 4 and the
already-recorded comment; the always/optional split to Tasks 2–5 and documented
in Task 6; tests to each component's own task; playground wiring to Tasks 2–5
step 5 and verified in Task 5 step 9; documents to Task 6; out-of-scope items
are absent by construction and Task 4 explicitly warns against adding `min`.

**Type consistency.** `SpaceStep` is defined in Task 1 and consumed with that
name in Tasks 2–4. `Align`/`alignStyles` are defined in Task 1 and used in
Tasks 2–3. `Justify` is Row-local, `ColumnCount` is Grid-local, and neither is
referenced elsewhere. `nonPrimitiveValues(styles, keywords, primitives)` keeps the same
signature in all four test files. `gaps` is indexed as `gaps[gap]` throughout.

**Verified rather than assumed while writing this plan.** The derived
`SpaceStep` resolves to `0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 24`
and rejects `7`, checked with `tsc`. The whole mechanism was spiked: a
`undefined` entry in a `mix` array is tolerated, exactly one gap block renders
by default, an optional block is absent when its prop is not passed, and
`sharedProperties` is empty in each case. `@lemol/ui-design` does **not**
resolve from `test/`, which is why the helper takes the primitive set as a
parameter. `docs/design-system.md` has no `###` headings, which is why the new
rule is a bold-lead paragraph and the README links to `#cascade-layers`.

**Two things a reviewer should push back on if they disagree.** The
`test/styles.ts` helper contradicts the spec's "no new helper is needed"; the
justification is in "Two refinements" above and the alternative is four copies
of one filter. And `src/align.ts` is a module the spec did not name, added on
the spec's own reasoning about shared Records rather than against it.
