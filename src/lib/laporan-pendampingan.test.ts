import "dotenv/config";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import { daftarUsulan, fotoUntukPengguna, kirimLaporanPendampingan, laporanKasus, laporanSesi, revisiLaporanPendampingan, setujuiUsulan, tolakUsulan } from "./laporan-pendampingan";
import { syaratTutupKasus } from "./sesi";
import { hariJakarta } from "./tiket";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const acak = Array.from({ length: 6 }, () => "ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(Math.random() * 23)]).join("");
const awalan = `UjiLP${acak}`;
const HARI = 24 * 3600 * 1000;

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...randomBytes(16)]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...randomBytes(16)]);
const foto = (nama: string, bytes = PNG) => ({ nama, bytes });

let dir = "";
let adminId = "";
let jenisId = "";
let jenisPId = "";
let lokasiId = "";
let pendA = "";
let pendB = "";
let pendC = "";
const laporanIds: string[] = [];
let kodeUrut = 0;
let urutTiket = 0;

const isi = (extra: Record<string, unknown> = {}) => ({ jenisPendampinganId: jenisPId, keterangan: "Sesi berjalan baik.", rekomendasi: "Konseling lanjutan dua minggu lagi.", ajukanSesiLanjutan: false, alasanRevisi: "", ...extra });

async function laporanBaru(status: "TERVERIFIKASI" | "DALAM_PENDAMPINGAN" | "DITUTUP" = "DALAM_PENDAMPINGAN") {
  const n = kodeUrut++;
  const l = await db.laporan.create({
    data: {
      kodePendaftaran: `PPA-261008-${acak.slice(0, 5)}${"ABCDEFGHJKMNPQRSTUVWXYZ"[n]}`,
      jenisKekerasanId: jenisId,
      kronologi: "Kronologi fiktif untuk pengujian laporan pendampingan.",
      persetujuanData: true,
      persetujuanPada: new Date(),
      status,
    },
  });
  laporanIds.push(l.id);
  return l;
}

async function sesiBaru(laporanId: string, pendampingId = pendA, status: "TERJADWAL" | "BERLANGSUNG" | "SELESAI" | "TIDAK_HADIR" = "SELESAI", mulai = new Date()) {
  const urutan = (await db.sesi.count({ where: { laporanId } })) + 1;
  const s = await db.sesi.create({
    data: { laporanId, urutan, jenisPendampingId: jenisPId, pendampingId, lokasiId, mulai, selesai: new Date(mulai.getTime() + 3600 * 1000), status },
  });
  await db.tiket.create({
    data: {
      sesiId: s.id,
      nomorAntrean: `${awalan.slice(-6)}-${++urutTiket}-${randomBytes(2).toString("hex")}`,
      tanggal: new Date(`${hariJakarta(mulai)}T00:00:00Z`),
      urutan: 800 + urutTiket,
      lokasiId,
      jenisPendampingId: jenisPId,
      kodeCheckIn: randomBytes(12).toString("base64url"),
    },
  });
  return s;
}

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "uji-lp-"));
  adminId = (await db.pengguna.create({ data: { nama: "Penguji LP", email: `${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "ADMIN" } })).id;
  jenisId = (await db.jenisKekerasan.create({ data: { nama: `Jenis ${awalan}` } })).id;
  jenisPId = (await db.jenisPendampingan.create({ data: { kode: awalan.slice(-7), nama: `Pendampingan ${awalan}` } })).id;
  lokasiId = (await db.lokasi.create({ data: { nama: `Lokasi ${awalan}`, alamat: "Jl. Fiktif No. 5" } })).id;
  const mk = (nama: string) => db.pengguna.create({ data: { nama, email: `${nama.replace(/\s/g, "").toLowerCase()}${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "PENDAMPING", jenisPendampingId: jenisPId } });
  pendA = (await mk("Pendamping La")).id;
  pendB = (await mk("Pendamping Lb")).id;
  pendC = (await mk("Pendamping Lc")).id;
});

