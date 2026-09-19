# Heading, Text and Eyebrow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the type scale on the contract — `Heading`, `Text` and `Eyebrow`
in `@lemol/ui-remix`, with the bare-element floor for `h1`–`h6` derived from the
same map their tokens default from.

**Architecture:** `ui-design` gains `headingScale`, a map from heading element to
primitive size name. Its reset derives six `font-size` rules from it;
`ui-remix`'s `Heading` derives its six size-token defaults from it. Neither
package spells the ramp out, so the floor a bare `<h2>` lands on and the token
`<Heading level={2}>` reads cannot drift apart. `Text` and `Eyebrow` follow the
established shape: a `tokens.ts` record beside the component, `css()` blocks that
read only `--ui-*`, and the always/optional split from task 13.

**Tech Stack:** TypeScript from `src/` with no build step, `remix` 3.0.0-rc.2
(`remix/ui` only), `bun:test`, biome.

## Global Constraints

- **The gate is `bun run check`** — `biome check .`, then `tsc -p tsconfig.json`,
  then `bun test`. Every task ends green.
- **No component hard-codes a colour, radius, duration or space step.** A
  component with something to retheme declares `--ui-*` tokens beside itself,
  each defaulting to a primitive.
- **SPA-safe.** No `node:*`, no `bun`, no `effect`, no server-side `remix/*`
  entry in any package. `test/boundaries.test.ts` enforces it.
- **No CSS nesting in `ui-design/src/css`, ever.** The sheet ships as the text of
  a style element, where the renderer escapes `&`. Flat `:where()` lists only,
  and no child combinator.
- **Element defaults go in `@layer base`.** Unlayered CSS beats layered CSS.
- **No build step, no bundler, no Effect.** `remix` is the only peer dependency.
- **Every component gets a server-render test** using `bun:test` and the helpers
  at `test/render.ts` and `test/styles.ts` (repo root, imported as
  `../../../../test/render.ts` from a component directory).
- **Formatting:** biome, 2-space indent, width 100, double quotes, semicolons as
  needed. Run `bun run fix` before committing rather than hand-sorting exports.
- **Commit style:** imperative subject describing the change's point, body
  explaining why. End every commit message with
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

**Spec:** `docs/superpowers/specs/2026-09-18-ui-remix-typography-design.md`.
Read it before Task 2 — it holds the reasoning this plan only summarises.

---

## Pre-flight findings

Both questions the spec left open were probed against this working tree with a
throwaway `*.test.tsx` and `bun run typecheck`, then deleted. Both resolved in
favour of the simpler implementation, so no task below carries a fallback.

**A union-typed string in component position works.** With
`const tags = { 1: "h1", … } as const`, `const Tag = tags[level]` gives
`"h1" | … | "h6"`, and `<Tag mix={…}>{children}</Tag>` both typechecks and
renders the right element. Six literal JSX branches are not needed.

**`MixInput` over a union element type works.**
`MixInput<HTMLParagraphElement | HTMLSpanElement | HTMLDivElement>` typechecks
and stays assignable when handed to a dynamic `Tag`. `MixInput<HTMLElement>` is
not needed, and `Text` keeps the precise type.

---

## File structure

**`packages/ui-design`** — the floor.

| File | Responsibility |
| --- | --- |
| `src/tokens.ts` | Gains `headingScale` and `HeadingLevel` beside `schema`. |
| `src/tokens.test.ts` | Gains the scale's own checks. |
| `src/index.ts` | Re-exports both names. |
| `src/css/reset.ts` | Derives six `font-size` rules from `headingScale`. |
| `src/css/reset.test.ts` | Asserts the six rules, derived from the same map. |

**`packages/ui-remix`** — the contract.

| File | Responsibility |
| --- | --- |
| `src/heading/tokens.ts` | Ten tokens; the six sizes derived from `headingScale`. |
| `src/heading/heading.tsx` | `level`, `size`, `mix`, `children`. Two blocks. |
| `src/heading/heading.demo.tsx` | Every level, and the decoupling. |
| `src/heading/heading.test.tsx` | Render, contract, disjointness, decoupling. |
| `src/text/tokens.ts` | Seven tokens: three sizes, leading, three inks. |
| `src/text/text.tsx` | `size`, `tone`, `as`, `mix`, `children`. Three blocks. |
| `src/text/text.demo.tsx` | Every size, every tone, every tag. |
| `src/text/text.test.tsx` | Render, contract, disjointness, `as`, mix-owns-weight. |
| `src/eyebrow/tokens.ts` | Five tokens, one of them the `uppercase` keyword. |
| `src/eyebrow/eyebrow.tsx` | No props but `mix` and `children`. One block. |
| `src/eyebrow/eyebrow.demo.tsx` | The eyebrow above a heading, in context. |
| `src/eyebrow/eyebrow.test.tsx` | Render, contract, the transform token. |
| `src/tokens.ts` | Aggregates the three new records. |
| `src/tokens.test.ts` | `uppercase` joins `allowedLiterals`. |
| `src/index.ts` | Exports the three components and their prop types. |
| `src/demos.ts` | Three new catalogue entries. |

No new shared module at the package root. Unlike `space.ts` and `align.ts`,
nothing here is shared between the three components.

**Docs:** `packages/ui-remix/README.md`, `packages/ui-design/README.md`,
`docs/design-system.md`, `todo/TODO.md`, and the task file moving to
`todo/done/m1-foundation-and-contract-proof/`.

---

## Task 0: Branch

- [ ] **Step 1: Cut a branch from main**

Task 13 landed as a merge into `main`; this follows it.

```bash
git checkout -b task-14-typography
git status
```

Expected: `On branch task-14-typography`, working tree clean.

---

## Task 1: `headingScale` and the reset's six sizes

The floor. Nothing in `ui-remix` can be written until the map exists, because
`Heading`'s token defaults derive from it.

**Files:**
- Modify: `packages/ui-design/src/tokens.ts` (append after `groupOf`)
- Modify: `packages/ui-design/src/tokens.test.ts`
- Modify: `packages/ui-design/src/index.ts`
- Modify: `packages/ui-design/src/css/reset.ts`
- Modify: `packages/ui-design/src/css/reset.test.ts`

**Interfaces:**
- Consumes: `schema.type`, `PrimitiveName` from `./tokens.ts`; `base()` from
  `./layers.ts`.
