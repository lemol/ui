# ui-remix: Field

Date: 2026-09-19
Task: M1 / 15
Status: designed

`Field` renders a native form control with its label, hint and error, and
leaves validation to the browser. It is in the M1 slice because form
integration is one of the two places a token contract breaks, and `Button` will
not reveal it.

Three things make it the hardest component in the slice, and each gets a
section below. It is the first component to style more than one element, so
the block-disjointness rule needs a per-element reading. It is the first to
mint ids, which principle 6 governs. And a `<select>` cannot match an
`<input>` without giving up the disclosure arrow and drawing a new one.

## The component owns the control

`Field` renders the `<input>`, `<textarea>` or `<select>` itself rather than
wrapping one the caller writes.

The alternative was a render callback handing the caller a minted id:
`<Field label="Email">{({ id, describedBy }) => <input id={id} … />}</Field>`.
It reads well and it reaches every native attribute without a pass-through
list. It also lets a caller ship `<input name="email">` with no `id`, which
produces a control with no label association: no error, no warning, a broken
accessibility tree, and nothing in this repo can test application code. That
is the failure principle 6 exists to ban. The same forgetting applies to the
box styling, which lives on the control element too, so a second omission
silently drops the component's whole look.

A third shape, `Field` plus sibling `Input` / `Textarea` / `Select`
components, needs a wiring mechanism `remix/ui` does not offer generically.
Only `popover.Context` exists, and it belongs to popover. Explicit prop
threading reduces to the forgetting problem above. The scheduling objection is
worse: M2 already owns the names `Select`, `Checkbox`, `Radio` and `Switch`, so
taking `Select` here for a different job means M2 renames or rewrites it.

The cost `Field` pays instead is a pass-through prop for every attribute it
supports. That list is bounded, and a missing entry is an additive change
rather than a breaking one.

### A `field()` factory would be solving a problem we did not create

`overlay()` exists because `commandfor` crosses from a trigger to a target the
caller places separately. There are two components and a string between them.
`Field` renders the label, the control, the hint and the error itself, so no
string crosses a boundary and there is nothing to mint safely. The render
callback and the sibling-components shape both open that gap and then need a
factory to close it again.

## The surface

`control` is a discriminated union, so an attribute that means nothing on a
kind is not reachable on that kind. A flat prop bag would let
`<Field control="select" rows={3} pattern="…" />` typecheck.

```ts
interface FieldCommon {
  /** Required. Names the value in the submission, and is the id stem. */
  name: string
  /** Required. An unlabelled control is a broken control. */
  label: string
  hint?: string | undefined
  /** Server-supplied. Sets aria-invalid and renders below the control. */
  error?: string | undefined
  /** Overrides the id stem when two forms on one page share a field name. */
  id?: string | undefined
  required?: boolean | undefined
  disabled?: boolean | undefined
  /** Applies to the wrapper, not the control. See below. */
  mix?: MixInput<HTMLDivElement> | undefined
}
```

`mix` reaches the wrapper `<div>`, which is the element a surrounding layout
has business placing. It does not reach the control, and there is no second
`mix` for one. A property of the control goes through a `--ui-field-*` token,
which is what the component tier is for. `readonly` is a legal property name
under `strict` and `exactOptionalPropertyTypes`; TypeScript reads it as a
property rather than a modifier because a `?` follows.

| Kind | Adds |
| --- | --- |
| `input`, the default | `type`, `value`, `placeholder`, `autocomplete`, `pattern`, `minlength`, `maxlength`, `min`, `max`, `step`, `readonly` |
| `textarea` | `value`, `placeholder`, `rows`, `minlength`, `maxlength`, `readonly` |
| `select` | `children`, the `<option>`s, required |

`readonly` is on two kinds rather than in `FieldCommon`, because `<select
readonly>` is inert: HTML gives `select` no `readonly` attribute, so offering
the prop there would render an attribute that does nothing. `&[readonly]` in
the control block therefore only ever matches an input or a textarea.

`type` is the text-box family and nothing else: `text`, `email`, `url`, `tel`,
`password`, `search`, `number`, `date`, `time`, `datetime-local`, `month`,
`week`. `checkbox`, `radio`, `file`, `range` and `color` are excluded because
none of them is a bordered box of `--control-h` height. They are different
controls sharing a tag name, and M2 schedules `Checkbox`, `Radio` and `Switch`
for that reason. `multiple` is off `select` on the same grounds: a multi-select
is a list box.

### Two renderer behaviours the surface has to respect

Both verified by probe against `remix@3.0.0-rc.2`, and both would otherwise
have produced markup that looks right and does nothing.

