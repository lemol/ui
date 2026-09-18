# ui-design/css Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land `@lemol/ui-design/css` — `emitTokensCss()`, the cascade-layer
statement, the element defaults, the reduced-motion reset and
`schemeBootScript` — M1 task 11.

**Architecture:** Three constant modules and one function. `layers.ts` and
`reset.ts` are static text; `reset.ts` derives its reduced-motion block from
`schema.motion` so no second list of duration names can drift. `boot.ts` is a
string of DOM code and the two storage keys it reads. `emit.ts` is the only
module that knows what a `Theme` is: it validates, then concatenates. Output is
a string, never a component, so the package stays shareable by a renderer with
no DOM.

**Tech Stack:** TypeScript 7 (no build step — packages ship `src/` directly),
`bun:test`, Biome for lint and format. No runtime dependencies.

**Spec:** [`docs/superpowers/specs/2026-09-18-ui-design-css-emitter-design.md`](../specs/2026-09-18-ui-design-css-emitter-design.md)

## Global Constraints

- **No values in this package.** No colour, pixel count, duration or curve may
  appear in `packages/ui-design/src/`, and the reset spends no literal length
  or duration — `reset.test.ts` pins that with `/\d+(px|rem|em|ms|s)\b/`.
  `0ms` in the reduced-motion block is the absence of a duration, not a value.
- **No dependencies.** Not `remix`, not anything.
- **SPA-safe.** No `node:*`, no `bun`, no `effect`, no server-side `remix/*`
  import. `test/boundaries.test.ts` enforces this and already names
  `ui-design/src/css/emit.ts` in its fixtures.
- **No build step.** Ship TypeScript from `src/`. Do not add a bundler.
- **Nothing a `<style>` element escapes.** No backtick, `<`, `>`, `&`, `{` or
  `}` in any emitted value — and therefore **no CSS nesting and no child
  combinator anywhere in the sheet**, comments included.
- **Import style:** explicit `.ts` extensions (`from "./reset.ts"`), double
  quotes, no semicolons, 2-space indent, 100-column lines. `bun run fix`
  applies it.
- **The gate for every change is `bun run check`** — lint, then typecheck, then
  test. A task is not done until it is green.

## File Structure

| File | Responsibility |
| --- | --- |
| `packages/ui-design/src/tokens.ts` | Modified: two names added — `scheme-mode` (color) and `focus-ring-offset` (elevation), taking the schema to 95 |
| `packages/ui-design/src/css/layers.ts` | `layerStatement`, and `base()` to wrap rules in the layer |
| `packages/ui-design/src/css/reset.ts` | `resetCss`, `unlayeredCss`, `reducedMotionCss` |
| `packages/ui-design/src/css/reset.test.ts` | Layer containment, token references, no literals, no nesting, reduced motion against `schema.motion` |
| `packages/ui-design/src/css/boot.ts` | `schemeBootScript`, `schemeStorageKey`, `densityStorageKey` |
| `packages/ui-design/src/css/boot.test.ts` | The script run against a stub document and a failing storage |
| `packages/ui-design/src/css/emit.ts` | `emitTokensCss()`, `EmitOptions`: validation then composition |
| `packages/ui-design/src/css/emit.test.ts` | Block order, precedence, axes, validation, whole-sheet safety |
| `packages/ui-design/src/css/index.ts` | The `/css` barrel. Modified — currently `export {}` |
| `test/packages.test.ts` | Modified: the base entry carries no `./css` specifier |
| `docs/design-system.md` | Modified: `scheme-mode`, the boot-script split, the layer-order hazard, the emit-time throw |
| `docs/motion.md` | Modified: reduced motion is token zeroing |
| `docs/architecture.md` | Modified: `schemeBootScript`, and `reset.ts` also holds the reduced-motion block |
| `packages/ui-design/README.md` | Modified: the entry table and "Status" |
| `todo/TODO.md`, `todo/m1-…/11-….md` | Modified: close task 11 |

**All source in this plan has been compiled and run against the repo's real
`tsconfig.json` and `bun test` before being written down** — `bun run check`
green at 89 tests, including Biome's formatting. Type it as given rather than
improving it; two places where the obvious simplification breaks are called out
where they appear.

---

### Task 1: The two schema names, the layer statement and the reset

**Files:**
- Modify: `packages/ui-design/src/tokens.ts:18` (the `color` group) and `:105`
  (the `elevation` group)
- Create: `packages/ui-design/src/css/layers.ts`
- Create: `packages/ui-design/src/css/reset.ts`
- Test: `packages/ui-design/src/css/reset.test.ts`

**Interfaces:**
- Consumes: `schema` from `../tokens.ts` (landed in task 10).
- Produces: `layerStatement: string` and `base(rules: string): string` from
  `./layers.ts`; `resetCss`, `unlayeredCss` and `reducedMotionCss`, all
  `string`, from `./reset.ts`. Task 3 concatenates all four.

- [ ] **Step 1: Write the failing test**

Create `packages/ui-design/src/css/reset.test.ts`:

