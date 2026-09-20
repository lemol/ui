---
title: "LiveForm: --live-submit debounced auto-submit"
tags: [ui-remix]
group: M2 — Catalogue
completed_at: 2026-09-20T16:17:30Z
outcome: completed
---
A form that resubmits itself as its fields change, debounced — the pattern
todo-md's filter bars need.

## Scope

- `src/remix/live-form/` — `live-form.tsx`: a thin wrapper around a plain
  `<form>` that opts fields into `--live-submit` via `command`/`commandfor`
  pointed at the form itself (or a data attribute the runtime reads — pick
  whichever keeps the invocation typed through `invocation.ts` rather than a
  hand-written string).
- `--live-submit` registered in `src/remix/runtime.ts`: debounces (extract
  `debounce(ms, fn) -> cancel` as a pure function, tested directly) then calls
  `form.requestSubmit()`.
- With the runtime absent, the form still submits normally on its native
  submit button — `LiveForm` only removes the need to click it.
- `live-form.test.tsx` (server-render) plus `live-form.demo.tsx` showing a
  filter bar over the `Table` demo's data.
- Register in `src/remix/demos.ts`.

## Done when

- `debounce` has a unit test independent of the DOM (fake timers).
- A field change resubmits the form after the debounce window, verified by a
  browser test.
- The form is a fully working plain `<form>` with the runtime absent.

## Comments

### @lemol at 2026-09-20 16:12:05 +00:00

Important: runtime.ts now has an input-bridge (onInput, delegated+capturing on document, installed by installCommandRuntime alongside the command listener) added while building CommandPalette (#30). It's for command/commandfor on non-button elements (like <input>), which have no native Invoker Commands meaning — the bridge constructs the same synthetic 'command' Event compat.ts's click path does and dispatches it at the commandfor target, so the SAME onCommand/handlers map still does the actual dispatch. Use attrs({ command: '--live-submit', commandfor: id }) via the mix prop to set these on an <input>, not JSX props directly — remix/ui's typed input props don't include command/commandfor (that's button-only in the spec). See runtime.ts's module doc comment and src/remix/command-palette/command-palette.tsx's CommandPaletteInput for the exact pattern to copy.
