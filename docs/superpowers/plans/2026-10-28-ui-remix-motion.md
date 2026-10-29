# Motion system and polish layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship M5: all twelve micro-interactions on their components, the shared keyframe mixins behind them, minted `view-transition-name`s extending the `overlay()` pattern, the opt-in cross-document view-transition CSS, and a `/pages/motion` playground page with a reduced-motion toggle beside the no-JS toggle.

**Micro-interaction Catalogue Mapping:**
All 12 items from the reference taxonomy map onto components and tasks:
1. **icon swap**: Task D (`CopyButton` swaps copy icon to checkmark)
2. **success check**: Task D (`CopyButton` draws SVG checkmark via `drawCheck`)
3. **error state shake**: Task C (`Field` shakes on `[aria-invalid="true"]` via `shake`)
4. **number pop-in**: Task E (`Badge` count pops in via `pop`)
5. **notification badge**: Task E (`TabBar` item badge and dot pop in via `pop`)
6. **input clear with dissolve**: Task C (`Field` search cancel button dissolves via `dissolve`)
7. **skeleton loader and reveal**: Task J (Playground `Skeleton` placeholder dissolves into revealed content)
8. **shimmer text**: Task A (`shimmer` mixin in `motion.ts`) & Task J (shimmering text heading on motion page)
9. **tabs sliding**: Task G (`Tabs` indicator scoped via `viewTransitionName`, caller gap documented)
10. **banner stacking**: Task H (`Toaster` toast shifts scoped via `viewTransitionName`)
11. **like/toggle feedback**: Task F (`Button` press `:active` scale + `Switch` thumb travel)
12. **dropdown menu morph**: Task J (`Menu`/`Popover` entry morph demonstrated; size morph deferred on `interpolate-size`)

**Architecture:** Eleven tasks. A and B widen contracts other tasks build on — one shared mixin module, one name factory — so no component invents its own keyframes or hand-writes a transition name. C through H put each micro-interaction on its component beside the tokens that time it. I emits the document-level opt-in CSS. J wires the playground page and the toggle through the same query-param path scheme and density already travel. K corrects the documents the work contradicts.

**Tech Stack:** TypeScript, `remix/component` (`css()`, `Handle`, `MixInput`), `bun:test`, the `test/styles.ts` + `test/render.ts` harness.

**Spec:** `todo/m5-motion-system/05-plan-m5-motion-system.md` and `docs/motion.md` — the plan argues from both, so the executor reads all three.

## Global Constraints

Copied from the task, `docs/` and `AGENTS.md`. Every task's requirements include these.

- **Styling goes through the contract.** No component hard-codes a colour, radius, duration, easing or space step. A component with something to retheme declares its own `--ui-*` tokens beside itself, defaulting to a primitive; one styled from structural keywords and primitives alone declares none.
- **A component token default must be `var(--primitive)` or an allowed literal.** `allowedLiterals` in `src/remix/tokens.test.ts` holds `transparent`, `1px`, `2px`, `uppercase`, `bottom span-all`. A sixth needs its argument in review and its line in that list.
- **No `color-mix()` in a token default.**
- **SPA-safe.** Nothing under `src/` imports `node:*`, `bun`, `effect`, or a server-side `remix/*` entry. `test/boundaries.test.ts` enforces it.
- **Cross-layer imports inside `src/` are relative and go through the layer's entry point** — `../design/index.ts`, `../design/css/index.ts`, `../remix/index.ts` — never an arbitrary file inside another layer. Same-layer relative imports are free.
- **A nested selector in a `css()` block must lead with `&`.** No CSS nesting in the `design/css` emitted sheet (the renderer escapes `&` there); component `css()` blocks are unaffected.
- **Never hand-write a `commandfor` id, and never hand-write a `view-transition-name`.** The first fails silently, the second throws and skips the whole page's transition. Factories mint both.
- **Motion names tokens, never literals.** No `200ms`, no `cubic-bezier(...)`, no `scale: 0.97` without its keyword argued in the component's own test.
- **One `css()` block per element per concern; blocks on one element are property-disjoint.** A shorthand in one block and its longhand in another collide where no test can see it. `test/styles.ts` (`blocksOn`, `sharedProperties`, `topLevelPropertiesOf`) is the harness.
- **`display` is declared only inside the open state** (`&[open]`, `&:popover-open`), never at a component block's top level.
- **A `@starting-style` block targets the state being entered**, and every `transition` shorthand that upgrades with `allow-discrete` is declared twice — first without it, second in a nested `&` block.
- **Verify degradation:**
  - *Verify 1 (@starting-style degradation):* `@keyframes` animations (`shake`, `pop`, `drawCheck`, `dissolve`, `shimmer`) rely on CSS Animations Level 1, not `@starting-style`, and run everywhere. Overlay entry/exit transitions isolate `@starting-style` in nested blocks so engines without support open instantly. Vendor pseudo-elements (like `::-webkit-search-cancel-button`) drop silently on unsupported engines.
  - *Verify 2 (reduced motion):* Every duration token defaults to `var(--dur-*)`. The global reset zeroes `--dur-*` with `!important` under `prefers-reduced-motion: reduce` and `:root[data-motion="reduce"]`.
  - *Verify 3 (no literals):* a rendered-CSS guard, `src/remix/motion/no-literals.test.ts` (created in Task A, extended by C–H), renders each `motion.ts` mixin and every component this plan touches (Field, CopyButton, Badge, TabBar, Button, Tabs, Toaster, Skeleton), runs `stylesOf(...)` over the output, and fails on `/\b\d+(\.\d+)?m?s\b/` or `cubic-bezier`. It reads the places literals would actually land (component `css()` blocks, keyframes, view-transition rules). A guard over token defaults would be vacuous: `src/remix/tokens.test.ts` (`defaults every token to a primitive that exists`) already rejects any default that is not `var(--primitive)` or an allowed literal. Today's tree is clean: `grep -rnE "cubic-bezier|[0-9]+m?s[\" ,;]" src apps` outside tests and `src/design` finds only `src/mini/theme.ts` (primitive values) and a comment in `sheet/tokens.ts`. Task J's router test applies the same regex to component styles (`stylesOf()` / `data-rmx-style` blocks only, excluding the emitted `:root` token definitions and the reduced-motion reset) on the rendered motion page.
