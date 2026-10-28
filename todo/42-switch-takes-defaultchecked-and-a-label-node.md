---
title: Switch takes defaultChecked and a label node
tags: [ui-remix]
---
**Why.** `Switch` (`src/remix/switch/switch.tsx`) has the two gaps `Checkbox` had before 0fa13bc. First, `checked` is its only way to start on, and that prop is controlled: in a hydrated component the runtime puts it back after every click. So a form that holds the choice itself (it reads the switch from the DOM or posts it natively) cannot start a switch on. Second, `label: string` cannot carry wording that changes with the viewport, such as words a consumer hides on a narrow screen (`Interrupt<span mix={srOnlyOnPhone}> current work</span>`). A consumer that needs either draws a raw `<input type="checkbox">` beside the kit, which is what the switch exists to prevent.

xonton:275 waits on this: its composer's *Interrupt* becomes this `Switch` once the label is a node. Filed by hand from loop 01M5XTT4XR8W73SVWHZX75DN88 (xonton:L19), whose two filings of it were refused while ui had no nzila gate (runs 01M5ZQ0TM78V9SYV9B7CVMYAJ6 and 01M5ZS5Z9843SY59DMW4D6WE2H).

**Decisions (settled).**
- `defaultChecked` is to `checked` what it is on `Checkbox` since 0fa13bc, and goes through `givenProps({ checked, defaultChecked, value })` the same way.
- `aria-checked` mirrors `checked` only when `checked` is given. Otherwise, with `defaultChecked` or without it, it is omitted, so the accessibility tree reads the native checked state, which follows the person's clicks. An `aria-checked` fixed at render would go stale on the first click. Update the doc comment above `trackStyle`, which calls the mirror belt-and-braces.
- `label` becomes `RemixNode`, still required and still rendered inside `<label for={stem}>`, as `tabs` and `facet-filter` already type theirs. A string still works.
- `Checkbox` and `Radio` keep `label: string`.

**What to build.**
- `SwitchProps.defaultChecked?: boolean | undefined`, with a doc comment. The comment on `checked` says it is controlled, as `Checkbox`'s does.
- `SwitchProps.label: RemixNode`.
- `src/remix/README.md`, section "`Checkbox`, `Radio` and `Switch`": the paragraph on `Checkbox`'s `checked` and `defaultChecked` covers `Switch` too, and says `Switch`'s label is a node.

**Tests first** (`src/remix/switch/switch.test.tsx`), for example:
```tsx
it("starts on from defaultChecked, leaving the switch to the person", async () => {
  const on = markupOf(await renderToHtml(<Switch defaultChecked label="Dark mode" name="dark-mode" />))
  const off = markupOf(await renderToHtml(<Switch label="Dark mode" name="dark-mode" />))

  expect(on).toMatch(/<input[^>]*\bchecked\b/)
  expect(on).not.toMatch(/aria-checked/)
  expect(off).not.toMatch(/<input[^>]*\bchecked\b/)
})

it("draws a label node inside its label", async () => {
  const markup = markupOf(
    await renderToHtml(
      <Switch label={<>Interrupt<span data-more=""> current work</span></>} name="urgent" />,
    ),
  )

  expect(markup).toMatch(/<label for="urgent"[^>]*>Interrupt<span data-more=""> current work<\/span><\/label>/)
})
```
A controlled `checked` still renders `aria-checked="true"`. The existing Switch tests still pass, including the token and disjoint-block checks.

**Done when.** `Switch` renders `checked` from `defaultChecked` and not otherwise, takes a node label, the README says both, and `bun run check` passes.

**Out of scope.** Switch's look and tokens; `Checkbox` and `Radio`.
