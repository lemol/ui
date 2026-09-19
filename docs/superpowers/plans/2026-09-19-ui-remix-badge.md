# Badge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `Badge`, a five-tone status pill whose tokens default to the schema's semantic primitives, and make the contrast promise those primitives rely on explicit and tested.

**Architecture:** Three tasks. Task A closes the accessibility hole in `mini`'s theme first, so the values `Badge` will read are already sound when it arrives. Task B builds the component, its tokens, its tests and its demo. Task C registers it and corrects the documents. Task A is independent of the other two and is deliberately first: the component should never render against a pair known to fail.

**Tech Stack:** TypeScript, `remix/ui` (`css()`, `Handle`, `MixInput`), `bun:test`, Biome.

## Global Constraints

Copied from the spec and from `CLAUDE.md`. Every task's requirements include these.

- **No hard-coded colour, radius, duration or space step in a component.** Every declaration reads a `--ui-badge-*` token or a structural keyword.
- **A component token default must be `var(--primitive)` or an allowed literal.** `allowedLiterals` in `src/remix/tokens.test.ts` is `transparent`, `1px`, `uppercase`. `Badge` adds none.
- **No `color-mix()` in a token default.** `src/remix/tokens.test.ts` enforces it.
- **No build step, no new dependency.** `remix` is the only peer.
- **SPA-safe.** Nothing under `src/` imports `node:*`, `bun`, `effect`, or a server-side `remix/*` entry. `test/` is exempt; `src/` is not.
- **Cross-layer imports inside `src/` are relative and go through the layer's entry point** — `../design/index.ts`, `../remix/index.ts` — never at an arbitrary file inside another layer.
- **A nested selector in a `css()` block must lead with `&`.**
- **The gate for every change is `bun run check`** (lint + typecheck + test).
- **Commit messages** end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## File Structure

| File | Responsibility | Task |
| --- | --- | --- |
| `src/mini/theme.ts` | Modify: three retuned colour values | A |
| `src/mini/theme.test.ts` | Modify: the contrast assertion over both pairs, both axes | A |
| `docs/design-system.md` | Modify: the second contrast promise | A |
| `src/remix/badge/tokens.ts` | Create: the 23-token contract | B |
| `src/remix/badge/badge.tsx` | Create: `Badge`, `BadgeTone`, `BadgeProps` | B |
| `src/remix/badge/badge.test.tsx` | Create: the component's suite | B |
| `src/remix/badge/badge.demo.tsx` | Create: `BadgeDemo` | B |
| `src/remix/tokens.ts` | Modify: aggregate `badgeTokens` | C |
| `src/remix/index.ts` | Modify: export `Badge` and its types | C |
| `src/remix/demos.ts` | Modify: register `BadgeDemo` | C |
| `src/remix/README.md` | Modify: catalogue entry and token counts | C |
| `todo/TODO.md`, `todo/m1-foundation-and-contract-proof/` | Modify: close task 16 | C |

---

### Task A: The second contrast promise

`Badge` fills with `<tone>-subtle` and inks with `<tone>`. The schema promises `<tone>-ink` is readable on `<tone>` and says nothing about the pair `Badge` actually uses. Three of `mini`'s values fail that unnamed pair, and light `warning` fails the named one too. Name the promise, test both, fix the values.

**Files:**
- Modify: `src/mini/theme.ts`
- Modify: `src/mini/theme.test.ts`
- Modify: `docs/design-system.md`

**Interfaces:**
- Consumes: `miniTheme` from `src/mini/theme.ts`, already exported. `miniTheme.base` is a full `PrimitiveTokens`; `miniTheme.dark` is a `Partial<PrimitiveTokens>` that overrides a subset.
- Produces: nothing importable. The contrast helper is local to the test file — nothing at runtime may compute a colour, and an exported helper would invite exactly that.

- [ ] **Step 1: Write the failing test**

Append to `src/mini/theme.test.ts`, after the existing `describe("miniTheme", …)` block and before `describe("a skin is a set of token values", …)`:

```ts
/**
 * sRGB relative luminance, per WCAG 2.1. Local to this file on purpose: the
 * schema forbids a component deriving one colour from another, and an
 * exported contrast helper is an invitation to do it at render time.
 */
const luminance = (hex: string): number => {
  const int = Number.parseInt(hex.slice(1), 16)
  const channels = [(int >> 16) & 255, (int >> 8) & 255, int & 255].map((value) => {
    const srgb = value / 255
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0)
}

const contrast = (a: string, b: string): number => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((high ?? 0) + 0.05) / ((low ?? 0) + 0.05)
}

/** Every tone that names a full set of arms: a fill, an ink, and a subtle. */
const tonesWithSubtle = ["accent", "success", "warning", "danger", "info"] as const

/**
 * AA for normal text. Badge sets fs-xs, so the 3:1 large-text threshold is
 * not available to it, and nothing else reading these pairs is large either.
 */
const aaNormal = 4.5

describe("miniTheme colour contrast", () => {
  const axes = [
    { name: "base", values: miniTheme.base },
    { name: "dark", values: { ...miniTheme.base, ...miniTheme.dark } },
  ] as const

  it("keeps <tone>-ink readable on <tone>", () => {
    // The promise docs/design-system.md has always made. warning has never
    // had a consumer, so this pair has never been looked at.
    const failures = axes.flatMap(({ name, values }) =>
      tonesWithSubtle.flatMap((tone) => {
        const ratio = contrast(values[`${tone}-ink`], values[tone])
        return ratio >= aaNormal ? [] : [`${name}/${tone}: ink on fill is ${ratio.toFixed(2)}`]
      }),
    )
    expect(failures).toEqual([])
  })

  it("keeps <tone> readable on <tone>-subtle", () => {
    // The second promise, named in docs/design-system.md alongside the first
    // because a subtle-filled Badge reads this pair and nothing else.
    const failures = axes.flatMap(({ name, values }) =>
      tonesWithSubtle.flatMap((tone) => {
        const ratio = contrast(values[tone], values[`${tone}-subtle`])
        return ratio >= aaNormal ? [] : [`${name}/${tone}: fill on subtle is ${ratio.toFixed(2)}`]
      }),
    )
    expect(failures).toEqual([])
  })
})
```

- [ ] **Step 2: Run it and confirm both directions of the failure**

Run: `bun test src/mini/theme.test.ts`

Expected: FAIL, with two failing assertions naming exactly four entries:
- ink on fill: `base/warning: ink on fill is 4.21`
- fill on subtle: `base/success: fill on subtle is 4.42`, `base/warning: fill on subtle is 3.76`, `dark/accent: fill on subtle is 4.20`

If a fifth entry appears, stop and report it rather than chasing it — the value set moved since the spec was measured.

- [ ] **Step 3: Retune the three values**

In `src/mini/theme.ts`, in `basePrimitives`:

```ts
  success: "#2A7146",
```

```ts
  warning: "#8A5A09",
```

In `darkPrimitives`:

```ts
  "accent-subtle": "#12201C",
```

Then add, immediately above the `success:` line in `basePrimitives`:

```ts
  // Every tone here satisfies two pairs, both asserted in theme.test.ts:
  // <tone>-ink on <tone>, and <tone> on <tone>-subtle. The second is what a
  // subtle-filled Badge reads. success and warning are darker than a first
  // pass would pick because of it, and that is the check doing its job.
```

- [ ] **Step 4: Run it and verify it passes**

Run: `bun test src/mini/theme.test.ts`

Expected: PASS, all tests in the file.

- [ ] **Step 5: Name the promise in the document**

In `docs/design-system.md`, find the paragraph beginning **"A component token default must not contain `color-mix()`."** Immediately after that paragraph, insert:

```markdown
**A theme owes two contrast pairs per tone, not one.** `<tone>-ink` must be
readable on `<tone>`, which is the pair a solid fill uses. `<tone>` must also
be readable on `<tone>-subtle`, which is the pair a subtle fill uses — a
`Badge`, a callout, an inline status. Both are AA for normal text, 4.5:1, and
both are asserted over `mini`'s values in `src/mini/theme.test.ts`, in the
base axis and the dark one. A theme cannot satisfy the second by computing it:
that is the same `color-mix()` this section already rules out, one tier up.
```

- [ ] **Step 6: Run the gate**

Run: `bun run check`

Expected: PASS. Lint, typecheck and the whole suite.

- [ ] **Step 7: Commit**