- Produces:
  - `headingScale: { readonly 1: "fs-3xl"; readonly 2: "fs-2xl"; readonly 3: "fs-xl"; readonly 4: "fs-lg"; readonly 5: "fs-md"; readonly 6: "fs-sm" }`
  - `type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6` (`keyof typeof headingScale`)
  - Both re-exported from `@lemol/ui-design` (the package root, **not**
    `/css` — `ui-remix`'s token records must not import the CSS entry).
  - `resetCss` gains `:where(h1) { font-size: var(--fs-3xl); }` through `h6`.

- [ ] **Step 1: Write the failing scale tests**

Append to `packages/ui-design/src/tokens.test.ts`, and add `headingScale` to the
existing import from `./tokens.ts`:

```ts
describe("the heading scale", () => {
  it("covers h1 through h6 and nothing else", () => {
    expect(Object.keys(headingScale)).toEqual(["1", "2", "3", "4", "5", "6"])
  })

  it("names only sizes the type group holds", () => {
    // A name the schema dropped would resolve to nothing: no error, no style.
    const sizes: readonly string[] = schema.type
    for (const name of Object.values(headingScale)) expect(sizes).toContain(name)
  })

  it("gives each level a size of its own", () => {
    // Two levels on one step is a scale with a rung missing, and it reads as a
    // heading that did not change when the level did.
    expect(new Set(Object.values(headingScale)).size).toBe(6)
  })

  it("descends", () => {
    // The order the type group declares its sizes in is the order the scale
    // walks, so h1 is the largest without this file knowing any value.
    const order: readonly string[] = schema.type
    const positions = Object.values(headingScale).map((name) => order.indexOf(name))
    expect(positions).toEqual([...positions].sort((a, b) => b - a))
  })
})
```

- [ ] **Step 2: Run it to see it fail**

```bash
bun test packages/ui-design/src/tokens.test.ts
```

Expected: FAIL — `headingScale` is not exported from `./tokens.ts`.

- [ ] **Step 3: Add the map**

Append to `packages/ui-design/src/tokens.ts`:

```ts
/**
 * Which primitive sizes a bare heading, by element.
 *
 * `h1`–`h6` are HTML elements, not components, so this tells a package that
 * holds no values nothing about which components exist — /css derives its six
 * font-size rules from it, and ui-remix's Heading defaults its size tokens from
 * it. Deriving both from one map is why the floor a bare <h2> lands on and the
 * token <Heading level={2}> reads cannot drift apart, and it is the same move
 * reducedMotionCss makes with the dur- names in schema.motion.
 *
 * h5 lands on body size and h6 below it. Both stay distinct through the
 * fw-bold, tr-tight and lh-tight the reset's heading rule already carries, and
 * stopping at fs-sm leaves fs-xs and fs-2xs to the smaller UI that needs them.
 */
export const headingScale = {
  1: "fs-3xl",
  2: "fs-2xl",
  3: "fs-xl",
  4: "fs-lg",
  5: "fs-md",
  6: "fs-sm",
} as const satisfies Record<number, PrimitiveName>

export type HeadingLevel = keyof typeof headingScale
```

- [ ] **Step 4: Run it to see it pass**

```bash
bun test packages/ui-design/src/tokens.test.ts
```

Expected: PASS, four new tests among them.

- [ ] **Step 5: Write the failing reset test**

In `packages/ui-design/src/css/reset.test.ts`, add `headingScale` to the import
from `../tokens.ts` and append inside the existing `describe("the reset", …)`:

```ts
  it("sizes every bare heading from the scale", () => {
    // Derived from the same map the component's tokens default from, so this
    // fails if either side is edited alone.
    for (const [level, name] of Object.entries(headingScale)) {
      expect(resetCss).toMatch(
        new RegExp(`:where\\(h${level}\\)\\s*\\{[^}]*font-size:\\s*var\\(--${name}\\)`),
      )
    }
  })
```

- [ ] **Step 6: Run it to see it fail**

```bash
bun test packages/ui-design/src/css/reset.test.ts
```

Expected: FAIL — no `:where(h1)` rule in `resetCss`.

- [ ] **Step 7: Derive the rules**

In `packages/ui-design/src/css/reset.ts`, add `headingScale` to the import from
`../tokens.ts`, then add above `export const resetCss`:

```ts
/**
 * One rule per heading element, derived rather than written out.
 *
 * Flat and separate, not a grouped :where() list, because each element takes a
 * different size — and flat because a nested rule arrives at the browser broken
 * when the sheet ships as style-element text.
 */
const headingSizeRules = Object.entries(headingScale)
  .map(([level, name]) => `  :where(h${level}) {\n    font-size: var(--${name});\n  }`)
  .join("\n\n")
```

Then interpolate it into the template immediately after the existing
`:where(h1, h2, h3, h4, h5, h6)` weight rule, keeping a blank line either side:

```ts
  :where(h1, h2, h3, h4, h5, h6) {
    font-weight: var(--fw-bold);
    letter-spacing: var(--tr-tight);
    line-height: var(--lh-tight);
  }

${headingSizeRules}

  :where(img, svg, video, canvas) {
```

- [ ] **Step 8: Run the whole ui-design suite**

```bash
bun test packages/ui-design/
```

Expected: PASS. Three existing tests in `reset.test.ts` also cover the new
rules — "references only tokens the schema names", "spends no literal length or
duration", and "keeps every element default inside the base layer". If any of
them fails, the interpolation escaped the `base()` wrapper or named a size the
schema does not hold.

- [ ] **Step 9: Export both names**

In `packages/ui-design/src/index.ts`, add `headingScale` and
`type HeadingLevel` to the existing export block from `./tokens.ts`, then let
biome order them:

```bash
bun run fix
```

- [ ] **Step 10: Run the gate**

```bash
bun run check
```

Expected: all three stages green.

- [ ] **Step 11: Commit**

```bash
git add packages/ui-design/src
git commit -m "$(cat <<'EOF'
Give a bare heading a size the theme chose

The reset already wired h1-h6 to fw-bold, tr-tight and lh-tight and stopped
short of font-size, leaving the most visible property of an unwrapped heading
on the user agent's 2em -- a literal no theme can reach. headingScale supplies
it, and ui-remix's Heading will default its size tokens from the same map, so
the floor and the contract cannot disagree.

h1-h6 are elements, not components, so the map tells ui-design nothing about
which components exist.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `Heading`

**Files:**
- Create: `packages/ui-remix/src/heading/tokens.ts`
- Create: `packages/ui-remix/src/heading/heading.tsx`
- Create: `packages/ui-remix/src/heading/heading.demo.tsx`
- Create: `packages/ui-remix/src/heading/heading.test.tsx`
- Modify: `packages/ui-remix/src/tokens.ts`
- Modify: `packages/ui-remix/src/index.ts`
- Modify: `packages/ui-remix/src/demos.ts`

**Interfaces:**
- Consumes: `headingScale`, `HeadingLevel`, `primitiveNames` from
  `@lemol/ui-design`; `css`, `Handle`, `MixInput`, `RemixNode`,
  `CSSMixinDescriptor` from `remix/ui`; `renderToHtml` from
  `../../../../test/render.ts`; `sharedProperties`, `styleBlocksOf`,
  `stylesOf`, `valuesOf` from `../../../../test/styles.ts`.
- Produces:
  - `headingTokens`: `ui-heading-<1..6>-size`, `ui-heading-weight`,
    `ui-heading-tracking`, `ui-heading-leading`, `ui-heading-ink`.
  - `Heading(handle: Handle<HeadingProps>)`, with
    `HeadingProps { level: HeadingLevel; size?: HeadingLevel | undefined; mix?: MixInput<HTMLHeadingElement> | undefined; children?: RemixNode | undefined }`.
  - `HeadingDemo()` and the exported `demoLevels` its test loops over.
  - Catalogue key `heading`.

- [ ] **Step 1: Write the token record**

Create `packages/ui-remix/src/heading/tokens.ts`:

```ts
import { type HeadingLevel, headingScale } from "@lemol/ui-design"

type SizeTokens = { [L in HeadingLevel as `ui-heading-${L}-size`]: string }

/**
 * The six sizes, derived from the same map ui-design's reset derives its
 * font-size rules from. Written out here instead, the ramp would be spelled
 * twice in two packages and a skin could leave a bare <h2> behind.
 *
 * The keys stay literal through the mapped type, which is what mini's
 * excess-property rename check needs: an override of a token that no longer
 * exists has to fail at the line that wrote it.
 */
const sizeTokens = Object.fromEntries(
  Object.entries(headingScale).map(([level, name]) => [
    `ui-heading-${level}-size`,
    `var(--${name})`,
  ]),
) as SizeTokens

/**
 * Heading's contract. The three shared properties restate one tier up what the
 * reset gives a bare heading, for the same reason the sizes do: this tier is
 * what a skin can reach, and the reset is the floor for markup nobody wrapped.
 *
 * `ui-heading-ink` is a deliberate trade. Declaring `color` takes the property
 * away from `mix` — see the always/optional rule in docs/design-system.md — and
 * headings in a hue of their own is a routine brand move, so it is better
 * reachable through the contract than through an escape hatch.
 */
export const headingTokens = {
  ...sizeTokens,
  "ui-heading-weight": "var(--fw-bold)",
  "ui-heading-tracking": "var(--tr-tight)",
  "ui-heading-leading": "var(--lh-tight)",
  "ui-heading-ink": "var(--ink)",
} as const
```

- [ ] **Step 2: Aggregate it, and watch the existing token test cover it**

In `packages/ui-remix/src/tokens.ts`, add the import and the spread:

```ts
import { buttonTokens } from "./button/tokens.ts"
import { headingTokens } from "./heading/tokens.ts"

export const componentTokens = {
  ...buttonTokens,
  ...headingTokens,
} satisfies Record<string, string>
```

```bash
bun test packages/ui-remix/src/tokens.test.ts
```

Expected: PASS. The existing suite already checks that every new default names a
primitive the schema holds and is `ui-`-prefixed — no new test needed here.

- [ ] **Step 3: Write the failing component test**

Create `packages/ui-remix/src/heading/heading.test.tsx`:

```tsx
import { describe, expect, it } from "bun:test"
import { type HeadingLevel, headingScale } from "@lemol/ui-design"
import { css } from "remix/ui"
import { renderToHtml } from "../../../../test/render.ts"
import {
  sharedProperties,
  styleBlocksOf,
  stylesOf,
  valuesOf,
} from "../../../../test/styles.ts"
import { demoLevels, HeadingDemo } from "./heading.demo.tsx"
import { Heading } from "./heading.tsx"
import { headingTokens } from "./tokens.ts"

/** Derived, not restated: a level the scale gains is a level these loops cover. */
const levels = Object.keys(headingScale).map(Number) as HeadingLevel[]

describe("Heading", () => {
  it("renders the element its level names, carrying its children", async () => {
    for (const level of levels) {
      const html = await renderToHtml(<Heading level={level}>Title</Heading>)
      expect(html).toContain(`<h${level}`)
      expect(html).toContain("Title")
    }
  })

  it("reads only its own tokens", async () => {
    // The machine-checkable form of "no component hard-codes a colour, radius,
    // duration or space step" — the same assertion button.test.tsx makes, and
    // the reason a primitive cannot leak into this tier.
    for (const level of levels) {
      const styles = stylesOf(await renderToHtml(<Heading level={level}>Title</Heading>))
      const offenders = valuesOf(styles).filter(
        (value) => !/^var\(--ui-heading-[\w-]+\)$/.test(value),
      )
      expect(offenders).toEqual([])
    }
  })

  it("declares a token for every size it reads", async () => {
    // heading.tsx composes the size token name from a number, so this is what
    // stops a level from reading a name the record does not hold.
    const missing = levels.filter((level) => !(`ui-heading-${level}-size` in headingTokens))
    expect(missing).toEqual([])
  })

  it("emits exactly one font-size block, default included", async () => {
    // Two blocks that could both declare font-size would hand sub-layer order
    // the decision, and that order follows render order, not source order.
    const blocks = styleBlocksOf(await renderToHtml(<Heading level={2}>Title</Heading>))
    expect(blocks.filter((block) => block.includes("font-size:"))).toHaveLength(1)
  })

  it("sizes a heading from its level by default", async () => {
    for (const level of levels) {
      const styles = stylesOf(await renderToHtml(<Heading level={level}>Title</Heading>))
      expect(styles).toContain(`font-size: var(--ui-heading-${level}-size)`)
    }
  })

  it("keeps the outline when size and level disagree", async () => {
    // The whole reason this component is more than a tag switch: a card title
    // must be an h3 for the document outline and may need to look like an h5.
    const html = await renderToHtml(
      <Heading level={2} size={5}>
        Title
      </Heading>,
    )
    expect(html).toContain("<h2")
    expect(stylesOf(html)).toContain("font-size: var(--ui-heading-5-size)")
    expect(stylesOf(html)).not.toContain("var(--ui-heading-2-size)")
  })

  it("keeps its own css() blocks property-disjoint across every combination", async () => {
    for (const level of levels) {
      for (const size of levels) {
        const blocks = styleBlocksOf(
          await renderToHtml(
            <Heading level={level} size={size}>
              Title
            </Heading>,
          ),
        )
        expect(sharedProperties(blocks)).toEqual([])
      }
    }
  })

  it("adds through mix a property it does not declare itself", async () => {
    const pinned = css({ position: "fixed" })
    const blocks = styleBlocksOf(await renderToHtml(<Heading level={1} mix={pinned}>Title</Heading>))
    expect(blocks.filter((block) => block.includes("position: fixed"))).toHaveLength(1)
  })
})

describe("HeadingDemo", () => {
  it("renders every level it demonstrates", async () => {
    const html = await renderToHtml(<HeadingDemo />)
    for (const level of demoLevels) expect(html).toContain(`<h${level}`)
  })
})
```

- [ ] **Step 4: Run it to see it fail**

```bash
bun test packages/ui-remix/src/heading/heading.test.tsx
```

Expected: FAIL — cannot resolve `./heading.tsx`.

- [ ] **Step 5: Write the component**

Create `packages/ui-remix/src/heading/heading.tsx`:

```tsx
import { type HeadingLevel, headingScale } from "@lemol/ui-design"
import { type CSSMixinDescriptor, css, type Handle, type MixInput, type RemixNode } from "remix/ui"

/**
 * Every declaration reads a --ui-heading-* token. A literal size, weight or
 * colour here is the failure this component exists to make impossible, and
 * heading.test.tsx checks for one.
 *
 * font-size is deliberately absent: it belongs to the size block, which always
 * renders and carries the level's default. Two blocks that could both declare
 * it would put sub-layer order in charge of which one paints.
 */
const headingBase = css({
  fontWeight: "var(--ui-heading-weight)",
  letterSpacing: "var(--ui-heading-tracking)",
  lineHeight: "var(--ui-heading-leading)",
  color: "var(--ui-heading-ink)",
})

const levels = Object.keys(headingScale).map(Number) as HeadingLevel[]

const sizeStyles = Object.fromEntries(
  levels.map((level) => [level, css({ fontSize: `var(--ui-heading-${level}-size)` })]),
) as Record<HeadingLevel, CSSMixinDescriptor>

/**
 * Literal, not composed: a template literal type would widen to `string` at the
 * JSX call site, where an element name has to be a union of literals. The test
 * pins this against headingScale, so a level added to the scale cannot be left
 * without a tag.
 */
const tags = { 1: "h1", 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } as const

export interface HeadingProps {
  /**
   * The document outline. Required, because a heading with no level is an
   * outline bug and no default is right more often than it is wrong.
   */
  level: HeadingLevel
  /**
   * What it looks like, defaulting to `level`. The two are separate props
   * because they are separate decisions: a card title inside a page that
   * already has an `h2` must be an `h3` and should often look smaller than one.
   *
   * Its block always renders, carrying the default, so `font-size` is not
   * reachable through `mix` — pass `size`, or set `--ui-heading-<n>-size`.
   */
  size?: HeadingLevel | undefined
  /**
   * Adds properties Heading does not declare — `text-wrap`, a grid placement
   * owned by the layout around it. It does not reliably override one it does:
   * each `css()` block is its own cascade sub-layer, layer order beats
   * specificity within a layer, and sub-layer order follows render order rather
   * than the order of this array. To change a property Heading declares, set
   * its token.
   */
  mix?: MixInput<HTMLHeadingElement> | undefined
  children?: RemixNode | undefined
}

export function Heading(handle: Handle<HeadingProps>) {
  return () => {
    const { level, size = level, mix, children } = handle.props
    const Tag = tags[level]
    return <Tag mix={[headingBase, sizeStyles[size], mix]}>{children}</Tag>
  }
}
```

- [ ] **Step 6: Write the demo**

Create `packages/ui-remix/src/heading/heading.demo.tsx`:

```tsx
import { css } from "remix/ui"
import { type HeadingLevel, headingScale } from "@lemol/ui-design"
import { Heading } from "./heading.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const row = css({
  display: "flex",
  flexDirection: "column",
  gap: "var(--sp-1)",
  marginBlockEnd: "var(--sp-6)",
})

