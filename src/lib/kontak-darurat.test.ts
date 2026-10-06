import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import {
  alihkanAktif,
  daftarKontakAdmin,
  hapusKontak,
  kontakAktifPublik,
  tambahKontak,
  ubahKontak,
} from "./kontak-darurat";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const awalan = `Uji K12 ${Date.now()}`;
let penggunaId = "";
let kecamatanId = "";

const data = (s: string, ekstra: Record<string, unknown> = {}) => ({
  instansi: `${awalan} ${s}`,
  telepon: "(022) 5890 0000",
  alamat: "Jl. Raya Soreang-Banjaran, Soreang",
  kecamatanId: "",
  ...ekstra,
});
const cari = async (s: string) => (await daftarKontakAdmin(db)).find((k) => k.instansi === `${awalan} ${s}`);

beforeAll(async () => {
  await db.kontakDarurat.deleteMany({ where: { instansi: { startsWith: awalan } } });
  penggunaId = (await db.pengguna.create({ data: { nama: "Penguji K12", email: `${awalan.replace(/\s/g, "").toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "ADMIN" } })).id;
  kecamatanId = (await db.kecamatan.findUniqueOrThrow({ where: { nama: "Soreang" } })).id;
});

afterAll(async () => {
  await db.kontakDarurat.deleteMany({ where: { instansi: { startsWith: awalan } } });
  await db.pengguna.deleteMany({ where: { id: penggunaId } });
  await db.$disconnect();
});

describe("master kontak darurat", () => {
  it("menambah kontak tingkat kabupaten (tanpa kecamatan) dan mencatat pembuat", async () => {
    expect(await tambahKontak(db, data("Kabupaten"), penggunaId)).toEqual({ ok: true });
    const k = await cari("Kabupaten");
    expect(k).toMatchObject({ aktif: true, kecamatanId: null, kecamatan: null, dibuatOleh: "Penguji K12" });
  });

  it("menambah kontak per kecamatan", async () => {
    expect(await tambahKontak(db, data("Soreang", { kecamatanId }), penggunaId)).toEqual({ ok: true });
    expect(await cari("Soreang")).toMatchObject({ kecamatan: "Soreang" });
  });

  it("memvalidasi nama, telepon, alamat, dan kecamatan", async () => {
    const h = await tambahKontak(db, { instansi: "", telepon: "abc", alamat: "x", kecamatanId: "" });
    expect(h.ok).toBe(false);
    if (!h.ok) {
      expect(h.galat).toMatchObject({
        instansi: expect.stringContaining("Nama instansi"),
        telepon: expect.stringContaining("tidak valid"),
        alamat: expect.stringContaining("Alamat"),
      });
    }
    const bukanKecamatan = await tambahKontak(db, data("Ngawur", { kecamatanId: "tidak-ada" }));
    expect(bukanKecamatan.ok).toBe(false);
    expect(await cari("Ngawur")).toBeUndefined();
  });

  it("mengubah data dan status aktif; waktu diubah bergeser", async () => {
    const sebelum = (await cari("Kabupaten"))!;
    await new Promise((r) => setTimeout(r, 20));
    expect(await ubahKontak(db, sebelum.id, data("Kabupaten", { telepon: "(022) 5890 1111" }), false)).toEqual({ ok: true });
    const sesudah = (await cari("Kabupaten"))!;
    expect(sesudah).toMatchObject({ telepon: "(022) 5890 1111", aktif: false });
    expect(new Date(sesudah.diubahPada).getTime()).toBeGreaterThan(new Date(sebelum.diubahPada).getTime());
    expect(sesudah.dibuatPada).toBe(sebelum.dibuatPada);
  });

  it("hanya kontak aktif yang tampil ke Pelapor", async () => {
    const pub = await kontakAktifPublik(db);
    expect(pub.some((k) => k.instansi === `${awalan} Soreang`)).toBe(true);
    expect(pub.some((k) => k.instansi === `${awalan} Kabupaten`)).toBe(false);
    const k = (await cari("Kabupaten"))!;
    await alihkanAktif(db, k.id, true);
    expect((await kontakAktifPublik(db)).some((x) => x.instansi === `${awalan} Kabupaten`)).toBe(true);
  });

  it("menghapus kontak dan melaporkan yang tidak ada", async () => {
    const k = (await cari("Soreang"))!;
    expect(await hapusKontak(db, k.id)).toEqual({ ok: true });
    expect(await cari("Soreang")).toBeUndefined();
    expect((await hapusKontak(db, k.id)).ok).toBe(false);
    expect((await alihkanAktif(db, "tidak-ada", true)).ok).toBe(false);
    expect((await ubahKontak(db, "tidak-ada", data("x"), true)).ok).toBe(false);
  });
});
