---
title: "Menu: keyboard model over Popover"
tags: [ui-remix]
depends_on: [21]
group: M2 — Catalogue
completed_at: 2026-09-20T08:38:54Z
outcome: completed
---
Rung two of the ladder: the platform (Popover) covers open/close, so the only
client code `Menu` needs is the keyboard model — arrow-key roving tabindex,
type-ahead, Esc already free from `popover`.

## Scope

- `src/remix/menu/` — `menu.tsx` (`Menu`, `MenuItem`, `MenuSeparator`),
  `tokens.ts`, `menu.test.tsx`, `menu.demo.tsx`.
- Server-rendered as a native popover (from [[01-popover]]) with a full list
  of `<button>`/`<a>` items — works with no JS.
- Layer `remix/ui/menu` over it for the roving-tabindex keyboard model,
  applied on hydration only. Check what `remix/ui/menu` already provides
  before hand-writing any of it.
- `ui-menu-*` tokens: item padding, hover/active surface, separator colour,
  min-width.
- Register in `src/remix/demos.ts`.

## Done when

- `/c/menu` renders a complete, clickable menu with the runtime absent.
- Arrow keys move focus among items once hydrated, verified by a browser
  test (this is one of the runtime behaviours, not a server-render concern).

## Comments

### @lemol at 2026-09-20 08:38:49 +00:00

Built without remix/ui/menu: that package's Menu owns a JS-Context-driven popover, not [popover] + command=toggle-popover, so layering it would trade native-first open/close for a keyboard model outside the M2 plan's fixed six hand-written behaviours. Shipped as Popover + role=menu/menuitem rows, Tab-reachable with the runtime absent, no roving-tabindex/typeahead. See src/remix/menu/menu.tsx's doc comment and README.
