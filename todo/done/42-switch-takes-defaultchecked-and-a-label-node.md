---
title: Switch takes defaultChecked and a label node
tags: [ui-remix]
completed_at: 2026-10-28T08:07:22Z
outcome: completed
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

## Comments

### @nzila at 2026-10-28 08:07:22 +00:00

Done: Implemented ui:42 in commit f20421e (feat(switch): support defaultChecked and node labels).

Switch now forwards checked/defaultChecked/value through givenProps, documents controlled versus initial state, and requires a RemixNode label inside its existing associated label. aria-checked is a string "true"/"false" only for controlled checked; omitted otherwise. README documents both controls' defaultChecked and Switch's node label. No styling/tokens or Checkbox/Radio implementation changes.

TDD evidence:
- First focused Switch run: 6 pass, 2 fail. New defaultChecked case lacked checked; strengthened controlled assertion exposed bare aria-checked rather than aria-checked="true". Both failures reported before fixing.
- After initialization/ARIA fix: Switch 8 pass.
- Node-label test then failed bun run typecheck with TS2322 (RemixElement not assignable to string); reported before widening label to RemixNode.

Final verification:
- bun test src/remix/switch/switch.test.tsx src/remix/form-control.test.ts src/remix/checkbox/checkbox.test.tsx test/styles.test.ts — 39 pass, 0 fail (repeated after formatting).
- bun run lint — exit 0.
- bun run typecheck — exit 0.
- git diff --check — clean; git status --short after commit — empty.

Dependency/test search: rg -n 'defaultChecked|aria-checked|Switch|givenProps' src/ test/ --glob '*test*'; rg --files test/ src/ | rg '(render|styles|form-control).*test\.'. Results identified Switch tests, Checkbox regression tests, form-control tests, and styles harness tests, all run. Facet-filter ARIA matches use independent link rendering and were not changed.
Pattern checks: rg -n 'RemixNode|label:' src/remix/tabs/tabs.tsx src/remix/facet-filter/facet-filter.tsx showed existing RemixNode label declarations. Read src/remix/checkbox/checkbox.tsx and src/remix/form-control.ts to confirm the identical givenProps forwarding pattern and undefined-only filtering; focused form-control and Checkbox tests pass.

No proof scenarios changed. Full gate and proof replay left to check as noted in gaps.

Review: approved (5/5)
Approved. Reviewed the whole diff 99795602...f20421e: src/remix/switch/switch.tsx, src/remix/switch/switch.test.tsx and src/remix/README.md.

Decisions (none contradicted):
- defaultChecked goes through givenProps the same way as on Checkbox. In switch.tsx it is `{...givenProps({ checked, defaultChecked, value })}`, the same line as checkbox.tsx:93. givenProps (form-control.ts:30) drops only undefined values.
- aria-checked: `checked === undefined ? undefined : checked ? "true" : "false"`, so the mirror appears only when the switch is controlled. The trackStyle doc comment is rewritten; the "belt-and-braces" wording is gone. `rg -n belt-and-braces` finds it only in the todo/42 brief, and in base switch.tsx:17 via git show, which proves the search works.
- label is now `RemixNode`, still rendered inside `<label for={stem}>`. Checkbox and Radio keep `label: string` (checkbox.tsx:52, radio.tsx:52).

What to build:
- defaultChecked prop with a doc comment, and the checked comment now says controlled: done, in SwitchProps.
- label: RemixNode: done.
- README section "Checkbox, Radio and Switch": done. It covers both controls' checked/defaultChecked and Switch's node label, and the sentence about aria-checked being "mirrored" is updated.

Tests and Done when:
- defaultChecked renders checked and no aria-checked; the default renders no checked: pinned by "starts on from defaultChecked, leaving the switch to the person". Reversal in a scratch copy: removing defaultChecked from givenProps made this test fail (9 pass, 1 fail).
- A controlled checked still renders aria-checked="true": pinned by "checks and disables from plain props". Controlled false renders "false": pinned by "mirrors a controlled off state explicitly". Reversal: restoring the base's `aria-checked={checked === true}` failed both tests (8 pass, 2 fail).
- Node label inside the label: pinned by "draws a label node inside its label". Reversal: changing label back to string makes tsc fail with TS2322 at switch.test.tsx:95.
- Existing Switch, Checkbox and form-control tests: 27 pass, 0 fail (bun test on the 3 files).
- bun run check: discharged by the check stage, which ran check.command `bun run check` and passed on f20421e. The gate log says "Found 0 warnings and 0 errors."; lint has 0 warnings, and the base also had 0.

Comments: the task file todo/42-switch-takes-defaultchecked-and-a-label-node.md has no Comments section (grep for "Comments" and "^## " found nothing), and the brief lists no pre-start comments. There are 0 comments and no authors.

Implementer's gaps:
- bun run check not run locally: discharged by the check stage pass on f20421e.
- No proof replay: pushed back. prove.skipped reports "no scenarios", and this change is a server-rendered prop and type change with no surface the playground shows differently, so there were no screenshots to judge.

Gate divergence (@lemol/proof, effect, remix): I re-ran the touched tests myself from this worktree and they passed. The change does not depend on proof or effect.

Search for other copies: `rg -n Switch docs apps` finds only dated specs and plans that name Switch as a scheduled component. None states its label type, so there is no stale live copy. No new modules were created, and the tests stay colocated in switch.test.tsx.

Branch: nzila/01M60RH5C1SYNKSQ36NKCWSZGR

nzila run 01M60RH5C1SYNKSQ36NKCWSZGR
