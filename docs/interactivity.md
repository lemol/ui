# Interactivity

The platform carries the behaviour. Six behaviours in the whole library need
hand-written client JavaScript, and everything else is native HTML plus, where
the need exceeds the platform, an `@remix-run/ui` primitive layered over it.

## The ladder

Work down it in order. Stop at the first step that covers the need.

1. **Native platform.** Zero client code.
2. **`@remix-run/ui/*` primitives**, layered *over* the native element — the native
   popover opens with no JS, the primitive enhances keyboard behaviour after
   hydration.
3. **Hand-written.** Only where neither covers it.

`@remix-run/ui` ships headless `accordion`, `anchor`, `animation`, `combobox`,
`listbox`, `menu`, `popover`, `select`, `tabs` and `toggle` subpaths. Check what
is there before writing anything. It is a separate package from `remix`,
versioned in the unstable v0.x range, so the first primitive used here also
adds it as a peer dependency, to the boundary allow-list and to each app's
`allowPackages`.

## What the platform does unaided

| Need | Mechanism | Client JS |
| --- | --- | --- |
| Modal | `<dialog>` + `command="show-modal"` / `"close"` / `"request-close"` | none¹ |
| Menu, dropdown, popover | `popover` + `command="toggle-popover"` | none¹ |
| Placement | `anchor-name` / `position-anchor` / `position-area` | none, `@supports` fallback |
| Light dismiss, top layer, focus trap, Esc | `popover` / `showModal()` | none |
| Disclosure | `<details>` / `<summary>` | none |
| Accordion, one at a time | `<details name="…">` | none |
| Tooltip | `popover="hint"` + anchor positioning | none |
| Inputs, select, checkbox, radio, validation | native controls + constraint validation | none |
| Tabs | route links with `aria-current` — these are server-rendered apps | none |
| Tab bar | route links with `aria-current`, and a `popovertarget` button for *More* | none |
| App bar | a link one level up, the rest the page's own controls | none |
| Menu keyboard model | planned — `@remix-run/ui/menu` over a native popover | on hydration |
| Combobox | planned — `@remix-run/ui/combobox` over a native `<select>` | on hydration |

¹ plus the compat shim below.
No component in `src/` uses `@remix-run/ui` yet.

## The command protocol

Behaviours use custom commands in the `--` namespace — a space browsers
guarantee never to claim — read by **one** listener:

```ts
document.addEventListener("command", handler, true)
```

Two details make that line correct, and both are traps:

- **`CommandEvent` does not bubble.** It is non-bubbling, composed, trusted and
  cancellable, dispatched on the element named by `commandfor`. A listener
  attached the ordinary way never fires. The capture phase descends
  window → target, so it still reaches — hence the `true`.
- **It must be delegated from `document`.** Querying elements and binding to
  them kills the behaviour on the first frame navigation. Delegation needs no
  `MutationObserver` and survives markup that arrives from a frame response.

A custom command needs a real `commandfor` target to fire, which reads
naturally: `command="--copy" commandfor="account-number"`.

Reusing `command`/`commandfor` rather than inventing a `data-ui-*` attribute
means one standard vocabulary instead of a private one.

## The complete list of hand-written client JS

```
@lemol/ui/remix/compat     Invoker Commands backfill; installs itself on import.
                           installInvokerCommands({ force: true }) installs it
                           over native support and cancels the trusted
                           CommandEvent's default action, so a built-in is not
                           performed twice, and cancels it before the runtime
                           sees it, so a `--` command is not handled twice.
@lemol/ui/remix/runtime    the capture-phase listener and registerCommand().
                           No command is registered yet. The table below is the
                           complete set the library will ever hold:
  --live-submit     debounced auto-submit for filter forms
  --copy            clipboard write + in-place confirm
  --set-scheme      persist the light/dark choice
  --toggle-density  persist density
  --dismiss-toast   timing only; dismissal itself is native command="close"
  --palette         fuzzy filter over a server-rendered command list
```

Nothing else ships client code. Import the runtime from its own subpath, never
from the barrel, so the bundle does not pull the component library in behind
it.

Where a behaviour has real logic, export it as a pure function and test it
directly rather than through a DOM.

## Ids must not be hand-written

A mismatched or unsupported `commandfor` produces no error, no event, and no
console warning — a dead click. So a factory binds both halves and there is no
string to mistype:

```tsx
const NewTask = overlay("new-task")

<NewTask.Trigger tone="primary">New task</NewTask.Trigger>
<NewTask.Dialog title="New task">
  <form method="post" action={routes.tasks.create.href()}>…</form>
</NewTask.Dialog>
```

