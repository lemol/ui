---
title: Prove the playground with a proof kit
tags: [onboarding]
findings: [proof-exists, agent:proof-pins-effect]
---
**Why.** Readiness rule `proof-exists` (rules v2) is a Gap: ui ships Remix 3 components and has a Playwright browser kit, but nzila has no `prove` for it, so no run leaves a screenshot, a video or a manifest for its reviewer to check. ui already serves the playground's real router to Playwright in `test/browser/harness.ts`. A proof kit replays the same surface as named steps instead of assertions. See the `lemol:prove` skill and `@lemol/proof`'s README (tag `proof@0.1.0`).

**Settled decisions.**
- **Effect.** `@lemol/proof` peers on `effect` at exactly `4.0.0`, and principle 8 in `docs/principles.md` says there is no Effect dependency. The person decided this during onboarding (`agent:proof-pins-effect`, option 1). The kit is its own private workspace member, so the shipped `@lemol/ui` package and its git consumers stay free of Effect. Principle 8 narrows to "the shipped package has no Effect dependency", and the dev-only `proof/` member follows `@lemol/proof`'s `effect` pin.
- The kit is its own private workspace member at `proof/` (`@lemol/ui-proof`, the shape xonton uses for `@lemol/xonton-proof`). It depends on `@lemol/proof` by git tag `proof@0.1.0`, on `effect@4.0.0`, and on the `playwright` the root already installs. Add `proof` to the root `workspaces`. Leave the root's `dependencies`, `peerDependencies` and `exports` alone.
- The app under proof is the playground's own router (`createPlaygroundRouter()` from `apps/playground/app/router.ts`), served on an ephemeral port the same way `test/browser/harness.ts` serves it: the real document, the real asset pipeline, the real demos. There are no fixtures.
- The kit never runs as a test. Neither `bun test` nor `bun run check` reaches `proof/`. `bun proof/run.ts` runs it.
- The prove config is committed in `nzila.config.yaml` beside the gate the onboarding writes: `prove: { command: bun proof/run.ts, scenarios: proof/scenarios }`.

**What to build.**
- `proof/package.json`, `proof/kit.ts` (exports the actions), `proof/kit/launch.ts` (serves the playground router), `proof/run.ts` (calls `run` from `@lemol/proof`, reading `PROOF_DIR` and `PROOF_SCENARIOS` as xonton's `proof/run.ts` does) and `proof/scenarios.ts` (the registry).
- Actions, one per user-visible step, each with a one-line `expected`: open the catalogue index, open a component's catalogue page, open a dialog natively, switch the scheme, and turn scripts off.
- Three first scenarios, one file each under `proof/scenarios/`:
  - `catalogue/index`: the index renders inside mini's shell.
  - `dialog/open`: a catalogue dialog opens and closes.
  - `scheme/toggle`: the scheme switch changes `data-scheme` and the page shows it.
- `test/boundaries.test.ts` keeps `src/` free of `effect`. Extend it, or add a case, so that nothing under `src/` or `apps/` imports from `proof/`.
- `docs/architecture.md` gets a short "Proof" paragraph covering the layout, the command, and the fact that it is not a test. Update principle 8 to the settled wording.

**Tests first.**
- In `test/boundaries.test.ts`, a case fails if any file under `src/` or `apps/` imports `proof/` or `@lemol/proof`. Watch it fail on a planted import, then remove the plant.
- `test/git-consumer.test.ts` still installs `@lemol/ui` by git and finds no `effect` in the consumer's install. Add that assertion if it is missing.

**Done when.** `PROOF_DIR=<empty dir> bun proof/run.ts` replays all three scenarios against the playground and writes a `manifest.json` with one step per action. A git consumer of `@lemol/ui` installs no `effect`. `nzila.config.yaml` carries the `prove` block.

**Out of scope.** Pixel comparison or visual regression. Proving every catalogue entry: later tasks add scenarios through their `proves:`. Moving the existing `test/browser/` suite onto the kit.

onboard:01M60NRYYCCYMSZTHNTH4GM5NH:tasks/prove-the-playground-with-a-proof-kit.md

## Comments

### @nzila at 2026-10-28 07:39:35 +00:00

Abandoned by api: flow route unblock.abandon

nzila run 01M60PRPCGY69EJ77HJZMXHAE9
