# ui

## M1 — Foundation and contract proof

- [ ] 01 - Plan M1: foundation and contract proof
  #planning
  Plan the M1 implementation. Full spec: `docs/superpowers/specs/2026-09-17-lemol-ui-architecture-design.md`.

  M1 proves the component-token contract end to end before committing a whole catalogue to it. `Field` and `Dialog` are in the slice deliberately — form integration and overlay behaviour are where a contract breaks, not `Button`.

  ## @lemol/ui-design (complete)

      src/tokens.ts       primitive token schema: categories + types
      src/theme.ts        defineTheme, extendTheme
      src/ref.ts          v() -- typed token reference
      src/css/emit.ts     emitTokensCss() -> string
      src/css/layers.ts   @layer base, rmx
      src/css/boot.ts     bootScript (no flash)
      src/css/reset.ts    element defaults

  `/css` is an opt-in subpath. Everything here is strings and data, never a component — that is precisely what lets a future `ui-opentui` share this package.

  ## @lemol/ui-remix (narrow slice)

  - `Button` / `LinkButton` — tone and size token contract
  - `Stack` / `Row` / `Grid` / `Container` — layout, no tokens of their own
  - `Heading` / `Text` / `Eyebrow` — the type scale
  - `Field` — native form controls and constraint validation
  - `Badge` — semantic tokens
  - `Dialog` + `overlay()` — native `<dialog>`, Invoker Commands, compat
  - `ThemeStyle` — renders ui-design's emitted sheet into the document
  - `src/tokens.ts` — aggregates every component's contract, exports the name union
  - `src/compat.ts` — Invoker Commands backfill (~15 lines)

  ## The contract (the point of M1)

  Each component declares its own tokens beside itself, defaulting relationally to a primitive:

      // ui-remix/src/button/tokens.ts
      export const buttonTokens = {
        "ui-btn-primary-bg":  "var(--accent)",
        "ui-btn-primary-ink": "var(--ink-inverse)",
        "ui-btn-radius":      "var(--r-sm)",
      }

  The component reads only `var(--ui-btn-*)` and never a raw colour, radius, duration or space step. The emitter writes component defaults first and theme values second — same selector, same specificity, later wins, so no cascade-layer subtlety for custom properties and no import-order trap.

  `ui-design` never learns which components exist; it takes a record. `mini` depends on both packages and wires the types, so `defineTheme` requires every primitive and type-checks every `--ui-*` override against the names `ui-remix` actually declares. Every component takes `mix` as the structural escape hatch.

  ## Theme variants

  Two axes only — scheme and density:

      export const miniTheme = defineTheme({
        base:    { canvas: "#FBFBFA", surface: "#FFFFFF", ink: "#111111", hairline: "#EAEAEA" },
        dark:    { canvas: "#191919", surface: "#242424", ink: "#F4F4F0", hairline: "#3A3A3A" },
        compact: { "control-h": "28px", "row-h": "32px" },
      })

  Emitted as `:root`, then `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-scheme="light"])`, then `:root[data-scheme="dark"]`, then `:root[data-density="compact"]`.

  ## @lemol/ui-remix-mini

  `theme.ts` plus `shell.tsx` / `states.tsx` with `Document`, `AppShell`, `Nav`, `EmptyState`, `ErrorState`. The wiring is the fiddly part, not the components: boot script before the stylesheet, runtime imported from its own subpath so the barrel does not drag the library into the browser bundle, `run()` resolving `clientEntry` through the asset server.

  Rich, not a floor — it must be a visible upgrade over todo-md's current UI. It must **not** re-export `ui-remix`.

  ## apps/playground

  Catalogue at `/c/:component`, built from `*.demo.tsx` files colocated with each component and exposed as `@lemol/ui-remix/demos` — colocation is what makes drift impossible. Plus one composed page recipe, theme/scheme/density switchers as query params and a form (rendering is server-side, so knobs need no JS), a no-JS toggle that omits the runtime and compat scripts, and one `/spa/*` route proving portability.

  ## Enforced boundary

  `test/boundaries.test.ts` — the three packages may import `remix/ui`, `remix/ui/*` and `@lemol/ui-design`; they must not import `node:*`, `bun`, `effect`, `remix/router`, `remix/routes`, `remix/assets` or `remix/spa`. This makes "runs in SPA mode" a checked property rather than a claim.

  ## Composition-root edits (in the workspace repo, not here)

  Add `ui` to `workspace.yaml`; add `repos/ui/packages/*` and `repos/ui/apps/*` to the root `workspaces`; add `file:` overrides for the three packages; order the ui packages before todo-md in `tools/verify-order.ts`.

  ## Baseline and tooling

  Chrome 114+ / Safari 17+ / Firefox 125+ — the Popover API floor. Invoker Commands used natively with the compat shim behind them; anchor positioning behind `@supports (anchor-name: --a)`. Bun as package manager, test runner and runtime; Remix's asset server for browser assets; no bundler and no build step for the packages; no Effect dependency, so `remix` is the only peer.

  ## Tests

  A server-render test per component via `remix/ui/server`. Browser tests only for runtime behaviours — a DOM shim would only test the shim. A no-JS render test asserting a dialog is complete markup with the runtime absent. Plus the boundaries test above.

  ## Motion (mechanism, not polish)

  Motion tokens land here, and `Dialog` ships its entry/exit transition when it
  is built — not in a later pass. Retrofitting `@starting-style` into a finished
  catalogue costs more than three lines per component at the time, and an
  unanimated `Dialog` becomes the reference everyone copies.

  - Duration tokens `--dur-instant` (80ms) through `--dur-slow` (400ms); easings
    `--ease-out-quad`, `--ease-spring`, `--ease-in-out-smooth`. Components name
    tokens, never literal curves or millisecond values.
  - The global `prefers-reduced-motion: reduce` reset in the emitted sheet, which
    zeroes every duration so no component opts in individually.
  - `Dialog` gets `@starting-style` + `transition-behavior: allow-discrete`, with
    the `transition` shorthand declared **twice** — the first without
    `allow-discrete`, so other properties still transition on engines lacking it.
  - `@starting-style` must target the state being entered (`dialog[open]`, not
    `dialog`) and carries no specificity boost, unlike `@keyframes`.
  - `overlay` is not Baseline and is absent in Safari, so exit animations degrade
    there while entry animations work. Accept that; do not add a JavaScript close
    sequence.

  Details and the full rationale: `docs/motion.md`.