afterAll(async () => {
  const sesi = (await db.sesi.findMany({ where: { laporanId: { in: laporanIds } }, select: { id: true } })).map((s) => s.id);
  const lap = (await db.laporanPendampingan.findMany({ where: { sesiId: { in: sesi } }, select: { id: true } })).map((l) => l.id);
  await db.logAudit.deleteMany({ where: { OR: [{ entitasId: { in: [...sesi, ...laporanIds, ...lap] } }, { penggunaId: { in: [adminId, pendA, pendB, pendC] } }] } });
  await db.usulanSesi.deleteMany({ where: { laporanPendampinganId: { in: lap } } });
  await db.revisiLaporanPendampingan.deleteMany({ where: { laporanPendampinganId: { in: lap } } });
  await db.fotoPendampingan.deleteMany({ where: { laporanPendampinganId: { in: lap } } });
  await db.laporanPendampingan.deleteMany({ where: { id: { in: lap } } });
  await db.notifikasi.deleteMany({ where: { sesiId: { in: sesi } } });
  await db.riwayatJadwal.deleteMany({ where: { sesiId: { in: sesi } } });
  await db.tiket.deleteMany({ where: { sesiId: { in: sesi } } });
  await db.sesi.deleteMany({ where: { id: { in: sesi } } });
  await db.laporan.deleteMany({ where: { id: { in: laporanIds } } });
  await db.pengguna.deleteMany({ where: { id: { in: [pendA, pendB, pendC, adminId] } } });
  await db.lokasi.deleteMany({ where: { id: lokasiId } });
  await db.jenisPendampingan.deleteMany({ where: { id: jenisPId } });
  await db.jenisKekerasan.deleteMany({ where: { id: jenisId } });
  await db.$disconnect();
  await rm(dir, { recursive: true, force: true });
});

