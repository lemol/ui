/**
 * The `command`/`commandfor` pair, as a value only this package can make.
 *
 * A mismatched or unsupported `commandfor` produces no error, no event and no
 * console warning — a dead click. Every other guard against that is a
 * convention someone has to remember; this one is the type checker. The brand
 * is a `declare`d symbol, so it exists at compile time and not at runtime, and
 * there is no expression outside this module that produces a value the type
 * accepts.
 *
 * Two limits worth naming. It protects components in this package, not a
 * consumer's own `<button command=… commandfor=…>`, which nothing here can
 * see. And it is compile-time only, so a JavaScript consumer gets nothing from
 * it.
 */
declare const invocationBrand: unique symbol

export interface Invocation {
  readonly [invocationBrand]: true
  readonly command: string
  readonly commandfor: string
}

/**
 * Internal. `src/remix/index.ts` publishes the type and never this function,
 * so a consumer reaches an `Invocation` through `overlay()` or not at all.
 */
export function invoke(command: string, commandfor: string): Invocation {
  return { command, commandfor } as unknown as Invocation
}
