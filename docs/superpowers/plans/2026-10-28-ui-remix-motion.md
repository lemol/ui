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
  - *Verify 3 (no literals):* Repo-wide test in `src/remix/tokens.test.ts` guards that no token default carries literal durations (`\d+ms`) or easing curves (`cubic-bezier`). Emitted CSS tests guard that view-transition rules read only design tokens.
- **The gate for every change is `bun run check`** (lint + typecheck + test).
- **Commit messages** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **No proof changes.** The check stage proves this head with the existing scenarios; this plan registers no new ones.

## Load-bearing findings

Checked against the current tree before this plan was written; each carries the rerunnable command, not just a file line.

- **`remix` 3.1.0 ships no same-document view-transition caller.** `grep -rl "startViewTransition" "$R/src" "$R/dist"` (with `$R` the resolved `remix` install) prints nothing (`rc=1`), and `grep -rli "view-transition" "$R/guides" "$R/INDEX.md" "$R/README.md"` prints nothing (`rc=1`). Same-document transitions need `document.startViewTransition()`, which is JavaScript — so "opt-in CSS with no JavaScript" holds for cross-document only. This plan ships the CSS side (minted names, `::view-transition-group` timing) ready for a caller, and records the caller as depending on `remix` or a future ladder-step-3 behaviour, not on this milestone.
- **Tabs are route links and cannot morph in M5.** `src/remix/tabs/tabs.tsx` documents: "Tabs as route links, not in-page panels: each tab is an `<a>` to its own URL...". Switching tabs is a navigation. Since cross-document view transitions are not enabled across playground pages (to keep navigation consistent) and Remix ships no same-document caller, the Tabs sliding indicator morph cannot run live during navigation in M5. The CSS rules ship ready and benignly inert, with the gap documented on the motion page.
- **Two visible elements sharing a `view-transition-name` throw and skip the transition.** Task-brief premise, restated in `docs/motion.md` ("Names must be minted, not written"); the factory in Task B exists because of it.
- **A view-transition-name must be a `<custom-ident>`, and following `overlay()` names are verbatim with no sanitising.** In CSS Values 4, `<dashed-ident>` (such as names with `--`) is a valid `<custom-ident>`. Following `src/remix/dialog/overlay.tsx` ("`name` is used as the id verbatim, with no sanitising... sanitising would hide its cause rather than prevent it"), `viewTransitionName(id, part?)` does NOT sanitise characters. To prevent stem/part collisions without mutating caller strings, `id` and `part` are joined with a `--` part delimiter when `part` is given: `("new", "task-dialog")` yields `"new--task-dialog"` and `("new-task", "dialog")` yields `"new-task--dialog"`. They never collide.
- **Motion page route pattern is `/pages/dashboard`.** `apps/playground/app/routes.ts` maps `dashboard: get("/pages/dashboard")`; Task J copies that shape as `motion: get("/pages/motion")`.
- **The switchers already preserve unknown params.** `HiddenFields` carries every current param except `except`, so the new `motion` param rides along in every existing form with no change to them.

## Review Focus

Five failure modes the plan implies but no task's tests fully exercise; each line gets its test pinned to the owning task in that task's own step style.

- Two `Tabs` (or two toasts, two menus) on one page derive the same transition name because their stems collide — Task B's non-collision test (`viewTransitionName("new", "task-dialog") !== viewTransitionName("new-task", "dialog")`) plus Task G's stem-scoping test.
- A `Tabs` with no `name` renders today's instant switch with no error — Task G asserts the indicator carries no `view-transition-name` when the stem is absent.
- `CopyButton` confirmed state preserves DOM elements for animation — Task D asserts the button contains the checkmark SVG and label containers; the runtime sets `data-copy-confirmed` without overwriting `textContent`, and removes the attribute on revert so subsequent copies re-trigger the animation.
- Under `prefers-reduced-motion: reduce`, the UA's own root crossfade is UA behaviour, not ours — Task I asserts only our `::view-transition-group` / root-pseudo timing rules read tokens (and so zero out), and names the UA default as explicitly uncovered.
- `@view-transition { navigation: auto; }` emitted for a consumer whose engine ignores it must change nothing — Task I asserts the opt-in is a separate conditional string, absent by default, so the default sheet is byte-identical to today's.

