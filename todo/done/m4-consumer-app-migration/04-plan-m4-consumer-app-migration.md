---
title: 'Plan M4: consumer app migration'
tags: [planning]
depends_on: [3]
group: M4 — Consumer app migration
completed_at: 2026-09-20T16:53:15Z
outcome: cancelled
cancelled_reason: Moving this plan into the app's own repository, since the migration work belongs
  there.
---
Plan a consumer app's migration onto the UI packages. Deferred until things are nice here; the app's own design package stays untouched until then, and this gets its own spec.

Known constraints for when the time comes:

- The app's look becomes a theme plus `--ui-*` overrides. The values are expressible — even a `Button` primary that is an amber gradient with an inset white highlight and a `brightness(1.06)` hover fits in token values rather than a forked component.
- A dark-only app's theme declares no `dark` key.
- An asset target below the Popover API floor must be raised first.
- The app's design package can become a thin re-export shim over `@lemol/ui-remix` plus its own theme, so the app changes little.

Reference: `docs/superpowers/specs/2026-09-17-lemol-ui-architecture-design.md`.
