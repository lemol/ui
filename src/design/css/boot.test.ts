import { describe, expect, it } from "bun:test"
import { densityStorageKey, schemeBootScript, schemeStorageKey } from "./boot.ts"

/**
 * Runs the boot script against a stub document and storage.
 *
 * The script has to run before any framework does, so it is plain DOM code in
 * a string rather than a module. A stub is enough to prove what it reads, what
 * it refuses to write, and that it survives storage throwing — none of which
 * needs a browser.
 */
function boot(
  store: Record<string, string>,
  failing = false,
  rendered: Record<string, string> = {},
): Record<string, string> {
  const attributes: Record<string, string> = { ...rendered }
  const document = {
    documentElement: {
      setAttribute(name: string, value: string) {
        attributes[name] = value
      },
      hasAttribute(name: string): boolean {
        return name in attributes
      },
    },
  }
  const localStorage = {
    getItem(key: string): string | null {
      if (failing) throw new Error("access denied")
      return store[key] ?? null
    },
  }
  new Function("document", "localStorage", schemeBootScript)(document, localStorage)
  return attributes
}

describe("schemeBootScript", () => {
  it("restores a remembered scheme and density", () => {
    expect(boot({ [schemeStorageKey]: "dark", [densityStorageKey]: "compact" })).toEqual({
      "data-scheme": "dark",
      "data-density": "compact",
    })
  })

  it("restores a manual light choice, which the sheet's guard needs to see", () => {
    expect(boot({ [schemeStorageKey]: "light" })).toEqual({ "data-scheme": "light" })
  })

  it("sets nothing when nothing is remembered", () => {
    expect(boot({})).toEqual({})
  })

  it("writes nothing for the default density", () => {
    expect(boot({ [densityStorageKey]: "comfortable" })).toEqual({})
  })

  it("refuses a value outside the allow-list", () => {
    // Otherwise a stale or hand-edited entry lands in a root attribute verbatim.
    expect(boot({ [schemeStorageKey]: "solarized" })).toEqual({})
  })

  it("leaves an attribute the document already rendered alone", () => {
    // The server rendering data-scheme is a decision — a query param, a
    // session preference — and it has to beat the remembered value, or that
    // decision is unreachable for anyone who has ever chosen a scheme.
    expect(
      boot({ [schemeStorageKey]: "dark", [densityStorageKey]: "compact" }, false, {
        "data-scheme": "light",
        "data-density": "compact",
      }),
    ).toEqual({ "data-scheme": "light", "data-density": "compact" })
  })

  it("still fills in the axis the document left blank", () => {
    expect(
      boot({ [schemeStorageKey]: "dark", [densityStorageKey]: "compact" }, false, {
        "data-scheme": "light",
      }),
    ).toEqual({ "data-scheme": "light", "data-density": "compact" })
  })

  it("survives storage that refuses to be read", () => {
    // A private window can throw on getItem, and that must not take the page down.
    expect(() => boot({}, true)).not.toThrow()
  })

  it("stamps no enhanced marker", () => {
    expect(schemeBootScript).not.toContain("enhanced")
  })

  it("ships as one line with nothing a document would escape", () => {
    expect(schemeBootScript).not.toContain("\n")
    for (const character of ["`", "<", ">", "&"]) {
      expect(schemeBootScript).not.toContain(character)
    }
  })
})