- **The gate for every change is `bun run check`** (lint + typecheck + test).
- **Commit messages** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **No proof changes.** The check stage proves this head with the existing scenarios; this plan registers no new ones.

## Load-bearing findings

Checked against the current tree before this plan was written; each carries the rerunnable command, not just a file line.

- **`remix` 3.1.0 ships no same-document view-transition caller.** `grep -rl "startViewTransition" "$R/src" "$R/dist"` (with `$R` the resolved `remix` install) prints nothing (`rc=1`), and `grep -rli "view-transition" "$R/guides" "$R/INDEX.md" "$R/README.md"` prints nothing (`rc=1`). Same-document transitions need `document.startViewTransition()`, which is JavaScript — so "opt-in CSS with no JavaScript" holds for cross-document only. This plan ships the CSS side (minted names, `::view-transition-group` timing) ready for a caller, and records the caller as depending on `remix` or a future ladder-step-3 behaviour, not on this milestone.
- **Tabs are route links and cannot morph in M5.** `src/remix/tabs/tabs.tsx` documents: "Tabs as route links, not in-page panels: each tab is an `<a>` to its own URL...". Switching tabs is a navigation. Since cross-document view transitions are not enabled across playground pages (to keep navigation consistent) and Remix ships no same-document caller, the Tabs sliding indicator morph cannot run live during navigation in M5. The CSS rules ship ready and benignly inert, with the gap documented on the motion page.
- **Two visible elements sharing a `view-transition-name` throw and skip the transition.** Task-brief premise, restated in `docs/motion.md` ("Names must be minted, not written"); the factory in Task B exists because of it.
- **A view-transition-name must be a `<custom-ident>`; the factory refuses what it cannot keep unique or valid.** Following `src/remix/dialog/overlay.tsx` ("surface the cause"), `viewTransitionName(id, part?)` never rewrites a caller's string; it joins `id` and `part` with `--` and **throws, naming the input,** when `id` or `part` contains `--` (the delimiter, so `("a--b","c")` and `("a","b--c")` can never meet, nor `("x--toast")` and `("x","toast")`), when `id` is empty, when `part` is the empty string, or when either is not a valid ident (`/^[A-Za-z_][A-Za-z0-9_-]*$/` — an id such as `1st` or `my toast` would otherwise be silently dropped by the browser). Uniqueness across *different* stems is the caller's contract, the same as `overlay()` names; the guarantee is that stem and part cannot be re-split into another pair.
- **Motion page route pattern is `/pages/dashboard`.** `apps/playground/app/routes.ts` maps `dashboard: get("/pages/dashboard")`; Task J copies that shape as `motion: get("/pages/motion")`.
- **The switchers already preserve unknown params.** `HiddenFields` carries every current param except `except`, so the new `motion` param rides along in every existing form with no change to them.

## Review Focus

Five failure modes the plan implies but no task's tests fully exercise; each line gets its test pinned to the owning task in that task's own step style.

- Two `Tabs` (or two toasts, two menus) on one page derive the same transition name because their stems collide — Task B's refusal tests (`--` in a stem or part throws; `("a-b","c")` and `("a","b-c")` differ) plus Task G's stem-scoping test.
- A `Tabs` with no `name` renders today's instant switch with no error — Task G asserts the indicator carries no `view-transition-name` when the stem is absent.
- `CopyButton` confirmed state preserves DOM elements for animation — Task D asserts the button contains the checkmark SVG and label containers; the runtime sets `data-copy-confirmed` without overwriting `textContent`, and removes the attribute on revert so subsequent copies re-trigger the animation.
- Under `prefers-reduced-motion: reduce`, the UA's own root crossfade is UA behaviour, not ours — Task I asserts only our `::view-transition-group` / root-pseudo timing rules read tokens (and so zero out), and names the UA default as explicitly uncovered.
- `@view-transition { navigation: auto; }` emitted for a consumer whose engine ignores it must change nothing — Task I asserts the opt-in is a separate conditional string, absent by default, so the default sheet is byte-identical to today's.

## File Structure

