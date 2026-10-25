# lemol/ui architecture

Date: 2026-09-17

> **This is a dated decision record**, not maintained documentation. It records
> what was decided on this date, the reasoning at the time, and the
> alternatives that were rejected. For what is true now, read
> [docs/README.md](../../README.md) and the documents it indexes.

## Purpose

`lemol/ui` holds the UI packages shared across lemol projects. Three packages
ship now:

| Package | Owns |
| --- | --- |
| `@lemol/ui-design` | The design-system base: token schema, theme composition, CSS emission. Renderer-agnostic. |
| `@lemol/ui-remix` | Remix 3 components and the `--ui-*` token contract each one declares. |
| `@lemol/ui-remix-mini` | One concrete minimal design: a theme plus the app shell. |

Future renderers (`@lemol/ui-react`, `@lemol/ui-opentui`) would sit beside
`ui-remix` and share `ui-design`. They are out of scope here, but the package
boundary is drawn so they do not require a refactor.

An earlier design package, built for another app, already implements a mature
version of this idea — tokens, server-rendered primitives, an interactive
layer, and a live catalogue. It is the source of the lessons recorded below.
**It is not being touched.** It becomes a consumer later, under its own spec.

## Packages

```
packages/
  ui-design/                @lemol/ui-design        (renderer-agnostic)
    src/tokens.ts           primitive token schema: categories + types
    src/theme.ts            defineTheme, extendTheme
    src/ref.ts              v() — typed token reference
    src/css/emit.ts         emitTokensCss() -> string \
    src/css/layers.ts       @layer base, rmx           |  exposed at
    src/css/boot.ts         bootScript (no flash)      |  @lemol/ui-design/css
    src/css/reset.ts        element defaults          /
  ui-remix/                 @lemol/ui-remix
    src/button/             button.tsx + tokens.ts + button.test.tsx
    src/dialog/             …one directory per component
    src/theme-style.tsx     ThemeStyle — renders the emitted sheet
    src/tokens.ts           aggregates every component's contract
    src/compat.ts           Invoker Commands backfill
    src/runtime.ts          the single capture-phase command listener
  ui-remix-mini/            @lemol/ui-remix-mini
    src/theme.ts            base + dark + compact
    src/shell.tsx           Document, AppShell, Nav
    src/states.tsx          EmptyState, ErrorState
apps/
  playground/               catalogue + page recipes + switches
```

## The component-token contract

This is the load-bearing decision. Every other choice follows from it.

In that earlier package, brand decisions live *inside* components. `Button`'s
`primary` tone is not "the accent colour" — it is an amber gradient with an
inset white highlight and a `brightness(1.06)` hover. Token *names* are the
contract there, but the styling *recipe* is not. So a shared `Button` plus a
tokens-only design package would force its app to fork `Button` to keep its look,
which defeats the purpose.

Instead: **a component styles itself only through contract tokens it declares
beside itself**, each defaulting relationally to a primitive.

```ts
// ui-remix/src/button/tokens.ts
export const buttonTokens = {
  "ui-btn-primary-bg":  "var(--accent)",
  "ui-btn-primary-ink": "var(--ink-inverse)",
  "ui-btn-radius":      "var(--r-sm)",
}
```

```ts
// ui-remix/src/button/button.tsx
const toneStyles = {
  primary: {
    background: "var(--ui-btn-primary-bg)",
    color:      "var(--ui-btn-primary-ink)",
  },
}
```

A skin is then a set of token values. An app keeps its exact gradient by
overriding one value and never touching the component:

```ts
"ui-btn-primary-bg":
  "linear-gradient(180deg, var(--accent-highlight), var(--accent) 65%, var(--accent-bronze))",
```

**Composition into one stylesheet.** `ui-remix/src/tokens.ts` aggregates every
component's record and exports the union of their names as a type. The emitter
writes component defaults first and theme values second — same selector, same
specificity, later wins. No cascade-layer subtlety for custom properties and no
import-order trap.

**Typing.** `ui-design` never learns which components exist; it takes a record.
Because `ui-remix-mini` depends on both packages, it wires the types together:
`defineTheme` requires every primitive and type-checks every `--ui-*` override
against the names `ui-remix` actually declares. A renamed token fails the
typecheck instead of the design review.

**Escape hatch.** Every component accepts `mix` for one-off structural
overrides. Differences that cannot be expressed as a CSS value go there, not
into a fork.

## Renderer-agnostic split

