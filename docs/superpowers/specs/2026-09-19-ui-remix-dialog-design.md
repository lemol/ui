# ui-remix: Dialog, `overlay()` and the Invoker Commands shim

Date: 2026-09-19
Task: M1 / 17
Status: designed

`Dialog` is the overlay half of the contract proof and the only component in M1
with client code behind it. Everything before it — `Button`, the layout four,
the typographic three, `Field`, `Badge` — renders once and is finished. This one
has to still work after a frame response replaces the markup it was bound to,
on an engine that does not know what `commandfor` means, with its entry
animation intact and its exit animation degrading quietly where the platform
cannot carry it.

The component is small. What this task actually settles is the protocol
everything interactive after it copies: how an invoker finds its target, where
the single listener lives, what a backfill is allowed to do, and how an overlay
animates without a line of JavaScript.

## What the platform carries, and the two places it stops short

`showModal()` gives the top layer, the focus trap, the inert background and Esc.
`command="show-modal"` / `"close"` on a `<button commandfor="…">` gives the
invocation with no script. That is the whole interaction, declaratively, and it
is why this component is not built on `remix/ui/popover` or on a hand-written
open/close handler — steps two and three of the ladder in
[interactivity.md](../../interactivity.md) are never reached.

Two gaps in that story matter at our floor of Chrome 114 / Safari 17 /
Firefox 125:

**Invoker Commands are Baseline December 2025.** Below that the attributes are
inert: no error, no event, no console warning, a dead click. `compat.ts` closes
it.

**Light dismiss is not available.** `<dialog closedby="any">` is Chrome 134 /
Safari 18.4 / Firefox 141 — far above the floor. On most of the supported range
the only dismissal `showModal()` offers is Esc, which is invisible and absent on
touch. So a visible close button is not decoration; it is the dismiss
affordance, and `Dialog` renders one itself rather than trusting every caller to
remember.

## The factory

```tsx
const NewTask = overlay("new-task")

<NewTask.Trigger tone="primary">New task</NewTask.Trigger>
<NewTask.Dialog title="New task">
  <form method="post" action={routes.tasks.create.href()}>
    …
    <NewTask.Close tone="ghost">Cancel</NewTask.Close>
    <Button type="submit" tone="primary">Create</Button>
  </form>
</NewTask.Dialog>
```

`overlay(name)` returns `{ id, Trigger, Dialog, Close }`. The id is exposed
because a caller occasionally needs it for an `aria-controls`, and because
returning it costs nothing; the string is still written once.

### The brand, and what it is for

A mismatched `commandfor` fails silently, so the rule is that nobody writes one.
A rule held by review is a rule that lapses, so this one is held by the type
checker:

```ts
declare const invocation: unique symbol

export interface Invocation {
  readonly [invocation]: true
  readonly command: string
  readonly commandfor: string
}
```

`overlay()` is the only place that can produce an `Invocation`, because the
symbol is module-private. `Button` gains one prop, `invoke?: Invocation`, and
spreads it onto its `<button>`. A caller who wants to invoke something reaches
for the factory because there is no other way to make the value the prop
accepts.

Three honest limits. The brand protects our components, not a consumer's own
`<button command=… commandfor=…>`, which nothing here can see. It is a
compile-time device, so a JavaScript consumer gets no protection at all. And
`Button` now carries a prop that exactly one caller uses — the cost of keeping
one button component instead of two that must not drift.

The alternatives were public `command`/`commandfor` props on `Button` held by a
grep test, and a second button inside `overlay.tsx` reusing `Button`'s exported
style blocks. The first moves the failure from the compiler to a test nobody
reruns while typing; the second creates two components with one appearance.

## Anatomy

```html
<dialog id="new-task" aria-labelledby="new-task-title">
  <header>
    <h2 id="new-task-title">New task</h2>
    <button type="button" command="close" commandfor="new-task" aria-label="Close">
      <svg …>×</svg>
    </button>
  </header>
  <!-- children -->
</dialog>
```

The title is a `Heading` at level 2, so dialog titles read from the same
typographic contract as every other heading rather than growing
`--ui-dialog-title-*` tokens that would drift from it. `aria-labelledby` is
wired to its minted id; `title` is required, because an unlabelled modal is the
same bug as an unlabelled field.