## File Structure

| File | Responsibility | Task |
| --- | --- | --- |
| `src/remix/motion/motion.ts` | Create: shared keyframe mixin factories (`shake`, `pop`, `drawCheck`, `dissolve`, `shimmer`) | A |
| `src/remix/motion/motion.test.ts` | Create: keyframe names, token reads, degradation shape | A |
| `src/remix/motion/names.ts` | Create: the minted `view-transition-name` factory (verbatim, `--` delimiter) | B |
| `src/remix/motion/names.test.ts` | Create: uniqueness, no-sanitising, delimiter non-collision, ident validity | B |
| `src/remix/motion/README.md` | Create: what lives here and why keyframes are shared but tokens are not | A |
| `src/remix/field/tokens.ts` | Modify: `ui-field-error-duration`, `ui-field-error-easing` | C |
| `src/remix/field/field.tsx` | Modify: shake on `[aria-invalid]`, dissolve on the search cancel button | C |
| `src/remix/field/field.test.tsx` | Modify: the shake/dissolve suite | C |
| `src/remix/copy-button/tokens.ts` | Create: `ui-copy-confirm-duration`, `ui-copy-confirm-easing` | D |
| `src/remix/copy-button/copy-button.tsx` | Modify: confirm state draws check SVG and dissolves confirm label | D |
| `src/remix/copy-button/copy-button.test.tsx` | Modify: the confirm suite | D |
| `src/remix/runtime.ts` | Modify: `--copy` toggles `data-copy-confirmed` attribute, clears on revert | D |
| `src/remix/runtime.test.ts` | Modify: attribute addition and revert assertions | D |
| `src/remix/tokens.ts` | Modify: aggregate `copyTokens` | D |
| `src/remix/tokens.test.ts` | Modify: `ui-copy` prefix joins list; repo-wide no-literals guard | D |
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
- Produces: `shake(timing)`, `pop(timing)`, `drawCheck(timing)`, `dissolve(timing)`, `shimmer(timing)` for Tasks C–F and J, each taking `{ duration: string; easing: string }` (component token refs as strings) and returning a `CSSMixinDescriptor` carrying an `animation` shorthand plus its `@keyframes` block. Keyframe names are shared and fixed: `ui-motion-shake`, `ui-motion-pop`, `ui-motion-draw`, `ui-motion-dissolve`, `ui-motion-shimmer` — two elements sharing a `@keyframes` name is the normal case (the `Spinner` precedent), not a collision.

- [ ] **Step 1: Write the failing test** in `src/remix/motion/motion.test.ts`. Render a probe element mixing each factory with literal token refs (e.g. `shake({ duration: "var(--ui-probe-duration)", easing: "var(--ui-probe-easing)" })`) through `renderToHtml` + `stylesOf`, and assert:
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

- [ ] **Step 2: Run it to verify it fails.**

Run: `bun test src/remix/motion/motion.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `shake`, `pop`, `drawCheck`, `dissolve`, `shimmer` in `src/remix/motion/motion.ts`.** One factory per effect; keyframe bodies:
  - `shake`: horizontal translate decay (`translateX(-4px)` to `0`).
  - `pop`: `scale` 0.6→1 on the spring easing the caller passes.
  - `drawCheck`: `stroke-dashoffset` for an SVG check path.
  - `dissolve`: opacity + slight translate.
  - `shimmer`: gradient sweep background-position `200% 0` to `-200% 0` (for shimmering text or accents).
  Each factory takes timing strings — distances and offsets are small structural constants inside the keyframes, the same way `Spinner`'s `rotate` is.

- [ ] **Step 4: Run the test to verify it passes.**

Run: `bun test src/remix/motion/motion.test.ts`
Expected: PASS.

- [ ] **Step 5: Write `src/remix/motion/README.md`.** Keyframes are shared because sharing them is safe; timing tokens are per-component because retuning is per-component; names (`view-transition-name`) are minted in `names.ts` using the `overlay()` pattern (verbatim, `--` part delimiter) because sharing names throws.

- [ ] **Step 6: Commit.**

```bash
git add src/remix/motion/ && git commit -m "feat(motion): shared keyframe mixins for the polish layer

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
- Following `src/remix/dialog/overlay.tsx`, `id` is used verbatim with no sanitising ("sanitising would hide its cause rather than prevent it"). When `part` is provided, `id` and `part` are joined with `--` (a delimiter distinct from `-`), guaranteeing that `("new", "task-dialog")` yields `"new--task-dialog"` while `("new-task", "dialog")` yields `"new-task--dialog"`, preventing delimiter collisions by construction.

