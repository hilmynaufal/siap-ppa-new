import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import { hariJakarta } from "./tiket";
import { daftarLaporanAdmin, detailLaporan, tolakLaporan, verifikasiLaporan } from "./verifikasi";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const awalan = `UJIK9${Date.now()}`;
let adminId = "";
let jenisId = "";
let jenisPId = "";
let lokasiId = "";
let pendampingId = "";
const dibuat: string[] = [];
const besok = hariJakarta(new Date(Date.now() + 24 * 3600 * 1000));
const jadwal = (ekstra: Record<string, string> = {}) => ({
  jenisPendampingId: jenisPId,
  pendampingId,
  lokasiId,
  tanggal: besok,
  jamMulai: "09:00",
  jamSelesai: "10:00",
  ...ekstra,
});

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
  jenisPId = (await db.jenisPendampingan.create({ data: { kode: awalan.slice(-8), nama: `Pendampingan ${awalan}` } })).id;
  lokasiId = (await db.lokasi.create({ data: { nama: `Lokasi ${awalan}`, alamat: "Jl. Fiktif No. 1" } })).id;
  pendampingId = (await db.pengguna.create({ data: { nama: "Pendamping K9", email: `p${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "PENDAMPING", jenisPendampingId: jenisPId } })).id;
});

afterAll(async () => {
  await db.logAudit.deleteMany({ where: { entitasId: { in: dibuat } } });
  await db.tiket.deleteMany({ where: { sesi: { laporanId: { in: dibuat } } } });
  await db.sesi.deleteMany({ where: { laporanId: { in: dibuat } } });
  await db.laporan.deleteMany({ where: { id: { in: dibuat } } });
  await db.pengguna.deleteMany({ where: { id: pendampingId } });
  await db.lokasi.deleteMany({ where: { id: lokasiId } });
  await db.jenisPendampingan.deleteMany({ where: { id: jenisPId } });
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
    const h = await verifikasiLaporan(db, id, adminId, jadwal());
    expect(h).toEqual({ ok: true, nomorAntrean: expect.stringMatching(/^[A-Z0-9]+-\d{8}-001$/) });
    const d = await detailLaporan(db, id);
    expect(d).toMatchObject({ status: "TERVERIFIKASI", verifikator: "Penguji K9", alasanPenolakan: null });
    expect(d?.diverifikasiPada).not.toBeNull();
    const log = await db.logAudit.findFirst({ where: { entitasId: id } });
    expect(log).toMatchObject({ aksi: "VERIFIKASI_LAPORAN", penggunaId: adminId, entitas: "Laporan" });
    const sesi = await db.sesi.findFirstOrThrow({ where: { laporanId: id }, include: { tiket: true } });
    expect(sesi).toMatchObject({ urutan: 1, pendampingId, lokasiId, status: "TERJADWAL" });
    expect(sesi.tiket?.nomorAntrean).toBe((h as { nomorAntrean: string }).nomorAntrean);
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
    const hasil = await Promise.all([verifikasiLaporan(db, id, adminId, jadwal()), tolakLaporan(db, id, adminId, "Alasan penolakan cukup panjang.")]);
    expect(hasil.filter((h) => h.ok)).toHaveLength(1);
    expect(hasil.filter((h) => !h.ok)).toHaveLength(1);
    expect(await db.logAudit.count({ where: { entitasId: id } })).toBe(1);
    const ulang = await verifikasiLaporan(db, id, adminId, jadwal());
    expect(ulang).toMatchObject({ ok: false });
  });

  it("laporan yang tidak ada ditolak dengan pesan jelas", async () => {
    expect(await verifikasiLaporan(db, "tidak-ada", adminId, jadwal())).toEqual({ ok: false, pesan: "Laporan tidak ditemukan." });
  });

  it("jadwal tidak lengkap atau tidak valid ditolak dan laporan tetap BARU tanpa sesi", async () => {
    const id = await laporanBaru("e");
    const kosong = await verifikasiLaporan(db, id, adminId, {});
    expect(kosong).toMatchObject({ ok: false, galat: { pendampingId: expect.any(String), tanggal: expect.any(String), jamMulai: expect.any(String) } });
    const kemarin = hariJakarta(new Date(Date.now() - 24 * 3600 * 1000));
    expect(await verifikasiLaporan(db, id, adminId, jadwal({ tanggal: kemarin }))).toMatchObject({ ok: false, galat: { tanggal: expect.stringContaining("sebelum hari ini") } });
    expect(await verifikasiLaporan(db, id, adminId, jadwal({ jamSelesai: "08:00" }))).toMatchObject({ ok: false, galat: { jamSelesai: expect.stringContaining("setelah jam mulai") } });
    expect(await verifikasiLaporan(db, id, adminId, jadwal({ pendampingId: "tidak-ada" }))).toMatchObject({ ok: false, galat: { pendampingId: expect.any(String) } });
    expect(await verifikasiLaporan(db, id, adminId, jadwal({ lokasiId: "tidak-ada" }))).toMatchObject({ ok: false, galat: { lokasiId: expect.any(String) } });
    expect((await detailLaporan(db, id))?.status).toBe("BARU");
    expect(await db.sesi.count({ where: { laporanId: id } })).toBe(0);
  });

  it("nomor antrean berurutan per jenis per hari, juga untuk penerbitan bersamaan", async () => {
    const ids = await Promise.all(["f", "g", "h", "i"].map(laporanBaru));
    const hasil = await Promise.all(ids.map((id) => verifikasiLaporan(db, id, adminId, jadwal({ jamMulai: "13:00", jamSelesai: "14:00" }))));
    expect(hasil.every((h) => h.ok)).toBe(true);
    const nomor = hasil.map((h) => (h as { nomorAntrean: string }).nomorAntrean);
    expect(new Set(nomor).size).toBe(4);
    const urutan = (await db.tiket.findMany({ where: { sesi: { laporanId: { in: ids } } }, select: { urutan: true } })).map((t) => t.urutan).sort((a, b) => a - b);
    expect(urutan[3] - urutan[0]).toBe(3);
  });
});