/** Derived, so a level added to the scale appears here without an edit. */
export const demoLevels = Object.keys(headingScale).map(Number) as HeadingLevel[]

export function HeadingDemo() {
  return () => (
    <>
      <p mix={label}>heading: one size per level, and a level that keeps its own</p>
      {demoLevels.map((level) => (
        <div mix={row}>
          <Heading level={level}>The quick brown fox jumps over the lazy dog</Heading>
        </div>
      ))}
      <p mix={label}>size overrides the level, and the outline is unchanged</p>
      <div mix={row}>
        <Heading level={2} size={5}>
          An h2 that looks like an h5
        </Heading>
      </div>
    </>
  )
}
```

- [ ] **Step 7: Run the test to see it pass**

```bash
bun test packages/ui-remix/src/heading/heading.test.tsx
```

Expected: PASS, nine tests.

- [ ] **Step 8: Wire the exports and the catalogue**

In `packages/ui-remix/src/index.ts` add:

```ts
export { Heading, type HeadingProps } from "./heading/heading.tsx"
```

In `packages/ui-remix/src/demos.ts` add the import and the entry:

```ts
import { HeadingDemo } from "./heading/heading.demo.tsx"
```

```ts
  heading: { title: "Heading", Demo: HeadingDemo },
```

- [ ] **Step 9: Run the gate**

```bash
bun run fix && bun run check
```

Expected: green. `HeadingLevel` is re-exported from `@lemol/ui-design`, so
`ui-remix` does not re-export it under a second name.

- [ ] **Step 10: Commit**

```bash
git add packages/ui-remix/src
git commit -m "$(cat <<'EOF'
Add Heading, where the outline and the appearance are separate props