- [ ] **Step 1: Write the failing test** in `src/remix/motion/names.test.ts`. Assert:
  - `viewTransitionName("new-task", "dialog")` returns `"new-task--dialog"`.
  - `viewTransitionName("saved")` returns `"saved"`.
  - Verbatim preservation: `viewTransitionName("custom_ident", "part")` returns `"custom_ident--part"` (no mutating or stripping valid characters).
  - Delimiter non-collision: `viewTransitionName("new", "task-dialog") !== viewTransitionName("new-task", "dialog")`.
  - Delimiter non-collision with spaces or stems: `viewTransitionName("a-b", "c") !== viewTransitionName("a", "b-c")`.
  - `<custom-ident>` validity: result is a non-empty string starting with a letter, underscore, or double hyphen (CSS Values 4 `<dashed-ident>`).

```ts
expect(viewTransitionName("new-task", "dialog")).toBe("new-task--dialog")
expect(viewTransitionName("saved")).toBe("saved")
expect(viewTransitionName("new", "task-dialog")).not.toBe(viewTransitionName("new-task", "dialog"))
expect(viewTransitionName("a-b", "c")).not.toBe(viewTransitionName("a", "b-c"))
```

- [ ] **Step 2: Run it to verify it fails.**

Run: `bun test src/remix/motion/names.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `viewTransitionName(id: string, part?: string): string` in `src/remix/motion/names.ts`.**
  ```ts
  export function viewTransitionName(id: string, part?: string): string {
    return part !== undefined && part.length > 0 ? `${id}--${part}` : id
  }
  ```
  No sanitising: verbatim preservation matching `overlay()`. Delimiter `--` ensures stem and part never collide.

- [ ] **Step 4: Export it from `src/remix/index.ts`** beside `overlay`.

- [ ] **Step 5: Run the tests to verify they pass.**

Run: `bun test src/remix/motion/names.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit.**

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

- [ ] **Step 1: Write the failing test** in `src/remix/field/field.test.tsx`, beside the existing test `it("moves its list in and out as Popover's surface does, on tokens reduced motion zeroes")`. Render an invalid field and assert its control block's `animation` names `ui-motion-shake` with the two new tokens; render a `type="search"` field and assert a `::-webkit-search-cancel-button` rule transitioning `opacity` on the same tokens. Assert both token values start with `var(--dur-` / `var(--ease-` (the reduced-motion reset only zeroes tokens that read the schema).

- [ ] **Step 2: Run it to verify it fails.**

Run: `bun test src/remix/field/field.test.tsx`
Expected: FAIL — unknown tokens / missing animation.

- [ ] **Step 3: Implement.** Mix `shake({ duration: "var(--ui-field-error-duration)", easing: "var(--ui-field-error-easing)" })` into the control's `[aria-invalid="true"]` rule (same block as the invalid border, keeping the co-location rule). Style the cancel button in its own block: `opacity` + `transition: opacity <tokens>`; unsupported engines drop the vendor pseudo-element rule whole, which is the documented degradation. The shake runs on insertion (frame navigation replaces the control, so it shakes after a failed submission round-trip); client-side typing does not re-trigger it, which is accepted and noted in the motion page.

- [ ] **Step 4: Run the tests.**

