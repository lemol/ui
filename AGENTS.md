# AGENTS.md — @lemol/ui

UI packages shared by lemol projects: a renderer-agnostic design-token core, a
Remix 3 component library, and one concrete minimal design built on both.

## Read first

- [docs/superpowers/specs/2026-09-17-lemol-ui-architecture-design.md](docs/superpowers/specs/2026-09-17-lemol-ui-architecture-design.md)
  is the architecture and the reasons for it.
- Each `packages/<name>/README.md` covers that package's contents and limits.

## Layout

```
packages/
  ui-design/       @lemol/ui-design      token schema, themes, CSS emission
  ui-remix/        @lemol/ui-remix       components + their own token contracts
  ui-remix-mini/   @lemol/ui-remix-mini  one concrete design: theme + app shell
apps/
  playground/      catalogue, page recipes, theme and no-JS switches
```

## Commands

```sh
bun install
bun run check         # lint + typecheck + test: the gate for every change
bun test
bun run fix
bun run playground    # the catalogue
```

## Rules

- **Styling goes through the contract.** No component hard-codes a colour,
  radius, duration, or space step. Each component declares its own `--ui-*`
  tokens beside itself, defaulting to a primitive (`var(--accent)`). A skin is a
  set of token values, never a forked component.
- **Native first, then `remix/ui`, then hand-written.** Use `<dialog>`,
  `<details>`, `popover`, `command`/`commandfor` and native form controls where
  they cover the need. Reach for `remix/ui/*` primitives when the need exceeds
  the platform, layered over the native element. Write DOM code only when
  neither does.
- **SPA-safe.** `ui-design`, `ui-remix` and `ui-remix-mini` must not import
  `node:*`, `bun`, `effect`, or any server-side `remix/*` entry.
  `test/boundaries.test.ts` enforces it, so the same components run under
  `remix/spa` as a checked property rather than a claim.
- **One delegated listener.** Behaviours use custom commands
  (`command="--copy"`) read by a single `command` listener on `document`.
  `CommandEvent` does not bubble, so that listener **must be capturing**; and it
  must be delegated, or the behaviour dies on the first frame navigation.
- **Never hand-write a `commandfor` id.** A mismatched id fails silently — no
  error, no event, a dead click. Use the `overlay()` factory so a trigger and
  its target cannot drift apart.
- **Cascade layers.** The emitted theme stylesheet opens with
  `@layer base, rmx;` and puts element defaults in `@layer base`. Unlayered CSS
  beats layered CSS regardless
  of specificity, so a global `a { text-decoration: underline }` would override
  a component's own rule. Reach for unlayered only when a rule must beat a
  component, and say why in a comment.
- **No build step.** Packages ship TypeScript from `src/`. Browser assets are
  the Remix asset server's job, configured in `remix.json`. Do not add a
  bundler.
- **No Effect.** These are presentation packages and `remix` is the only peer
  dependency. That keeps `ui` out of the workspace's exact-`effect` lockstep.
- **Tests** use `bun:test`. Every component gets a server-render test. Browser
  tests cover only the runtime behaviours, because a DOM shim would test the
  shim.
- **Docs** stay short and local. Package specifics go in that package's README,
  not here.

## Browser baseline

Chrome 114+ / Safari 17+ / Firefox 125+ — the Popover API floor. Newer platform
features get cheap treatment rather than a lower floor: Invoker Commands through
`@lemol/ui-remix/compat`, CSS anchor positioning behind `@supports`. Going below
this floor means reimplementing top layer and light dismiss; don't.

Apps built here are shared with browsers we do not control, so a dead click on
an older engine is a real failure, not a theoretical one.
