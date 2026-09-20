import { run } from "remix/spa"
import { installInvokerCommands } from "../../../../../src/remix/compat.ts"
import { installCommandRuntime } from "../../../../../src/remix/runtime.ts"
import { createSpaRouter, SpaFallback } from "./router.tsx"

/**
 * The SPA shell's browser entry: the twin of `app/actions/public/entry.ts`.
 * Same compat opt-in, same command runtime — a dialog opened from a
 * client-rendered demo must behave exactly like one opened from the server
 * catalogue — and then the SPA router instead of hydration. There is nothing
 * to hydrate: the server sent a shell, and the routed node replaces the
 * fallback on boot.
 */
if (new URLSearchParams(location.search).has("compat")) {
  installInvokerCommands({ force: true })
}

installCommandRuntime()

const app = run(createSpaRouter(), { fallback: <SpaFallback /> })

// Top-level `await` is avoided deliberately, for the reason the document
// entry gives: nothing should wait on the first route to finish.
void app.ready()