```ts
import { describe, expect, it } from "bun:test"
import { primitiveNames, schema } from "../tokens.ts"
import { reducedMotionCss, resetCss, unlayeredCss } from "./reset.ts"

const durationNames = schema.motion.filter((name) => name.startsWith("dur-"))

describe("the reset", () => {
  it("keeps every element default inside the base layer", () => {
    expect(resetCss.startsWith("@layer base {")).toBe(true)
    expect(resetCss.endsWith("}")).toBe(true)
    expect(resetCss.slice("@layer base {".length, -1)).not.toContain("@layer")
  })

  it("wires bare elements to tokens at zero specificity", () => {
    for (const selector of [
      ":where(a)",
      ":where(a:visited)",
      ":where(a:hover)",
      ":where(:focus-visible)",
    ]) {
      expect(resetCss).toContain(`${selector} {`)
    }
  })

  it("references only tokens the schema names", () => {
    // A typo here resolves to nothing at all: no error, no warning, no style.
    const referenced = [...resetCss.matchAll(/var\(--([\w-]+)\)/g)].map((match) => match[1] ?? "")
    const names: readonly string[] = primitiveNames
    expect(referenced.length).toBeGreaterThan(0)
    for (const name of referenced) expect(names).toContain(name)
  })

  it("takes color-scheme from a token, so the emitter needs no rule for it", () => {
    expect(resetCss).toContain("color-scheme: var(--scheme-mode);")
  })

  it("spends no literal length or duration", () => {
    expect(resetCss).not.toMatch(/\d+(px|rem|em|ms|s)\b/)
  })

  it("uses no nesting and no child combinator", () => {
    // Both characters are escaped inside a style element, so a nested rule or a
    // child combinator would ship broken.
    expect(resetCss).not.toContain("&")
    expect(resetCss).not.toContain(">")
  })
})

describe("the unlayered rule", () => {
  it("makes element.hidden beat a component's own display rule", () => {
    expect(unlayeredCss).toContain("[hidden] {\n  display: none !important;\n}")
    expect(unlayeredCss).not.toContain("@layer")
  })
})

describe("the reduced-motion reset", () => {
  it("zeroes every duration the schema names", () => {
    expect(durationNames.length).toBeGreaterThan(0)
    for (const name of durationNames) {
      expect(reducedMotionCss).toContain(`--${name}: 0ms !important;`)
    }
  })

  it("zeroes the durations and nothing else", () => {
    const zeroed = [...reducedMotionCss.matchAll(/--([\w-]+): 0ms/g)].map((match) => match[1] ?? "")
    expect(zeroed).toEqual([...durationNames])
  })

  it("scopes itself to the reduce preference", () => {
    expect(reducedMotionCss.startsWith("@media (prefers-reduced-motion: reduce) {")).toBe(true)
  })
})
```

`const names: readonly string[] = primitiveNames` is not redundant. Without it,
`expect(primitiveNames).toContain(name)` fails to typecheck: `toContain` takes
the array's element type, which is the 95-name union, not `string`.

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test packages/ui-design/src/css/reset.test.ts`
Expected: FAIL — `Cannot find module './reset.ts'`.

- [ ] **Step 3: Add the two schema names**

In `packages/ui-design/src/tokens.ts`, make `"scheme-mode"` the first entry of
the `color` group:

```ts
  color: [
    // The value `color-scheme` takes, so the emitter needs no rule of its own:
    // a theme says `light` in `base` and `dark` in its dark axis, and the axis
    // carries it like any other name. Emitter logic cannot replace it, because
    // a dark-only theme has no dark axis to infer from.
    "scheme-mode",
    "canvas",
```

and extend `elevation`:

```ts
  // `focus-ring` holds the whole `outline` shorthand. `outline-offset` is a
  // separate property that cannot be folded into it, so it gets its own name
  // rather than a literal in the reset or a borrowed space step.
  elevation: ["shadow-sm", "shadow-md", "shadow-lg", "focus-ring", "focus-ring-offset"],
```

- [ ] **Step 4: Write `layers.ts`**

```ts
/**
 * The cascade-layer setup.
 *
 * remix/ui emits every css({...}) rule into the `rmx` layer, and unlayered CSS
 * beats layered CSS regardless of specificity — so an element default has to
 * sit in a layer ordered before `rmx`, or it overrides the components it is
 * supposed to lose to.
 *
 * Layer order is fixed by the first @layer statement the browser sees. If
 * remix's stylesheet is evaluated first, `rmx` already exists and this
 * statement appends `base` after it, inverting the order with no error. The
 * emitted sheet therefore has to reach the document before remix's styles do.
 */
export const layerStatement = "@layer base, rmx;"

/** Wraps already-indented rules in the `base` layer. */
export function base(rules: string): string {
  return `@layer base {\n${rules}\n}`
}
```

- [ ] **Step 5: Write `reset.ts`**

```ts
import { schema } from "../tokens.ts"
import { base } from "./layers.ts"

/**
 * Element defaults, in @layer base.
 *
 * A rule is admitted here only if it is cross-browser normalization with no
 * aesthetic content, or it wires a bare element to the token contract at zero
 * specificity through :where(). Anything that needs a literal number gets a
 * token name or does not ship — which is what keeps a package holding no
 * values from growing a look.
 *
 * No CSS nesting, ever. The sheet ships as the text of a style element, where
 * the renderer escapes the ampersand, so a nested rule arrives broken. The
 * grouped selectors below are flat :where() lists for that reason, and the
 * same rule bans the child combinator.
 */
export const resetCss = base(`  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    -webkit-text-size-adjust: 100%;
    color-scheme: var(--scheme-mode);
  }

  body {
    margin: 0;
    background: var(--canvas);
    color: var(--ink);
    font-family: var(--font-sans);
    font-size: var(--fs-md);
    line-height: var(--lh-base);
  }

  /* The layout components own spacing, and a default margin fighting gap is
     the first thing that goes wrong once they arrive. */
  :where(h1, h2, h3, h4, h5, h6, p, figure, blockquote, dl, dd) {
    margin: 0;
  }

  :where(h1, h2, h3, h4, h5, h6) {
    font-weight: var(--fw-bold);
    letter-spacing: var(--tr-tight);
    line-height: var(--lh-tight);
  }

  :where(img, svg, video, canvas) {
    display: block;
    max-width: 100%;
  }

  :where(code, kbd, samp, pre) {
    font-family: var(--font-mono);
  }

  :where(button, input, select, textarea, optgroup) {
    font: inherit;
    color: inherit;
  }

  :where(table) {
    border-collapse: collapse;
  }

  :where(a) {
    color: var(--link);
    text-decoration: underline;
  }

  :where(a:visited) {
    color: var(--link);
  }

  :where(a:hover) {
    color: var(--link-hover);
  }

  :where(:focus-visible) {
    outline: var(--focus-ring);
    outline-offset: var(--focus-ring-offset);
  }

  ::selection {
    background: var(--accent-subtle);
    color: var(--ink);
  }`)

/**
 * The one rule that is deliberately unlayered.
 *
 * Unlayered CSS outranks every layer, rmx included. The user agent's own
 * [hidden] rule does not: it loses to any author display declaration, and most
 * components set one — so without this, toggling element.hidden from a runtime
 * silently does nothing.
 */
export const unlayeredCss = `/* Deliberately unlayered: this has to beat a component's own display rule.
   See reset.ts for why. */
[hidden] {
  display: none !important;
}`

const durationNames = schema.motion.filter((name) => name.startsWith("dur-"))

/**
 * The global reduced-motion reset, derived from the schema rather than a second
 * list of duration names that can drift.
 *
 * Zeroing the tokens reaches everything the contract covers, including the
 * view-transition pseudo-elements that a universal selector cannot match. It
 * leaves CSS that hard-codes a duration animating, which is a violation of the
 * token contract and better found than masked.
 *
 * The declarations carry !important because this block selects :root while the
 * density block selects :root[data-density="compact"] — higher specificity. A
 * theme with a duration in its compact axis would otherwise keep animating.
 */
export const reducedMotionCss = `@media (prefers-reduced-motion: reduce) {
  :root {
${durationNames.map((name) => `    --${name}: 0ms !important;`).join("\n")}
  }
}`
```

The leading two spaces inside `` base(`  *, `` are load-bearing: `base()` does
not indent, so the rules arrive pre-indented one level.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `bun test packages/ui-design/src/css/reset.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 7: Run the gate**

Run: `bun run check`
Expected: Biome clean, `tsc` silent, every test passing. If Biome reformats,
run `bun run fix` and re-run.

- [ ] **Step 8: Commit**

```bash
git add packages/ui-design/src/tokens.ts packages/ui-design/src/css/layers.ts \
        packages/ui-design/src/css/reset.ts packages/ui-design/src/css/reset.test.ts
git commit -m "Add the layer statement and the element defaults"
```

---

### Task 2: The boot script

**Files:**
- Create: `packages/ui-design/src/css/boot.ts`
- Test: `packages/ui-design/src/css/boot.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `schemeBootScript: string`, `schemeStorageKey: "lemol-ui:scheme"`,
  `densityStorageKey: "lemol-ui:density"`. Task 19's switchers write those keys;
  `ui-remix` concatenates the script with its enhanced-marker stamp.

- [ ] **Step 1: Write the failing test**

Create `packages/ui-design/src/css/boot.test.ts`:

```ts
import { describe, expect, it } from "bun:test"
import { densityStorageKey, schemeBootScript, schemeStorageKey } from "./boot.ts"

/**
 * Runs the boot script against a stub document and storage.
 *
 * The script has to run before any framework does, so it is plain DOM code in
 * a string rather than a module. A stub is enough to prove what it reads, what
 * it refuses to write, and that it survives storage throwing — none of which
 * needs a browser.
 */
function boot(store: Record<string, string>, failing = false): Record<string, string> {
  const attributes: Record<string, string> = {}
  const document = {
    documentElement: {
      setAttribute(name: string, value: string) {
        attributes[name] = value
      },
    },
  }
  const localStorage = {
    getItem(key: string): string | null {
      if (failing) throw new Error("access denied")
      return store[key] ?? null
    },
  }
  new Function("document", "localStorage", schemeBootScript)(document, localStorage)
  return attributes
}

describe("schemeBootScript", () => {
  it("restores a remembered scheme and density", () => {
    expect(boot({ [schemeStorageKey]: "dark", [densityStorageKey]: "compact" })).toEqual({
      "data-scheme": "dark",
      "data-density": "compact",
    })
  })

  it("restores a manual light choice, which the sheet's guard needs to see", () => {
    expect(boot({ [schemeStorageKey]: "light" })).toEqual({ "data-scheme": "light" })
  })

  it("sets nothing when nothing is remembered", () => {
    expect(boot({})).toEqual({})
  })

  it("writes nothing for the default density", () => {
    expect(boot({ [densityStorageKey]: "comfortable" })).toEqual({})
  })

  it("refuses a value outside the allow-list", () => {
    // Otherwise a stale or hand-edited entry lands in a root attribute verbatim.
    expect(boot({ [schemeStorageKey]: "solarized" })).toEqual({})
  })

  it("survives storage that refuses to be read", () => {
    // A private window can throw on getItem, and that must not take the page down.
    expect(() => boot({}, true)).not.toThrow()
  })

  it("stamps no enhanced marker", () => {
    expect(schemeBootScript).not.toContain("enhanced")
  })

  it("ships as one line with nothing a document would escape", () => {
    expect(schemeBootScript).not.toContain("\n")
    for (const character of ["`", "<", ">", "&"]) {
      expect(schemeBootScript).not.toContain(character)
    }
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test packages/ui-design/src/css/boot.test.ts`
Expected: FAIL — `Cannot find module './boot.ts'`.

- [ ] **Step 3: Write `boot.ts`**

```ts
/** Where a remembered scheme choice lives. Exported so the switcher that writes it cannot drift. */
export const schemeStorageKey = "lemol-ui:scheme"

/** Where a remembered density choice lives. */
export const densityStorageKey = "lemol-ui:density"

const statements = [
  "var r=document.documentElement",
  `var s=localStorage.getItem("${schemeStorageKey}")`,
  `var d=localStorage.getItem("${densityStorageKey}")`,
  'if(s==="light"||s==="dark")r.setAttribute("data-scheme",s)',
  'if(d==="compact")r.setAttribute("data-density","compact")',
]

/**
 * Restores the remembered scheme and density before the first paint.
 *
 * Inlined in the document — head on the server, index.html in SPA mode — ahead
 * of the stylesheet, so a remembered choice applies to the first paint instead
 * of flashing the default and reflowing.
 *
 * The values are allow-listed rather than written through, so a stale or
 * hand-edited storage entry cannot put arbitrary text into a root attribute.
 * The try/catch is because a private window that refuses localStorage must not
 * take the page down. A missing key and "comfortable" both mean set nothing:
 * the base theme is the default, so there is no third state to represent.
 *
 * It stamps no enhanced marker. That belongs to the package that knows what a
 * component is, and it concatenates this script rather than replacing it.
 */
export const schemeBootScript = `(function(){try{${statements.join(";")}}catch(e){}})()`
```

The statements are an array joined with `;` rather than one long literal only
because a single line exceeds the 100-column limit and a string cannot be
wrapped.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun test packages/ui-design/src/css/boot.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Run the gate**

Run: `bun run check`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add packages/ui-design/src/css/boot.ts packages/ui-design/src/css/boot.test.ts
git commit -m "Add the no-flash scheme and density restore"
```

---

### Task 3: The emitter and the `/css` barrel

**Files:**
- Create: `packages/ui-design/src/css/emit.ts`
- Test: `packages/ui-design/src/css/emit.test.ts`
- Modify: `packages/ui-design/src/css/index.ts` (currently `export {}`)
- Modify: `test/packages.test.ts:61` — add the barrel test above
  `test("pins remix to the version the root declares", …)`

**Interfaces:**
- Consumes: `Theme` from `../theme.ts`, `primitiveNames` from `../tokens.ts`,
  `layerStatement` from `./layers.ts`, and `resetCss` / `unlayeredCss` /
  `reducedMotionCss` from `./reset.ts`.
- Produces:
  `emitTokensCss<C extends string = never>(theme: Theme<C>, options?: EmitOptions<C>): string`
  and `interface EmitOptions<C extends string = never> { readonly componentTokens?: Readonly<Record<C, string>> }`.
  Task 12's `ThemeStyle` and `ui-remix/src/tokens.ts` consume both.

- [ ] **Step 1: Write the failing test**

Create `packages/ui-design/src/css/emit.test.ts`:

```ts
import { describe, expect, it } from "bun:test"
import { defineTheme } from "../theme.ts"
import { type PrimitiveTokens, primitiveNames } from "../tokens.ts"
import { emitTokensCss } from "./emit.ts"

/** A complete theme whose every value names itself, so a declaration is traceable. */
function fullBase(overrides: Record<string, string> = {}): PrimitiveTokens {
  const entries: [string, string][] = primitiveNames.map((name) => [
    name,
    overrides[name] ?? `val-${name}`,
  ])
  return Object.fromEntries(entries) as PrimitiveTokens
}

const threeAxes = defineTheme({
  base: fullBase(),
  dark: { canvas: "dark-canvas" },
  compact: { "row-h": "compact-row" },
})

const sheet = emitTokensCss(threeAxes)
const at = (needle: string) => sheet.indexOf(needle)

describe("the sheet", () => {
  it("opens with the layer statement", () => {
    // Layer order is fixed by the first @layer statement the browser sees, so
    // nothing may precede it.
    expect(sheet.startsWith("@layer base, rmx;\n")).toBe(true)
  })

  it("emits the blocks in the documented order", () => {
    expect(at(":root {")).toBeGreaterThan(at("@layer base, rmx;"))
    expect(at("@media (prefers-color-scheme: dark)")).toBeGreaterThan(at(":root {"))
    expect(at(':root[data-scheme="dark"]')).toBeGreaterThan(at("@media (prefers-color-scheme"))
    expect(at(':root[data-density="compact"]')).toBeGreaterThan(at(':root[data-scheme="dark"]'))
    expect(at("@layer base {")).toBeGreaterThan(at(':root[data-density="compact"]'))
    expect(at("[hidden] {")).toBeGreaterThan(at("@layer base {"))
    expect(at("@media (prefers-reduced-motion: reduce)")).toBeGreaterThan(at("[hidden] {"))
  })

  it("guards the media block so a manual choice beats the system preference", () => {
    expect(sheet).toContain(
      '@media (prefers-color-scheme: dark) {\n  :root:not([data-scheme="light"]) {\n',
    )
    expect(sheet).toContain(':root[data-scheme="dark"] {\n  --canvas: dark-canvas;\n}')
  })

  it("declares primitives in schema order", () => {
    expect(at("--scheme-mode:")).toBeLessThan(at("--canvas:"))
    expect(at("--canvas:")).toBeLessThan(at("--sp-0:"))
    expect(at("--sp-0:")).toBeLessThan(at("--focus-ring-offset:"))
  })

  it("carries nothing a style element would escape", () => {
    for (const character of ["`", "<", ">", "&"]) {
      expect(sheet).not.toContain(character)
    }
  })

  it("ends with a single newline", () => {
    expect(sheet.endsWith("}\n")).toBe(true)
  })
})

