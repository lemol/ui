import { describe, expect, it } from "bun:test"
import {
  crc32,
  encodePng,
  fingerprintedAsset,
  offlinePage,
  serviceWorker,
  storedDeflate,
  webManifest,
} from "./index.ts"

/** A PNG's chunks, each with whether its CRC holds. */
const chunksOf = (png: Uint8Array) => {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength)
  const chunks: Array<{ type: string; data: Uint8Array; crcOk: boolean }> = []
  let at = 8

  while (at < png.length) {
    const length = view.getUint32(at)
    const type = new TextDecoder().decode(png.subarray(at + 4, at + 8))
    const data = png.subarray(at + 8, at + 8 + length)
    const crc = view.getUint32(at + 8 + length)

    chunks.push({ type, data, crcOk: crc === crc32(png.subarray(at + 4, at + 8 + length)) })
    at += 12 + length
  }

  return chunks
}

/** Zlib's stored form read back: the blocks' bytes, joined. */
const unstore = (zlib: Uint8Array): Uint8Array => {
  const view = new DataView(zlib.buffer, zlib.byteOffset, zlib.byteLength)
  const parts: Array<Uint8Array> = []
  let at = 2
  let last = false

  while (!last) {
    last = (zlib[at] ?? 0) === 1

    const length = view.getUint16(at + 1, true)

    expect(view.getUint16(at + 3, true)).toBe(~length & 0xffff)
    parts.push(zlib.subarray(at + 5, at + 5 + length))
    at += 5 + length
  }

  const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0))
  let offset = 0

  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }

  return out
}

describe("encodePng", () => {
  const width = 3
  const height = 2
  const rgba = new Uint8Array(width * height * 4).map((_, i) => (i * 37) % 256)

  it("writes a PNG a decoder reads: the signature, the header and every chunk's CRC", () => {
    const png = encodePng(width, height, rgba)
    const chunks = chunksOf(png)
    const header = new DataView(chunks[0]!.data.buffer, chunks[0]!.data.byteOffset, 13)

    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    expect(chunks.map((chunk) => chunk.type)).toEqual(["IHDR", "IDAT", "IEND"])
    expect(chunks.every((chunk) => chunk.crcOk)).toBe(true)
    expect([header.getUint32(0), header.getUint32(4)]).toEqual([width, height])
    // Eight bits a channel, truecolour with alpha.
    expect([...chunks[0]!.data.subarray(8)]).toEqual([8, 6, 0, 0, 0])
  })

  it("stores the rows unfiltered when no deflate is given, each led by its filter byte", () => {
    const idat = chunksOf(encodePng(width, height, rgba))[1]!.data
    const rows = unstore(idat)

    expect(rows.length).toBe(height * (width * 4 + 1))
    expect(rows[0]).toBe(0)
    expect([...rows.subarray(1, 1 + width * 4)]).toEqual([...rgba.subarray(0, width * 4)])
  })

  it("splits what is longer than a stored block across blocks", () => {
    const big = new Uint8Array(70_000).fill(7)

    expect([...unstore(storedDeflate(big))]).toEqual([...big])
  })

  it("compresses with the deflate a host passes", () => {
    const seen: Array<number> = []
    const png = encodePng(width, height, rgba, (data) => {
      seen.push(data.length)

      return storedDeflate(data)
    })

    expect(seen).toEqual([height * (width * 4 + 1)])
    expect(chunksOf(png).every((chunk) => chunk.crcOk)).toBe(true)
  })
})

describe("webManifest", () => {
  it("names the app, starts it standalone at the root, and lists its icons", () => {
    const manifest = JSON.parse(
      webManifest({
        name: "demo",
        background: "#16161D",
        theme: "#121218",
        icons: [{ src: "/i.png", sizes: "192x192", type: "image/png", purpose: "maskable" }],
        shortcuts: [{ name: "Browse", url: "/tasks" }],
      }),
    ) as Record<string, unknown>

    expect(manifest).toMatchObject({
      id: "/",
      name: "demo",
      short_name: "demo",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#16161D",
      theme_color: "#121218",
      icons: [{ src: "/i.png", sizes: "192x192", type: "image/png", purpose: "maskable" }],
      shortcuts: [{ name: "Browse", url: "/tasks" }],
    })
  })
})

describe("serviceWorker", () => {
  it("is a script that answers a failed navigation with the offline page", () => {
    const source = serviceWorker({ version: "v1", offline: "<p>away</p>" })

    expect(() => new Function(source)).not.toThrow()
    expect(source).toContain('const version = "v1"')
    expect(source).toContain('request.mode === "navigate"')
    expect(source).toContain("fetch(request).catch(")
    expect(source).toContain('"<p>away</p>"')
  })

  it("keeps the fingerprinted assets by default, and nothing when told", () => {
    expect(serviceWorker({ version: "v", offline: "" })).toContain(
      JSON.stringify(fingerprintedAsset.source),
    )
    expect(serviceWorker({ version: "v", offline: "", keep: false })).toContain("const kept = null")
  })

  it("names a content-addressed file kept, and a page or a plain file not", () => {
    expect(fingerprintedAsset.test("/assets/shell/styles.@1gjy9z9.css")).toBe(true)
    expect(fingerprintedAsset.test("/assets/src/keyboard.@IpqnKx.tsx")).toBe(true)
    expect(fingerprintedAsset.test("/assets/src/index.@_RF6ZJ.ts")).toBe(true)
    expect(fingerprintedAsset.test("/assets/src/entry.ts")).toBe(false)
    expect(fingerprintedAsset.test("/t/shop/12")).toBe(false)
  })
})

describe("offlinePage", () => {
  const colors = { ground: "#000", ink: "#fff", dim: "#888", edge: "#444" }
  const html = offlinePage({
    title: "Out of reach",
    heading: "<app> is out of reach",
    body: "Offline & asleep.",
    retry: "Try again",
    dark: colors,
    light: { ...colors, ground: "#fff", ink: "#000" },
  })

  it("says so, escaped, with a way to try again and a reload once online", () => {
    expect(html).toContain("<h1>&lt;app&gt; is out of reach</h1>")
    expect(html).toContain("<p>Offline &amp; asleep.</p>")
    expect(html).toContain('<a href="">Try again</a>')
    expect(html).toContain('addEventListener("online"')
  })

  it("draws both schemes, and keeps clear of a phone's safe areas", () => {
    expect(html).toContain("color-scheme:dark;--ground:#000")
    expect(html).toContain(
      "@media (prefers-color-scheme: light){:root{color-scheme:light;--ground:#fff",
    )
    expect(html).toContain("env(safe-area-inset-bottom)")
  })
})
