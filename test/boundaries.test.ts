import { describe, expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { dirname, join, relative, resolve, sep } from "node:path"
import { Glob } from "bun"

const root = resolve(import.meta.dir, "..")
const srcRoot = join(root, "src")
const harnesses = [resolve(import.meta.dir, "render.ts"), resolve(import.meta.dir, "styles.ts")]

// The dependency graph from docs/architecture.md, now as layers inside one
// package. Each layer may import its own files under src/<layer>/, plus the
// specifiers listed here. An entry matches exactly or as a prefix, so
// "remix/ui" also allows "remix/ui/server".
//
// design allows nothing: it is strings and data, and the day it knows about a
// renderer is the day a future opentui layer cannot reuse it.
const allowed: Record<string, string[]> = {
  design: [],
  remix: ["remix/ui"],
  mini: ["remix/ui"],
}

// Which layers each one may reach, and in which direction. Collapsing three
// packages into one turned these edges from `dependencies` into relative
// imports, so the check that used to be "does package.json record it" is now
// "does it go through a published entry point" — see entriesOf below.
const reachable: Record<string, string[]> = {
  design: [],
  remix: ["design"],
  mini: ["design", "remix"],
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
// shared server-render harness. Nothing else in src may reach for either.
const testPackages = ["bun:test"]
const isTest = (file: string) => file.includes(".test.")

type Manifest = { exports: Record<string, string> }
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as Manifest

/**
 * The files the exports map publishes, grouped by layer. A layer's entry points
 * are its whole surface: reaching past one from another layer would import a
 * file no consumer can import, which is how the design/renderer split rots.
 */
const entriesOf = (): Map<string, Set<string>> => {
  const byLayer = new Map<string, Set<string>>()
  for (const target of Object.values(manifest.exports)) {
    const absolute = resolve(root, target)
    const inside = relative(srcRoot, absolute)
    if (inside.startsWith("..")) continue
    const layer = inside.split(sep)[0] ?? ""
    const set = byLayer.get(layer) ?? new Set<string>()
    set.add(absolute)
    byLayer.set(layer, set)
  }
  return byLayer
}

const entries = entriesOf()

const importPattern =
  /(?:^|[\s;])(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,$]+\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g

const specifiersOf = (source: string): string[] =>
  [...source.matchAll(importPattern)].map((match) => match[1] ?? match[2] ?? "")

const matches = (entry: string, specifier: string) =>
  entry.endsWith(":")
    ? specifier.startsWith(entry)
    : specifier === entry || specifier.startsWith(`${entry}/`)

/** Returns a message for each import in `source` that breaks the rules. `file` is relative to src. */
export const violations = (file: string, source: string): string[] => {
  const layer = file.split(sep)[0] ?? ""
  const allow = allowed[layer]
  const reach = reachable[layer]
  if (allow === undefined || reach === undefined) return [`${file}: not inside a known layer`]

  return specifiersOf(source).flatMap((specifier) => {
    if (specifier.startsWith(".")) {
      const target = resolve(srcRoot, dirname(file), specifier)
      if (harnesses.includes(target)) {
        return isTest(file) ? [] : [`${file}: runtime code imports the test harness (${specifier})`]
      }
      const inside = relative(srcRoot, target)
      if (inside.startsWith("..")) return [`${file}: imports ${specifier}, outside src`]

      const other = inside.split(sep)[0] ?? ""
      if (other === layer) return []
      if (!reach.includes(other)) return [`${file}: ${layer} must not import ${other}`]
      // A layer is reached only where the exports map publishes it, so
      // package.json still records every edge in the graph.
      if (!entries.get(other)?.has(target)) {
        return [`${file}: imports ${specifier}, which ${other} does not export`]
      }
      return []
    }
    if (isTest(file) && testPackages.includes(specifier)) return []
    if (denied.some((entry) => matches(entry, specifier))) {
      return [`${file}: ${specifier} is not SPA-safe`]
    }
    if (allow.some((entry) => matches(entry, specifier))) return []
    return [`${file}: ${layer} must not import ${specifier}`]
  })
}

const sourceFiles = () =>
  ["*/**/*.ts", "*/**/*.tsx"].flatMap((pattern) => [
    ...new Glob(pattern).scanSync({ cwd: srcRoot, onlyFiles: true }),
  ])

describe("the SPA import boundary", () => {
  // A layer missing from `allowed` would otherwise be checked against nothing.
  test("covers every layer under src", () => {
    const dirs = readdirSync(srcRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
    expect(dirs).toEqual(Object.keys(allowed).sort())
  })

  // The graph is only enforceable where the exports map names a way in.
  test("gives every reachable layer at least one entry point", () => {
    for (const layer of new Set(Object.values(reachable).flat())) {
      expect([layer, entries.get(layer)?.size ?? 0]).not.toEqual([layer, 0])
    }
  })

  test("every source file imports only what the graph allows", () => {
    const files = sourceFiles()
    expect(files.length).toBeGreaterThan(0)
    const found = files.flatMap((file) =>
      violations(file, readFileSync(join(srcRoot, file), "utf8")),
    )
    expect(found).toEqual([])
  })

  // The rules are only worth having if they fail, so each one is shown failing.
  describe("the checker", () => {
    const at = (...parts: string[]) => join(...parts)

    test("rejects the server-only imports in every layer", () => {
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
      for (const layer of Object.keys(allowed)) {
        const file = at(layer, "index.ts")
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
      expect(violations(at("remix", "dialog", "dialog.tsx"), source)).toEqual([])
    })

    test("keeps design renderer-agnostic", () => {
      const file = at("design", "css", "emit.ts")
      expect(violations(file, 'import { css } from "remix/ui"')).toEqual([
        `${file}: design must not import remix/ui`,
      ])
      expect(violations(file, 'import { theme } from "../theme.ts"')).toEqual([])
    })

    test("lets each layer import only the ones below it", () => {
      const design = 'import { v } from "../design/index.ts"'
      const remix = 'import { Button } from "../remix/index.ts"'

      expect(violations(at("mini", "shell.tsx"), `${design}\n${remix}`)).toEqual([])
      expect(violations(at("remix", "theme-style.tsx"), design)).toEqual([])
      expect(
        violations(at("remix", "theme-style.tsx"), 'import { m } from "../mini/index.ts"'),
      ).toEqual([`${at("remix", "theme-style.tsx")}: remix must not import mini`])
      expect(violations(at("design", "theme.ts"), 'import { R } from "../remix/index.ts"')).toEqual(
        [`${at("design", "theme.ts")}: design must not import remix`],
      )
    })

    test("sends cross-layer imports through a published entry point", () => {
      const file = at("remix", "button", "button.tsx")
      expect(violations(file, 'import { v } from "../../design/ref.ts"')).toEqual([
        `${file}: imports ../../design/ref.ts, which design does not export`,
      ])
      expect(violations(file, 'import { v } from "../../design/index.ts"')).toEqual([])
      expect(violations(file, 'import { emit } from "../../design/css/index.ts"')).toEqual([])
    })

    test("keeps relative imports inside src", () => {
      const file = at("remix", "button", "button.tsx")
      expect(violations(file, 'const lazy = import("../../../package.json")')).toEqual([
        `${file}: imports ../../../package.json, outside src`,
      ])
    })

    test("gives tests the runner and the harness, and runtime code neither", () => {
      const spec = at("remix", "button", "button.test.tsx")
      const source = [
        'import { expect, test } from "bun:test"',
        'import { renderToHtml } from "../../../test/render.ts"',
        'import { styleBlocksOf } from "../../../test/styles.ts"',
      ].join("\n")
      expect(violations(spec, source)).toEqual([])

      const runtime = at("remix", "button", "button.tsx")
      expect(violations(runtime, source)).toEqual([
        `${runtime}: bun:test is not SPA-safe`,
        `${runtime}: runtime code imports the test harness (../../../test/render.ts)`,
        `${runtime}: runtime code imports the test harness (../../../test/styles.ts)`,
      ])
    })

    test("rejects files outside a known layer", () => {
      expect(violations(at("opentui", "index.ts"), "")).toEqual([
        `${at("opentui", "index.ts")}: not inside a known layer`,
      ])
    })
  })
})
