// Penulis berkas Excel (.xlsx) minimal tanpa pustaka luar: satu lembar, judul kolom tebal, teks apa adanya.
// .xlsx adalah arsip ZIP berisi XML; di sini arsip ditulis tanpa kompresi (metode "store").

export type SelExcel = string | number | null | undefined;

const KARAKTER_DILARANG = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

const xml = (s: string) =>
  s
    .replace(KARAKTER_DILARANG, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Nama kolom Excel dari indeks berbasis nol: 0 -> A, 26 -> AA. */
export function namaKolom(i: number): string {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

const TABEL_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(b: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = TABEL_CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(berkas: { nama: string; isi: Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder();
  const bagian: Uint8Array[] = [];
  const direktori: Uint8Array[] = [];
  let posisi = 0;
  // Tanggal DOS tetap (1980-01-01) agar keluaran deterministik.
  const jam = 0;
  const tanggal = (0 << 9) | (1 << 5) | 1;

  for (const { nama, isi } of berkas) {
    const n = enc.encode(nama);
    const crc = crc32(isi);
    const lokal = new DataView(new ArrayBuffer(30));
    lokal.setUint32(0, 0x04034b50, true);
    lokal.setUint16(4, 20, true);
    lokal.setUint16(6, 0x0800, true); // nama berkas UTF-8
    lokal.setUint16(8, 0, true); // store
    lokal.setUint16(10, jam, true);
    lokal.setUint16(12, tanggal, true);
    lokal.setUint32(14, crc, true);
    lokal.setUint32(18, isi.length, true);
    lokal.setUint32(22, isi.length, true);
    lokal.setUint16(26, n.length, true);
    lokal.setUint16(28, 0, true);
    bagian.push(new Uint8Array(lokal.buffer), n, isi);

    const pusat = new DataView(new ArrayBuffer(46));
    pusat.setUint32(0, 0x02014b50, true);
    pusat.setUint16(4, 20, true);
    pusat.setUint16(6, 20, true);
    pusat.setUint16(8, 0x0800, true);
    pusat.setUint16(10, 0, true);
    pusat.setUint16(12, jam, true);
    pusat.setUint16(14, tanggal, true);
    pusat.setUint32(16, crc, true);
    pusat.setUint32(20, isi.length, true);
    pusat.setUint32(24, isi.length, true);
    pusat.setUint16(28, n.length, true);
    pusat.setUint32(42, posisi, true);
    direktori.push(new Uint8Array(pusat.buffer), n);
    posisi += 30 + n.length + isi.length;
  }

  const ukuranDirektori = direktori.reduce((a, b) => a + b.length, 0);
  const akhir = new DataView(new ArrayBuffer(22));
  akhir.setUint32(0, 0x06054b50, true);
  akhir.setUint16(8, berkas.length, true);
  akhir.setUint16(10, berkas.length, true);
  akhir.setUint32(12, ukuranDirektori, true);
  akhir.setUint32(16, posisi, true);

  const semua = [...bagian, ...direktori, new Uint8Array(akhir.buffer)];
  const hasil = new Uint8Array(semua.reduce((a, b) => a + b.length, 0));
  let o = 0;
  for (const b of semua) {
    hasil.set(b, o);
    o += b.length;
  }
  return hasil;
}

/** Membuat berkas .xlsx satu lembar. Baris pertama (`judul`) ditebalkan dan dibekukan; teks selalu disimpan sebagai teks. */
export function buatXlsx(namaLembar: string, judul: string[], baris: SelExcel[][]): Uint8Array {
  const enc = new TextEncoder();
  const lebar = judul.map((j, c) => {
    const terpanjang = Math.max(j.length, ...baris.slice(0, 200).map((r) => String(r[c] ?? "").split("\n")[0].length));
    return Math.min(Math.max(terpanjang + 2, 10), 50);
  });

  const sel = (v: SelExcel, c: number, r: number, gaya: number) => {
    const rujukan = `${namaKolom(c)}${r}`;
    if (v === null || v === undefined || v === "") return gaya ? `<c r="${rujukan}" s="${gaya}"/>` : "";
    if (typeof v === "number" && Number.isFinite(v)) return `<c r="${rujukan}"${gaya ? ` s="${gaya}"` : ""}><v>${v}</v></c>`;
    return `<c r="${rujukan}" t="inlineStr"${gaya ? ` s="${gaya}"` : ""}><is><t xml:space="preserve">${xml(String(v))}</t></is></c>`;
  };
  const barisXml = (isi: SelExcel[], r: number, gaya: number) => `<row r="${r}">${isi.map((v, c) => sel(v, c, r, gaya)).join("")}</row>`;

  const lembar =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    `<cols>${lebar.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>` +
    `<sheetData>${barisXml(judul, 1, 1)}${baris.map((b, i) => barisXml(b, i + 2, 0)).join("")}</sheetData>` +
    `</worksheet>`;

  const berkas = [
    {
      nama: "[Content_Types].xml",
      isi:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
        `</Types>`,
    },
    {
      nama: "_rels/.rels",
      isi:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        `</Relationships>`,
    },
    {
      nama: "xl/workbook.xml",
      isi:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets><sheet name="${xml(namaLembar.replace(/[\\/?*[\]:]/g, " ").slice(0, 31))}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      nama: "xl/_rels/workbook.xml.rels",
      isi:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
        `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        `</Relationships>`,
    },
    {
      nama: "xl/styles.xml",
      isi:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
        `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
        `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
        `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
        `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
        `<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>` +
        `</styleSheet>`,
    },
    { nama: "xl/worksheets/sheet1.xml", isi: lembar },
  ];
  return zip(berkas.map((b) => ({ nama: b.nama, isi: enc.encode(b.isi) })));
}
