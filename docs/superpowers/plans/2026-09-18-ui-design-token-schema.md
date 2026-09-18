# ui-design Token Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land `@lemol/ui-design`'s primitive token schema, `defineTheme` /
`extendTheme`, and the typed reference `v()` — M1 task 10.

**Architecture:** Three small modules plus a barrel. `tokens.ts` declares 93
primitive **names** grouped into seven categories and holds no values;
`theme.ts` composes themes over two variant axes with a generic seam that keeps
this package ignorant of components; `ref.ts` is one function. Everything is
strings and data, so a future `@lemol/ui-opentui` can share the package.

**Tech Stack:** TypeScript 7 (no build step — packages ship `src/` directly),
`bun:test`, Biome for lint and format. No runtime dependencies.

**Spec:** [`docs/superpowers/specs/2026-09-18-ui-design-token-schema-design.md`](../specs/2026-09-18-ui-design-token-schema-design.md)

## Global Constraints

- **No values in this package.** No colour, pixel count, duration or curve may
  appear in `packages/ui-design/src/`. Only names.
- **No dependencies.** Not `remix`, not anything. `ui-design` has none and must
  keep none.
- **SPA-safe.** No `node:*`, no `bun`, no `effect`, no server-side `remix/*`
  import. `test/boundaries.test.ts` enforces this.
- **No build step.** Ship TypeScript from `src/`. Do not add a bundler.
- **Import style:** explicit `.ts` extensions (`from "./tokens.ts"`), double
  quotes, no semicolons, 2-space indent, 100-column lines. Biome enforces all
  of it; `bun run fix` applies it.
- **The gate for every change is `bun run check`** — lint, then typecheck, then
  test. A task is not done until it is green.
- **Every value is `string`.** No template-literal types, no branded `Length`
  or `Color`.
- **Naming rule:** ramps you do arithmetic on are numeric and the number is a
  multiplier (`sp-4` is four 4px units). Sets you choose from are t-shirt sized
  (`r-md`, `fs-lg`, `dur-fast`). Space is the only ramp.

## File Structure

| File | Responsibility |
| --- | --- |
| `packages/ui-design/src/tokens.ts` | The schema: seven name groups, the derived `PrimitiveName` / `PrimitiveTokens` types, `primitiveNames`, `tokenGroups`, `groupOf` |
| `packages/ui-design/src/tokens.test.ts` | Schema integrity: group membership, no duplicates, `groupOf` round-trip |
| `packages/ui-design/src/theme.ts` | `Theme`, `ThemeInput`, `ThemeOverrides`, `defineTheme`, `extendTheme` |
| `packages/ui-design/src/theme.test.ts` | Composition behaviour plus the four compile-time assertions |
| `packages/ui-design/src/ref.ts` | `v()` — one function |
| `packages/ui-design/src/ref.test.ts` | `v()` output |
| `packages/ui-design/src/index.ts` | Barrel. Modified — currently `export {}` |
| `docs/design-system.md` | Modified: "Adding a token" is currently inverted; add the naming rule and the `color-mix()` prohibition |
| `packages/ui-design/README.md` | Modified: "Status" section |
| `todo/TODO.md` | Modified: close task 10 |

`tokens.ts` is the only large file at ~112 lines, and that is data. `theme.ts`
is ~49, `ref.ts` is 5.

**All source in this plan has been compiled and run against the repo's real
`tsconfig.json` and `bun test` before being written down.** It is known-good,
including Biome's formatting, so type it as given rather than improving it. Two
things in it look redundant and are not — both are called out where they appear.

---

### Task 1: The schema

