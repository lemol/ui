---
title: Scheme and density survive a client-side navigation
tags: [bug]
---
**Why.** [The events-and-models record](../../docs/superpowers/specs/2026-10-24-ui-remix-events-and-models-design.md) §1. *Toggle theme* (or *Toggle density*) sets `data-scheme` / `data-density` on `<html>`; the next link click is intercepted by Remix's runtime, which reloads the top frame in the same document and reconciles `<html>` against server markup that carries neither attribute, so both are removed and the page falls back to the media query and the base density until a reload. Reproduced on 2026-10-24 with a Playwright probe over the playground harness: `dark` after the toggle, `null` after a link click in the same document, `dark` again with `data-rmx-preserve-attrs="data-scheme data-density"` on `<html>`. `test/browser/toggles.browser.test.ts` covers only a reload, which `bootScript` handles.

**What to build.**
- `src/mini/document.tsx`: `<html>` carries `data-rmx-preserve-attrs` naming the axes this render left blank — `data-scheme` when `scheme` is unset, `data-density` when `density` is unset, joined by a space; the attribute is omitted when both are set. This keeps `Document`'s documented rule (*an attribute rendered here beats the remembered one*) across navigations as well as reloads.
- `apps/playground/app/ui/switchers.tsx`: the scheme and density GET forms carry `data-rmx-document`. Switching back to *system* or *default* renders a blank axis, which would otherwise preserve the value the previous render set (the record's *known limit*).
- No client code. The list is read from the incoming HTML on every navigation.

**Tests first.**
- `src/mini/document.test.tsx`, one case per row of the record's table: neither axis set → `data-rmx-preserve-attrs="data-scheme data-density"`; `scheme="dark"` only → `"data-density"`; `density="compact"` only → `"data-scheme"`; both set → no attribute.
- `test/browser/toggles.browser.test.ts`:
  - toggle the scheme, follow a link, assert `data-scheme` is still `dark` **and** that the document did not reload (a `window` marker survives) — without the second assertion a document navigation would pass for the wrong reason;
  - the same for density;
  - a page rendered with `?scheme=dark`, then a link to a page with `?scheme=light`: the server's value wins;
  - the scheme switcher set to *system* after `?scheme=dark` leaves no `data-scheme`.
- Reversal: drop the attribute from `Document` and watch the first browser case fail.

**Docs.** `src/mini/README.md`, the boot-script paragraph (around line 91): one sentence on the preserved axes and why the switchers navigate the document. `docs/interactivity.md` cites this as its worked example in task 38.

**Done when.** A toggled scheme and density survive any number of client-side navigations, a server-chosen value still wins, and `bun run check` passes.

**Out of scope.** Persisting the choice server-side (a cookie or session). An app that renders its own document from saved settings is unaffected.