`ui-design` owns the token schema, theme composition, `v()`, and — on the
opt-in `/css` subpath — the stylesheet emitter, cascade-layer setup, element
defaults, and boot script. All of it is strings and data: `emitTokensCss()`
returns CSS text, never a component. Renderer packages own their own
component-token contracts and their own rendering, so `ThemeStyle` — the
component that puts that text into the document — lives in `ui-remix`.

A future `ui-opentui` imports `@lemol/ui-design` and never `/css`. A future
`ui-react` imports both and shares the emitter rather than duplicating it.
Adding a component touches exactly one package.

## Theme variants: two named axes

The engine knows two variant axes and no more.

- **Scheme.** A theme declares `base` values and an optional `dark` override.
- **Density.** A `compact` override, the four-token swap already proven in
  the earlier package (`--control-h`, `--control-h-sm`, `--row-h`, `--row-pad-y`).

```ts
export const miniTheme = defineTheme({
  base:    { canvas: "#FBFBFA", surface: "#FFFFFF", ink: "#111111", hairline: "#EAEAEA" },
  dark:    { canvas: "#191919", surface: "#242424", ink: "#F4F4F0", hairline: "#3A3A3A" },
  compact: { "control-h": "28px", "row-h": "32px" },
})
```

The emitter produces:

```css
:root { --canvas: #FBFBFA; … }
@media (prefers-color-scheme: dark) {
  :root:not([data-scheme="light"]) { --canvas: #191919; … }
}
:root[data-scheme="dark"]     { --canvas: #191919; … }
:root[data-density="compact"] { --control-h: 28px; … }
```

A theme omitting `dark` is dark-only or light-only. A third axis (contrast, brand) waits until something needs one; a
general named-modes mechanism was rejected as speculative, and it would require
designing a selector-precedence story for combinations that do not yet exist.

## Native-first, and the three-step ladder

**Principle.** Components are built from native elements — including the modern
ones — so in server mode a page works before and without client JavaScript, and
in SPA mode the same components need no client code beyond the router.

This deliberately departs from the earlier package, which hand-writes a
designed fallback per component and drives behaviour from a delegated runtime. Here the
platform provides the behaviour, so most components need no runtime at all.

**The ladder, in order:**

1. **Native platform** where it fully covers the need. Zero client code.
2. **`remix/ui/*` primitives** where the need exceeds the platform — a menu's
   keyboard model and roving tabindex, combobox filtering, listbox semantics.
   These layer *over* the native element: the native popover opens with no JS,
   the primitive enhances keyboard behaviour after hydration.
3. **Hand-written** only where neither covers it.

| Need | Mechanism | Client JS |
| --- | --- | --- |
| Modal | `<dialog>` + `command="show-modal"` / `"close"` / `"request-close"` | none¹ |
| Menu, dropdown, popover | `popover` + `command="toggle-popover"` | none¹ |
| Placement | `anchor-name` / `position-anchor` / `position-area` | none, `@supports` fallback |
| Light dismiss, top layer, focus trap, Esc | `popover` / `showModal()` | none |
| Disclosure | `<details>` / `<summary>` | none |
| Accordion, one at a time | `<details name="…">` | none |
| Tooltip | `popover="hint"` + anchor positioning | none |
| Inputs, select, checkbox, radio, validation | native controls + constraint validation | none |
| Tabs | route links with `aria-current` — these are server-rendered apps | none |
| Menu keyboard model | `remix/ui/menu` over a native popover | on hydration |
| Combobox | `remix/ui/combobox/primitives` over a native `<select>` | on hydration |

¹ plus the compat shim described below.

**What is left for hand-written JS** — the entire list:

```
@lemol/ui-remix/compat     Invoker Commands backfill (~15 lines)
@lemol/ui-remix/runtime    one capture-phase `command` listener, dispatching:
  --live-submit    debounced auto-submit for filter forms
  --copy           clipboard write + in-place confirm
  --set-scheme     persist the light/dark choice
  --toggle-density persist density
  --dismiss-toast  timing only; dismissal itself is native `command="close"`
  --palette        fuzzy filter over a server-rendered command list
```

By comparison, the earlier package needs runtime wiring for `Dialog`,
`CommandPalette`, `Toaster`, `SegmentedControl`, `DensityToggle`, `Disclosure`,
and every trigger.

**Not in scope:** drag-and-drop reorder (↑/↓ submit buttons instead — no JS, and
todo-md already works this way), virtualized tables, in-page tab panels.

## Browser baseline

**Chrome 114+ / Safari 17+ / Firefox 125+** — the Popover API floor.

Apps built here get shared with browsers we do not control, so the floor is set
by what must work unaided, and newer features get cheap treatment rather than a
lower floor:

- **Popover API** (Chrome 114, Safari 17, Firefox 125) — relied on directly.
  Below this floor you must reimplement top layer and light dismiss, which is
  where cost explodes. This is the floor for that reason.
- **Invoker Commands** (Baseline December 2025; Chrome/Edge 135+, Safari 26,
  Firefox late 2025) — used natively, with `@lemol/ui-remix/compat` backfilling
  older engines in about fifteen lines. The markup is identical either way.
- **CSS anchor positioning** (Baseline January 2026; Chrome 125+, Safari 26,
  Firefox 147+ unflagged) — used behind `@supports (anchor-name: --a)`, because
  interop is still rough even at Baseline and MDN still flags `position-anchor`.
  Placement degrades to a centered or statically placed popover.

The compat shim exists for one specific reason: a mistyped or unsupported
`commandfor` produces **no error and no event** — a dead click. That silent
failure mode is worse than a thrown exception, and fifteen lines closes it.

An app whose asset target sits below this floor raises that target when it
adopts these packages.

## Behaviour protocol

**Custom commands, one capturing listener.** `CommandEvent` is non-bubbling,
composed, trusted and cancellable. Non-bubbling defeats ordinary `document`
delegation — but the capture phase still reaches the target, since capture
descends window → target and only the bubble phase is absent. So:

```ts
document.addEventListener("command", handler, true)
```

That gives delegation, which is required: the earlier package's hard-won lesson
is that querying elements and binding to them kills the behaviour on the first frame
navigation. One capturing listener survives frame navigation with no
`MutationObserver`.

Custom commands use the `--` namespace, which browsers guarantee never to claim.
Reusing `command`/`commandfor` for our own behaviours — rather than inventing a
`data-ui-*` attribute — collapses the earlier package's twenty-odd private
`data-*` attributes into one standard vocabulary. A custom command needs a real `commandfor` target
to fire, which reads naturally: `command="--copy" commandfor="account-number"`.

**Never hand-write an id.** Because a mismatched `commandfor` fails silently, a
factory binds both halves so there is no string to mistype:

```tsx
const NewTask = overlay("new-task")

<NewTask.Trigger tone="primary">New task</NewTask.Trigger>
<NewTask.Dialog title="New task">
  <form method="post" action={routes.tasks.create.href()}>…</form>
</NewTask.Dialog>
```

## SPA portability

`remix/spa` keeps the same router contract as the server — `render()` middleware
plus `run(router, { fallback })`, the same controllers, middleware and
`context.render()`. `remix/ui`'s `css()` emits into the `rmx` cascade layer
identically in both modes. So components written against `remix/ui` are portable
by construction.

What would break portability is a component reaching for a server-only import.
So it is enforced rather than trusted, following todo-md's `boundaries.test.ts`
precedent:

```
ui-design, ui-remix and ui-remix-mini may import:
    remix/ui, remix/ui/*, @lemol/ui-design
must NOT import:
    node:*, bun, effect, remix/router, remix/routes, remix/assets, remix/spa
```

"Runs in SPA mode" becomes a property the build checks.

