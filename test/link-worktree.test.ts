import { afterAll, describe, expect, test } from "bun:test"
import { execFileSync, spawnSync } from "node:child_process"
import {
  copyFileSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

const repoRoot = resolve(import.meta.dir, "..")
const scriptSource = join(repoRoot, "proof", "link-worktree.ts")
const scratch = mkdtempSync(join(tmpdir(), "ui-link-worktree-"))

const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, stdio: "pipe" })

afterAll(() => rmSync(scratch, { recursive: true, force: true }))

describe("proof/link-worktree.ts", () => {
  test("mirrors proof/node_modules into a worktree link by link", () => {
    const main = join(scratch, "main")

    mkdirSync(main, { recursive: true })
    git(main, "init", "-b", "main")
    git(main, "config", "user.email", "test@example.com")
    git(main, "config", "user.name", "Test")

    writeFileSync(join(main, ".gitignore"), "node_modules/\n")
    mkdirSync(join(main, "proof"), { recursive: true })

    // Copy the script into the scratch repository so the worktree has it on checkout
    const scriptInMain = join(main, "proof", "link-worktree.ts")

    copyFileSync(scriptSource, scriptInMain)

    git(main, "add", ".")
    git(main, "commit", "-m", "initial")

    const targets = join(scratch, "targets")
    const plainTarget = join(targets, "plain")
    const scopedTarget = join(targets, "scoped")
    const binTarget = join(targets, "bin-tool")

    mkdirSync(plainTarget, { recursive: true })
    mkdirSync(scopedTarget, { recursive: true })
    writeFileSync(join(plainTarget, "index.js"), "export const plain = true\n")
    writeFileSync(join(plainTarget, "cli.js"), "#!/usr/bin/env node\nconsole.log(1)\n")
    writeFileSync(join(scopedTarget, "index.js"), "export const scoped = true\n")
    writeFileSync(binTarget, "#!/usr/bin/env node\nconsole.log(1)\n")

    const mainModules = join(main, "proof", "node_modules")

    mkdirSync(join(mainModules, "@scope"), { recursive: true })
    mkdirSync(join(mainModules, ".bin"), { recursive: true })
    symlinkSync(plainTarget, join(mainModules, "plain"))
    symlinkSync(scopedTarget, join(mainModules, "@scope", "pkg"))
    symlinkSync("../plain/cli.js", join(mainModules, ".bin", "tool"))

    // Non-symlink entries a hoisted linker (or a marker file) could leave behind.
    // These pin the main-checkout guard: without it the script would delete them.
    mkdirSync(join(mainModules, "realpkg"), { recursive: true })
    writeFileSync(join(mainModules, "realpkg", "index.js"), "export const real = true\n")
    writeFileSync(join(mainModules, ".bun-tag"), "tag\n")

    const worktree = join(scratch, "worktree")

    git(main, "worktree", "add", worktree, "HEAD")

    // Run in the main checkout: writes nothing
    const mainRun = spawnSync("bun", ["proof/link-worktree.ts"], { cwd: main, encoding: "utf8" })

    expect([mainRun.status, mainRun.stderr]).toEqual([0, ""])
    expect(readdirSync(mainModules).sort()).toEqual([
      ".bin",
      ".bun-tag",
      "@scope",
      "plain",
      "realpkg",
    ])
    expect(lstatSync(join(mainModules, "realpkg")).isSymbolicLink()).toBe(false)
    expect(lstatSync(join(mainModules, "realpkg", "index.js")).isSymbolicLink()).toBe(false)
    expect(lstatSync(join(mainModules, ".bun-tag")).isSymbolicLink()).toBe(false)
    expect(readFileSync(join(mainModules, "realpkg", "index.js"), "utf8")).toBe(
      "export const real = true\n",
    )
    expect(readFileSync(join(mainModules, ".bun-tag"), "utf8")).toBe("tag\n")

    // Run in the worktree: mirrors links
    const wtRun = spawnSync("bun", ["proof/link-worktree.ts"], { cwd: worktree, encoding: "utf8" })

    expect([wtRun.status, wtRun.stderr]).toEqual([0, ""])

    const wtModules = join(worktree, "proof", "node_modules")
    const wtPlain = join(wtModules, "plain")
    const wtPkg = join(wtModules, "@scope", "pkg")
    const wtTool = join(wtModules, ".bin", "tool")

    expect(lstatSync(wtModules).isDirectory()).toBe(true)
    expect(lstatSync(wtModules).isSymbolicLink()).toBe(false)
    expect(lstatSync(join(wtModules, "@scope")).isDirectory()).toBe(true)
    expect(lstatSync(join(wtModules, "@scope")).isSymbolicLink()).toBe(false)
    expect(lstatSync(join(wtModules, ".bin")).isDirectory()).toBe(true)
    expect(lstatSync(join(wtModules, ".bin")).isSymbolicLink()).toBe(false)

    expect(lstatSync(wtPlain).isSymbolicLink()).toBe(true)
    expect(lstatSync(wtPkg).isSymbolicLink()).toBe(true)
    expect(lstatSync(wtTool).isSymbolicLink()).toBe(true)

    const plainCli = join(plainTarget, "cli.js")

    expect(realpathSync(wtPlain)).toBe(realpathSync(plainTarget))
    expect(realpathSync(wtPkg)).toBe(realpathSync(scopedTarget))
    expect(realpathSync(wtTool)).toBe(realpathSync(plainCli))

    // Second run changes nothing
    const wtRun2 = spawnSync("bun", ["proof/link-worktree.ts"], { cwd: worktree, encoding: "utf8" })

    expect([wtRun2.status, wtRun2.stderr]).toEqual([0, ""])
    expect(realpathSync(wtPlain)).toBe(realpathSync(plainTarget))
    expect(realpathSync(wtPkg)).toBe(realpathSync(scopedTarget))
    expect(realpathSync(wtTool)).toBe(realpathSync(plainCli))
    expect(readlinkSync(wtPlain)).toBe(realpathSync(plainTarget))
    expect(readlinkSync(wtPkg)).toBe(realpathSync(scopedTarget))
    expect(readlinkSync(wtTool)).toBe(realpathSync(plainCli))
  })
})
