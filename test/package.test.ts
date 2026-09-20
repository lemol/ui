import { describe, expect, test } from "bun:test"

const root = new URL("..", import.meta.url).pathname

type Manifest = {
  name: string
  main?: string
  types?: string
  exports?: Record<string, string>
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

const read = (path: string) => Bun.file(`${root}${path}`).json() as Promise<Manifest>
const manifest = () => read("package.json")

/** The layers inside src, and the subpath each one is published under. */
const layers = [
  { dir: "design", subpath: "./design" },
  { dir: "remix", subpath: "./remix" },
  { dir: "mini", subpath: "./mini" },
]

describe("@lemol/ui", () => {
  // One package at the repository root is what makes the git specifier work at
  // all: Bun always installs a repository's root package, and there is no
  // subdirectory form of the specifier.
  test("is one package at the repository root", async () => {
    expect((await manifest()).name).toBe("@lemol/ui")
  })

  test("ships TypeScript from src, with no build step", async () => {
    const targets = Object.values((await manifest()).exports ?? {})
    expect(targets.length).toBeGreaterThan(0)
    for (const target of targets) {
      expect([target, target.startsWith("./src/") && /\.tsx?$/.test(target)]).toEqual([
        target,
        true,
      ])
    }
  })

  // A dangling exports map fails only at the import that needs it, which is
  // the wrong place to find out.
  test("resolves every exported subpath to a file", async () => {
    for (const target of Object.values((await manifest()).exports ?? {})) {
      expect([target, await Bun.file(`${root}${target.slice(2)}`).exists()]).toEqual([target, true])
    }
  })

  // The layers were three packages, and the split between them is the point.
  // A "." barrel merging them would hide which layer a component came from —
  // the same reason mini does not re-export remix.
  test("publishes each layer on its own subpath, and no root barrel", async () => {
    const exports = (await manifest()).exports ?? {}
    expect(exports["."]).toBeUndefined()
    for (const { dir, subpath } of layers) {
      expect([subpath, exports[subpath]]).toEqual([subpath, `./src/${dir}/index.ts`])
    }
  })

  test("documents each layer beside its source", async () => {
    for (const { dir } of layers) {
      expect([dir, await Bun.file(`${root}src/${dir}/README.md`).exists()]).toEqual([dir, true])
    }
  })

  test("declares remix as its only peer, and never effect", async () => {
    const pkg = await manifest()
    expect(Object.keys(pkg.peerDependencies ?? {})).toEqual(["remix"])
    expect(Object.keys(pkg.dependencies ?? {})).not.toContain("effect")
  })
})

// The subpath exists so that taking the schema does not mean taking the
// stylesheet with it, which one import in the barrel would quietly undo.
test("keeps the design barrel clear of the css subpath", async () => {
  const barrel = await Bun.file(`${root}src/design/index.ts`).text()
  expect(barrel).not.toContain("./css")
})

// Same shape of rule, one layer up. `Document` is the only file in mini that
// imports `remix/ui/server`, and an SPA takes the theme from this barrel — so
// a re-export here would drag a server renderer into every browser bundle,
// since these packages ship unbundled source and the asset server compiles a
// module graph rather than tree-shaking it.
test("keeps the mini barrel clear of the document subpath", async () => {
  const exports = (await manifest()).exports ?? {}
  expect(exports["./mini/document"]).toBe("./src/mini/document.tsx")
  const barrel = await Bun.file(`${root}src/mini/index.ts`).text()
  expect(barrel).not.toContain("./document")
  const server = await Bun.file(`${root}src/mini/document.tsx`).text()
  expect(server).toContain("remix/ui/server")
})

describe("apps/playground", () => {
  const playground = () => read("apps/playground/package.json")

  // The catalogue is the in-repo consumer. Going through the package name
  // rather than a relative path into src is what keeps the exports map honest.
  test("takes the package by name, not by a path into src", async () => {
    const deps = (await playground()).dependencies ?? {}
    expect(deps["@lemol/ui"]).toBe("file:../..")
    expect(Object.keys(deps).filter((name) => name.startsWith("@lemol/"))).toEqual(["@lemol/ui"])
  })

  test("pins remix to the version the package declares as its peer", async () => {
    const pinned = (await manifest()).peerDependencies?.remix
    expect(pinned).toBeString()
    expect((await playground()).dependencies?.remix).toBe(pinned)
  })
})
