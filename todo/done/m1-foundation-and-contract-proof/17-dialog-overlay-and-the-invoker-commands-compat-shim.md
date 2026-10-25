---
title: 'Dialog, overlay() and the Invoker Commands compat shim'
tags: [ui-remix, interactivity, motion]
depends_on: [12]
---
The overlay half of the contract proof, and the one component in M1 with client
code behind it. Native `<dialog>`, Invoker Commands, the compat shim, the
capture-phase listener, and its entry/exit transition — shipped now, not in a
later pass.

## Scope

- `Dialog` on native `<dialog>` with `command="show-modal"` / `"close"` /
  `"request-close"`. Light dismiss, top layer, focus trap and Esc come from
  `showModal()`.
- `overlay()` factory binding both halves of `commandfor`, so there is no id
  string to mistype.
- `src/compat.ts` — the Invoker Commands backfill, about fifteen lines. The
  markup is identical with or without it.
- `src/runtime.ts` — the single listener,
  `document.addEventListener("command", handler, true)`, registered on the
  capture phase. **No commands are registered in M1**; the switchers are query
  params. The subpath exists so M2 adds commands rather than plumbing.
- Motion, now: `@starting-style` + `transition-behavior: allow-discrete`, with
  the `transition` shorthand declared **twice** — the first without
  `allow-discrete`. `@starting-style` targets `dialog[open]`, the state being
  entered. Duration and easing come from tokens, never literals.
- A no-JS render test asserting the dialog is complete markup with the runtime
  absent, and a browser test for the runtime behaviour.

## From the spec

> `CommandEvent` is non-bubbling, composed, trusted and cancellable.
> Non-bubbling defeats ordinary `document` delegation — but the capture phase
> still reaches the target [...] the earlier package's hard-won lesson is that querying
> elements and binding to them kills the behaviour on the first frame
> navigation.

> The compat shim exists for one specific reason: a mistyped or unsupported
> `commandfor` produces **no error and no event** — a dead click. That silent
> failure mode is worse than a thrown exception, and fifteen lines closes it.

> `overlay` is **not** Baseline and is absent in Safari, so **exit animations
> degrade in Safari while entry animations work**. Accepted rather than papered
> over with a JavaScript close sequence — entry is the half users notice.

> Retrofitting `@starting-style` into a finished catalogue costs more than three
> lines per component at the time, and an unanimated `Dialog` in M1 becomes the
> reference everyone copies afterwards.

## Done when

- The dialog opens and closes with no client JavaScript on an engine with native
  Invoker Commands, and with the shim on one without.
- Exit animation degrading in Safari is accepted, not worked around.
- `bun run check` is green.
