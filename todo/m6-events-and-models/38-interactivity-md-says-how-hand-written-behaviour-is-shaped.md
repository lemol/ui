---
title: interactivity.md says how hand-written behaviour is shaped
tags: [docs]
depends_on: [37]
---
**Why.** [The events-and-models record](../../docs/superpowers/specs/2026-10-24-ui-remix-events-and-models-design.md) §2. The ladder in `docs/interactivity.md` ends at *3. Hand-written* and says nothing about the shape that code takes. Apps built here read this document as their ladder (xonton's `AGENTS.md` sends every Remix change to it), and xonton has grown about twenty client entries that coordinate through untyped `document` events and the document's own `dataset` (its `docs/specs/events-and-models.md`). Remix 3.1's interactivity guide (`node_modules/remix/guides/05-interactivity.md`) already says what the shape is; this package should say it once, in its own words, with the reason. Separately, the platform table's *Menu keyboard model* and *Combobox* rows name `@remix-run/ui/menu` and `@remix-run/ui/combobox`, and `grep -rn "@remix-run/ui" src` finds nothing.

**What to build.** A section in `docs/interactivity.md` after *Adding a behaviour*, titled for apps rather than this package, holding four rules, each with its reason:
1. **State an app owns is a model**: a `TypedEventTarget` subclass from `remix/component`, with no DOM in it, tested without a browser; a component subscribes with `{ signal: handle.signal }` and calls `handle.update()`; components sharing one get it through context, never `clientEntry` props (they are serialised).
2. **Custom events are namespaced, built from an `Event` subclass, and declared** on `HTMLElementEventMap` / `DocumentEventMap` in one module per app. `--` stays this package's command namespace; an app uses its own prefix.
3. **The narrowest signal**, as the guide's table: an `on()` handler's second argument, a queued task's argument, `handle.signal`. Setup that runs once goes in setup scope, not inside the render function, where the task signal aborts on every re-render.
4. **DOM the client owns is declared**: `data-rmx-preserve-dom` for a subtree, `data-rmx-preserve-attrs` for attributes. Task 37 is the worked example.

Mark the two `@remix-run/ui` rows *planned* (keep the ladder's step 2 text), and say in a footnote that no component uses the package yet.

Keep it short: rules and reasons, a link to the guide for code. The record is the long form.

**Tests first.** None; documentation only. Check every path and API name it cites exists in `remix@3.1.0` (`TypedEventTarget`, `handle.signal`, `queueTask`, `data-rmx-preserve-attrs`).

**Done when.** `docs/interactivity.md` holds the four rules and corrected rows, `docs/principles.md` needs no change (say so in the commit if it does), and `bun run check` passes.

**Out of scope.** Adopting `@remix-run/ui`; changing the command protocol.
