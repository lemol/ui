# Motion system and polish layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship M5: the twelve micro-interactions on their components, the shared keyframe mixins behind them, minted `view-transition-name`s on the `overlay()` pattern, the opt-in cross-document view-transition CSS, and a `/pages/motion` playground page with a reduced-motion toggle beside the no-JS toggle.

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
- **The gate for every change is `bun run check`** (lint + typecheck + test).
- **Commit messages** end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- **No proof changes.** The check stage proves this head with the existing scenarios; this plan registers no new ones.

## Load-bearing findings

Checked against the current tree before this plan was written; each carries the rerunnable command, not just a file line.

- **`remix` 3.1.0 ships no same-document view-transition caller.** `grep -rl "startViewTransition" "$R/src" "$R/dist"` (with `$R` the resolved `remix` install) prints nothing (`rc=1`), and `grep -rli "view-transition" "$R/guides" "$R/INDEX.md" "$R/README.md"` prints nothing (`rc=1`). Same-document transitions need `document.startViewTransition()`, which is JavaScript — so "opt-in CSS with no JavaScript" holds for cross-document only. This plan ships the CSS side (minted names, `::view-transition-group` timing) ready for a caller, and records the caller as depending on `remix` or a future ladder-step-3 behaviour, not on this milestone.
- **Two visible elements sharing a `view-transition-name` throw and skip the transition.** Task-brief premise, restated in `docs/motion.md` ("Names must be minted, not written"); the factory in Task B exists because of it.
- **A view-transition-name must be a `<custom-ident>`.** `--`-prefixed names and `::`-joined names are not valid there, so the factory joins with `-` and sanitises; Task B's tests pin both.
- **Motion page route pattern is `/pages/dashboard`.** `apps/playground/app/routes.ts` maps `dashboard: get("/pages/dashboard")`; Task J copies that shape as `motion: get("/pages/motion")`.
- **The switchers already preserve unknown params.** `HiddenFields` carries every current param except `except`, so the new `motion` param rides along in every existing form with no change to them.

## Review Focus

Five failure modes the plan implies but no task's tests fully exercise; each line gets its test pinned to the owning task in that task's own step style.

- Two `Tabs` (or two toasts, two menus) on one page derive the same transition name because their stems collide — Task B's uniqueness test plus Task G's stem-scoping test.
- A `Tabs` with no `name` renders today's instant switch with no error — Task G asserts the indicator carries no `view-transition-name` when the stem is absent.
- A server-rendered `Field` with `error` shakes once on page load, which reads as motion on arrival rather than feedback to an action — Task C asserts the shake keyframes exist and are token-timed; the motion page (Task J) demonstrates the invalid state behind its own section so the arrival shake is seen during implementation and can be judged there.
- Under `prefers-reduced-motion: reduce`, the UA's own root crossfade is UA behaviour, not ours — Task I asserts only our `::view-transition-group` / root-pseudo timing rules read tokens (and so zero out), and names the UA default as explicitly uncovered.
- `@view-transition { navigation: auto; }` emitted for a consumer whose engine ignores it must change nothing — Task I asserts the opt-in is a separate conditional string, absent by default, so the default sheet is byte-identical to today's.

## File Structure

