import { execSync } from "node:child_process"
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from "node:fs"
import { dirname, join } from "node:path"

const mirrorLink = (source: string, destination: string) => {
  const target = realpathSync(source)
  const stat = lstatSync(destination, { throwIfNoEntry: false })

  if (stat) {
    if (stat.isSymbolicLink()) {
      try {
        if (realpathSync(destination) === target) return
      } catch {
        // Broken symlink; recreate it below
      }
    }

    rmSync(destination, { recursive: true, force: true })
  }

  symlinkSync(target, destination)
}

export const linkWorktree = (cwd = process.cwd()) => {
  const commonDir = execSync("git rev-parse --path-format=absolute --git-common-dir", {
    cwd,
    encoding: "utf8",
  }).trim()

  const worktreeRoot = execSync("git rev-parse --path-format=absolute --show-toplevel", {
    cwd,
    encoding: "utf8",
  }).trim()

  const mainCheckout = dirname(commonDir)

  if (realpathSync(mainCheckout) === realpathSync(worktreeRoot)) return

  const sourceDir = join(mainCheckout, "proof", "node_modules")

  if (!existsSync(sourceDir)) return

  const destDir = join(worktreeRoot, "proof", "node_modules")

  mkdirSync(destDir, { recursive: true })

  const entries = readdirSync(sourceDir, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = join(sourceDir, entry.name)
    const destPath = join(destDir, entry.name)

    if (entry.isDirectory() && (entry.name.startsWith("@") || entry.name === ".bin")) {
      mkdirSync(destPath, { recursive: true })

      const subEntries = readdirSync(srcPath, { withFileTypes: true })

      for (const sub of subEntries) {
        mirrorLink(join(srcPath, sub.name), join(destPath, sub.name))
      }

      continue
    }

    mirrorLink(srcPath, destPath)
  }
}

if (import.meta.main) {
  linkWorktree()
}