level picks the element and is required; size picks the step and defaults to
level. Keeping them apart is the point: a card title inside a page that already
has an h2 must be an h3 and should look smaller than one, and mix cannot rescue
that -- the size block always renders, so font-size is the token's to change.

The six size tokens derive from headingScale, so they cannot disagree with the
sizes the reset gives a bare heading.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `Text`

**Files:**
- Create: `packages/ui-remix/src/text/tokens.ts`
- Create: `packages/ui-remix/src/text/text.tsx`
- Create: `packages/ui-remix/src/text/text.demo.tsx`
- Create: `packages/ui-remix/src/text/text.test.tsx`
- Modify: `packages/ui-remix/src/tokens.ts`
- Modify: `packages/ui-remix/src/index.ts`
- Modify: `packages/ui-remix/src/demos.ts`

**Interfaces:**
- Consumes: the same imports as Task 2, minus `headingScale`.
- Produces:
  - `textTokens`: `ui-text-size-{sm,md,lg}`, `ui-text-leading`,
    `ui-text-ink`, `ui-text-ink-muted`, `ui-text-ink-subtle`.
  - `Text(handle: Handle<TextProps>)`, with
    `TextProps { size?: TextSize | undefined; tone?: TextTone | undefined; as?: TextTag | undefined; mix?: MixInput<HTMLParagraphElement | HTMLSpanElement | HTMLDivElement> | undefined; children?: RemixNode | undefined }`.
  - `type TextSize = "sm" | "md" | "lg"`, `type TextTone = "default" | "muted" | "subtle"`,
    `type TextTag = "p" | "span" | "div"`.
  - `TextDemo()`. Catalogue key `text`.

- [ ] **Step 1: Write the token record**

Create `packages/ui-remix/src/text/tokens.ts`:

```ts
/**
 * Text's contract. Three sizes because prose varies by that much and no more —
 * a fourth would be a heading or an eyebrow, both of which exist.
 *
 * No weight token, because Text declares no font-weight: an undeclared property
 * is reliably `mix`'s, which is the half of the always/optional rule that makes
 * an escape hatch dependable rather than accidental.
 */
export const textTokens = {
  "ui-text-size-sm": "var(--fs-sm)",
  "ui-text-size-md": "var(--fs-md)",
  "ui-text-size-lg": "var(--fs-lg)",
  "ui-text-leading": "var(--lh-base)",

  // Three inks rather than an opacity ratio, so every default names a
  // primitive and there is no literal percentage to retune.
  "ui-text-ink": "var(--ink)",
  "ui-text-ink-muted": "var(--ink-muted)",
  "ui-text-ink-subtle": "var(--ink-subtle)",
} as const
```

- [ ] **Step 2: Aggregate it**

In `packages/ui-remix/src/tokens.ts`:

```ts
import { textTokens } from "./text/tokens.ts"
```

```ts
export const componentTokens = {
  ...buttonTokens,
  ...headingTokens,
  ...textTokens,
} satisfies Record<string, string>
```

```bash
bun test packages/ui-remix/src/tokens.test.ts
```

Expected: PASS.

- [ ] **Step 3: Write the failing component test**

Create `packages/ui-remix/src/text/text.test.tsx`:

```tsx
import { describe, expect, it } from "bun:test"
import { css } from "remix/ui"
import { renderToHtml } from "../../../../test/render.ts"
import {
  sharedProperties,
  styleBlocksOf,
  stylesOf,
  valuesOf,
} from "../../../../test/styles.ts"
import { TextDemo } from "./text.demo.tsx"
import { Text, type TextSize, type TextTag, type TextTone } from "./text.tsx"

const sizes: TextSize[] = ["sm", "md", "lg"]
const tones: TextTone[] = ["default", "muted", "subtle"]
const tags: TextTag[] = ["p", "span", "div"]

describe("Text", () => {
  it("renders a p by default, carrying its children", async () => {
    const html = await renderToHtml(<Text>prose</Text>)
    expect(html).toContain("<p")
    expect(html).toContain("prose")
  })

  it("renders every tag it offers", async () => {
    // A <p> inside a <p> is invalid markup the parser silently unnests, so
    // inline text needs a tag of its own or it ends up styled by hand.
    for (const tag of tags) {
      expect(await renderToHtml(<Text as={tag}>prose</Text>)).toContain(`<${tag}`)
    }
  })

  it("reads only its own tokens", async () => {
    for (const size of sizes) {
      for (const tone of tones) {
        const styles = stylesOf(
          await renderToHtml(
            <Text size={size} tone={tone}>
              prose
            </Text>,
          ),
        )
        const offenders = valuesOf(styles).filter(
          (value) => !/^var\(--ui-text-[\w-]+\)$/.test(value),
        )
        expect(offenders).toEqual([])
      }
    }
  })

  it("emits the size and tone a caller asks for", async () => {
    for (const size of sizes) {
      expect(stylesOf(await renderToHtml(<Text size={size}>prose</Text>))).toContain(
        `font-size: var(--ui-text-size-${size})`,
      )
    }
    const inks = { default: "ui-text-ink", muted: "ui-text-ink-muted", subtle: "ui-text-ink-subtle" }
    for (const tone of tones) {
      expect(stylesOf(await renderToHtml(<Text tone={tone}>prose</Text>))).toContain(
        `color: var(--${inks[tone]})`,
      )
    }
  })

  it("defaults to md and the plain ink", async () => {
    const styles = stylesOf(await renderToHtml(<Text>prose</Text>))
    expect(styles).toContain("font-size: var(--ui-text-size-md)")
    expect(styles).toContain("color: var(--ui-text-ink)")
  })

  it("keeps its own css() blocks property-disjoint across every combination", async () => {
    for (const size of sizes) {
      for (const tone of tones) {
        const blocks = styleBlocksOf(
          await renderToHtml(
            <Text size={size} tone={tone}>
              prose
            </Text>,
          ),
        )
        expect(sharedProperties(blocks)).toEqual([])
      }
    }
  })

  it("leaves font-weight to mix, and declares none of its own", async () => {
    // The mix-driven half of the always/optional rule, used on purpose: a
    // property the component never declares is reliably the caller's.
    expect(stylesOf(await renderToHtml(<Text>prose</Text>))).not.toContain("font-weight")
    const bold = css({ fontWeight: "var(--fw-semibold)" })
    const blocks = styleBlocksOf(await renderToHtml(<Text mix={bold}>prose</Text>))
    expect(blocks.filter((block) => block.includes("font-weight:"))).toHaveLength(1)
  })
})

describe("TextDemo", () => {
  it("renders every value of every axis it demonstrates", async () => {
    const html = await renderToHtml(<TextDemo />)
    for (const size of sizes) expect(html).toContain(`size ${size}`)
    for (const tone of tones) expect(html).toContain(`tone ${tone}`)
  })
})
```

- [ ] **Step 4: Run it to see it fail**

```bash
bun test packages/ui-remix/src/text/text.test.tsx
```

Expected: FAIL — cannot resolve `./text.tsx`.

- [ ] **Step 5: Write the component**

Create `packages/ui-remix/src/text/text.tsx`:

```tsx
import { type CSSMixinDescriptor, css, type Handle, type MixInput, type RemixNode } from "remix/ui"

export type TextSize = "sm" | "md" | "lg"
export type TextTone = "default" | "muted" | "subtle"

/**
 * Three interchangeable tags. They differ in block-versus-inline layout and in
 * nothing an assistive technology reports, which is why this is not the
 * polymorphism question Container's spec deferred — one that could reach
 * `section` or `main` would be.
 */
export type TextTag = "p" | "span" | "div"

/**
 * Leading only. font-size belongs to the size block and color to the tone
 * block, each of which always renders: three blocks, three properties, no two
 * of them able to declare the same one.
 *
 * font-weight is absent on purpose. See TextProps.mix.
 */
const textBase = css({
  lineHeight: "var(--ui-text-leading)",
})

const sizeStyles: Record<TextSize, CSSMixinDescriptor> = {
  sm: css({ fontSize: "var(--ui-text-size-sm)" }),
  md: css({ fontSize: "var(--ui-text-size-md)" }),
  lg: css({ fontSize: "var(--ui-text-size-lg)" }),
}

const toneStyles: Record<TextTone, CSSMixinDescriptor> = {
  default: css({ color: "var(--ui-text-ink)" }),
  muted: css({ color: "var(--ui-text-ink-muted)" }),
  subtle: css({ color: "var(--ui-text-ink-subtle)" }),
}

export interface TextProps {
  /** Defaults to `md`. Its block always renders, carrying that default. */
  size?: TextSize | undefined
  /** Defaults to `default`. Its block always renders, carrying that default. */
  tone?: TextTone | undefined
  /**
   * Defaults to `p`. Pass `span` for text inside a sentence: a `<p>` nested in
   * a `<p>` is invalid markup that the parser silently unnests, which is how
   * inline muted text ends up styled by hand and off the contract.
   */
  as?: TextTag | undefined
  /**
   * Adds properties Text does not declare, and `font-weight` is deliberately
   * one of them: `mix={css({ fontWeight: "var(--fw-semibold)" })}` is reliable
   * because Text declares no weight at all. It does not reliably override
   * `line-height`, `font-size` or `color`, which Text does declare — those go
   * through `size`, `tone`, or the token.
   */
  mix?: MixInput<HTMLParagraphElement | HTMLSpanElement | HTMLDivElement> | undefined
  children?: RemixNode | undefined
}

export function Text(handle: Handle<TextProps>) {
  return () => {
    const { size = "md", tone = "default", as = "p", mix, children } = handle.props
    const Tag = as
    return <Tag mix={[textBase, sizeStyles[size], toneStyles[tone], mix]}>{children}</Tag>
  }
}
```