Run: `bun test src/remix/field/field.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/remix/field/ && git commit -m "feat(field): error shake and search-cancel dissolve

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task D: CopyButton confirm — icon swap, success check, dissolve

**Files:**
- Create: `src/remix/copy-button/tokens.ts`
- Modify: `src/remix/copy-button/copy-button.tsx`, `src/remix/copy-button/copy-button.test.tsx`, `src/remix/runtime.ts`, `src/remix/runtime.test.ts`, `src/remix/tokens.ts`, `src/remix/tokens.test.ts`

**Interfaces:**
- Consumes: `drawCheck`, `dissolve` from `../motion/motion.ts`.
- Produces: repo-wide no-literal duration/easing guard test in `tokens.test.ts`.

New tokens:
```ts
"ui-copy-confirm-duration": "var(--dur-fast)",
"ui-copy-confirm-easing": "var(--ease-out-quad)",
```

The component and runtime changes:
- `CopyButton` renders an icon wrapper (carrying the checkmark SVG path) and label containers for both the default label/children and the confirm label. Under `[data-copy-confirmed]`, the checkmark SVG draws via `drawCheck` and the confirm label dissolves in via `dissolve`, while default label dissolves out.
- In `src/remix/runtime.ts`: `--copy`'s handler sets `source.setAttribute("data-copy-confirmed", "")` WITHOUT overwriting `source.textContent`. In the revert timer callback, `source.removeAttribute("data-copy-confirmed")` removes the attribute, allowing a subsequent copy to re-trigger the animation cleanly.

- [ ] **Step 1: Write the failing tests.**
  - Component test in `copy-button.test.tsx`: render `CopyButton`, assert the checkmark SVG path and label wrapper are present; assert a `[data-copy-confirmed]` rule whose `animation` names `ui-motion-draw` with `ui-copy-confirm-*` tokens, and confirm label dissolves via `dissolve`.
  - Runtime test in `runtime.test.ts`: trigger `--copy`, assert `data-copy-confirmed` attribute is set on the button; advance timers past `COPY_CONFIRM_DURATION_MS`, assert `data-copy-confirmed` is removed; trigger `--copy` again, assert `data-copy-confirmed` is set once more.
  - Repo-wide token guard in `tokens.test.ts`: add `it("contains no literal durations or easing curves anywhere in token defaults")` asserting that no token default in `componentTokens` matches `/\d+ms|\d+s|cubic-bezier/`.

- [ ] **Step 2: Run them to verify they fail.**

Run: `bun test src/remix/copy-button/copy-button.test.tsx src/remix/runtime.test.ts src/remix/tokens.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement.**
  - Create `src/remix/copy-button/tokens.ts` with `ui-copy-confirm-duration` and `ui-copy-confirm-easing`.
  - In `copy-button.tsx`, render checkmark SVG and confirm label span; mix `drawCheck` and `dissolve` under `&[data-copy-confirmed]`.
  - In `runtime.ts`, `--copy` sets `data-copy-confirmed` attribute; revert timer removes it.
  - In `tokens.ts`, aggregate `copyTokens`.
  - In `tokens.test.ts`, add `"ui-copy"` to prefixes and implement the repo-wide no-literal guard.

- [ ] **Step 4: Run the tests.**

Run: `bun test src/remix/copy-button/copy-button.test.tsx src/remix/runtime.test.ts src/remix/tokens.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/remix/copy-button/ src/remix/runtime.ts src/remix/runtime.test.ts src/remix/tokens.ts src/remix/tokens.test.ts && git commit -m "feat(copy-button): confirmed state draws a check and dissolves

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

- [ ] **Step 1: Write the failing tests.** Badge: render with children, assert `animation: ui-motion-pop var(--ui-badge-pop-duration) var(--ui-badge-pop-easing)` in the badge's own block (property-disjoint from `badgeBase` and tone block). TabBar: render an item with a `badge`, assert the badge element's block names `ui-motion-pop` with `ui-tabbar-badge-pop-*` tokens; render an item with a `dot`, assert the same.

- [ ] **Step 2: Run them to verify they fail.**

Run: `bun test src/remix/badge/badge.test.tsx src/remix/tab-bar/tab-bar.test.tsx`
Expected: FAIL — no pop tokens, no animation.

- [ ] **Step 3: Implement.** Mix `pop` into Badge and TabBar badge/dot elements. Insertion triggers the pop (frame navigation replacement); client-side mutations without replacement do not re-pop, which is documented.

- [ ] **Step 4: Run the tests.**

Run: `bun test src/remix/badge/badge.test.tsx src/remix/tab-bar/tab-bar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit.**

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

No new tokens: `::view-transition-group` timing reads the existing `ui-tabs-transition-duration`/`ui-tabs-transition-easing`.

