# motion

Shared keyframes (`motion.ts`) and minted view-transition names (`names.ts`).

- **Keyframes are shared because sharing them is safe.** A body names no token,
  so one `@keyframes ui-motion-<name>` serves every consumer. Each component
  times it with its own duration and easing tokens (defaulting to `--dur-*` and
  `--ease-*`), which reduced motion zeroes through the reset.
- **Names are minted in `names.ts` because sharing a name throws.** Two elements
  with one `view-transition-name` abort a transition, so `viewTransitionName`
  refuses what it cannot keep unique or valid.
- `no-literals.test.tsx` renders every component the system touches and fails on
  a literal duration or curve.
