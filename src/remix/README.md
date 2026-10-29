# @lemol/ui/remix

Remix 3 components, and the `--ui-*` token contract a component declares beside
itself. Also `ThemeStyle`, which puts an emitted stylesheet into the document,
and the two files that are the whole of this repo's hand-written client code.

Sits on the `design` layer and `remix/component`, and on nothing else.

## Entry points

| Import | Holds | Ships to the browser |
| --- | --- | --- |
| `@lemol/ui/remix` | The components, their token records, `ThemeStyle`. | Only when a client entry imports it, and then everything it imports: every component. |
| `@lemol/ui/remix/overlay` | `overlay()` alone, for a client entry. | Yes: `Button`, `Dialog` and what they import. |
| `@lemol/ui/remix/runtime` | The single capture-phase `command` listener. | Yes. |
| `@lemol/ui/remix/compat` | The Invoker Commands backfill. | Yes. |
| `@lemol/ui/remix/demos` | The demo for each component, for the playground. | No. |

**Import the runtime from its own subpath, never from the barrel** — otherwise
the bundle pulls the component library in behind it. A client entry takes
`overlay` from `@lemol/ui/remix/overlay` for the same reason.

### A host's stylesheet

A component's `css()` blocks render inline, one `<style>` per block, on every
page that draws it. A host that serves its own stylesheet can carry them
instead: `componentStyles()` returns every style the components declared at
module scope, in declaration order, and rendering each through remix's `css`
gives the very classes the components use, so the host can drop the inline
copies from its pages. Components import the library's own `css`
(`src/remix/css.ts`), which records on the server only and only while the
library's modules evaluate; a style built during a render is never kept.

## Catalogue

### `Button` / `LinkButton`

`Button` renders a `<button>`, defaulting `type` to `"button"` because a bare
button inside a form submits it. `LinkButton` renders an `<a>` and requires
`href`: `aria-disabled` on an anchor does not prevent navigation, so a disabled
link is a broken link.

`Button` also takes an optional `id` — added for `CopyButton` (M2), which
needs a button to `commandfor` itself, but useful anywhere else a caller
needs to target the element (an `aria-describedby`, a `<label for>`).

Two axes, thirty-one tokens in `button/tokens.ts`:

| Axis | Values | Comes from |
| --- | --- | --- |
| `tone` | `primary`, `neutral`, `ghost`, `danger` | `--ui-btn-<tone>-{bg,ink,border,bg-hover}` |
| `size` | `md`, `sm` | `--control-h` and `--control-h-sm`, so density reaches it |