**Files:**
- Create: `packages/ui-design/src/tokens.ts`
- Test: `packages/ui-design/src/tokens.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `schema`, `tokenGroups: readonly TokenGroup[]`,
  `primitiveNames: readonly PrimitiveName[]`,
  `groupOf(name: PrimitiveName): TokenGroup`, and the types `TokenGroup`,
  `PrimitiveName`, `PrimitiveTokens = { readonly [K in PrimitiveName]: string }`.
  Tasks 2 and 3 import from here.

- [ ] **Step 1: Write the failing test**

Create `packages/ui-design/src/tokens.test.ts`:

```ts
import { describe, expect, it } from "bun:test"
import { groupOf, type PrimitiveName, primitiveNames, schema, tokenGroups } from "./tokens.ts"

describe("schema", () => {
  it("exposes every group", () => {
    expect(tokenGroups).toEqual([
      "color",
      "space",
      "radius",
      "type",
      "motion",
      "sizing",
      "elevation",
    ])
  })

  it("has no empty group", () => {
    for (const group of tokenGroups) expect(schema[group].length).toBeGreaterThan(0)
  })

  it("flattens to the sum of its groups", () => {
    const sum = tokenGroups.reduce((n, group) => n + schema[group].length, 0)
    expect(primitiveNames).toHaveLength(sum)
  })

  it("names no token twice", () => {
    expect(new Set(primitiveNames).size).toBe(primitiveNames.length)
  })
})

describe("groupOf", () => {
  it("round-trips every name to the group it came from", () => {
    for (const group of tokenGroups)
      for (const name of schema[group]) expect(groupOf(name)).toBe(group)
  })

  it("throws on a name that is not in the schema", () => {
    expect(() => groupOf("nope" as PrimitiveName)).toThrow("Unknown primitive token: nope")
  })
})
```

Note there is no test asserting `primitiveNames.length === 93`. A hard-coded
count would fail every time a token is legitimately added, which is a test that
trains people to edit it without reading it. "Flattens to the sum of its
groups" catches the bug that matters — a name lost between the schema and the
flattened list.

- [ ] **Step 2: Run the test and confirm it fails**

```sh
bun test packages/ui-design/src/tokens.test.ts
```

Expected: fails to resolve `./tokens.ts` — the module does not exist yet.

- [ ] **Step 3: Write the schema**

Create `packages/ui-design/src/tokens.ts`:

```ts
/**
 * The primitive token schema: names, and no values at all.
 *
 * A theme supplies every value. That is what lets a future @lemol/ui-opentui
 * share this package without inheriting hex colours it cannot use, and it is
 * why `defineTheme` requires the full set rather than patching a default.
 *
 * Names are grouped so a category is derivable from membership: the
 * prefers-reduced-motion reset in /css iterates `schema.motion` rather than
 * keeping a second list of durations that can drift.
 *
 * Naming rule: ramps you do arithmetic on are numeric and the number is a
 * multiplier, so `sp-4` is four 4px units. Sets you choose from are t-shirt
 * sized. Space is the only ramp.
 */
export const schema = {
  color: [
    "canvas",
    "surface",
    "surface-raised",
    "surface-hover",
    "surface-active",
    "hairline",
    "hairline-strong",
    "ink",
    "ink-muted",
    "ink-subtle",
    "ink-inverse",
    "scrim",
    "focus",
    "accent",
    "accent-hover",
    "accent-ink",
    "accent-subtle",
    "accent-border",
    "link",
    "link-hover",
    "success",
    "success-ink",
    "success-subtle",
    "success-border",
    "warning",
    "warning-ink",
    "warning-subtle",
    "warning-border",
    "danger",
    "danger-ink",
    "danger-subtle",
    "danger-border",
    "info",
    "info-ink",
    "info-subtle",
    "info-border",
  ],
  space: [
    "sp-0",
    "sp-1",
    "sp-2",
    "sp-3",
    "sp-4",
    "sp-5",
    "sp-6",
    "sp-8",
    "sp-10",
    "sp-12",
    "sp-16",
    "sp-24",
  ],
  radius: ["r-xs", "r-sm", "r-md", "r-lg", "r-xl", "r-pill"],
  type: [
    "font-sans",
    "font-mono",
    "fs-2xs",
    "fs-xs",
    "fs-sm",
    "fs-md",
    "fs-lg",
    "fs-xl",
    "fs-2xl",
    "fs-3xl",
    "lh-tight",
    "lh-snug",
    "lh-base",
    "lh-relaxed",
    "tr-tight",
    "tr-normal",
    "tr-wide",
    "tr-wider",
    "fw-regular",
    "fw-medium",
    "fw-semibold",
    "fw-bold",
  ],
  motion: [
    "dur-instant",
    "dur-fast",
    "dur-base",
    "dur-slow",
    "ease-out-quad",
    "ease-spring",
    "ease-in-out-smooth",
  ],
  sizing: ["control-h", "control-h-sm", "row-h", "row-pad-y", "page-max", "gutter"],
  elevation: ["shadow-sm", "shadow-md", "shadow-lg", "focus-ring"],
} as const