## M2 — Catalogue

- [ ] 02 - Plan M2: catalogue
  #planning depends_on:1
  Plan M2: complete the catalogue on the contract M1 proved. Full spec: `docs/superpowers/specs/2026-09-17-lemol-ui-architecture-design.md`.

  ## Components

  `Popover` / `Menu`, `Table`, `Toaster`, `Disclosure`, `Select` / `Checkbox` / `Radio` / `Switch`, `SegmentedControl`, `Callout`, `Meter`, `CommandPalette`, `LiveForm`, `CopyButton`, `DensityToggle` / `SchemeToggle`, `Breadcrumbs`, `Pagination`, `Spinner` / `Skeleton`.

  Each one follows M1's pattern: its own `--ui-*` tokens declared beside it, defaulting relationally to a primitive, aggregated into `src/tokens.ts`, with a colocated `*.demo.tsx` and a server-render test.

  ## The ladder, in order

  1. **Native platform** where it fully covers the need. Zero client code.
  2. **`remix/ui/*` primitives** where the need exceeds the platform, layered *over* the native element — the native popover opens with no JS, the primitive enhances keyboard behaviour after hydration.
  3. **Hand-written** only where neither covers it.

  | Need | Mechanism | Client JS |
  | --- | --- | --- |
  | Menu, dropdown, popover | `popover` + `command="toggle-popover"` | none |
  | Placement | `anchor-name` / `position-anchor` / `position-area` | none, `@supports` fallback |
  | Light dismiss, top layer, Esc | `popover` | none |
  | Disclosure | `<details>` / `<summary>` | none |
  | Accordion, one at a time | `<details name="...">` | none |
  | Tooltip | `popover="hint"` + anchor positioning | none |
  | Inputs, select, checkbox, radio, validation | native controls + constraint validation | none |
  | Tabs | route links with `aria-current` | none |
  | Menu keyboard model | `remix/ui/menu` over a native popover | on hydration |
  | Combobox | `remix/ui/combobox/primitives` over a native `<select>` | on hydration |

  `remix/ui` ships `accordion`, `anchor`, `animation`, `breadcrumbs`, `button`, `checkbox`, `combobox`, `input`, `listbox`, `menu`, `popover`, `radio`, `select`, `tabs` and `toggle`, several with `/primitives` variants. Check what exists there before hand-writing anything.

  ## Behaviour protocol

  All behaviour goes through custom commands in the `--` namespace, read by **one** capture-phase listener:

      document.addEventListener("command", handler, true)

  `CommandEvent` is non-bubbling, composed, trusted and cancellable. Non-bubbling defeats ordinary delegation, but the capture phase still reaches the target — so the listener must be capturing, and it must be delegated from `document` or the behaviour dies on the first frame navigation.

  The complete list of hand-written client JS for the whole library:

      --live-submit     debounced auto-submit for filter forms
      --copy            clipboard write + in-place confirm
      --set-scheme      persist the light/dark choice
      --toggle-density  persist density
      --dismiss-toast   timing only; dismissal itself is native command="close"
      --palette         fuzzy filter over a server-rendered command list

  plus `compat.ts`. Nothing else ships client code. Extract real logic as pure functions and test them directly — the palette's match rule is the model.

  **Never hand-write a `commandfor` id.** A mismatch produces no error and no event, just a dead click. Use factories like `overlay()` so trigger and target cannot drift.

  ## Placement caveat

  Anchor positioning is Baseline but interop is still rough and MDN still flags `position-anchor`. Keep it behind `@supports (anchor-name: --a)`, degrading to a centered or statically placed popover.

  ## Out of scope

  Drag-and-drop reorder (up/down submit buttons instead — no JS, and todo-md already works that way), virtualized tables, and in-page tab panels.

  ## Motion (mechanism, not polish)

  Every overlay component ships its entry/exit transition as it lands, following
  the pattern `Dialog` established in M1: `@starting-style` +
  `transition-behavior: allow-discrete`, the `transition` shorthand declared
  twice, duration and easing tokens rather than literals.

  Applies to `Popover`, `Menu`, `Toaster`, `Disclosure`, `CommandPalette`, and
  anything else entering from `display: none`.

  The curated micro-interaction catalogue, view transitions and shared-element
  morphs are **not** in M2 — they are M5. Details: `docs/motion.md`.

