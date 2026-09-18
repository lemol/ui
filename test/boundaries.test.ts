import { describe, expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { dirname, join, relative, resolve, sep } from "node:path"
import { Glob } from "bun"

const packagesRoot = resolve(import.meta.dir, "..", "packages")
const harnesses = [resolve(import.meta.dir, "render.ts"), resolve(import.meta.dir, "styles.ts")]

// The dependency graph from docs/architecture.md. Each package may import its own
// files under src/, plus the specifiers listed here. An entry matches exactly or as
// a prefix, so "remix/ui" also allows "remix/ui/server".
//
// ui-design allows nothing: it is strings and data, and the day it knows about a
// renderer is the day @lemol/ui-opentui cannot reuse it.
const allowed: Record<string, string[]> = {
  "ui-design": [],
  "ui-remix": ["remix/ui", "@lemol/ui-design"],
  "ui-remix-mini": ["remix/ui", "@lemol/ui-design", "@lemol/ui-remix"],
}

// The imports the spec names, denied even if an allow-list above grows to cover
// one. These are what "runs in SPA mode" rules out. A ":" suffix denies a scheme.
const denied = [
  "node:",
  "bun",
  "bun:",
  "effect",
  "remix/router",
  "remix/routes",
  "remix/assets",
  "remix/spa",
]

// Tests live beside the component they cover, so they need the runner and the
// shared server-render harness. Nothing else in a package may reach for either.
const testPackages = ["bun:test"]
const isTest = (file: string) => file.includes(".test.")

const importPattern =
  /(?:^|[\s;])(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,$]+\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g

const specifiersOf = (source: string): string[] =>
  [...source.matchAll(importPattern)].map((match) => match[1] ?? match[2] ?? "")

const matches = (entry: string, specifier: string) =>
  entry.endsWith(":")
    ? specifier.startsWith(entry)
    : specifier === entry || specifier.startsWith(`${entry}/`)

/** Returns a message for each import in `source` that breaks the rules. `file` is relative to packages. */
export const violations = (file: string, source: string): string[] => {
  const pkg = file.split(sep)[0] ?? ""
  const allow = allowed[pkg]
  if (allow === undefined) return [`${file}: not inside a known package`]

  return specifiersOf(source).flatMap((specifier) => {
    if (specifier.startsWith(".")) {
      const target = resolve(packagesRoot, dirname(file), specifier)
      if (harnesses.includes(target)) {
        return isTest(file) ? [] : [`${file}: runtime code imports the test harness (${specifier})`]
      }
      // A sibling package is reached by name, so that package.json records the edge.
      const inside = relative(join(packagesRoot, pkg, "src"), target)
      if (inside.startsWith("..")) return [`${file}: imports ${specifier}, outside ${pkg}/src`]
      return []
    }
    if (isTest(file) && testPackages.includes(specifier)) return []
    if (denied.some((entry) => matches(entry, specifier))) {
      return [`${file}: ${specifier} is not SPA-safe`]
    }
    if (allow.some((entry) => matches(entry, specifier))) return []
    return [`${file}: ${pkg} must not import ${specifier}`]
  })
}

const sourceFiles = () =>
  ["*/src/**/*.ts", "*/src/**/*.tsx"].flatMap((pattern) => [
    ...new Glob(pattern).scanSync({ cwd: packagesRoot, onlyFiles: true }),
  ])

describe("the SPA import boundary", () => {
  // A package missing from `allowed` would otherwise be checked against nothing.
  test("covers every package in the workspace", () => {
    const dirs = readdirSync(packagesRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
    expect(dirs).toEqual(Object.keys(allowed).sort())
  })

  test("every package source file imports only what the graph allows", () => {
    const files = sourceFiles()
    expect(files.length).toBeGreaterThan(0)
    const found = files.flatMap((file) =>
      violations(file, readFileSync(join(packagesRoot, file), "utf8")),
    )
    expect(found).toEqual([])
  })

  // The rules are only worth having if they fail, so each one is shown failing.
  describe("the checker", () => {
    const at = (...parts: string[]) => join(...parts)

    test("rejects the server-only imports in every package", () => {
      const source = [
        'import { readFile } from "node:fs/promises"',
        'import { Glob } from "bun"',
        'import { Database } from "bun:sqlite"',
        'import { Effect } from "effect"',
        'import { createRouter } from "remix/router"',
        'import { routes } from "remix/routes"',
        'import { assets } from "remix/assets"',
        'import { run } from "remix/spa"',
      ].join("\n")
      for (const pkg of Object.keys(allowed)) {
        const file = at(pkg, "src", "index.ts")
        expect(violations(file, source)).toEqual([
          `${file}: node:fs/promises is not SPA-safe`,
          `${file}: bun is not SPA-safe`,
          `${file}: bun:sqlite is not SPA-safe`,
          `${file}: effect is not SPA-safe`,
          `${file}: remix/router is not SPA-safe`,
          `${file}: remix/routes is not SPA-safe`,
          `${file}: remix/assets is not SPA-safe`,
          `${file}: remix/spa is not SPA-safe`,
        ])
      }
    })

    test("allows remix/ui, its subpaths and relative files", () => {
      const source = [
        'import type { RemixNode } from "remix/ui"',
        'import { css } from "remix/ui"',
        'import { renderToString } from "remix/ui/server"',
        'export * from "./tokens.ts"',
        'import { buttonTokens } from "../button/tokens.ts"',
      ].join("\n")
      expect(violations(at("ui-remix", "src", "dialog", "dialog.tsx"), source)).toEqual([])
    })

    test("keeps ui-design renderer-agnostic", () => {
      const file = at("ui-design", "src", "css", "emit.ts")
      expect(violations(file, 'import { css } from "remix/ui"')).toEqual([
        `${file}: ui-design must not import remix/ui`,
      ])
      expect(violations(file, 'import { theme } from "../theme.ts"')).toEqual([])
    })

    test("lets each package import only the ones below it", () => {
      const design = 'import { v } from "@lemol/ui-design"'
      const remix = 'import { Button } from "@lemol/ui-remix"'
      const mini = 'import { AppShell } from "@lemol/ui-remix-mini"'

      expect(violations(at("ui-remix-mini", "src", "shell.tsx"), `${design}\n${remix}`)).toEqual([])
      expect(violations(at("ui-remix", "src", "theme-style.tsx"), design)).toEqual([])
      expect(violations(at("ui-remix", "src", "theme-style.tsx"), mini)).toEqual([
        `${at("ui-remix", "src", "theme-style.tsx")}: ui-remix must not import @lemol/ui-remix-mini`,
      ])
      expect(violations(at("ui-design", "src", "theme.ts"), design)).toEqual([
        `${at("ui-design", "src", "theme.ts")}: ui-design must not import @lemol/ui-design`,
      ])
    })

    test("sends cross-package imports through the package name", () => {
      const file = at("ui-remix", "src", "button", "button.tsx")
      expect(violations(file, 'import { v } from "../../../ui-design/src/index.ts"')).toEqual([
        `${file}: imports ../../../ui-design/src/index.ts, outside ui-remix/src`,
      ])
      expect(violations(file, 'const lazy = import("../../package.json")')).toEqual([
        `${file}: imports ../../package.json, outside ui-remix/src`,
      ])
    })

    test("gives tests the runner and the harness, and runtime code neither", () => {
      const spec = at("ui-remix", "src", "button", "button.test.tsx")
      const source = [
        'import { expect, test } from "bun:test"',
        'import { renderToHtml } from "../../../../test/render.ts"',
        'import { styleBlocksOf } from "../../../../test/styles.ts"',
      ].join("\n")
      expect(violations(spec, source)).toEqual([])

      const runtime = at("ui-remix", "src", "button", "button.tsx")
      expect(violations(runtime, source)).toEqual([
        `${runtime}: bun:test is not SPA-safe`,
        `${runtime}: runtime code imports the test harness (../../../../test/render.ts)`,
        `${runtime}: runtime code imports the test harness (../../../../test/styles.ts)`,
      ])
    })

    test("rejects files outside a known package", () => {
      expect(violations(at("ui-future", "src", "index.ts"), "")).toEqual([
        `${at("ui-future", "src", "index.ts")}: not inside a known package`,
      ])
    })
  })
})