| File | Responsibility | Task |
| --- | --- | --- |
| `src/remix/motion/motion.ts` | Create: shared keyframe mixin factories (`shake`, `pop`, `drawCheck`, `dissolve`, `shimmer`) | A |
| `src/remix/motion/motion.test.ts` | Create: keyframe names, token reads, degradation shape | A |
| `src/remix/motion/names.ts` | Create: the minted `view-transition-name` factory (verbatim or refused, `--` reserved as the join) | B |
| `src/remix/motion/names.test.ts` | Create: join, refusals (`--`, empty, non-ident), ident validity | B |
| `src/remix/motion/README.md` | Create: what lives here and why keyframes are shared but tokens are not | A |
| `src/remix/field/tokens.ts` | Modify: `ui-field-error-duration`, `ui-field-error-easing` | C |
| `src/remix/field/field.tsx` | Modify: shake on `[aria-invalid]`, dissolve on the search cancel button | C |
| `src/remix/field/field.test.tsx` | Modify: the shake/dissolve suite | C |
| `src/remix/copy-button/tokens.ts` | Create: `ui-copy-confirm-duration`, `ui-copy-confirm-easing` | D |
| `src/remix/copy-button/copy-button.tsx` | Modify: confirm state draws check SVG and dissolves confirm label | D |
| `src/remix/copy-button/copy-button.test.tsx` | Modify: the confirm suite | D |
| `src/remix/runtime.ts` | Modify: `--copy` toggles `data-copy-confirmed` attribute, clears on revert | D |
| `test/browser/copy-button.browser.test.ts` | Modify: assert label state through `data-copy-label` / `aria-hidden` and the button's accessible name, not `textContent` (lines 34, 66, 75 break otherwise) | D |
| `src/remix/tokens.ts` | Modify: aggregate `copyTokens` | D |
| `src/remix/tokens.test.ts` | Modify: `ui-copy` prefix joins list | D |
| `src/remix/motion/no-literals.test.ts` | Create: rendered-CSS guard — no literal durations or easing curves in mixins or touched components | A |
| `src/remix/skeleton/skeleton.tsx` | Modify: consume the shared shimmer keyframes instead of its own `ui-skeleton-shimmer` | A |
| `src/remix/index.ts` | Modify: export `viewTransitionName` | B |
| `src/remix/badge/tokens.ts` | Modify: `ui-badge-pop-duration`, `ui-badge-pop-easing` | E |
| `src/remix/badge/badge.tsx` | Modify: count pop-in | E |
| `src/remix/badge/badge.test.tsx` | Modify: the pop suite | E |
| `src/remix/tab-bar/tokens.ts` | Modify: `ui-tabbar-badge-pop-duration`, `ui-tabbar-badge-pop-easing` | E |
| `src/remix/tab-bar/tab-bar.tsx` | Modify: badge/dot pop-in | E |
| `src/remix/tab-bar/tab-bar.test.tsx` | Modify: the pop suite | E |
| `src/remix/button/button.tsx` | Modify: `:active` press on `scale` | F |
| `src/remix/button/button.test.tsx` | Modify: press suite + `scale` keyword argument in `keywords` | F |
| `src/remix/tabs/tabs.tsx` | Modify: optional `name` stem scoping indicator's transition name (`../motion/names.ts`) | G |
| `src/remix/tabs/tabs.test.tsx` | Modify: the morph suite (present with stem, absent without) | G |
| `src/remix/toaster/toaster.tsx` | Modify: toast-scoped transition names for stack shifts (`../motion/names.ts`) | H |
| `src/remix/toaster/toaster.test.tsx` | Modify: the stacking suite | H |
| `src/design/css/emit.ts` | Modify: `EmitOptions.viewTransitions` + root-pseudo timing emission | I |
| `src/design/css/emit.test.ts` | Modify: opt-in absent by default, present and tokenised when asked | I |
| `src/remix/theme-style.tsx` | Modify: `viewTransitions?: "auto"` prop forwarded to `emitTokensCss` | I |
| `src/remix/theme-style.test.tsx` | Modify: `@view-transition` absent by default, emitted on prop | I |
| `src/design/css/reset.ts` | Modify: `:root[data-motion="reduce"]` zeroing, same derivation as media query | J |
| `src/design/css/reset.test.ts` | Modify: the manual override suite | J |
| `src/mini/document.tsx` | Modify: `motion?: "reduce"` prop → `data-motion`, blank-axis preserve | J |
| `src/mini/document.test.tsx` | Modify: the attribute suite (follow existing scheme/density cases) | J |
| `apps/playground/app/routes.ts` | Modify: `motion: get("/pages/motion")` | J |
| `apps/playground/app/actions/controller.tsx` | Modify: `pageQuery` reads `motion`, every render action passes it through | J |
| `apps/playground/app/ui/switchers.tsx` | Modify: Motion Full/Reduce group beside Scripts | J |
| `apps/playground/app/ui/motion.tsx` | Create: the motion page | J |
| `apps/playground/app/ui/home.tsx` | Modify: Recipes gains the Motion link | J |
| `apps/playground/app/router.test.tsx` | Modify: motion-axis cases beside scheme/density ones | J |
| `docs/motion.md`, `src/remix/README.md`, `src/remix/motion/README.md` (in A), `apps/playground/README.md` if it lists pages | Modify: the documents the work contradicts | K |

No new package subpath: `motion/` is internal to the `remix` layer, reached relatively. No `test/package.test.ts` change. No new runtime command: the motion toggle is query-only like `nojs`/`compat`, so `docs/interactivity.md`'s command table is untouched.

---

### Task A: shared keyframe mixins

**Files:**
- Create: `src/remix/motion/motion.ts`
- Create: `src/remix/motion/motion.test.ts`
- Create: `src/remix/motion/README.md`

**Interfaces:**
- Consumes: `css` from `../css.ts` (same-layer relative import, allowed).
- Produces: `shake(timing)`

- [x] **Step 1: Write the failing test** in `src/remix/motion/motion.test.ts`. Render a probe element mixing each factory with literal token refs (e.g. `shake({ duration: "var(--ui-probe-duration)", easing: "var(--ui-probe-easing)" })`) through `renderToHtml` + `stylesOf`, and assert:
  - Each block contains its `@keyframes ui-motion-*` name.
  - Each `animation` value contains the passed duration and easing refs and no literal `ms` or `cubic-bezier`.
  - The `animation` shorthand is a single `animation` property (completing instantly at `0ms` is what the reduced-motion reset relies on).
  - Verify 1 degradation: Assert that none of the keyframe mixin blocks contain `@starting-style`, proving they degrade purely on standard CSS Animations without needing `@starting-style` support.

```tsx
const html = await renderToHtml(<div mix={shake({ duration: "var(--ui-probe-duration)", easing: "var(--ui-probe-easing)" })} />)
const styles = stylesOf(html)
expect(styles).toContain("@keyframes ui-motion-shake")
expect(styles).toContain("animation: ui-motion-shake var(--ui-probe-duration) var(--ui-probe-easing)")
expect(styles).not.toMatch(/\d+ms/)
expect(styles).not.toContain("cubic-bezier")
expect(styles).not.toContain("@starting-style")
```

- [x] **Step 2: Run it to verify it fails.**

Run: `bun test src/remix/motion/motion.test.ts`
Expected: FAIL — module does not exist.

