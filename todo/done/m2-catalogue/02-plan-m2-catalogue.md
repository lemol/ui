---
title: 'Plan M2: catalogue'
tags: [planning]
depends_on: [1]
group: M2 — Catalogue
completed_at: 2026-09-20T16:48:37Z
outcome: completed
---
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
