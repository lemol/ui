---
title: interactivity.md says how hand-written behaviour is shaped
tags: [docs]
depends_on: [37]
group: M6 — Events and models
completed_at: 2026-10-28T08:25:34Z
outcome: completed
---
**Why.** [The events-and-models record](../../../docs/superpowers/specs/2026-10-24-ui-remix-events-and-models-design.md) §2. The ladder in `docs/interactivity.md` ends at *3. Hand-written* and says nothing about the shape that code takes. Apps built here read this document as their ladder, and one of them has grown about twenty client entries that coordinate through untyped `document` events and the document's own `dataset`. Remix 3.1's interactivity guide (`node_modules/remix/guides/05-interactivity.md`) already says what the shape is; this package should say it once, in its own words, with the reason. Separately, the platform table's *Menu keyboard model* and *Combobox* rows name `@remix-run/ui/menu` and `@remix-run/ui/combobox`, and `grep -rn "@remix-run/ui" src` finds nothing.

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

## Comments

### @nzila at 2026-10-28 08:25:34 +00:00

Done: Added the app-facing section `## If the app needs hand-written behaviour` to `docs/interactivity.md` after `## Adding a behaviour` and marked the `@remix-run/ui` table rows as planned with an explanatory footnote.

#### Changes
1. `docs/interactivity.md`:
   - Marked `Menu keyboard model` and `Combobox` table rows as `planned — ...`.
   - Added footnote after table: `No component in src/ uses @remix-run/ui yet.`
   - Added `## If the app needs hand-written behaviour` containing the four rules and their design reasons:
     1. App-owned state is a model (`TypedEventTarget<{ change: Event }>` from `remix/component`, tested without a browser, subscribed with `{ signal: handle.signal }`, shared via context not `clientEntry` props).
     2. Custom events are namespaced, built from `Event` subclasses, and declared on `HTMLElementEventMap` / `DocumentEventMap` in one module per app; `--` remains reserved for `@lemol/ui`.
     3. The narrowest signal: `on()` handler argument for latest-event-wins, `queueTask()` argument for render-scoped work, `handle.signal` for component lifetime; setup scope vs render function.
     4. Client-owned DOM is declared via `data-rmx-preserve-dom` for subtrees and `data-rmx-preserve-attrs` for attributes, citing root blank scheme/density persistence (task 37) as the worked example.
     5. Referenced `node_modules/remix/guides/05-interactivity.md` anchors and `docs/superpowers/specs/2026-10-24-ui-remix-events-and-models-design.md`.
2. `docs/principles.md`: Verified and confirmed no changes needed.

#### Verification
- `rg -n "@remix-run/ui" src` -> empty (exit code 1).
- `rg -n "planned" docs/interactivity.md` -> lines 39 & 40 matched.
- `rg -n "data-rmx-preserve" docs/interactivity.md` -> lines 186 & 187 matched.
- `bunx oxlint 2>&1 | tail -5` -> `Found 0 warnings and 0 errors. Finished in 252ms on 251 files with 134 rules using 8 threads.`
- `bunx tsc --noEmit 2>&1 | tail -5` -> exit 0, clean.

Review: approved (5/5)
Approved. Read the complete base-to-HEAD diff and base docs/interactivity.md; the only change is 36 additions and 2 deletions in that document. Commit 3e3b04dd5abe72b46c547ca4615239126092795d answers this task only.

Comments: read the brief and the full current task file todo/m6-events-and-models/38-interactivity-md-says-how-hand-written-behaviour-is-shaped.md. The brief supplies no pre-start comments; the task has no Comments section (also checked with rg). Count: 0; authors: none.

What to build / acceptance:
1. Done: docs/interactivity.md:170-175 states the DOM-free TypedEventTarget model, browser-free testing, subscription/update, context sharing and serialisation reason.
2. Done: :176-180 states namespaced Event subclasses, ambient event maps in one module per app, declaration-based typing and the reserved command namespace.
3. Done: :181-185 matches the guide's three signal lifetimes and distinguishes setup from per-render tasks.
4. Done: :186-189 states both preservation attributes and why, with task 37 as the worked example. Checked against src/mini/document.tsx:130-137 and src/mini/README.md:97.
The app-facing heading is after Adding a behaviour (:154, :165), before Not in scope (:198). Both rows are planned (:39-40), with the no-adoption footnote (:43); ladder step 2 and command protocol are unchanged. docs/principles.md was read, needs no change, and the commit body explicitly says so.

Tests/API verification: no new automated tests required or added for this documentation-only task; literal reversal and generator checks do not apply. Independently imported TypedEventTarget from remix/component: output 'TypedEventTarget: function'; resolved remix/package.json reports 3.1.0. Read its installed guides/05-interactivity.md: all three cited anchors exist; model/context/serialisation examples and the cancellation table agree with the new prose. Checked component declarations: Task takes AbortSignal, update() returns Promise<AbortSignal>, queueTask(task: Task), and handle.signal: AbortSignal. Remix src/component/README.md:290-303 documents both preservation attributes. The local node_modules path is absent in this review; dependency resolution walks to the workspace install, where the cited guide exists. No install was changed.

Verification plan: reran the source import search (empty), proved that pattern against docs/interactivity.md (matches), reran planned-row search (exactly two rows), and checked preservation references. git diff --check is clean. Recorded check.command is bun run check, passed at 3e3b04dd5abe72b46c547ca4615239126092795d: formatting clean, oxlint 0 warnings/0 errors (no warning classes), typecheck passed, 700 tests passed/0 failed. Base lint was not independently rerun; lint inputs are unchanged by this diff. The recorded gate's dependency-divergence warning limits its environment equivalence; independent review verified the required APIs against the currently resolved remix@3.1.0. The land gate will recheck; I did not rerun the whole suite. No other implementer gaps were stated.

Stale-reference check: proved the Menu keyboard model/Combobox search against git show of the base, then searched the whole tree including hidden files. Current interactivity rows are corrected; task 38 states the requested correction; the October design record describes the same planned change; the September architecture record and completed M2 planning task are historical. rg '@remix-run/ui' src produced no matches, agreeing with the footnote.

Proof artifact says skipped: no scenarios. No UI surface, screenshot, module, event implementation, predicate, migration, or runtime cost changed; browser-fit, input-class and scale probes are inapplicable. No open findings. Worktree left unchanged.


Citations that do not open (the verdict stands; a finding may still be right):
- `src/component/README.md:290-303` path does not exist
Branch: nzila/01M60SBR7AW4NWVD01VX0Z4ZKP

nzila run 01M60SBR7AW4NWVD01VX0Z4ZKP