```bash
git add src/mini/theme.ts src/mini/theme.test.ts docs/design-system.md
git commit -m "$(cat <<'EOF'
Name and test the second contrast promise (M1 task 16)

The schema promises <tone>-ink is readable on <tone>. A subtle-filled
Badge reads <tone> on <tone>-subtle, which nothing has ever promised or
checked — and mini fails it for light success (4.42), light warning
(3.76) and dark accent (4.20). Light warning fails the promised pair
too, at 4.21, because warning has never had a consumer to expose it.

Both pairs are now asserted over both axes, and the three values are
retuned with headroom. Nothing reads success, warning or accent-subtle
yet, so no component moves.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task B: Badge, its contract, its tests and its demo

**Files:**
- Create: `src/remix/badge/tokens.ts`
- Create: `src/remix/badge/badge.tsx`
- Create: `src/remix/badge/badge.test.tsx`
- Create: `src/remix/badge/badge.demo.tsx`

**Interfaces:**
- Consumes: `css`, `type CSSMixinDescriptor`, `type Handle`, `type MixInput`, `type RemixNode` from `remix/ui`. `renderToHtml` from `../../../test/render.ts`. `stylesOf`, `styleBlocksOf`, `sharedProperties`, `valuesOf` from `../../../test/styles.ts`. `Row` from `../row/row.tsx` and `Text` from `../text/text.tsx` for the demo.
- Produces, for Task C:
  - `badgeTokens: { readonly [name: string]: string }` from `./badge/tokens.ts`
  - `Badge(handle: Handle<BadgeProps>): () => RemixNode` from `./badge/badge.tsx`
  - `type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info"`
  - `interface BadgeProps { tone?: BadgeTone | undefined; mix?: MixInput<HTMLSpanElement> | undefined; children?: RemixNode | undefined }`
  - `BadgeDemo(): () => RemixNode` from `./badge/badge.demo.tsx`

- [ ] **Step 1: Write the token contract**

Create `src/remix/badge/tokens.ts`:

```ts
/**
 * Badge's contract. The component reads these and nothing else, so a skin is
 * a set of values here and never a forked component.
 *
 * Every tone is a subtle fill, a tone-coloured edge, and the tone itself as
 * ink. That pair — `<tone>` on `<tone>-subtle` — is the second contrast
 * promise named in docs/design-system.md, and mini's theme test asserts it.
 * The solid alternative reads the older pair, `<tone>-ink` on `<tone>`, and
 * was rejected on looks: four saturated blocks inline in a paragraph are loud
 * in a way a status marker should not be.
 *
 * `neutral` is not a semantic and is the default anyway, because the most
 * common badge there is says "Draft" or "v2.1". Without it the first caller
 * hand-styles a span or picks `info` for something that is not information.
 *
 * `leading` exists because a badge inline in a paragraph inherits lh-base and
 * comes out tall and loose. How tight the pill sits is a brand's decision, so
 * it is a token rather than a literal.
 *
 * `gap` is inert for a text-only badge, exactly as `ui-btn-gap` is for a
 * text-only button. It is declared so an icon beside the text has somewhere
 * to put its spacing other than `mix`.
 *
 * `border-width` is the one default that is not a primitive; the schema has
 * no border-width primitive and `allowedLiterals` in ../tokens.test.ts
 * already holds `1px` for Button's and Field's.
 *
 * No transition and no hover: design-system.md rules that status colours get
 * no `-hover` arm, so there is no second state to animate to. No size axis:
 * Button has one because schema.sizing names control-h and control-h-sm, and
 * Badge is not a control.
 */
export const badgeTokens = {
  "ui-badge-radius": "var(--r-pill)",
  "ui-badge-pad-x": "var(--sp-2)",
  "ui-badge-pad-y": "var(--sp-1)",
  "ui-badge-gap": "var(--sp-1)",
  "ui-badge-font-size": "var(--fs-xs)",
  "ui-badge-font-weight": "var(--fw-medium)",
  "ui-badge-leading": "var(--lh-tight)",
  "ui-badge-border-width": "1px",

  // Neutral is the one tone with no semantic arms to name, so it reads the
  // surface vocabulary instead. `hairline` rather than `hairline-strong`: a
  // status-neutral badge should recede, not outline itself against the page.
  "ui-badge-neutral-bg": "var(--surface)",
  "ui-badge-neutral-ink": "var(--ink-muted)",
  "ui-badge-neutral-border": "var(--hairline)",

  "ui-badge-success-bg": "var(--success-subtle)",
  "ui-badge-success-ink": "var(--success)",
  "ui-badge-success-border": "var(--success-border)",

  "ui-badge-warning-bg": "var(--warning-subtle)",
  "ui-badge-warning-ink": "var(--warning)",
  "ui-badge-warning-border": "var(--warning-border)",

  "ui-badge-danger-bg": "var(--danger-subtle)",
  "ui-badge-danger-ink": "var(--danger)",
  "ui-badge-danger-border": "var(--danger-border)",

  "ui-badge-info-bg": "var(--info-subtle)",
  "ui-badge-info-ink": "var(--info)",
  "ui-badge-info-border": "var(--info-border)",
} as const
```