Note also that `commandfor` works only on `<button>`. Links and inputs cannot
be invokers, so a trigger is always a button.

`overlay()` mints an `Invocation`, and `Button`'s `invoke` prop is the only way
to put `command`/`commandfor` on an element from this package. The type carries
a module-private brand, so there is no expression outside `overlay()` that
satisfies it — the rule is held by the type checker rather than by review.

## Browser baseline

**Chrome 114+ / Safari 17+ / Firefox 125+** — the Popover API floor.

Apps built here get shared with browsers we do not control, so the floor is set
by what must work unaided. Newer features get cheap treatment rather than a
lower floor:

| Feature | Availability | How it is used |
| --- | --- | --- |
| Popover API | Chrome 114, Safari 17, Firefox 125 | Relied on directly. **This sets the floor.** |
| Invoker Commands | Baseline Dec 2025 (Chrome 135+, Safari 26, Firefox late 2025) | Native, with `@lemol/ui/remix/compat` backfilling older engines in ~70 lines. Identical markup either way. |
| CSS anchor positioning | Baseline Jan 2026 (Chrome 125+, Safari 26, Firefox 147+) | Behind `@supports (anchor-name: --a)`. |
| Customizable select (`appearance: base-select`) | Chrome 135+, Safari 27 | Behind `@supports (appearance: base-select)` in `Field`'s select; elsewhere the plain styled select. |

**Why the floor is the Popover API.** Below it you must reimplement top layer
and light dismiss, which is where the cost explodes. Above it, a shim is
about seventy lines.

**Why the compat shim exists at all**, given JavaScript is assumed available:
because the failure mode without it is a silent dead click rather than an
error. Seventy lines closes that.

**`?compat` forces the shim on.** Every engine we can drive in a test already
has Invoker Commands natively, so without a switch the backfill would ship
unexercised. The playground's browser entry checks for it beside the `?nojs`
check that drops the client entry entirely, and calls
`installInvokerCommands({ force: true })`.

**Why anchor positioning is the one exception.** Interop is still rough even at
Baseline — behaviour differs across engines and MDN still carries a
non-Baseline banner on `position-anchor`. Placement degrades to a centered or
statically placed popover.

## Adding a behaviour

1. **Design the markup first.** Ask what the feature does with no client
   JavaScript. If the answer is "nothing", walk back down the ladder — start
   from a link, a form, a `<details>`, or a `popover`.
2. **Check native HTML, then `@remix-run/ui/*`.** Only then write code.
3. If it is document-wide, give it a `--` command and handle it in the existing
   capture-phase listener. Do not add a second listener.
4. If it has real logic, export that as a pure function and test it directly.
5. Document the command in the list above.

## If the app needs hand-written behaviour

When an application built on this package must write client code (ladder step
3), keep to four rules:

1. **State an app owns is a model.** A plain TypeScript subclass of
   `TypedEventTarget<{ change: Event }>` from `remix/component`, with no DOM in
   it, tested without a browser. A component subscribes with
   `{ signal: handle.signal }` and calls `handle.update()`; components sharing
   one model receive it through context, never through `clientEntry` props,
   which are serialised across the server/client boundary.
2. **Custom events are namespaced, built from an `Event` subclass, and
   declared** on `HTMLElementEventMap` or `DocumentEventMap` in one module per
   app, so a listener's type comes from the ambient declaration rather than a
   cast. The `--` command namespace stays this package's; an app uses its own
   prefix (such as `app:`).
3. **The narrowest signal**, as in the guide's table: an `on()` handler's second
   argument for "latest event wins", a queued task's (`queueTask()`) argument
   for work keyed to a single render, and `handle.signal` for component-lifetime
   listeners. Setup that runs once goes in setup scope, not inside the render
   function, where the task signal aborts on every re-render.
4. **DOM the client owns is declared**: `data-rmx-preserve-dom` for a subtree,
   `data-rmx-preserve-attrs` for attributes. Explicit declarations prevent the
   frame reconciler from stripping client-owned state on navigation. Root blank
   scheme and density persistence (task 37) is the worked example.

For code examples, see the Remix interactivity guide
(`node_modules/remix/guides/05-interactivity.md` at
`#saving-a-client-owned-document`, `#creating-custom-mixins`, and
`#optimistic-updates-and-cancellation-with-handle-signal`). The full design
rationale is in
`docs/superpowers/specs/2026-10-24-ui-remix-events-and-models-design.md`.

## Not in scope

Drag-and-drop reorder — up/down submit buttons instead, which need no
JavaScript and are how `todo-md` already works. Virtualized tables. In-page tab
panels; tabs are route links.
