# @lemol/ui/mini

One concrete design built on the `design` and `remix` layers: a theme,
plus the composed pieces an app cannot avoid writing — `Document`, `AppShell`,
`Nav`, `EmptyState`, `ErrorState`.

The wiring is the part worth sharing, not the components: the boot script before
the stylesheet, the runtime imported from its own subpath so the barrel does not
drag the component library into the browser bundle, and `run()` resolving
`clientEntry` through the asset server. Getting that order wrong is a flash of
unstyled content or a dead bundle, and it is the same every time.

## Entry points

| Import | Holds |
| --- | --- |
| `@lemol/ui/mini` | The theme (base, dark, compact), `AppShell`, `Nav`, `EmptyState`, `ErrorState`. |
| `@lemol/ui/mini/document` | `Document`. |

Two, and the split is the same argument the runtime's subpath makes in
`remix`. `<html>` exists only on the server — an SPA has an `index.html`
carrying the same boot script — and `Document` is the one file here that
imports `remix/component/server`. In the barrel it would follow `miniTheme` into every
browser bundle, because these packages ship unbundled source and the asset
server compiles a module graph rather than tree-shaking it.

```tsx
import { AppShell, EmptyState, miniTheme, Nav } from "@lemol/ui/mini"
import { Document } from "@lemol/ui/mini/document"

<Document
  entry={await assetServer.getScriptEntry(browserEntry)}
  site="todo-md"
  title="Tasks"
>
  <AppShell brand="todo-md" brandHref="/" nav={<Nav items={items} />}>
    <EmptyState title="No tasks yet" />
  </AppShell>
</Document>
```

`Document` takes the resolved script entry rather than the asset server:
`remix/assets` is a server module this layer may not name, so the prop is typed
structurally and a real `ScriptEntry` satisfies it.

## Limits

- **It does not re-export `@lemol/ui/remix`.** A barrel would need syncing with
  every new export, and it would hide which layer a component came from — which
  is exactly what matters on the day an app swaps in its own design. Import
  components from `@lemol/ui/remix` directly — which is also why the package
  publishes no `.` barrel over the three layers.
- **It is a reference implementation, not a floor.** An app can skip this
  subpath entirely and supply its own theme and shell on top of the other two;
  that is the supported path, not a workaround.
- **It adds no component tokens of its own.** A design here is a set of values
  for the contract `@lemol/ui/remix` already declares. If something cannot be
  expressed that way, the missing token belongs in the component, not here.
  The shell components follow the same rule from the other side: they declare
  no `--ui-*` tier, because there is no layer above this one to retheme them
  from. They read the theme's primitives directly, and a different look is a
  different theme.
- **Write every `ui-*` override as a literal key in the `defineTheme` call.**
  Excess property checking only fires on object literals, so an override moved
  behind a spread or a referenced object is not checked at all — and the rename
  check then passes on a token name that no longer exists, surfacing as an
  unstyled control instead of a compiler error. `theme.test.ts` pins this with a
  `@ts-expect-error` whose directive goes unused the day it stops working.
- **No build step, and `remix` is the only peer.**

## Reading

[architecture.md](../../docs/architecture.md) for where this layer sits,
[design-system.md](../../docs/design-system.md#themes-and-variants) for how a
theme composes.

## The document's four steps

`Document` exists for the order of its `<head>`, and each step is a failure
that has already happened somewhere:

1. `<meta charset>` first — the spec honours it only in the first 1024 bytes,
   and the token sheet is kilobytes long.
2. The boot script before the sheet, so the scheme selectors are evaluated once
   against the final attributes rather than after a visible correction.
3. `ThemeStyle` before remix's own styles, which are spliced in immediately
   before `</head>`, so `@layer rmx-reset, base, rmx;` registers `base` at the
   front of the order.
4. The import map before the module script, and the preloads before both.

`boot` is a separate switch from `entry`: the boot script restores a choice the
user already made and is not an enhancement, so a page dropping its browser
entry normally keeps it. Turning it off is for the one page asserting it
carries no script element at all. An axis the document rendered itself —
`scheme="dark"` from a query param — beats the remembered one; the boot script
only fills in what the document left blank. Those blank axes are also named in
`data-rmx-preserve-attrs` on `<html>`, so a toggled scheme or density survives a
client-side navigation; the playground's switchers load a fresh document
(`data-rmx-document`) because switching back to *system* or *default* renders a
blank axis, which would otherwise keep the previous value.

## Limits of the shell

`AppShell` gives every band the same measure, because the header lining up with
the content is most of what makes a page look composed. A page of full-bleed
bands therefore does not use it — it writes its own layout on the same
primitives, which is the supported path rather than a workaround.

## Status

`miniTheme` ships: ninety-six primitives, a `dark` axis and the four-token
`compact` swap. Warm-grey neutrals, a deep teal accent, and a focus hue
deliberately unlike the accent so the ring reads on an accent-filled button.

The shell ships: `Document`, `AppShell` with its skip link and three
landmarks, `Nav` — the first consumer of `accent-subtle` and `accent-border` —
and the `EmptyState` / `ErrorState` pair. No client JavaScript in any of them:
the current page is something the server already knows, and `aria-current`
carries it.