export type TokenGroup = keyof typeof schema
export type PrimitiveName = (typeof schema)[TokenGroup][number]
export type PrimitiveTokens = { readonly [K in PrimitiveName]: string }

export const tokenGroups = Object.keys(schema) as readonly TokenGroup[]

export const primitiveNames: readonly PrimitiveName[] = tokenGroups.flatMap(
  (group) => schema[group] as readonly PrimitiveName[],
)

const groupByName: ReadonlyMap<PrimitiveName, TokenGroup> = new Map(
  tokenGroups.flatMap((group) =>
    (schema[group] as readonly PrimitiveName[]).map((name) => [name, group] as const),
  ),
)

export function groupOf(name: PrimitiveName): TokenGroup {
  const group = groupByName.get(name)
  if (group === undefined) throw new Error(`Unknown primitive token: ${name}`)
  return group
}
```

Two things worth knowing:

- **The `as readonly PrimitiveName[]` casts are not noise.** `schema[group]`
  where `group` is the `TokenGroup` union types as a union of readonly tuples,
  which `flatMap` and `.map` will not accept without narrowing.
- **`groupOf` throws rather than returning `undefined`** because its parameter
  is already typed to the valid set. The throw only fires when someone casts
  past the type, and a silent `undefined` there would be exactly the dead-click
  failure class `docs/principles.md` §6 forbids.

The 36 colour names follow one convention: `<tone>` is the strong colour —
solid fills, icons, and text sitting on `<tone>-subtle`. `<tone>-ink` is what
is readable *on* the solid fill. That is why `<tone>-subtle` has no ink of its
own.

- [ ] **Step 4: Run the test and confirm it passes**

```sh
bun test packages/ui-design/src/tokens.test.ts
```

Expected: 6 pass, 0 fail.

- [ ] **Step 5: Run the full gate**

```sh
bun run check
```

Expected: exit 0. If Biome reports formatting, run `bun run fix` and re-run —
the arrays above are already in Biome's canonical shape, so this should be a
no-op.

- [ ] **Step 6: Commit**

```sh
git add packages/ui-design/src/tokens.ts packages/ui-design/src/tokens.test.ts
git commit -m "Add the primitive token schema

Names only, grouped into seven categories, with no values anywhere in
ui-design. Grouping is what lets the reduced-motion reset iterate the
duration tokens instead of keeping a second list.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Theme composition

**Files:**
- Create: `packages/ui-design/src/theme.ts`
- Test: `packages/ui-design/src/theme.test.ts`

**Interfaces:**
- Consumes: `PrimitiveTokens`, `primitiveNames` from `./tokens.ts` (Task 1).
- Produces:
  - `interface Theme<C extends string = never>` with
    `base: PrimitiveTokens & Readonly<Partial<Record<C, string>>>`,
    `dark: Overrides<C> | undefined`, `compact: Overrides<C> | undefined`
  - `interface ThemeInput<C extends string = never>` — same shape, `dark` and
    `compact` optional
  - `interface ThemeOverrides<C extends string = never>` — all three optional
  - `defineTheme<C extends string = never>(input: ThemeInput<NoInfer<C>>): Theme<C>`
  - `extendTheme<C extends string = never>(theme: Theme<C>, overrides: ThemeOverrides<NoInfer<C>>): Theme<C>`

  Task 12 (`ui-remix`) and task 18 (`ui-remix-mini`) depend on these exact
  signatures. `C` is the cross-package seam: `mini` calls
  `defineTheme<ComponentTokenName>({ … })`.