## M3 — todo-md adoption

- [ ] 03 - Plan M3: todo-md adoption
  #planning depends_on:2
  Plan todo-md's adoption of the UI packages. Full spec: `docs/superpowers/specs/2026-09-17-lemol-ui-architecture-design.md`.

  todo-md becomes the first real consumer. Its web UI today has a 444-line `src/web/app/ui/styles.css` and its own `ui/` layer (`board`, `dashboard`, `task`, `status`, `groups`, `projects`, `markdown`, `secondary`, `document`), with no dialogs and little interactivity. Adopting `mini` should be a visible upgrade, not a reskin.

  ## Rule changes in repos/todo-md

  Its `AGENTS.md` currently forbids this outright. Narrow the rule to the core:

      - **This repo stands alone.** It must not depend on other lemol repositories.
      + **The core stands alone.** spec, markdown, core, fs, hub and cli must not
      + depend on other lemol repositories. `src/web` is a composition root and
      + may depend on `@lemol/ui-*`.

  And extend the web allowlist in `test/boundaries.test.ts`, which asserts `web must not import <anything not listed>`:

      const webPackages = [ ...,
      +  "@lemol/ui-design", "@lemol/ui-remix", "@lemol/ui-remix-mini",
      ]

  ## Work

  Delete `src/web/app/ui/styles.css`. Rewrite `src/web/app/ui/*.tsx` on `ui-remix` + `mini`. Add the UX it lacks — dialogs for the add/edit/move forms, toasts for flash messages, a live filter bar, a command palette.

  Keep its light editorial look as a theme: light canvas (`#FBFBFA`), serif headings (Iowan Old Style / Charter), a 760px measure, monospace badges, hairline borders, and its `prefers-color-scheme: dark` variant. That look is the opposite end of the range from mionso's dark amber, which is exactly what makes todo-md a real test of the token contract rather than a friendly one.

  ## Check before planning the rewrite

  `src/web/app/ui/document.tsx` renders `<main innerHTML={options.content} />` from pre-rendered HTML strings, and `Flash` returns a raw HTML string. Work out how component rendering composes with that — it may want changing to render nodes directly — before planning the individual tasks.

  Also preserve what already works: POST/303 forms, the `/events` SSE live-refresh with `shouldRefresh` downgrading to a notice when a form is dirty, per-project capability gating (a project without `groups` or `comments` hides that UI), and the up/down reorder buttons.