- [x] **Step 3: Implement `shake`, `pop`, `drawCheck`, `dissolve`, `shimmer` in `src/remix/motion/motion.ts`.** One factory per effect; keyframe bodies:
  - `shake`: horizontal translate decay (`translateX(-4px)` to `0`).
  - `pop`: `scale` 0.6→1 on the spring easing the caller passes.
  - `drawCheck`: `stroke-dashoffset` for an SVG check path.
  - `dissolve`: opacity + slight translate.
  - `shimmer`: background-position sweep `200% 0` to `-200% 0` — lifted verbatim from `src/remix/skeleton/skeleton.tsx` (`@keyframes ui-skeleton-shimmer`, same body). The keyframes move to `motion.ts` as `ui-motion-shimmer`; `Skeleton` consumes the mixin (its `animation` keeps reading `--ui-skeleton-duration`/`--ui-skeleton-easing`), and its test is updated for the renamed keyframes. One definition, two consumers.
  `shimmer` only owns the sweep (background-position + keyframes). Whatever wears it supplies its own `backgroundImage`/`backgroundSize` from tokens: `Skeleton` keeps its gradient on `--ui-skeleton-bg`/`--ui-skeleton-shimmer`; the playground's shimmer text (Task J) uses a page-local `css()` block with `backgroundImage: linear-gradient(90deg, var(--ink-muted) 25%, var(--ink) 50%, var(--ink-muted) 75%)`, `backgroundSize: 200% 100%`, `backgroundClip: text`, `color: transparent`, and timing from `var(--dur-slow)`/`var(--ease-in-out-smooth)` — primitives only, no literals.
  Each factory takes timing strings

- [x] **Step 3b: Move Skeleton onto the shared keyframes and add the literal guard.**
  - `skeleton.tsx` drops its local `@keyframes ui-skeleton-shimmer` and mixes `shimmer({ duration: "var(--ui-skeleton-duration)", easing: "var(--ui-skeleton-easing)" })`; its test changes `@keyframes ui-skeleton-shimmer` to `@keyframes ui-motion-shimmer` and still asserts the `infinite` iteration (the mixin takes an optional `iterations`, default 1, so Skeleton passes `"infinite"`).
  - Create `src/remix/motion/no-literals.test.ts` (see *Verify 3*): render every mixin and `Skeleton`, `stylesOf(...)`, and `expect(styles).not.toMatch(/\b\d+(\.\d+)?m?s\b/)` / `not.toContain("cubic-bezier")`. Tasks C–H each add their component to the list in their own Step 1.

- [x] **Step 4: Run the test to verify it passes.**

Run: `bun test src/remix/motion/motion.test.ts src/remix/motion/no-literals.test.ts src/remix/skeleton/skeleton.test.tsx`
Expected: PASS.

- [x] **Step 5: Write `src/remix/motion/README.md`.** Keyframes are shared because sharing them is safe; timing tokens are per-component because retuning is per-component; names (`view-transition-name`) are minted in `names.ts` using the `overlay()` pattern (verbatim, `--` part delimiter) because sharing names throws.

- [x] **Step 6: Commit.**

```bash
git add src/remix/motion/ src/remix/skeleton/ && git commit -m "feat(motion): shared

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task B: the minted transition-name factory

**Files:**
- Create: `src/remix/motion/names.ts`
- Create: `src/remix/motion/names.test.ts`
- Modify: `src/remix/index.ts` (export the factory)

**Interfaces:**
- Consumes: nothing.
- Produces: `viewTransitionName(id: string, part?: string): string` for Tasks G–H — extending the `overlay()` pattern to transition names. Components pass their already-minted id (`overlay()`/`popover()`/`toast()` ids, `Field`'s name stem, `Tabs`' `name` stem) plus an optional part (`"indicator"`, `"surface"`, `"toast"`), and never write the name themselves.
- Following `src/remix/dialog/overlay.tsx`, `id` and `part` are used verbatim or refused, never rewritten: the factory throws an `Error` whose message names the offending argument and value when `id`/`part` contains `--`, when `id` is empty, when `part` is `""`, or when either fails `/^[A-Za-z_][A-Za-z0-9_-]*$/`. With `--` banned from both inputs, the joined string splits back to exactly one `(id, part)` pair, so no two distinct pairs collide.

- [x] **Step 1: Write the failing test** in `src/remix/motion/names.test.ts`. Assert:
  - `viewTransitionName("new-task", "dialog")` returns `"new-task--dialog"`; `viewTransitionName("saved")` returns `"saved"`.
  - Non-collision of single-dash splits: `("new", "task-dialog")` ≠ `("new-task", "dialog")`; `("a-b", "c")` ≠ `("a", "b-c")`.
  - Refusals, each `toThrow` with a message containing the offending value: `("a--b", "c")`, `("a", "b--c")`, `("x--toast")`, `("")`, `("x", "")`, `("1st")`, `("my toast")`.
  - Ident validity: every accepted result matches `/^[A-Za-z_][A-Za-z0-9_-]*$/` (property check over the accepted fixtures above).

```ts
expect(viewTransitionName("new-task", "dialog")).toBe("new-task--dialog")
expect(viewTransitionName("saved")).toBe("saved")
expect(viewTransitionName("a-b", "c")).not.toBe(viewTransitionName("a", "b-c"))
expect(() => viewTransitionName("a--b", "c")).toThrow("a--b")
expect(() => viewTransitionName("x", "")).toThrow()
```

- [x] **Step 2: Run it to verify it fails.**

Run: `bun test src/remix/motion/names.test.ts`
Expected: FAIL — module does not exist.

- [x] **Step 3: Implement `viewTransitionName(id: string, part?: string): string` in `src/remix/motion/names.ts`.**
  ```ts
  const ident = /^[A-Za-z_][A-Za-z0-9_-]*$/

  function check(label: string, value: string) {
    if (value.includes("--") || !ident.test(value)) {
      throw new Error(`viewTransitionName: ${label} ${JSON.stringify(value)} must be a plain ident without "--"`)
    }
  }

  export function viewTransitionName(id: string, part?: string): string {
    check("id", id)

    if (part === undefined) return id

    check("part", part)

    return `${id}--${part}`
  }
  ```
  Verbatim or refused, never rewritten — `overlay()`'s contract. `--` is reserved as the join, so stem and part cannot be re-split.

- [x] **Step 4: Export it from `src/remix/index.ts`** beside `overlay`.

- [x] **Step 5: Run the tests to verify they pass.**

Run: `bun test src/remix/motion/names.test.ts`
Expected: PASS.

- [x] **Step 6: Commit.**

```bash
git add src/remix/motion/names.ts src/remix/motion/names.test.ts src/remix/index.ts && git commit -m "feat(motion): mint view-transition-names like commandfor ids

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task C: Field error shake and search-cancel dissolve