- [ ] **Step 1: Write the failing tests** in `src/remix/tabs/tabs.test.tsx`.
  - With `name="views"`: assert the line-variant indicator rule carries `view-transition-name: views--indicator` (the exact output of `viewTransitionName("views", "indicator")`); assert a `::view-transition-group(views--indicator)` rule setting `animation-duration`/`animation-timing-function` from the tabs transition tokens.
  - Without `name`: assert no `view-transition-name` appears anywhere in the styles — today's instant switch, unchanged.

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

No new tokens: group timing reads the existing `ui-toast-transition-duration`/`ui-toast-transition-easing`. The toast's id is already page-unique by the `toast()` contract.

- [ ] **Step 1: Write the failing test** in `src/remix/toaster/toaster.test.tsx`. Render `toast("saved")` and assert the shell block carries `view-transition-name: saved--toast` (via `viewTransitionName(id, "toast")`) plus a `::view-transition-group(saved--toast)` timing rule on the toast tokens. Render two toasters with different names and assert their names differ.

- [ ] **Step 2: Run it to verify it fails.**

Run: `bun test src/remix/toaster/toaster.test.tsx`
Expected: FAIL — no transition names.

- [ ] **Step 3: Implement.** Apply `viewTransitionName(toast.id, "toast")` and its `::view-transition-group` timing to the toast shell block.

- [ ] **Step 4: Run the tests.**

Run: `bun test src/remix/toaster/toaster.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/remix/toaster/ && git commit -m "feat(toaster): stack shifts morph under view transitions

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

Decision: `emitTokensCss(theme, options)` accepts `options?: { viewTransitions?: "auto" }`. When present, it emits `@view-transition { navigation: auto; }` and token-timed root-pseudo rules. `ThemeStyleProps` gains `viewTransitions?: "auto" | undefined` to forward the option to `emitTokensCss`. Absent by default, so default stylesheets are byte-identical to existing output.

- [ ] **Step 1: Write the failing tests.**
  - `src/design/css/emit.test.ts`: default `emitTokensCss(theme)` contains no `@view-transition`; with `{ viewTransitions: "auto" }` it contains `@view-transition { navigation: auto; }` and `::view-transition-old(root), ::view-transition-new(root)` reading `var(--dur-base)` and `var(--ease-in-out-smooth)` — no literals.
  - `src/remix/theme-style.test.tsx`: default render contains no `@view-transition`; with `viewTransitions="auto"` it renders the opt-in rules.

- [ ] **Step 2: Run them to verify they fail.**

Run: `bun test src/design/css/emit.test.ts src/remix/theme-style.test.tsx`
Expected: FAIL — no such option or prop.

- [ ] **Step 3: Implement.** Emit the at-rule and root-pseudo timing only when `options?.viewTransitions === "auto"`. Forward `viewTransitions` from `ThemeStyle` to `emitTokensCss`. Supported in Chrome 126+, Safari 18.2+; unsupported in stable Firefox where navigation remains ordinary full-page loads. Root old/new pseudo rules read `--dur-base`/`--ease-in-out-smooth` so reduced-motion zeroes them centrally.

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
3. **Counts**: `Badge` with live count pop-in (`ui-motion-pop`).
4. **Notification**: `TabBar` with badge and dot pop-in.
5. **Search**: `Field type="search"` with clear dissolve.
6. **Loading**: `Skeleton` block + text-sized `Skeleton` + revealed content panel mixing `dissolve`, plus Shimmer Text demonstration mixing `shimmer` from `motion.ts`.
7. **Tabs**: line `Tabs` with `name`, noting route-link status and caller gap.
8. **Stacked**: two toasts with stacking transition names.
9. **Press**: `Button` scale press feedback beside `Switch` toggle feedback.
10. **Menu**: `Menu`/`Popover` entry morph with `interpolate-size` deferral note.
11. **Transitions**: same- vs cross-document support table + `@view-transition` opt-in code snippet.

- [ ] **Step 1: Write the failing tests.**
  - `src/design/css/reset.test.ts`: `:root[data-motion="reduce"]` zeroes every `--dur-*` token with `!important`.
  - `src/mini/document.test.tsx`: `motion="reduce"` renders `data-motion="reduce"`.
  - `apps/playground/app/router.test.tsx`: `?motion=reduce` sets `data-motion="reduce"` on `<html>`.

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
