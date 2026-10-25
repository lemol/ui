# Button Contract Proof Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the component-token contract end to end — `Button` and `LinkButton` styled only through `--ui-btn-*`, `mini`'s theme supplying every primitive, and `/c/button` rendering in light, dark and compact with no client JavaScript.

**Architecture:** Each component declares its token record beside itself, defaulting to a primitive. `ui-remix/src/tokens.ts` aggregates the records and exports the union of their names. `ui-remix-mini` depends on both packages and so wires the types: `defineTheme<ComponentTokenName>` type-checks every `--ui-*` override against what `ui-remix` actually declares. `ThemeStyle` puts `emitTokensCss()`'s string into `<head>`.

**Tech Stack:** Remix 3 (`remix/ui` only), Bun as package manager and test runner, `bun:test`, Biome, TypeScript with no build step.

Full spec: `docs/superpowers/specs/2026-09-18-ui-remix-button-contract-design.md`

## Global Constraints

- **The gate is `bun run check`** — `biome check .` then `tsc -p tsconfig.json` then `bun test`. Run it before every commit.
- **No component hard-codes a colour, radius, duration or space step.** Every declaration reads a `--ui-btn-*` token or a CSS keyword.
- **A component token defaults to a primitive** — `var(--<primitive>)` — with exactly two allow-listed literal exceptions in this task: `transparent` and `1px`.
- **No `color-mix()` in a component token default.**
- **Tone backgrounds use the `background` shorthand, never `background-color`.** A skin may set `--ui-btn-<tone>-bg` to a gradient, and `background-color` drops a gradient as invalid.
- **SPA-safe.** Packages must not import `node:*`, `bun`, `bun:*`, `effect`, `remix/router`, `remix/routes`, `remix/assets` or `remix/spa`. `test/boundaries.test.ts` enforces it. `ui-remix` may import `remix/ui`, `remix/ui/*` and `@lemol/ui-design`; `ui-remix-mini` may also import `@lemol/ui-remix`.
- **A sibling package is reached by name**, never by a relative path out of `src/`.
- **No bundler, no build step.** Packages ship TypeScript from `src/`.
- **`tsconfig.json` sets `exactOptionalPropertyTypes: true`**, so every optional prop is declared `?: T | undefined`. Follow `apps/playground/app/ui/document.tsx:17`.
- **Biome:** 2-space indent, line width 100, double quotes, semicolons as needed. Run `bun run fix` if `lint` complains about formatting.
- **Commit style:** imperative subject, a body explaining why when the why is not obvious, and the trailer `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

---

## File Structure

**Created**

| File | Responsibility |
| --- | --- |
| `packages/ui-remix/src/button/tokens.ts` | Button's 31-token contract and nothing else |
| `packages/ui-remix/src/button/button.tsx` | `Button`, `LinkButton`, and the `css()` blocks that read the tokens |
| `packages/ui-remix/src/button/button.test.tsx` | Server-render tests, plus the no-literals assertion |
| `packages/ui-remix/src/button/button.demo.tsx` | Every tone × size, for the catalogue |
| `packages/ui-remix/src/tokens.ts` | The aggregate and `ComponentTokenName` |
| `packages/ui-remix/src/tokens.test.ts` | The rules every component token record must obey |
| `packages/ui-remix/src/theme-style.tsx` | `ThemeStyle` — the emitted sheet into the document |
| `packages/ui-remix/src/theme-style.test.tsx` | That it emits the exact string, raw, defaults included |
| `packages/ui-remix-mini/src/theme.ts` | `miniTheme` — 96 primitives, dark, compact, one skin override |
| `packages/ui-remix-mini/src/theme.test.ts` | The `sp-N` multiplier, and the `@ts-expect-error` rename proof |
| `apps/playground/app/ui/catalogue.tsx` | The demo frame: title and the demo body |

**Modified**

| File | Change |
| --- | --- |
| `packages/ui-design/src/tokens.ts` | `danger-hover` added to `schema.color` |
| `packages/ui-design/src/tokens.test.ts` | Which colours have a hover value, and which deliberately do not |
| `packages/ui-remix/src/index.ts` | Barrel: Button, LinkButton, ThemeStyle, the aggregate |
| `packages/ui-remix/src/demos.ts` | The demo registry |
| `packages/ui-remix-mini/src/index.ts` | Barrel: `miniTheme` |
| `apps/playground/package.json` | Depend on `@lemol/ui-remix` and `@lemol/ui-remix-mini` |
| `apps/playground/app/ui/document.tsx` | `ThemeStyle` first in head; `scheme` and `density` props |
| `apps/playground/app/routes.ts` | `component: get("/c/:component")` |
| `apps/playground/app/actions/controller.tsx` | The `component` action |
| `apps/playground/app/router.test.tsx` | Route tests, and the layer-order assertion |
| `docs/design-system.md` | The three corrections |
| `packages/ui-{design,remix,remix-mini}/README.md` | What each package now holds |
| `todo/TODO.md`, `todo/m1-.../12-*.md` | Close the task |

---

### Task 1: `danger-hover` joins the schema

A destructive button needs a hover value, and `schema.color` has none. `accent-hover` and `link-hover` exist; `danger-hover` completes the set of interactive colours. `success`, `warning` and `info` are status colours on static elements and deliberately get none.

**Files:**
- Modify: `packages/ui-design/src/tokens.ts:52-55`
- Test: `packages/ui-design/src/tokens.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `"danger-hover"` as a member of `PrimitiveName`, so `var(--danger-hover)` becomes a legal component token default in Task 2.

- [ ] **Step 1: Write the failing test**

Append to `packages/ui-design/src/tokens.test.ts`, inside the existing `describe("schema", …)` block:

```ts
  it("gives every interactive colour a hover value, and no status colour one", () => {
    // accent, link and danger are the colours something hovers. success,
    // warning and info are read on static elements — Badge, not Button — so
    // they get no hover value until something needs one. Deriving one inside a
    // component is what design-system.md forbids.
    const interactive = ["accent", "link", "danger"]
    const status = ["success", "warning", "info"]
    const colors = schema.color as readonly string[]

    expect(interactive.filter((name) => !colors.includes(`${name}-hover`))).toEqual([])
    expect(status.filter((name) => colors.includes(`${name}-hover`))).toEqual([])
  })
```

- [ ] **Step 2: Run the test to verify it fails**

```sh
bun test packages/ui-design/src/tokens.test.ts
```

Expected: FAIL — `expect([ "danger" ]).toEqual([])`.

- [ ] **Step 3: Add the name to the schema**

In `packages/ui-design/src/tokens.ts`, insert `"danger-hover"` directly after `"danger"` so the group follows `accent`'s existing shape (fill, hover, ink, subtle, border):

```ts
    "danger",
    "danger-hover",
    "danger-ink",
    "danger-subtle",
    "danger-border",
```

- [ ] **Step 4: Run the whole gate**

```sh
bun run check
```

Expected: PASS. `packages/ui-design/src/css/emit.test.ts` builds its fixture from `primitiveNames` (`emit.test.ts:8-14`), so a new name needs no fixture edit. If any test hard-codes a primitive count, that is the one thing to update.

- [ ] **Step 5: Commit**

```sh
git add packages/ui-design/src/tokens.ts packages/ui-design/src/tokens.test.ts
git commit -F - <<'EOF'
Add danger-hover to the colour schema

A destructive button has no hover value to default to. accent and link
already have one; danger is the third interactive colour. success,
warning and info stay without one — nothing hovers a status colour, and
deriving a hover inside the component is the thing the contract forbids.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 2: Button's token record and the aggregate

The contract itself, with the test that enforces the documented rules on it. No JSX yet, so this task is reviewable purely as data.

**Files:**
- Create: `packages/ui-remix/src/button/tokens.ts`
- Create: `packages/ui-remix/src/tokens.ts`
- Create: `packages/ui-remix/src/tokens.test.ts`

**Interfaces:**
- Consumes: `primitiveNames` from `@lemol/ui-design` (Task 1).
- Produces:
  - `buttonTokens` — a `const` object of 31 `ui-btn-*` keys to string values.
  - `componentTokens: { readonly [K in ComponentTokenName]: string }` from `./tokens.ts`.
  - `type ComponentTokenName = keyof typeof componentTokens` — the union Task 5 passes to `defineTheme` and Task 4 uses in `ThemeStyleProps`.

- [ ] **Step 1: Write the failing test**

Create `packages/ui-remix/src/tokens.test.ts`:

```tsx
import { describe, expect, it } from "bun:test"
import { primitiveNames } from "@lemol/ui-design"
import { componentTokens } from "./tokens.ts"

/**
 * Values a default may be even though they are not a var(). Every entry has to
 * be argued for in review; the list existing is what keeps "just this once"
 * from becoming the norm.
 *
 * - `transparent` keeps a ghost control the same size as a filled one, so a
 *   toolbar does not reflow when a tone changes.
 * - `1px` is a border width, and the schema has no border-width primitive.
 *   Named here rather than written into button.tsx, so a skin can change it.
 */
const allowedLiterals = new Set(["transparent", "1px"])

const primitives = new Set<string>(primitiveNames)
const entries = Object.entries(componentTokens)