describe("Kirim laporan pendampingan", () => {
  it("menyimpan laporan beserta foto, tercatat di audit tanpa isi laporan", async () => {
    const l = await laporanBaru();
    const s = await sesiBaru(l.id, pendA, "SELESAI");
    const h = await kirimLaporanPendampingan(db, s.id, pendA, isi(), [foto("a.png"), foto("b.jpg", JPG)], dir);
    expect(h).toEqual({ ok: true });
    const v = await laporanSesi(db, s.id);
    expect(v?.jenis).toBe(`Pendampingan ${awalan}`);
    expect(v?.versi).toBe(1);
    expect(v?.foto).toHaveLength(2);
    expect(v?.statusUsulan).toBeNull();
    const audit = await db.logAudit.findFirstOrThrow({ where: { aksi: "KIRIM_LAPORAN_PENDAMPINGAN", entitasId: v!.id } });
    expect(JSON.stringify(audit.rincian)).not.toContain("Sesi berjalan baik");
    const dalam = await db.fotoPendampingan.findFirstOrThrow({ where: { laporanPendampinganId: v!.id } });
    expect(existsSync(path.join(dir, dalam.jalurBerkas))).toBe(true);
  });

  it("dapat diisi saat sesi berlangsung, tetapi tidak saat terjadwal, tidak hadir, atau milik pendamping lain", async () => {
    const l = await laporanBaru();
    const jalan = await sesiBaru(l.id, pendA, "BERLANGSUNG");
    expect((await kirimLaporanPendampingan(db, jalan.id, pendA, isi(), [], dir)).ok).toBe(true);
    const terjadwal = await sesiBaru(l.id, pendA, "TERJADWAL");
    expect(await kirimLaporanPendampingan(db, terjadwal.id, pendA, isi(), [], dir)).toMatchObject({ ok: false, pesan: "Laporan dapat diisi setelah sesi dimulai." });
    const absen = await sesiBaru(l.id, pendA, "TIDAK_HADIR");
    expect((await kirimLaporanPendampingan(db, absen.id, pendA, isi(), [], dir)).ok).toBe(false);
    const orang = await sesiBaru(l.id, pendB, "SELESAI");
    expect(await kirimLaporanPendampingan(db, orang.id, pendA, isi(), [], dir)).toEqual({ ok: false, pesan: "Sesi tidak ditemukan." });
  });

  it("menolak kolom wajib kosong dan jenis yang tidak ada, dengan galat per kolom", async () => {
    const l = await laporanBaru();
    const s = await sesiBaru(l.id);
    const kosong = await kirimLaporanPendampingan(db, s.id, pendA, isi({ keterangan: "  ", rekomendasi: "" }), [], dir);
    expect(kosong).toMatchObject({ ok: false, galat: { keterangan: "Keterangan pendampingan wajib diisi.", rekomendasi: "Rekomendasi tindak lanjut wajib diisi." } });
    const salah = await kirimLaporanPendampingan(db, s.id, pendA, isi({ jenisPendampinganId: "tidak-ada" }), [], dir);
    expect(salah).toMatchObject({ ok: false, galat: { jenisPendampinganId: expect.any(String) } });
    expect(await db.laporanPendampingan.count({ where: { sesiId: s.id } })).toBe(0);
  });

  it("menolak foto di luar ketentuan: format, isi berkas, ukuran, dan jumlah", async () => {
    const l = await laporanBaru();
    const s = await sesiBaru(l.id);
    const gagal = async (berkas: ReturnType<typeof foto>[]) => (await kirimLaporanPendampingan(db, s.id, pendA, isi(), berkas, dir)) as { ok: false; pesan: string };
    expect((await gagal([foto("dokumen.pdf")])).pesan).toContain("Format tidak didukung");
    expect((await gagal([foto("palsu.png", new Uint8Array([1, 2, 3, 4, 5]))])).pesan).toContain("Isi berkas bukan JPG atau PNG");
    expect((await gagal([foto("pdf-menyamar.png", new Uint8Array([0x25, 0x50, 0x44, 0x46, 1, 2]))])).pesan).toContain("Isi berkas bukan JPG atau PNG");
    const besar = new Uint8Array(5 * 1024 * 1024 + 1);
    besar.set(PNG);
    expect((await gagal([foto("besar.png", besar)])).pesan).toContain("Maksimal 5 MB");
    expect((await gagal([foto("kosong.png", new Uint8Array(0))])).pesan).toContain("Berkas kosong");
    expect((await gagal(Array.from({ length: 6 }, (_, i) => foto(`f${i}.png`)))).pesan).toBe("Maksimal 5 foto per laporan.");
    expect(await db.laporanPendampingan.count({ where: { sesiId: s.id } })).toBe(0);
    expect((await kirimLaporanPendampingan(db, s.id, pendA, isi(), Array.from({ length: 5 }, (_, i) => foto(`f${i}.png`)), dir)).ok).toBe(true);
  });

  it("terkunci: kiriman kedua ditolak dan tidak menimpa", async () => {
    const l = await laporanBaru();
    const s = await sesiBaru(l.id);
    expect((await kirimLaporanPendampingan(db, s.id, pendA, isi(), [], dir)).ok).toBe(true);
    const lagi = await kirimLaporanPendampingan(db, s.id, pendA, isi({ keterangan: "Dicoba menimpa." }), [], dir);
    expect(lagi).toMatchObject({ ok: false });
    expect((await laporanSesi(db, s.id))?.keterangan).toBe("Sesi berjalan baik.");
  });

  it("dua kiriman bersamaan: hanya satu yang tersimpan", async () => {
    const l = await laporanBaru();
    const s = await sesiBaru(l.id);
    const hasil = await Promise.all([kirimLaporanPendampingan(db, s.id, pendA, isi(), [], dir), kirimLaporanPendampingan(db, s.id, pendA, isi(), [], dir)]);
    expect(hasil.filter((h) => h.ok)).toHaveLength(1);
    expect(await db.laporanPendampingan.count({ where: { sesiId: s.id } })).toBe(1);
  });
});

