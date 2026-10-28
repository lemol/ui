import type { Scenario } from "@lemol/proof"
import { closeDialog, openComponentPage, openDialog, turnScriptsOff } from "../../kit.ts"

/**
 * A catalogue dialog opens and closes, with the scripts off first: what opens
 * it is the platform's own Invoker Commands, not a line of client code.
 */
export const dialogOpen: Scenario = {
  id: "dialog/open",
  actions: [openComponentPage("dialog"), turnScriptsOff, openDialog, closeDialog],
}