- [ ] **Step 6: Write the demo**

Create `packages/ui-remix/src/text/text.demo.tsx`:

```tsx
import { css } from "remix/ui"
import { Text, type TextSize, type TextTone } from "./text.tsx"

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
  gap: "var(--sp-2)",
  marginBlockEnd: "var(--sp-6)",
})

const sizes: TextSize[] = ["sm", "md", "lg"]
const tones: TextTone[] = ["default", "muted", "subtle"]

export function TextDemo() {
  return () => (
    <>
      <p mix={label}>text: three sizes</p>
      <div mix={group}>
        {sizes.map((size) => (
          <Text size={size}>size {size}: the quick brown fox jumps over the lazy dog</Text>
        ))}
      </div>
      <p mix={label}>text: three tones</p>
      <div mix={group}>
        {tones.map((tone) => (
          <Text tone={tone}>tone {tone}: the quick brown fox jumps over the lazy dog</Text>
        ))}
      </div>
      <p mix={label}>text: inline, inside a sentence</p>
      <div mix={group}>
        <Text>
          A paragraph with <Text as="span" size="sm" tone="muted">an inline muted aside</Text> set
          in the middle of it, which is what <code>as</code> exists for.
        </Text>
      </div>
    </>
  )
}
```

- [ ] **Step 7: Run the test to see it pass**

```bash
bun test packages/ui-remix/src/text/text.test.tsx
```

Expected: PASS, eight tests.

- [ ] **Step 8: Wire the exports and the catalogue**

In `packages/ui-remix/src/index.ts`:

```ts
export { Text, type TextProps, type TextSize, type TextTag, type TextTone } from "./text/text.tsx"
```

In `packages/ui-remix/src/demos.ts`, the import plus:

```ts
  text: { title: "Text", Demo: TextDemo },
```

- [ ] **Step 9: Run the gate**

```bash
bun run fix && bun run check
```

Expected: green.

- [ ] **Step 10: Commit**

```bash
git add packages/ui-remix/src
git commit -m "$(cat <<'EOF'
Add Text, and with it the package's first as prop

Container's spec deferred an as prop to whichever task first needed one. This
is it: a <p> nested in a <p> is invalid markup the parser unnests, so without
as, every inline muted phrase -- most of the ink-muted on a real page -- is a
bare span styled by hand and off the contract. p, span and div differ in
layout and in nothing assistive technology reports, so the question Container
deferred does not arise here.

No weight prop. Text declares no font-weight, which makes it reliably mix's.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `Eyebrow`, and the allow-list

**Files:**
- Create: `packages/ui-remix/src/eyebrow/tokens.ts`
- Create: `packages/ui-remix/src/eyebrow/eyebrow.tsx`
- Create: `packages/ui-remix/src/eyebrow/eyebrow.demo.tsx`
- Create: `packages/ui-remix/src/eyebrow/eyebrow.test.tsx`
- Modify: `packages/ui-remix/src/tokens.ts`
- Modify: `packages/ui-remix/src/tokens.test.ts` (the `allowedLiterals` set)
- Modify: `packages/ui-remix/src/index.ts`
- Modify: `packages/ui-remix/src/demos.ts`

**Interfaces:**
- Consumes: `Heading` from `../heading/heading.tsx` (demo only); the usual
  `remix/ui` and test-helper imports.
- Produces:
  - `eyebrowTokens`: `ui-eyebrow-size`, `-weight`, `-tracking`, `-transform`,
    `-ink`.
  - `Eyebrow(handle: Handle<EyebrowProps>)`, with
    `EyebrowProps { mix?: MixInput<HTMLParagraphElement> | undefined; children?: RemixNode | undefined }`.
  - `EyebrowDemo()`. Catalogue key `eyebrow`.

- [ ] **Step 1: Write the token record**

Create `packages/ui-remix/src/eyebrow/tokens.ts`:

```ts
/**
 * Eyebrow's contract — the one component whose entire reason to exist is
 * aesthetic, so all five of its properties are reachable.
 *
 * `tr-wider` is in schema.type because of this component, and a primitive with
 * no consumer that can vary it is a value nobody can check.
 *
 * `ui-eyebrow-transform` holds a keyword rather than a primitive, which is why
 * `uppercase` is allow-listed in ../tokens.test.ts. No leading token: an
 * eyebrow is one line, and the inherited lh-base is right when it wraps.
 */
export const eyebrowTokens = {
  "ui-eyebrow-size": "var(--fs-2xs)",
  "ui-eyebrow-weight": "var(--fw-semibold)",
  "ui-eyebrow-tracking": "var(--tr-wider)",
  "ui-eyebrow-transform": "uppercase",
  "ui-eyebrow-ink": "var(--ink-muted)",
} as const
```

- [ ] **Step 2: Aggregate it and watch the token test fail**

In `packages/ui-remix/src/tokens.ts`:

```ts
import { eyebrowTokens } from "./eyebrow/tokens.ts"
```

```ts
export const componentTokens = {
  ...buttonTokens,
  ...eyebrowTokens,
  ...headingTokens,
  ...textTokens,
} satisfies Record<string, string>
```

```bash
bun test packages/ui-remix/src/tokens.test.ts
```

Expected: FAIL —
`ui-eyebrow-transform: uppercase is neither var(--primitive) nor an allowed literal`.
That failure is the gate working: a non-primitive default has to be argued for
before it ships.

- [ ] **Step 3: Make the argument, in the allow-list**

Add `uppercase` to `allowedLiterals` in
`packages/ui-remix/src/tokens.test.ts`, extending the comment above it:

```ts
/**
 * Values a default may be even though they are not a var(). Every entry has to
 * be argued for in review; the list existing is what keeps "just this once"
 * from becoming the norm.
 *
 * - `transparent` keeps a ghost control the same size as a filled one, so a
 *   toolbar does not reflow when a tone changes.
 * - `1px` is a border width, and the schema has no border-width primitive.
 *   Named here rather than written into button.tsx, so a skin can change it.
 * - `uppercase` is Eyebrow's whole look. `display: inline-flex` in Button is
 *   structural — change it and the component stops working — but caps are
 *   taste, and a brand that sets things in sentence case has to be able to say
 *   `--ui-eyebrow-transform: none` rather than fork the component.
 */
