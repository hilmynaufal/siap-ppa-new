import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import { daftarJadwalAdmin, notifikasiPendamping, riwayatJadwal, tandaiDibaca, ubahJadwal } from "./jadwal";
import { cekTiket, hariJakarta } from "./tiket";
import { verifikasiLaporan } from "./verifikasi";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
// Acak (bukan dari jam) agar berkas uji yang berjalan paralel tidak menghasilkan kode pendaftaran yang sama.
const sufiks = Array.from({ length: 6 }, () => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 31)]).join("");
const awalan = `UJIJ${sufiks}`;
let adminId = "";
let jenisId = "";
let jenisPId = "";
let jenisLainId = "";
let lokasiId = "";
let pendA = "";
let pendB = "";
let pendLain = "";
const dibuat: string[] = [];
const hari = (n: number) => hariJakarta(new Date(Date.now() + n * 24 * 3600 * 1000));
let nomorKode = 0;

async function sesiBaru() {
  const n = nomorKode++;
  const l = await db.laporan.create({
    data: {
      kodePendaftaran: `PPA-261007-${sufiks.padEnd(5, "X").slice(0, 5)}${"ABCDEFGHJK"[n]}`,
      namaPelapor: "Pelapor Fiktif",
      kontakPelapor: "081200000000",
      namaKorban: `Korban ${awalan}${n}`,
      jenisKekerasanId: jenisId,
      kronologi: "Kronologi fiktif untuk pengujian jadwal.",
      persetujuanData: true,
      persetujuanPada: new Date(),
    },
  });
  dibuat.push(l.id);
  const h = await verifikasiLaporan(db, l.id, adminId, {
    jenisPendampingId: jenisPId,
    pendampingId: pendA,
    lokasiId,
    tanggal: hari(3),
    jamMulai: "09:00",
    jamSelesai: "10:00",
  });
  expect(h.ok).toBe(true);
  const sesi = await db.sesi.findFirstOrThrow({ where: { laporanId: l.id }, include: { tiket: true } });
  return { laporan: l, sesi };
}

const ubahData = (ekstra: Record<string, string> = {}) => ({
  pendampingId: pendA,
  tanggal: hari(3),
  jamMulai: "09:00",
  jamSelesai: "10:00",
  alasan: "Permintaan Pelapor.",
  ...ekstra,
});