That costs `Heading` one prop: it destructures its props rather than spreading
them, and it has no `id` today, so `Heading` gains `id?: string`. The
alternative — `aria-label={title}` on the `<dialog>` — needs no change anywhere
and is rejected because it names the dialog with a string that merely duplicates
the visible heading, so the two drift the first time one is edited.
`Field` already carries an `id` prop, so this is an existing shape rather than a
new one.

**There is no footer slot.** The spec's own example puts a `<form>` in the
children and a form already carries its own submit row; a `footer` prop would
give every caller two places to put a button and no rule for choosing. `Close`
covers the one thing the caller genuinely cannot write — the dismissal — and the
rest is layout the caller already owns.

**The × is Dialog's own `<button>`, not a `Button`.** An icon-only button is a
square sized by its glyph, and `Button` declares `height` and `padding-inline`
from its own tokens. Overriding those through `mix` is exactly the thing `mix`
cannot reliably do: each `css()` block is its own cascade sub-layer, sub-layer
order follows first render rather than array order, so a square close button
would be square only on the pages where the blocks happened to register in the
right order. It gets `--ui-dialog-close-*` tokens instead. `Close`, which wraps
a *text* button for a Cancel beside a submit, is a real `Button` and needs no
such thing.

## Dismissal uses `close`, not `request-close`

`command="request-close"` fires the `cancel` event first, so a dirty-form guard
can veto the dismissal. It needs Chrome 135+, the same floor as native Invoker
Commands, and nothing in M1 has a guard to run. `close` it is. `Close` can grow
a `requestClose` prop the day something needs one, and the shim already knows
both.

## Motion, shipped now

Retrofitting `@starting-style` into a finished catalogue costs more than three
lines per component at the time, and an unanimated `Dialog` in M1 becomes the
reference everyone copies. So the transition ships with the component.

The obstacle is that [motion.md](../../motion.md) prescribes declaring the
`transition` shorthand **twice** — once without `allow-discrete` for engines
that lack `transition-behavior`, once with it — and a JavaScript object cannot
hold the same key twice. The escape hatch is a nested `&` block, which CSS
nesting resolves to the same specificity, later in source order:

```ts
const duration = "var(--ui-dialog-transition-duration)"
const timing = `${duration} var(--ui-dialog-transition-easing)`
const offset = "0 calc(var(--ui-dialog-enter-offset) * -1)"

const panel = css({
  opacity: 0,
  translate: offset,
  transition: `opacity ${timing}, translate ${timing}`,
  "&": {
    transition: `opacity ${timing}, translate ${timing}, overlay ${duration} allow-discrete, display ${duration} allow-discrete`,
  },
  "&[open]": { opacity: 1, translate: "0 0" },
  "&::backdrop": { background: "var(--ui-dialog-backdrop-bg)", opacity: 0 },
  "&[open]::backdrop": { opacity: 1 },
  "@starting-style": {
    "&[open]": { opacity: 0, translate: offset },
    "&[open]::backdrop": { opacity: 0 },
  },
})
```

That was rendered before it was written down: `remix/ui` emits the `@starting-style`
block outside the class rule and the nested `&` inside it, which is the shape
the document asks for. Where `transition-behavior` is unknown the second
declaration is invalid and dropped whole, and the first survives — which is the
entire point of writing it twice.

`@starting-style` targets `&[open]`, the state being entered, not the resting
state. Durations and easings are tokens, so the global
`prefers-reduced-motion` reset — which zeroes every `dur-*` token rather than
overriding a universal selector — reaches this component with no opt-in.

`overlay` is not Baseline and is absent in Safari, so **exit animations degrade
in Safari while entry animations work**. Accepted rather than papered over with
a JavaScript close sequence; entry is the half users notice.

## The backdrop cannot see the contract below Chrome 122

`::backdrop` inherits from its originating element only since Chromium 122,
Safari 17.4 and Firefox 120. Before that it inherits from nothing — not even
from `:root` — so `background: var(--ui-dialog-backdrop-bg)` resolves to
guaranteed-invalid and the modal opens over an undimmed page on Chrome 114–121
and Safari 17.0–17.3.