**Files:**
- Modify: `src/remix/field/tokens.ts`, `src/remix/field/field.tsx`, `src/remix/field/field.test.tsx`

**Interfaces:**
- Consumes: `shake`, `dissolve` from `../motion/motion.ts`.
- Produces: nothing for later tasks.

New tokens:
```ts
"ui-field-error-duration": "var(--dur-fast)",
"ui-field-error-easing": "var(--ease-out-quad)",
```

- [x] **Step 1: Write the failing test** in `src/remix/field/field.test.tsx`, beside the existing test `it("moves its list in and out as Popover's surface does, on tokens reduced motion zeroes")`. Render an invalid field and assert its control block's `animation` names `ui-motion-shake` with the two new tokens; render a `type="search"` field and assert a `::-webkit-search-cancel-button` rule transitioning `opacity` on the same tokens. Assert both token values start with `var(--dur-` / `var(--ease-` (the reduced-motion reset only zeroes tokens that read the schema).

- [x] **Step 2: Run it to verify it fails.**

Run: `bun test src/remix/field/field.test.tsx`
Expected: FAIL — unknown tokens / missing animation.

- [x] **Step 3: Implement.** Mix `shake({ duration: "var(--ui-field-error-duration)", easing: "var(--ui-field-error-easing)" })` into the control's `[aria-invalid="true"]` rule (same block as the invalid border, keeping the co-location rule). Style the cancel button in its own block: `opacity` + `transition: opacity <tokens>`; unsupported engines drop the vendor pseudo-element rule whole, which is the documented degradation. The shake runs on insertion (frame navigation replaces the control, so it shakes after a failed submission round-trip); client-side typing does not re-trigger it, which is accepted and noted in the motion page.

- [x] **Step 4: Run the tests.**

Run: `bun test src/remix/field/field.test.tsx`
Expected: PASS.

- [x] **Step 5: Commit.**

```bash
git add src/remix/field/ && git commit -m "feat(field): error shake and search-cancel dissolve

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task D: CopyButton confirm — icon swap, success check, dissolve

**Files:**
- Create: `src/remix/copy-button/tokens.ts`
- Modify: `src/remix/copy-button/copy-button.tsx`, `src/remix/copy-button/copy-button.test.tsx`, `src/remix/runtime.ts`, `test/browser/copy-button.browser.test.ts`

**Interfaces:**
- Consumes: `drawCheck`, `dissolve` from `../motion/motion.ts`.
- Produces: the `ui-copy` token tier and the `data-copy-label` / `data-copy-confirmed` hooks the runtime and CSS share.

New tokens:
```ts
"ui-copy-confirm-duration": "var(--dur-fast)",
"ui-copy-confirm-easing": "var(--ease-out-quad)",
```

The component and runtime changes:
- `CopyButton` renders an icon wrapper (the checkmark SVG path) and two label spans: `<span data-copy-label="idle">` (the children) and `<span data-copy-label="confirm" aria-hidden="true">` (the confirm label). Under `[data-copy-confirmed]`, the check draws via `drawCheck`, the confirm label dissolves in via `dissolve`, and the idle label dissolves out.
- **Accessible name.** Opacity does not remove a node from the accessibility tree, so the runtime owns it: on `--copy` it sets `data-copy-confirmed` and toggles `aria-hidden` (`true` on the idle label, removed from the confirm label); the revert timer restores both. The button's accessible name is therefore exactly the visible label — `Copy API key`, then `Copied!`, then `Copy API key` — matching what the old `textContent` swap exposed.
- In `src/remix/runtime.ts`: `--copy` no longer writes `source.textContent` (it would destroy the SVG and label nodes the animation needs). It sets the attribute and `aria-hidden` states above; the revert timer reverses them, so a second copy re-triggers the animation. The `data-copy-original-label` bookkeeping goes away with the text swap.
- Where a consumer renders a `CopyButton` without the spans (none in-tree), the runtime falls back to the old `textContent` swap.

- [x] **Step 1: Write the failing tests.**
  - Component test in `copy-button.test.tsx`: render `CopyButton`, assert the checkmark SVG path and label wrapper are present; assert a `[data-copy-confirmed]` rule whose `animation` names `ui-motion-draw` with `ui-copy-confirm-*` tokens, and confirm label dissolves via `dissolve`.
  - Runtime behaviour in `test/browser/copy-button.browser.test.ts` (`src/remix/runtime.test.ts` has no DOM — its only case is `does nothing where there is no document`, so nothing is added there). Rewrite the three `textContent` assertions: after a click, `getByRole("button", { name: "Copied!" })` resolves and `[data-copy-confirmed]` is present; after the revert, `getByRole("button", { name: "Copy API key" })` resolves and the attribute is gone; a second click before the revert keeps `Copied!` as the name and records two writes.
  - Add `copy-button` to the rendered-CSS guard `src/remix/motion/no-literals.test.ts` (Task A).

- [x] **Step 2: Run them to verify they fail.**

Run: `bun test src/remix/copy-button/copy-button.test.tsx src/remix/tokens.test.ts src/remix/motion/no-literals.test.ts`, then `bun test test/browser/copy-button.browser.test.ts` (needs `bunx playwright install chromium`).
Expected: FAIL.

- [x] **Step 3: Implement.**
  - Create `src/remix/copy-button/tokens.ts` with `ui-copy-confirm-duration` and `ui-copy-confirm-easing`.
  - In `copy-button.tsx`, render checkmark SVG and confirm label span; mix `drawCheck` and `dissolve` under `&[data-copy-confirmed]`.
  - In `runtime.ts`, `--copy` sets `data-copy-confirmed` and the `aria-hidden` swap; the revert timer reverses both.
  - In `tokens.ts`, aggregate `copyTokens`.
  - In `tokens.test.ts`, add `"ui-copy"` to the prefix list.

- [x] **Step 4: Run the tests.**

Run: `bun test src/remix/copy-button/copy-button.test.tsx src/remix/tokens.test.ts src/remix/motion/no-literals.test.ts` and `bun test test/browser/copy-button.browser.test.ts`.
Expected: PASS.

- [x] **Step 5: Commit.**

```bash
git add src/remix/copy-button/ src/remix/runtime.ts test/browser/copy-button.browser.test.ts src/remix/motion/no-literals.test.ts && git commit -m "feat(copy-button): confirm check and dissolve

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task E: notification badge and count pop-in