| File | Responsibility | Task |
| --- | --- | --- |
| `src/remix/motion/motion.ts` | Create: shared keyframe mixin factories (`shake`, `pop`, `drawCheck`, `dissolve`) | A |
| `src/remix/motion/motion.test.ts` | Create: keyframe names, token reads, degradation shape | A |
| `src/remix/motion/names.ts` | Create: the minted `view-transition-name` factory | B |
| `src/remix/motion/names.test.ts` | Create: uniqueness, sanitising, ident validity | B |
| `src/remix/motion/README.md` | Create: what lives here and why keyframes are shared but tokens are not | A |
| `src/remix/field/tokens.ts` | Modify: `ui-field-error-duration`, `ui-field-error-easing` | C |
| `src/remix/field/field.tsx` | Modify: shake on `[aria-invalid]`, dissolve on the search cancel button | C |
| `src/remix/field/field.test.tsx` | Modify: the shake/dissolve suite | C |
| `src/remix/copy-button/tokens.ts` | Create: `ui-copy-confirm-duration`, `ui-copy-confirm-easing` | D |
| `src/remix/copy-button/copy-button.tsx` | Modify: confirm state draws a check and dissolves | D |
| `src/remix/copy-button/copy-button.test.tsx` | Modify: the confirm suite | D |
| `src/remix/runtime.ts` | Modify: `--copy` sets `data-copy-confirmed` alongside the label swap | D |
| `src/remix/runtime.test.ts` | Modify: the attribute assertion | D |
| `src/remix/tokens.ts` | Modify: aggregate `copyTokens` | D |
| `src/remix/tokens.test.ts` | Modify: the `ui-copy` prefix joins the list | D |
| `src/remix/index.ts` | Modify: export `viewTransitionName` | B |
| `src/remix/badge/tokens.ts` | Modify: `ui-badge-pop-duration`, `ui-badge-pop-easing` | E |
| `src/remix/badge/badge.tsx` | Modify: count pop-in | E |
| `src/remix/badge/badge.test.tsx` | Modify: the pop suite | E |
| `src/remix/tab-bar/tokens.ts` | Modify: `ui-tabbar-badge-pop-duration`, `ui-tabbar-badge-pop-easing` | E |
| `src/remix/tab-bar/tab-bar.tsx` | Modify: badge/dot pop-in | E |
| `src/remix/tab-bar/tab-bar.test.tsx` | Modify: the pop suite | E |
| `src/remix/button/button.tsx` | Modify: `:active` press on `scale` | F |
| `src/remix/button/button.test.tsx` | Modify: press suite + `scale` keyword argument | F |
| `src/remix/tabs/tabs.tsx` | Modify: optional `name` stem scoping the indicator's transition name + group timing | G |
| `src/remix/tabs/tabs.test.tsx` | Modify: the morph suite (present with stem, absent without) | G |
| `src/remix/toaster/toaster.tsx` | Modify: toast-scoped transition names for stack shifts | H |
| `src/remix/toaster/toaster.test.tsx` | Modify: the stacking suite | H |
| `src/design/css/emit.ts` | Modify: `EmitOptions.viewTransitions` + root-pseudo timing emission | I |
| `src/design/css/emit.test.ts` | Modify: opt-in absent by default, present and tokenised when asked | I |
| `src/design/css/reset.ts` | Modify: `:root[data-motion="reduce"]` zeroing, same derivation as the media query | J |
| `src/design/css/reset.test.ts` | Modify: the manual override suite | J |
| `src/mini/document.tsx` | Modify: `motion?: "reduce"` prop → `data-motion`, blank-axis preserve | J |
| `src/mini/document.test.tsx` | Modify: the attribute suite (follow the existing scheme/density cases) | J |
| `apps/playground/app/routes.ts` | Modify: `motion: get("/pages/motion")` | J |
| `apps/playground/app/actions/controller.tsx` | Modify: `pageQuery` reads `motion`, every render action passes it through | J |
| `apps/playground/app/ui/switchers.tsx` | Modify: Motion Full/Reduce group beside Scripts | J |
| `apps/playground/app/ui/motion.tsx` | Create: the motion page | J |
| `apps/playground/app/ui/home.tsx` | Modify: Recipes gains the Motion link | J |
| `apps/playground/app/router.test.tsx` | Modify: motion-axis cases beside the scheme/density ones | J |
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
- Produces: `shake(timing)`, `pop(timing)`, `drawCheck(timing)`, `dissolve(timing)` for Tasks C–F, each taking `{ duration: string; easing: string }` (component token refs as strings) and returning a `CSSMixinDescriptor` carrying an `animation` shorthand plus its `@keyframes` block. Keyframe names are shared and fixed: `ui-motion-shake`, `ui-motion-pop`, `ui-motion-draw`, `ui-motion-dissolve` — two elements sharing a `@keyframes` name is the normal case (the `Spinner` precedent), not a collision.

- [ ] **Step 1: Write the failing test** in `src/remix/motion/motion.test.ts`. Render a probe element mixing each factory with literal token refs (e.g. `shake({ duration: "var(--ui-probe-duration)", easing: "var(--ui-probe-easing)" })`) through `renderToHtml` + `stylesOf`, and assert: each block contains its `@keyframes ui-motion-*` name; each `animation` value contains the passed duration and easing refs and no literal `ms` or `cubic-bezier`. Assert the `animation` shorthand is a single `animation` property (completing instantly at `0ms` is what the reduced-motion reset relies on — a split `animation-duration` elsewhere would still work, but the shorthand keeps the whole effect in one block).

