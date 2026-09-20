---
title: "Toaster: --dismiss-toast timing over Popover"
tags: [ui-remix]
depends_on: [21]
group: M2 — Catalogue
completed_at: 2026-09-20T12:04:43Z
outcome: completed
---
The one component in M2 needing a real runtime command: dismissal timing.
Dismissal itself stays native (`command="close"`) — only the auto-dismiss
timer is hand-written JS.

## Scope

- `src/remix/toaster/` — `toaster.tsx` (`Toaster` region, `Toast`), built on
  a native `popover` from [[01-popover]] (top layer, so a toast floats above
  page content with no z-index management).
- `--dismiss-toast` registered in `src/remix/runtime.ts` via
  `registerCommand`: starts a timer on mount-equivalent (element connection),
  calls the native `close` invocation when it fires. Extract the timing logic
  as a pure function (`scheduleDismiss(ms, onFire) -> cancel`) and test it
  directly rather than through the DOM.
- `ui-toast-*` tokens per tone (success/warning/danger/info/neutral),
  following Badge's `<tone>` on `<tone>-subtle` pattern from
  `docs/design-system.md`.
- Motion: entry/exit via `@starting-style` + `allow-discrete`, matching
  `Dialog`'s pattern; note the Safari-exit-animation gap from the spec
  rather than working around it with JS.
- Register in `src/remix/demos.ts`.

## Done when

- A toast auto-dismisses after its timer without any DOM polling
  (`MutationObserver`-free), verified by a browser test — this is one of the
  six runtime behaviours.
- `/c/toaster` renders a toast with the runtime absent (it just doesn't
  auto-dismiss, which is the acceptable native-first degradation).

## Comments

### @lemol at 2026-09-20 12:04:42 +00:00

Important finding: a component module's own top-level registerCommand() call never runs in the browser — the document entry (apps/playground/app/actions/public/entry.ts) imports only runtime.ts and compat.ts, never component modules for their own sake. Discovered via a browser test where the CommandEvent fired but no handler ran. Fixed by moving the --dismiss-toast handler into runtime.ts itself, importing only the pure scheduleDismiss() and a shared attribute-name constant from toaster/ (both JSX-free). This is the pattern every future M2 command (--copy, --set-scheme, --toggle-density, --live-submit, --palette) must follow: register in runtime.ts, not in the component file.