## M4 — mionso migration

- [ ] 04 - Plan M4: mionso migration
  #planning depends_on:3
  Plan mionso's migration onto the UI packages. Deferred until things are nice here; `@mionso/design` stays untouched until then, and this gets its own spec.

  Known constraints for when the time comes:

  - Its *Vault & Obsidian* look becomes a theme plus `--ui-*` overrides. The values are expressible — `Button` primary is an amber gradient with an inset white highlight and a `brightness(1.06)` hover, all of which fit in token values rather than a forked component.
  - It is dark-only, so its theme declares no `dark` key.
  - Its asset target (es2020 / Chrome 109 / Safari 16.4) sits just below the Popover API floor and must be raised. That also retires its documented "no top-level `await`" constraint.
  - `@mionso/design` can become a thin re-export shim over `@lemol/ui-remix` + a mionso theme, so `money-web` changes little.

  Reference: `docs/superpowers/specs/2026-09-17-lemol-ui-architecture-design.md`, and mionso's own `packages/mionso-design/docs/`.

## M5 — Motion system

- [ ] 05 - Plan M5: motion system
  #planning depends_on:2
  Plan M5: the motion system and polish layer. Depends on M2 (the catalogue), not on M3 or M4. Reference: `docs/motion.md`.

  The motion *mechanism* is not here — M1 and M2 ship each overlay component's entry/exit transition as it is built. M5 is the polish layer on top.

  ## Micro-interaction catalogue

  Reviewed [transitions.dev](https://transitions.dev/) as a reference for what is worth having. Take its taxonomy and quality bar, not its CSS — it is a commercial product with a Pro tier.

  The items that map onto our catalogue: icon swap, success check, error state shake, number pop-in, notification badge, input clear with dissolve, skeleton loader and reveal, shimmer text, tabs sliding, banner stacking, like/toggle feedback, dropdown menu morph.

  Its AI-agent cluster (thinking states, reasoning stream, streaming text, matrix dot loader) is not our need.

  ## View transitions

  Two distinct features with different support. Both are opt-in CSS with no JavaScript, and both fail benignly.

  - **Same-document** — covers Remix frame navigation, since a frame response swaps DOM in place. Cross-browser: Chrome 111, Safari 18, Firefox 144.
  - **Cross-document** — `@view-transition { navigation: auto; }` for full document loads. Chrome 126+, Safari 18.2+, and **not in stable Firefox**. MDN lists it as limited availability, explicitly not Baseline; several 2026 write-ups claim otherwise and are wrong. No support means an ordinary navigation.

  ## Shared-element morphs, with minted names

  Two visible elements sharing a `view-transition-name` **throw and skip the transition entirely**. In a reusable component library that is a live hazard: render two cards with the same name and the whole page's transition dies.

  Same failure class as `commandfor`, so same treatment — names are minted and scoped by the component, never hand-written. Extend the `overlay()` pattern.

  ## Playground

  A motion page, plus a reduced-motion toggle beside the existing no-JS toggle, so both degraded paths are one click away rather than something to remember to check.

  ## Verify

  - Every transition degrades to nothing on an engine without `@starting-style`.
  - `prefers-reduced-motion: reduce` zeroes everything through the global reset; no component fights the media query.
  - No literal durations or easing curves anywhere — tokens only.
