import type { RemixNode } from "remix/component"
import { renderToString } from "remix/component/server"

/**
 * The server-render harness every component test copies.
 *
 * `remix/component/server` is inside the SPA import allow-list, so a component test
 * reaches for neither the router, nor the asset server, nor a DOM shim — which
 * is the point: a test that needed any of those would be testing the app, and a
 * test that needed a shim would be testing the shim.
 *
 * Styles a component declares with `css()` are collected during the render and
 * emitted as one `<style>` element per distinct `css()` block, in the same
 * string as the markup — so a test reads both out of one return value, and
 * `test/styles.ts` is what pulls the blocks apart when which block matters.
 *
 * Two things this deliberately cannot do, both of which belong to the app:
 * resolve a `clientEntry()` to a browser module (`renderToString` takes no
 * options, so an entry renders its markup and its hydration markers without a
 * URL), and resolve a `<Frame>`. Tests for either drive a router instead — see
 * `apps/playground/app/router.test.tsx`.
 */
export function renderToHtml(node: RemixNode): Promise<string> {
  return renderToString(node)
}
