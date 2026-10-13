import { inflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { kondisiEkspor } from "./ekspor-laporan";
import { buatXlsx, crc32, namaKolom } from "./xlsx";

/** Membaca entri ZIP (metode store atau deflate) lewat direktori pusat, sekaligus memeriksa CRC. */
function bacaZip(b: Uint8Array) {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const akhir = b.length - 22;
  expect(v.getUint32(akhir, true)).toBe(0x06054b50);
  const jumlah = v.getUint16(akhir + 10, true);
  let o = v.getUint32(akhir + 16, true);
  const hasil: Record<string, string> = {};
  for (let i = 0; i < jumlah; i++) {
    expect(v.getUint32(o, true)).toBe(0x02014b50);
    const metode = v.getUint16(o + 10, true);
    const crc = v.getUint32(o + 16, true);
    const ukuran = v.getUint32(o + 24, true);
    const panjangNama = v.getUint16(o + 28, true);
    const posisi = v.getUint32(o + 42, true);
    const nama = new TextDecoder().decode(b.subarray(o + 46, o + 46 + panjangNama));
    const dataMulai = posisi + 30 + v.getUint16(posisi + 26, true) + v.getUint16(posisi + 28, true);
    const mentah = b.subarray(dataMulai, dataMulai + ukuran);
    const isi = metode === 8 ? new Uint8Array(inflateRawSync(mentah)) : mentah;
    expect(crc32(isi)).toBe(crc);
    hasil[nama] = new TextDecoder().decode(isi);
    o += 46 + panjangNama;
  }
  return hasil;
}

describe("xlsx", () => {
  it("crc32 sesuai nilai baku", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("nama kolom Excel", () => {
    expect([0, 25, 26, 27, 51, 52, 701, 702].map(namaKolom)).toEqual(["A", "Z", "AA", "AB", "AZ", "BA", "ZZ", "AAA"]);
  });

  it("menghasilkan arsip berisi bagian wajib .xlsx dan sel yang benar", () => {
    const berkas = bacaZip(buatXlsx("Laporan", ["Kode", "Jumlah", "Catatan"], [["PPA-1", 3, 'a & <b> "c"\nbaris dua'], ["PPA-2", null, "=CMD()"]]));
    expect(Object.keys(berkas).sort()).toEqual(["[Content_Types].xml", "_rels/.rels", "xl/_rels/workbook.xml.rels", "xl/styles.xml", "xl/workbook.xml", "xl/worksheets/sheet1.xml"]);
    const lembar = berkas["xl/worksheets/sheet1.xml"];
    expect(lembar).toContain('<c r="A1" t="inlineStr" s="1">');
    expect(lembar).toContain('<c r="B2"><v>3</v></c>');
    expect(lembar).toContain("a &amp; &lt;b&gt; &quot;c&quot;\nbaris dua");
    // Rumus tidak dieksekusi: isi selalu disimpan sebagai teks.
    expect(lembar).toContain('<c r="C3" t="inlineStr"><is><t xml:space="preserve">=CMD()</t></is></c>');
    expect(lembar).not.toContain('r="B3"');
  });

  it("membuang karakter kontrol yang membuat berkas rusak dan memotong nama lembar", () => {
    const berkas = bacaZip(buatXlsx("A/B:C".padEnd(40, "x"), ["K"], [["a\u0001b"]]));
    expect(berkas["xl/worksheets/sheet1.xml"]).toContain(">ab<");
    expect(berkas["xl/workbook.xml"]).toContain(`name="${"A B C".padEnd(31, "x")}"`);
  });
});

describe("kondisiEkspor", () => {
  it("memetakan filter yang sah dan mengabaikan yang tidak dikenal", () => {
    const k = kondisiEkspor({ status: "BARU", jenis: "Fisik", kecamatan: "Soreang", dari: "2026-10-01", sampai: "2026-10-03" });
    expect(k).toMatchObject({ status: "BARU", jenisKekerasan: { nama: "Fisik" }, korban: { kecamatan: { nama: "Soreang" } } });
    expect((k.dibuatPada as { gte: Date; lt: Date }).gte.toISOString()).toBe("2026-09-30T17:00:00.000Z");
    expect((k.dibuatPada as { gte: Date; lt: Date }).lt.toISOString()).toBe("2026-10-03T17:00:00.000Z");

    const kosong = kondisiEkspor({ status: "ASAL", dari: "kemarin", sampai: "" });
    expect(kosong).toEqual({ status: undefined, jenisKekerasan: undefined, korban: undefined, dibuatPada: undefined });
  });
});
