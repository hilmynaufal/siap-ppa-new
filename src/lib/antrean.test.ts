import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import { checkInTiket, daftarAntrean, jadwalHariIni, layarPublik, lewatiTiket, panggilBerikutnya, pecahNomor } from "./antrean";
import { ubahStatusSesi } from "./sesi";
import { cekTiket } from "./tiket";
import { hariJakarta } from "./tiket";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const acak = Array.from({ length: 6 }, () => "ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(Math.random() * 23)]).join("");
const awalan = `UjiAn${acak}`;
const HARI = 24 * 3600 * 1000;

let adminId = "";
let jenisId = "";
let jenisPId = "";
let lokasiId = "";
let lokasi2Id = "";
let pend = "";
const laporanIds: string[] = [];
let kodeUrut = 0;
let urut = 0;
const ids: { sesi: string[] } = { sesi: [] };

const hariIni = () => hariJakarta(new Date());
const filter = (tanggal = hariIni(), lok = lokasiId) => ({ lokasiId: lok, jenisPendampingId: jenisPId, tanggal });

/** Satu laporan, satu sesi, satu tiket pada tanggal tertentu. */
async function tiketBaru(opsi: { tanggal?: string; status?: "TERJADWAL" | "BERLANGSUNG" | "SELESAI" | "DIBATALKAN"; lok?: string; laporanStatus?: "DALAM_PENDAMPINGAN" | "DITUTUP" } = {}) {
  const tanggal = opsi.tanggal ?? hariIni();
  const n = kodeUrut++;
  const l = await db.laporan.create({
    data: {
      kodePendaftaran: `PPA-261008-${acak.slice(0, 4)}${"ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(n / 23)]}${"ABCDEFGHJKMNPQRSTUVWXYZ"[n % 23]}`,
      jenisKekerasanId: jenisId,
      kronologi: "Kronologi fiktif pengujian antrean.",
      persetujuanData: true,
      persetujuanPada: new Date(),
      status: opsi.laporanStatus ?? "DALAM_PENDAMPINGAN",
    },
  });
  laporanIds.push(l.id);
  const mulai = new Date(`${tanggal}T10:00:00+07:00`);
  const s = await db.sesi.create({
    data: { laporanId: l.id, urutan: 1, jenisPendampingId: jenisPId, pendampingId: pend, lokasiId: opsi.lok ?? lokasiId, mulai, selesai: new Date(mulai.getTime() + 3600e3), status: opsi.status ?? "TERJADWAL" },
  });
  ids.sesi.push(s.id);
  const u = ++urut;
  const t = await db.tiket.create({
    data: {
      sesiId: s.id,
      nomorAntrean: `${awalan.slice(-3)}-${tanggal.replaceAll("-", "")}-${String(u).padStart(3, "0")}`,
      tanggal: new Date(`${tanggal}T00:00:00Z`),
      urutan: u,
      lokasiId: opsi.lok ?? lokasiId,
      jenisPendampingId: jenisPId,
      kodeCheckIn: randomBytes(12).toString("base64url"),
    },
  });
  return { laporan: l, sesi: s, tiket: t };
}

beforeAll(async () => {
  adminId = (await db.pengguna.create({ data: { nama: "Penguji Antrean", email: `${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "ADMIN" } })).id;
  jenisId = (await db.jenisKekerasan.create({ data: { nama: `Jenis ${awalan}` } })).id;
  jenisPId = (await db.jenisPendampingan.create({ data: { kode: awalan.slice(-7), nama: `Layanan ${awalan}` } })).id;
  lokasiId = (await db.lokasi.create({ data: { nama: `Lokasi ${awalan}`, alamat: "Jl. Fiktif No. 5" } })).id;
  lokasi2Id = (await db.lokasi.create({ data: { nama: `Lokasi Lain ${awalan}`, alamat: "Jl. Fiktif No. 6" } })).id;
  pend = (await db.pengguna.create({ data: { nama: "Pendamping Antrean", email: `pend${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "PENDAMPING", jenisPendampingId: jenisPId } })).id;
});

afterAll(async () => {
  const tiket = (await db.tiket.findMany({ where: { sesiId: { in: ids.sesi } }, select: { id: true } })).map((t) => t.id);
  await db.logAudit.deleteMany({ where: { OR: [{ entitasId: { in: [...tiket, ...ids.sesi] } }, { penggunaId: { in: [adminId, pend] } }] } });
  await db.notifikasi.deleteMany({ where: { sesiId: { in: ids.sesi } } });
  await db.tiket.deleteMany({ where: { sesiId: { in: ids.sesi } } });
  await db.sesi.deleteMany({ where: { id: { in: ids.sesi } } });
  await db.laporan.deleteMany({ where: { id: { in: laporanIds } } });
  await db.pengguna.deleteMany({ where: { id: { in: [pend, adminId] } } });
  await db.lokasi.deleteMany({ where: { id: { in: [lokasiId, lokasi2Id] } } });
  await db.jenisPendampingan.deleteMany({ where: { id: jenisPId } });
  await db.jenisKekerasan.deleteMany({ where: { id: jenisId } });
  await db.$disconnect();
});

describe("pecahNomor", () => {
  it("memisahkan awalan dan urutan", () => {
    expect(pecahNomor("PSI-20261008-005")).toEqual({ awalan: "PSI", urutan: "005" });
    expect(pecahNomor("XYZ")).toEqual({ awalan: "XYZ", urutan: "" });
  });
});

describe("Check-in", () => {
  it("lewat kode QR atau nomor antrean; mencatat waktu dan audit; tidak dua kali", async () => {
    const a = await tiketBaru();
    const b = await tiketBaru();
    const h = await checkInTiket(db, a.tiket.kodeCheckIn, adminId);
    expect(h).toMatchObject({ ok: true, nomorAntrean: a.tiket.nomorAntrean });
    expect((await db.tiket.findUniqueOrThrow({ where: { id: a.tiket.id } })).checkInPada).not.toBeNull();
    expect(await checkInTiket(db, a.tiket.kodeCheckIn, adminId)).toMatchObject({ ok: false, pesan: expect.stringContaining("sudah check-in") });
    // nomor antrean boleh diketik dengan huruf kecil dan spasi
    expect(await checkInTiket(db, ` ${b.tiket.nomorAntrean.toLowerCase()} `, adminId)).toMatchObject({ ok: true });
    expect(await db.logAudit.count({ where: { aksi: "CHECK_IN_TIKET", entitasId: a.tiket.id, penggunaId: adminId } })).toBe(1);
  });

  it("menolak kode tidak dikenal, kosong, tanggal bukan hari ini, sesi dimulai, dibatalkan, atau kasus ditutup", async () => {
    expect(await checkInTiket(db, "kode-ngawur", adminId)).toMatchObject({ ok: false, pesan: expect.stringContaining("tidak ditemukan") });
    expect(await checkInTiket(db, "   ", adminId)).toMatchObject({ ok: false });
    const besok = hariJakarta(new Date(Date.now() + 2 * HARI));
    const kelak = await tiketBaru({ tanggal: besok });
    expect(await checkInTiket(db, kelak.tiket.kodeCheckIn, adminId)).toMatchObject({ ok: false, pesan: expect.stringContaining("bukan hari ini") });
    const jalan = await tiketBaru({ status: "BERLANGSUNG" });
    expect(await checkInTiket(db, jalan.tiket.kodeCheckIn, adminId)).toMatchObject({ ok: false, pesan: expect.stringContaining("sudah dimulai") });
    const batal = await tiketBaru({ status: "DIBATALKAN" });
    expect(await checkInTiket(db, batal.tiket.kodeCheckIn, adminId)).toMatchObject({ ok: false });
    const tutup = await tiketBaru({ laporanStatus: "DITUTUP" });
    expect(await checkInTiket(db, tutup.tiket.kodeCheckIn, adminId)).toMatchObject({ ok: false });
  });

  it("dua check-in bersamaan pada tiket yang sama: hanya satu berhasil", async () => {
    const a = await tiketBaru();
    const hasil = await Promise.all([checkInTiket(db, a.tiket.kodeCheckIn, adminId), checkInTiket(db, a.tiket.kodeCheckIn, adminId)]);
    expect(hasil.filter((h) => h.ok)).toHaveLength(1);
  });
});

describe("Panggil berikutnya dan lewati", () => {
  it("memanggil nomor yang sudah check-in menurut urutan; yang belum check-in tidak ikut", async () => {
    const lok = (await db.lokasi.create({ data: { nama: `Lokasi Panggil ${awalan}`, alamat: "Jl. Fiktif" } })).id;
    const t1 = await tiketBaru({ lok });
    const t2 = await tiketBaru({ lok });
    const t3 = await tiketBaru({ lok });
    const f = filter(hariIni(), lok);
    expect(await panggilBerikutnya(db, f, adminId)).toMatchObject({ ok: false, pesan: expect.stringContaining("Belum ada nomor") });
    // t3 check-in lebih dulu dari t2, t1 tidak check-in: dipanggil mengikuti nomor, hanya yang sudah check-in
    await checkInTiket(db, t3.tiket.kodeCheckIn, adminId);
    await checkInTiket(db, t2.tiket.kodeCheckIn, adminId);
    expect(await panggilBerikutnya(db, f, adminId)).toEqual({ ok: true, nomorAntrean: t2.tiket.nomorAntrean });
    expect(await panggilBerikutnya(db, f, adminId)).toEqual({ ok: true, nomorAntrean: t3.tiket.nomorAntrean });
    expect(await panggilBerikutnya(db, f, adminId)).toMatchObject({ ok: false });
    const d = await daftarAntrean(db, f);
    expect(d.baris.map((b) => b.status)).toEqual(["MENUNGGU", "DIPANGGIL", "DIPANGGIL"]);
    expect(d.sedangDipanggil?.nomorAntrean).toBe(t3.tiket.nomorAntrean);
    expect(d.baris[0].checkIn).toBeNull();
    void t1;
    await db.tiket.deleteMany({ where: { lokasiId: lok } });
    await db.sesi.updateMany({ where: { lokasiId: lok }, data: { lokasiId } });
    await db.lokasi.delete({ where: { id: lok } });
  });

  it("dua pemanggilan bersamaan tidak memanggil nomor yang sama", async () => {
    const lok = (await db.lokasi.create({ data: { nama: `Lokasi Serentak ${awalan}`, alamat: "Jl. Fiktif" } })).id;
    const a = await tiketBaru({ lok });
    const b = await tiketBaru({ lok });
    await checkInTiket(db, a.tiket.kodeCheckIn, adminId);
    await checkInTiket(db, b.tiket.kodeCheckIn, adminId);
    const hasil = await Promise.all([panggilBerikutnya(db, filter(hariIni(), lok), adminId), panggilBerikutnya(db, filter(hariIni(), lok), adminId)]);
    const nomor = hasil.flatMap((h) => (h.ok ? [h.nomorAntrean] : []));
    expect(new Set(nomor).size).toBe(nomor.length);
    expect(nomor.length).toBeGreaterThanOrEqual(1);
    await db.tiket.deleteMany({ where: { lokasiId: lok } });
    await db.sesi.updateMany({ where: { lokasiId: lok }, data: { lokasiId } });
    await db.lokasi.delete({ where: { id: lok } });
  });

  it("hanya pada hari layanan", async () => {
    const besok = hariJakarta(new Date(Date.now() + HARI));
    expect(await panggilBerikutnya(db, filter(besok), adminId)).toMatchObject({ ok: false, pesan: expect.stringContaining("hari layanan") });
  });

  it("lewati: dari menunggu atau dipanggil, tidak dari selesai; datang terlambat dapat check-in lagi", async () => {
    const a = await tiketBaru();
    await checkInTiket(db, a.tiket.kodeCheckIn, adminId);
    expect(await lewatiTiket(db, a.tiket.id, adminId)).toMatchObject({ ok: true });
    expect((await db.tiket.findUniqueOrThrow({ where: { id: a.tiket.id } })).statusAntrean).toBe("DILEWATI");
    expect(await lewatiTiket(db, a.tiket.id, adminId)).toMatchObject({ ok: false });
    expect(await checkInTiket(db, a.tiket.kodeCheckIn, adminId)).toMatchObject({ ok: true });
    const lagi = await db.tiket.findUniqueOrThrow({ where: { id: a.tiket.id } });
    expect(lagi.statusAntrean).toBe("MENUNGGU");
    expect(lagi.dipanggilPada).toBeNull();
    const selesai = await tiketBaru({ status: "SELESAI" });
    await db.tiket.update({ where: { id: selesai.tiket.id }, data: { statusAntrean: "SELESAI" } });
    expect(await lewatiTiket(db, selesai.tiket.id, adminId)).toMatchObject({ ok: false });
    expect(await lewatiTiket(db, "tidak-ada", adminId)).toEqual({ ok: false, pesan: "Tiket tidak ditemukan." });
  });

  it("Pendamping memulai sesi: status antrean menjadi Berlangsung dan tidak dapat dilewati lagi", async () => {
    const a = await tiketBaru();
    await checkInTiket(db, a.tiket.kodeCheckIn, adminId);
    expect(await ubahStatusSesi(db, a.sesi.id, pend, "BERLANGSUNG")).toEqual({ ok: true });
    expect((await db.tiket.findUniqueOrThrow({ where: { id: a.tiket.id } })).statusAntrean).toBe("BERLANGSUNG");
    expect(await lewatiTiket(db, a.tiket.id, adminId)).toMatchObject({ ok: false });
  });
});

describe("Daftar antrean dan layar publik", () => {
  it("antrean dipisah per lokasi dan jenis; tanggal lain tidak ikut", async () => {
    const a = await tiketBaru({ lok: lokasi2Id });
    const d = await daftarAntrean(db, filter(hariIni(), lokasi2Id));
    expect(d.baris.map((b) => b.id)).toEqual([a.tiket.id]);
    expect(d.jumlah).toBe(1);
    const kosong = await daftarAntrean(db, filter(hariJakarta(new Date(Date.now() + 9 * HARI)), lokasi2Id));
    expect(kosong.jumlah).toBe(0);
  });

  it("layar publik: nomor dipanggil dan tiga berikutnya, tanpa nama atau data kasus", async () => {
    const lok = (await db.lokasi.create({ data: { nama: `Lokasi Layar ${awalan}`, alamat: "Jl. Fiktif" } })).id;
    const t = [] as Awaited<ReturnType<typeof tiketBaru>>[];
    for (let i = 0; i < 5; i++) t.push(await tiketBaru({ lok }));
    for (const x of t) await checkInTiket(db, x.tiket.kodeCheckIn, adminId);
    await panggilBerikutnya(db, filter(hariIni(), lok), adminId);
    const l = (await layarPublik(db, lok, jenisPId))!;
    expect(l.lokasi).toBe(`Lokasi Layar ${awalan}`);
    expect(l.dipanggil).toEqual(pecahNomor(t[0].tiket.nomorAntrean));
    expect(l.berikutnya.map((b) => b.nomor)).toEqual([1, 2, 3].map((i) => t[i].tiket.nomorAntrean));
    const json = JSON.stringify(l);
    for (const rahasia of ["Pendamping Antrean", "Kronologi", t[0].laporan.kodePendaftaran]) expect(json).not.toContain(rahasia);
    expect(await layarPublik(db, "tidak-ada", jenisPId)).toBeNull();
    await db.tiket.deleteMany({ where: { lokasiId: lok } });
    await db.sesi.updateMany({ where: { lokasiId: lok }, data: { lokasiId } });
    await db.lokasi.delete({ where: { id: lok } });
  });

  it("Pelapor melihat nomor dipanggil dan sisa antrean di depannya setelah check-in", async () => {
    const lok = (await db.lokasi.create({ data: { nama: `Lokasi Pelapor ${awalan}`, alamat: "Jl. Fiktif" } })).id;
    const a = await tiketBaru({ lok });
    const b = await tiketBaru({ lok });
    await checkInTiket(db, a.tiket.kodeCheckIn, adminId);
    await checkInTiket(db, b.tiket.kodeCheckIn, adminId);
    await panggilBerikutnya(db, filter(hariIni(), lok), adminId);
    const h = await cekTiket(db, b.laporan.kodePendaftaran);
    expect(h.ok && h.tiket[0].antrean).toEqual({ nomorSaatIni: a.tiket.nomorAntrean, sisaDidepan: 1 });
    await db.tiket.deleteMany({ where: { lokasiId: lok } });
    await db.sesi.updateMany({ where: { lokasiId: lok }, data: { lokasiId } });
    await db.lokasi.delete({ where: { id: lok } });
  });
});

describe("Petugas dibatasi pada lokasinya", () => {
  it("check-in, panggil, dan lewati hanya di lokasi sendiri; Admin tanpa batas", async () => {
    const sendiri = await tiketBaru({ lok: lokasi2Id });
    const lain = await tiketBaru({ lok: lokasiId });
    // tiket lokasi lain ditolak tanpa mengubah apa pun
    expect(await checkInTiket(db, lain.tiket.kodeCheckIn, adminId, new Date(), lokasi2Id)).toEqual({ ok: false, pesan: "Tiket ini bukan untuk lokasi Anda." });
    expect((await db.tiket.findUniqueOrThrow({ where: { id: lain.tiket.id } })).checkInPada).toBeNull();
    expect(await checkInTiket(db, sendiri.tiket.kodeCheckIn, adminId, new Date(), lokasi2Id)).toMatchObject({ ok: true });
    // panggil di lokasi lain ditolak; di lokasi sendiri berhasil
    expect(await panggilBerikutnya(db, filter(hariIni(), lokasiId), adminId, new Date(), lokasi2Id)).toEqual({ ok: false, pesan: "Antrean ini bukan untuk lokasi Anda." });
    expect(await panggilBerikutnya(db, filter(hariIni(), lokasi2Id), adminId, new Date(), lokasi2Id)).toMatchObject({ ok: true });
    // lewati tiket lokasi lain: seolah tidak ada
    expect(await lewatiTiket(db, lain.tiket.id, adminId, new Date(), lokasi2Id)).toEqual({ ok: false, pesan: "Tiket tidak ditemukan." });
    expect(await lewatiTiket(db, sendiri.tiket.id, adminId, new Date(), lokasi2Id)).toMatchObject({ ok: true });
    // tanpa batas (Admin) boleh di lokasi mana pun
    expect(await checkInTiket(db, lain.tiket.kodeCheckIn, adminId)).toMatchObject({ ok: true });
  });

  it("jadwal hari ini: hanya sesi di lokasinya, tanpa nama atau kode laporan", async () => {
    const lok = (await db.lokasi.create({ data: { nama: `Lokasi Jadwal ${awalan}`, alamat: "Jl. Fiktif" } })).id;
    const a = await tiketBaru({ lok });
    await tiketBaru({ lok: lokasiId }); // lokasi lain, tidak ikut
    await tiketBaru({ lok, tanggal: hariJakarta(new Date(Date.now() + 2 * HARI)) }); // hari lain, tidak ikut
    const j = await jadwalHariIni(db, lok, hariIni());
    expect(j).toHaveLength(1);
    expect(j[0]).toMatchObject({ nomorAntrean: a.tiket.nomorAntrean, jenis: `Layanan ${awalan}`, pendamping: "Pendamping Antrean", statusSesi: "TERJADWAL", checkIn: null });
    const json = JSON.stringify(j);
    for (const rahasia of [a.laporan.kodePendaftaran, "Kronologi", a.tiket.kodeCheckIn]) expect(json).not.toContain(rahasia);
    await checkInTiket(db, a.tiket.kodeCheckIn, adminId);
    expect((await jadwalHariIni(db, lok, hariIni()))[0].checkIn).toMatch(/^\d{2}:\d{2}$/);
    await db.tiket.deleteMany({ where: { lokasiId: lok } });
    await db.sesi.updateMany({ where: { lokasiId: lok }, data: { lokasiId } });
    await db.lokasi.delete({ where: { id: lok } });
  });
});
