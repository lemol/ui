import { afterAll, beforeAll, expect, test } from "bun:test"
import { execFileSync, spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

/**
 * The reason this repository is one package: a Bun git dependency always
 * installs a repository's *root* package, and the specifier has no subdirectory
 * form. So this is the only test that can prove the shipping shape — every
 * other test imports the source by a relative path and would stay green under a
 * layout no consumer can install.
 *
 * It clones the committed tree, so it tests HEAD and not the working copy.
 * A restructure that has not been committed yet will show up here as a failure
 * in the previous layout.
 */

const root = mkdtempSync(join(tmpdir(), "ui-git-consumer-"))
const remote = join(root, "remote.git")

const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, stdio: "pipe" })

beforeAll(() => {
  const tagged = join(root, "tagged")

  git(root, "clone", "--local", process.cwd(), tagged)
  git(tagged, "tag", "-f", "ui@0.1.0")
  git(root, "clone", "--bare", tagged, remote)
})

afterAll(() => rmSync(root, { recursive: true, force: true }))

test("installs from Git, then renders a component and emits a theme", () => {
  const consumer = join(root, "consumer")

  mkdirSync(consumer, { recursive: true })

  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify(
      {
        name: "ui-git-consumer",
        private: true,
        type: "module",
        dependencies: {
          "@lemol/ui": `git+file://${remote}#ui@0.1.0`,
          remix: "3.0.0",
        },
        scripts: { contract: "bun contract.tsx" },
      },
      null,
      2,
    ),
  )

  // The consumer supplies its own JSX configuration, exactly as an app would:
  // the package ships TypeScript and no build output, so nothing about the JSX
  // runtime can travel with it.
  writeFileSync(
    join(consumer, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          jsx: "react-jsx",
          jsxImportSource: "remix/component",
          module: "Preserve",
        },
      },
      null,
      2,
    ),
  )

  // A component off the renderer layer, a theme off the design layer, and the
  // emitter off the opt-in css subpath — the three things the three packages
  // used to be.
  writeFileSync(
    join(consumer, "contract.tsx"),
    [
      'import { emitTokensCss } from "@lemol/ui/design/css"',
      'import { miniTheme } from "@lemol/ui/mini"',
      'import { Button } from "@lemol/ui/remix"',
      'import { renderToString } from "remix/component/server"',
      "",
      "const html = await renderToString(<Button>Save</Button>)",
      "const css = emitTokensCss(miniTheme)",
      'console.log(html.includes("Save") ? "rendered" : "no markup")',
      'console.log(css.includes("--canvas:") ? "themed" : "no tokens")',
      "",
    ].join("\n"),
  )

  const install = spawnSync("bun", ["install"], { cwd: consumer, encoding: "utf8" })

  expect([install.status, install.stderr]).toEqual([0, install.stderr])

  const run = spawnSync("bun", ["run", "contract"], { cwd: consumer, encoding: "utf8" })

  expect([run.status, run.stderr]).toEqual([0, run.stderr])
  expect(run.stdout).toContain("rendered")
  expect(run.stdout).toContain("themed")

  // The tag is the ref a consumer pins, so the manifest has to keep naming it.
  expect(readFileSync(join(consumer, "package.json"), "utf8")).toContain("ui@0.1.0")
}, 120_000)
