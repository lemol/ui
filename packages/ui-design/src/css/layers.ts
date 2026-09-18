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
 */
export const layerStatement = "@layer base, rmx;"

/** Wraps already-indented rules in the `base` layer. */
export function base(rules: string): string {
  return `@layer base {\n${rules}\n}`
}
