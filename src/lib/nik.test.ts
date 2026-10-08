import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { bersihkanNik, dekripsiNik, enkripsiNik, indeksNik, nikValid, samarkanNik } from "./nik";

// Kunci uji acak per proses; tidak ada kunci nyata di berkas uji.
const KUNCI_AWAL = process.env.DATA_KEY;
beforeAll(() => {
  process.env.DATA_KEY = Buffer.alloc(32, 7).toString("base64");
});
afterEach(() => {
  process.env.DATA_KEY = Buffer.alloc(32, 7).toString("base64");
});

// NIK fiktif berbentuk benar (bukan milik siapa pun).
const NIK = "3204010101900001";
const NIK_PEREMPUAN = "3204014101900002";

describe("validasi NIK", () => {
  it("menerima 16 digit dengan tanggal (termasuk +40 perempuan) dan bulan yang masuk akal", () => {
    expect(nikValid(NIK)).toBe(true);
    expect(nikValid(NIK_PEREMPUAN)).toBe(true);
  });
  it("menolak panjang salah, huruf, tanggal atau bulan mustahil", () => {
    for (const x of ["", "123", "320401010190000", "32040101019000012", "3204010101900O01", "3204013201900001", "3204010113900001", "0004010101900001"]) {
      expect(nikValid(x), x).toBe(false);
    }
  });
  it("membersihkan spasi dan tanda hubung", () => {
    expect(bersihkanNik("3204 0101-0190.0001")).toBe(NIK);
  });
});

describe("enkripsi NIK", () => {
  it("bolak-balik utuh, hasil tidak memuat NIK, dan acak per pemanggilan", () => {
    const a = enkripsiNik(NIK);
    const b = enkripsiNik(NIK);
    expect(a).not.toContain(NIK);
    expect(a).not.toBe(b);
    expect(a.startsWith("v1.")).toBe(true);
    expect(dekripsiNik(a)).toBe(NIK);
    expect(dekripsiNik(b)).toBe(NIK);
  });
  it("menolak data yang diubah atau format asing", () => {
    const a = enkripsiNik(NIK).split(".");
    const rusak = [a[0], a[1], a[2], a[3].slice(0, -2) + (a[3].endsWith("AA") ? "BB" : "AA")].join(".");
    expect(() => dekripsiNik(rusak)).toThrow();
    expect(() => dekripsiNik("v9.a.b.c")).toThrow(/tidak dikenal/);
    expect(() => dekripsiNik("bukan")).toThrow();
  });
  it("kunci berbeda tidak dapat membuka", () => {
    const a = enkripsiNik(NIK);
    process.env.DATA_KEY = Buffer.alloc(32, 9).toString("base64");
    expect(() => dekripsiNik(a)).toThrow();
  });
  it("galat jelas bila kunci tidak diatur atau salah ukuran", () => {
    delete process.env.DATA_KEY;
    expect(() => enkripsiNik(NIK)).toThrow(/DATA_KEY belum diatur/);
    process.env.DATA_KEY = Buffer.alloc(16).toString("base64");
    expect(() => enkripsiNik(NIK)).toThrow(/32 byte/);
    if (KUNCI_AWAL === undefined) delete process.env.DATA_KEY;
  });
});

describe("indeks dan penyamaran", () => {
  it("indeks stabil untuk NIK sama, berbeda untuk NIK lain, dan bukan NIK itu sendiri", () => {
    expect(indeksNik(NIK)).toBe(indeksNik(NIK));
    expect(indeksNik(NIK)).not.toBe(indeksNik(NIK_PEREMPUAN));
    expect(indeksNik(NIK)).toMatch(/^[0-9a-f]{64}$/);
    expect(indeksNik(NIK)).not.toContain(NIK);
  });
  it("kunci indeks terpisah dari kunci enkripsi", () => {
    process.env.DATA_KEY = Buffer.alloc(32, 9).toString("base64");
    expect(indeksNik(NIK)).not.toBe((() => { process.env.DATA_KEY = Buffer.alloc(32, 7).toString("base64"); return indeksNik(NIK); })());
  });
  it("menyamarkan menyisakan 4 digit awal dan akhir", () => {
    expect(samarkanNik(NIK)).toBe("3204••••••••0001");
    expect(samarkanNik("123")).toBe("•••");
  });
});