describe("component tokens", () => {
  const themed = defineTheme<"ui-btn-bg">({
    base: { ...fullBase(), "ui-btn-bg": "theme-value" },
  })
  const overridden = emitTokensCss(themed, {
    componentTokens: { "ui-btn-bg": "component-default" },
  })

  it("writes the component default first and the theme value second", () => {
    // Same selector, same specificity: the theme wins on source order alone.
    const defaultAt = overridden.indexOf("--ui-btn-bg: component-default;")
    const themeAt = overridden.indexOf("--ui-btn-bg: theme-value;")
    expect(defaultAt).toBeGreaterThan(-1)
    expect(themeAt).toBeGreaterThan(defaultAt)
    expect(themeAt).toBeLessThan(overridden.indexOf("@layer base {"))
  })

  it("puts a theme's component overrides after its primitives", () => {
    expect(overridden.indexOf("--ui-btn-bg: theme-value;")).toBeGreaterThan(
      overridden.indexOf("--focus-ring-offset:"),
    )
  })

  it("needs none", () => {
    expect(emitTokensCss(threeAxes)).toContain(":root {\n  --scheme-mode:")
  })
})

describe("the variant axes", () => {
  it("omits both when the theme has neither", () => {
    const single = emitTokensCss(defineTheme({ base: fullBase() }))
    expect(single).not.toContain("prefers-color-scheme")
    expect(single).not.toContain("data-scheme")
    expect(single).not.toContain("data-density")
  })

  it("omits an axis a theme declared empty", () => {
    const empty = emitTokensCss(defineTheme({ base: fullBase(), dark: {}, compact: {} }))
    expect(empty).not.toContain("prefers-color-scheme")
    expect(empty).not.toContain("data-density")
  })
})