```tsx
const html = await renderToHtml(<div mix={shake({ duration: "var(--ui-probe-duration)", easing: "var(--ui-probe-easing)" })} />)
const styles = stylesOf(html)
expect(styles).toContain("@keyframes ui-motion-shake")
expect(styles).toContain("animation: ui-motion-shake var(--ui-probe-duration) var(--ui-probe-easing)")
expect(styles).not.toMatch(/\d+ms/)
expect(styles).not.toContain("cubic-bezier")
```

- [ ] **Step 2: Run it to verify it fails.**

Run: `bun test src/remix/motion/motion.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `shake`, `pop`, `drawCheck`, `dissolve` in `src/remix/motion/motion.ts`.** One factory per effect; the keyframe bodies are the implementer's (shake: horizontal translate decay; pop: `scale` 0.6→1 on the spring easing the caller passes; drawCheck: `stroke-dashoffset` for an SVG check path; dissolve: opacity + slight translate). Each factory takes only the timing — distances and offsets are small structural constants inside the keyframes (a `translateX(-4px)` decay is structure, not a theme value, the same way `Spinner`'s `rotate` is).
- [ ] **Step 4: Run the test to verify it passes.**

Run: `bun test src/remix/motion/motion.test.ts`
Expected: PASS.

- [ ] **Step 5: Write `src/remix/motion/README.md`.** Three paragraphs: keyframes are shared because sharing them is safe; timing tokens are per-component because retuning is per-component; names (`view-transition-name`) are minted in `names.ts` because sharing those throws.
- [ ] **Step 6: Commit.**

```bash
git add src/remix/motion/ && git commit -m "feat(motion): shared keyframe mixins for the polish layer

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

### Task B: the minted transition-name factory

**Files:**
- Create: `src/remix/motion/names.ts`
- Create: `src/remix/motion/names.test.ts`
- Modify: `src/remix/index.ts` (export the factory)

**Interfaces:**
- Consumes: nothing.
- Produces: `viewTransitionName(id: string, part: string): string` for Tasks G–H — the `overlay()` pattern for transition names. Components pass their already-minted id (`overlay()`/`popover()`/`toast()` ids, `Field`'s name stem, `Tabs`' `name` stem) plus a part (`"indicator"`, `"surface"`, `"toast"`), and never write the name themselves.

- [ ] **Step 1: Write the failing test** in `src/remix/motion/names.test.ts`. Assert: `viewTransitionName("new-task", "dialog")` returns `"new-task-dialog"`; characters outside `[a-zA-Z0-9-_]` are replaced with `-` (`viewTransitionName("a b", "c::d")` contains neither a space nor `::`); the result matches `/^[a-zA-Z_][a-zA-Z0-9-_]*$/` (a valid `<custom-ident>`: no leading digit, no `--` prefix); two different stems never collide.

```ts
expect(viewTransitionName("new-task", "dialog")).toBe("new-task-dialog")
expect(viewTransitionName("sales q3", "card::hero")).toBe("sales-q3-card-hero")
expect(viewTransitionName("9lives", "toast")).toMatch(/^[a-zA-Z_]/)
```

- [ ] **Step 2: Run it to verify it fails.**

Run: `bun test src/remix/motion/names.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `viewTransitionName(id: string, part: string): string` in `src/remix/motion/names.ts`.** Join with `-`, sanitise, prefix-guard a leading digit. No uniqueness counter: uniqueness comes from the caller's minted id, which the existing factories already keep page-unique (a duplicate id is already a duplicate-id bug before transitions are involved).
- [ ] **Step 4: Export it from `src/remix/index.ts`** beside `overlay`, so apps can scope their own morphs the same way.
- [ ] **Step 5: Run the tests to verify they pass.**

Run: `bun test src/remix/motion/names.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add src/remix/motion/names.ts src/remix/motion/names.test.ts src/remix/index.ts && git commit -m "feat(motion): mint view-transition-names like commandfor ids

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

### Task C: Field error shake and search-cancel dissolve

**Files:**
- Modify: `src/remix/field/tokens.ts`, `src/remix/field/field.tsx`, `src/remix/field/field.test.tsx`

**Interfaces:**
- Consumes: `shake` from `../motion/motion.ts`.
- Produces: nothing for later tasks.

New tokens (both defaulting relationally, both asserted by the existing `defaults every token to a primitive that exists` test with no change to it):

