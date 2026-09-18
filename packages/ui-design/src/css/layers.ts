/**
 * The cascade-layer setup.
 *
 * remix/ui emits every css({...}) rule into the `rmx` layer, and unlayered CSS
 * beats layered CSS regardless of specificity — so an element default has to
 * sit in a layer ordered before `rmx`, or it overrides the components it is
 * supposed to lose to.
 *
 * Layer order is fixed by the first @layer statement the browser sees. If
 * remix's stylesheet is evaluated first, `rmx` already exists and this
 * statement appends `base` after it, inverting the order with no error. The
 * emitted sheet therefore has to reach the document before remix's styles do.
 *
 * `rmx-reset` is named here even though nothing emits into it yet. remix/ui
 * declares it (`REMIX_UI_RESET_LAYER`) but does not use it as of remix
 * 3.0.0-rc.2 — it is reserved for a future element reset, not shipped code.
 * Leave the name in anyway: if we wait for remix to start emitting into it
 * before naming it here, that emission would register `rmx-reset` on first
 * use, after this statement already fixed `base` and `rmx` — putting a
 * third-party reset ahead of both, silently, with no error to catch it. That
 * is the same inversion this file already exists to prevent, just triggered
 * by an upstream release instead of a stylesheet ordering mistake. Naming an
 * unused layer costs nothing; discovering the inversion after the fact costs
 * a debugging session.
 *
 * `rmx-reset` goes first, making it the weakest of the three: it is a
 * generic third-party reset, `base` holds our own token-wired element
 * defaults (`body { background: var(--canvas) }` and the rest of `resetCss`),
 * and those must beat a reset that knows nothing about our tokens. `rmx`
 * stays last — components must beat both resets. remix's own README
 * prescribes the two-layer `@layer base, rmx;` form, since it has no reason
 * to mention a layer it does not use; naming `rmx-reset` first is an addition
 * ahead of that statement, not a conflict with it.
 */
export const layerStatement = "@layer rmx-reset, base, rmx;"

/** Wraps already-indented rules in the `base` layer. */
export function base(rules: string): string {
  return `@layer base {\n${rules}\n}`
}