describe("Revisi laporan", () => {
  it("menyimpan isi sebelumnya, alasan, dan menaikkan versi; riwayat tersusun", async () => {
    const l = await laporanBaru();
    const s = await sesiBaru(l.id);
    await kirimLaporanPendampingan(db, s.id, pendA, isi(), [foto("lama.png")], dir);
    const sebelum = await laporanSesi(db, s.id);
    const h = await revisiLaporanPendampingan(db, s.id, pendA, isi({ keterangan: "Keterangan diperbaiki.", alasanRevisi: "Menambah detail sesi." }), [], [], dir);
    expect(h).toEqual({ ok: true });
    const v = (await laporanSesi(db, s.id))!;
    expect(v.versi).toBe(2);
    expect(v.keterangan).toBe("Keterangan diperbaiki.");
    expect(v.foto).toHaveLength(1);
    const rev = await db.revisiLaporanPendampingan.findFirstOrThrow({ where: { laporanPendampinganId: v.id } });
    expect(rev).toMatchObject({ versi: 1, alasan: "Menambah detail sesi.", pengubahId: pendA });
    expect((rev.isiSebelumnya as { keterangan: string }).keterangan).toBe("Sesi berjalan baik.");
    expect(v.riwayat.map((r) => r.versi)).toEqual([2, 1]);
    expect(v.riwayat[0].alasan).toBe("Menambah detail sesi.");
    expect(v.riwayat[1].alasan).toBeNull();
    expect(v.riwayat[1].pada).toBe(sebelum!.dikirimPada);
  });

  it("wajib beralasan, hanya oleh pemilik sesi, dan hanya setelah laporan dikirim", async () => {
    const l = await laporanBaru();
    const s = await sesiBaru(l.id);
    expect(await revisiLaporanPendampingan(db, s.id, pendA, isi({ alasanRevisi: "Alasan ada." }), [], [], dir)).toEqual({ ok: false, pesan: "Laporan belum dikirim." });
    await kirimLaporanPendampingan(db, s.id, pendA, isi(), [], dir);
    expect(await revisiLaporanPendampingan(db, s.id, pendA, isi({ alasanRevisi: "" }), [], [], dir)).toMatchObject({ ok: false, galat: { alasanRevisi: expect.any(String) } });
    expect(await revisiLaporanPendampingan(db, s.id, pendB, isi({ alasanRevisi: "Bukan pemilik." }), [], [], dir)).toEqual({ ok: false, pesan: "Sesi tidak ditemukan." });
    expect((await laporanSesi(db, s.id))?.versi).toBe(1);
  });

  it("foto dapat dibuang dan ditambah dengan total tetap maksimal 5; berkas dibuang dari penyimpanan", async () => {
    const l = await laporanBaru();
    const s = await sesiBaru(l.id);
    await kirimLaporanPendampingan(db, s.id, pendA, isi(), Array.from({ length: 4 }, (_, i) => foto(`a${i}.png`)), dir);
    const awal = (await laporanSesi(db, s.id))!;
    const tambahDua = await revisiLaporanPendampingan(db, s.id, pendA, isi({ alasanRevisi: "Tambah foto." }), [foto("x.png"), foto("y.png")], [], dir);
    expect(tambahDua).toMatchObject({ ok: false, pesan: "Maksimal 5 foto per laporan." });
    const buang = awal.foto[0];
    const rec = await db.fotoPendampingan.findUniqueOrThrow({ where: { id: buang.id } });
    expect(existsSync(path.join(dir, rec.jalurBerkas))).toBe(true);
    const ok = await revisiLaporanPendampingan(db, s.id, pendA, isi({ alasanRevisi: "Ganti foto." }), [foto("x.png"), foto("y.png")], [buang.id], dir);
    expect(ok).toEqual({ ok: true });
    expect((await laporanSesi(db, s.id))?.foto).toHaveLength(5);
    expect(existsSync(path.join(dir, rec.jalurBerkas))).toBe(false);
  });

  it("dua revisi bersamaan: satu berhasil, yang lain diminta memuat ulang", async () => {
    const l = await laporanBaru();
    const s = await sesiBaru(l.id);
    await kirimLaporanPendampingan(db, s.id, pendA, isi(), [], dir);
    const hasil = await Promise.all([
      revisiLaporanPendampingan(db, s.id, pendA, isi({ keterangan: "Revisi satu.", alasanRevisi: "Revisi satu." }), [], [], dir),
      revisiLaporanPendampingan(db, s.id, pendA, isi({ keterangan: "Revisi dua.", alasanRevisi: "Revisi dua." }), [], [], dir),
    ]);
    expect(hasil.filter((h) => h.ok)).toHaveLength(1);
    expect((await laporanSesi(db, s.id))?.versi).toBe(2);
  });
});