**Files:**
- Modify: `src/remix/badge/tokens.ts`, `src/remix/badge/badge.tsx`, `src/remix/badge/badge.test.tsx`, `src/remix/tab-bar/tokens.ts`, `src/remix/tab-bar/tab-bar.tsx`, `src/remix/tab-bar/tab-bar.test.tsx`

**Interfaces:**
- Consumes: `pop` from `../motion/motion.ts`.
- Produces: nothing for later tasks.

New tokens:
```ts
"ui-badge-pop-duration": "var(--dur-fast)",
"ui-badge-pop-easing": "var(--ease-spring)",
"ui-tabbar-badge-pop-duration": "var(--dur-fast)",
"ui-tabbar-badge-pop-easing": "var(--ease-spring)",
```

- [x] **Step 1: Write the failing tests.** Badge: render with children, assert `animation: ui-motion-pop var(--ui-badge-pop-duration) var(--ui-badge-pop-easing)` in the badge's own block (property-disjoint from `badgeBase` and tone block). TabBar: render an item with a `badge`, assert the badge element's block names `ui-motion-pop` with `ui-tabbar-badge-pop-*` tokens; render an item with a `dot`, assert the same.

- [x] **Step 2: Run them to verify they fail.**

Run: `bun test src/remix/badge/badge.test.tsx src/remix/tab-bar/tab-bar.test.tsx`
Expected: FAIL — no pop tokens, no animation.

- [x] **Step 3: Implement.** Mix `pop` into Badge and TabBar badge/dot elements. Insertion triggers the pop (frame navigation replacement); client-side mutations without replacement do not re-pop, which is documented.

- [x] **Step 4: Run the tests.**

Run: `bun test src/remix/badge/badge.test.tsx src/remix/tab-bar/tab-bar.test.tsx`
Expected: PASS.

- [x] **Step 5: Commit.**

```bash
git add src/remix/badge/ src/remix/tab-bar/ && git commit -m "feat(badge): count and notification pop-in

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task F: press feedback on Button (like/toggle)

**Files:**
- Modify: `src/remix/button/button.tsx`, `src/remix/button/button.test.tsx`

**Interfaces:**
- Consumes: nothing new. Produces: nothing for later tasks.

No new tokens: press is a transition on the existing `ui-btn-transition-duration`/`ui-btn-transition-easing`.

- [ ] **Step 1: Write the failing test** in `src/remix/button/button.test.tsx`.
  - In `button.test.tsx`, the test is `reads only its own tokens and structural keywords` (line 56). Its `keywords` set carries declarations that are neither colour, length, duration, nor weight.
  - Assert `buttonBase` transitions `scale` alongside its current properties (`transitionProperty: "background, border-color, color, scale"`), and that an `&:active` rule sets `scale: 0.97`.
  - Add `0.97` (a dimensionless transform scale ratio, not a colour, length, duration, or weight) and `"background, border-color, color, scale"` (the widened transition property list) to `keywords` in `button.test.tsx` with their inline argument.

- [ ] **Step 2: Run it to verify it fails.**

Run: `bun test src/remix/button/button.test.tsx`
Expected: FAIL — `scale` not in transition, no `:active` rule.

- [ ] **Step 3: Implement.** In `buttonBase`, add `scale` to `transitionProperty`; add `&:active:not(:disabled)` with `scale: "0.97"` in the same block.

- [ ] **Step 4: Run the tests.**

Run: `bun test src/remix/button/button.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/remix/button/ && git commit -m "feat(button): press feedback on scale

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task G: Tabs sliding indicator (minted morph)

**Files:**
- Modify: `src/remix/tabs/tabs.tsx`, `src/remix/tabs/tabs.test.tsx`

**Interfaces:**
- Consumes: `viewTransitionName` from `../motion/names.ts` (Task B).
- Produces: the worked example of a minted morph later tasks copy.

No new tokens. **Group timing is not emitted from the component.** A `css()` block nests every key under the element class (probed: `css({ viewTransitionName: "views--indicator", "::view-transition-group(views--indicator)": {...} })` renders `.rmxc-… { view-transition-name: …; ::view-transition-group(views--indicator) { … } }` inside `@layer rmx.…`), so the pseudo-selector becomes a descendant of the element and never matches the root-attached pseudo tree — a test for its presence would pass over dead CSS. Components therefore declare only the minted `view-transition-name`; the transition's duration and easing come from the document-level `::view-transition-group(*)` / `::view-transition-old(*)` / `::view-transition-new(*)` rules Task I emits (token-driven, root-level, so reduced motion zeroes them). Per-component timing is out of scope.

