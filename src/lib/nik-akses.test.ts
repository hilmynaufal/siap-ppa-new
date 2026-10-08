import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import { bukaNik, cariLaporanByNik, laporanTerkait } from "./nik-akses";
import { enkripsiNik, indeksNik } from "./nik";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const awalan = `UjiNik${Math.random().toString(36).slice(2, 7)}`;
const sufiks = Array.from({ length: 5 }, () => "ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(Math.random() * 23)]).join("");

// NIK fiktif berbentuk benar; angka acak di bagian urut supaya tidak bentrok dengan data lain.
const urut = () => String(Math.floor(1000 + Math.random() * 8999));
const NIK_A = `32040101018${urut().slice(0, 1)}${urut()}`.slice(0, 16).padEnd(16, "1");
const NIK_B = `32040141101${urut().slice(0, 2)}${urut()}`.slice(0, 16).padEnd(16, "2");

let adminId = "";
let jenisId = "";
const ids: string[] = [];

async function laporan(kode: string, korbanNik: string, pelaporNik: string | null) {
  const l = await db.laporan.create({
    data: {
      kodePendaftaran: `PPA-261008-${sufiks}${kode}`,
      jenisKekerasanId: jenisId,
      kronologi: "Kronologi fiktif untuk pengujian akses NIK.",
      persetujuanData: true,
      persetujuanPada: new Date(),
      korban: { create: { nama: `Korban ${awalan}${kode}`, nikCipher: enkripsiNik(korbanNik), nikIndeks: indeksNik(korbanNik) } },
      pelapor: pelaporNik ? { create: { nama: `Pelapor ${awalan}${kode}`, kontak: "081200000000", nikCipher: enkripsiNik(pelaporNik), nikIndeks: indeksNik(pelaporNik) } } : undefined,
    },
  });
  ids.push(l.id);
  return l;
}

beforeAll(async () => {
  adminId = (await db.pengguna.create({ data: { nama: "Penguji NIK", email: `${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "ADMIN" } })).id;
  jenisId = (await db.jenisKekerasan.create({ data: { nama: `Jenis ${awalan}` } })).id;
});

afterAll(async () => {
  await db.logAudit.deleteMany({ where: { penggunaId: adminId } });
  await db.laporan.deleteMany({ where: { id: { in: ids } } });
  await db.jenisKekerasan.deleteMany({ where: { id: jenisId } });
  await db.pengguna.deleteMany({ where: { id: adminId } });
  await db.$disconnect();
});

describe("membuka NIK", () => {
  it("mengembalikan NIK utuh dan mencatat audit tanpa memuat NIK", async () => {
    const l = await laporan("A", NIK_A, NIK_B);
    expect(await bukaNik(db, l.id, "KORBAN", adminId)).toEqual({ ok: true, nik: NIK_A });
    expect(await bukaNik(db, l.id, "PELAPOR", adminId)).toEqual({ ok: true, nik: NIK_B });
    const log = await db.logAudit.findMany({ where: { entitasId: l.id, aksi: "LIHAT_NIK" }, orderBy: { dibuatPada: "asc" } });
    expect(log.map((x) => (x.rincian as { pihak: string }).pihak)).toEqual(["KORBAN", "PELAPOR"]);
    expect(log.every((x) => x.penggunaId === adminId)).toBe(true);
    expect(JSON.stringify(log)).not.toContain(NIK_A);
    expect(JSON.stringify(log)).not.toContain(NIK_B);
  });

  it("menolak bila laporan atau NIK tidak ada, tanpa mencatat audit", async () => {
    const l = await laporan("B", NIK_A, null);
    expect(await bukaNik(db, l.id, "PELAPOR", adminId)).toMatchObject({ ok: false, pesan: expect.stringContaining("tidak tersedia") });
    expect(await bukaNik(db, "tidak-ada", "KORBAN", adminId)).toMatchObject({ ok: false, pesan: "Laporan tidak ditemukan." });
    expect(await db.logAudit.count({ where: { entitasId: l.id, aksi: "LIHAT_NIK" } })).toBe(0);
  });
});

describe("mencari lewat NIK", () => {
  it("menemukan laporan sebagai korban maupun pelapor, dan mencatat pencarian tanpa NIK", async () => {
    const x = await laporan("C", NIK_B, null); // NIK_B sebagai korban
    const y = await laporan("D", NIK_A, NIK_B); // NIK_B sebagai pelapor
    const spasi = `${NIK_B.slice(0, 4)} ${NIK_B.slice(4, 8)}-${NIK_B.slice(8)}`;
    const h = await cariLaporanByNik(db, spasi, adminId);
    expect(h.ok && h.laporanIds).toEqual(expect.arrayContaining([x.id, y.id]));
    const log = await db.logAudit.findFirst({ where: { penggunaId: adminId, aksi: "CARI_NIK" }, orderBy: { dibuatPada: "desc" } });
    expect((log?.rincian as { jumlahHasil: number }).jumlahHasil).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(log)).not.toContain(NIK_B);
  });

  it("menolak NIK yang bentuknya salah dan tidak menemukan NIK yang tidak ada", async () => {
    expect(await cariLaporanByNik(db, "123", adminId)).toMatchObject({ ok: false });
    const h = await cariLaporanByNik(db, "3204010101990009", adminId);
    expect(h).toEqual({ ok: true, laporanIds: [] });
  });
});

describe("laporan terkait", () => {
  it("menandai laporan lain dengan NIK yang sama beserta hubungannya", async () => {
    const dasar = await laporan("E", NIK_A, null);
    const korbanSama = await laporan("F", NIK_A, null);
    const korbanJadiPelapor = await laporan("G", NIK_B, NIK_A);
    const t = await laporanTerkait(db, dasar.id);
    const peta = Object.fromEntries(t.map((x) => [x.id, x.keterangan]));
    expect(peta[korbanSama.id]).toBe("Korban yang sama");
    expect(peta[korbanJadiPelapor.id]).toBe("Korban ini pernah menjadi pelapor");
    expect(t.some((x) => x.id === dasar.id)).toBe(false);
    expect(JSON.stringify(t)).not.toContain(NIK_A);
  });
});
