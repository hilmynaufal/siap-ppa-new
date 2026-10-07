import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import { daftarLaporanAdmin, detailLaporan, tolakLaporan, verifikasiLaporan } from "./verifikasi";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const awalan = `UJIK9${Date.now()}`;
let adminId = "";
let jenisId = "";
const dibuat: string[] = [];

async function laporanBaru(s: string) {
  const l = await db.laporan.create({
    data: {
      kodePendaftaran: `${awalan}-${s}`,
      namaPelapor: "Pelapor Fiktif",
      kontakPelapor: "081200000000",
      namaKorban: `Korban ${s}`,
      jenisKekerasanId: jenisId,
      kronologi: "Kronologi fiktif untuk pengujian verifikasi.",
      persetujuanData: true,
      persetujuanPada: new Date(),
    },
  });
  dibuat.push(l.id);
  return l.id;
}

beforeAll(async () => {
  adminId = (await db.pengguna.create({ data: { nama: "Penguji K9", email: `${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "ADMIN" } })).id;
  jenisId = (await db.jenisKekerasan.create({ data: { nama: `Jenis ${awalan}` } })).id;
});

afterAll(async () => {
  await db.logAudit.deleteMany({ where: { entitasId: { in: dibuat } } });
  await db.laporan.deleteMany({ where: { id: { in: dibuat } } });
  await db.jenisKekerasan.deleteMany({ where: { id: jenisId } });
  await db.pengguna.deleteMany({ where: { id: adminId } });
  await db.$disconnect();
});

describe("verifikasi laporan", () => {
  it("daftar memuat laporan baru dengan status BARU dan detailnya lengkap", async () => {
    const id = await laporanBaru("a");
    const baris = (await daftarLaporanAdmin(db)).find((l) => l.id === id);
    expect(baris).toMatchObject({ kode: `${awalan}-a`, status: "BARU", jenis: `Jenis ${awalan}` });
    const d = await detailLaporan(db, id);
    expect(d).toMatchObject({ namaKorban: "Korban a", namaPelapor: "Pelapor Fiktif", dokumen: [] });
    expect(await detailLaporan(db, "tidak-ada")).toBeNull();
  });

  it("verifikasi mengubah status, mencatat verifikator dan audit", async () => {
    const id = await laporanBaru("b");
    expect(await verifikasiLaporan(db, id, adminId)).toEqual({ ok: true });
    const d = await detailLaporan(db, id);
    expect(d).toMatchObject({ status: "TERVERIFIKASI", verifikator: "Penguji K9", alasanPenolakan: null });
    expect(d?.diverifikasiPada).not.toBeNull();
    const log = await db.logAudit.findFirst({ where: { entitasId: id } });
    expect(log).toMatchObject({ aksi: "VERIFIKASI_LAPORAN", penggunaId: adminId, entitas: "Laporan" });
  });

  it("penolakan wajib beralasan, tersimpan, dan tercatat di audit", async () => {
    const id = await laporanBaru("c");
    for (const alasan of ["", "   ", "pendek", "x".repeat(501)]) {
      const h = await tolakLaporan(db, id, adminId, alasan);
      expect(h.ok).toBe(false);
    }
    expect((await detailLaporan(db, id))?.status).toBe("BARU");
    expect(await tolakLaporan(db, id, adminId, "  Data korban tidak dapat dihubungi.  ")).toEqual({ ok: true });
    const d = await detailLaporan(db, id);
    expect(d).toMatchObject({ status: "DITOLAK", alasanPenolakan: "Data korban tidak dapat dihubungi." });
    const log = await db.logAudit.findFirst({ where: { entitasId: id } });
    expect(log).toMatchObject({ aksi: "TOLAK_LAPORAN", rincian: { alasan: "Data korban tidak dapat dihubungi." } });
  });

  it("laporan yang sudah diproses tidak dapat diproses ulang, termasuk saat bersamaan", async () => {
    const id = await laporanBaru("d");
    const hasil = await Promise.all([verifikasiLaporan(db, id, adminId), tolakLaporan(db, id, adminId, "Alasan penolakan cukup panjang.")]);
    expect(hasil.filter((h) => h.ok)).toHaveLength(1);
    expect(hasil.filter((h) => !h.ok)).toHaveLength(1);
    expect(await db.logAudit.count({ where: { entitasId: id } })).toBe(1);
    const ulang = await verifikasiLaporan(db, id, adminId);
    expect(ulang).toMatchObject({ ok: false });
  });

  it("laporan yang tidak ada ditolak dengan pesan jelas", async () => {
    expect(await verifikasiLaporan(db, "tidak-ada", adminId)).toEqual({ ok: false, pesan: "Laporan tidak ditemukan." });
  });
});
