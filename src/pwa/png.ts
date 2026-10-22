/**
 * A PNG from RGBA pixels, written with no image library: eight bits a
 * channel with alpha, every row unfiltered. Its pixel data is deflated by
 * the `deflate` a host passes (a server has zlib); without one it is stored
 * uncompressed, which every decoder reads and which needs nothing to write.
 */
export type Deflate = (data: Uint8Array) => Uint8Array

const crcTable = (() => {
  const table = new Uint32Array(256)

  for (let n = 0; n < 256; n++) {
    let c = n

    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1

    table[n] = c >>> 0
  }

  return table
})()

/** The CRC-32 a PNG chunk ends with, over its type and its data. */
export const crc32 = (bytes: Uint8Array): number => {
  let c = 0xffffffff

  for (const byte of bytes) c = (crcTable[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8)

  return (c ^ 0xffffffff) >>> 0
}

const adler32 = (bytes: Uint8Array): number => {
  let a = 1
  let b = 0

  for (const byte of bytes) {
    a = (a + byte) % 65521
    b = (b + a) % 65521
  }

  return ((b << 16) | a) >>> 0
}

/** The largest stored block deflate allows. */
const block = 65535

/**
 * Zlib's stored form: its two-byte header, the data in raw blocks of at most
 * 65 535 bytes, each with its length and that length's complement, then the
 * data's Adler-32.
 */
export const storedDeflate: Deflate = (data) => {
  const blocks = Math.max(1, Math.ceil(data.length / block))
  const out = new Uint8Array(2 + blocks * 5 + data.length + 4)
  const view = new DataView(out.buffer)

  out[0] = 0x78
  out[1] = 0x01

  let at = 2

  for (let i = 0; i < blocks; i++) {
    const part = data.subarray(i * block, (i + 1) * block)

    out[at] = i === blocks - 1 ? 1 : 0
    view.setUint16(at + 1, part.length, true)
    view.setUint16(at + 3, ~part.length & 0xffff, true)
    out.set(part, at + 5)
    at += 5 + part.length
  }

  view.setUint32(at, adler32(data))

  return out
}

const chunk = (type: string, data: Uint8Array): Uint8Array => {
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)

  view.setUint32(0, data.length)
  out.set(new TextEncoder().encode(type), 4)
  out.set(data, 8)
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))

  return out
}

/** `width` × `height` RGBA pixels, row by row, as a PNG file. */
export const encodePng = (
  width: number,
  height: number,
  rgba: Uint8Array,
  deflate: Deflate = storedDeflate,
): Uint8Array<ArrayBuffer> => {
  const header = new Uint8Array(13)
  const view = new DataView(header.buffer)

  view.setUint32(0, width)
  view.setUint32(4, height)
  header.set([8, 6, 0, 0, 0], 8)

  const stride = width * 4
  const rows = new Uint8Array(height * (stride + 1))

  for (let row = 0; row < height; row++) {
    rows.set(rgba.subarray(row * stride, (row + 1) * stride), row * (stride + 1) + 1)
  }

  const parts = [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflate(rows)),
    chunk("IEND", new Uint8Array(0)),
  ]

  const png = new Uint8Array(parts.reduce((total, part) => total + part.length, 0))
  let offset = 0

  for (const part of parts) {
    png.set(part, offset)
    offset += part.length
  }

  return png
}
