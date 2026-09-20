---
title: 'mini: Document, AppShell, Nav and the state components'
tags: [ui-remix-mini]
depends_on: [13, 14]
group: M1 — Foundation and contract proof
completed_at: 2026-09-20T02:43:37Z
outcome: completed
---
`ui-remix-mini`'s composed pieces: `src/shell.tsx` with `Document`, `AppShell`
and `Nav`, and `src/states.tsx` with `EmptyState` and `ErrorState`.

The wiring is the fiddly part, not the components.

## Scope

- The boot script inline in the document, before the stylesheet.
- The runtime imported from its own subpath, so the barrel does not drag the
  component library into the browser bundle.
- `run()` resolving `clientEntry` through the asset server.
- `mini` must **not** re-export `ui-remix`.
- Rich, not a floor: this has to read as a visible upgrade over todo-md's current
  web UI, which is what M3 replaces.

## From the spec

> The wiring is the fiddly part, not the components: the boot script before the
> stylesheet, the runtime imported from its own subpath so the barrel does not
> drag the component library into the browser bundle, `run()` resolving
> `clientEntry` through the asset server.

> `mini` is a rich reference implementation, not a floor. todo-md's current web UI
> lacks dialogs and interactivity; adopting `mini` should be a visible upgrade,
> so `mini` ships the UX todo-md is missing.

> It does **not** re-export `ui-remix`. A barrel would need syncing with every
> new export and would hide which layer a component came from, which matters the
> day an app swaps in its own design.

> `bootScript` (no-flash scheme and density restore) stays inline in the
> document: `<head>` on the server, `index.html` in SPA. The app owns its
> document either way.

## Done when

- A page built from `mini` renders with no flash of the wrong scheme or density.
- The boundaries test still passes — `mini` imports nothing server-only.
- `bun run check` is green.