```ts
"ui-field-error-duration": "var(--dur-fast)",
"ui-field-error-easing": "var(--ease-out-quad)",
```

- [ ] **Step 1: Write the failing test** in `src/remix/field/field.test.tsx`, beside the existing picker-transition suite. Render an invalid field and assert its control block's `animation` names `ui-motion-shake` with the two new tokens; render a `type="search"` field and assert a `::-webkit-search-cancel-button` rule transitioning `opacity` on the same tokens. Assert both token values start with `var(--dur-` / `var(--ease-` (the reduced-motion reset only zeroes tokens that read the schema — the same assertion the picker test already makes at line ~906).

- [ ] **Step 2: Run it to verify it fails.**

Run: `bun test src/remix/field/field.test.tsx`
Expected: FAIL — unknown tokens / missing animation.

- [ ] **Step 3: Implement.** Mix `shake({ duration: "var(--ui-field-error-duration)", easing: "var(--ui-field-error-easing)" })` into the control's `[aria-invalid="true"]` rule (same block as the invalid border, keeping the co-location rule — the invalid presentation and its motion stay in one sub-layer). Style the cancel button in its own block: `opacity` + `transition: opacity <tokens>`; unsupported engines drop the vendor pseudo-element rule whole, which is the documented degradation. The shake runs on insertion (frame navigation replaces the control, so it shakes after a failed submission round-trip); client-side typing does not re-trigger it, which is accepted and noted in the motion page.
- [ ] **Step 4: Run the tests.**

Run: `bun test src/remix/field/field.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/remix/field/ && git commit -m "feat(field): error shake and search-cancel dissolve

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

### Task D: CopyButton confirm — icon swap, success check, dissolve

**Files:**
- Create: `src/remix/copy-button/tokens.ts`
- Modify: `src/remix/copy-button/copy-button.tsx`, `src/remix/copy-button/copy-button.test.tsx`, `src/remix/runtime.ts`, `src/remix/runtime.test.ts`, `src/remix/tokens.ts`, `src/remix/tokens.test.ts`

**Interfaces:**
- Consumes: `drawCheck`, `dissolve` from `../motion/motion.ts`.
- Produces: nothing for later tasks.

New tokens:

```ts
"ui-copy-confirm-duration": "var(--dur-fast)",
"ui-copy-confirm-easing": "var(--ease-out-quad)",
```

The runtime change: `--copy`'s handler sets `data-copy-confirmed=""` on the button alongside the existing label swap (attribute, not a second text path — the label swap stays exactly as it is). CSS animates off the attribute, so the no-JS render (no attribute, no animation) and the unconfirmed state are untouched.

- [ ] **Step 1: Write the failing tests.** Component test: render a `CopyButton`, assert a `[data-copy-confirmed]` rule whose `animation` names `ui-motion-draw` with the two new tokens, and that the confirm label span dissolves (opacity transition on the same tokens). Runtime test: drive `--copy` per the existing runtime suite and assert the button carries `data-copy-confirmed` after the handler runs, beside the swapped label.
- [ ] **Step 2: Run them to verify they fail.**

Run: `bun test src/remix/copy-button/copy-button.test.tsx src/remix/runtime.test.ts`
Expected: FAIL — no tokens, no attribute.

- [ ] **Step 3: Implement.** `copy-button/tokens.ts` with the two tokens; component mixes `drawCheck`/`dissolve` under `[data-copy-confirmed]`; `runtime.ts` sets the attribute in the `--copy` handler; `tokens.ts` aggregates `copyTokens`; `tokens.test.ts` gains `"ui-copy"` in the prefix list (the `holds every component's tokens` test splits on the first two dashes — `ui-copy-*` is a new prefix, and the test fails until it is listed, which is the intended prompt).
- [ ] **Step 4: Run the tests.**

