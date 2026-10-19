import "dotenv/config";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import { bolehAksesKasus } from "./data-bap";
import { hapusPermanen, daftarSampah, pindahkanKeSampah, pulihkanLaporan } from "./sampah";
import { daftarSesiPendamping } from "./sesi";
import { cekTiket, hariJakarta } from "./tiket";
import { daftarLaporanAdmin, detailLaporan, verifikasiLaporan } from "./verifikasi";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const acak = Array.from({ length: 6 }, () => "ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(Math.random() * 23)]).join("");
const awalan = `UjiSampah${acak}`;
let dir = "";
let adminId = "";
let pendampingId = "";
let jenisId = "";
let jenisPId = "";
let lokasiId = "";
const dibuat: string[] = [];
let urut = 0;
const besok = hariJakarta(new Date(Date.now() + 24 * 3600 * 1000));

/** Laporan terverifikasi dengan satu sesi dan tiket, plus satu berkas unggahan dan satu notifikasi. */
async function kasus() {
  const kode = `PPA-261019-${acak.slice(0, 5)}${"ABCDEFGHJKMNPQRSTUVWXYZ"[urut++]}`;
  const l = await db.laporan.create({
    data: {
      kodePendaftaran: kode,
      jenisKekerasanId: jenisId,
      kronologi: "Kronologi fiktif untuk pengujian Sampah.",
      persetujuanData: true,
      persetujuanPada: new Date(),
      pelapor: { create: { nama: "Pelapor Fiktif", kontak: "081200000000" } },
      korban: { create: { nama: "Korban Fiktif" } },
    },
  });
  dibuat.push(l.id);
  const h = await verifikasiLaporan(db, l.id, adminId, { jenisPendampingId: jenisPId, pendampingId, lokasiId, tanggal: besok, jamMulai: "09:00", jamSelesai: "10:00" });
  if (!h.ok || !h.sesiId) throw new Error("verifikasi gagal");
  mkdirSync(path.join(dir, l.id), { recursive: true });
  writeFileSync(path.join(dir, l.id, "ktp.png"), "x");
  await db.dokumenLaporan.create({ data: { laporanId: l.id, jenis: "KTP", namaBerkas: "ktp.png", jalurBerkas: path.join(l.id, "ktp.png"), tipeMime: "image/png", ukuran: 1 } });
  await db.notifikasi.create({ data: { sesiId: h.sesiId, penerima: "PELAPOR", kanal: "APLIKASI", pesan: "Uji", dikirimPada: new Date() } });
  return { id: l.id, kode, sesiId: h.sesiId };
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), "siap-ppa-sampah-"));
  adminId = (await db.pengguna.create({ data: { nama: "Admin Sampah", email: `${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "ADMIN" } })).id;
  jenisId = (await db.jenisKekerasan.create({ data: { nama: `Jenis ${awalan}` } })).id;
  jenisPId = (await db.jenisPendampingan.create({ data: { kode: awalan.slice(-7), nama: `Pendampingan ${awalan}` } })).id;
  lokasiId = (await db.lokasi.create({ data: { nama: `Lokasi ${awalan}`, alamat: "Jl. Fiktif No. 2" } })).id;
  pendampingId = (await db.pengguna.create({ data: { nama: "Pendamping Sampah", email: `p${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "PENDAMPING", jenisPendampingId: jenisPId } })).id;
});

afterAll(async () => {
  const sesi = (await db.sesi.findMany({ where: { laporanId: { in: dibuat } }, select: { id: true } })).map((s) => s.id);
  await db.logAudit.deleteMany({ where: { OR: [{ entitasId: { in: [...dibuat, ...sesi] } }, { penggunaId: adminId }] } });
  await db.notifikasi.deleteMany({ where: { sesiId: { in: sesi } } });
  await db.tiket.deleteMany({ where: { sesiId: { in: sesi } } });
  await db.sesi.deleteMany({ where: { id: { in: sesi } } });
  await db.laporan.deleteMany({ where: { id: { in: dibuat } } });
  await db.pengguna.deleteMany({ where: { id: { in: [pendampingId, adminId] } } });
  await db.lokasi.deleteMany({ where: { id: lokasiId } });
  await db.jenisPendampingan.deleteMany({ where: { id: jenisPId } });
  await db.jenisKekerasan.deleteMany({ where: { id: jenisId } });
  await db.$disconnect();
  rmSync(dir, { recursive: true, force: true });
});

