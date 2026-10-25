---
title: Commands announce their outcome as typed events
tags: [held]
depends_on: [38]
---
**Held until an app names the event it needs.** [The events-and-models record](../../docs/superpowers/specs/2026-10-24-ui-remix-events-and-models-design.md) §3: no consumer exists today. The one app with a settings preview writes the root's attributes itself and never runs `--set-scheme`; nothing else listens. Record the consumer in this task when one appears, then start.

**Why.** Remix's guide turns a finished interaction into one semantic, typed DOM event (`app:longpress`) that callers consume with `on(...)`. Each command in `src/remix/runtime.ts` changes something an app may want to follow — the scheme, the density, a copy, a toast — and today an app can only watch attributes or poll.

**What to build.**
- A `ui:` event per command that has an outcome, dispatched by its handler **after** the change, bubbling, not cancellable: `ui:schemechange` (on the root, `detail` the new scheme), `ui:densitychange` (on the root), `ui:copied` (on the source button, `detail` the text), `ui:toastdismiss` (on the toast). Only the ones the named consumer needs; the rest wait for theirs.
- Each as an `Event` subclass exported from a JSX-free module under `src/remix/`, with an `HTMLElementEventMap` augmentation, so a consumer's `on("ui:schemechange", …)` is typed.
- Exported through the `./remix/runtime` subpath or a new one argued in `test/boundaries.test.ts`; never from the barrel, so the browser entry does not pull in the component library.

**Tests first.**
- `test/browser/runtime.browser.test.ts`: each event fires once per invocation, after the DOM changed, on the documented target; none fires for a cancelled invocation (the forced-compat path in `onCommand`).
- A type test: `on("ui:schemechange", (event) => event.scheme)` compiles; a misspelt name does not.

**Docs.** `docs/interactivity.md`'s command list gains an *Announces* column.

**Done when.** The named consumer listens to the event instead of its workaround, and `bun run check` passes.

**Out of scope.** Events for commands with no consumer; a cancellable *before* event.