- [ ] **Step 2: Write the failing test**

Create `src/remix/badge/badge.test.tsx`:

```tsx
import { describe, expect, it } from "bun:test"
import { css } from "remix/ui"
import { renderToHtml } from "../../../test/render.ts"
import {
  markupOf,
  sharedProperties,
  styleBlocksOf,
  stylesOf,
  valuesOf,
} from "../../../test/styles.ts"
import { BadgeDemo } from "./badge.demo.tsx"
import { Badge, type BadgeTone } from "./badge.tsx"
import { badgeTokens } from "./tokens.ts"

const tones: BadgeTone[] = ["neutral", "success", "warning", "danger", "info"]

describe("Badge", () => {
  it("renders a span carrying its children", async () => {
    const html = await renderToHtml(<Badge>Draft</Badge>)
    expect(html).toContain("<span")
    expect(html).toContain("Draft")
  })

  it("reads only its own tokens", async () => {
    // The whole point of the component: if a semantic primitive did not carry
    // enough meaning, this is where a color-mix() or a literal would appear.
    const styles = stylesOf(await renderToHtml(<Badge tone="success">Live</Badge>))
    const offenders = valuesOf(styles).filter(
      (value) => !/^var\(--ui-badge-[\w-]+\)$/.test(value),
    )
    expect(offenders).toEqual([])
  })

  it("reads every token it declares, and declares every one it reads", async () => {
    // A token nothing reads is dead weight a skin will set and watch do
    // nothing; a read with no token is a var() that resolves to nothing.
    // Every tone has to render for the tone tokens to be reachable.
    const html = await renderToHtml(
      <>
        {tones.map((tone) => (
          <Badge key={tone} tone={tone}>
            {tone}
          </Badge>
        ))}
      </>,
    )
    const read = new Set(
      [...stylesOf(html).matchAll(/var\(--(ui-badge-[\w-]+)\)/g)].map((match) => match[1] ?? ""),
    )
    expect([...read].sort()).toEqual(Object.keys(badgeTokens).sort())
  })

  it("gives every tone its own three tokens and nothing borrowed", async () => {
    for (const tone of tones) {
      const styles = stylesOf(await renderToHtml(<Badge tone={tone}>{tone}</Badge>))
      expect(styles).toContain(`background: var(--ui-badge-${tone}-bg)`)
      expect(styles).toContain(`border-color: var(--ui-badge-${tone}-border)`)
      expect(styles).toContain(`color: var(--ui-badge-${tone}-ink)`)
      const borrowed = tones
        .filter((other) => other !== tone)
        .filter((other) => styles.includes(`--ui-badge-${other}-`))
      expect(borrowed).toEqual([])
    }
  })

  it("defaults to neutral, so a badge with no status has one to use", async () => {
    const styles = stylesOf(await renderToHtml(<Badge>v2.1</Badge>))
    expect(styles).toContain("background: var(--ui-badge-neutral-bg)")
  })

  it("renders two blocks, disjoint by property", async () => {
    // base and tone. Sub-layer order is neither source order nor stable
    // across a client session, so two blocks that could both set `background`
    // would be correct only under the order observed today.
    const blocks = styleBlocksOf(await renderToHtml(<Badge tone="info">Beta</Badge>))
    expect(blocks).toHaveLength(2)
    expect(sharedProperties(blocks)).toEqual([])
  })

  it("adds through mix a property it does not declare itself", async () => {
    const placed = css({ marginInlineStart: "var(--sp-2)" })
    const blocks = styleBlocksOf(await renderToHtml(<Badge mix={placed}>Draft</Badge>))
    expect(
      blocks.filter((block) => block.includes("margin-inline-start: var(--sp-2)")),
    ).toHaveLength(1)
    expect(blocks.filter((block) => block.includes("margin-inline-start:"))).toHaveLength(1)
  })
})

describe("BadgeDemo", () => {
  it("shows every tone and a badge inline in a sentence", async () => {
    // markupOf, not the raw html: every tone name appears in the style blocks
    // as part of a --ui-badge-<tone>-* custom property, so a raw toContain
    // would pass without a single badge having rendered.
    const markup = markupOf(await renderToHtml(<BadgeDemo />))
    for (const tone of tones) expect(markup).toContain(tone)
    expect(markup).toContain("mid-sentence")
  })
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `bun test src/remix/badge/badge.test.tsx`

Expected: FAIL — the module `./badge.tsx` does not resolve.

- [ ] **Step 4: Write the component**

Create `src/remix/badge/badge.tsx`:

```tsx
import { type CSSMixinDescriptor, css, type Handle, type MixInput, type RemixNode } from "remix/ui"

