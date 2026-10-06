// Uji integrasi terhadap PostgreSQL (lokal: docker compose; CI: service Postgres).
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import { daftarJenis, hapusJenis, tambahJenis, ubahJenis } from "./jenis-kekerasan";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const awalan = `Uji-K7-${Date.now()}`;
const nama = (s: string) => `${awalan} ${s}`;

async function idDari(n: string) {
  return (await db.jenisKekerasan.findFirstOrThrow({ where: { nama: n } })).id;
}

let penggunaId = "";

beforeAll(async () => {
  await db.jenisKekerasan.deleteMany({ where: { nama: { startsWith: awalan } } });
  const u = await db.pengguna.create({
    data: { nama: "Penguji K7", email: `${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "ADMIN" },
  });
  penggunaId = u.id;
});

afterAll(async () => {
  await db.laporan.deleteMany({ where: { kodePendaftaran: { startsWith: awalan } } });
  await db.jenisKekerasan.deleteMany({ where: { nama: { startsWith: awalan } } });
  await db.pengguna.deleteMany({ where: { id: penggunaId } });
  await db.$disconnect();
});

describe("master jenis kekerasan", () => {
  it("menambah jenis dan menampilkannya di daftar", async () => {
    expect(await tambahJenis(db, `  ${nama("Fisik")}  `, penggunaId)).toEqual({ ok: true });
    const baris = (await daftarJenis(db)).find((j) => j.nama === nama("Fisik"));
    expect(baris).toMatchObject({ aktif: true, jumlahLaporan: 0 });
  });

  it("mencatat pembuat dan waktu dibuat; waktu diubah bergeser setelah ubah", async () => {
    const sebelum = (await daftarJenis(db)).find((j) => j.nama === nama("Fisik"))!;
    expect(sebelum.dibuatOleh).toBe("Penguji K7");
    expect(new Date(sebelum.dibuatPada).getTime()).toBeGreaterThan(Date.now() - 60_000);
    await new Promise((r) => setTimeout(r, 20));
    await ubahJenis(db, sebelum.id, nama("Fisik"), true);
    const sesudah = (await daftarJenis(db)).find((j) => j.id === sebelum.id)!;
    expect(new Date(sesudah.diubahPada).getTime()).toBeGreaterThan(new Date(sebelum.diubahPada).getTime());
    expect(sesudah.dibuatPada).toBe(sebelum.dibuatPada);
    expect(sesudah.dibuatOleh).toBe("Penguji K7");
  });

  it("menerima pembuat kosong (data lama atau skrip)", async () => {
    expect(await tambahJenis(db, nama("Tanpa pembuat"))).toEqual({ ok: true });
    const baris = (await daftarJenis(db)).find((j) => j.nama === nama("Tanpa pembuat"));
    expect(baris?.dibuatOleh).toBeNull();
  });

  it("menolak nama yang sudah terdaftar, tanpa membedakan huruf besar/kecil", async () => {
    const hasil = await tambahJenis(db, nama("FISIK").toLowerCase());
    expect(hasil).toEqual({ ok: false, pesan: `"${nama("FISIK").toLowerCase()}" sudah ada. Gunakan nama lain.` });
  });

  it("menolak nama kosong atau terlalu pendek", async () => {
    expect((await tambahJenis(db, "   ")).ok).toBe(false);
    expect((await tambahJenis(db, "a")).ok).toBe(false);
  });

  it("mengubah nama dan status aktif", async () => {
    const id = await idDari(nama("Fisik"));
    expect(await ubahJenis(db, id, nama("Fisik Berat"), false)).toEqual({ ok: true });
    const j = await db.jenisKekerasan.findUniqueOrThrow({ where: { id } });
    expect(j).toMatchObject({ nama: nama("Fisik Berat"), aktif: false });
  });

  it("mengubah tanpa mengganti nama tidak dianggap duplikat, tetapi nama milik jenis lain ditolak", async () => {
    await tambahJenis(db, nama("Psikis"));
    const id = await idDari(nama("Fisik Berat"));
    expect((await ubahJenis(db, id, nama("Fisik Berat"), true)).ok).toBe(true);
    const bentrok = await ubahJenis(db, id, nama("Psikis"), true);
    expect(bentrok.ok).toBe(false);
  });

  it("menghapus jenis yang belum dipakai", async () => {
    const id = await idDari(nama("Psikis"));
    expect(await hapusJenis(db, id)).toEqual({ ok: true });
    expect(await db.jenisKekerasan.findUnique({ where: { id } })).toBeNull();
  });

  it("tidak menghapus jenis yang sudah dipakai laporan", async () => {
    const id = await idDari(nama("Fisik Berat"));
    await db.laporan.create({
      data: {
        kodePendaftaran: `${awalan}-1`,
        namaPelapor: "Uji",
        kontakPelapor: "0",
        namaKorban: "Uji",
        jenisKekerasanId: id,
        kronologi: "uji",
        persetujuanData: true,
        persetujuanPada: new Date(),
      },
    });
    const hasil = await hapusJenis(db, id);
    expect(hasil.ok).toBe(false);
    expect(!hasil.ok && hasil.pesan).toContain("dipakai di 1 laporan");
    expect(await db.jenisKekerasan.findUnique({ where: { id } })).not.toBeNull();
  });

  it("melaporkan jenis yang tidak ada", async () => {
    expect((await hapusJenis(db, "tidak-ada")).ok).toBe(false);
    expect((await ubahJenis(db, "tidak-ada", nama("X"), true)).ok).toBe(false);
  });
});