This is accepted and documented, for the same reason the Safari `overlay` gap
is. The two alternatives are worse: emitting the token block onto a
`::backdrop` selector puts a pseudo-element into `emit.ts` and leaves the dark
axis with no clean equivalent — `:root[data-scheme="dark"]` cannot be rewritten
to match a backdrop without a descendant combinator and a specificity fight —
and a literal fallback inside the `var()` puts a hard-coded colour in a
component contract, which is the one thing `tokens.test.ts` exists to forbid.

The loss is cosmetic. `showModal()` still takes the top layer, still traps
focus, still makes the page behind inert. Nothing becomes unclickable or
unreadable; it is less pretty on an aging band of engines.

## The schema gains `overlay-max`

`schema.sizing` holds `control-h`, `control-h-sm`, `row-h`, `row-pad-y`,
`page-max` and `gutter`. A panel's maximum width is not among them, and
`page-max` is 72rem in `mini` — a page container, not a dialog.

A component token must default to a primitive. A component that needs a size the
schema does not name means the schema is short a name, not that the component
may hold a literal. So `overlay-max` joins `schema.sizing`, and `mini` gives it
`32rem`.

`overlay-max` rather than `dialog-max` because M2's drawer, sheet and command
palette read the same value, and the factory that mints their ids is already
called `overlay()`.

## The contract

Twenty-two tokens in `dialog/tokens.ts`.

| Token | Default |
| --- | --- |
| `ui-dialog-max-inline-size` | `var(--overlay-max)` |
| `ui-dialog-inset` | `var(--gutter)` |
| `ui-dialog-bg` | `var(--surface-raised)` |
| `ui-dialog-ink` | `var(--ink)` |
| `ui-dialog-border` | `var(--hairline)` |
| `ui-dialog-border-width` | `1px` |
| `ui-dialog-radius` | `var(--r-lg)` |
| `ui-dialog-shadow` | `var(--shadow-lg)` |
| `ui-dialog-pad` | `var(--sp-6)` |
| `ui-dialog-gap` | `var(--sp-4)` |
| `ui-dialog-header-gap` | `var(--sp-4)` |
| `ui-dialog-close-size` | `var(--control-h-sm)` |
| `ui-dialog-close-radius` | `var(--r-sm)` |
| `ui-dialog-close-bg` | `transparent` |
| `ui-dialog-close-bg-hover` | `var(--surface-hover)` |
| `ui-dialog-close-ink` | `var(--ink-muted)` |
| `ui-dialog-close-ink-hover` | `var(--ink)` |
| `ui-dialog-close-glyph-size` | `var(--fs-md)` |
| `ui-dialog-backdrop-bg` | `var(--scrim)` |
| `ui-dialog-transition-duration` | `var(--dur-fast)` |
| `ui-dialog-transition-easing` | `var(--ease-out-quad)` |
| `ui-dialog-enter-offset` | `var(--sp-2)` |

`1px` and `transparent` are already in `allowedLiterals`, from `Button` and
`Field`. Nothing new is added to that list.

The panel caps at `min(var(--ui-dialog-max-inline-size), calc(100% - var(--ui-dialog-inset) * 2))`
and its block size the same way, with `overflow: auto`, so a long dialog scrolls
inside the viewport instead of past it. A modal dialog's percentages resolve
against the initial containing block, which is what makes that expression mean
"the viewport minus a gutter" without a `vw` literal.

There are no title tokens, because the title is a `Heading`.

## `compat.ts` — the backfill

It installs itself on import and exports the installer for the test that has to
run it deliberately:

```ts
export function installInvokerCommands(options?: { force?: boolean }): void
```

Detection is `"commandForElement" in HTMLButtonElement.prototype`. When the
platform has it, the function returns immediately unless `force` is set; a flag
on `globalThis` makes a second call a no-op, so HMR and a repeated import cannot
register two listeners.

### Forcing it on requires suppressing the native event

A forced shim on an engine that already has Invoker Commands acts twice: the
platform dispatches its own trusted `CommandEvent` and performs the built-in,
and the shim dispatches a synthetic one and performs it again. The second
`showModal()` on an open dialog throws.

