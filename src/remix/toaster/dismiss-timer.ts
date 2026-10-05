/**
 * The whole of `--dismiss-toast`'s timing logic, pure and DOM-free — the
 * palette's match rule is the model the M2 plan names for this: extract real
 * logic as a pure function and test it directly rather than through the DOM.
 *
 * Returns a cancel function so a toast retriggered before its first timer
 * fires does not end up with two pending dismissals racing each other.
 */
export function scheduleDismiss(ms: number, onFire: () => void): () => void {
  const id = setTimeout(onFire, ms)

  return () => clearTimeout(id)
}