describe("emitTokensCss", () => {
  it("throws on a value that cannot ship inside a style element", () => {
    // A raw SVG data URL is the realistic case: legal CSS, fatal here.
    const theme = defineTheme({ base: fullBase({ canvas: 'url("data:image/svg+xml,<svg/>")' }) })
    expect(() => emitTokensCss(theme)).toThrow("theme.base: canvas contains <")
  })

  it("throws on an unsafe value in a variant axis", () => {
    const theme = defineTheme({ base: fullBase(), dark: { canvas: "a & b" } })
    expect(() => emitTokensCss(theme)).toThrow("theme.dark: canvas contains &")
  })

  it("throws on an unsafe component token value", () => {
    expect(() =>
      emitTokensCss(defineTheme({ base: fullBase() }), {
        componentTokens: { "ui-btn-bg": "a > b" } as Record<never, string>,
      }),
    ).toThrow("componentTokens: ui-btn-bg contains >")
  })

  it("throws on a key that is neither a primitive nor a component token", () => {
    // The cast is the point: this is the typo the types already refuse, kept
    // loud for a theme built without them.
    const theme = defineTheme({ base: { ...fullBase(), canvass: "oops" } as PrimitiveTokens })
    expect(() => emitTokensCss(theme)).toThrow("theme.base: canvass is neither a primitive name")
  })

  it("throws, listing them, when base is missing primitives", () => {
    const partial = Object.fromEntries(
      Object.entries(fullBase()).filter(([name]) => name !== "canvas"),
    ) as PrimitiveTokens
    expect(() => emitTokensCss(defineTheme({ base: partial }))).toThrow(
      "theme.base is missing 1 primitives: canvas",
    )
  })

  it("reports every problem at once", () => {
    const theme = defineTheme({ base: fullBase({ canvas: "a<b", ink: "a&b" }) })
    const message = (() => {
      try {
        emitTokensCss(theme)
        return ""
      } catch (error) {
        return error instanceof Error ? error.message : ""
      }
    })()
    expect(message).toContain("canvas contains <")
    expect(message).toContain("ink contains &")
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test packages/ui-design/src/css/emit.test.ts`
Expected: FAIL — `Cannot find module './emit.ts'`.

- [ ] **Step 3: Write `emit.ts`**

```ts
import type { Theme } from "../theme.ts"
import { primitiveNames } from "../tokens.ts"
import { layerStatement } from "./layers.ts"
import { reducedMotionCss, resetCss, unlayeredCss } from "./reset.ts"

export interface EmitOptions<C extends string = never> {
  /** Every component's token record, aggregated by the package that owns the components. */
  readonly componentTokens?: Readonly<Record<C, string>>
}

type Entries = readonly (readonly [string, string])[]

/**
 * Characters that cannot survive the trip.
 *
 * The sheet ships as the text of a style element, where the renderer escapes
 * &, < and >: a value carrying one arrives as &amp; and its declaration dies
 * with no error and no warning. A backtick terminates the template literal if
 * anyone inlines the sheet in source. Braces would break out of the block the
 * declaration sits in.
 *
 * A semicolon stays legal: data:image/svg+xml;base64 needs it, and what a
 * first-party theme puts in its own values is its business. A raw SVG data URL
 * carries < and is therefore rejected — base64-encode it or use a file.
 */
const unsafeCharacter = /[`<>&{}]/

const primitiveSet: ReadonlySet<string> = new Set<string>(primitiveNames)
const rankOf = new Map<string, number>(primitiveNames.map((name, index) => [name, index]))

/** A record's string-valued entries, in schema order, ui- keys last. */
function entriesOf(values: object): Entries {
  const entries = Object.entries(values).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  )
  const at = (name: string) => rankOf.get(name) ?? primitiveNames.length
  return entries.sort(([a], [b]) => at(a) - at(b))
}

function declarations(entries: Entries, indent: string): string {
  return entries.map(([name, value]) => `${indent}--${name}: ${value};`).join("\n")
}

function rule(selector: string, entries: Entries): string {
  return `${selector} {\n${declarations(entries, "  ")}\n}`
}

function mediaRule(query: string, selector: string, entries: Entries): string {
  return `@media ${query} {\n  ${selector} {\n${declarations(entries, "    ")}\n  }\n}`
}

/**
 * Component defaults first, theme values second, under one selector at one
 * specificity. Later wins, so a theme's override of a component token beats the
 * component's own default on source order — no cascade-layer subtlety for
 * custom properties, and no import-order trap.
 */
function rootRule(componentTokens: Entries, base: Entries): string {
  const body = [declarations(componentTokens, "  "), declarations(base, "  ")]
    .filter((text) => text !== "")
    .join("\n")
  return `:root {\n${body}\n}`
}

function problemsIn(where: string, entries: Entries): string[] {
  return entries.flatMap(([name, value]) => {
    const found: string[] = []
    if (!primitiveSet.has(name) && !name.startsWith("ui-")) {
      found.push(`${where}: ${name} is neither a primitive name nor a ui- prefixed component token`)
    }
    const unsafe = `${name}${value}`.match(unsafeCharacter)?.[0]
    if (unsafe !== undefined) {
      found.push(`${where}: ${name} contains ${unsafe}, which cannot ship inside a style element`)
    }
    return found
  })
}

/**
 * Everything that would otherwise fail silently, failing loudly instead.
 *
 * A var() on an undeclared property resolves to nothing, so a missing primitive
 * is the cheapest mistake to make and the hardest to see. An unprefixed key
 * catches both a misspelled primitive and a component token written with its
 * leading dashes.
 */
function validate(componentTokens: Entries, base: Entries, dark: Entries, compact: Entries): void {
  const declared = new Set(base.map(([name]) => name))
  const missing = primitiveNames.filter((name) => !declared.has(name))
  const problems = [
    ...(missing.length === 0
      ? []
      : [`theme.base is missing ${missing.length} primitives: ${missing.join(", ")}`]),
    ...problemsIn("componentTokens", componentTokens),
    ...problemsIn("theme.base", base),
    ...problemsIn("theme.dark", dark),
    ...problemsIn("theme.compact", compact),
  ]
  if (problems.length > 0) {
    throw new Error(`emitTokensCss cannot emit this theme:\n${problems.join("\n")}`)
  }
}

/**
 * The whole stylesheet as text: the layer statement, the token blocks for each
 * variant axis the theme has, the element defaults, the one unlayered rule, and
 * the reduced-motion reset.
 *
 * It returns a string and never a component, which is what keeps this package
 * shareable by a renderer that has no DOM. The component that puts the text in
 * a document lives in the package that has JSX.
 *
 * The layer statement must be evaluated before remix/ui's own styles or the
 * layer order inverts; see layers.ts.
 */
export function emitTokensCss<C extends string = never>(
  theme: Theme<C>,
  options?: EmitOptions<C>,
): string {
  const componentTokens = entriesOf(options?.componentTokens ?? {})
  const base = entriesOf(theme.base)
  const dark = entriesOf(theme.dark ?? {})
  const compact = entriesOf(theme.compact ?? {})

  validate(componentTokens, base, dark, compact)

  const parts = [layerStatement, rootRule(componentTokens, base)]
  // The :not() guard is what lets a manual choice beat the media query; the
  // unguarded block is what lets a manual dark choice win on a light system.
  if (dark.length > 0) {
    parts.push(
      mediaRule("(prefers-color-scheme: dark)", ':root:not([data-scheme="light"])', dark),
      rule(':root[data-scheme="dark"]', dark),
    )
  }
  if (compact.length > 0) parts.push(rule(':root[data-density="compact"]', compact))
  parts.push(resetCss, unlayeredCss, reducedMotionCss)

  return `${parts.join("\n\n")}\n`
}
```

`entriesOf` takes `object` rather than a `Record` type on purpose. `Theme`'s
axes are mapped types with literal keys, which are not assignable to an index
signature, so a typed parameter would force a double cast at every call site;
`Object.entries` accepts any object and the type predicate in the filter does
the narrowing.

`rankOf.get(name) ?? primitiveNames.length` must not be `Infinity`:
`Infinity - Infinity` is `NaN`, which makes the comparator incoherent and loses
the insertion order of the `ui-` keys.

- [ ] **Step 4: Write the `/css` barrel**

Replace `packages/ui-design/src/css/index.ts`:

```ts
export { densityStorageKey, schemeBootScript, schemeStorageKey } from "./boot.ts"
export { type EmitOptions, emitTokensCss } from "./emit.ts"
export { layerStatement } from "./layers.ts"
export { reducedMotionCss, resetCss, unlayeredCss } from "./reset.ts"
```

- [ ] **Step 5: Pin that the base entry does not drag the emitter in**

In `test/packages.test.ts`, immediately above
`test("pins remix to the version the root declares", …)`:

```ts
// The subpath exists so that taking the schema does not mean taking the
// stylesheet with it, which one import in the barrel would quietly undo.
test("keeps the ui-design barrel clear of the css subpath", async () => {
  const barrel = await Bun.file(`${root}packages/ui-design/src/index.ts`).text()
  expect(barrel).not.toContain("./css")
})
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `bun test packages/ui-design/src/css/emit.test.ts test/packages.test.ts`
Expected: PASS — 17 emitter tests, and `packages.test.ts` green.

- [ ] **Step 7: Run the gate**

Run: `bun run check`
Expected: all green, 89 tests across 11 files.

- [ ] **Step 8: Commit**

```bash
git add packages/ui-design/src/css/emit.ts packages/ui-design/src/css/emit.test.ts \
        packages/ui-design/src/css/index.ts test/packages.test.ts
git commit -m "Emit the token stylesheet"
```

---

### Task 4: Correct the documents and close the task

**Files:**
- Modify: `docs/design-system.md` — the theme example and variant bullets, the
  Delivery section, the Cascade layers section
- Modify: `docs/motion.md:67-70` — "Reduced motion"
- Modify: `docs/architecture.md:35-36` — the file tree
- Modify: `packages/ui-design/README.md` — the entry table and "Status"
- Modify: `todo/TODO.md`, and move
  `todo/m1-foundation-and-contract-proof/11-ui-design-css-emitter-layers-reset-and-boot-script.md`
  to `todo/done/m1-foundation-and-contract-proof/`

**Interfaces:**
- Consumes: everything tasks 1 through 3 produced.
- Produces: nothing code-facing.

Documents in `docs/` state what is true now and carry no task numbers — task
numbers belong in specs, plans and commits.

- [ ] **Step 1: `docs/design-system.md` — the theme example**

In "Themes and variants", add `scheme-mode` to both axes and fix the count:

```ts
export const miniTheme = defineTheme({
  base: {
    "scheme-mode": "light",
    canvas: "#FBFBFA", surface: "#FFFFFF", ink: "#111111", hairline: "#EAEAEA",
    // … and the other 90 primitives
  },
  dark: {
    "scheme-mode": "dark",
    canvas: "#191919", surface: "#242424", ink: "#F4F4F0", hairline: "#3A3A3A",
  },
  compact: { "control-h": "28px", "row-h": "32px" },
})
```

- [ ] **Step 2: `docs/design-system.md` — a third variant bullet**

After the **Scheme** and **Density** bullets, add:

```markdown
- **`scheme-mode`** is the value `color-scheme` takes; the reset reads it as
  `color-scheme: var(--scheme-mode)`. A theme with a `dark` axis must set it in
  both, or the page pairs dark colours with light form controls and scrollbars.
  The emitter cannot infer it — a dark-only theme has no `dark` axis to infer
  from — which is why it is a token rather than a rule.
```

- [ ] **Step 3: `docs/design-system.md` — the Delivery section**

Extend the escaping paragraph. After *"…so a child combinator would ship as
`&gt;` and silently break its rule."*, add:

```markdown
`emitTokensCss()` enforces both on the values it is handed: a name or value
carrying a backtick, `<`, `>`, `&`, `{` or `}` throws, naming the token and the
character, because the alternative is a declaration that dies with no error at
all. The same rule means **no CSS nesting anywhere in the sheet** — `&` is
escaped like any other character, so a nested rule ships broken. Grouped
selectors are flat `:where(...)` lists.
```

Then replace the `bootScript` paragraph — *"`bootScript` stays inline in the
document … must not take the page down."* — with:

```markdown
`schemeBootScript` stays inline in the document — `<head>` on the server,
`index.html` in SPA. It restores the remembered scheme and density before the
first paint, so nothing reflows, reading `lemol-ui:scheme` and
`lemol-ui:density`. Both are exported as `schemeStorageKey` and
`densityStorageKey`, so a switcher cannot drift from what the script reads, and
the values are allow-listed rather than written through. It is wrapped in
`try`/`catch`, because a private window that refuses `localStorage` must not
take the page down.

Stamping the JS-enhanced marker is `ui-remix`'s job: the marker exists to hide
no-JS fallbacks, which is a component concern in the package that knows what a
component is. `ui-remix` concatenates this script and exports the composed
string, so a document still inlines one.
```

- [ ] **Step 4: `docs/design-system.md` — the Cascade layers section**

After *"Base loses to components; components lose to nothing."*, add:

```markdown
**Layer order is fixed by the first `@layer` statement the browser sees.** If
remix's stylesheet is evaluated before the emitted sheet, `rmx` already exists
and our statement appends `base` after it — inverting the order with no error,
so element defaults start beating components. The emitted sheet has to reach
the document first.
```

Then, after the `[hidden]` rule's explanation, add:

```markdown
That is the only unlayered rule `ui-design` ships. The other one in this system
— hiding a no-JS fallback once the runtime is live — comes from `ui-remix` with
the marker it reads.
```

- [ ] **Step 5: `docs/motion.md` — "Reduced motion"**

Replace the first paragraph of that section with:

```markdown
`prefers-reduced-motion: reduce` zeroes **every duration token** in the emitted
sheet, so no component opts in individually. Token zeroing rather than a
universal `*` override, because it also reaches the `::view-transition-*`
pseudo-elements a universal selector cannot match — and those animate the whole
viewport.

The consequence is deliberate: CSS that hard-codes a duration keeps animating.
That is a violation of the token contract, and finding it this way beats
masking it.
```

Keep the *"Do not fight that media query…"* paragraph that follows.

- [ ] **Step 6: `docs/architecture.md` — the file tree**

```
    src/css/boot.ts         schemeBootScript (no-flash scheme and density restore)
    src/css/reset.ts        element defaults in @layer base, and the reduced-motion reset
```

- [ ] **Step 7: `packages/ui-design/README.md`**

In the entry-point table, change the `/css` row to name
`schemeBootScript` and the reduced-motion reset:

```markdown
| `@lemol/ui-design/css` | `emitTokensCss()`, the `@layer base, rmx` setup, the element defaults, the reduced-motion reset, and `schemeBootScript`. |
```

Replace the "Status" section with:

```markdown
## Status

`@lemol/ui-design` holds 95 primitive names across seven groups, and no values.
`@lemol/ui-design/css` emits the stylesheet: the layer statement, a block per
variant axis, the element defaults, the one unlayered rule, and the
reduced-motion reset.

Two things the entry table above deliberately does not hold: the component that
puts an emitted sheet into a document, and the boot script that also stamps the
JS-enhanced marker. Both need to know what a component is, so both live in
`@lemol/ui-remix`.
```

- [ ] **Step 8: Close the task**

Follow the convention the closed tasks use — the `todo-md` skill manages this
format:

```bash
git mv todo/m1-foundation-and-contract-proof/11-ui-design-css-emitter-layers-reset-and-boot-script.md \
       todo/done/m1-foundation-and-contract-proof/
```

In the moved file's frontmatter, add `group: M1 — Foundation and contract proof`
and `completed_at:` with the current UTC timestamp (`date -u +%Y-%m-%dT%H:%M:%SZ`).
Then delete task 11's line from `todo/TODO.md`.

- [ ] **Step 9: Run the gate**

Run: `bun run check`
Expected: all green. The documents are prose, but `packages.test.ts` reads the
README's existence and Biome formats Markdown.

- [ ] **Step 10: Commit**

```bash
git add docs/design-system.md docs/motion.md docs/architecture.md \
        packages/ui-design/README.md todo/
git commit -m "Correct the documents and close task 11"
```

---

## What this plan does not do

- **No `ThemeStyle`**, and no composed boot script with the enhanced marker.
  Both need JSX or a runtime, so both are task 12 in `ui-remix`.
- **No `ui-remix/src/tokens.ts` aggregate** and no `ComponentTokenName` union —
  task 12. `EmitOptions` takes whatever record it is handed until then.
- **No values.** `scheme-mode` and `focus-ring-offset` are names here; `mini`
  supplies values in task 18.
- **No third variant axis.**

## Inherited by later tasks

- **Task 12** must satisfy the delivery constraint: the emitted sheet has to be
  evaluated before `remix/ui`'s styles, or `base` lands after `rmx` and the
  element defaults start beating components. It also owns the enhanced-marker
  script and the unlayered rule that reads the marker.
- **Task 18** owns the test that `scheme-mode` appears in both `base` and the
  `dark` axis. Omitting it from `dark` pairs dark colours with light form
  controls, and nothing in this task can see that.
- **Task 19**'s scheme and density switchers must write `schemeStorageKey` and
  `densityStorageKey` rather than string literals.
