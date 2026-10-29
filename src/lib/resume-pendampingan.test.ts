import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import { judulResume, muatResume } from "./resume-pendampingan";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const acak = Array.from({ length: 6 }, () => "ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(Math.random() * 23)]).join("");

let adminId = "";
let pendId = "";
let jenisKId = "";
let jenisA = "";
let jenisB = "";
let lokasiId = "";
let laporanId = "";
let urut = 0;

async function sesi(jenisId: string, mulai: string, status: "TERJADWAL" | "SELESAI" | "TIDAK_HADIR" | "DIBATALKAN", laporan?: { keterangan: string; rekomendasi: string; dikirim: boolean }) {
  const m = new Date(mulai);
  const s = await db.sesi.create({ data: { laporanId, urutan: ++urut, jenisPendampingId: jenisId, pendampingId: pendId, lokasiId, mulai: m, selesai: new Date(m.getTime() + 3600e3), status } });
  if (laporan) {
    await db.laporanPendampingan.create({
      data: { sesiId: s.id, penulisId: pendId, jenisPendampingan: "uji", keterangan: laporan.keterangan, rekomendasi: laporan.rekomendasi, dikirimPada: laporan.dikirim ? m : null },
    });
  }
}

beforeAll(async () => {
  adminId = (await db.pengguna.create({ data: { nama: "Admin Resume", email: `adm${acak.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "ADMIN" } })).id;
  pendId = (await db.pengguna.create({ data: { nama: "Pendamping Resume", email: `pnd${acak.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "PENDAMPING" } })).id;
  jenisKId = (await db.jenisKekerasan.create({ data: { nama: `Jenis Resume ${acak}` } })).id;
  jenisA = (await db.jenisPendampingan.create({ data: { kode: `RA${acak}`, nama: `Psikologis ${acak}` } })).id;
  jenisB = (await db.jenisPendampingan.create({ data: { kode: `RB${acak}`, nama: `Pendampingan Hukum ${acak}` } })).id;
  lokasiId = (await db.lokasi.create({ data: { nama: `Lokasi Resume ${acak}`, alamat: "Jl. Fiktif 2" } })).id;
  const kec = await db.kecamatan.findFirstOrThrow();
  laporanId = (
    await db.laporan.create({
      data: {
        kodePendaftaran: `PPA-261029-${acak}`,
        jenisKekerasanId: jenisKId,
        kronologi: "Kronologi fiktif untuk pengujian resume.",
        persetujuanData: true,
        persetujuanPada: new Date(),
        status: "DALAM_PENDAMPINGAN",
        lembagaRujukan: "Unit PPA Polresta (uji)",
        korban: { create: { nama: "Klien Fiktif", tempatLahir: "Soreang", tanggalLahir: new Date("2012-05-20T00:00:00Z"), alamat: "Jl. Fiktif 1", kecamatanId: kec.id } },
      },
    })
  ).id;

  // Jenis A: dua sesi masuk resume (selesai+terkirim, tidak hadir); draf, terjadwal, dan batal tidak.
  await sesi(jenisA, "2026-10-01T02:00:00Z", "SELESAI", { keterangan: "Asesmen awal.", rekomendasi: "Konseling lanjutan.", dikirim: true });
  await sesi(jenisA, "2026-10-08T02:00:00Z", "TIDAK_HADIR");
  await sesi(jenisA, "2026-10-15T02:00:00Z", "SELESAI", { keterangan: "Masih draf.", rekomendasi: "-", dikirim: false });
  await sesi(jenisA, "2026-10-22T02:00:00Z", "TERJADWAL");
  await sesi(jenisA, "2026-10-23T02:00:00Z", "DIBATALKAN");
  // Jenis B dijadwalkan setelah A.
  await sesi(jenisB, "2026-10-05T02:00:00Z", "SELESAI", { keterangan: "Konsultasi hukum.", rekomendasi: "Pendampingan BAP polisi.", dikirim: true });
});

afterAll(async () => {
  await db.laporanPendampingan.deleteMany({ where: { sesi: { laporanId } } });
  await db.sesi.deleteMany({ where: { laporanId } });
  await db.logAudit.deleteMany({ where: { entitasId: laporanId } });
  await db.laporan.deleteMany({ where: { id: laporanId } });
  await db.jenisPendampingan.deleteMany({ where: { id: { in: [jenisA, jenisB] } } });
  await db.jenisKekerasan.deleteMany({ where: { id: jenisKId } });
  await db.lokasi.deleteMany({ where: { id: lokasiId } });
  await db.pengguna.deleteMany({ where: { id: { in: [adminId, pendId] } } });
  await db.$disconnect();
});

describe("judulResume", () => {
  it("judul mengikuti nama jenis pendampingan", () => {
    expect(judulResume("Psikologis")).toBe("RESUME PENDAMPINGAN PSIKOLOGIS");
    expect(judulResume("Pendampingan hukum")).toBe("RESUME PENDAMPINGAN HUKUM");
  });
});

describe("muatResume", () => {
  it("bawaan jenis pertama; hanya sesi selesai yang terkirim dan sesi tidak hadir, urut tanggal", async () => {
    const r = (await muatResume(db, laporanId, undefined, adminId))!;
    expect(r.daftarJenis.map((j) => j.id)).toEqual([jenisA, jenisB]);
    expect(r.jenis?.id).toBe(jenisA);
    expect(r.judul).toBe(`RESUME PENDAMPINGAN PSIKOLOGIS ${acak}`);
    expect(r.baris).toEqual([
      { no: 1, tanggal: "1 Oktober 2026", tidakHadir: false, keterangan: "Asesmen awal.", rekomendasi: "Konseling lanjutan." },
      { no: 2, tanggal: "8 Oktober 2026", tidakHadir: true, keterangan: "", rekomendasi: "" },
    ]);
  });

  it("identitas klien dan rujukan terisi; pembukaan tercatat di audit", async () => {
    const r = (await muatResume(db, laporanId, jenisB, pendId))!;
    expect(r.jenis?.id).toBe(jenisB);
    expect(r.baris.map((b) => b.keterangan)).toEqual(["Konsultasi hukum."]);
    expect(r.klien).toMatchObject({ nama: "Klien Fiktif", ttl: "Soreang, 20 Mei 2012", alamat: expect.stringContaining("Jl. Fiktif 1") });
    expect(r.klien.usia).toMatch(/^\d+ tahun$/);
    expect(r.rujukan).toBe("Unit PPA Polresta (uji)");
    expect(await db.logAudit.count({ where: { entitasId: laporanId, aksi: "CETAK_RESUME_PENDAMPINGAN" } })).toBeGreaterThanOrEqual(2);
  });

  it("jenis yang tidak ada pada kasus kembali ke jenis pertama; laporan di Sampah tidak dapat dibuka", async () => {
    expect((await muatResume(db, laporanId, "tidak-ada", adminId))!.jenis?.id).toBe(jenisA);
    await db.laporan.update({ where: { id: laporanId }, data: { dihapusPada: new Date() } });
    expect(await muatResume(db, laporanId, undefined, adminId)).toBeNull();
    await db.laporan.update({ where: { id: laporanId }, data: { dihapusPada: null } });
  });
});