The platform's own escape hatch closes this. WHATWG HTML initialises
`CommandEvent` with `cancelable: true` and checks it before running the default
action, so a capturing `command` listener that calls `preventDefault()` on
**trusted** events hands authority to the shim — which is exactly what
`invokers-polyfill` does when it is applied over native support.

So `force` installs that suppressor alongside the click handler. This is not a
test affordance bolted on: a shim that lacks it is wrong on the day an engine
gains native support underneath a page that loaded the backfill, which is the
normal upgrade path for every browser we do not control. The suppressor belongs
in the component either way, and the dual-path test is what proves it works.

The handler is one click listener on `document`, capturing, which finds
`event.target.closest("button[commandfor]")`, resolves the target with
`getElementById`, constructs a `command` event carrying `command` and `source`
(non-bubbling, composed, cancellable, as the real one is), dispatches it on the
target, and — if nothing called `preventDefault()` — performs the built-in:
`show-modal`, `close`, `request-close`, `toggle-popover`, `show-popover`,
`hide-popover`. A `--`-prefixed command performs nothing; dispatching it is the
whole job, because that is what `runtime.ts` listens for.

The popover commands are included even though M1 renders no popover. They are
four lines, the shim would otherwise be a half-backfill that makes markup
identical for dialogs and silently dead for menus, and M2 opens with exactly
that markup.

The architecture note calls this "about fifteen lines". With six commands, the
guard and the event construction it is nearer forty. The number was an estimate
of the idea's size, not a budget, and it is not worth hitting by shipping half
of it.

## `runtime.ts` — one listener, an empty table

```ts
export function registerCommand(name: `--${string}`, handler: CommandHandler): void
export function installCommandRuntime(): void
```

One `document.addEventListener("command", handler, true)`. Capturing, because
`CommandEvent` does not bubble and an ordinary delegated listener never fires.
Delegated, because binding to queried elements dies on the first frame
navigation — the lesson `@mionso/design` paid for.

M1 registers nothing. The registry ships anyway, so M2 adds a command instead of
adding plumbing, and the subpath exists from the start so an app imports the
runtime without pulling the component library in behind it.

The template-literal type on `name` keeps registration inside the `--` namespace
the browser guarantees never to claim.

## Tests

### What the server-render suite holds

The usual shape, through `test/render.ts`: the factory renders a trigger whose
`command`/`commandfor` match the dialog's `id`; `aria-labelledby` names the
title's id; every declared token is read and every read token is declared; the
blocks are disjoint by property. Two additions specific to this component.

**A no-JS test.** The dialog and its trigger render as complete markup with no
client entry — the rendered output carries no `<script>`, and the invocation
attributes are present and paired. That is the assertion behind "the dialog
opens and closes with no client JavaScript"; the browser test is what proves the
claim rather than the markup.

**A motion test that reads declarations, not frames.** The emitted CSS carries
the `transition` shorthand twice, the second with `allow-discrete`; a
`@starting-style` block targeting `[open]`; and no literal duration or easing
anywhere. Timing is not asserted at any tier — the reduced-motion reset zeroes
every duration token, so an assertion about elapsed time would be asserting the
test machine's motion preference.

### The browser harness

**Playwright 1.63 as a library, driven from inside `bun test`** — not the
`@playwright/test` runner. `bun test` stays the only runner and `bun run check`
the only gate; no bundler arrives, no second assertion dialect, and no
permanent Node dependency lands in a repository that otherwise runs Bun only.
`playwright-core` supplies what makes this worth having: locator actionability,
`addInitScript`, `page.clock`, tracing, and `page.ariaSnapshot()`. Bun supplies
`--retry`, `--rerun-each`, `--bail` and `--reporter=junit`.

This was measured before it was chosen. A spike driving Chromium 153 from
`bun test` on Bun 1.4.2 ran 60 passes under `--rerun-each=20` in 6.7 seconds
with no flakes.

Two facts from that spike constrain how the tests are written:

- **`page.setContent()` does not run `addInitScript`.** It writes into the
  existing document rather than creating one, so an init script registered
  beforehand never fires — silently. Tests serve their page from `Bun.serve`
  and `page.goto` it, which is also how the playground runs, so the harness and
  production share a shape.
- **The trusted-event suppression works.** Cancelling the trusted `CommandEvent`
  from a capturing listener stops the native action, and a synthetic event
  dispatched afterwards drives `showModal()` exactly once. Both halves of the
  dual-path test therefore run on one pinned Chromium, and the `ariaSnapshot()`
  of the open dialog is a fixed string.

The browser test covers three things and stops: the native path opens and
closes the dialog; the forced shim path does the same with the native action
suppressed; and the ARIA tree of the open dialog matches its snapshot. Each
state is awaited through `waitForFunction` on `dialog.open` or through locator
actionability. There are no sleeps, and a failure leaves an accessibility tree
rather than a screenshot — the difference between an artifact an agent can read
and one it can only look at.

When Chromium is absent the test fails with `bunx playwright install chromium`
in the message. It does not skip: a test that disappears on the machine without
a browser is off precisely where it matters.

### What this harness cannot do

**It cannot gate Safari 17.** Playwright's WebKit is built from WebKit `main`
and is explicitly not the branded Safari; `safaridriver` has no headless mode.
Since `interactivity.md` holds that a dead click on an older engine is a real
failure, this limit is written into the skill rather than left as an implied
promise.

**It cannot gate an engine without Invoker Commands.** Playwright 1.63 bundles
Chromium 153, Firefox 155 and WebKit 26.6, all of which have them natively, and
the Blink flag that once switched the feature off was deleted in Chrome 140 —
where an unknown `--disable-blink-features` name is ignored silently, so asking
for it looks like it worked. A genuine no-support run means installing Chrome
for Testing 134 through `@puppeteer/browsers` and passing `executablePath`. That
stays an occasional manual check, documented in the skill, not part of the gate.

### The instruction layer

`microsoft/playwright-cli` ships a first-party skill for agent-driven browser
work, and it is installed here through the repository's existing convention —
`npx skills add`, landing in `.agents/skills/`, symlinked into `.claude/skills/`,
recorded in `skills-lock.json`. Each sibling repository installs its own copy
the same way.

That skill covers the tool. A short repo-local skill covers this project: which
server to start, what to snapshot, that Safari and pre-135 engines are
unverifiable here, and that the two accepted degradations — no backdrop tint
below Chrome 122, no exit animation in Safari — are expected findings rather
than bugs to chase.

## Playground wiring

The browser cannot reach `@lemol/ui/remix/compat` today: `apps/playground/remix.json`
allows only the `remix` package through the asset server. This task adds
`@lemol/ui` to `allowPackages` and one client entry under
`app/ui/public/` that imports the compat and runtime subpaths, which is the
smallest thing that makes the dialog work in a real browser. The catalogue's
no-JS toggle and the switchers stay task 19's.

## Documents to correct

- `docs/design-system.md` — `overlay-max` in the sizing group, and the
  `::backdrop` inheritance floor beside the existing contrast promises.
- `docs/motion.md` — the doubled shorthand is expressed as a nested `&` block in
  a `css()` object; the document currently shows only the raw CSS.
- `docs/interactivity.md` — the shim's command list and the fact that `Button`
  takes an `Invocation` rather than raw attributes.
- `src/remix/README.md` — `Dialog`, the factory, the token count, and the
  sentence saying `runtime.ts` and `compat.ts` are stubs.
- `src/design/README.md` — the new primitive.
- `docs/architecture.md` — the Testing section says browser tests cover the
  runtime behaviours; it can now say which harness does it and what that harness
  cannot reach. The Tooling section gains Playwright as the one dev dependency
  outside Biome and TypeScript.
- `AGENTS.md` — the Commands block gains the one-time
  `bunx playwright install chromium`.

## Out of scope

Drawer, sheet, toast and command palette (M2). Anchor positioning, which is
behind `@supports` and has no consumer yet. View transitions. Nested dialogs —
the top layer stacks them correctly, but nothing in M1 opens one from another.
A dirty-form guard on dismissal, which is what `request-close` is for.