/**
 * Four semantic tones and a neutral. The semantic four are the reason this
 * component is in the M1 slice — they are the test of whether the schema's
 * semantic primitives carry enough meaning for a component to default against
 * without mixing its own colours. Neutral is not a semantic and is here
 * because a status-neutral badge is the most common badge there is.
 *
 * No accent tone. `accent-subtle` and `accent-border` want a first consumer,
 * but theirs is a selected nav item or a callout, not a badge.
 */
export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info"

/**
 * Every declaration reads a --ui-badge-* token or a structural keyword.
 *
 * `inline-flex` lays the contents out internally while the element stays
 * inline externally, so a badge sits inside a sentence or a table cell
 * without breaking the line. `line-height` is a token because a badge
 * inheriting lh-base from a paragraph comes out tall and loose.
 *
 * No outline. The reset's :where(:focus-visible) rule owns the focus ring,
 * and nothing here competes with it — though a badge is not focusable anyway.
 */
const badgeBase = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--ui-badge-gap)",
  borderStyle: "solid",
  borderWidth: "var(--ui-badge-border-width)",
  borderRadius: "var(--ui-badge-radius)",
  paddingInline: "var(--ui-badge-pad-x)",
  paddingBlock: "var(--ui-badge-pad-y)",
  fontFamily: "inherit",
  fontSize: "var(--ui-badge-font-size)",
  fontWeight: "var(--ui-badge-font-weight)",
  lineHeight: "var(--ui-badge-leading)",
  whiteSpace: "nowrap",
})

/**
 * `background` and not `background-color`, for the reason Button gives: a
 * skin may set --ui-badge-<tone>-bg to a gradient, and background-color drops
 * a gradient as invalid.
 *
 * No `:hover` and no transition. Status colours have no `-hover` arm in the
 * schema, so there is nothing to move to.
 */
const toneStyle = (tone: BadgeTone): CSSMixinDescriptor =>
  css({
    background: `var(--ui-badge-${tone}-bg)`,
    borderColor: `var(--ui-badge-${tone}-border)`,
    color: `var(--ui-badge-${tone}-ink)`,
  })

const toneStyles: Record<BadgeTone, CSSMixinDescriptor> = {
  neutral: toneStyle("neutral"),
  success: toneStyle("success"),
  warning: toneStyle("warning"),
  danger: toneStyle("danger"),
  info: toneStyle("info"),
}

export interface BadgeProps {
  tone?: BadgeTone | undefined
  /**
   * Adds properties Badge does not declare — a margin, a grid placement owned
   * by the layout around it. It does not reliably override one Badge declares:
   * remix/ui gives every css() block its own cascade sub-layer, and sub-layer
   * order follows first render rather than the order of this array. To change
   * something Badge sets, set its `--ui-badge-*` token.
   */
  mix?: MixInput<HTMLSpanElement> | undefined
  children?: RemixNode | undefined
}

export function Badge(handle: Handle<BadgeProps>) {
  return () => {
    const { tone = "neutral", mix, children } = handle.props
    return (
      <span mix={[badgeBase, toneStyles[tone], mix]}>{children}</span>
    )
  }
}
```

- [ ] **Step 5: Write the demo**

Create `src/remix/badge/badge.demo.tsx`:

```tsx
import { css } from "remix/ui"
import { Row } from "../row/row.tsx"
import { Text } from "../text/text.tsx"
import { Badge, type BadgeTone } from "./badge.tsx"

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
  gap: "var(--sp-4)",
  marginBlockEnd: "var(--sp-6)",
})

