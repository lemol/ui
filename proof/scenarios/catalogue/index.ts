import type { Scenario } from "@lemol/proof"
import { openCatalogue } from "../../kit.ts"

/** The catalogue index renders inside mini's shell. */
export const catalogueIndex: Scenario = {
  id: "catalogue/index",
  actions: [openCatalogue],
}
