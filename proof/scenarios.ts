import type { Scenario } from "@lemol/proof"
import { catalogueIndex } from "./scenarios/catalogue/index.ts"
import { dialogOpen } from "./scenarios/dialog/open.ts"
import { schemeToggle } from "./scenarios/scheme/toggle.ts"

/**
 * Every scenario the kit registers. An id is its file's path under
 * `scenarios/` without the extension; `run.ts` follows the selection's order.
 */
export const scenarios: readonly Scenario[] = [catalogueIndex, dialogOpen, schemeToggle]