describe("Usulan sesi lanjutan", () => {
  it("dicentang saat kirim membuat usulan menunggu yang menahan tutup kasus", async () => {
    const l = await laporanBaru();
    const s = await sesiBaru(l.id);
    await kirimLaporanPendampingan(db, s.id, pendA, isi({ ajukanSesiLanjutan: true }), [], dir);
    expect((await laporanSesi(db, s.id))?.statusUsulan).toBe("MENUNGGU");
    const u = await daftarUsulan(db, l.id);
    expect(u).toHaveLength(1);
    expect(u[0]).toMatchObject({ status: "MENUNGGU", dari: "Pendamping La", urutanSesi: 1, awal: { pendampingId: pendA, lokasiId } });
    expect((await syaratTutupKasus(db, l.id)).bisa).toBe(false);
  });

  it("revisi dapat menambah dan menarik usulan selama masih menunggu", async () => {
    const l = await laporanBaru();
    const s = await sesiBaru(l.id);
    await kirimLaporanPendampingan(db, s.id, pendA, isi(), [], dir);
    expect(await daftarUsulan(db, l.id)).toHaveLength(0);
    await revisiLaporanPendampingan(db, s.id, pendA, isi({ ajukanSesiLanjutan: true, alasanRevisi: "Ajukan lanjutan." }), [], [], dir);
    expect(await daftarUsulan(db, l.id)).toHaveLength(1);
    await revisiLaporanPendampingan(db, s.id, pendA, isi({ ajukanSesiLanjutan: false, alasanRevisi: "Ternyata tidak perlu." }), [], [], dir);
    expect(await daftarUsulan(db, l.id)).toHaveLength(0);
    expect((await syaratTutupKasus(db, l.id)).bisa).toBe(true);
  });

  it("tidak dapat diajukan pada kasus yang sudah ditutup", async () => {
    const l = await laporanBaru("DITUTUP");
    const s = await sesiBaru(l.id);
    expect(await kirimLaporanPendampingan(db, s.id, pendA, isi({ ajukanSesiLanjutan: true }), [], dir)).toMatchObject({ ok: false });
    expect((await kirimLaporanPendampingan(db, s.id, pendA, isi(), [], dir)).ok).toBe(true);
  });

  it("Admin menyetujui dan menjadwalkan: sesi baru terbit, usulan terhubung, audit tercatat", async () => {
    const l = await laporanBaru();
    const s = await sesiBaru(l.id);
    await kirimLaporanPendampingan(db, s.id, pendA, isi({ ajukanSesiLanjutan: true }), [], dir);
    const [u] = await daftarUsulan(db, l.id);
    const besok = hariJakarta(new Date(Date.now() + 3 * HARI));
    const jadwal = { jenisPendampingId: jenisPId, pendampingId: pendB, lokasiId, tanggal: besok, jamMulai: "09:00", jamSelesai: "10:00" };
    const h = await setujuiUsulan(db, u.id, adminId, jadwal);
    expect(h.ok).toBe(true);
    const baru = await db.usulanSesi.findUniqueOrThrow({ where: { id: u.id }, include: { sesiHasil: true } });
    expect(baru).toMatchObject({ status: "DISETUJUI", keputusanOlehId: adminId });
    expect(baru.sesiHasil).toMatchObject({ pendampingId: pendB, urutan: 2, laporanId: l.id });
    expect(await db.logAudit.count({ where: { aksi: "SETUJUI_USULAN_SESI", penggunaId: adminId, entitasId: baru.sesiHasilId! } })).toBe(1);
    // Sudah diputuskan: tidak dapat disetujui atau ditolak lagi, dan tidak ada sesi tambahan.
    expect(await setujuiUsulan(db, u.id, adminId, jadwal)).toEqual({ ok: false, pesan: "Usulan ini sudah diputuskan." });
    expect(await tolakUsulan(db, u.id, adminId)).toEqual({ ok: false, pesan: "Usulan ini sudah diputuskan." });
    expect(await db.sesi.count({ where: { laporanId: l.id } })).toBe(2);
    // Penarikan lewat revisi tidak berlaku untuk usulan yang sudah diputuskan.
    await revisiLaporanPendampingan(db, s.id, pendA, isi({ ajukanSesiLanjutan: false, alasanRevisi: "Mencoba menarik." }), [], [], dir);
    expect((await laporanSesi(db, s.id))?.statusUsulan).toBe("DISETUJUI");
  });

  it("jadwal tidak sah menggagalkan persetujuan: usulan tetap menunggu dan tidak ada sesi baru", async () => {
    const l = await laporanBaru();
    const s = await sesiBaru(l.id);
    await kirimLaporanPendampingan(db, s.id, pendA, isi({ ajukanSesiLanjutan: true }), [], dir);
    const [u] = await daftarUsulan(db, l.id);
    const h = await setujuiUsulan(db, u.id, adminId, { jenisPendampingId: jenisPId, pendampingId: pendB, lokasiId, tanggal: "", jamMulai: "", jamSelesai: "" });
    expect(h.ok).toBe(false);
    expect((await db.usulanSesi.findUniqueOrThrow({ where: { id: u.id } })).status).toBe("MENUNGGU");
    expect(await db.sesi.count({ where: { laporanId: l.id } })).toBe(1);
  });

  it("usulan dari kasus lain tidak dapat dipakai menjadwalkan sesi (usulan tidak berpindah kasus)", async () => {
    const l = await laporanBaru();
    const s = await sesiBaru(l.id);
    await kirimLaporanPendampingan(db, s.id, pendA, isi({ ajukanSesiLanjutan: true }), [], dir);
    const [u] = await daftarUsulan(db, l.id);
    const lain = await laporanBaru();
    const { tambahSesi } = await import("./sesi");
    const besok = hariJakarta(new Date(Date.now() + 3 * HARI));
    const h = await tambahSesi(db, lain.id, adminId, { jenisPendampingId: jenisPId, pendampingId: pendB, lokasiId, tanggal: besok, jamMulai: "11:00", jamSelesai: "12:00" }, new Date(), u.id);
    expect(h).toEqual({ ok: false, pesan: "Usulan ini sudah diputuskan." });
    expect(await db.sesi.count({ where: { laporanId: lain.id } })).toBe(0);
    expect((await db.usulanSesi.findUniqueOrThrow({ where: { id: u.id } })).status).toBe("MENUNGGU");
  });

  it("Admin menolak usulan: status berubah dan Pendamping diberi tahu", async () => {
    const l = await laporanBaru();
    const s = await sesiBaru(l.id);
    await kirimLaporanPendampingan(db, s.id, pendA, isi({ ajukanSesiLanjutan: true }), [], dir);
    const [u] = await daftarUsulan(db, l.id);
    expect(await tolakUsulan(db, u.id, adminId)).toEqual({ ok: true });
    expect((await laporanSesi(db, s.id))?.statusUsulan).toBe("DITOLAK");
    const n = await db.notifikasi.findFirstOrThrow({ where: { sesiId: s.id, penerimaId: pendA } });
    expect(n.pesan).toContain("tidak disetujui");
    expect((await syaratTutupKasus(db, l.id)).bisa).toBe(true);
  });
});