**A `<textarea>`'s children are dropped.** `<textarea>{value}</textarea>`
renders `<textarea></textarea>`; the text is gone, with no warning.
`<textarea value="hi" />` renders `<textarea>hi</textarea>`. So `value` is the
prop for every kind, and `children` never reaches a textarea. This is the
opposite of the plain-HTML arrangement, where the value *is* the content.

**A `<select>` has no `value` content attribute.** `<select value="a">` emits
`value="a"` onto the element, which is invalid HTML that selects nothing. The
IDL property exists; the attribute does not. So `FieldSelect` has no `value`
prop, and the caller marks the chosen option with `selected`, which is where
HTML puts it. Adding the prop would give callers an obvious-looking handle that
silently fails, which is the same class of defect as a mismatched `commandfor`.

`children` therefore belongs to `select` alone, and it holds the options.

### No `size` axis

`Button` has `sm` and `md` because `schema.sizing` holds `control-h` and
`control-h-sm`. `Field` takes only the first.

Forms are uniform in a way toolbars are not, a compact density already retunes
the height for every control at once, and the second size would turn the box
metrics into a kind-by-size matrix: three kinds times two sizes, six blocks,
because a textarea takes no fixed height and a select needs different end
padding from either. One height keeps it at three. Adding the axis later is
additive.

## Ids

Every id derives from `name`, which is required anyway because a control
without one does not submit. `email` for the control, `email-hint` and
`email-error` for the messages. An optional `id` prop replaces the stem.

The ids come out readable and deterministic, which keeps the error-summary
pattern working. A no-JS form reporting several failures at once links to each
field by fragment, and `<a href="#email">` needs an id it can predict.

A module-level counter is the obvious alternative and it is wrong here.
`renderToString` is async and concurrent, so two in-flight requests interleave
the counter. The label and the control still pair correctly within one
document, because both read the same captured value, but the HTML stops being
deterministic. That breaks snapshot tests and any cached render, and it buys
nothing, since nothing outside the component points at these ids except the
caller who wrote the `name`.

An implicit wrapping label removes the `for` and `id` pair, but `hint` and
`error` still need ids for `aria-describedby`, so it solves half the problem.
It also gives up the fragment link, and it makes the whole labelled area a
click target, which is occasionally surprising on a `<select>`.

The failure mode left is two forms on one page using the same field name.
Duplicate ids, and `for` binds to the first. The `id` prop closes it, and an
HTML validator catches it.

The stem is used as written, with no sanitising. An id may hold anything but
whitespace, so `user[email]` is a valid stem and a name containing a space is
not. Sanitising would map two different names onto one id, which is the
duplicate-id failure again with the cause hidden. A caller in that position
passes `id`.

## Markup

```html
<div>
  <label for="email">Email <span aria-hidden="true">*</span></label>
  <p id="email-hint">We only use this to send receipts.</p>
  <input id="email" name="email" type="email" required
         aria-describedby="email-hint email-error" aria-invalid="true">
  <p id="email-error">That address is already registered.</p>
</div>
```

The hint sits above the control so it is read before the user types, and
`aria-describedby` lists ids in DOM order. It names only the ids actually
rendered. Pointing it at a hint that does not exist is another silent failure:
some assistive technology reads nothing, some skips the attribute.

The required marker is `aria-hidden`, because `required` is already on the
control and assistive technology announces it from there. The asterisk is
purely visual, so its ink defaults to `--ink-muted` rather than `--danger`. It
is information, not an error.

The error carries no `role="alert"`. On a server-rendered page that announces
on load, including for a user who never submitted anything.

The select branch is one element deeper, because the chevron has to overlay the
control:

```html
<div><select id="plan" name="plan">…</select><svg aria-hidden="true">…</svg></div>
```

## The invalid state has two sources

Constraint validation catches "required and empty", "not an email", "below
min", all before any request. The server catches "that address is already
registered", which no attribute can express. Both have to show.

`&[aria-invalid="true"]` covers the server error. `&:user-invalid` covers the
native one. Both read the same `--ui-field-invalid-*` tokens.

`:invalid` is excluded, and the reason is worth keeping: it matches an empty
`required` field on first paint, so every form loads pre-reddened before the
user has done anything.

`:user-invalid` is Chrome 119, Safari 16.5, Firefox 88. The floor is Chrome
114, so Chrome 114 through 118 gets no invalid styling. Nothing breaks there.
The validation bubble still appears and still blocks submission, so the field
is unstyled rather than dead. Wrapping the rule in
`@supports selector(:user-invalid)` buys nothing, because the only fallback
available is the one those versions already get.

