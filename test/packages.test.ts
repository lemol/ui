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

/** Every package in the workspace, with the peers it is allowed to declare. */
const packages = [
  { dir: "ui-design", peers: [] as string[] },
  { dir: "ui-remix", peers: ["remix"] },
  { dir: "ui-remix-mini", peers: ["remix"] },
]

for (const { dir, peers } of packages) {
  describe(`packages/${dir}`, () => {
    test("is named for its directory", async () => {
      expect((await read(`packages/${dir}/package.json`)).name).toBe(`@lemol/${dir}`)
    })

    test("ships TypeScript from src, with no build step", async () => {
      const pkg = await read(`packages/${dir}/package.json`)
      expect(pkg.main).toBe("./src/index.ts")
      expect(pkg.types).toBe("./src/index.ts")
    })

    // A dangling exports map fails only at the import that needs it, which is
    // the wrong place to find out.
    test("resolves every exported subpath to a file", async () => {
      const pkg = await read(`packages/${dir}/package.json`)
      const targets = Object.values(pkg.exports ?? {})
      expect(targets.length).toBeGreaterThan(0)
      for (const target of targets) {
        expect([target, await Bun.file(`${root}packages/${dir}/${target}`).exists()]).toEqual([
          target,
          true,
        ])
      }
    })

    test("documents its own contents and limits", async () => {
      expect(await Bun.file(`${root}packages/${dir}/README.md`).exists()).toBe(true)
    })

    test("declares the peers the architecture allows, and never effect", async () => {
      const pkg = await read(`packages/${dir}/package.json`)
      expect(Object.keys(pkg.peerDependencies ?? {})).toEqual(peers)
      expect(Object.keys(pkg.dependencies ?? {})).not.toContain("effect")
    })
  })
}

// The subpath exists so that taking the schema does not mean taking the
// stylesheet with it, which one import in the barrel would quietly undo.
test("keeps the ui-design barrel clear of the css subpath", async () => {
  const barrel = await Bun.file(`${root}packages/ui-design/src/index.ts`).text()
  expect(barrel).not.toContain("./css")
})

test("pins remix to the version the root declares", async () => {
  const pinned = (await read("package.json")).peerDependencies?.remix
  expect(pinned).toBeString()
  for (const { dir, peers } of packages) {
    if (!peers.includes("remix")) continue
    expect((await read(`packages/${dir}/package.json`)).peerDependencies?.remix).toBe(pinned)
  }
})