Run: `bun test src/remix/copy-button/copy-button.test.tsx src/remix/runtime.test.ts src/remix/tokens.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/remix/copy-button/ src/remix/runtime.ts src/remix/runtime.test.ts src/remix/tokens.ts src/remix/tokens.test.ts && git commit -m "feat(copy-button): confirmed state draws a check and dissolves

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

### Task E: notification badge and count pop-in

**Files:**
- Modify: `src/remix/badge/tokens.ts`, `src/remix/badge/badge.tsx`, `src/remix/badge/badge.test.tsx`, `src/remix/tab-bar/tokens.ts`, `src/remix/tab-bar/tab-bar.tsx`, `src/remix/tab-bar/tab-bar.test.tsx`

**Interfaces:**
- Consumes: `pop` from `../motion/motion.ts`.
- Produces: nothing for later tasks.

New tokens (entrances read the spring, per `docs/motion.md`):

```ts
"ui-badge-pop-duration": "var(--dur-fast)",
"ui-badge-pop-easing": "var(--ease-spring)",
"ui-tabbar-badge-pop-duration": "var(--dur-fast)",
"ui-tabbar-badge-pop-easing": "var(--ease-spring)",
```

Two token pairs rather than one shared pair: retuning a badge pop must not retune a tab-bar badge pop. The existing `ui-tabbar-duration`/`ui-tabbar-easing` time the mark pill's hover, a different effect.

- [ ] **Step 1: Write the failing tests.** Badge: render with children, assert `animation: ui-motion-pop var(--ui-badge-pop-duration) var(--ui-badge-pop-easing)` in the badge's own block (property-disjoint from `badgeBase` and the tone block — assert via `blocksOn(html, "span")` + `sharedProperties`, non-empty check first). TabBar: render an item with a `badge`, assert the badge element's block names `ui-motion-pop` with the `ui-tabbar-badge-pop-*` tokens; render an item with a `dot`, assert the same.
- [ ] **Step 2: Run them to verify they fail.**

Run: `bun test src/remix/badge/badge.test.tsx src/remix/tab-bar/tab-bar.test.tsx`
Expected: FAIL — no pop tokens, no animation.

- [ ] **Step 3: Implement.** The pop runs on insertion: after a frame navigation that changes the count, the replaced badge element pops. A count that changes client-side without replacement does not re-pop; that is accepted (same mechanism note as Task C). `Badge` keeps its "no transition" rule for tones — the pop is an entrance `animation`, not a hover transition, so the "status colours have no `-hover` arm" reasoning still holds.
- [ ] **Step 4: Run the tests.**

Run: `bun test src/remix/badge/badge.test.tsx src/remix/tab-bar/tab-bar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/remix/badge/ src/remix/tab-bar/ && git commit -m "feat(badge): count and notification pop-in

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

### Task F: press feedback on Button (like/toggle)

**Files:**
- Modify: `src/remix/button/button.tsx`, `src/remix/button/button.test.tsx`

**Interfaces:**
- Consumes: nothing new. Produces: nothing for later tasks.

No new tokens: press is a transition on the existing `ui-btn-transition-duration`/`ui-btn-transition-easing`.

- [ ] **Step 1: Write the failing test** in `src/remix/button/button.test.tsx`. Assert the base block (the one the test already identifies as owning `transitionDuration`) transitions `scale` alongside its current properties, and that an `&:active` rule sets `scale` below 1. The `scale` factor is a structural constant, not a theme value — but `nonPrimitiveValues`-style checks flag unknown literals, so this step also adds the exact factor string to that test's keyword set with the one-line argument the file's own convention requires (each keyword is argued where it is named). The factor is `0.97`: perceptible on a thumb, invisible in a screenshot diff at a glance.
- [ ] **Step 2: Run it to verify it fails.**

Run: `bun test src/remix/button/button.test.tsx`
Expected: FAIL — no `scale` in the transition, no `:active` rule.

- [ ] **Step 3: Implement.** `transitionProperty` gains `scale`; `&:active` sets it, in the same block (co-location: the property and its trigger state share a sub-layer). `Switch` needs no change — its thumb travel and track fade already carry toggle feedback, and the motion page demonstrates both side by side so the pairing can be judged.
- [ ] **Step 4: Run the tests.**

