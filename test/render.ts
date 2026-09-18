import type { RemixNode } from "remix/ui"
import { renderToString } from "remix/ui/server"

/**
 * The server-render harness every component test copies.
 *
 * `remix/ui/server` is inside the SPA import allow-list, so a component test
 * reaches for neither the router, nor the asset server, nor a DOM shim — which
 * is the point: a test that needed any of those would be testing the app, and a
 * test that needed a shim would be testing the shim.
 *
 * Styles a component declares with `css()` are collected during the render and
 * emitted as one `<style>` element, so assertions about a component's CSS read
 * the same string as assertions about its markup.
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