describe("Sampah laporan", () => {
  it("alasan wajib; laporan di Sampah hilang dari daftar, Cek Tiket, jadwal Pendamping, dan akses BAP", async () => {
    const k = await kasus();
    expect(await pindahkanKeSampah(db, k.id, adminId, "x")).toMatchObject({ ok: false });
    expect(await pindahkanKeSampah(db, k.id, adminId, "Laporan uji ganda")).toEqual({ ok: true });
    expect(await pindahkanKeSampah(db, k.id, adminId, "Laporan uji ganda")).toMatchObject({ ok: false });

    expect((await daftarLaporanAdmin(db)).some((l) => l.id === k.id)).toBe(false);
    expect((await cekTiket(db, k.kode)).ok).toBe(false);
    expect((await daftarSesiPendamping(db, pendampingId)).some((s) => s.id === k.sesiId)).toBe(false);
    expect(await bolehAksesKasus(db, { id: pendampingId, peran: "PENDAMPING" }, k.id)).toBe(false);

    // Detail masih dapat dibuka Admin dengan keterangan Sampah; Sampah memuat alasannya.
    expect((await detailLaporan(db, k.id))?.sampah).toMatchObject({ oleh: "Admin Sampah", alasan: "Laporan uji ganda" });
    expect((await daftarSampah(db)).find((s) => s.id === k.id)).toMatchObject({ kode: k.kode, alasan: "Laporan uji ganda" });
    expect(await db.logAudit.count({ where: { entitasId: k.id, aksi: "HAPUS_LAPORAN" } })).toBe(1);
  });

  it("dipulihkan: kembali tampil seperti semula", async () => {
    const k = await kasus();
    await pindahkanKeSampah(db, k.id, adminId, "Salah hapus");
    expect(await pulihkanLaporan(db, k.id, adminId)).toEqual({ ok: true });
    expect(await pulihkanLaporan(db, k.id, adminId)).toMatchObject({ ok: false });
    expect((await daftarLaporanAdmin(db)).some((l) => l.id === k.id)).toBe(true);
    expect((await cekTiket(db, k.kode)).ok).toBe(true);
    expect((await detailLaporan(db, k.id))?.sampah).toBeNull();
  });

  it("hapus permanen hanya dari Sampah; data, sesi, tiket, dan berkas hilang, audit tetap", async () => {
    const k = await kasus();
    expect(await hapusPermanen(db, k.id, adminId, dir)).toMatchObject({ ok: false });
    expect(await db.laporan.count({ where: { id: k.id } })).toBe(1);

    await pindahkanKeSampah(db, k.id, adminId, "Laporan uji");
    expect(await hapusPermanen(db, k.id, adminId, dir)).toEqual({ ok: true });
    expect(await db.laporan.count({ where: { id: k.id } })).toBe(0);
    expect(await db.sesi.count({ where: { id: k.sesiId } })).toBe(0);
    expect(await db.tiket.count({ where: { sesiId: k.sesiId } })).toBe(0);
    expect(await db.notifikasi.count({ where: { sesiId: k.sesiId } })).toBe(0);
    expect(await db.dokumenLaporan.count({ where: { laporanId: k.id } })).toBe(0);
    expect(existsSync(path.join(dir, k.id))).toBe(false);
    const audit = await db.logAudit.findFirstOrThrow({ where: { entitasId: k.id, aksi: "HAPUS_PERMANEN_LAPORAN" } });
    expect(audit.rincian).toMatchObject({ kode: k.kode, jumlahSesi: 1 });
    expect(await db.logAudit.count({ where: { entitasId: k.id, aksi: "VERIFIKASI_LAPORAN" } })).toBe(1);
  });
});