- [ ] **Step 1: Write the failing test**

Create `packages/ui-design/src/theme.test.ts`:

```ts
import { describe, expect, it } from "bun:test"
import { defineTheme, extendTheme } from "./theme.ts"
import { type PrimitiveTokens, primitiveNames } from "./tokens.ts"

const base = Object.fromEntries(primitiveNames.map((name) => [name, "initial"])) as PrimitiveTokens

describe("defineTheme", () => {
  it("leaves dark and compact undefined when they are omitted", () => {
    const theme = defineTheme({ base })
    expect(theme.dark).toBeUndefined()
    expect(theme.compact).toBeUndefined()
  })

  it("freezes every axis it returns", () => {
    const theme = defineTheme({ base, dark: { canvas: "#000" } })
    expect(Object.isFrozen(theme)).toBe(true)
    expect(Object.isFrozen(theme.base)).toBe(true)
    expect(Object.isFrozen(theme.dark)).toBe(true)
  })
})

describe("extendTheme", () => {
  it("merges base and leaves the original untouched", () => {
    const theme = defineTheme({ base })
    const next = extendTheme(theme, { base: { canvas: "#FBFBFA" } })
    expect(next.base.canvas).toBe("#FBFBFA")
    expect(next.base.ink).toBe("initial")
    expect(theme.base.canvas).toBe("initial")
  })

  it("keeps an axis the overrides do not mention", () => {
    const theme = defineTheme({ base, dark: { canvas: "#191919" } })
    const next = extendTheme(theme, { compact: { "row-h": "32px" } })
    expect(next.dark?.canvas).toBe("#191919")
    expect(next.compact?.["row-h"]).toBe("32px")
  })

  it("adds an axis the original theme did not have", () => {
    const theme = defineTheme({ base })
    const next = extendTheme(theme, { dark: { canvas: "#191919" } })
    expect(next.dark?.canvas).toBe("#191919")
    expect(theme.dark).toBeUndefined()
  })
})

type Comp = "ui-btn-primary-bg"

// A theme omitting `dark` typechecks -- task 10's stated "done when".
export const noDark = defineTheme({ base })

// Component tokens are accepted once the seam is supplied.
export const wired = defineTheme<Comp>({
  base: { ...base, "ui-btn-primary-bg": "var(--accent)" },
  dark: { "ui-btn-primary-bg": "var(--accent-hover)" },
})

// @ts-expect-error - `base` must carry every primitive
export const missing = defineTheme({ base: { canvas: "#fff" } })

// @ts-expect-error - `nope` is neither a primitive nor a component token
export const unknownKey = defineTheme({ base, dark: { nope: "x" } })
```

The last four declarations are the type tests, and they run under
`bun run typecheck`, not `bun test`. `@ts-expect-error` is the assertion:
`tsc` raises TS2578 "Unused '@ts-expect-error' directive" when the error it
claims does not occur, so a directive that stops firing fails the build. They
are `export`ed so Biome does not flag them as unused.

`base` is built from `primitiveNames` rather than written out, so adding a
token later does not mean editing 93 literals in a test.

- [ ] **Step 2: Run the test and confirm it fails**

```sh
bun test packages/ui-design/src/theme.test.ts
```

Expected: fails to resolve `./theme.ts`.

- [ ] **Step 3: Write the implementation**

Create `packages/ui-design/src/theme.ts`:

```ts
import type { PrimitiveTokens } from "./tokens.ts"

type Base<C extends string> = PrimitiveTokens & Readonly<Partial<Record<C, string>>>
type Overrides<C extends string> = Readonly<Partial<PrimitiveTokens & Record<C, string>>>

export interface Theme<C extends string = never> {
  readonly base: Base<C>
  readonly dark: Overrides<C> | undefined
  readonly compact: Overrides<C> | undefined
}

export interface ThemeInput<C extends string = never> {
  readonly base: Base<C>
  readonly dark?: Overrides<C>
  readonly compact?: Overrides<C>
}

export interface ThemeOverrides<C extends string = never> {
  readonly base?: Overrides<C>
  readonly dark?: Overrides<C>
  readonly compact?: Overrides<C>
}

function mergeAxis<C extends string>(
  current: Overrides<C> | undefined,
  next: Overrides<C> | undefined,
): Overrides<C> | undefined {
  if (current === undefined && next === undefined) return undefined
  return Object.freeze({ ...current, ...next }) as Overrides<C>
}

export function defineTheme<C extends string = never>(input: ThemeInput<NoInfer<C>>): Theme<C> {
  return Object.freeze({
    base: Object.freeze({ ...input.base }) as Base<C>,
    dark: mergeAxis<C>(undefined, input.dark),
    compact: mergeAxis<C>(undefined, input.compact),
  })
}

export function extendTheme<C extends string = never>(
  theme: Theme<C>,
  overrides: ThemeOverrides<NoInfer<C>>,
): Theme<C> {
  return Object.freeze({
    base: Object.freeze({ ...theme.base, ...overrides.base }) as Base<C>,
    dark: mergeAxis<C>(theme.dark, overrides.dark),
    compact: mergeAxis<C>(theme.compact, overrides.compact),
  })
}
```

**Do not remove `NoInfer<C>`. It is the whole type check.** Without it
TypeScript infers `C` from the argument, so `defineTheme({ base, dark: { nope:
"x" } })` infers `C = "nope"` and cheerfully accepts it — the `@ts-expect-error`
in the test then fails as unused. `extendTheme` wraps only its `overrides`
parameter, because `C` must still be inferred from `theme`.

**Do not remove the `as` casts either.** Under `exactOptionalPropertyTypes`,
spreading two partials yields optional properties that include `undefined`,
which the target type rejects. The casts are the localised price of that flag.

Neither function validates at runtime. The types are the check, the package
ships TypeScript with no build step, so there is no JavaScript-consumer case to
defend against.

- [ ] **Step 4: Run the tests and confirm they pass**

```sh
bun test packages/ui-design/src/theme.test.ts
bun run typecheck
```

Expected: 5 pass, 0 fail; typecheck exits 0. A TS2578 "Unused
'@ts-expect-error' directive" means a type guard silently stopped working —
fix the implementation, never the directive.

- [ ] **Step 5: Run the full gate**

```sh
bun run check
```

Expected: exit 0.

- [ ] **Step 6: Commit**

```sh
git add packages/ui-design/src/theme.ts packages/ui-design/src/theme.test.ts
git commit -m "Add defineTheme and extendTheme

Two variant axes and no more: base is total, dark and compact are partial,
so a theme omitting dark typechecks. The generic C is the cross-package
seam and defaults to never, which is how ui-design stays ignorant of which
components exist. NoInfer keeps C from being inferred out of the argument,
without which an unknown key just widens the parameter instead of failing.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: `v()` and the barrel

**Files:**
- Create: `packages/ui-design/src/ref.ts`
- Test: `packages/ui-design/src/ref.test.ts`
- Modify: `packages/ui-design/src/index.ts` (currently the single line `export {}`)

**Interfaces:**
- Consumes: `PrimitiveName` from `./tokens.ts` (Task 1); everything exported by
  Tasks 1 and 2.
- Produces: `v(name: PrimitiveName): string`, and `@lemol/ui-design` as a
  working entry point.

- [ ] **Step 1: Write the failing test**

Create `packages/ui-design/src/ref.test.ts`:

```ts
import { describe, expect, it } from "bun:test"
import { v } from "./ref.ts"