beforeAll(async () => {
  adminId = (await db.pengguna.create({ data: { nama: "Penguji J", email: `${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "ADMIN" } })).id;
  jenisId = (await db.jenisKekerasan.create({ data: { nama: `Jenis ${awalan}` } })).id;
  jenisPId = (await db.jenisPendampingan.create({ data: { kode: awalan.slice(-7), nama: `Pendampingan ${awalan}` } })).id;
  jenisLainId = (await db.jenisPendampingan.create({ data: { kode: `L${awalan.slice(-6)}`, nama: `Lain ${awalan}` } })).id;
  lokasiId = (await db.lokasi.create({ data: { nama: `Lokasi ${awalan}`, alamat: "Jl. Fiktif No. 3" } })).id;
  const mk = (nama: string, jenis: string) =>
    db.pengguna.create({ data: { nama, email: `${nama.replace(/\s/g, "").toLowerCase()}${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "PENDAMPING", jenisPendampingId: jenis } });
  pendA = (await mk("Pendamping Ja", jenisPId)).id;
  pendB = (await mk("Pendamping Jb", jenisPId)).id;
  pendLain = (await mk("Pendamping Jc", jenisLainId)).id;
});

afterAll(async () => {
  const sesiIds = (await db.sesi.findMany({ where: { laporanId: { in: dibuat } }, select: { id: true } })).map((s) => s.id);
  await db.logAudit.deleteMany({ where: { entitasId: { in: [...dibuat, ...sesiIds] } } });
  await db.notifikasi.deleteMany({ where: { sesiId: { in: sesiIds } } });
  await db.riwayatJadwal.deleteMany({ where: { sesiId: { in: sesiIds } } });
  await db.tiket.deleteMany({ where: { sesiId: { in: sesiIds } } });
  await db.sesi.deleteMany({ where: { id: { in: sesiIds } } });
  await db.laporan.deleteMany({ where: { id: { in: dibuat } } });
  await db.pengguna.deleteMany({ where: { id: { in: [pendA, pendB, pendLain, adminId] } } });
  await db.lokasi.deleteMany({ where: { id: lokasiId } });
  await db.jenisPendampingan.deleteMany({ where: { id: { in: [jenisPId, jenisLainId] } } });
  await db.jenisKekerasan.deleteMany({ where: { id: jenisId } });
  await db.$disconnect();
});

describe("ubah jadwal", () => {
  it("mengubah jam: sesi berubah, nomor antrean tetap, riwayat dan audit tercatat", async () => {
    const { sesi } = await sesiBaru();
    const h = await ubahJadwal(db, sesi.id, adminId, ubahData({ jamMulai: "13:00", jamSelesai: "14:30" }));
    expect(h.ok).toBe(true);
    const baru = await db.sesi.findUniqueOrThrow({ where: { id: sesi.id }, include: { tiket: true } });
    expect(baru.mulai.toISOString()).toBe(new Date(`${hari(3)}T13:00:00+07:00`).toISOString());
    expect(baru.selesai.toISOString()).toBe(new Date(`${hari(3)}T14:30:00+07:00`).toISOString());
    expect(baru.tiket?.nomorAntrean).toBe(sesi.tiket?.nomorAntrean);
    const r = await riwayatJadwal(db, sesi.id);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ pengubah: "Penguji J", alasan: "Permintaan Pelapor." });
    expect(r[0].perubahan.mulai?.ke).toBe(baru.mulai.toISOString());
    expect(r[0].perubahan.pendamping).toBeUndefined();
    expect(await db.logAudit.count({ where: { entitasId: sesi.id, aksi: "UBAH_JADWAL" } })).toBe(1);
  });

  it("memberi pemberitahuan kepada Pelapor dan Pendamping terkait", async () => {
    const { sesi, laporan } = await sesiBaru();
    await ubahJadwal(db, sesi.id, adminId, ubahData({ jamMulai: "15:00", jamSelesai: "16:00" }));
    const notif = await db.notifikasi.findMany({ where: { sesiId: sesi.id }, orderBy: { penerima: "asc" } });
    expect(notif.map((n) => n.penerima).sort()).toEqual(["PELAPOR", "PENDAMPING"]);
    expect(notif.every((n) => n.kanal === "APLIKASI" && n.dikirimPada !== null)).toBe(true);
    expect(notif.find((n) => n.penerima === "PENDAMPING")?.penerimaId).toBe(pendA);
    expect(notif.find((n) => n.penerima === "PELAPOR")?.pesan).toContain(sesi.tiket!.nomorAntrean);
    // Pelapor melihatnya di Cek Tiket; Pendamping di daftar pemberitahuannya.
    const cek = await cekTiket(db, laporan.kodePendaftaran);
    expect(cek.ok && cek.tiket[0].pembaruan[0].pesan).toContain("diperbarui");
    const np = await notifikasiPendamping(db, pendA);
    expect(np.some((n) => n.pesan.includes(laporan.kodePendaftaran) && !n.dibaca)).toBe(true);
    await tandaiDibaca(db, pendA);
    expect((await notifikasiPendamping(db, pendA)).every((n) => n.dibaca)).toBe(true);
  });

  it("memindahkan hari: nomor antrean dibuat ulang, kode QR tetap", async () => {
    const { sesi } = await sesiBaru();
    const h = await ubahJadwal(db, sesi.id, adminId, ubahData({ tanggal: hari(5) }));
    expect(h.ok).toBe(true);
    const baru = await db.tiket.findUniqueOrThrow({ where: { sesiId: sesi.id } });
    expect(baru.nomorAntrean).not.toBe(sesi.tiket!.nomorAntrean);
    expect(baru.nomorAntrean).toContain(hari(5).replaceAll("-", ""));
    expect(baru.tanggal.toISOString().slice(0, 10)).toBe(hari(5));
    expect(baru.kodeCheckIn).toBe(sesi.tiket!.kodeCheckIn);
    const r = await riwayatJadwal(db, sesi.id);
    expect(r[0].perubahan.nomorAntrean).toEqual({ dari: sesi.tiket!.nomorAntrean, ke: baru.nomorAntrean });
  });

  it("mengganti pendamping: pendamping lama dan baru sama-sama diberi tahu; jenis lain ditolak", async () => {
    const { sesi } = await sesiBaru();
    expect(await ubahJadwal(db, sesi.id, adminId, ubahData({ pendampingId: pendLain }))).toMatchObject({ ok: false, galat: { pendampingId: expect.stringContaining("jenis pendampingan lain") } });
    expect((await db.sesi.findUniqueOrThrow({ where: { id: sesi.id } })).pendampingId).toBe(pendA);

    expect((await ubahJadwal(db, sesi.id, adminId, ubahData({ pendampingId: pendB }))).ok).toBe(true);
    expect((await db.sesi.findUniqueOrThrow({ where: { id: sesi.id } })).pendampingId).toBe(pendB);
    const notif = await db.notifikasi.findMany({ where: { sesiId: sesi.id, penerima: "PENDAMPING" } });
    expect(notif.map((n) => n.penerimaId).sort()).toEqual([pendA, pendB].sort());
    expect(notif.find((n) => n.penerimaId === pendA)?.pesan).toContain("tidak lagi ditugaskan");
    const r = await riwayatJadwal(db, sesi.id);
    expect(r[0].perubahan.pendamping).toMatchObject({ dari: "Pendamping Ja", ke: "Pendamping Jb" });
  });

  it("menolak perubahan tanpa alasan, tanpa perubahan, atau dengan waktu tidak valid", async () => {
    const { sesi } = await sesiBaru();
    expect(await ubahJadwal(db, sesi.id, adminId, ubahData({ alasan: "  " }))).toMatchObject({ ok: false, galat: { alasan: expect.any(String) } });
    expect(await ubahJadwal(db, sesi.id, adminId, ubahData())).toMatchObject({ ok: false, pesan: "Tidak ada perubahan pada jadwal." });
    expect(await ubahJadwal(db, sesi.id, adminId, ubahData({ tanggal: hari(-1) }))).toMatchObject({ ok: false, galat: { tanggal: expect.any(String) } });
    expect(await ubahJadwal(db, sesi.id, adminId, ubahData({ jamSelesai: "08:00" }))).toMatchObject({ ok: false, galat: { jamSelesai: expect.any(String) } });
    expect(await riwayatJadwal(db, sesi.id)).toHaveLength(0);
    expect(await db.notifikasi.count({ where: { sesiId: sesi.id } })).toBe(0);
  });

  it("tidak dapat diubah setelah check-in atau bila sesi bukan Terjadwal", async () => {
    const a = await sesiBaru();
    await db.tiket.update({ where: { sesiId: a.sesi.id }, data: { checkInPada: new Date() } });
    expect(await ubahJadwal(db, a.sesi.id, adminId, ubahData({ jamMulai: "11:00", jamSelesai: "12:00" }))).toMatchObject({ ok: false, pesan: expect.stringContaining("check-in") });
    const b = await sesiBaru();
    await db.sesi.update({ where: { id: b.sesi.id }, data: { status: "SELESAI" } });
    expect(await ubahJadwal(db, b.sesi.id, adminId, ubahData({ jamMulai: "11:00", jamSelesai: "12:00" }))).toMatchObject({ ok: false, pesan: expect.stringContaining("Terjadwal") });
    expect(await ubahJadwal(db, "tidak-ada", adminId, ubahData())).toMatchObject({ ok: false, pesan: "Jadwal tidak ditemukan." });
  });

  it("dua Admin yang memindahkan ke hari yang sama bersamaan mendapat nomor antrean berbeda", async () => {
    const [a, b] = [await sesiBaru(), await sesiBaru()];
    const hasil = await Promise.all([
      ubahJadwal(db, a.sesi.id, adminId, ubahData({ tanggal: hari(6) })),
      ubahJadwal(db, b.sesi.id, adminId, ubahData({ tanggal: hari(6) })),
    ]);
    expect(hasil.every((h) => h.ok)).toBe(true);
    const nomor = (await db.tiket.findMany({ where: { sesiId: { in: [a.sesi.id, b.sesi.id] } } })).map((t) => t.nomorAntrean);
    expect(new Set(nomor).size).toBe(2);
  });

  it("daftar jadwal Admin memuat jumlah perubahan dan penanda pemberitahuan", async () => {
    const { sesi } = await sesiBaru();
    await ubahJadwal(db, sesi.id, adminId, ubahData({ jamMulai: "16:00", jamSelesai: "17:00" }));
    const baris = (await daftarJadwalAdmin(db)).find((s) => s.id === sesi.id);
    expect(baris).toMatchObject({ jumlahPerubahan: 1, pendamping: "Pendamping Ja", status: "TERJADWAL" });
    expect(baris?.notifTerakhir).not.toBeNull();
  });
});