Neither component styles focus. The reset owns the ring, and it applies because
nothing in the component competes with it. `:active` reuses the hover
background. Disabled is three tone-independent tokens rather than an opacity
ratio, and its override sits inside each tone's own `css()` block rather than
in the shared base block — see
[design-system.md](../../docs/design-system.md#cascade-layers) for why a
`css()` call's sub-layer, not just its specificity, decides which declaration
wins.

Tone backgrounds use the `background` shorthand, so a skin may set
`--ui-btn-<tone>-bg` to a gradient — `background-color` would drop a gradient
as invalid. Gradients do not interpolate, so a gradient skin swaps instantly on
hover while the flat default transitions.

**`mix` adds; it does not override.** It reliably sets properties the component
leaves alone — `position`, a grid placement, a margin the surrounding layout
owns. It does not reliably override a property the component declares, and
composing it last does not change that: each `css()` block is its own cascade
sub-layer, layer order beats specificity inside a layer, and sub-layer order
follows the order blocks are first encountered during the render rather than the
order of the `mix` array. A descriptor already rendered on an earlier element
registers first and loses to the component's own tone.

To change a property the component declares, set its `--ui-btn-*` token — that
is what the tier is for, and it reaches every instance instead of one call site.
`!important` also wins, since no component here declares one, but reaching for
it means a token is missing. See
[design-system.md](../../docs/design-system.md#cascade-layers).

### `Stack` / `Row` / `Grid` / `Container`

Layout, and **no tokens of their own** — the contract proved from the opposite
side to `Button`. Each reads primitives directly and declares no `--ui-*`, so
none of them appears in `tokens.ts` and a skin retunes them by changing the
primitives they read — the space scale, `--page-max`, `--gutter` — rather than
the components.

| Component | Layout props | Declares |
| --- | --- | --- |
| `Stack` | `gap`: a space step. `align`: `start`, `center`, `end`, `baseline`, `stretch` | `display: flex`, `flex-direction: column` |
| `Row` | `gap` and `align` as above. `justify`: `start`, `center`, `end`, `between`, `around`, `evenly`. `wrap`: a boolean | `display: flex` |
| `Grid` | `gap`. `cols`: `1` to `6` | `display: grid` |
| `Container` | none | `max-inline-size: var(--page-max)`, `padding-inline: var(--gutter)`, `margin-inline: auto` |

`gap` is a step on the primitive space scale — `gap={4}` is `var(--sp-4)` — and
its type derives from `schema.space`, so a step the schema does not hold is a
typecheck failure. The Record of blocks is shared in `space.ts`, and `align`
in `align.ts`, because `remix/component` caches a `css()` block by content: a copy
per component would collapse to one sub-layer anyway and save nothing while
still drifting.

**Which axes have defaults, and why it matters.** `gap` defaults to `0` and
`Row`'s `align` to `center`; both blocks therefore always render. `Stack`'s
`align`, `Row`'s `justify` and `wrap`, and `Grid`'s `cols` render no block
unless asked for — `wrap` unless it is `true`, the others unless the prop is
passed — which leaves those properties fully reachable through `mix`. See
[design-system.md](../../docs/design-system.md#cascade-layers) for the rule and
the cost of giving an axis a default.

`Container` has no layout props because it has nothing to decide: both of its
lengths are primitives a theme sets. It cannot change its tag either, so a
caller wanting `<main>` wraps it rather than configuring it.

`cols` stops at six. Twelve is the convention for grid systems that count
*spans*; these are equal `1fr` tracks, and more than six of them is unreadable
at any width `--page-max` permits. A judgement, not a schema constraint.

`Grid` has no responsive mode. `repeat(auto-fit, minmax(…))` needs a track
minimum and the schema holds no primitive for one; a caller-supplied length
would be the only open-ended value in the layer. Until a sizing ramp exists,
a responsive track list goes through `mix`, which is reliable precisely because
`cols` was not passed.

### `Heading` / `Text` / `Eyebrow`

The type scale as a contract. `Heading` separates the document outline from the
appearance: `level` picks the element, `size` picks the step and defaults to
`level`, so an `h3` that has to look like an `h5` needs no escape hatch.

| Axis | Values | Comes from |
| --- | --- | --- |
| `Heading` `level` | `1` to `6`, required | The element rendered |
| `Heading` `size` | `1` to `6`, defaults to `level` | `--ui-heading-<n>-size` |
| `Text` `size` | `sm`, `md`, `lg` | `--ui-text-size-<size>` |
| `Text` `tone` | `default`, `muted`, `subtle` | `--ui-text-ink*` |
| `Text` `as` | `p`, `span`, `div` | The element rendered |
| `Eyebrow` | no axes | `--ui-eyebrow-*`, all five |

The six heading sizes default from `headingScale` in `@lemol/ui/design`, which
is also where the reset gets the sizes it gives a bare `h1`–`h6`. One map, so a
heading nobody wrapped in the component and one that went through it cannot
drift apart.

`Text` declares no `font-weight`, so `mix={css({ fontWeight: "var(--fw-semibold)" })}`
is reliable. `Heading`, `Text` and `Eyebrow` all declare `color`, so their ink
goes through the contract — `tone` on `Text`, the token on the other two.

### `Field`

Native form controls with their label, hint and error wired by the component,
and validation left to the browser. No JavaScript validation anywhere.

| Axis | Values | Comes from |
| --- | --- | --- |
| `control` | `input` (default), `textarea`, `select` | The element rendered |
| `type` | the text-box family: `text`, `email`, `url`, `tel`, `password`, `search`, `number`, `date`, `time`, `datetime-local`, `month`, `week` | `input` only |
| height | one, not an axis | `--control-h`, so density reaches it |

`checkbox`, `radio`, `file`, `range` and `color` are not `type` values. None of
them is a bordered box of `--control-h` height, so every token here would style
them wrongly. There is no `size` axis either: forms are uniform in a way
toolbars are not, and density already retunes the height.

**The hint sits under the control**, as a description, and `aria-describedby`
names it, so a screen reader still reads it when the control takes focus.
Under rather than above, so fields set side by side keep their controls on one
line whatever each hint says: a long hint above pushed its control below its
neighbour's.

**Ids derive from the required `name`** — `email` for the control,
`email-hint` and `email-error` for the messages — and `aria-describedby` names
only the messages that rendered, because pointing it at an absent id is a
silent failure. Pass `id` when two forms on one page share a field name.
`hint`, `error` and `id` all treat `""` the same as absent, since each is an
ordinary way for a controller to say "nothing here" and rendering it as a
value would either add an empty message or break the label's binding.

**Two sources of invalidity, one set of tokens.** A server-supplied `error`
sets `aria-invalid`; native constraint validation matches `:user-invalid`. Both
read `--ui-field-invalid-*`. `:invalid` is not used: it matches an empty
required field on first paint, so every form would load pre-reddened.
`:user-invalid` is Chrome 119, so Chrome 114 through 118 shows no invalid
styling and the validation bubble still blocks submission there.

**A `<textarea>` takes its value from `value`, not from children.** `remix/component`
drops a textarea's children. **A `<select>` takes no `value` at all** — HTML
gives it no such content attribute, so the chosen `<option>` carries
`selected`. It takes no `readonly` either, for the same reason.

**`value` is controlled; `defaultValue` is not.** In a hydrated component the
runtime puts `value` back after every keystroke until a render passes a new
one. A field whose form holds what was typed, read back from the DOM rather
than from the component's state, takes `defaultValue` instead. Both render the
same `value` attribute on the server, so a form that never hydrates can take
either.

`appearance: none` on the select is what lets it match an input, and the
chevron that replaces the native arrow is an inline `<svg>` sharing a grid cell
with the control. Its colour is `--ui-field-chevron-ink`, which a
`background-image` data URI could not manage: `var()` does not resolve inside
`url()`.

**Where the engine has a customizable select** (Chrome 135, Safari 27), the
list is drawn too: `appearance: base-select` on the select and its
`::picker(select)`, behind `@supports`, turns the options into a styleable
top-layer popover — `--ui-field-picker-*` for its surface, `--ui-field-option-*`
for its rows, the checkmark moved to a row's end — while the keyboard model,
the screen reader's reading, submission and validation stay the platform's.
Elsewhere the gate drops it all and the select is the plain one above. An
`<option value="">` reads as a placeholder. Every select renders the
`<button><selectedcontent>` pair, so the closed select shows the chosen option's
whole content, icon included, on one line cut with an ellipsis. The button is
named by the full value, so the cut text is still read whole. An engine without
customizable select drops the pair while parsing.

The list enters and leaves as `Popover`'s surface does, on its own
`--ui-field-picker-transition-*` tokens. Its closed state is written on
`:not(:open)`, so an engine that draws the list without knowing `:open` shows
a list that does not move rather than one that never appears. The picker's
pointer and the prompt's ink wait for `:enabled`: they sit in the later
sub-layer, and unconditional they would beat the disabled cursor and ink.

Forty-four tokens in `field/tokens.ts`. Field styles no focus ring, as
`Button` does not: the reset owns it, and it applies because no component
competes with it. **`mix` reaches the wrapper, not the control** — a property
of the control goes through its token.

### `FacetFilter`

One facet of a filtered collection, as a data table's toolbar draws it: a
dashed button naming what it narrows by, which shows the chosen value once
there is one, and opens the choices in a native popover through
`command="toggle-popover"`. Each choice is a **link** to the page with that
value set, written by the server — choosing is a navigation the browser already
makes, and the runtime can make it in place — so there is no client state and
nothing to submit. A facet a list cannot enumerate passes a form of its own as
children. `name` is the id stem for the list and its anchor, used verbatim as
`overlay()` uses its name, and both halves of the `commandfor` pair are bound
from it.

Built on `invoke()` rather than `popover()`'s trigger, because the dashed edge
is a border style `Button` declares, which `mix` cannot reliably override. The
list is anchored under the trigger's start edge and carries Popover's entry and
exit. Forty-four tokens in `facet-filter/tokens.ts`.

The choices read as a menu: `role="menu"`, each row `menuitemradio`, or
`menuitemcheckbox` once more than one value is chosen, since the trigger then
shows several. The keyboard model is `Tab` through the links, as `Menu`'s is:
no arrow keys and no typeahead, the trade-off a native popover of links makes
with no script. A facet with no options holds a form, so its list is a
`dialog` named by the facet's label, which is what its trigger's
`aria-haspopup` says it opens.

### `TabBar`

A phone's bottom navigation: the app's few destinations, each its mark over
its name in an equal cell, the current one (`current`) on a pill, and an item
that opens a sheet for the rest (`popoverTarget`, *More*). Links and one
popover button, so it works with no script. A `badge` puts a count at the
mark's top end (`attention` spends the accent, a zero draws nothing, past 99
it reads `99+`) and a `dot` says something waits behind an item; both are
read after the name. It draws below `tabBarBreakpoint` (48rem) only, the
landmark leaving a wide screen whole for a sidebar's navigation.

It draws the bar and nothing around it: where it stands (a sticky foot,
padded above the home indicator with `env(safe-area-inset-bottom)`) is the
frame's. A destination's own hue is `--ui-tabbar-mark-ink-current` set on
its item, and a host that marks the pressed item `data-pending` while it
navigates, and an ancestor `data-navigating`, moves the pill at once.

### `Tabs`

Tabs as route links (interactivity.md, "Not in scope"): each tab an `<a>` to
its own URL, the current one `aria-current="page"`, so a tab works before
hydration and survives a reload. A tab with nothing to show yet is a dim
`<span>` in its place, never a disabled link. Two looks, `line` (an indicator
on a rule, under a page title) and `pill` (a raised tab in a recessed track,
for a compact switch), each property-disjoint from the shared block. The strip
scrolls sideways rather than wrapping, and a scroller clips whatever paints
past its edge, so a tab draws the reset's focus ring inside its own edge,
inset by `--ui-tabs-ring-inset` (the ring's width), and the `line` rule is an
inset shadow the tabs paint over rather than a border no tab could reach.
Twenty-three tokens in `tabs/tokens.ts`.

### `Kbd`

A key cap, as a native `<kbd>`: `inline-flex` so it sits in a sentence or a
row of hints without breaking the line, with a heavier lower edge a skin can
retune. One key per cap; a chord is caps side by side. Eleven tokens in
`kbd/tokens.ts`.

### `AppBar`

A record's head: the way back (`back`, required, since a pushed screen
always has one: a link one level up, never the browser's history), the title
as the page's `h1` over one dim `subtitle` (where the record sits), what it
is doing (`status`), the controls for what the page shows (`controls`, a view
switch) and its `actions` (a `⋯` menu). On a wide screen one row; below
`appBarBreakpoint` (48rem, where a `TabBar` draws) a phone's app bar: back
and the actions either side of the title over its subtitle, the status and
controls on a row of their own, clear of a notch or a status bar drawn over
the page. It sticks over the page on the page's own ground. The title takes
two lines at most, the whole in its `title` attribute.

A host that marks an ancestor `data-app-bar-stuck` while the bar sticks
folds its second row and the title's second line away, and keeps the room
they gave up below the bar so the page does not jump; one that marks nothing
keeps both. A host that draws its own head, with motion of its own, spreads
`appBarParts(stuck)` into its elements' own blocks under `appBarMedia`:
`bar`, `row`, `back`, `title`, `subtitle` and `slot(area)`, where `stuck` is
its own mark's selector.

### `Badge`

A status pill: a `<span>` laid out `inline-flex`, so it sits in a sentence or
a table cell without breaking the line. One axis, `tone` — `neutral`,
`success`, `warning`, `danger`, `info` — defaulting to `neutral`, because the
most common badge says `Draft` rather than anything semantic.

Every tone is a `<tone>-subtle` fill with `<tone>` as ink. That pair is the
second contrast promise in [design-system.md](../../docs/design-system.md),
and `mini`'s theme test holds it. No hover and no transition: the schema gives
status colours no `-hover` arm. No size axis: `schema.sizing` names two
control heights and a badge is not a control.

Twenty-three tokens in `badge/tokens.ts`.

### `Dialog` and `overlay()`

A native `<dialog>` opened by Invoker Commands, with no client code in the page
on an engine that has them. `overlay(name)` mints the id once and returns
`{ id, Trigger, Dialog, Close }`; the `command`/`commandfor` pair travels as a
branded `Invocation` that only the factory can construct, so the string that
fails silently when mistyped cannot be written by hand.

The panel renders a header — the title as a level-2 `Heading`, and a × bound to
`command="close"` — then its children. There is no footer slot: a caller's form
already carries its own submit row.

Entry and exit ship with the component: the `transition` shorthand twice, the
second in a nested `&` block, and `@starting-style` on `[open]`. `display` is
declared only inside `&[open]`, because a top-level one renders every closed
dialog on the page. Exit degrades in Safari, which has no `overlay` property,
and the backdrop is untinted below Chromium 122, which does not inherit custom
properties into `::backdrop`.

The panel sets its own text at the body's values: type, line height,
`white-space`, alignment and cursor. The top layer lifts a `<dialog>` out of
the page's boxes but not out of its inheritance, so a dialog mounted beside
its trigger in a menu item would otherwise take the item's `nowrap`, and no
line of its form would wrap.

Twenty-six tokens in `dialog/tokens.ts`.

Under `sheetBreakpoint` (40rem) the panel is a sheet: see *Sheets* below.

`overlay` is also published alone, as `@lemol/ui/remix/overlay`, for a client
entry. The browser loads every module a client entry imports and nothing
tree-shakes the source, so a trigger that took `overlay` from the barrel put
every component in the page's module graph. From the subpath it takes `Button`,
`Dialog` and what they import.

### `Popover` and `popover()`

A native `[popover]` opened by `command="toggle-popover"`, with no client code
in the page. `popover(name)` mints the id and an `anchor-name` together and
returns `{ id, Trigger, Surface }`, the same reasoning as `overlay()`: neither
string can be written by hand.

Placement sits behind `@supports (anchor-name: --a)` — `position-anchor` on
the surface, `anchor-name` on the trigger. Unsupported, the surface keeps the
platform's own popover default (`position: fixed; inset: 0; margin: auto`),
which is already a centered popover, so there is no fallback CSS to write.

Entry and exit follow Dialog's pattern exactly: the `transition` shorthand
twice, `@starting-style` targeting `&:popover-open`, `display` declared only
inside that same state.

Fourteen tokens in `popover/tokens.ts`, `--ui-popover-position-area` among them
for a surface that should open toward its trigger's start or end edge; the
trigger is a `Button` and reads
`--ui-btn-*`, not a parallel set.

`popover(name, { sheet: true })` mints a surface that becomes a sheet on a
narrow screen, for a list a thumb chooses from; without it a popover stays
beside its trigger at every width, as a note about something should.

### `Menu` and `menu()`

A `Popover` with `role="menu"` and rows of `role="menuitem"` — checked against
`remix/component/menu` first and built without it: that package's `Menu` owns a
JS-`Context`-driven popover of its own, not `[popover]` plus
`command="toggle-popover"`, so building on it would trade the native-first
open/close this layer exists to guarantee for a keyboard model outside the six
hand-written behaviours the M2 plan budgets for. `Tab` reaches every row with
the runtime absent; there is no roving-tabindex or typeahead enhancement.

`MenuItem` renders an `<a>` when given `href`, a `<button>` otherwise.
`MenuSeparator` is an `<hr>` — its role is implicit, so none is written.

Eleven tokens in `menu/tokens.ts`; the surface itself reads `--ui-popover-*`.
A menu is minted `{ sheet: true }`: on a narrow screen it is an action sheet.

### Sheets

On a screen narrower than `sheetBreakpoint` (40rem, exported), an overlay a
thumb works through — `Dialog`, `Menu`, a `popover(name, { sheet: true })`,
`FacetFilter`'s list — is a sheet: docked to the bottom edge at the screen's
width, its top corners rounded, its foot clear of the home indicator
(`env(safe-area-inset-bottom)`), sliding its own height in over the base
duration rather than fading under its trigger. The page above it stays in
sight behind the scrim, and a tap there, Escape, or a phone's back gesture
closes it, all the platform's own light dismiss. Each surface carries
`data-sheet`, so an app can close what is open when it navigates.

`sheet/sheet.ts` holds the rules, spread into each component's own block after
its anchor positioning so they win by source order; five tokens in
`sheet/tokens.ts`, shared by every sheet.

### `Shortcut`

A keyboard shortcut's hint: `keys={["⌘", "↵"]}` draws one `Kbd` cap per key,
and the whole hint is gone where the primary pointer cannot hover — a touch
screen, with no keyboard to press it on. It is `aria-hidden`: name the
shortcut on the control it triggers with `aria-keyshortcuts`, which a screen
reader announces with the control. No tokens of its own; the caps read
`--ui-kbd-*`.

### `Disclosure` and `Accordion`

A native `<details>`/`<summary>`, zero client JS even for the accordion case.
`Accordion` renders `Disclosure` items sharing one `name`, the platform's own
single-open exclusion (Baseline 2023) — it takes `items` as data rather than
raw `Disclosure` children, because nothing in this layer can inject a shared
prop into arbitrary JSX children the way a wrapper component would need to.

The marker is drawn, not the UA triangle: `display: flex` on `<summary>`
drops it on the engines that draw it through `::marker`, and
`::-webkit-details-marker { display: none }` covers Safari, which draws it
through a separate pseudo `display` does not reach. It rotates from
`:where(details[open]) &`, a plain descendant selector, so nothing here
toggles a class on open/close. The content itself does not animate: `<details>`
reveals it by toggling internal visibility rather than `display`, and no
Baseline feature transitions that yet.

Thirteen tokens in `disclosure/tokens.ts`.

### `Table`

`Table`, `TableHead`, `TableBody`, `TableRow`, `TableHeaderCell` and
`TableCell` — server-rendered rows, nothing else. `SortableColumnHeader` is a
plain `<a>` toggling `?sort=field&dir=asc|desc`, computed by `sortHrefFor()`
and `sortDirectionOf()` from the page's own `location` string; every other
query param survives a sort, and `aria-sort` marks the active column. No
client state, because the request that follows a click is an ordinary
navigation. Virtualized tables are out of scope — see the M2 plan.

Density reads `--row-pad-y` through `ui-table-cell-pad-y` rather than an
explicit row height, which table layout does not reliably respect across
engines.

`list` draws the table as a phone's list below `tableListBreakpoint`
(48rem): no column heads (still read), each row its mark, its body and what
trails it, by each `TableCell`'s `place` (`lead`, `body`, the default,
`trail`, dim and small at the row's end, or `hide`), and the whole row the
target of the link marked `data-table-link`, which stretches over it while
the row's other controls stay pressable. Rows, not columns: a column a phone
cannot fit is one it cannot read either. A browser drops a table's roles
with its table layout, so a list writes them out. A host that draws its own
table markup spreads `tableListRules` into its table's one `css()` block
under `tableListMedia` (or its own frame's width): the table marked
`data-table-list`, its cells `data-table-place`, and a group's head row the
one whose cell is `scope="rowgroup"`.

Eighteen tokens in `table/tokens.ts`.

### `Toaster` and `toast()`

The one M2 component that needs real hand-written JS: a *timed* auto-dismiss
is not something `[popover]` can express on its own, so `Toaster` sits on the
ladder's third rung by necessity, unlike `Popover` and `Menu`. `toast(name)`
mints an id and binds a trigger to it; the trigger's command is
`--dismiss-toast`, which shows the toast (`popover="manual"`) and schedules
its own hide with `scheduleDismiss()` (`toaster/dismiss-timer.ts`) — a pure,
DOM-free function tested directly, the palette's-match-rule model the M2 plan
names for this. Manual dismissal is still native: the close button carries
`command="hide-popover"`.

The handler is registered in `runtime.ts`, not in `toaster.tsx`: a document's
browser entry imports only `runtime.ts` and `compat.ts`, never a component
module for its own sake, so a `registerCommand()` call living in the
component file would sit in code the bundle has no other reason to load and
would never fire. `runtime.ts` imports `scheduleDismiss` and a shared
attribute-name constant from `toaster/`, both plain and JSX-free, so the
runtime file itself stays free of the component library it dispatches for.

Entry and exit follow `Dialog`'s and `Popover`'s pattern exactly. Thirty
tokens in `toaster/tokens.ts`: a shell, a close button, and five tones each
carrying the `<tone>` on `<tone>-subtle` pair.

### `Checkbox`, `Radio` and `Switch`

The rest of the native control family `Field` deliberately excluded in M1
(see the doc comment in `field/field.tsx`, which names exactly these three).
`Select` needed no new component: `Field`'s `control="select"` arm already
covers it from M1, and the playground's own knobs already use it.

`Checkbox` and `Radio` retint the platform's own glyph with `accent-color` —
one property, every engine in the baseline, no `appearance: none` and no
hand-drawn box. `Switch` cannot do that: no native input type gives it a
track/thumb to retint, so it draws its own — `appearance: none` on a real
`<input type="checkbox" role="switch">`, the thumb a `::before` translated on
`:checked`. It stays a real checkbox throughout; `role="switch"` and, when
controlled, a mirrored `aria-checked` are the only additions. Otherwise
`aria-checked` is omitted so the native checked state follows the person's clicks.

`Checkbox` and `Switch` take controlled `checked` the way `Field` takes
`value`, and `defaultChecked` is their `defaultValue`: a control in a hydrated
component whose form holds the choice takes `defaultChecked`. `Switch`'s
required `label` is a `RemixNode`, so wording can include inline markup;
`Checkbox` and `Radio` keep string labels.

All three share `form-control.ts`'s `fieldMessages()` for the id/
`aria-describedby`/`aria-invalid` wiring `Field` also has — factored out
because three copies of that scaffold is the line the M2 plan draws before
asking for a shared helper. `Field` itself is not migrated onto it.

Each disabled/enabled label is one parameterized `css()` block, not a base
block plus a `:disabled` override in a second one: two blocks both setting
`color` on one element would hand sub-layer order the decision, the same
trap `button.tsx`'s own tone/disabled co-location note describes.

Nine tokens each in `checkbox/tokens.ts` and `radio/tokens.ts`; eighteen in
`switch/tokens.ts`.

### `SegmentedControl`

A native `<fieldset>` of `<input type="radio">`, visually hidden behind the
`<label>` each sits inside, with a single sliding fill drawn as its own `<div>`
and one `:has()` rule per option — `:where(fieldset:has(label:nth-of-type(n)
input:checked)) &`, positional rather than id-keyed, so `trackStyle` and the
indicator's own block cache by option count alone, the same reasoning
`Grid`'s `columnStyles` gives for `repeat(n, 1fr)`.

The fill moves by `translate`, not `grid-column`: `grid-column` does not
interpolate, so a transition on it would snap between segments instead of
sliding. A percentage in `translate` resolves against the element's own box,
so `translate: n00%` reaches segment `n` with no per-instance measurement.

The radio's own `:focus-visible` ring is invisible where the input is
clipped, so the reset's rule is relocated to `label:has(input:focus-visible)`,
reading the same two primitives rather than a token of its own — the same
rule, not a second one. Disabling the whole group is the native
`<fieldset disabled>`, not a per-input attribute.

Fifteen tokens in `segmented-control/tokens.ts`.

### `Callout`

Static — no interactivity, no runtime. `Badge`'s tone pair scaled from a pill
to a block: the same five tones, `neutral` reading the surface vocabulary and
the semantic four each the `<tone>` on `<tone>-subtle` pair. An optional
icon, description and action slot; no footer, no dismissal — a caller wanting
either composes its own around it.

Twenty-four tokens in `callout/tokens.ts`.

### `Meter` and `Progress`

Native `<meter>` and `<progress>`, deliberately under-styled: `appearance:
none` is not used on either, because on `<progress>` it would discard the
UA's own indeterminate-state animation — the striped pulse a valueless
`<progress>` already renders with no markup and no script, which the M2 plan
is explicit must not be reimplemented. `Progress` retints its fill with
`accent-color`; `Meter` gets no fill-colour token at all, since its colour is
the UA's own low/high/optimum semantics and `accent-color` support for
`<meter>` specifically is inconsistent across the baseline.

Two tokens in `meter/tokens.ts`, shared by both.

### `CommandPalette`

The other component needing hand-written JS, and the one the M2 plan names as
the model for testing it: `matchItems()` (`command-palette/match.ts`) is a
pure, DOM-free subsequence match, tested directly with a table of
query/items/expected cases rather than through a render. Built on `overlay()`
rather than its own shell — a palette wants a modal focus trap, which
`Dialog`'s `<dialog>` already gives it, so `--ui-dialog-*` covers the panel,
the motion and the close button, and `command-palette/tokens.ts` adds only
the input and the row.

`CommandPaletteInput` fires `--palette` on every keystroke, not a click —
`command`/`commandfor` on an `<input>` is not itself a native browser
feature, so this is the first consumer of `runtime.ts`'s `input` bridge (see
below). `CommandPaletteItem` writes its own `label`/`keywords` as
`data-palette-*` attributes; `--palette`'s handler reads those straight off
the rendered `<li>` rows rather than keeping a second items array in sync
with them, then toggles `hidden`. With the runtime absent every row stays
visible: there is no native way to filter, so the whole list is what a
no-JS reader gets.

Twelve tokens in `command-palette/tokens.ts`.

### `LiveForm` and `liveSubmit()`

`LiveForm` is a plain `<form>`; `liveSubmit(formId)` is an `attrs()` mixin a
caller applies through `mix` to whichever field should trigger a resubmit —
`Field`'s own wrapper, since `runtime.ts`'s `input` bridge reaches it with
`closest()` from wherever the actual event targets. `--live-submit`
debounces per **form**, not per field: every field in one `LiveForm` shares
one target (`commandfor` names the form), so one `debounce()` instance is
keyed by that target and every field's own input events reuse it, then calls
`form.requestSubmit()`. `debounce()` (`live-form/debounce.ts`) is pure and
DOM-free, tested directly like `toaster/dismiss-timer.ts`'s `scheduleDismiss`.

With the runtime absent `LiveForm` is exactly a `<form>` with no
`liveSubmit()` field ever wired to anything — it still submits normally on
its own submit button. No component tokens: this is behaviour, not a
styled shell.

### `CopyButton`

`command="--copy"`, `commandfor` pointing at itself (copying its own `value`)
or at another element (copying its `textContent` with `for`) — the same
one-variable-used-twice reasoning as `overlay()`'s minted id, since `id` is
both the element's own id and, absent `for`, its `commandfor` target. Renders
a plain `Button`, so it reads `--ui-btn-*` and declares no tokens of its own.

`Button` gained an `id` prop for this — optional, and every other M1 use is
unaffected. `--copy`'s handler (`runtime.ts`) writes the clipboard, then
swaps the button's own text for `confirmLabel` and back with
`scheduleDismiss()`, the same one-shot timer `Toaster` uses. Retriggering
before the revert cancels the pending one, so two rapid clicks cannot race
each other. With the runtime absent the button is inert — there is no
clipboard API without JavaScript, and that is accepted rather than papered
over with a fallback nobody asked for.

### `DensityToggle` and `SchemeToggle`

Both `command`/`commandfor` a `documentRootId` (`document-root.ts`) —
`<html>` carries no id by default, so `mini`'s `Document` now renders one and
both toggles target the same constant rather than a hand-written string. Any
other document shell (a static SPA `index.html`) needs the same id for these
two to work there.

`--toggle-density` and `--set-scheme` (`runtime.ts`) read and write the exact
`data-density`/`data-scheme` attributes and `localStorage` keys
`bootScript` (`design/css/boot.ts`) restores from on the next load — the two
have to agree exactly, or the no-flash guarantee breaks. `--set-scheme` is
named "set" rather than "toggle": it resolves the *current* scheme (the
root's own attribute, or `prefers-color-scheme` when the document left that
to the media query) and sets the explicit opposite, so the first click is
correct regardless of which one was never written down. `--toggle-density`
toggles between absent and `"compact"`, the schema's only two states.

Both render a plain `Button` and declare no tokens; both are inert with the
runtime absent, which is the accepted degradation — no JS, no live
switching, and the page still renders in whatever `bootScript` restored.

### `Breadcrumbs`

Route links with `aria-current` — no client state, since this is a
server-rendered app and the current page is known at render time. Checked
against `remix/component/breadcrumbs` first: its markup shape (`nav` > `ol` > `li`*,
`aria-current="page"` on the current item, a separator marked `aria-hidden`)
is followed here too, but its styling reads a hardcoded internal
style-values module rather than this package's `--ui-*` contract, so the
component itself was not reused. The last item with no `href` is the current
page; any other item with no `href` is plain text, a segment with nothing to
link to.

Eight tokens in `breadcrumbs/tokens.ts`.

### `Pagination`

Server-rendered `?page=n` links, pairing with `Table`. `pageRange()`
(`pagination/page-range.ts`) is the page-list-with-ellipsis algorithm, pure
and tested directly; `pageHref()`/`currentPageOf()` follow `Table`'s own
`sortHrefFor()`/`sortDirectionOf()` pattern for reading and writing the query
string. The boundary controls (`Previous` on page 1, `Next` on the last
page) render as plain text, not an `aria-disabled` anchor: `aria-disabled`
does not prevent navigation, so a "disabled" link is a broken link, the same
reasoning `LinkButton` gives for requiring a real `href`.

Ten tokens in `pagination/tokens.ts`.

### `Spinner` and `Skeleton`

Pure CSS animation, no JS, and neither carries a component-local
`prefers-reduced-motion` query: each reads `--dur-slow` through its own
`-duration` token, and the global reset (`design/css/reset.ts`) zeroes every
`--dur-*` token under `prefers-reduced-motion: reduce`, so a zero-duration
animation completes instantly — the quiet state the media query asks for,
reached by reading the token rather than by a second rule.

`Spinner` is a ring drawn from `border`, one arc retinted, rotated by the
native `rotate` property. `Skeleton` is a gradient sweeping across itself via
`background-position` rather than an opacity pulse — a shimmer reads as
"content is coming," where a flashing block can read as "something is
wrong." Neither `@keyframes` name is minted: unlike a `view-transition-name`,
two elements sharing one is the normal case, not a collision. `Skeleton` is
sized entirely through `mix`, the same way `Container`/`Grid` leave arbitrary
structural lengths to the caller.

Six tokens in `spinner/tokens.ts`, five in `skeleton/tokens.ts`.

### `ThemeStyle`

Renders `emitTokensCss()`'s string into the document, defaulting to this
layer's aggregate:

```tsx
<ThemeStyle theme={miniTheme} />
```

**It belongs in `<head>`.** `remix/component` splices its own component styles in
immediately before `</head>`, so a `ThemeStyle` in the body is evaluated after
the `rmx` layer exists — and `@layer rmx-reset, base, rmx;` then registers
`base` after it, inverting the order with no error. See
[design-system.md](../../docs/design-system.md#delivery).

## Limits

- **A component never hard-codes a colour, radius, duration or space step.** It
  declares its own tokens in `src/<name>/tokens.ts`, each defaulting relationally
  to a primitive, and reads only that tier — or it declares none and reads
  primitives directly, as the layout components do. A skin is a set of token
  values; it is never a forked component.
- **SPA-safe.** No `node:*`, no `bun`, no `effect`, and no server-side `remix/*`
  entry — `remix/router`, `remix/routes`, `remix/assets`, `remix/spa` are all
  out. `test/boundaries.test.ts` enforces it, which is what makes SPA
  portability a checked property rather than an intention.
- **One delegated, capturing listener.** `CommandEvent` does not bubble, and a
  non-delegated listener dies on the first frame navigation, so behaviours go
  through `--` custom commands read by the single listener in `runtime.ts`.
  A second delegated listener there bridges `input` events into the same
  `command` event for the two behaviours a click cannot source
  (`--live-submit`, `--palette`) — one dispatch mechanism, one place handlers
  are registered, two ways to trigger it.
- **Never hand-write a `commandfor` id.** A mismatch is a dead click with no
  error and no warning. Use the `overlay()` factory, which binds both halves.
- **Native first.** Check the ladder in
  [interactivity.md](../../docs/interactivity.md#the-ladder) before writing DOM
  code.
- **No build step, and `remix` is the only peer.**

## Structure

One directory per component, holding the component, its demo, its test, and its
token record if it has one:

```
button/button.tsx  tokens.ts  button.demo.tsx  button.test.tsx
stack/stack.tsx               stack.demo.tsx   stack.test.tsx
```

Dropped rather than aligned: `heading/` is another instance of the "with
`tokens.ts`" row above, not a third case.

Co-location is what keeps the demo from drifting from the component. A missing
`tokens.ts` is a claim, not an omission: that component styles itself from
primitives and structural keywords alone, and its test fails on a `--ui-`
anywhere in its output. `tokens.ts` aggregates every component's record and
exports the union of their names as a type. A Record of blocks more than one
component uses sits at the layer root instead: `space.ts`, `align.ts`.

The one test a component does not keep beside it is the one that needs a real
browser. Those live in `test/browser/`, because their subject is not the
component: they drive a playground route through a real document, the asset
pipeline and the client entry, so what they prove is the whole chain rather
than the render. Keeping them out of `src/` is also what lets
`test/boundaries.test.ts` go on refusing a browser driver anywhere under it.
They are named `<subject>.browser.test.ts`, so `bun test test/browser` runs
the set and a component's browser coverage is findable by its own name.

## Reading

[design-system.md](../../docs/design-system.md) for the contract and emission
order, [interactivity.md](../../docs/interactivity.md) for the command protocol
and the browser baseline, [motion.md](../../docs/motion.md) for entry and exit
transitions.

## Status

`Button`, `LinkButton`, `Stack`, `Row`, `Grid`, `Container`, `Heading`, `Text`,
`Eyebrow`, `Field`, `Badge`, `Dialog` and `ThemeStyle` ship from M1. M2's full
catalogue ships too: `Popover`, `Menu`, `Disclosure`/`Accordion`, `Table`,
`Toaster`, `Checkbox`, `Radio`, `Switch`, `SegmentedControl`, `Callout`,
`Meter`/`Progress`, `CommandPalette`, `LiveForm`, `CopyButton`,
`DensityToggle`, `SchemeToggle`, `Breadcrumbs`, `Pagination`, `Spinner` and
`Skeleton`. `tokens.ts` aggregates the component records and exports
`ComponentTokenName`; the four layout components add nothing to it, which is
what they exist to demonstrate, the three typographic ones add twenty-two
between them, `Field` adds twenty-seven, `Badge` twenty-three, `Dialog`
twenty-six, `Popover` thirteen, `Menu` eleven, `Disclosure` thirteen, `Table`
twelve, `Toaster` thirty, `Checkbox` and `Radio` nine each, `Switch`
eighteen, `SegmentedControl` fifteen, `Callout` twenty-four, `Meter` two
(shared by `Progress`), `CommandPalette` twelve, `Breadcrumbs` eight,
`Pagination` ten, `Spinner` six, `Skeleton` five, and `LiveForm`,
`CopyButton`, `DensityToggle` and `SchemeToggle` none — each is behaviour
over an existing shell, not a styled one of their own. `FacetFilter`, `Tabs`
and `Kbd` followed, with forty-four, twenty-three and eleven, and `Field` grew to
forty-four with the customizable select. `demos.ts` registers thirty-four demos. `compat.ts` backfills Invoker Commands and `runtime.ts`
holds the command listener and
the `input` bridge, registering
`--dismiss-toast`, `--palette`, `--live-submit`, `--copy`,
`--toggle-density` and `--set-scheme`.
