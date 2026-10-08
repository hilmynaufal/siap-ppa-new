import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import { hapusDesa, imporDesa, periksaImporDesa, tambahDesa, ubahDesa, daftarDesa, TEMPLAT_DESA_CSV } from "./desa";
import { alihkanReferensi, daftarReferensi, hapusReferensi, pilihanReferensi, tambahReferensi, ubahReferensi } from "./referensi";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const acak = Array.from({ length: 5 }, () => "ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(Math.random() * 23)]).join("");
const awalan = `UjiRef ${acak}`;

afterAll(async () => {
  await db.hubunganKorban.deleteMany({ where: { nama: { startsWith: awalan } } });
  await db.pekerjaan.deleteMany({ where: { nama: { startsWith: awalan } } });
  await db.desa.deleteMany({ where: { nama: { startsWith: awalan } } });
  await db.$disconnect();
});

describe("nilai awal", () => {
  it("hubungan dan pekerjaan terisi dari migrasi, 'Lainnya' paling akhir", async () => {
    for (const j of ["hubungan", "pekerjaan"] as const) {
      const d = await daftarReferensi(db, j);
      expect(d.length).toBeGreaterThanOrEqual(10);
      expect(d.at(-1)?.nama).toBe("Lainnya");
    }
  });
});

describe.each(["hubungan", "pekerjaan"] as const)("referensi %s", (jenis) => {
  it("tambah, duplikat tanpa peduli huruf besar, validasi", async () => {
    expect(await tambahReferensi(db, jenis, { nama: `${awalan} A`, urutan: "5" })).toEqual({ ok: true });
    expect(await tambahReferensi(db, jenis, { nama: `${awalan.toUpperCase()} a` })).toMatchObject({ ok: false, galat: { nama: expect.stringContaining("sudah ada") } });
    expect(await tambahReferensi(db, jenis, { nama: "x" })).toMatchObject({ ok: false, galat: { nama: expect.any(String) } });
    expect(await tambahReferensi(db, jenis, { nama: `${awalan} B`, urutan: "1000" })).toMatchObject({ ok: false, galat: { urutan: expect.any(String) } });
  });

  it("ubah, nonaktifkan (hilang dari pilihan formulir), dan hapus", async () => {
    const a = (await daftarReferensi(db, jenis)).find((r) => r.nama === `${awalan} A`)!;
    expect(a.urutan).toBe(5);
    expect(await ubahReferensi(db, jenis, a.id, { nama: `${awalan} A2`, urutan: "6" }, true)).toEqual({ ok: true });
    expect((await pilihanReferensi(db, jenis)).some((p) => p.id === a.id)).toBe(true);
    expect(await alihkanReferensi(db, jenis, a.id, false)).toEqual({ ok: true });
    expect((await pilihanReferensi(db, jenis)).some((p) => p.id === a.id)).toBe(false);
    expect((await daftarReferensi(db, jenis)).some((p) => p.id === a.id)).toBe(true);
    expect(await hapusReferensi(db, jenis, a.id)).toEqual({ ok: true });
    expect(await hapusReferensi(db, jenis, a.id)).toMatchObject({ ok: false });
  });
});

describe("desa", () => {
  it("tambah, ubah, hapus, dan batasan nama per kecamatan", async () => {
    const kec = await db.kecamatan.findUniqueOrThrow({ where: { nama: "Soreang" } });
    const lain = await db.kecamatan.findUniqueOrThrow({ where: { nama: "Banjaran" } });
    expect(await tambahDesa(db, { kecamatanId: kec.id, nama: `${awalan} Desa`, kode: "" })).toEqual({ ok: true });
    expect(await tambahDesa(db, { kecamatanId: kec.id, nama: `${awalan} Desa`, kode: "" })).toMatchObject({ ok: false, galat: { nama: expect.stringContaining("sudah ada") } });
    expect(await tambahDesa(db, { kecamatanId: lain.id, nama: `${awalan} Desa`, kode: "" })).toEqual({ ok: true });
    expect(await tambahDesa(db, { kecamatanId: kec.id, nama: `${awalan} X`, kode: "abc" })).toMatchObject({ ok: false, galat: { kode: expect.any(String) } });
    const d = (await daftarDesa(db)).find((x) => x.nama === `${awalan} Desa` && x.kecamatan === "Soreang")!;
    expect(await ubahDesa(db, d.id, { kecamatanId: kec.id, nama: `${awalan} Desa 2`, kode: "99.99.99.9999" })).toEqual({ ok: true });
    expect(await tambahDesa(db, { kecamatanId: lain.id, nama: `${awalan} Lain`, kode: "99.99.99.9999" })).toMatchObject({ ok: false, galat: { kode: expect.stringContaining("sudah dipakai") } });
    expect(await hapusDesa(db, d.id)).toEqual({ ok: true });
  });

  it("impor CSV: memeriksa tanpa menulis, semua atau tidak sama sekali, melewati yang sudah ada", async () => {
    const buruk = `kecamatan;desa;kode\r\nSoreang;${awalan} Impor 1;\r\nTidak Ada;${awalan} Impor 2;\r\nSoreang;;`;
    const p = await periksaImporDesa(db, buruk);
    expect(p.ok).toBe(false);
    expect(p.galat.map((g) => g.baris)).toEqual([3, 4]);
    expect((await imporDesa(db, buruk)).ok).toBe(false);
    expect(await db.desa.count({ where: { nama: { startsWith: `${awalan} Impor` } } })).toBe(0);

    const baik = `kecamatan;desa;kode\r\nSoreang;${awalan} Impor 1;\r\nsoreang;${awalan} Impor 1;\r\nBanjaran;${awalan} Impor 2;`;
    expect(await imporDesa(db, baik)).toMatchObject({ ok: true, ditambah: 2, dilewati: 1 });
    expect(await imporDesa(db, baik)).toMatchObject({ ok: true, ditambah: 0, dilewati: 3 });
    expect(await periksaImporDesa(db, "kecamatan;nama\nA;B")).toMatchObject({ ok: false, pesan: expect.stringContaining("Kolom tidak ditemukan") });
    expect(TEMPLAT_DESA_CSV.split("\r\n")[0]).toBe("kecamatan;desa;kode");
  });
});
