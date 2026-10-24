# ui-remix: events and models, against Remix's interactivity guide

Date: 2026-10-24
Task: M6 / 37, 38, 39
Status: designed

Remix 3.1 ships a guide to browser behaviour
(`node_modules/remix/guides/05-interactivity.md`, published at
guides.remix.run/interactivity). Its model is the DOM's own:

- **Hydrate the smallest thing.** `clientEntry(...)` marks only the component
  that has to run in the browser; its props are serialised.
- **A component keeps UI state.** Open, focused, pending: setup-scope
  variables and `handle.update()`.
- **Application data lives in a model.** Plain TypeScript, extending
  `TypedEventTarget<{ change: Event }>` from `remix/component`. A component
  subscribes with `{ signal: handle.signal }` and calls `handle.update()` on
  `change`; components that share one model get it through context, never
  through `clientEntry` props. The guide's anchor for this is
  `#saving-a-client-owned-document`.
- **Events are DOM events.** `on(type, handler)` gives each handler a signal
  that aborts when it runs again or its element goes; `ref()` gives one per
  element; `handle.signal` lasts as long as the component. An interaction
  built from several low-level events becomes **one** namespaced semantic
  event (`app:longpress`), typed by augmenting `HTMLElementEventMap`.
- **The runtime carries the rest.** `data-rmx-target` forms, frame reloads,
  `data-rmx-preserve-dom` and `data-rmx-preserve-attrs` for DOM the client
  owns, `data-rmx-prefetch`.

This record checks `@lemol/ui` against that model. Most of it already fits:
`command`/`commandfor` is a platform event, the one capturing listener is the
guide's "native `addEventListener()` for targets outside the rendered tree",
and shipping no client entry at all is the guide's "smallest boundary" taken
to its end. Nothing below changes the command protocol. Three things do
change, and one is held back.

## 1. The root's client-owned attributes (task 37)

**The bug.** On the playground, *Toggle theme* sets `data-scheme="dark"` on
`<html>`. Follow any link: the runtime intercepts it, reloads the top frame
in the same document, reconciles `<html>` against the server's markup, and
the server rendered no `data-scheme` — so the attribute is removed and the
page drops back to the media query. `data-density` goes the same way. A
reload is fine, because `bootScript` restores both from `localStorage`
before first paint; `test/browser/toggles.browser.test.ts` covers only the
reload, which is why nothing caught it.

Reproduced on 2026-10-24 with a Playwright probe over the playground
harness: after the toggle `data-scheme` read `dark`; after a link click,
in the same document (a `window` marker survived), it read `null`. With
`data-rmx-preserve-attrs="data-scheme data-density"` on `<html>` it read
`dark`.

**The rule.** `Document` already says *an attribute rendered here beats the
remembered one: the boot script only fills in an axis the document left
blank*. The fix keeps that rule across navigations: `<html>` carries
`data-rmx-preserve-attrs` naming **only the axes this render left blank**.

| Server render | `data-rmx-preserve-attrs` | On a frame navigation |
| --- | --- | --- |
| no scheme, no density | `data-scheme data-density` | both keep their live values |
| `scheme="dark"`, no density | `data-density` | scheme becomes the server's; density keeps its live value |
| both set | omitted | both become the server's |

The list is read from the **incoming** HTML, so it is computed per render
and needs no client code.

**Known limit.** An axis the server *set* on one page and *left blank* on the
next keeps the live value the server put there, because the second render
asks to preserve it. The playground's `?scheme=` switchers do exactly this
when switching back to *system*. They get `data-rmx-document`: a switcher
is a full-page choice and a document load is the honest way to make it. An
app whose server clears a choice it set does the same.

Rejected: an unconditional `data-rmx-preserve-attrs="data-scheme
data-density"`. It fixes the toggle and breaks every server-chosen scheme
under JavaScript, which `Document`'s own contract promises.

Rejected: a `navigatesuccess` listener in the runtime that re-applies the
stored choice. That is a flash on every navigation, and hand-written code
for a job the reconciler does natively.

## 2. What `interactivity.md` says about hand-written behaviour (task 38)

The ladder ends at **3. Hand-written** and says nothing about the shape that
code takes. Apps built on this package — xonton first — read
`docs/interactivity.md` as their ladder, and xonton has grown about twenty
client entries that coordinate through untyped `document` events and the
document's own `dataset`. The rules belong here, once:

- **State an app owns is a model**, a `TypedEventTarget` subclass with no DOM
  in it, tested without a browser. Components subscribe with
  `handle.signal`.
- **Custom events are namespaced, constructed from an `Event` subclass, and
  declared** on `HTMLElementEventMap` / `DocumentEventMap` in one module per
  app, so a listener's type comes from the declaration rather than a cast.
  The `--` command namespace stays this package's; app events use the app's
  own prefix (`xonton:`).
- **The narrowest signal**, from the guide's table: an `on()` handler's
  second argument for "latest event wins", a queued task's argument for
  work keyed to one render, `handle.signal` for component-lifetime
  listeners. Setup that should run once runs in setup scope, not inside the
  render function.
- **DOM the client owns is declared**, with `data-rmx-preserve-dom` for a
  subtree and `data-rmx-preserve-attrs` for attributes — §1 is the worked
  example.

The same task corrects the platform table. Its *Menu keyboard model* and
*Combobox* rows name `@remix-run/ui/menu` and `@remix-run/ui/combobox`, and
nothing in `src/` imports `@remix-run/ui`. The rows become *planned*, with
the ladder text unchanged, until a component adopts one.

## 3. Commands announce their outcome (task 39, held)

The guide's custom-event pattern suggests each command dispatch a typed
semantic event when it finishes — `ui:schemechange` on the root after
`--set-scheme`, `ui:copied` on the button after `--copy` — so an app could
react with `on(...)` instead of observing attributes.

Held, not scheduled: **no consumer exists**. xonton's settings preview sets
the root's attributes itself and does not use `--set-scheme`; nothing else
listens. An event nobody reads is API to maintain. Task 39 carries the
design and starts when an app names the event it needs.

## Not changed

- **The command protocol.** Hydrating components to attach `on("click")` per
  element would cost a client entry per component and lose behaviour that
  today survives a frame swap with no hydration at all. Delegation stays.
- **The six commands.** Each is a document-wide behaviour over server
  markup, which is the case the guide sends to native `addEventListener`.