**Theme delivery works in both modes** because it is a component (in
`ui-remix`, wrapping `ui-design`'s pure `emitTokensCss()`):

```tsx
<ThemeStyle theme={miniTheme} componentTokens={componentTokens} />
```

A `<style>` element is valid in the body and applies document-wide, so this
renders in server mode and inside the SPA tree with no special casing. It also
retires the two traps that come from injecting a template literal as `<style>`
text — no backticks, and no `<`, `>` or `&`. `emitTokensCss()` stays exported for anyone who prefers to write a static
file and use `<link>`.

`bootScript` (no-flash scheme and density restore) stays inline in the document:
`<head>` on the server, `index.html` in SPA. The app owns its document either
way.

## `@lemol/ui-remix-mini`

A theme plus the composed pieces an app cannot avoid — `Document`, `AppShell`,
`Nav`, `EmptyState`, `ErrorState`. The wiring is the fiddly part, not the
components: the boot script before the stylesheet, the runtime imported from its
own subpath so the barrel does not drag the component library into the browser
bundle, `run()` resolving `clientEntry` through the asset server.

`mini` is a rich reference implementation, not a floor. todo-md's current web UI
lacks dialogs and interactivity; adopting `mini` should be a visible upgrade, so
`mini` ships the UX todo-md is missing.

It does **not** re-export `ui-remix`. A barrel would need syncing with every new
export and would hide which layer a component came from, which matters the day
an app swaps in its own design.

## Playground

Storybook is React-based and these components are Remix 3 functions taking a
`Handle`, with no hooks and no client render. So the playground is a Remix 3 app
in this repo — which is also what the earlier package proved with its `/design` route,
rendered from the same source the app uses "so it cannot drift the way a
hand-maintained style guide does".

**Demos live beside their component** (`button.demo.tsx` next to `button.tsx`),
exposed as `@lemol/ui-remix/demos`. Co-location is what makes drift impossible.

**Knobs need no JavaScript.** Rendering is server-side, so variant controls are
query params and a form: `?tone=primary&size=sm` re-renders on the server. Same
for the theme, scheme and density switchers.

One control is built deliberately: a **no-JS toggle** that renders the page with
the runtime and compat scripts omitted. The whole premise is that pages work
before any client JavaScript, so that assertion should be one click away rather
than something to remember to check.

One app, two modes — this covers "demos" without a second deployable, and avoids
rebuilding todo-md's screens now that todo-md is a real consumer:

```
apps/playground
  /c/:component      the catalogue, one route per component
  /pages/dashboard   composed page recipes: real multi-component layouts,
  /pages/list        where contract gaps actually surface
  /pages/detail
  /pages/settings
  /pages/empty       empty, loading and error states
  /spa/*             one SPA-mode route proving portability
```

## Tooling

**Bun** as package manager, test runner and runtime (`Bun.serve` +
`router.fetch`). **Remix's asset server** as the browser
pipeline. **No bundler for the packages at all.**

Vite was considered and rejected. Not a capability question — `bun --bun vite`
works. The reasons:

- `@remix-run/assets` already is the pipeline: on-demand compilation of browser
  scripts *and* styles, preloads generated from imports, optional fingerprinting,
  ETags, sourcemaps, HMR and script loaders, configured in `remix.json`, shared
  between the running server and the CLI, and checked by `remix doctor`.
- **There is no library build to own.** The earlier design package ships
  `main: "./src/index.ts"` — raw TypeScript consumed directly. Vite's strongest
  card, library mode, has nothing to do here.
- Adding it would mean two compilers in one repo, `remix.json` no longer the
  single source of asset config, `remix doctor` blind to half the build, and
  losing the import-map and preload integration that makes `clientEntry`
  hydration work.

Otherwise the repo follows its siblings: Biome, `tsconfig.base.json` plus
per-package configs, and `bun run check` = lint + typecheck + test as the single
gate.

Two properties fixed deliberately:

- **No Effect dependency.** Every other lemol repo pins `effect` exactly. These
  are presentation packages, so `remix` is the only peer, keeping `ui` out of
  the version-lockstep problem.
- **Private, consumed as git dependencies**, like `framework` and `org`.

## Testing

- **Server-render test per component**, via `remix/ui/server`.
- **Browser tests for the six runtime behaviours only.** A DOM shim would only
  be testing the shim.
- **Pure logic extracted and tested directly** — the palette's match rule is the
  model, exported as a pure function.
- **`test/boundaries.test.ts`** enforces the SPA import rules above.
- **A no-JS render test** asserting that a page's dialogs, disclosures and
  popovers are complete markup with the runtime absent.

## Consumers

**todo-md adopts these packages now.** Its `AGENTS.md` currently says "This repo
stands alone. It must not depend on other lemol repositories", and
`test/boundaries.test.ts` enforces an allowlist of what `src/web` may import.
Both change: the standalone rule narrows to the core modules, and the web
composition root is allowed to depend on the UI packages.

```diff
  todo-md/AGENTS.md
- **This repo stands alone.** It must not depend on other lemol repositories.
+ **The core stands alone.** spec, markdown, core, fs, hub and cli must not
+ depend on other lemol repositories. `src/web` is a composition root and may
+ depend on `@lemol/ui-*`.

  todo-md/test/boundaries.test.ts
    const webPackages = [ …,
+     "@lemol/ui-design", "@lemol/ui-remix", "@lemol/ui-remix-mini",
    ]
```

Its 444-line `src/web/app/ui/styles.css` is deleted and `src/web/app/ui/*.tsx`
is rewritten on `ui-remix` + `mini`.

## Milestones

Each milestone gets its own implementation plan.

**M1 — Foundation and contract proof.** All of `ui-design`. A narrow `ui-remix`
chosen to stress the contract from different angles: `Button` / `LinkButton`
(tone and size tokens), `Stack` / `Row` / `Grid` / `Container` (layout, no
tokens of their own), `Heading` / `Text` / `Eyebrow` (type scale), `Field`
(native form controls), `Badge` (semantic tokens), `Dialog` + `overlay()`
(native dialog, invokers, compat), and `compat.ts`. `ui-remix-mini`: theme plus
`Document` / `AppShell` / `Nav` / `EmptyState` / `ErrorState`. Playground with
the catalogue, one composed page recipe, the theme / scheme / density switchers,
the no-JS toggle, and one SPA route. The boundaries test.

**M2 — Catalogue.** `Popover` / `Menu`, `Table`, `Toaster`, `Disclosure`,
`Select` / `Checkbox` / `Radio` / `Switch`, `SegmentedControl`, `Callout`,
`Meter`, `CommandPalette`, `LiveForm`, `CopyButton`, `DensityToggle` /
`SchemeToggle`, `Breadcrumbs`, `Pagination`, `Spinner` / `Skeleton`.

**M3 — todo-md adoption.** The rule and allowlist changes, deleting
`styles.css`, rewriting `src/web/app/ui/*`, and adding the UX it currently
lacks.

**M4 — Consumer app migration.** Later, its own spec, once things are nice here.

**M5 — Motion system.** Depends on M2, not M4: the curated micro-interaction
catalogue, view transitions across frame and document navigation,
shared-element morphs with minted names, and a playground motion page with a
reduced-motion toggle.

Note the split: the motion *mechanism* is not deferred to M5. Each overlay
component ships its entry/exit transition when it is built, in M1 and M2.
Retrofitting `@starting-style` into a finished catalogue costs more than three
lines per component at the time, and an unanimated `Dialog` in M1 becomes the
reference everyone copies afterwards.

## Motion

Reviewed [transitions.dev](https://transitions.dev/) as a reference. Its value
is its taxonomy and quality bar — which micro-interactions are worth having —
not its technique; it is a commercial product with a Pro tier, so the list and
the standard are what we take. Its free catalogue tracks ours closely: modal
open/close, menu dropdown, accordion, tooltip, toast, tabs sliding, skeleton
reveal, checkbox check, toggle, icon swap, success check, error shake, number
pop-in, banner stacking.

The mechanism is native, which is why this fits the rest of the architecture:

- `@starting-style` (Baseline 2024) and `transition-behavior: allow-discrete`
  (Baseline with Firefox 129) give `<dialog>` and `popover` entry and exit
  animation with no JavaScript.
- `overlay` is **not** Baseline and is absent in Safari, so **exit animations
  degrade in Safari while entry animations work**. Accepted rather than papered
  over with a JavaScript close sequence — entry is the half users notice.
- Degradation is silent: an engine that does not know `@starting-style` ignores
  the block and the element simply appears. This is also why `@starting-style`
  requiring Safari 17.5 does not push the 17.0 floor up.
- The `transition` shorthand is declared twice, the first without
  `allow-discrete`, so other properties still transition on engines lacking
  `transition-behavior`.
- Same-document view transitions are cross-browser (Chrome 111, Safari 18,
  Firefox 144) and cover Remix frame navigation. Cross-document
  (`@view-transition`) is Chrome 126+ / Safari 18.2+ and **not in stable
  Firefox** — MDN lists it as limited availability, not Baseline, contrary to
  several 2026 write-ups. Its failure mode is an ordinary navigation.
- Two visible elements sharing a `view-transition-name` throw and skip the
  transition. Same failure class as `commandfor`, same treatment: names are
  minted and scoped by the component, never hand-written.

`prefers-reduced-motion: reduce` zeroes every duration globally in the emitted
sheet, so no component opts in. See [docs/motion.md](../../motion.md).

## Rejected alternatives

- **Headless components with separate skins.** Maximum freedom, but `mini` and
  every app's own design would each carry a full stylesheet and drift in ways no
  typecheck catches.
- **Overridable style recipes.** Most expressive, but you build and maintain a
  recipe-merge abstraction and override resolution becomes its own thing to
  debug.
- **`ui-design` owning the component vocabulary.** Guarantees every renderer
  themes identically, but a new component becomes a change in two packages and
  `ui-design` has to track the whole catalogue.
- **Generic named theme modes.** Speculative for two axes.
- **Strict progressive enhancement, no exceptions.** The tax that left todo-md
  plain. Superseded by leaning on the platform instead.
- **Assume scripting, no native fallback.** Gives up robustness and works
  against Remix 3's server-first grain.
- **Conservative baseline with a hand-written runtime.** Rebuilds the earlier
  package's runtime and abandons the native-first principle.
- **Lifting the earlier design package into `ui-remix` first.** Would ship
  `ui-remix` amber-coloured for a while and delays `mini`; its app's migration
  is explicitly deferred.
- **Vite.** See Tooling.
- **`mini` re-exporting `ui-remix`.** A barrel to keep in sync that hides the
  base/skin boundary.
