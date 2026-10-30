const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/**
 * An uncompressed zip whose file data each start on a 64-byte boundary, which is what USDZ requires
 * (Apple's viewers map the files straight from the archive). Padding goes in the local header's extra
 * field, as Pixar's own packager does.
 */
export function storedZip(entries: ZipEntry[], align = 64): Uint8Array {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const headerLength = 30 + name.byteLength;
    // Extra field needs at least 4 bytes (id + size) when present
    let extra = (align - ((offset + headerLength) % align)) % align;
    if (extra > 0 && extra < 4) extra += align;

    const local = new Uint8Array(headerLength + extra + entry.data.byteLength);
    const l = new DataView(local.buffer);
    l.setUint32(0, 0x04034b50, true);
    l.setUint16(4, 20, true); // version needed
    l.setUint16(6, 0, true); // flags
    l.setUint16(8, 0, true); // stored
    l.setUint32(14, crc, true);
    l.setUint32(18, entry.data.byteLength, true);
    l.setUint32(22, entry.data.byteLength, true);
    l.setUint16(26, name.byteLength, true);
    l.setUint16(28, extra, true);
    local.set(name, 30);
    if (extra > 0) {
      l.setUint16(headerLength, 0x1986, true); // an id no reader interprets
      l.setUint16(headerLength + 2, extra - 4, true);
    }
    local.set(entry.data, headerLength + extra);

    const central = new Uint8Array(46 + name.byteLength);
    const c = new DataView(central.buffer);
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(10, 0, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, entry.data.byteLength, true);
    c.setUint32(24, entry.data.byteLength, true);
    c.setUint16(28, name.byteLength, true);
    c.setUint32(42, offset, true);
    central.set(name, 46);

    locals.push(local);
    centrals.push(central);
    offset += local.byteLength;
  }

  const centralSize = centrals.reduce((sum, c) => sum + c.byteLength, 0);
  const end = new Uint8Array(22);
  const e = new DataView(end.buffer);
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(8, entries.length, true);
  e.setUint16(10, entries.length, true);
  e.setUint32(12, centralSize, true);
  e.setUint32(16, offset, true);

  const out = new Uint8Array(offset + centralSize + end.byteLength);
  let at = 0;
  for (const part of [...locals, ...centrals, end]) {
    out.set(part, at);
    at += part.byteLength;
  }
  return out;
}