describe("the component token aggregate", () => {
  it("holds something", () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  it("prefixes every name with ui- and writes no leading dashes", () => {
    const problems = entries.flatMap(([name]) => {
      if (name.startsWith("--")) return [`${name}: carries its own leading dashes`]
      if (!name.startsWith("ui-")) return [`${name}: is not ui- prefixed`]
      return []
    })
    expect(problems).toEqual([])
  })

  it("defaults every token to a primitive that exists", () => {
    // A var() on an undeclared property resolves to nothing, so a default
    // naming a primitive the schema dropped is invisible until someone looks
    // at the rendered page.
    const problems = entries.flatMap(([name, value]) => {
      if (allowedLiterals.has(value)) return []
      const referenced = /^var\(--([\w-]+)\)$/.exec(value)?.[1]
      if (referenced === undefined) {
        return [`${name}: ${value} is neither var(--primitive) nor an allowed literal`]
      }
      if (!primitives.has(referenced)) {
        return [`${name}: --${referenced} is not a name the schema holds`]
      }
      return []
    })
    expect(problems).toEqual([])
  })

  it("derives no tone from another", () => {
    // A mix ratio inside a component is the same kind of bug as a literal
    // duration: correct today, impossible to retune centrally.
    const problems = entries
      .filter(([, value]) => value.includes("color-mix("))
      .map(([name]) => `${name}: contains color-mix()`)
    expect(problems).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```sh
bun test packages/ui-remix/src/tokens.test.ts
```

Expected: FAIL — cannot resolve `./tokens.ts`'s `componentTokens` export.

- [ ] **Step 3: Write Button's token record**

Create `packages/ui-remix/src/button/tokens.ts`:

```ts
/**
 * Button's contract. The component reads these and nothing else, so a skin is
 * a set of values here and never a forked component.
 *
 * Height and padding come from the sizing group, which is what makes
 * `[data-density="compact"]` retune the control without the component knowing
 * density exists.
 */
export const buttonTokens = {
  "ui-btn-radius": "var(--r-sm)",
  "ui-btn-height": "var(--control-h)",
  "ui-btn-height-sm": "var(--control-h-sm)",
  "ui-btn-pad-x": "var(--sp-4)",
  "ui-btn-pad-x-sm": "var(--sp-3)",
  "ui-btn-gap": "var(--sp-2)",
  "ui-btn-font-size": "var(--fs-md)",
  "ui-btn-font-size-sm": "var(--fs-sm)",
  "ui-btn-font-weight": "var(--fw-medium)",
  // The one default here that is not a primitive: border width has no
  // primitive to reference, and one property does not justify widening the
  // schema. Named rather than written into button.tsx, because a named token
  // with a literal default is the opposite of a buried literal.
  "ui-btn-border-width": "1px",
  "ui-btn-transition-duration": "var(--dur-fast)",
  "ui-btn-transition-easing": "var(--ease-out-quad)",

  // Each border defaults to its own fill rather than `transparent`, so every
  // tone is the same size and a skin can still give one a contrasting edge.
  "ui-btn-primary-bg": "var(--accent)",
  "ui-btn-primary-ink": "var(--accent-ink)",
  "ui-btn-primary-border": "var(--accent)",
  "ui-btn-primary-bg-hover": "var(--accent-hover)",

  "ui-btn-neutral-bg": "var(--surface)",
  "ui-btn-neutral-ink": "var(--ink)",
  "ui-btn-neutral-border": "var(--hairline-strong)",
  "ui-btn-neutral-bg-hover": "var(--surface-hover)",

  // `transparent` keeps a ghost button the same size as a neutral one.
  "ui-btn-ghost-bg": "transparent",
  "ui-btn-ghost-ink": "var(--ink-muted)",
  "ui-btn-ghost-border": "transparent",
  "ui-btn-ghost-bg-hover": "var(--surface-hover)",

  "ui-btn-danger-bg": "var(--danger)",
  "ui-btn-danger-ink": "var(--danger-ink)",
  "ui-btn-danger-border": "var(--danger)",
  "ui-btn-danger-bg-hover": "var(--danger-hover)",

  // Tone-independent: a disabled button stops being primary or dangerous.
  // Explicit colours rather than an opacity ratio, so there is no literal to
  // retune and every default still names a primitive.
  "ui-btn-disabled-bg": "var(--surface-active)",
  "ui-btn-disabled-ink": "var(--ink-subtle)",
  "ui-btn-disabled-border": "var(--hairline)",
} as const
```

- [ ] **Step 4: Write the aggregate**

Create `packages/ui-remix/src/tokens.ts`:

```ts
import { buttonTokens } from "./button/tokens.ts"

/**
 * Every component's token record in one object, for `emitTokensCss()` to write
 * ahead of a theme's values — same selector, same specificity, later wins.
 *
 * `ui-design` never learns which components exist; it takes this record. Adding
 * a component means adding its record here and nowhere else.
 */
export const componentTokens = {
  ...buttonTokens,
} satisfies Record<string, string>

/**
 * The union of every component token name.
 *
 * `ui-remix-mini` depends on both packages, so it is the one that can pass this
 * to `defineTheme` and turn a renamed token into a typecheck failure rather
 * than a design review finding.
 */
export type ComponentTokenName = keyof typeof componentTokens
```

- [ ] **Step 5: Run the test to verify it passes**

```sh
bun test packages/ui-remix/src/tokens.test.ts
```

Expected: PASS, 4 tests.

- [ ] **Step 6: Check the union is not widened to `string`**

```sh
bun run typecheck
```

Then confirm the type is the literal union rather than `string`. If `satisfies` were replaced with a type annotation, `ComponentTokenName` would widen to `string` and every type-level proof in Task 5 would pass while proving nothing. Write a scratch file inside the project so it picks up the real `tsconfig.json`:

```sh
cat > packages/ui-remix/src/union-check.ts <<'EOF'
import type { ComponentTokenName } from "./tokens.ts"
const ok: ComponentTokenName = "ui-btn-radius"
// @ts-expect-error - not a token this package declares
const bad: ComponentTokenName = "ui-btn-nope"
void ok
void bad
EOF
bun run typecheck
rm packages/ui-remix/src/union-check.ts
```

Expected: `typecheck` passes with the file present. If `ComponentTokenName` were `string`, it would report TS2578 — unused `@ts-expect-error` directive. Delete the scratch file either way; it is a one-off check, not a test to keep.

- [ ] **Step 7: Commit**

```sh
git add packages/ui-remix/src/button/tokens.ts packages/ui-remix/src/tokens.ts \
  packages/ui-remix/src/tokens.test.ts
git commit -F - <<'EOF'
Declare Button's token contract and the aggregate

Thirty-one tokens: twelve shape, sixteen tone, three disabled. Each
defaults to a primitive, except `transparent` for ghost and the 1px
border width, which has no primitive to name and is allow-listed in the
test rather than buried in the component.

Disabled is three explicit colours rather than an opacity ratio, so
there is no literal to retune and no tone-by-tone duplication.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 3: `Button` and `LinkButton`

**Files:**
- Create: `packages/ui-remix/src/button/button.tsx`
- Create: `packages/ui-remix/src/button/button.test.tsx`
- Modify: `packages/ui-remix/src/index.ts`

**Interfaces:**
- Consumes: `buttonTokens` (Task 2), `css`/`Handle`/`MixInput`/`RemixNode`/`CSSMixinDescriptor` from `remix/ui`, `renderToHtml` from `test/render.ts`.
- Produces: `Button`, `LinkButton`, `type ButtonTone = "primary" | "neutral" | "ghost" | "danger"`, `type ButtonSize = "sm" | "md"`, `ButtonProps`, `LinkButtonProps`.

- [ ] **Step 1: Write the failing test**

Create `packages/ui-remix/src/button/button.test.tsx`:

```tsx
import { describe, expect, it } from "bun:test"
import { css } from "remix/ui"
import { renderToHtml } from "../../../../test/render.ts"
import { type ButtonSize, Button, type ButtonTone, LinkButton } from "./button.tsx"
import { buttonTokens } from "./tokens.ts"

const tones: ButtonTone[] = ["primary", "neutral", "ghost", "danger"]
const sizes: ButtonSize[] = ["sm", "md"]

/** The css remix collected during the render, with the markup dropped. */
const stylesOf = (html: string) =>
  [...html.matchAll(/<style data-rmx-style="[^"]*">([\s\S]*?)<\/style>/g)]
    .map((match) => match[1] ?? "")
    .join("\n")

/** Every declaration value in a block of css. */
const valuesOf = (styles: string) =>
  [...styles.matchAll(/[\w-]+\s*:\s*([^;{}]+)[;}]/g)].map((match) => (match[1] ?? "").trim())

/**
 * Values a declaration may carry instead of a token. Structural keywords only:
 * nothing here is a colour, a length, a duration or a weight.
 */
const keywords = new Set([
  "inline-flex",
  "center",
  "solid",
  "inherit",
  "nowrap",
  "none",
  "pointer",
  "not-allowed",
  "background, border-color, color",
])

describe("Button", () => {
  it("defaults its type, because a bare button in a form submits it", async () => {
    expect(await renderToHtml(<Button>Save</Button>)).toContain('type="button"')
  })

  it("takes an explicit type for the case where submitting is the point", async () => {
    expect(await renderToHtml(<Button type="submit">Save</Button>)).toContain('type="submit"')
  })

  it("renders its children", async () => {
    expect(await renderToHtml(<Button>Save</Button>)).toContain("Save")
  })

  it("renders the disabled attribute", async () => {
    expect(await renderToHtml(<Button disabled>Save</Button>)).toContain("disabled")
  })

  it("reads only its own tokens and structural keywords", async () => {
    // The machine-checkable form of "no component hard-codes a colour,
    // radius, duration or space step".
    for (const tone of tones) {
      for (const size of sizes) {
        const styles = stylesOf(await renderToHtml(<Button size={size} tone={tone}>Save</Button>))
        const offenders = valuesOf(styles).filter(
          (value) => !keywords.has(value) && !/^var\(--ui-btn-[\w-]+\)$/.test(value),
        )
        expect(offenders).toEqual([])
      }
    }
  })

  it("declares a token for every tone and part it reads", async () => {
    // button.tsx composes token names from the tone, so this is what stops a
    // tone from reading a name the record does not hold.
    const parts = ["bg", "ink", "border", "bg-hover"]
    const missing = tones.flatMap((tone) =>
      parts
        .map((part) => `ui-btn-${tone}-${part}`)
        .filter((name) => !Object.hasOwn(buttonTokens, name)),
    )
    expect(missing).toEqual([])
  })

  it("takes its height from the size axis, so density reaches it", async () => {
    expect(stylesOf(await renderToHtml(<Button size="md">Save</Button>))).toContain(
      "var(--ui-btn-height)",
    )
    expect(stylesOf(await renderToHtml(<Button size="sm">Save</Button>))).toContain(
      "var(--ui-btn-height-sm)",
    )
  })

  it("styles no focus ring, leaving the reset's to apply", async () => {
    expect(stylesOf(await renderToHtml(<Button>Save</Button>))).not.toContain("outline")
  })

  it("applies mix last, because it is the escape hatch", async () => {
    // A structural override the contract cannot express as a token value.
    const pinned = css({ position: "fixed" })
    const styles = stylesOf(await renderToHtml(<Button mix={pinned}>Save</Button>))
    expect(styles).toContain("position: fixed")
  })
})

describe("LinkButton", () => {
  it("renders an anchor carrying its href", async () => {
    const html = await renderToHtml(<LinkButton href="/docs">Docs</LinkButton>)
    expect(html).toContain('<a href="/docs"')
    expect(html).toContain("Docs")
  })

  it("drops the underline the reset gives every anchor", async () => {
    // The reset's :where(a) rule lives in @layer base and the component's css
    // lives in rmx, which is ordered after it. This asserts which side of
    // that line the reset is on.
    const styles = stylesOf(await renderToHtml(<LinkButton href="/docs">Docs</LinkButton>))
    expect(styles).toContain("text-decoration: none")
    expect(styles).toContain("@layer rmx.")
  })

  it("shares the tone contract with Button", async () => {
    const styles = stylesOf(await renderToHtml(<LinkButton href="/x" tone="primary">X</LinkButton>))
    expect(styles).toContain("var(--ui-btn-primary-bg)")
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```sh
bun test packages/ui-remix/src/button/button.test.tsx
```

Expected: FAIL — cannot resolve `./button.tsx`.

- [ ] **Step 3: Write the components**

Create `packages/ui-remix/src/button/button.tsx`:

```tsx
import { type CSSMixinDescriptor, css, type Handle, type MixInput, type RemixNode } from "remix/ui"

export type ButtonTone = "primary" | "neutral" | "ghost" | "danger"

/**
 * Two sizes, because `schema.sizing` holds exactly `control-h` and
 * `control-h-sm`. A third would need a primitive that does not exist, so the
 * size axis is decided by the schema rather than by taste.
 */
export type ButtonSize = "sm" | "md"

/**
 * Every declaration reads a --ui-btn-* token or a structural keyword. A literal
 * colour, radius, duration or space step here is the failure this component
 * exists to make impossible, and button.test.tsx checks for one.
 */
const buttonBase = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--ui-btn-gap)",
  borderStyle: "solid",
  borderWidth: "var(--ui-btn-border-width)",
  borderRadius: "var(--ui-btn-radius)",
  fontFamily: "inherit",
  fontWeight: "var(--ui-btn-font-weight)",
  whiteSpace: "nowrap",
  textDecoration: "none",
  appearance: "none",
  cursor: "pointer",
  // `background` and not `background-color`: a skin may set --ui-btn-<tone>-bg
  // to a gradient, and background-color drops a gradient value as invalid.
  // Naming the shorthand here means gradients do not interpolate, so a
  // gradient skin swaps instantly on hover while the flat default transitions.
  transitionProperty: "background, border-color, color",
  transitionDuration: "var(--ui-btn-transition-duration)",
  transitionTimingFunction: "var(--ui-btn-transition-easing)",
  // No outline anywhere in here. The reset's :where(:focus-visible) rule owns
  // the focus ring, and it applies precisely because nothing here competes
  // with it. A per-component ring is how a focus ring drifts.
  "&:disabled": {
    background: "var(--ui-btn-disabled-bg)",
    borderColor: "var(--ui-btn-disabled-border)",
    color: "var(--ui-btn-disabled-ink)",
    cursor: "not-allowed",
  },
})

const sizeStyles: Record<ButtonSize, CSSMixinDescriptor> = {
  md: css({
    height: "var(--ui-btn-height)",
    paddingInline: "var(--ui-btn-pad-x)",
    fontSize: "var(--ui-btn-font-size)",
  }),
  sm: css({
    height: "var(--ui-btn-height-sm)",
    paddingInline: "var(--ui-btn-pad-x-sm)",
    fontSize: "var(--ui-btn-font-size-sm)",
  }),
}

/**
 * `:active` deliberately reuses the hover background. A separate press colour
 * is four more tokens for an effect that lasts a hundred milliseconds.
 */
const toneStyle = (tone: ButtonTone): CSSMixinDescriptor =>
  css({
    background: `var(--ui-btn-${tone}-bg)`,
    borderColor: `var(--ui-btn-${tone}-border)`,
    color: `var(--ui-btn-${tone}-ink)`,
    "&:hover:not(:disabled)": { background: `var(--ui-btn-${tone}-bg-hover)` },
  })

const toneStyles: Record<ButtonTone, CSSMixinDescriptor> = {
  primary: toneStyle("primary"),
  neutral: toneStyle("neutral"),
  ghost: toneStyle("ghost"),
  danger: toneStyle("danger"),
}

export interface ButtonProps {
  tone?: ButtonTone | undefined
  size?: ButtonSize | undefined
  /** Defaulted to "button": a bare <button> inside a <form> submits it. */
  type?: "button" | "submit" | "reset" | undefined
  disabled?: boolean | undefined
  name?: string | undefined
  value?: string | undefined
  /** The structural escape hatch. Composed last, so it wins. */
  mix?: MixInput<HTMLButtonElement> | undefined
  children?: RemixNode | undefined
}

export function Button(handle: Handle<ButtonProps>) {
  return () => {
    const { tone = "neutral", size = "md", type = "button" } = handle.props
    const { disabled, name, value, mix, children } = handle.props
    return (
      <button
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

export interface LinkButtonProps {
  /**
   * Required. `aria-disabled` on an anchor does not prevent navigation, so a
   * disabled link is a broken link — omit the LinkButton instead.
   */
  href: string
  tone?: ButtonTone | undefined
  size?: ButtonSize | undefined
  mix?: MixInput<HTMLAnchorElement> | undefined
  children?: RemixNode | undefined
}

export function LinkButton(handle: Handle<LinkButtonProps>) {
  return () => {
    const { href, tone = "neutral", size = "md", mix, children } = handle.props
    return (
      <a href={href} mix={[buttonBase, toneStyles[tone], sizeStyles[size], mix]}>
        {children}
      </a>
    )
  }
}
```

If `tsc` rejects `disabled={disabled}` under `exactOptionalPropertyTypes` because the host prop is not declared `| undefined`, replace that one attribute with a conditional spread — `{...(disabled === undefined ? {} : { disabled })}` — and nothing else.

- [ ] **Step 4: Open the barrel**

Replace `packages/ui-remix/src/index.ts`:

```ts
export {
  Button,
  type ButtonProps,
  type ButtonSize,
  type ButtonTone,
  LinkButton,
  type LinkButtonProps,
} from "./button/button.tsx"
export { componentTokens, type ComponentTokenName } from "./tokens.ts"
```

- [ ] **Step 5: Run the gate**

```sh
bun run check
```

Expected: PASS. If the "reads only its own tokens" test reports an offender, the value it names is a literal that belongs in `button/tokens.ts` as a token — not a keyword to add to the allow-list. Only add a keyword when the value is genuinely structural.

- [ ] **Step 6: Commit**

```sh
git add packages/ui-remix/src/button/button.tsx packages/ui-remix/src/button/button.test.tsx \
  packages/ui-remix/src/index.ts
git commit -F - <<'EOF'
Add Button and LinkButton on the token contract

Tones use the `background` shorthand rather than background-color: the
contract promises a skin can set --ui-btn-<tone>-bg to a gradient, and
background-color drops a gradient as an invalid value.

Neither component styles focus. The reset owns the ring and applies
because nothing here competes with it, which is asserted rather than
assumed. LinkButton drops the reset's anchor underline through rmx,
which is ordered after base.

remix/ui/button is not used: it hard-codes Inter, hex pairs, a 999px
radius and 26px heights. The native-first ladder ranks behaviour
primitives, and a <button> needs no behaviour.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 4: `ThemeStyle`

**Files:**
- Create: `packages/ui-remix/src/theme-style.tsx`
- Create: `packages/ui-remix/src/theme-style.test.tsx`
- Modify: `packages/ui-remix/src/index.ts`

**Interfaces:**
- Consumes: `emitTokensCss` from `@lemol/ui-design/css`, `Theme` from `@lemol/ui-design`, `componentTokens` and `ComponentTokenName` (Task 2).
- Produces: `ThemeStyle`, `ThemeStyleProps { theme: Theme<ComponentTokenName>; componentTokens?: Readonly<Record<string, string>> | undefined }`.

- [ ] **Step 1: Write the failing test**

Create `packages/ui-remix/src/theme-style.test.tsx`:

```tsx
import { describe, expect, it } from "bun:test"
import { defineTheme, type PrimitiveTokens, primitiveNames } from "@lemol/ui-design"
import { emitTokensCss } from "@lemol/ui-design/css"
import { renderToHtml } from "../../../test/render.ts"
import { ThemeStyle } from "./theme-style.tsx"
import { type ComponentTokenName, componentTokens } from "./tokens.ts"

/** A complete theme whose every value names itself, so a declaration is traceable. */
const fullBase = Object.fromEntries(
  primitiveNames.map((name) => [name, `val-${name}`]),
) as PrimitiveTokens

const theme = defineTheme<ComponentTokenName>({
  base: fullBase,
  dark: { canvas: "dark-canvas" },
  compact: { "row-h": "compact-row" },
})

describe("ThemeStyle", () => {
  it("renders one style element and nothing else", async () => {
    const html = await renderToHtml(<ThemeStyle theme={theme} />)
    expect(html.match(/<style/g) ?? []).toHaveLength(1)
  })

  it("carries the emitter's string verbatim", async () => {
    // Exact equality is the assertion: remix escapes &, < and > in element
    // text content, and this component uses innerHTML precisely so the sheet
    // is not at the mercy of that.
    const html = await renderToHtml(<ThemeStyle theme={theme} />)
    expect(html).toContain(emitTokensCss(theme, { componentTokens }))
  })

  it("opens with the layer statement, which nothing may precede", async () => {
    const html = await renderToHtml(<ThemeStyle theme={theme} />)
    const style = html.indexOf("<style")
    expect(html.indexOf("@layer base, rmx;")).toBeGreaterThan(style)
    expect(html.indexOf("--canvas:")).toBeGreaterThan(html.indexOf("@layer base, rmx;"))
  })

  it("includes this package's component tokens without being asked", async () => {
    expect(await renderToHtml(<ThemeStyle theme={theme} />)).toContain("--ui-btn-radius:")
  })

  it("writes component defaults before theme values, so a theme wins", async () => {
    const skinned = defineTheme<ComponentTokenName>({
      base: { ...fullBase, "ui-btn-radius": "skinned-radius" },
    })
    const html = await renderToHtml(<ThemeStyle theme={skinned} />)
    expect(html.indexOf("--ui-btn-radius: var(--r-sm);")).toBeLessThan(
      html.indexOf("--ui-btn-radius: skinned-radius;"),
    )
  })

  it("takes a wider record for an app with its own component tokens", async () => {
    const html = await renderToHtml(
      <ThemeStyle componentTokens={{ ...componentTokens, "ui-app-x": "1px" }} theme={theme} />,
    )
    expect(html).toContain("--ui-app-x: 1px;")
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```sh
bun test packages/ui-remix/src/theme-style.test.tsx
```

Expected: FAIL — cannot resolve `./theme-style.tsx`.

- [ ] **Step 3: Write the component**

Create `packages/ui-remix/src/theme-style.tsx`:

```tsx
import type { Theme } from "@lemol/ui-design"
import { emitTokensCss } from "@lemol/ui-design/css"
import type { Handle } from "remix/ui"
import { type ComponentTokenName, componentTokens as ownTokens } from "./tokens.ts"

export interface ThemeStyleProps {
  theme: Theme<ComponentTokenName>
  /** Defaults to this package's aggregate. Supply a wider record to add to it. */
  componentTokens?: Readonly<Record<string, string>> | undefined
}

/**
 * The emitted stylesheet, in the document.
 *
 * **This belongs in `<head>`, and the placement is load-bearing.** remix
 * collects every `css({...})` rule and splices the resulting style elements in
 * immediately before `</head>` — after all authored head content, before
 * anything in the body. So a ThemeStyle in the body is evaluated after
 * `@layer rmx.*` already exists, and `@layer base, rmx;` then registers `base`
 * at the *end* of the order rather than the front, because a layer statement
 * cannot move a layer that exists. Element defaults start beating components,
 * with no error at all.
 *
 * A runtime assertion cannot catch that: this renders during the tree walk and
 * remix injects its style elements afterwards, so at render time there is no
 * remix style element to find. The check is a render test on the document
 * instead — see apps/playground/app/router.test.tsx.
 *
 * `innerHTML` rather than text children because remix escapes &, < and > in
 * element text content, which would quietly break any declaration carrying
 * one. `emitTokensCss()` rejects those characters as well; this is the half of
 * the defence that does not depend on the emitter keeping that rule.
 */
export function ThemeStyle(handle: Handle<ThemeStyleProps>) {
  return () => {
    const { theme, componentTokens = ownTokens } = handle.props
    return <style innerHTML={emitTokensCss(theme, { componentTokens })} />
  }
}
```

If `tsc` objects that `emitTokensCss`'s `EmitOptions<C>` wants `Record<ComponentTokenName, string>` and receives `Record<string, string>`, widen the call to `emitTokensCss<string>(theme, { componentTokens })` — `Theme<ComponentTokenName>` is assignable to `Theme<string>` because the component-token half of `Base<C>` is `Partial`.

- [ ] **Step 4: Add it to the barrel**

Append to `packages/ui-remix/src/index.ts`:

```ts
export { ThemeStyle, type ThemeStyleProps } from "./theme-style.tsx"
```

- [ ] **Step 5: Run the gate**

```sh
bun run check
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add packages/ui-remix/src/theme-style.tsx packages/ui-remix/src/theme-style.test.tsx \
  packages/ui-remix/src/index.ts
git commit -F - <<'EOF'
Add ThemeStyle, which belongs in head

remix splices its own component styles in immediately before </head>, so
a ThemeStyle in the body is evaluated after the rmx layer exists and the
layer statement then appends `base` after it — inverting the order with
no error. The placement is documented on the component, and asserted on
the rendered document rather than checked at runtime, because at render
time remix has not injected anything yet.

It uses innerHTML: remix escapes &, < and > in text content, and the
sheet should not depend on the emitter's character ban being the only
thing between a theme and a silently dead declaration.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 5: `mini`'s theme, and the proof that a rename fails the typecheck

**Files:**
- Create: `packages/ui-remix-mini/src/theme.ts`
- Create: `packages/ui-remix-mini/src/theme.test.ts`
- Modify: `packages/ui-remix-mini/src/index.ts`

**Interfaces:**
- Consumes: `defineTheme`, `extendTheme`, `PrimitiveTokens`, `schema` from `@lemol/ui-design`; `emitTokensCss` from `@lemol/ui-design/css`; `ComponentTokenName`, `componentTokens` from `@lemol/ui-remix`.
- Produces: `miniTheme: Theme<ComponentTokenName>`.

**Palette:** warm-grey neutrals with a deep teal accent. Teal rather than blue keeps `accent` and `info` distinguishable on one screen, and `focus` is deliberately a different hue from `accent` so the ring reads against an accent-filled button. Nothing here derives from the earlier design package: the mechanisms in these packages came from there, none of the values did.

**Units:** space, radius and sizing in `px`; type sizes in `rem`, so raising the browser font size enlarges text without stretching the layout grid. Two unit systems, deliberately: one axis follows the user's preference, the other the design's density.

- [ ] **Step 1: Write the failing test**

Create `packages/ui-remix-mini/src/theme.test.ts`:

```ts
import { describe, expect, it } from "bun:test"
import { extendTheme, primitiveNames, schema } from "@lemol/ui-design"
import { emitTokensCss } from "@lemol/ui-design/css"
import { type ComponentTokenName, componentTokens } from "@lemol/ui-remix"
import { miniTheme } from "./theme.ts"

describe("miniTheme", () => {
  it("supplies every primitive the schema names", () => {
    // emitTokensCss throws on a missing primitive, but the message lists them
    // and this failure names them without rendering anything.
    const missing = primitiveNames.filter((name) => !(name in miniTheme.base))
    expect(missing).toEqual([])
  })

  it("keeps sp-N at N four-pixel units", () => {
    // design-system.md: the multiplier is not enforced by the compiler,
    // because the schema holds no values. It is checked here, in the package
    // that supplies them.
    const wrong = schema.space.flatMap((name) => {
      const multiplier = Number(name.slice("sp-".length))
      const expected = `${multiplier * 4}px`
      const actual = miniTheme.base[name]
      return actual === expected ? [] : [`${name}: ${actual} is not ${expected}`]
    })
    expect(wrong).toEqual([])
  })

  it("sets scheme-mode in both schemes, or the page pairs dark with light chrome", () => {
    expect(miniTheme.base["scheme-mode"]).toBe("light")
    expect(miniTheme.dark?.["scheme-mode"]).toBe("dark")
  })

  it("swaps exactly the four density tokens", () => {
    expect(Object.keys(miniTheme.compact ?? {}).sort()).toEqual([
      "control-h",
      "control-h-sm",
      "row-h",
      "row-pad-y",
    ])
  })

  it("retunes the dark axis rather than reusing light shadows", () => {
    // A shadow tuned for a light canvas disappears on a dark one.
    expect(miniTheme.dark?.["shadow-md"]).not.toBe(miniTheme.base["shadow-md"])
  })

  it("emits without the emitter rejecting a value", () => {
    expect(() => emitTokensCss(miniTheme, { componentTokens })).not.toThrow()
  })
})

describe("a skin is a set of token values", () => {
  it("takes a gradient for a tone background, with no component edit", () => {
    // The second "done when" of the task. The component reads `background`
    // and not background-color precisely so this value is legal.
    const gradient = "linear-gradient(180deg, #2FA08C, #1F6B5C 65%, #17554A)"
    const skinned = extendTheme(miniTheme, {
      base: {
        // Literal key, not a spread: see theme.ts for why that matters.
        "ui-btn-primary-bg": gradient,
      },
    })
    const sheet = emitTokensCss(skinned, { componentTokens })

    expect(sheet).toContain(`--ui-btn-primary-bg: ${gradient};`)
    // Component default first, theme value second, same selector, same
    // specificity: later wins.
    expect(sheet.indexOf("--ui-btn-primary-bg: var(--accent);")).toBeLessThan(
      sheet.indexOf(`--ui-btn-primary-bg: ${gradient};`),
    )
  })

  it("fails the typecheck on a token name ui-remix does not declare", () => {
    // The first "done when", asserted at the type level. The inversion is the
    // point: if excess property checking ever stops reaching this object, the
    // directive below goes unused and tsc fails with TS2578 — so the proof
    // cannot rot silently.
    const wrong = extendTheme(miniTheme, {
      // @ts-expect-error - ui-btn-primary-background is not a token ui-remix declares
      base: { "ui-btn-primary-background": "red" },
    })

    // At runtime the bogus name passes straight through and would emit a
    // custom property no component reads — which is why the type layer has to
    // be the thing that catches it. `tsc` is the real assertion here; this one
    // records what happens when it does not run.
    expect(wrong.base["ui-btn-primary-background" as ComponentTokenName]).toBe("red")
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```sh
bun test packages/ui-remix-mini/src/theme.test.ts
```

Expected: FAIL — cannot resolve `./theme.ts`.

- [ ] **Step 3: Write the theme**

Create `packages/ui-remix-mini/src/theme.ts`:

```ts
import { defineTheme, type PrimitiveTokens } from "@lemol/ui-design"
import type { ComponentTokenName } from "@lemol/ui-remix"

/**
 * Warm-grey neutrals with a deep teal accent.
 *
 * Typed as PrimitiveTokens rather than inferred, so a missing or misspelled
 * name fails here, on the line that wrote it, instead of at the defineTheme
 * call or — worse — at render time, where a var() on an undeclared property
 * just resolves to nothing.
 *
 * Space, radius and sizing are px; type sizes are rem, so raising the browser
 * font size enlarges text without stretching the layout grid with it.
 */
const basePrimitives: PrimitiveTokens = {
  "scheme-mode": "light",

  canvas: "#FAF9F7",
  surface: "#FFFFFF",
  "surface-raised": "#FFFFFF",
  "surface-hover": "#F3F1ED",
  "surface-active": "#EAE7E1",
  hairline: "#E6E3DC",
  "hairline-strong": "#CFCBC2",
  ink: "#1A1917",
  "ink-muted": "#5C5852",
  "ink-subtle": "#8B867D",
  "ink-inverse": "#FFFFFF",
  scrim: "rgba(26, 25, 23, 0.45)",
  // Deliberately not the accent: the ring has to read against an
  // accent-filled button, which it cannot do if it is the same hue.
  focus: "#2F6FEB",

  accent: "#1F6B5C",
  "accent-hover": "#18564A",
  "accent-ink": "#FFFFFF",
  "accent-subtle": "#E4F0ED",
  "accent-border": "#A9CFC6",
  link: "#1B5E52",
  "link-hover": "#124338",

  success: "#2F7D51",
  "success-ink": "#FFFFFF",
  "success-subtle": "#E7F3EC",
  "success-border": "#B7D9C4",
  warning: "#A8700F",
  "warning-ink": "#FFFFFF",
  "warning-subtle": "#FBF1DF",
  "warning-border": "#E8CF9B",
  danger: "#B3392F",
  "danger-hover": "#942D25",
  "danger-ink": "#FFFFFF",
  "danger-subtle": "#FBEAE8",
  "danger-border": "#E8B8B2",
  info: "#2B5C8A",
  "info-ink": "#FFFFFF",
  "info-subtle": "#E8F0F7",
  "info-border": "#B9CFE2",

  // sp-N is N four-pixel units. Checked by theme.test.ts, not the compiler.
  "sp-0": "0px",
  "sp-1": "4px",
  "sp-2": "8px",
  "sp-3": "12px",
  "sp-4": "16px",
  "sp-5": "20px",
  "sp-6": "24px",
  "sp-8": "32px",
  "sp-10": "40px",
  "sp-12": "48px",
  "sp-16": "64px",
  "sp-24": "96px",

  "r-xs": "2px",
  "r-sm": "6px",
  "r-md": "10px",
  "r-lg": "14px",
  "r-xl": "20px",
  "r-pill": "9999px",

  // No web font: the packages have no build step and no asset to ship.
  "font-sans": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  "font-mono": 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  "fs-2xs": "0.6875rem",
  "fs-xs": "0.75rem",
  "fs-sm": "0.8125rem",
  "fs-md": "0.9375rem",
  "fs-lg": "1.125rem",
  "fs-xl": "1.375rem",
  "fs-2xl": "1.75rem",
  "fs-3xl": "2.25rem",
  "lh-tight": "1.15",
  "lh-snug": "1.3",
  "lh-base": "1.55",
  "lh-relaxed": "1.75",
  "tr-tight": "-0.015em",
  "tr-normal": "0em",
  "tr-wide": "0.02em",
  "tr-wider": "0.08em",
  "fw-regular": "400",
  "fw-medium": "500",
  "fw-semibold": "600",
  "fw-bold": "700",

  "dur-instant": "80ms",
  "dur-fast": "140ms",
  "dur-base": "240ms",
  "dur-slow": "400ms",
  "ease-out-quad": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  "ease-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
  "ease-in-out-smooth": "cubic-bezier(0.4, 0, 0.2, 1)",

  "control-h": "36px",
  "control-h-sm": "28px",
  "row-h": "44px",
  "row-pad-y": "12px",
  "page-max": "72rem",
  gutter: "24px",

  "shadow-sm": "0 1px 2px rgba(23, 21, 18, 0.06)",
  "shadow-md": "0 4px 12px rgba(23, 21, 18, 0.08)",
  "shadow-lg": "0 16px 40px rgba(23, 21, 18, 0.12)",
  // The whole outline shorthand, so the reset needs no rule of its own.
  "focus-ring": "2px solid var(--focus)",
  "focus-ring-offset": "2px",
}

/**
 * Annotated, not inferred, for the same reason as `basePrimitives`: an
 * annotation makes this an excess-property-checked literal, so a misspelled
 * name fails here. Inferred, it would be a plain object that `defineTheme`
 * accepts structurally — and a token that reaches no selector is invisible.
 */
const darkPrimitives: Partial<PrimitiveTokens> = {
  "scheme-mode": "dark",

  canvas: "#151412",
  surface: "#1D1C19",
  "surface-raised": "#252320",
  "surface-hover": "#2B2926",
  "surface-active": "#33302C",
  hairline: "#33302B",
  "hairline-strong": "#4A4640",
  ink: "#F2F0EB",
  "ink-muted": "#AFAAA1",
  "ink-subtle": "#7E7970",
  "ink-inverse": "#151412",
  scrim: "rgba(0, 0, 0, 0.6)",
  focus: "#6E9DF5",

  // Hover goes lighter here and darker in base. That inversion is why a hover
  // value is a named token and never derived from its fill.
  accent: "#3E9A87",
  "accent-hover": "#4FAE9A",
  "accent-ink": "#0E1A17",
  "accent-subtle": "#1B2E29",
  "accent-border": "#2F5B52",
  link: "#5CB8A4",
  "link-hover": "#7ACBB9",

  success: "#4E9E70",
  "success-ink": "#0D1A12",
  "success-subtle": "#18281E",
  "success-border": "#2C5138",
  warning: "#C9962F",
  "warning-ink": "#1A1405",
  "warning-subtle": "#2B2312",
  "warning-border": "#54421C",
  danger: "#D4675A",
  "danger-hover": "#E07E71",
  "danger-ink": "#1E0E0C",
  "danger-subtle": "#2E1A17",
  "danger-border": "#5C2F28",
  info: "#5E9AC4",
  "info-ink": "#0C1620",
  "info-subtle": "#172530",
  "info-border": "#2C4A60",

  // A shadow tuned for a light canvas disappears on a dark one.
  "shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.4)",
  "shadow-md": "0 4px 12px rgba(0, 0, 0, 0.45)",
  "shadow-lg": "0 16px 40px rgba(0, 0, 0, 0.55)",
}

/** The four-token swap, and nothing else. Every control and row reads these. */
const compactPrimitives: Partial<PrimitiveTokens> = {
  "control-h": "30px",
  "control-h-sm": "24px",
  "row-h": "34px",
  "row-pad-y": "6px",
}

/**
 * One concrete design on @lemol/ui-remix.
 *
 * The type argument is the cross-package wiring, and `mini` is where it can
 * live because `mini` is the package that depends on both: `defineTheme`
 * requires every primitive, and type-checks every `ui-*` override against the
 * names `ui-remix` actually declares.
 *
 * **Write every `ui-*` override as a literal key here.** Excess property
 * checking only fires on object literals — the spread of `basePrimitives`
 * below is not checked, and an override moved out into a referenced object
 * would not be either. The rename check would then pass on a token name that
 * no longer exists, and the failure would surface as an unstyled button
 * instead of a compiler error. `theme.test.ts` pins this with a
 * `@ts-expect-error` whose directive goes unused the day it stops working.
 */
export const miniTheme = defineTheme<ComponentTokenName>({
  base: {
    ...basePrimitives,
    // mini's one skin choice, and the live half of the rename check: a
    // slightly softer button than the r-sm default the component ships.
    "ui-btn-radius": "var(--r-md)",
  },
  dark: darkPrimitives,
  compact: compactPrimitives,
})
```

- [ ] **Step 4: Open the barrel**

Replace `packages/ui-remix-mini/src/index.ts`:

```ts
export { miniTheme } from "./theme.ts"
```

- [ ] **Step 5: Run the gate**

```sh
bun run check
```

Expected: PASS, with the `sp-N` test and both proofs green.

- [ ] **Step 6: Prove the rename check actually fires**

Temporarily rename a token, confirm `typecheck` fails at `mini`, then put it back:

```sh
sed -i '' 's/"ui-btn-radius": "var(--r-sm)"/"ui-btn-radius-x": "var(--r-sm)"/' \
  packages/ui-remix/src/button/tokens.ts
bun run typecheck 2>&1 | head -5
git checkout packages/ui-remix/src/button/tokens.ts
bun run typecheck
```

Expected: the first `typecheck` reports TS2353 at `packages/ui-remix-mini/src/theme.ts` on the `"ui-btn-radius"` line; the second passes. **If the first run passes, the proof is broken** — the most likely cause is `componentTokens` having been annotated rather than `satisfies`-checked, widening `ComponentTokenName` to `string`.

- [ ] **Step 7: Commit**

```sh
git add packages/ui-remix-mini/src/theme.ts packages/ui-remix-mini/src/theme.test.ts \
  packages/ui-remix-mini/src/index.ts
git commit -F - <<'EOF'
Add mini's theme and the cross-package type wiring

Ninety-six primitives: warm-grey neutrals, a deep teal accent, and a
focus hue deliberately unlike the accent so the ring reads on an
accent-filled button. Dark retunes the shadows, because one tuned for a
light canvas disappears on a dark one, and its accent hover goes lighter
where base goes darker — which is why a hover value is a named token
and never derived.

The `ui-*` override is written as a literal key on purpose. Excess
property checking only fires on object literals, so an override behind a
spread or a reference would silently stop proving that a renamed token
fails the typecheck. theme.test.ts pins it with a @ts-expect-error that
becomes an unused-directive error the day the check stops reaching it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 6: The demo and the registry

Demos live beside their component, which is what makes drift impossible. The registry is the shape task 19 adds to rather than replaces.

**Files:**
- Create: `packages/ui-remix/src/button/button.demo.tsx`
- Modify: `packages/ui-remix/src/demos.ts`

**Interfaces:**
- Consumes: `Button`, `LinkButton`, `ButtonSize`, `ButtonTone` (Task 3).
- Produces:
  - `ButtonDemo` — a component taking no props.
  - `demos: { readonly button: { readonly title: "Button"; readonly Demo: typeof ButtonDemo } }`
  - `type DemoName = keyof typeof demos`
  - `type DemoEntry = (typeof demos)[DemoName]`
  - `isDemoName(name: string): name is DemoName`

- [ ] **Step 1: Write the demo**

Create `packages/ui-remix/src/button/button.demo.tsx`:

```tsx
import { css } from "remix/ui"
import { type ButtonSize, Button, type ButtonTone, LinkButton } from "./button.tsx"

const tones: ButtonTone[] = ["primary", "neutral", "ghost", "danger"]
const sizes: ButtonSize[] = ["md", "sm"]

/**
 * The demo is styled from primitives rather than from Button's own tokens: it
 * is a page, not a component, and the layout components that would own this
 * spacing arrive in task 13.
 */
const row = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--sp-3)",
  marginBlockEnd: "var(--sp-4)",
})

const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
})

export function ButtonDemo() {
  return () => (
    <>
      {sizes.map((size) => (
        <div key={size}>
          <p mix={label}>size {size}</p>
          <div mix={row}>
            {tones.map((tone) => (
              <Button key={tone} size={size} tone={tone}>
                {tone}
              </Button>
            ))}
            <Button disabled size={size}>
              disabled
            </Button>
            <LinkButton href="#" size={size} tone="primary">
              link
            </LinkButton>
          </div>
        </div>
      ))}
    </>
  )
}
```

- [ ] **Step 2: Write the registry**

Replace `packages/ui-remix/src/demos.ts`:

```ts
import { ButtonDemo } from "./button/button.demo.tsx"

/**
 * The catalogue's source of truth. A demo lives beside the component it
 * demonstrates and is registered here, so a component cannot be catalogued
 * from anything but its own source.
 */
export const demos = {
  button: { title: "Button", Demo: ButtonDemo },
} as const

export type DemoName = keyof typeof demos

/** One catalogue entry, so a consumer need not spell out a lookup into `demos`. */
export type DemoEntry = (typeof demos)[DemoName]

export function isDemoName(name: string): name is DemoName {
  return Object.hasOwn(demos, name)
}
```

- [ ] **Step 3: Add a render test for the demo**

Append to `packages/ui-remix/src/button/button.test.tsx`:

```tsx
describe("ButtonDemo", () => {
  it("renders every tone in both sizes", async () => {
    const html = await renderToHtml(<ButtonDemo />)
    for (const tone of tones) expect(html).toContain(`>${tone}</button>`)
    expect(html).toContain("size md")
    expect(html).toContain("size sm")
    expect(html).toContain("disabled")
  })
})
```

Add its import beside the others:

```tsx
import { ButtonDemo } from "./button.demo.tsx"
```

- [ ] **Step 4: Run the gate**

```sh
bun run check
```

Expected: PASS. `test/boundaries.test.ts` covers the new files automatically; a demo importing anything outside the allow-list fails there.

- [ ] **Step 5: Commit**

```sh
git add packages/ui-remix/src/button/button.demo.tsx packages/ui-remix/src/demos.ts \
  packages/ui-remix/src/button/button.test.tsx
git commit -F - <<'EOF'
Add Button's demo and open the demo registry

The demo sits beside the component, so a catalogue entry cannot drift
from the source it documents. It styles its own layout from primitives
rather than from Button's tokens, because it is a page and the layout
components that would own this spacing arrive in task 13.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 7: `/c/:component`, and the layer-order assertion

**Files:**
- Modify: `apps/playground/package.json`
- Modify: `apps/playground/app/ui/document.tsx`
- Create: `apps/playground/app/ui/catalogue.tsx`
- Modify: `apps/playground/app/routes.ts`
- Modify: `apps/playground/app/actions/controller.tsx`
- Modify: `apps/playground/app/router.test.tsx`

**Interfaces:**
- Consumes: `ThemeStyle` (Task 4), `miniTheme` (Task 5), `demos`/`isDemoName`/`DemoName` (Task 6).
- Produces: `DocumentProps` gains `scheme?: "light" | "dark" | undefined` and `density?: "compact" | undefined`; `CataloguePage`; the `component` route and action.

- [ ] **Step 1: Add the dependencies**

In `apps/playground/package.json`, replace the `dependencies` block:

```json
  "dependencies": {
    "@lemol/ui-remix": "workspace:*",
    "@lemol/ui-remix-mini": "workspace:*",
    "remix": "3.0.0-rc.2"
  }
```

Then:

```sh
bun install
```

- [ ] **Step 2: Write the failing tests**

Append to `apps/playground/app/router.test.tsx`:

```tsx
/** The root element's open tag, so an attribute assertion cannot be satisfied
 *  by a selector inside the emitted stylesheet. */
const htmlTag = (page: string) => /<html[^>]*>/.exec(page)?.[0] ?? ""

describe("the catalogue route", () => {
  it("renders the demo for a component it knows", async () => {
    const response = await get("/c/button")
    expect(response.status).toBe(200)
    expect(await response.text()).toContain("Button")
  })

  it("is a 404 for one it does not", async () => {
    expect((await get("/c/nope")).status).toBe(404)
  })

  it("delivers the token sheet ahead of remix's component styles", async () => {
    // Layer order is fixed by the first @layer statement the browser sees, and
    // remix splices its own style elements in immediately before </head>. If
    // ours arrived second, `base` would register after `rmx` and element
    // defaults would start beating components — with no error at all.
    const page = await html("/c/button")
    const ours = page.indexOf("@layer base, rmx;")
    const theirs = page.indexOf("data-rmx-style")
    expect(ours).toBeGreaterThan(-1)
    expect(theirs).toBeGreaterThan(-1)
    expect(ours).toBeLessThan(theirs)
  })

  it("carries the theme's own values, and lets them beat the component defaults", async () => {
    const page = await html("/c/button")
    expect(page).toContain("--accent: #1F6B5C;")
    // mini softens the button: the component default is emitted first and the
    // theme's value second, under one selector at one specificity.
    expect(page.indexOf("--ui-btn-radius: var(--r-sm);")).toBeLessThan(
      page.indexOf("--ui-btn-radius: var(--r-md);"),
    )
  })

  it("renders light, dark and compact with no client JavaScript", async () => {
    // Assertions read the <html> open tag, not the page. The emitted sheet
    // carries `:root[data-scheme="dark"]` and `:root[data-density="compact"]`
    // selectors of its own, so a whole-page `not.toContain("data-scheme")`
    // would fail on every request.
    const light = await html("/c/button?nojs")
    expect(light).not.toContain("<script")
    expect(htmlTag(light)).not.toContain("data-scheme")
    expect(htmlTag(light)).not.toContain("data-density")

    const dark = await html("/c/button?nojs&scheme=dark")
    expect(htmlTag(dark)).toContain('data-scheme="dark"')
    expect(dark).not.toContain("<script")

    const compact = await html("/c/button?nojs&density=compact")
    expect(htmlTag(compact)).toContain('data-density="compact"')
    expect(compact).not.toContain("<script")
  })

  it("ignores a scheme or density it does not recognise", async () => {
    const tag = htmlTag(await html("/c/button?scheme=sepia&density=roomy"))
    expect(tag).not.toContain("data-scheme")
    expect(tag).not.toContain("data-density")
  })

  it("still renders every tone with the runtime absent", async () => {
    const page = await html("/c/button?nojs")
    for (const tone of ["primary", "neutral", "ghost", "danger"]) {
      expect(page).toContain(`>${tone}</button>`)
    }
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

```sh
bun test apps/playground/app/router.test.tsx
```

Expected: FAIL — `/c/button` is a 404, because the route does not exist.

- [ ] **Step 4: Put `ThemeStyle` in the document**

In `apps/playground/app/ui/document.tsx`, add the imports:

```tsx
import { ThemeStyle } from "@lemol/ui-remix"
import { miniTheme } from "@lemol/ui-remix-mini"
```

Add the two props to `DocumentProps`, after `entry`:

```tsx
  /**
   * Rendered as `data-scheme` / `data-density` on the root element, so
   * `?scheme=dark` beats the media query and `?density=compact` retunes every
   * control with no client JavaScript at all. Unset renders no attribute.
   */
  scheme?: "light" | "dark" | undefined
  density?: "compact" | undefined
```

Destructure them and render the document:

```tsx
    const { title, entry, scheme, density, children } = handle.props
    return (
      <html data-density={density} data-scheme={scheme} lang="en">
        <head>
          {/* First, and it has to stay first. remix splices its own component
              styles in immediately before </head>, so a later @layer
              statement would register `base` after `rmx` and invert the
              order — element defaults would start beating components with no
              error. Asserted in router.test.tsx. */}
          <ThemeStyle theme={miniTheme} />
          <meta charset="utf-8" />
```

Leave the rest of the head unchanged.

- [ ] **Step 5: Write the catalogue page**

Create `apps/playground/app/ui/catalogue.tsx`:

```tsx
import type { DemoEntry } from "@lemol/ui-remix/demos"
import { css, type Handle } from "remix/ui"

export interface CataloguePageProps {
  entry: DemoEntry
}

const page = css({
  maxWidth: "var(--page-max)",
  margin: "0 auto",
  padding: "var(--sp-8) var(--gutter)",
})

const heading = css({
  fontSize: "var(--fs-2xl)",
  marginBlockEnd: "var(--sp-6)",
})

/**
 * The frame around a demo: a title and the demo's own markup. Knobs, the
 * switcher form and the component index are task 19 — this route exists now so
 * that Button's contract is provable in a real document.
 */
export function CataloguePage(handle: Handle<CataloguePageProps>) {
  return () => {
    const { title, Demo } = handle.props.entry
    return (
      <main mix={page}>
        <h1 mix={heading}>{title}</h1>
        <Demo />
      </main>
    )
  }
}
```

- [ ] **Step 6: Add the route**

In `apps/playground/app/routes.ts`:

```ts
export const routes = route({
  home: get("/"),
  component: get("/c/:component"),
  assets: get("/assets/*path"),
})
```

- [ ] **Step 7: Add the action**

In `apps/playground/app/actions/controller.tsx`, add the imports:

```tsx
import { demos, isDemoName } from "@lemol/ui-remix/demos"
import { CataloguePage } from "../ui/catalogue.tsx"
```

And the action, after `home`:

```tsx
    /**
     * The catalogue. Scheme and density are query params rather than client
     * state, because rendering is server-side: `?scheme=dark&density=compact`
     * is a full proof of both variant axes with no JavaScript in the page.
     *
     * Both are allow-listed rather than passed through. An attribute value
     * that no selector matches is a silent no-op, so an unrecognised one
     * should render nothing rather than look like it did something.
     */
    async component(context) {
      const name = context.params.component
      if (!isDemoName(name)) return new Response("Not Found", { status: 404 })

      const params = context.url.searchParams
      const scripts = !params.has("nojs")
      const scheme = params.get("scheme")
      const density = params.get("density")

      return context.render(
        <Document
          density={density === "compact" ? density : undefined}
          entry={scripts ? await assetServer.getScriptEntry(browserEntry) : null}
          scheme={scheme === "dark" || scheme === "light" ? scheme : undefined}
          title={demos[name].title}
        >
          <CataloguePage entry={demos[name]} />
        </Document>,
      )
    },
```

- [ ] **Step 8: Run the gate**

```sh
bun run check
```

Expected: PASS. Two existing tests to watch: `apps/playground/app/ui/home.test.tsx` renders `HomePage` alone and is unaffected, and `router.test.tsx`'s `/?nojs` case asserts no `<script>` — `ThemeStyle` emits a `<style>`, so it stays green.

- [ ] **Step 9: See it in a browser**

```sh
bun run playground
```

Open each and confirm the button actually looks right — the tests prove the tokens are wired, not that the design is any good:

- `http://localhost:3000/c/button`
- `http://localhost:3000/c/button?scheme=dark`
- `http://localhost:3000/c/button?density=compact`
- `http://localhost:3000/c/button?nojs&scheme=dark&density=compact`

Check hover on each tone, keyboard focus showing the reset's ring, and the disabled button. Then stop the server.

- [ ] **Step 10: Commit**

```sh
git add apps/playground packages/ui-remix/src/demos.ts
git commit -F - <<'EOF'
Render the catalogue at /c/:component

A real registry-backed route rather than a throwaway /c/button, so task
19 adds demos to it instead of replacing it. Scheme and density are
query params, because rendering is server-side: both variant axes are
provable with no JavaScript in the page. Both are allow-listed, since an
attribute value no selector matches is a silent no-op.

ThemeStyle goes first in head, with the reason on the element and the
ordering asserted against remix's own injected styles.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 8: Correct the documents and close the task

The spec found two claims in `docs/design-system.md` that are wrong and one rule that now has a stated exception. A document that disagrees with the code is worse than no document.

**Files:**
- Modify: `docs/design-system.md:12-13`, `:137-148`, and the semantic-tone paragraph at `:54-60`
- Modify: `packages/ui-design/README.md`, `packages/ui-remix/README.md`, `packages/ui-remix-mini/README.md`
- Modify: `todo/TODO.md`
- Move: `todo/m1-foundation-and-contract-proof/12-*.md` → `todo/done/m1-foundation-and-contract-proof/`

- [ ] **Step 1: Correct the delivery section**

In `docs/design-system.md`, replace the claim at `:143-146` that a body `<style>` works with no special casing. The replacement says where it goes and why:

````markdown
`ThemeStyle` renders the emitted sheet, and it belongs in `<head>`:

```tsx
<ThemeStyle theme={miniTheme} />
```

**The placement is load-bearing.** `remix/ui` collects every `css({...})` rule
and splices the resulting `<style>` elements in immediately before `</head>` —
after all authored head content, before anything in the body. A `ThemeStyle` in
the body is therefore evaluated after `@layer rmx.*` already exists, and
`@layer base, rmx;` then registers `base` at the *end* of the order rather than
the front, because a layer statement cannot move a layer that exists. Element
defaults start beating components, with no error at all.

A `<style>` element in the body is valid CSS and does apply document-wide; it
is the layer order, not the stylesheet, that body placement breaks.

A runtime assertion cannot catch it. `ThemeStyle` renders during the tree walk
and remix injects its style elements afterwards, so at render time there is no
remix style element to detect. The guard is a render test asserting that
`@layer base, rmx;` precedes the first `data-rmx-style` in the document.

`emitTokensCss()` stays exported for anyone who prefers a static file, and
`layerStatement` is exported separately for an SPA that wants the statement in
`index.html` and the token blocks in the app tree.
````

Keep the paragraphs that follow at `:150-176` — the template-literal escaping
traps, the emitter's character ban and `schemeBootScript` — unchanged.

- [ ] **Step 2: Record the `danger-hover` line**

In the semantic-tones paragraph around `:54-60`, add after the existing text:

```markdown
**Interactive colours get a `-hover`; status colours do not.** `accent`, `link`
and `danger` are the colours something hovers, so each names its own hover
value. `success`, `warning` and `info` are read on static elements — a badge,
not a button — and get none until something needs one. A component deriving a
hover from a fill is the same violation as deriving a subtle from a tone.
```

- [ ] **Step 3: Note the border-width exception**

After the component-token example at `:12-22`, add:

```markdown
A default that cannot name a primitive is an exception, not a pattern.
`--ui-btn-border-width: 1px` is the only one at present: `hairline` is a
colour, there is no border-width primitive, and one property does not justify
widening a schema every theme has to satisfy. The exception is allow-listed in
`ui-remix/src/tokens.test.ts` rather than tolerated, so adding a second one
means editing a list and arguing for it.
```

- [ ] **Step 4: Fill in `ui-remix`'s catalogue and status**

READMEs state what is true now, in the present tense, with **no task numbers** —
those belong in specs, plans and commits. So each `Status` section below loses
its task reference as well as gaining content.

In `packages/ui-remix/README.md`, replace the placeholder `## Catalogue` body
at `:23-24`:

````markdown
### `Button` / `LinkButton`

`Button` renders a `<button>`, defaulting `type` to `"button"` because a bare
button inside a form submits it. `LinkButton` renders an `<a>` and requires
`href`: `aria-disabled` on an anchor does not prevent navigation, so a disabled
link is a broken link.

Two axes, thirty-one tokens in `button/tokens.ts`:

| Axis | Values | Comes from |
| --- | --- | --- |
| `tone` | `primary`, `neutral`, `ghost`, `danger` | `--ui-btn-<tone>-{bg,ink,border,bg-hover}` |
| `size` | `md`, `sm` | `--control-h` and `--control-h-sm`, so density reaches it |

Neither component styles focus. The reset owns the ring, and it applies because
nothing in the component competes with it. `:active` reuses the hover
background. Disabled is three tone-independent tokens rather than an opacity
ratio.

Tone backgrounds use the `background` shorthand, so a skin may set
`--ui-btn-<tone>-bg` to a gradient — `background-color` would drop a gradient
as invalid. Gradients do not interpolate, so a gradient skin swaps instantly on
hover while the flat default transitions.

### `ThemeStyle`

Renders `emitTokensCss()`'s string into the document, defaulting to this
package's aggregate:

```tsx
<ThemeStyle theme={miniTheme} />
```

**It belongs in `<head>`.** `remix/ui` splices its own component styles in
immediately before `</head>`, so a `ThemeStyle` in the body is evaluated after
the `rmx` layer exists — and `@layer base, rmx;` then registers `base` after
it, inverting the order with no error. See
[design-system.md](../../docs/design-system.md#delivery).
````

Then replace the `## Status` section at `:66-69`:

````markdown
## Status

`Button`, `LinkButton` and `ThemeStyle` ship. `src/tokens.ts` aggregates the
component records and exports `ComponentTokenName`; `src/demos.ts` registers
one demo. `runtime.ts` and `compat.ts` are still stubs — nothing here needs
client JavaScript yet.
````

- [ ] **Step 5: Fill in `ui-remix-mini`'s status and the literal-keys rule**

In `packages/ui-remix-mini/README.md`, add to the `## Limits` list, after the
"adds no component tokens of its own" entry:

````markdown
- **Write every `ui-*` override as a literal key in the `defineTheme` call.**
  Excess property checking only fires on object literals, so an override moved
  behind a spread or a referenced object is not checked at all — and the rename
  check then passes on a token name that no longer exists, surfacing as an
  unstyled control instead of a compiler error. `theme.test.ts` pins this with a
  `@ts-expect-error` whose directive goes unused the day it stops working.
````

And replace `## Status` at `:41-43`:

````markdown
## Status

`miniTheme` ships: ninety-six primitives, a `dark` axis and the four-token
`compact` swap. Warm-grey neutrals, a deep teal accent, and a focus hue
deliberately unlike the accent so the ring reads on an accent-filled button.

The shell — `Document`, `AppShell`, `Nav`, `EmptyState`, `ErrorState` — is not
written yet.
````

- [ ] **Step 6: Note the hover rule in `ui-design`'s README**

Read `packages/ui-design/README.md` first: if it lists the colour group's names,
add `danger-hover` there. Either way, add this to whichever section describes
the schema's colour names:

````markdown
Interactive colours name their own hover value — `accent-hover`, `link-hover`,
`danger-hover`. Status colours do not: `success`, `warning` and `info` are read
on static elements, and a component deriving a hover from a fill is the
violation the two-tier split exists to prevent.
````

- [ ] **Step 7: Run the gate**

```sh
bun run check
```

Expected: PASS. Biome checks Markdown formatting too.

- [ ] **Step 8: Close the task**

Add `completed_at` to the task's frontmatter, move it into `done/`, and drop its line from `todo/TODO.md`:

```sh
F=todo/m1-foundation-and-contract-proof/12-contract-proof-button-through-all-three-packages.md
sed -i '' "s|^depends_on: \[7, 11\]$|depends_on: [7, 11]\ncompleted_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)|" "$F"
git mv "$F" todo/done/m1-foundation-and-contract-proof/
```

Then remove line 5 of `todo/TODO.md` — the `- [ ] [12 - Contract proof: …]` entry.

- [ ] **Step 9: Verify every "done when" is actually met**

Re-read the three criteria in the task file and confirm each has a green test:

1. Renaming a token in `button/tokens.ts` fails `bun run typecheck` at `mini`'s theme — Task 5, step 6, plus the `@ts-expect-error` fixture.
2. Overriding `ui-btn-primary-bg` with a gradient changes the rendered button with no edit to `button.tsx` — `theme.test.ts`, "takes a gradient for a tone background".
3. `/c/button` renders in light, dark and compact with the runtime absent — `router.test.tsx`, "renders light, dark and compact with no client JavaScript".

```sh
bun run check
```

- [ ] **Step 10: Commit**

```sh
git add docs/design-system.md packages/*/README.md todo/
git commit -F - <<'EOF'
Correct the documents and close task 12

design-system.md said a ThemeStyle in the body needed no special casing.
The stylesheet does not, but the layer order does: remix injects its own
styles at the end of head, so a body sheet's layer statement registers
`base` after `rmx` and element defaults start beating components.

Also records the interactive-versus-status line that danger-hover draws,
and the border-width exception to "every default names a primitive",
which is allow-listed in a test rather than quietly tolerated.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

## Notes for the implementer

**Things that will bite.**

- `exactOptionalPropertyTypes: true` means `foo?: T` rejects an explicit
  `undefined`. Every optional prop in this plan is written `?: T | undefined`
  for that reason. If a host element prop rejects `undefined`, use a
  conditional spread for that one attribute.
- `componentTokens` must use `satisfies Record<string, string>`, never a type
  annotation. An annotation widens `ComponentTokenName` to `string` and every
  type-level proof in Task 5 passes while proving nothing. Task 2 step 6 checks
  this deliberately.
- Excess property checking fires on a literal's explicitly written keys even
  when the literal also spreads — but not on keys behind a reference. That is
  why `miniTheme`'s `ui-*` override is written inline in the `defineTheme` call
  and not folded into `basePrimitives`.
- `background`, not `background-color`, for anything a skin might set to a
  gradient. This applies to every future component token named `-bg`.
- Do not reach for `remix/ui/button`. It is a styling mixin carrying its own
  font, colours and sizes; it cannot read the contract. The native-first ladder
  ranks behaviour primitives, and a `<button>` needs no behaviour.

**Order.** Tasks are sequential: 2 needs 1, 3 and 4 need 2, 5 needs 1 through
4, 6 needs 3, 7 needs 4 through 6, 8 needs all of them.