One wart, recorded rather than fixed: `aria-invalid="true"` comes from the
`error` prop, so it stays true while the user corrects the field, until the
next round trip. Clearing it early would need client JavaScript, and `Field`
ships none.

## Blocks and the cascade

Which block declares what, since disjointness depends on it:

| Block | Element | Declares |
| --- | --- | --- |
| `fieldBase` | wrapper | `display`, `flex-direction`, `gap` |
| `labelStyle` | label | `font-size`, `font-weight`, `color` |
| `requiredStyle` | marker span | `color` |
| `hintStyle` / `errorStyle` | messages | `font-size`, `color` |
| `controlBase` | control | `border-style`, `border-width`, `border-color`, `border-radius`, `background`, `color`, `padding-block-start`, `padding-block-end`, `padding-inline-start`, `font-size`, `&::placeholder`, and every state override |
| `inputBox` | input | `height`, `padding-inline-end` |
| `textareaBox` | textarea | `padding-inline-end`, `resize` |
| `selectBox` | select | `grid-area`, `height`, `padding-inline-end`, `appearance` |
| `selectFrame` | select wrapper | `display` |
| `chevronStyle` | svg | `grid-area`, `align-self`, `justify-self`, `margin-inline-end`, `inline-size`, `block-size`, `color`, `pointer-events` |

`inputBox` and `selectBox` both declare `height`, and that is not a collision:
the two never land on the same element. `textareaBox` declares none, so a
textarea's height comes from `rows`.

One `css()` block per element, and the control's state overrides live **inside
the control's own block**. `&:disabled`, `&[readonly]`, `&:user-invalid` and
`&[aria-invalid="true"]` all override `border-color` and `background`, which
that same block declares. Split across two blocks, sub-layer order would decide
which paints, and that order follows render order rather than source order.
This is the lesson `button/tones` records, applied to a different axis.

### Shorthand and longhand collide where the test cannot see it

The select needs a larger `padding-inline-end` to clear the chevron. If the
control block declares `padding-inline` and the select block declares
`padding-inline-end`, the two conflict in CSS while `sharedProperties()` sees
two different property names and passes.

So padding is longhand throughout. The control block takes `padding-block` and
`padding-inline-start`; `padding-inline-end` belongs to the per-kind block
alone. `background` stays a shorthand, as `Button`'s tones do, because no other
block on the control declares a background longhand and the gradient-skin
affordance is worth keeping. The rule is about a shorthand and a longhand in
different blocks on one element, not about shorthands generally. It generalises,
and belongs in
`docs/design-system.md` beside the disjointness rule it defeats: a block may
not declare a shorthand whose longhand another block declares, and the helper
cannot catch it.

### Disjointness is per element, and the helper is not

`Field` is the first component to style more than one element.
`sharedProperties()` compares every block in the rendered document, so the
label block's `color` and the control block's `color` read as a collision that
cannot happen. They are on different elements and never contend.

`test/styles.ts` gains a companion that filters blocks by the class list of a
named element. `remix/ui` writes `data-rmx-style="rmxc-<hash>"` on the style
element and `class="rmxc-<hash>"` on the element it styles, so the join is
available in the rendered string. The existing helper does not change; tests
for single-element components keep using it.

### Write the `&` explicitly

Verified by probe against `remix@3.0.0-rc.2`: `remix/ui` emits nested selectors
and child combinators into its `<style>` element verbatim, `&` and `>`
included. The escaping hazard `reset.ts` warns about applies to `ThemeStyle`,
which passes its sheet as a text child, not to `css()` blocks, which remix
emits itself.

So nesting works, with one constraint. `&`-led nesting is Chrome 112, below the
floor. Bare-element nesting, `svg { … }` with no `&`, is Chrome 120, above it.
Always write the `&`.

## Tokens

Twenty-seven, in `field/tokens.ts`.

| Group | Tokens and their defaults |
| --- | --- |
| Box | `height` → `--control-h`, `radius` → `--r-sm`, `border-width` → `1px`, `border` → `--hairline-strong`, `bg` → `--surface`, `ink` → `--ink`, `placeholder-ink` → `--ink-subtle`, `pad-x` → `--sp-3`, `pad-y` → `--sp-2`, `font-size` → `--fs-md`, `gap` → `--sp-2` |
| Label | `label-ink` → `--ink`, `label-size` → `--fs-sm`, `label-weight` → `--fw-medium`, `required-ink` → `--ink-muted` |
| Messages | `hint-ink` → `--ink-muted`, `error-ink` → `--danger`, `message-size` → `--fs-sm` |
| Invalid | `invalid-border` → `--danger-border`, `invalid-bg` → `--danger-subtle` |
| Inert | `disabled-bg` → `--surface-active`, `disabled-ink` → `--ink-subtle`, `disabled-border` → `--hairline`, `readonly-bg` → `--surface-hover` |
| Chevron | `chevron-ink` → `--ink-muted`, `chevron-size` → `--sp-3`, `chevron-space` → `--sp-6` |