describe("Siapa dapat melihat laporan dan foto", () => {
  it("laporanKasus memuat laporan semua sesi pada kasus; foto hanya untuk Admin dan Pendamping pada kasus yang sama", async () => {
    const l = await laporanBaru();
    const sa = await sesiBaru(l.id, pendA, "SELESAI");
    const sb = await sesiBaru(l.id, pendB, "SELESAI");
    await kirimLaporanPendampingan(db, sa.id, pendA, isi(), [foto("rahasia.png")], dir);
    await sesiBaru(l.id, pendB, "TERJADWAL");
    const semua = await laporanKasus(db, l.id);
    expect(Object.keys(semua)).toEqual([sa.id]);
    expect(Object.keys(await laporanKasus(db, (await laporanBaru()).id))).toHaveLength(0);

    const fotoId = semua[sa.id].foto[0].id;
    expect(await fotoUntukPengguna(db, fotoId, { id: adminId, peran: "ADMIN" })).toMatchObject({ namaBerkas: "rahasia.png", tipeMime: "image/png" });
    expect(await fotoUntukPengguna(db, fotoId, { id: pendA, peran: "PENDAMPING" })).not.toBeNull();
    expect(await fotoUntukPengguna(db, fotoId, { id: pendB, peran: "PENDAMPING" })).not.toBeNull();
    expect(await fotoUntukPengguna(db, fotoId, { id: pendC, peran: "PENDAMPING" })).toBeNull();
    expect(await fotoUntukPengguna(db, "tidak-ada", { id: adminId, peran: "ADMIN" })).toBeNull();
    void sb;
  });
});