- [ ] **Step 1: Write the failing tests** in `src/remix/tabs/tabs.test.tsx`.
  - With `name="views"`: assert `view-transition-name: views--indicator` via `viewTransitionName("views", "indicator")` (the `view-transition-name` declaration only, and no `::view-transition` group selector — see the *Group timing* note above).
  - Add `Tabs` to `no-literals.test.ts`; assert the styles contain no `::view-transition` selector (position, not just presence, is the bug).
  - Without `name`: assert the indicator carries no `view-transition-name`.

- [ ] **Step 2: Run them to verify they fail.**

Run: `bun test src/remix/tabs/tabs.test.tsx`
Expected: FAIL — no `name` prop, no transition names.

- [ ] **Step 3: Implement.** `TabsProps` gains `name?: string` — an id stem used only to scope the indicator's transition name; absent means no morph. Apply the minted name `viewTransitionName(name, "indicator")` to the `[aria-current]` element's rule.
  - *Caller status:* Tabs are route links (`<a>` elements to individual URLs). Tab switching is full document navigation. Since cross-document VT is not active on playground pages and Remix 3.1.0 does not ship a same-document `startViewTransition` caller, the Tabs indicator morph cannot run live during navigation in M5. The CSS rules ship ready and benignly inert, with the gap documented on the motion page.

- [ ] **Step 4: Run the tests.**

Run: `bun test src/remix/tabs/tabs.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/remix/tabs/ && git commit -m "feat(tabs): sliding indicator via a minted transition name

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task H: Toaster banner stacking (minted morph)

**Files:**
- Modify: `src/remix/toaster/toaster.tsx`, `src/remix/toaster/toaster.test.tsx`

**Interfaces:**
- Consumes: `viewTransitionName` from `../motion/names.ts`.
- Produces: nothing for later tasks.

No new tokens, and no component-level `::view-transition-group` rule (same reason as Task G: it would nest under the element class and never match; timing comes from Task I's document-level rules). **Caller status, as for Tabs:** toasts appear in the same document, and with no `startViewTransition` caller (Load-bearing findings) the minted names never morph in M5. The CSS ships ready and benignly inert; the motion page says so.

- [ ] **Step 1: Write the failing tests** in `src/remix/toaster/toaster.test.tsx`.
  - Render `toast("saved")` and assert the shell block carries `view-transition-name: saved--toast` (via `viewTransitionName(id, "toast")`) and that the styles contain no `::view-transition` selector.
  - Render two toasts with different ids and assert their names differ.
  - Add `Toaster` to `no-literals.test.ts`.

- [ ] **Step 2: Run it to verify it fails.**

Run: `bun test src/remix/toaster/toaster.test.tsx`
Expected: FAIL — no transition names.

- [ ] **Step 3: Implement.** Apply `viewTransitionName(toast.id, "toast")` to the toast shell block (no group timing; timing comes from Task I's document-level rules).

- [ ] **Step 4: Run the tests.**

Run: `bun test src/remix/toaster/toaster.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/remix/toaster/ && git commit -m "feat(toaster): mint per-toast transition names (inert until a same-document caller exists)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Explicitly out of scope: dropdown menu size morph. `Menu`/`Popover` entry/exit already animate via M1/M2 `@starting-style`; animating a surface's *size* as content changes requires `interpolate-size: allow-keywords`, which is Chromium-only and below baseline — so no code ships for it in M5, and the motion page demonstrates entry morph with that note attached.

---

### Task I: cross-document opt-in and root timing

**Files:**
- Modify: `src/design/css/emit.ts`, `src/design/css/emit.test.ts`, `src/remix/theme-style.tsx`, `src/remix/theme-style.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `EmitOptions.viewTransitions: "auto"` for callers, and `ThemeStyleProps.viewTransitions?: "auto"`.

Decision: `emitTokensCss(theme, options)` accepts `options?: { viewTransitions?: "auto" }`. When present, it emits `@view-transition { navigation: auto; }` and the token-timed, document-level `::view-transition-group(*)`, `::view-transition-old(*)`, `::view-transition-new(*)` rules — the only place per-name morph timing (Tabs indicator, toasts) can live, since a component's nested `css()` block cannot reach the root-attached pseudo tree (Task G). `ThemeStyleProps` gains `viewTransitions?: "auto" | undefined` to forward the option to `emitTokensCss`. Absent by default, so default stylesheets are byte-identical to existing output.

- [ ] **Step 1: Write the failing tests.**
  - `src/design/css/emit.test.ts`: default `emitTokensCss(theme)` contains no `@view-transition`; with `{ viewTransitions: "auto" }` it contains `@view-transition { navigation: auto; }` and top-level (not nested inside any rule) `::view-transition-group(*)`, `::view-transition-old(*)`, `::view-transition-new(*)` rules reading `var(--dur-base)` and `var(--ease-in-out-smooth)` — no literals. Assert the selector's position: the rule text starts at column 0 of the sheet, outside any `{ … }`.
  - `src/remix/theme-style.test.tsx`: default render contains no `@view-transition`; with `viewTransitions="auto"` it renders the opt-in rules.

- [ ] **Step 2: Run them to verify they fail.**

Run: `bun test src/design/css/emit.test.ts src/remix/theme-style.test.tsx`
Expected: FAIL — no such option or prop.

- [ ] **Step 3: Implement.** Emit the at-rule and root-pseudo timing only when `options?.viewTransitions === "auto"`. Forward `viewTransitions` from `ThemeStyle` to `emitTokensCss`. Supported in Chrome 126+, Safari 18.2+; unsupported in stable Firefox where navigation remains ordinary full-page loads. Group/old/new pseudo rules read `--dur-base`/`--ease-in-out-smooth` so reduced-motion zeroes them centrally.

- [ ] **Step 4: Run the tests.**

Run: `bun test src/design/css/emit.test.ts src/remix/theme-style.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/design/css/ src/remix/theme-style.tsx src/remix/theme-style.test.tsx && git commit -m "feat(design): opt-in cross-document view transitions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task J: playground motion page and reduced-motion toggle

