import { css as remixCss } from "remix/component"

type Styles = Parameters<typeof remixCss>[0]

/**
 * The library's `css`: remix's mixin, also recording each style a component
 * declares at module scope, so a host can carry them in a stylesheet the
 * browser keeps instead of every page inlining them (`componentStyles`).
 *
 * Recording runs on the server only, and only while the library's modules
 * evaluate: it stops at the first timer after this module loads. A style
 * built during a render, on a server that runs for days, is never kept.
 */
const declared: Array<Styles> = []
let recording = typeof document === "undefined"

if (recording) {
  setTimeout(() => {
    recording = false
  }, 0)
}

export const css: typeof remixCss = (...args) => {
  if (recording) declared.push(args[0])

  return remixCss(...args)
}

/**
 * Every style the library's components declared at module scope, in the order
 * they were declared. Rendered through remix's `css` they produce the same
 * classes the components do, so a host's own sheet can hold them and drop the
 * inline copies from its pages.
 */
export const componentStyles = (): ReadonlyArray<Styles> => declared
