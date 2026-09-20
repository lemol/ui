---
title: 'Plan M4: mionso migration'
tags: [planning]
depends_on: [3]
group: M4 — mionso migration
completed_at: 2026-09-20T16:53:15Z
outcome: cancelled
cancelled_reason: Moving this plan into the mionso repo itself, since the migration work belongs
  there.
---
Plan mionso's migration onto the UI packages. Deferred until things are nice here; `@mionso/design` stays untouched until then, and this gets its own spec.

Known constraints for when the time comes:

- Its *Vault & Obsidian* look becomes a theme plus `--ui-*` overrides. The values are expressible — `Button` primary is an amber gradient with an inset white highlight and a `brightness(1.06)` hover, all of which fit in token values rather than a forked component.
- It is dark-only, so its theme declares no `dark` key.
- Its asset target (es2020 / Chrome 109 / Safari 16.4) sits just below the Popover API floor and must be raised. That also retires its documented "no top-level `await`" constraint.
- `@mionso/design` can become a thin re-export shim over `@lemol/ui-remix` + a mionso theme, so `money-web` changes little.

Reference: `docs/superpowers/specs/2026-09-17-lemol-ui-architecture-design.md`, and mionso's own `packages/mionso-design/docs/`.
