import { describe, expect, it } from "vitest";
import { MASA_BERLAKU_MS, kodeDariFragmen, uraiKodeTersimpan } from "./kode-tersimpan";

describe("kodeDariFragmen", () => {
  it("membaca kode dari #kode= pada tautan Cek Tiket", () => {
    expect(kodeDariFragmen("#kode=PPA-261013-ABCDEF")).toBe("PPA-261013-ABCDEF");
    expect(kodeDariFragmen("#kode=ppa-261013-abcdef")).toBe("PPA-261013-ABCDEF");
    expect(kodeDariFragmen("#kode=PPA-261013-ABCDEF&x=1")).toBe("PPA-261013-ABCDEF");
    for (const salah of ["", "#", "#kode=", "#kode=bukan-kode", "#lain=PPA-261013-ABCDEF"]) expect(kodeDariFragmen(salah), salah).toBeNull();
  });
});

const KODE = "PPA-261013-ABCDEF";
const SEKARANG = Date.UTC(2026, 9, 13);
const isi = (sampai: unknown, kode: unknown = KODE) => JSON.stringify({ kode, sampai });

describe("uraiKodeTersimpan", () => {
  it("mengembalikan kode selama masa berlaku 1 hari", () => {
    expect(MASA_BERLAKU_MS).toBe(24 * 3600 * 1000);
    expect(uraiKodeTersimpan(isi(SEKARANG + MASA_BERLAKU_MS), SEKARANG)).toBe(KODE);
    expect(uraiKodeTersimpan(isi(SEKARANG + 1), SEKARANG)).toBe(KODE);
  });

  it("menolak yang sudah lewat, rusak, atau bukan kode pendaftaran", () => {
    expect(uraiKodeTersimpan(isi(SEKARANG), SEKARANG)).toBeNull();
    expect(uraiKodeTersimpan(isi(SEKARANG - 1), SEKARANG)).toBeNull();
    expect(uraiKodeTersimpan(KODE, SEKARANG)).toBeNull(); // format lama tanpa masa berlaku
    expect(uraiKodeTersimpan("{", SEKARANG)).toBeNull();
    expect(uraiKodeTersimpan(null, SEKARANG)).toBeNull();
    expect(uraiKodeTersimpan(isi(SEKARANG + 1000, "<script>"), SEKARANG)).toBeNull();
    expect(uraiKodeTersimpan(isi("besok"), SEKARANG)).toBeNull();
  });
});