**Files:**
- Create: `apps/playground/app/ui/motion.tsx`
- Modify: `src/design/css/reset.ts`, `src/design/css/reset.test.ts`, `src/mini/document.tsx`, `src/mini/document.test.tsx`, `apps/playground/app/routes.ts`, `apps/playground/app/actions/controller.tsx`, `apps/playground/app/ui/switchers.tsx`, `apps/playground/app/ui/home.tsx`, `apps/playground/app/router.test.tsx`

**Interfaces:**
- Consumes: all component tasks above (to demonstrate their micro-interactions).
- Produces: `/pages/motion` route and query-only `?motion=reduce` toggle.

Design: The toggle is **query-only** (`?motion=reduce`), not persisted, following the `nojs`/`compat` precedent.
- `pageQuery` reads `motion: params.get("motion") === "reduce" ? "reduce" : undefined`.
- `Document` gains `motion?: "reduce" | undefined`, rendering `data-motion="reduce"` on `<html>`.
- `reset.ts` emits `:root[data-motion="reduce"]` zeroing all `--dur-*` tokens with `!important` (matching media query reset).
- The motion page does **not** opt the entire document into `@view-transition` (to keep playground navigation consistent across pages); instead, cross-document opt-in is demonstrated as a live code snippet and compatibility guide on the page.

Page sections (each: `Eyebrow` + `Heading level={2}` + live components + `Text tone="muted"` degradation note):
1. **Confirm**: `CopyButton` with SVG `drawCheck` and label `dissolve`.
2. **Invalid**: `Field` with `error` shake (`ui-motion-shake`).
3. **Counts**: `Badge` with live count pop-in (`ui-motion-pop`); the note states that a pop (and Field's shake) replays on every page load and frame swap that inserts the element, including for unchanged badges.
4. **Notification**: `TabBar` with badge and dot pop-in.
5. **Search**: `Field type="search"` with clear dissolve.
6. **Loading**: `Skeleton` block + text-sized `Skeleton` + revealed content panel mixing `dissolve`, plus Shimmer Text demonstration mixing `shimmer` from `motion.ts`.
7. **Tabs**: line `Tabs` with `name`, noting route-link status and caller gap.
8. **Stacked**: two toasts with minted transition names, stating plainly that the stack shift is inert until a same-document `startViewTransition` caller exists (same gap as Tabs).
9. **Press**: `Button` scale press feedback beside `Switch` toggle feedback.
10. **Menu**: `Menu`/`Popover` entry morph with `interpolate-size` deferral note.
11. **Transitions**: same- vs cross-document support table + `@view-transition` opt-in code snippet.

- [ ] **Step 1: Write the failing tests.**
  - `src/design/css/reset.test.ts`: `:root[data-motion="reduce"]` zeroes every `--dur-*` token with `!important`.
  - `src/mini/document.test.tsx`: `motion="reduce"` renders `data-motion="reduce"`.
  - `apps/playground/app/router.test.tsx`: `?motion=reduce` sets `data-motion="reduce"` on `<html>`; assert no literals in component style blocks (`stylesOf()` / `data-rmx-style` blocks only, excluding `:root` token definitions and the reset) on `/pages/motion`.

- [ ] **Step 2: Run them to verify they fail.**

Run: `bun test src/design/css/reset.test.ts src/mini/document.test.tsx apps/playground/app/router.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement.**
  - Update `reset.ts` with `:root[data-motion="reduce"]`.
  - Update `Document` prop and attribute preservation.
  - Add `motion` to `pageQuery`, controller actions, and `switchers.tsx` (`Full`/`Reduce`).
  - Create `motion.tsx` page with all 11 demo sections and link it in `home.tsx`.

- [ ] **Step 4: Run the tests.**

Run: `bun test src/design/css/reset.test.ts src/mini/document.test.tsx apps/playground/app/router.test.tsx apps/playground/app/ui/home.test.tsx apps/playground/app/ui/catalogue.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/design/css/ src/mini/document.tsx src/mini/document.test.tsx apps/playground/ && git commit -m "feat(playground): motion page and reduced-motion toggle

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task K: documents

**Files:**
- Modify: `docs/motion.md`, `src/remix/README.md`, `apps/playground/README.md` (only if it lists pages)

**Interfaces:**
- Consumes: everything above. Produces: nothing.

- [ ] **Step 1: Update `docs/motion.md`.** Document shared keyframes in `motion.ts`; minted transition names in `names.ts` (`viewTransitionName`, verbatim, `--` delimiter); cross-document opt-in (`viewTransitions: "auto"`, support matrix with Firefox exclusion); manual `data-motion="reduce"` override; deferred items (same-document caller, menu size morph `interpolate-size`, client-side retrigger).
- [ ] **Step 2: Update `src/remix/README.md`.** Document `viewTransitionName` beside `overlay()`; extend reduced-motion notes to new component animations; document Tabs `name` and Toaster stacking names.
- [ ] **Step 3: Check `apps/playground/README.md` for page list.** If it lists pages, add Motion; otherwise skip.
- [ ] **Step 4: Run the full focused test set and static checks.**

Run: `bun test src/remix/motion/ src/remix/field/field.test.tsx src/remix/copy-button/ src/remix/runtime.test.ts src/remix/tokens.test.ts src/remix/badge/ src/remix/tab-bar/ src/remix/button/button.test.tsx src/remix/tabs/tabs.test.tsx src/remix/toaster/toaster.test.tsx src/design/css/ src/remix/theme-style.test.tsx src/mini/document.test.tsx apps/playground/app/router.test.tsx`
Then: `oxlint`
Then: `bun run typecheck`
Expected: all green.

- [ ] **Step 5: Commit.**

```bash
git add docs/motion.md src/remix/README.md apps/playground/README.md && git commit -m "docs(motion): the M5 polish layer, minted names and the toggle

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
