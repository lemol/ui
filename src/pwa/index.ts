/**
 * `@lemol/ui/pwa`: what makes a web app one a phone installs, as strings and
 * bytes a host serves: the manifest, its PNG icons, a service worker that
 * keeps the app's chrome and none of its data, and the page that worker
 * answers with when the network cannot be reached.
 *
 * Plain functions with no imports, so any server or build can call them;
 * where and how the files are served is the host's.
 */
export {
  type ManifestIcon,
  type ManifestShortcut,
  webManifest,
  type WebManifestOptions,
} from "./manifest.ts"
export { type OfflineColors, offlinePage, type OfflinePageOptions } from "./offline.ts"
export { crc32, type Deflate, encodePng, storedDeflate } from "./png.ts"
export { fingerprintedAsset, serviceWorker, type ServiceWorkerOptions } from "./worker.ts"
