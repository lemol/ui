/**
 * The whole of `--live-submit`'s timing logic, pure and DOM-free — same
 * reasoning as `toaster/dismiss-timer.ts`'s `scheduleDismiss`.
 *
 * Unlike a one-shot timer, this one is meant to be triggered repeatedly: each
 * call to `trigger()` restarts the delay, so `fn` only ever runs once typing
 * has paused for `ms` — the debounce a filter bar needs, not a delay before
 * the first change fires.
 */
export interface Debounced {
  trigger: () => void
  cancel: () => void
}

export function debounce(ms: number, fn: () => void): Debounced {
  let id: ReturnType<typeof setTimeout> | undefined

  const cancel = (): void => {
    if (id !== undefined) clearTimeout(id)
    id = undefined
  }

  const trigger = (): void => {
    cancel()
    id = setTimeout(fn, ms)
  }

  return { cancel, trigger }
}
