# @lemol/ui/pwa

What makes a web app one a phone installs, as plain functions returning the
strings and bytes a host serves. No renderer and no runtime: any server or
build calls them, and where the files are served is the host's.

| Function | Returns |
| --- | --- |
| `webManifest(options)` | The manifest's JSON: name, start URL and scope, `standalone` by default, the splash and frame colours, icons (`any` or `maskable`), shortcuts. Serve as `application/manifest+json`, revalidated on every load. |
| `serviceWorker({ version, offline, keep })` | The worker's source. Every navigation goes to the network; one that fails is answered with `offline`. Assets matching `keep` (`fingerprintedAsset` by default) are served from a cache named `version` once fetched; `keep: false` keeps nothing, as a development server should. A new `version` activates a worker that drops every other cache. Serve from the root with `Cache-Control: no-cache`. |
| `offlinePage(options)` | The page `serviceWorker` answers a failed navigation with: a heading, a sentence and *try again*, in both schemes, padded for a phone's safe areas, reloading itself once the device is online. |
| `encodePng(width, height, rgba, deflate?)` | RGBA pixels as a PNG. A server passes its zlib's deflate (`deflateSync` from `node:zlib`); without one the pixels are stored uncompressed, which every decoder reads. |

A page links the manifest with `crossorigin="use-credentials"` when the app
sits behind a cookie, and registers the worker only in a secure context.