Run: `bun test src/remix/button/button.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/remix/button/ && git commit -m "feat(button): press feedback on scale

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

### Task G: Tabs sliding indicator (minted morph)

**Files:**
- Modify: `src/remix/tabs/tabs.tsx`, `src/remix/tabs/tabs.test.tsx`

**Interfaces:**
- Consumes: `viewTransitionName` from `./motion/names.ts` (Task B).
- Produces: the worked example of a minted morph later tasks copy.

No new tokens: the `::view-transition-group` timing reads the existing `ui-tabs-transition-duration`/`ui-tabs-transition-easing`.

- [ ] **Step 1: Write the failing tests** in `src/remix/tabs/tabs.test.tsx`. With `name="views"`: assert the line-variant indicator rule carries `view-transition-name: views-indicator` (the exact output of `viewTransitionName("views", "indicator")` — call the factory in the test rather than restating the string, so the test breaks if the factory's joining changes); assert a `::view-transition-group(views-indicator)` rule setting `animation-duration`/`animation-timing-function` from the tabs transition tokens. Without `name`: assert no `view-transition-name` appears anywhere in the styles — today's instant switch, unchanged.
- [ ] **Step 2: Run them to verify they fail.**

Run: `bun test src/remix/tabs/tabs.test.tsx`
Expected: FAIL — no `name` prop, no transition names.

- [ ] **Step 3: Implement.** `TabsProps` gains `name?: string` — an id stem on the `Field` convention, used only to scope the indicator's transition name; absent means no morph. The indicator is the `[aria-current]` border (line) / raised fill (pill): apply the name to the `[aria-current]` element's rule so old and new currents morph into each other under a same-document transition. The pill variant's fill morphs the same way. Until a `startViewTransition` caller exists (see Load-bearing findings), the name is inert — an unknown-but-valid property on engines without support, a scoped name waiting on engines with it. That is the benign failure mode, and the motion page says so next to the demo.
- [ ] **Step 4: Run the tests.**

Run: `bun test src/remix/tabs/tabs.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/remix/tabs/ && git commit -m "feat(tabs): sliding indicator via a minted transition name

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

### Task H: Toaster banner stacking (minted morph)

**Files:**
- Modify: `src/remix/toaster/toaster.tsx`, `src/remix/toaster/toaster.test.tsx`

**Interfaces:**
- Consumes: `viewTransitionName` from `./motion/names.ts`.
- Produces: nothing for later tasks.

No new tokens: group timing reads the existing `ui-toast-transition-duration`/`ui-toast-transition-easing`. The toast's id is already page-unique by the `toast()` contract, so it scopes the name directly.

- [ ] **Step 1: Write the failing test** in `src/remix/toaster/toaster.test.tsx`. Render `toast("saved")` and assert the shell block carries `view-transition-name: saved-toast` (via the factory, not a restated string) plus a `::view-transition-group(saved-toast)` timing rule on the toast tokens. Render two toasters with different names and assert their names differ.
- [ ] **Step 2: Run it to verify it fails.**

Run: `bun test src/remix/toaster/toaster.test.tsx`
Expected: FAIL — no transition names.

- [ ] **Step 3: Implement.** When a second toast arrives via frame navigation, surviving toasts shift; under a same-document transition the shift animates instead of snapping. Same inert-until-a-caller-exists status as Task G.
- [ ] **Step 4: Run the tests.**

Run: `bun test src/remix/toaster/toaster.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/remix/toaster/ && git commit -m "feat(toaster): stack shifts morph under view transitions

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

Explicitly out of scope here, and the plan says so in the motion page rather than silently: the dropdown menu morph. `Menu`/`Popover` entry/exit already animate (M1/M2 mechanism); animating a surface's *size* as its content changes needs `interpolate-size: allow-keywords`, which is Chromium-only and below the baseline — so no new code ships for it in M5, and the motion page demonstrates the entry morph with that note attached.

### Task I: cross-document opt-in and root timing

**Files:**
- Modify: `src/design/css/emit.ts`, `src/design/css/emit.test.ts`

**Interfaces:**
- Consumes: nothing. Produces: `EmitOptions.viewTransitions` for Task J's `Document`/`ThemeStyle` path if they choose to expose it (default: unexposed — the playground opts in directly through `emitTokensCss` options in `ThemeStyle`? No: `ThemeStyle` takes a theme, not emit options. Decision locked here: the option lives on `emitTokensCss` only, and `ThemeStyle` gains no prop in M5. The playground opts in by passing the option where it calls `emitTokensCss` — which is inside `ThemeStyle`. Contradiction — resolve: `ThemeStyle` gains `viewTransitions?: "auto" | undefined`, passed straight to `emitTokensCss`. `ThemeStyle`'s test asserts the at-rule is absent by default.)

Revised file list for this task: also modify `src/remix/theme-style.tsx` + its test.

- [ ] **Step 1: Write the failing tests.** Emit test: default `emitTokensCss(theme)` output contains no `@view-transition`; with `{ viewTransitions: "auto" }` it contains `@view-transition { navigation: auto; }` and a `::view-transition-old(root), ::view-transition-new(root)` rule whose duration/timing read `var(--dur-base)` / `var(--ease-in-out-smooth)` — never literals. `ThemeStyle` test: default render carries no `@view-transition` text; with `viewTransitions="auto"` it does.
- [ ] **Step 2: Run them to verify they fail.**

Run: `bun test src/design/css/emit.test.ts src/remix/theme-style.test.tsx`
Expected: FAIL — no such option.

- [ ] **Step 3: Implement.** The at-rule and root-pseudo timing emit only under the option, after `reducedMotionCss` in the parts order (order is irrelevant to correctness — the reset zeroes tokens with `!important` and our rules read tokens — but adjacency keeps the motion-related tail of the sheet in one place). Chrome 126+, Safari 18.2+, no stable Firefox: elsewhere the at-rule is ignored and navigation stays ordinary, which is the benign failure the task requires. The root old/new timing reads `--dur-base`/`--ease-in-out-smooth` so a theme retunes the crossfade centrally and the reduced-motion reset zeroes it like every other duration.
- [ ] **Step 4: Run the tests.**

Run: `bun test src/design/css/emit.test.ts src/remix/theme-style.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/design/css/ src/remix/theme-style.tsx src/remix/theme-style.test.tsx && git commit -m "feat(design): opt-in cross-document view transitions

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