describe("v", () => {
  it("wraps a primitive name in a custom-property reference", () => {
    expect(v("accent")).toBe("var(--accent)")
    expect(v("sp-4")).toBe("var(--sp-4)")
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

```sh
bun test packages/ui-design/src/ref.test.ts
```

Expected: fails to resolve `./ref.ts`.

- [ ] **Step 3: Write `ref.ts`**

Create `packages/ui-design/src/ref.ts`:

```ts
import type { PrimitiveName } from "./tokens.ts"

export function v(name: PrimitiveName): string {
  return `var(--${name})`
}
```

No fallback parameter. A component token's default value already *is* the
fallback mechanism, so `v("accent", "#f00")` would be a second way to do one
job — and the one that hides a missing token instead of surfacing it.

`v()` covers primitives only. Typing `--ui-*` names here would mean this
package learning which components exist, which is the one thing it must not do.
If `ui-remix` wants the same ergonomics for its own tier, that is task 12's
call and it lives there.

- [ ] **Step 4: Run the test and confirm it passes**

```sh
bun test packages/ui-design/src/ref.test.ts
```

Expected: 1 pass, 0 fail.

- [ ] **Step 5: Replace the barrel**

Replace the entire contents of `packages/ui-design/src/index.ts` — it is
currently the single line `export {}` — with:

```ts
export { v } from "./ref.ts"
export {
  defineTheme,
  extendTheme,
  type Theme,
  type ThemeInput,
  type ThemeOverrides,
} from "./theme.ts"
export {
  groupOf,
  type PrimitiveName,
  type PrimitiveTokens,
  primitiveNames,
  schema,
  type TokenGroup,
  tokenGroups,
} from "./tokens.ts"
```

It must not import `./css`. Task 11's "done when" pins that the base entry does
not drag the emitter in, and an `export * from "./css/index.ts"` here would
break that before task 11 starts.

- [ ] **Step 6: Run the full gate**

```sh
bun run check
```

Expected: exit 0. `test/boundaries.test.ts` should pass untouched — this task
adds no imports outside the package.

- [ ] **Step 7: Commit**

```sh
git add packages/ui-design/src/ref.ts packages/ui-design/src/ref.test.ts packages/ui-design/src/index.ts
git commit -m "Add v() and open the ui-design barrel

v() takes no fallback argument: a component token default is already the
fallback, and a second mechanism would be the one that hides a missing
token rather than surfacing it. The barrel deliberately omits ./css so the
base entry does not pull the emitter in.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Correct the documents and close the task

The spec found `docs/design-system.md` contradicting itself. `CLAUDE.md`
requires that when code and a document disagree, one gets fixed deliberately —
so this is part of task 10, not a follow-up.

**Files:**
- Modify: `docs/design-system.md` (the "Adding a token" section, and two
  additions)
- Modify: `packages/ui-design/README.md` (the "Status" section)
- Modify: `todo/TODO.md` (via the `todo` CLI, not by hand)

**Interfaces:**
- Consumes: the finished behaviour from Tasks 1–3.
- Produces: nothing code depends on.

- [ ] **Step 1: Fix "Adding a token" in `docs/design-system.md`**

The section currently opens with this, which is decision 1 inverted — it says
values live in `ui-design`:

```markdown
**A primitive:** put the value in the right record in
`ui-design/src/tokens.ts`. Nothing else — the flattener picks it up and the
name union widens, so `v("your-token")` typechecks immediately.
```

Replace that paragraph with:

```markdown
**A primitive:** add the **name** to the right group in
`ui-design/src/tokens.ts`. That package holds no values. The name union
widens, so `v("your-token")` typechecks immediately, and every theme then
fails to compile until it supplies a value — which is the intended prompt,
not an obstacle.
```

- [ ] **Step 2: Add the naming rule to `docs/design-system.md`**

At the end of the "Two tiers" section, after the paragraph ending "A skin is
then a set of values", add:

```markdown
**Naming.** Ramps you do arithmetic on are numeric, and the number is a
multiplier: `sp-4` is four 4px units. Sets you choose from are t-shirt sized:
`r-md`, `fs-lg`, `dur-fast`. Space is the only ramp, so this is one rule with
one exception to remember.

The 4px base is a resolution, not a constraint — a theme on an 8px grid uses
the even steps. The multiplier is not enforced by the compiler, because the
schema holds no values; it is checked by a test in the package that supplies
them.
```

- [ ] **Step 3: Add the `color-mix()` prohibition to `docs/design-system.md`**

At the end of the "Two tiers" section, immediately after the text added in
Step 2, add:

```markdown
**A component token default must not contain `color-mix()`.** Semantic tones
are named in full — `<tone>`, `<tone>-ink`, `<tone>-subtle`, `<tone>-border` —
so a component never derives one from another. Deriving would not remove the
mix ratio, it would move it into the component, where a literal `12%` is the
same kind of bug as a literal `200ms`: correct today, and impossible to retune
centrally. A theme that wants derived values may compute them itself; that is
a theme's business.
```

- [ ] **Step 4: Update the `ui-design` README status**

In `packages/ui-design/README.md`, the "Status" section currently reads:

```markdown
Scaffold. `src/` holds stubs; the schema, `defineTheme` and `v()` land with M1
task 10, and the emitter, layers, reset and boot script with task 11.
```

Replace it with:

```markdown
The schema, `defineTheme` / `extendTheme` and `v()` have landed (M1 task 10):
93 primitive names across seven groups, and no values. The emitter, cascade
layers, reset and boot script on `/css` are still stubs and land with task 11.
```

- [ ] **Step 5: Verify the documents agree with the code**

```sh
grep -n "put the value in the right record" docs/design-system.md
```

Expected: no output. Then:

```sh
bun run check
```

Expected: exit 0.

- [ ] **Step 6: Close the task with the CLI**

`todo` is aliased to the local `todo-md` checkout. Do not hand-edit
`todo/TODO.md` — the CLI owns the format.

```sh
todo show 10
todo done 10
todo next
```

Expected: `show 10` names "ui-design: token schema, theme composition and v()";
after `done 10`, `next` reports task 11.

- [ ] **Step 7: Commit**

```sh
git add docs/design-system.md packages/ui-design/README.md todo/TODO.md
git commit -m "Correct design-system.md and close task 10

The 'Adding a token' section said primitive values live in
ui-design/src/tokens.ts, which the schema decision inverts -- that package
holds names only. Also records the numeric-ramp naming rule and the ban on
color-mix() in component token defaults, both of which were decided during
task 10 and had nowhere to live.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## What this plan does not do

Out of scope, with the task that owns each:

- `emitTokensCss()`, cascade layers, the reset and `bootScript` — **task 11**.
- `ui-remix/src/tokens.ts`, `ThemeStyle`, and the `ComponentTokenName` union
  that gets passed to `defineTheme<C>` — **task 12**.
- Any actual colour, pixel value or curve — **task 18**.

Three obligations are handed forward and are recorded in the spec so they are
not lost:

- **Task 18** owns the test asserting `sp-N` resolves to `N × 4px` in `mini`'s
  theme. The multiplier cannot be enforced in `ui-design`.
- **Task 18** decides whether `mini` derives its semantic arms from seeds, and
  owns any `tonal()` helper. It must not be lifted into `ui-design`.
- **Task 18** picks fixed or fluid type. If fluid, a `clamp()` middle term must
  include a `rem` component — a pure `vw` middle term fails WCAG 1.4.4 because
  text stops responding to the user's root font size.

One brief changes as a result of this work:

- **Task 16 (Badge)** says "if a semantic primitive is missing from
  `ui-design`'s schema, adding it is part of this task". It no longer is — task
  15 needs an invalid state and lands first, so all sixteen semantic names ship
  in task 10.