const allowedLiterals = new Set(["transparent", "1px", "uppercase"])
```

```bash
bun test packages/ui-remix/src/tokens.test.ts
```

Expected: PASS.

- [ ] **Step 4: Write the failing component test**

Create `packages/ui-remix/src/eyebrow/eyebrow.test.tsx`:

```tsx
import { describe, expect, it } from "bun:test"
import { css } from "remix/ui"
import { renderToHtml } from "../../../../test/render.ts"
import { sharedProperties, styleBlocksOf, stylesOf, valuesOf } from "../../../../test/styles.ts"
import { EyebrowDemo } from "./eyebrow.demo.tsx"
import { Eyebrow } from "./eyebrow.tsx"
import { eyebrowTokens } from "./tokens.ts"

describe("Eyebrow", () => {
  it("renders a p carrying its children", async () => {
    const html = await renderToHtml(<Eyebrow>Case study</Eyebrow>)
    expect(html).toContain("<p")
    expect(html).toContain("Case study")
  })

  it("reads only its own tokens", async () => {
    const styles = stylesOf(await renderToHtml(<Eyebrow>Case study</Eyebrow>))
    const offenders = valuesOf(styles).filter(
      (value) => !/^var\(--ui-eyebrow-[\w-]+\)$/.test(value),
    )
    expect(offenders).toEqual([])
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    // A token nothing reads is dead weight a skin will set and watch do
    // nothing; a read with no token is a var() that resolves to nothing.
    const styles = stylesOf(await renderToHtml(<Eyebrow>Case study</Eyebrow>))
    const read = new Set(
      [...styles.matchAll(/var\(--(ui-eyebrow-[\w-]+)\)/g)].map((match) => match[1] ?? ""),
    )
    expect([...read].sort()).toEqual(Object.keys(eyebrowTokens).sort())
  })

  it("puts the case change on a token, so a brand can turn it off", async () => {
    expect(stylesOf(await renderToHtml(<Eyebrow>Case study</Eyebrow>))).toContain(
      "text-transform: var(--ui-eyebrow-transform)",
    )
  })

  it("keeps its own css() blocks property-disjoint", async () => {
    const blocks = styleBlocksOf(await renderToHtml(<Eyebrow>Case study</Eyebrow>))
    expect(sharedProperties(blocks)).toEqual([])
  })

  it("adds through mix a property it does not declare itself", async () => {
    const spaced = css({ marginBlockEnd: "var(--sp-2)" })
    const blocks = styleBlocksOf(await renderToHtml(<Eyebrow mix={spaced}>Case study</Eyebrow>))
    expect(blocks.filter((block) => block.includes("margin-block-end:"))).toHaveLength(1)
  })
})

describe("EyebrowDemo", () => {
  it("renders the eyebrow in the position it is for", async () => {
    const html = await renderToHtml(<EyebrowDemo />)
    expect(html).toContain("Case study")
    expect(html).toContain("<h2")
  })
})
```

- [ ] **Step 5: Run it to see it fail**

```bash
bun test packages/ui-remix/src/eyebrow/eyebrow.test.tsx
```

Expected: FAIL — cannot resolve `./eyebrow.tsx`.

- [ ] **Step 6: Write the component**

Create `packages/ui-remix/src/eyebrow/eyebrow.tsx`:

```tsx
import { css, type Handle, type MixInput, type RemixNode } from "remix/ui"

/**
 * The kicker above a heading: small, uppercase, widely tracked.
 *
 * One block, because Eyebrow has no axes — every instance looks the same, and
 * what varies between brands varies through the tokens rather than through a
 * prop. text-transform reads a token for that reason: caps are taste, not
 * structure, and a skin has to be able to say `none`.
 */
const eyebrowBase = css({
  fontSize: "var(--ui-eyebrow-size)",
  fontWeight: "var(--ui-eyebrow-weight)",
  letterSpacing: "var(--ui-eyebrow-tracking)",
  textTransform: "var(--ui-eyebrow-transform)",
  color: "var(--ui-eyebrow-ink)",
})

export interface EyebrowProps {
  /**
   * Adds properties Eyebrow does not declare — spacing below it, for instance,
   * though a `Stack` around the pair is the better answer. It does not reliably
   * override one Eyebrow declares; those go through the tokens.
   */
  mix?: MixInput<HTMLParagraphElement> | undefined
  children?: RemixNode | undefined
}

export function Eyebrow(handle: Handle<EyebrowProps>) {
  return () => {
    const { mix, children } = handle.props
    return <p mix={[eyebrowBase, mix]}>{children}</p>
  }
}
```

- [ ] **Step 7: Write the demo**

Create `packages/ui-remix/src/eyebrow/eyebrow.demo.tsx`:

```tsx
import { css } from "remix/ui"
import { Heading } from "../heading/heading.tsx"
import { Text } from "../text/text.tsx"
import { Eyebrow } from "./eyebrow.tsx"

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
  gap: "var(--sp-2)",
  marginBlockEnd: "var(--sp-6)",
})

export function EyebrowDemo() {
  return () => (
    <>
      <p mix={label}>eyebrow: the kicker above a heading, in the position it is for</p>
      <div mix={group}>
        <Eyebrow>Case study</Eyebrow>
        <Heading level={2}>A heading the eyebrow introduces</Heading>
        <Text tone="muted">
          The eyebrow is smaller and more widely tracked than anything else on the page, which is
          what <code>--tr-wider</code> is in the schema for.
        </Text>
      </div>
    </>
  )
}
```

- [ ] **Step 8: Run the test to see it pass**

```bash
bun test packages/ui-remix/src/eyebrow/eyebrow.test.tsx
```

Expected: PASS, seven tests.

- [ ] **Step 9: Wire the exports and the catalogue**

In `packages/ui-remix/src/index.ts`:

```ts
export { Eyebrow, type EyebrowProps } from "./eyebrow/eyebrow.tsx"
```

In `packages/ui-remix/src/demos.ts`, the import plus:

```ts
  eyebrow: { title: "Eyebrow", Demo: EyebrowDemo },
```

- [ ] **Step 10: Run the gate**

```bash
bun run fix && bun run check
```

Expected: green.

- [ ] **Step 11: Commit**

```bash
git add packages/ui-remix/src
git commit -m "$(cat <<'EOF'
Add Eyebrow, and put its case change on a token

