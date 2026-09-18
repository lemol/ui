# @lemol/ui-remix-mini

One concrete design built on `@lemol/ui-design` and `@lemol/ui-remix`: a theme,
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
| `@lemol/ui-remix-mini` | The theme (base, dark, compact) and the shell components. |

One subpath, deliberately.

## Limits

- **It does not re-export `@lemol/ui-remix`.** A barrel would need syncing with
  every new export, and it would hide which layer a component came from — which
  is exactly what matters on the day an app swaps in its own design. Import
  components from `@lemol/ui-remix` directly.
- **It is a reference implementation, not a floor.** An app can skip this
  package entirely and supply its own theme and shell on top of the other two;
  that is the supported path, not a workaround.
- **It adds no component tokens of its own.** A design here is a set of values
  for the contract `@lemol/ui-remix` already declares. If something cannot be
  expressed that way, the missing token belongs in the component, not here.
- **No build step, and `remix` is the only peer.**

## Reading

[architecture.md](../../docs/architecture.md) for where this package sits,
[design-system.md](../../docs/design-system.md#themes-and-variants) for how a
theme composes.

## Status

Scaffold. `src/` holds stubs; the theme and the shell land with M1 task 18.
