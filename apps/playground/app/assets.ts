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

// Bun installs into one store at the composed workspace root and symlinks each
// package into its consumer's `node_modules`, so the files behind `remix`
// resolve outside this app's rootDir. Mount the store: an allow-list cannot
// reach files that no mount covers. Derived rather than written down, because
// the store sits at a different depth standalone than composed.
const remixDir = path.dirname(fileURLToPath(import.meta.resolve("remix/package.json")))
const bunStoreDir = path.resolve(remixDir, "../../..")

export const assetServer = createAssetServer({
  ...config.assets,
  mounts: { app: "app", npm: path.relative(config.assets.rootDir, bunStoreDir) },
  // The browser baseline from AGENTS.md, so the playground compiles for the
  // same engines the packages claim to support.
  target: { es: "2022", chrome: "114", safari: "17", firefox: "125" },
  ...(isDevelopment ? { sourceMaps: "external" as const } : {}),
  minify: isProduction,
  fingerprint: isProduction,
  watch: isDevelopment,
})