### Task J: playground motion page and reduced-motion toggle

**Files:**
- Create: `apps/playground/app/ui/motion.tsx`
- Modify: `src/design/css/reset.ts`, `src/design/css/reset.test.ts`, `src/mini/document.tsx`, `src/mini/document.test.tsx`, `apps/playground/app/routes.ts`, `apps/playground/app/actions/controller.tsx`, `apps/playground/app/ui/switchers.tsx`, `apps/playground/app/ui/home.tsx`, `apps/playground/app/router.test.tsx`

**Interfaces:**
- Consumes: every component task above (the page demonstrates them), `EmitOptions.viewTransitions` (the page opts in — see below).
- Produces: nothing.

Design locked here, following the `nojs`/`compat` precedent rather than the scheme/density one: the toggle is **query-only** (`?motion=reduce`), not persisted. Reasons: `nojs`/`compat` are the toggles the brief places it beside, and both are query-only; persisting would need a `--set-motion` runtime command plus a storage key plus boot-script restoration, which is a new hand-written behaviour for a debugger, not a feature. A person's OS-level `prefers-reduced-motion` still flows through the media query untouched.

Mechanics: `pageQuery` gains `motion: params.get("motion") === "reduce" ? "reduce" : undefined` (allow-listed like scheme/density). `Document` gains `motion?: "reduce" | undefined`, rendered as `data-motion="reduce"` on `<html>`, and its blank-axis list gains `"data-motion"` when unset (same `data-rmx-preserve-attrs` reasoning as scheme/density). `reset.ts` gains the manual override, derived from the schema exactly like `reducedMotionCss`:

```css
:root[data-motion="reduce"] {
  --dur-instant: 0ms !important;
  ...
}
```

`!important` mirrors the media query: a duration in a theme's `compact` axis (higher specificity than bare `:root`) must not keep animating, and when both the media query and the toggle apply they agree (both zero). The site toggle can never re-enable motion the OS disabled — there is no `motion=full` override of the media query, deliberately.

The motion page enables cross-document transitions for itself by rendering its own `ThemeStyle`-with-option? `Document` takes a `theme`, not emit options — and per Task I the option is exposed on `ThemeStyle`, not `Document`. Decision: the motion page passes `viewTransitions` through only if Task I exposed it on `Document`; it did not. So the motion page does **not** opt the document into `@view-transition` — cross-document opt-in is demonstrated as a documented snippet on the page (the at-rule text plus where to put it), not as a live document flag, because a per-page navigation mode would make every playground link behave differently from the page under test. Record this visibly on the page rather than as a hidden inconsistency.

Page sections (each: `Eyebrow` + `Heading level={2}` + live components + one `Text tone="muted"` degradation note): Confirm (CopyButton), Invalid (Field with `error`), Counts (Badge, live count), Search (Field `type="search"`), Loading (Skeleton block + text-sized Skeleton + a revealed panel mixing `dissolve` from `motion.ts` — imported relatively, the way the playground already imports `src`, showing the skeleton→content reveal pattern), Tabs (line Tabs with `name`, note on the caller gap), Stacked (two toasts), Press (Button + Switch), Menu (Menu demo, entry morph + `interpolate-size` note), Transitions (same- vs cross-document support table + the opt-in snippet). Recipes on the home page gains the Motion link.

