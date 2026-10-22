/**
 * A content-addressed asset, the one thing a worker may keep: a file whose
 * name carries its content's fingerprint before its extension, as
 * `remix/assets` names one (`keyboard.@IpqnKx.tsx`, `index.@_RF6ZJ.ts`).
 */
export const fingerprintedAsset = /^\/assets\/.+\.@[\w-]+\.\w+$/

export interface ServiceWorkerOptions {
  /**
   * What names this worker: the cache it keeps is named by it, and a worker
   * activated under another version drops every other cache. A build's
   * version therefore lets a new build's worker clear the last one's assets.
   */
  readonly version: string
  /** The page a navigation answers with when the network cannot be reached, as HTML. */
  readonly offline: string
  /**
   * Which same-origin paths are kept after their first load, served from the
   * cache ever after; `false` keeps nothing, as a development server should,
   * where a rebuilt module would otherwise be served stale.
   */
  readonly keep?: RegExp | false | undefined
}

/**
 * A service worker's source. It keeps an app's chrome and none of its data:
 * a page always asks the network, and only a page the network could not be
 * reached for falls back to `offline`; a kept asset is served from the cache
 * once fetched; everything else passes through untouched, a stream included.
 * Serve it from the root with `Cache-Control: no-cache`, so a new build's
 * worker is found on the next load.
 */
export const serviceWorker = (options: ServiceWorkerOptions): string => {
  const keep = options.keep ?? fingerprintedAsset

  return `"use strict"
const version = ${JSON.stringify(options.version)}
const kept = ${keep === false ? "null" : `new RegExp(${JSON.stringify(keep.source)})`}
const offline = ${JSON.stringify(options.offline)}

self.addEventListener("install", () => self.skipWaiting())

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== version).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const request = event.request

  if (request.method !== "GET") return

  const url = new URL(request.url)

  if (url.origin !== self.location.origin) return

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        () => new Response(offline, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }),
      ),
    )

    return
  }

  if (kept !== null && kept.test(url.pathname)) {
    event.respondWith(
      caches.open(version).then(async (cache) => {
        const hit = await cache.match(request)

        if (hit) return hit

        const response = await fetch(request)

        if (response.ok) await cache.put(request, response.clone())

        return response
      }),
    )
  }
})
`
}
