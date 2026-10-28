import type { Scenario } from "@lemol/proof"
import { openCatalogue, switchScheme } from "../../kit.ts"

/** The scheme switch changes `data-scheme`, and the page shows it. */
export const schemeToggle: Scenario = {
  id: "scheme/toggle",
  actions: [openCatalogue, switchScheme],
}
