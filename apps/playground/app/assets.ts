import * as path from "node:path"
import { fileURLToPath } from "node:url"
import { createAssetServer } from "remix/assets"
import { loadConfig } from "remix/cli"

const config = await loadConfig(path.resolve(import.meta.dirname, ".."))
if (config.assets === undefined) {
  throw new Error("apps/playground/remix.json is missing its `assets` block")
}

/** Development gets a file watcher and sourcemaps; anything else — including a
 * server started with no `NODE_ENV` — gets immutable fingerprinted URLs. */
const isDevelopment = process.env.NODE_ENV === "development"
const isTest = process.env.NODE_ENV === "test"
const isProduction = !isDevelopment && !isTest

// Bun keeps a store under this repository's own `node_modules` and symlinks each
// package into its consumer's `node_modules`, so the files behind `remix`
// resolve outside this app's rootDir. Mount the store: an allow-list cannot
// reach files that no mount covers. Derived rather than written down, because
// the store sits at a different depth when this app is installed alone than
// when a parent workspace hoists it.
const remixDir = path.dirname(fileURLToPath(import.meta.resolve("remix/package.json")))
const bunStoreDir = path.resolve(remixDir, "../../..")

// `@lemol/ui` is a `file:` dependency pointing at this repository's root, and
// where that lands is Bun's business, not ours: 1.4 hardlinks a path
// dependency into the store, so `@lemol/ui/remix` resolves *inside* the Bun
// store on a fresh install, while a linked checkout resolves to `repos/ui/src`
// outside every other mount. Both layouts are live, and neither is a broken
// install, so the paths are derived per boot rather than written down.
//
// Mount `src` and never the package root: mounts may not overlap, and the root
// contains this app. Inside the store there is nothing to mount at all — the
// `npm` mount already covers it, and a second mount under it is a thrown
// TypeError at boot rather than a warning.
const uiRemixDir = path.dirname(fileURLToPath(import.meta.resolve("@lemol/ui/remix")))
const uiDir = path.resolve(uiRemixDir, "..")
const uiIsInStore = uiDir.startsWith(`${bunStoreDir}${path.sep}`)
const uiPath = path.relative(config.assets.rootDir, uiDir)

export const assetServer = createAssetServer({
  ...config.assets,
  // remix.json admits `../../src/**`, which is the package's source as a
  // linked checkout sees it. Admit wherever it actually resolved as well —
  // still by path and never by adding `@lemol/ui` to `allowPackages`, which
  // would admit every file under the package root, this app's own controllers
  // and router included. `remix assets` and `remix doctor` read the JSON
  // alone, so they see the linked layout only; that is the layout they are
  // used in, and the server is the half that has to be right either way.
  allowFiles: [...new Set([...(config.assets.allowFiles ?? []), `${uiPath}/**`])],
  mounts: {
    app: "app",
    npm: path.relative(config.assets.rootDir, bunStoreDir),
    ...(uiIsInStore ? {} : { ui: uiPath }),
  },
  // The browser baseline from AGENTS.md, so the playground compiles for the
  // same engines the packages claim to support.
  target: { es: "2022", chrome: "114", safari: "17", firefox: "125" },
  ...(isDevelopment ? { sourceMaps: "external" as const } : {}),
  minify: isProduction,
  fingerprint: isProduction,
  watch: isDevelopment,
})