uppercase is the third entry in the allow-list of non-primitive defaults, and
the argument is that it is taste rather than structure: display: inline-flex in
Button stops the component working if you change it, while a brand that sets
things in sentence case only needs --ui-eyebrow-transform: none. A skin is a
set of token values, never a forked component.

tr-wider is in schema.type because of this component, so this is the consumer
that makes the primitive checkable.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Documents, and both densities

**Files:**
- Modify: `packages/ui-remix/README.md` (Catalogue, Structure, Status)
- Modify: `packages/ui-design/README.md` (exports, element defaults)
- Modify: `docs/design-system.md` (the non-primitive-default sentence)
- Modify: `todo/TODO.md`
- Move: `todo/m1-foundation-and-contract-proof/14-…md` →
  `todo/done/m1-foundation-and-contract-proof/`

**Interfaces:**
- Consumes: everything Tasks 1–4 produced. Produces no code.

- [ ] **Step 1: Check the demos at both densities**

```bash
bun run playground
```

Visit each, and confirm the type is identical between the two — that is the
claim, not that it changes:

```
http://localhost:4000/c/heading
http://localhost:4000/c/heading?density=compact
http://localhost:4000/c/text?density=compact
http://localhost:4000/c/eyebrow?density=compact
http://localhost:4000/c/heading?scheme=dark
```

The port is `4000` unless `PORT` is set; the playground prints its own URL on
startup. Stop the server when done.

- [ ] **Step 2: Add the catalogue entries to `packages/ui-remix/README.md`**

After the `### Stack / Row / Grid / Container` section, in the established
shape — a sentence on what it is, then a table of axes and where each comes
from:

```markdown
### `Heading` / `Text` / `Eyebrow`

The type scale as a contract. `Heading` separates the document outline from the
appearance: `level` picks the element, `size` picks the step and defaults to
`level`, so an `h3` that has to look like an `h5` needs no escape hatch.

| Axis | Values | Comes from |
| --- | --- | --- |
| `Heading` `level` | `1` to `6`, required | The element rendered |
| `Heading` `size` | `1` to `6`, defaults to `level` | `--ui-heading-<n>-size` |
| `Text` `size` | `sm`, `md`, `lg` | `--ui-text-size-<size>` |
| `Text` `tone` | `default`, `muted`, `subtle` | `--ui-text-ink*` |
| `Text` `as` | `p`, `span`, `div` | The element rendered |
| `Eyebrow` | no axes | `--ui-eyebrow-*`, all five |

The six heading sizes default from `headingScale` in `@lemol/ui-design`, which
is also where the reset gets the sizes it gives a bare `h1`–`h6`. One map, so a
heading nobody wrapped in the component and one that went through it cannot
drift apart.

`Text` declares no `font-weight`, so `mix={css({ fontWeight: "var(--fw-semibold)" })}`
is reliable. `Heading` and `Eyebrow` declare `color`, so their ink goes through
their tokens.
```

- [ ] **Step 3: Update that README's Structure and Status sections**

In Structure, extend the tree illustration:

```
src/button/button.tsx  tokens.ts  button.demo.tsx  button.test.tsx
src/stack/stack.tsx               stack.demo.tsx   stack.test.tsx
src/heading/heading.tsx tokens.ts heading.demo.tsx heading.test.tsx
```

Replace the Status section with:

```markdown
## Status

`Button`, `LinkButton`, `Stack`, `Row`, `Grid`, `Container`, `Heading`, `Text`,
`Eyebrow` and `ThemeStyle` ship. `src/tokens.ts` aggregates the component
records and exports `ComponentTokenName`; the four layout components add nothing
to it, which is what they exist to demonstrate, and the three typographic ones
add twenty-two between them. `src/demos.ts` registers eight demos. `runtime.ts`
and `compat.ts` are still stubs — nothing here needs client JavaScript yet.
```

Count the tokens before writing that sentence:

```bash
bun -e 'import {componentTokens} from "./packages/ui-remix/src/tokens.ts"; console.log(Object.keys(componentTokens).filter(n=>!n.startsWith("ui-btn")).length)'
```

Expected: `22`. If it prints something else, correct the sentence to match.

- [ ] **Step 4: Update `packages/ui-design/README.md`**

Add `headingScale` and `HeadingLevel` wherever that README enumerates the root
export's names, and note in its description of the reset that `h1`–`h6` now take
their size from the scale. Read the file first and follow its existing shape —
do not impose a new one.

- [ ] **Step 5: Correct `docs/design-system.md`**

In the "Two tiers" section, the paragraph beginning "A default that cannot name
a primitive is an exception, not a pattern" says `--ui-btn-border-width` is "the
only one at present". That was already inaccurate — `transparent` backs the
ghost tone — and `uppercase` makes three. Replace the paragraph with:

```markdown
A default that cannot name a primitive is an exception, not a pattern, and the
allow-list in `ui-remix/src/tokens.test.ts` holds every one: `1px` for
`--ui-btn-border-width`, because `hairline` is a colour and there is no
border-width primitive; `transparent` for the ghost tone, which keeps a ghost
button the same size as a filled one; and `uppercase` for
`--ui-eyebrow-transform`, because caps are taste rather than structure and a
brand that sets things in sentence case must be able to say `none` instead of
forking the component. Adding a fourth means editing that list and arguing for
it.
```

- [ ] **Step 6: Tick the task off**

```bash
git mv todo/m1-foundation-and-contract-proof/14-typography-heading-text-eyebrow-and-the-type-scale.md \
  todo/done/m1-foundation-and-contract-proof/
```

Then delete the task 14 line from the M1 list in `todo/TODO.md`.

- [ ] **Step 7: Run the gate one last time**

```bash
bun run check
```

Expected: green — lint, typecheck, and the whole suite including
`test/boundaries.test.ts` and `test/packages.test.ts`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Record what the typographic components changed

The design-system sentence about non-primitive defaults named one and there
were already two; it now names all three and says what each is for.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 9: Merge**

```bash
git checkout main
git merge --no-ff task-14-typography
```

Write the merge message in the shape task 13's used: what shipped, the rule
that fell out of it, and what was deliberately not done.

---

## Self-review

**Spec coverage.** Every section of the spec maps to a task: the two tiers and
`headingScale` → Task 1; `Heading`, its blocks, tokens and the tag question →
Task 2; `Text`, `as` and the absent `weight` → Task 3; `Eyebrow` and the
allow-list → Task 4; density, the playground and the documents → Task 5. The
spec's "Tests" section is distributed across Tasks 1–4, each test named there
appearing in the task that creates the file it belongs in.

**Findings to record.** If any of these components turns out to need something
the schema does not hold, append it as a comment on the task file in
`todo/done/`, in the shape task 13 used for the `Grid` track-minimum finding —
a finding recorded, not a quiet addition.
