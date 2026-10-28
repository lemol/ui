/**
 * The playground's proof kit: serve the catalogue and replay the scenarios over
 * it, writing @lemol/proof's manifest. Never a test — neither `bun test` nor
 * `bun run check` runs it.
 *
 * Run it against an existing empty directory, selecting by scenario id, one
 * per line. With no selection it replays every registered scenario:
 *
 *   PROOF_DIR="$PWD/proof-output" PROOF_SCENARIOS='dialog/open' bun proof/run.ts
 */
import { run } from "@lemol/proof"
import { launch } from "./kit/launch.ts"
import { scenarios } from "./scenarios.ts"

// Both are read here rather than left to the library: the pinned release
// predates its own `PROOF_DIR` and `PROOF_SCENARIOS` names, and an explicit
// option overrides whatever a later release reads.
const directory = process.env.PROOF_DIR
const selected = (process.env.PROOF_SCENARIOS ?? "")
  .split(/\r?\n/u)
  .map((id) => id.trim())
  .filter((id) => id !== "")

if (directory === undefined || directory === "") {
  throw new Error("PROOF_DIR must name an existing empty directory")
}

const result = await run({
  launch,
  scenarios,
  directory,
  scenarioIds: selected.length > 0 ? selected : scenarios.map((scenario) => scenario.id),
})

if (result.outcome === "skipped") console.error(result.reason)

process.exitCode = result.exitCode