Every name is prefixed `ui-field-`. `1px` is already on `allowedLiterals` from
`--ui-btn-border-width`, so the list does not change and no fourth literal
needs arguing for.

`danger-subtle` gets its first consumer here, as the token schema spec
predicted when it chose named semantic arms over `color-mix()`.

The chevron's size and clearance are space steps rather than pixel literals,
which is what "compose from the space scale" means for a decorative glyph.

`hint` and `error` share `message-size`. They are the same typographic role at
different inks, and two tokens would only let them drift.

No transition tokens. `Button` has them because it has a hover. `Field` has no
hover and no focus colour change, so the only thing to transition is the
invalid border appearing on blur, which is not worth two tokens. Additive if
someone wants it.

### Field declares no focus ring, contradicting the task brief

Task 15's brief asks for a contract token for the focus ring. `Field` does not
declare one, and `Button` is the precedent: the reset's `:where(:focus-visible)`
rule owns the ring, and it applies precisely because no component competes with
it. A per-component ring is how a focus ring drifts across a library.

The token schema spec's line that "task 15 needs the ring as one token" is
satisfied by the `--focus-ring` primitive it created for exactly that reason. A
two-ring focus style is one `outline` value, and it is themed once.

If this is overruled later, the change is `--ui-field-focus-ring` and
`--ui-field-focus-ring-offset` plus a `&:focus-visible` block inside the control
block, and `Button` becomes the inconsistent one.

## Tests

`field.test.tsx`, server-render:

- Each kind renders its element, with the attributes it was given.
- `for` equals the control's `id`.
- Every id in `aria-describedby` exists exactly once in the markup, and every
  message that rendered is listed in it.
- `aria-invalid` appears only when `error` is passed.
- The select renders its options and an `aria-hidden` chevron.
- Values read only `--ui-field-*`, using the regex assertion `text.test.tsx`
  and `button.test.tsx` already share.
- Blocks are property-disjoint per element, through the new helper.
- The control block holds the base `border-color` and both invalid selectors,
  which is the co-location rule stated as a test rather than a comment.

`tokens.test.ts` picks `fieldTokens` up through the aggregate with no edit of
its own.

The validation bubble is the browser's behaviour, and this repo has no browser
test setup. `Field` ships no runtime code, so it is not the place to introduce
one. That half of the done-when is a manual check in the playground, and saying
so is better than dressing a render test up as proof of it.

## Demo

`field.demo.tsx` is a `<form method="get">` with no `action`, so submitting
reloads the catalogue route with the values in the query string. Native
validation blocks it while a required field is empty. It holds a required
email, a select, a textarea, a disabled field, a readonly field, and one field
carrying a static `error` so the invalid look is visible without a round trip.

Threading the submitted values back into the demo would mean changing the demo
type in `src/demos.ts`, which takes no props today, plus controller work. That
is the playground shell task 19 is scheduled to build. The GET form satisfies
the done-when now, and task 19 can upgrade this same demo in place.

A POST route would be the only honest demonstration of a server-produced
`error`, since a real round trip is what makes one. It also puts the first
non-GET route and a controller into the playground from inside a component
task. The static error shows the state; the round trip waits.

Demos are styled from primitives, as every other demo is. A demo is a page,
not a component.

## Documents to correct

- `packages/ui-remix/README.md`: a catalogue entry for `Field`, and the Status
  paragraph.
- `docs/design-system.md`: the shorthand-and-longhand rule in the cascade
  layers section, and the note that a nested selector must lead with `&`.

## Out of scope

- `Checkbox`, `Radio`, `Switch`, and a styled `Select` as a component. M2 owns
  all four.
- Multi-select and combobox.
- `fieldset` and `legend` grouping. Nothing in M1 needs a grouped control, and
  the styling of `fieldset` has its own problems.
- JavaScript validation of any kind, including clearing a stale
  `aria-invalid` before the next round trip.
- A live round trip in the demo, and the catalogue index page, both task 19's.
- `inputmode`. `type="number"` and `type="tel"` cover the mobile keyboard cases
  M1 has, and the prop is a one-line addition when something needs it.