const tones: BadgeTone[] = ["neutral", "success", "warning", "danger", "info"]

export function BadgeDemo() {
  return () => (
    <>
      <p mix={label}>badge: five tones, and one inline where the metrics have to hold</p>
      <div mix={group}>
        <Row gap={2}>
          {tones.map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
        </Row>
        <Text>
          A badge sits <Badge tone="info">mid-sentence</Badge> without pushing the line apart,
          which is what <code>inline-flex</code> and a tokenised line-height are for.
        </Text>
      </div>
    </>
  )
}
```

- [ ] **Step 6: Run the tests and verify they pass**

Run: `bun test src/remix/badge/badge.test.tsx`

Expected: PASS, all eight tests.

If "renders two blocks" fails with a count above 2, the extra blocks belong to `Row` or `Text` in the demo test rather than to `Badge` — check the failing test name before changing the component. The two-block assertion renders a bare `<Badge>` and nothing else, so it cannot pick up a neighbour's blocks.

If `Row`'s prop is not `gap={2}`, read `src/remix/row/row.tsx` for the real signature and use it. The demo is the only place this matters.

- [ ] **Step 7: Run the gate**

Run: `bun run check`

Expected: PASS. `src/remix/tokens.test.ts` does not yet see `badgeTokens` — Task C wires it up — so its assertions pass trivially here.

- [ ] **Step 8: Commit**

```bash
git add src/remix/badge
git commit -m "$(cat <<'EOF'
Add Badge, the semantic token set (M1 task 16)

Five tones — the four semantics plus a neutral — each a <tone>-subtle
fill, a <tone>-border edge and <tone> as ink. Twenty-three tokens, no
derivation, no literal beyond the 1px border width Button and Field
already established.

No hover and no transition, because the schema gives status colours no
-hover arm. No size axis, because schema.sizing names two control
heights and a badge is not a control.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task C: Register it and correct the documents

Until this task, `Badge` is unreachable from `@lemol/ui/remix` and its tokens are absent from the emitted stylesheet — so every default resolves to nothing in a real page.

**Files:**
- Modify: `src/remix/tokens.ts`
- Modify: `src/remix/index.ts`
- Modify: `src/remix/demos.ts`
- Modify: `src/remix/README.md`
- Modify: `todo/TODO.md`
- Move: `todo/m1-foundation-and-contract-proof/16-badge-the-semantic-token-set.md` → `todo/done/`

**Interfaces:**
- Consumes: `badgeTokens`, `Badge`, `BadgeProps`, `BadgeTone`, `BadgeDemo` from Task B.
- Produces: `Badge` and its types on the `@lemol/ui/remix` entry point; `badge` as a `DemoName`.

- [ ] **Step 1: Write the failing test**

Append to `src/remix/tokens.test.ts`, inside the existing `describe("the component token aggregate", …)` block:

```ts
  it("holds every component's tokens, Badge included", () => {
    // The aggregate is what emitTokensCss writes ahead of a theme's values.
    // A component missing from it ships a contract whose every default
    // resolves to nothing, and no component test can see that.
    const prefixes = new Set(
      entries.map(([name]) => name.split("-").slice(0, 2).join("-")),
    )
    expect([...prefixes].sort()).toEqual([
      "ui-badge",
      "ui-btn",
      "ui-eyebrow",
      "ui-field",
      "ui-heading",
      "ui-text",
    ])
  })
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/remix/tokens.test.ts`

Expected: FAIL — the received array lacks `"ui-badge"`.

If the expected array differs in any entry other than `ui-badge`, a component was added or renamed since this plan was written. Correct the expected list to match reality rather than the plan.

- [ ] **Step 3: Aggregate the tokens**

In `src/remix/tokens.ts`, add the import in alphabetical position — before `buttonTokens`:

```ts
import { badgeTokens } from "./badge/tokens.ts"
```

and the spread as the first entry of `componentTokens`:

```ts
export const componentTokens = {
  ...badgeTokens,
  ...buttonTokens,
```

- [ ] **Step 4: Run it to verify it passes**

Run: `bun test src/remix/tokens.test.ts`

Expected: PASS.

- [ ] **Step 5: Export the component**

In `src/remix/index.ts`, insert above the `Button` export block, keeping alphabetical order:

```ts
export { Badge, type BadgeProps, type BadgeTone } from "./badge/badge.tsx"
```

- [ ] **Step 6: Register the demo**

In `src/remix/demos.ts`, add the import above `ButtonDemo`:

```ts
import { BadgeDemo } from "./badge/badge.demo.tsx"
```

and the entry as the first key of `demos`:

```ts
export const demos = {
  badge: { title: "Badge", Demo: BadgeDemo },
  button: { title: "Button", Demo: ButtonDemo },
```

- [ ] **Step 7: Run the whole suite**

Run: `bun run check`

Expected: PASS. `test/boundaries.test.ts` sees the new files and must stay green; `src/mini/theme.test.ts` now typechecks `badgeTokens`' names through `ComponentTokenName`.

- [ ] **Step 8: Update the layer README**

In `src/remix/README.md`:

- Add a `### Badge` section after the `### Field` section. Keep it to the shape the other entries use — what it is, its axis, its token count:

```markdown
### `Badge`

A status pill: a `<span>` laid out `inline-flex`, so it sits in a sentence or
a table cell without breaking the line. One axis, `tone` — `neutral`,
`success`, `warning`, `danger`, `info` — defaulting to `neutral`, because the
most common badge says `Draft` rather than anything semantic.

Every tone is a `<tone>-subtle` fill with `<tone>` as ink. That pair is the
second contrast promise in [design-system.md](../../docs/design-system.md),
and `mini`'s theme test holds it. No hover and no transition: the schema gives
status colours no `-hover` arm. No size axis: `schema.sizing` names two
control heights and a badge is not a control.

Twenty-three tokens in `badge/tokens.ts`.
```

- In the axis table under `### Heading / Text / Eyebrow`, leave it alone — `Badge` is not a typographic component and its axis belongs in its own section above.

- Replace the Status paragraph at the end of the file. It currently reads:

```markdown
`Button`, `LinkButton`, `Stack`, `Row`, `Grid`, `Container`, `Heading`, `Text`,
`Eyebrow`, `Field` and `ThemeStyle` ship. `tokens.ts` aggregates the
component records and exports `ComponentTokenName`; the four layout components
add nothing to it, which is what they exist to demonstrate, the three
typographic ones add twenty-two between them, and `Field` adds twenty-seven.
`src/demos.ts` registers nine demos. `runtime.ts` and `compat.ts` are still
stubs — nothing here needs client JavaScript yet.
```

Replace with:

```markdown
`Button`, `LinkButton`, `Stack`, `Row`, `Grid`, `Container`, `Heading`, `Text`,
`Eyebrow`, `Field`, `Badge` and `ThemeStyle` ship. `tokens.ts` aggregates the
component records and exports `ComponentTokenName`; the four layout components
add nothing to it, which is what they exist to demonstrate, the three
typographic ones add twenty-two between them, `Field` adds twenty-seven and
`Badge` twenty-three. `demos.ts` registers ten demos. `runtime.ts` and
`compat.ts` are still stubs — nothing here needs client JavaScript yet.
```

Note the `src/demos.ts` → `demos.ts` correction: the path predates the collapse into one package and is wrong today. The file is `src/remix/demos.ts`, and every other path in this README is written relative to the layer.

- [ ] **Step 9: Close the task**

```bash
git mv todo/m1-foundation-and-contract-proof/16-badge-the-semantic-token-set.md todo/done/
```

In `todo/TODO.md`, remove the task 16 line from the M1 list.

- [ ] **Step 10: Run the gate one last time**

Run: `bun run check`

Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Register Badge and close M1 task 16

Aggregates badge/tokens.ts into componentTokens — without it every
default resolves to nothing in a real page and no component test can
see it — exports Badge from the remix entry point, and registers its
demo in the catalogue.

tokens.test.ts now asserts the aggregate holds every component's
prefix, so the next component cannot ship unregistered.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Verification

After Task C, all of the following must hold. Run them; do not assume.

- `bun run check` passes.
- `bun run playground` serves the catalogue with a `badge` entry, and the five tones render as pills rather than unstyled text. Unstyled text means the tokens are not in the emitted stylesheet — check Task C step 3.
- Toggling the playground's dark switch keeps every tone readable.