- [ ] **Step 1: Write the failing tests.** reset test: `reducedMotionCss`-style suite for the `data-motion` rule — every `dur-` name zeroed with `!important`, derived from `schema.motion`, in the emitted sheet always (not conditional). Document test: `motion="reduce"` renders `data-motion="reduce"`; unset renders the preserve-attrs entry — follow the existing scheme/density cases exactly. Router test: `?motion=reduce` on `/` and `/pages/motion` renders `data-motion="reduce"`; absent renders no such attribute. Switchers: extend the existing switchers render test if one exists (search `switchers` under `apps/playground` for the test file first; if none exists, the router test's attribute assertions carry this task and the step says so).
- [ ] **Step 2: Run them to verify they fail.**

Run: `bun test src/design/css/reset.test.ts src/mini/document.test.tsx apps/playground/app/router.test.tsx`
Expected: FAIL — no `motion` prop, no `data-motion` rule, 404 on `/pages/motion`.

- [ ] **Step 3: Implement** in dependency order: reset rule → Document prop → controller `pageQuery` + `motion` action (mirroring `dashboard`, title "Motion") → route → switchers Motion group (`Full`/`Reduce`, `except={["motion"]}`, disabled never — unlike Compat it needs no scripts) → motion page → home link.
- [ ] **Step 4: Run the tests.**

Run: `bun test src/design/css/reset.test.ts src/mini/document.test.tsx apps/playground/app/router.test.tsx apps/playground/app/ui/home.test.tsx apps/playground/app/ui/catalogue.test.tsx`
Expected: PASS. (Home/catalogue tests included because the home page changes; dashboard test if one exists — search `dashboard.test` first.)

- [ ] **Step 5: Commit.**

```bash
git add src/design/css/ src/mini/document.tsx src/mini/document.test.tsx apps/playground/ && git commit -m "feat(playground): motion page and reduced-motion toggle

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

### Task K: documents

**Files:**
- Modify: `docs/motion.md`, `src/remix/README.md`, `apps/playground/README.md` (only if it lists pages — check first; if it does not, the step says so and skips it)

**Interfaces:**
- Consumes: everything above. Produces: nothing.

- [ ] **Step 1: Update `docs/motion.md`.** New sections: shared keyframes (what `motion.ts` holds, why timing stays per-component); minted transition names (the factory, the `overlay()` parallel, the duplicate-name throw); the cross-document opt-in (`viewTransitions: "auto"`, support table, Firefox exclusion with the MDN-limited-availability note); the manual `data-motion` override and its precedence (OS media query wins); the deferred pieces named as deferred — same-document caller, menu size morph (`interpolate-size`), client-side retrigger without replacement. Each deferred item names what would un-defer it.
- [ ] **Step 2: Update `src/remix/README.md`.** Extend the `Spinner`/`Skeleton` reduced-motion paragraph to the new components' animations; document `viewTransitionName` beside `overlay()` in the factory section; document Tabs' `name` stem and the toast names.
- [ ] **Step 3: Check `apps/playground/README.md` for a page list.** If it lists Dashboard, add Motion the same way; if it lists no pages, do nothing and say so in the commit message.
- [ ] **Step 4: Run the full focused set once more** (every test file touched in Tasks A–J) plus `oxlint` and `tsc -p tsconfig.json` as separate commands, to prove the documents did not drift from the code they describe (names, token spellings, route paths).

Run: `bun test src/remix/motion/ src/remix/field/field.test.tsx src/remix/copy-button/ src/remix/runtime.test.ts src/remix/tokens.test.ts src/remix/badge/ src/remix/tab-bar/ src/remix/button/button.test.tsx src/remix/tabs/tabs.test.tsx src/remix/toaster/toaster.test.tsx src/design/css/ src/mini/document.test.tsx apps/playground/app/router.test.tsx`
Then: `oxlint`
Then: `bun run typecheck`
Expected: all green.

- [ ] **Step 5: Commit.**

```bash
git add docs/motion.md src/remix/README.md apps/playground/README.md && git commit -m "docs(motion): the M5 polish layer, minted names and the toggle

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```
