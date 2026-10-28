# Principles

Nine rules the packages hold to, each with the reason it exists. A rule without
its reason gets argued away the first time it is inconvenient, so the reasons
are the important half.

## 1. Styling goes through the contract

No component hard-codes a colour, radius, duration, or space step. A component
with something to retheme declares its own `--ui-*` tokens beside itself,
defaulting to a primitive; one styled from structural keywords and primitives
alone declares none. A skin is a set of token values.

**Why.** The alternative was tried. When brand decisions live inside
components — say `Button`'s primary tone is an amber gradient with an inset
white highlight and a `brightness(1.06)` hover — token names are the contract,
but the styling *recipe* is not, so a second app wanting a different button has
to fork the component. Fork it and you now maintain two
implementations of the same markup, ARIA, and behaviour, and they drift in ways
no typecheck catches.

See [design-system.md](design-system.md) for the mechanism.

## 2. Native first, then `@remix-run/ui`, then hand-written

Use `<dialog>`, `<details>`, `popover`, `command`/`commandfor` and native form
controls where they cover the need. Reach for `@remix-run/ui/*` primitives when the
need exceeds the platform, layered over the native element. Write DOM code only
when neither does.

**Why.** Code the browser vendors own is tested by the browser vendors. Focus
trapping, top layer, light dismiss, Esc-to-close, and the accessibility tree
are all solved problems with sharp edges, and a hand-written version of any of
them is a liability you maintain forever. This also collapses the amount of
client JavaScript to six behaviours for the entire library.

## 3. A page works before client JavaScript

Stated precisely, because it differs by mode: in server mode a page is usable
before and without any client JavaScript; in SPA mode the same components need
no client code beyond the router.

**Why.** This is a consequence of principle 2 rather than a separate cost. We
are not hand-writing a fallback per component — the platform provides the behaviour, so the no-JS path is what you get for
free. That is what makes the principle affordable enough to keep.

## 4. SPA safety is enforced, not trusted

`ui-design`, `ui-remix` and `ui-remix-mini` must not import `node:*`, `bun`,
`effect`, or any server-side `remix/*` entry. `test/boundaries.test.ts` checks
it.

**Why.** "Also works in SPA mode" is the kind of claim that is true when
written and false three commits later. One server-only import anywhere in the
tree breaks it, and nothing surfaces the breakage until someone tries. A test
turns it into a property the build checks.

## 5. One delegated, capturing listener

Behaviours use custom commands in the `--` namespace, read by a single
`command` listener on `document`, registered in the **capture** phase.

**Why.** Two separate traps. `CommandEvent` does not bubble, so a listener
attached the ordinary way never fires — but capture descends window → target,
so it still reaches. And the listener must be delegated from `document`,
because querying elements and binding to them kills the behaviour on the first
frame navigation.

See [interactivity.md](interactivity.md).

## 6. Never hand-write an id that can fail silently

A mismatched `commandfor` produces no error, no event, and no console warning —
just a dead click. Use the `overlay()` factory so a trigger and its target
cannot drift apart.

**Why.** Silent failure is worse than a thrown exception. A typo that raises
gets fixed in a minute; a typo that does nothing gets shipped and then gets
reported months later as "the button doesn't work sometimes".

## 7. No build step

Packages ship TypeScript from `src/`. Browser assets are the Remix asset
server's job, configured in `remix.json`. Do not add a bundler.

**Why.** There is nothing for one to do. A package that ships
`main: "./src/index.ts"` is consumed directly; `@remix-run/assets` already
compiles browser scripts and styles on demand, generates preloads from imports,
and handles fingerprinting, ETags, sourcemaps and HMR. A second bundler would
mean two compilers in one repo, `remix.json` no longer the single source of
asset config, and `remix doctor` blind to half the build.

## 8. The shipped package has no Effect dependency

`remix` is its only peer dependency. The proof kit in `proof/` follows
`@lemol/proof`'s exact `effect` pin, but it is a private, dev-only workspace
member, so nothing a consumer installs carries it.

**Why.** Every other lemol repo pins `effect` to an exact version and must
change it in lockstep with the others. These are presentation packages that do
not need it, so staying out of that constraint costs nothing and buys the
freedom to version independently. The proof kit cannot stay out — its helper
peers on `effect` — so it lives where the constraint stops at the repository:
`test/git-consumer.test.ts` installs the package by git and checks that no
`effect` follows it.

## 9. Themes are data; components are not forked

An application defines its look as a theme plus `--ui-*` overrides, and takes
`mix` for genuinely structural one-offs. It does not copy a component to change
how it looks.

**Why.** This is principle 1 stated from the consumer's side, and it is the
test of whether principle 1 is working. The day an app forks a component to
restyle it, the contract has a gap — fix the gap rather than accepting the
fork.
