import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import { batasAtas } from "../components/grafik-batang";
import { jumlahLaporanBaru, ringkasanDasbor } from "./dasbor";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const acak = Array.from({ length: 6 }, () => "ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(Math.random() * 23)]).join("");
const awalan = `UjiDb${acak}`;

// Tanggal "sekarang" jauh di depan agar jendela 30 hari dan 6 bulan hanya berisi data uji ini.
const SEKARANG = new Date("2031-03-15T05:00:00Z"); // 12.00 WIB

let adminId = "";
let jenisKId = "";
let jenisA = "";
let jenisB = "";
let lokasiId = "";
let pendId = "";
let kecId = "";
const laporanIds: string[] = [];
let kode = 0;
let urutTiket = 0;

async function laporan(opsi: { dibuat: string; status: "BARU" | "TERVERIFIKASI" | "DALAM_PENDAMPINGAN" | "DITOLAK" | "DITUTUP"; verifikasi?: string; kecamatan?: boolean }) {
  const n = kode++;
  const l = await db.laporan.create({
    data: {
      kodePendaftaran: `PPA-310315-${acak.slice(0, 4)}${"ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(n / 23)]}${"ABCDEFGHJKMNPQRSTUVWXYZ"[n % 23]}`,
      jenisKekerasanId: jenisKId,
      kronologi: "Kronologi fiktif untuk pengujian dasbor.",
      persetujuanData: true,
      persetujuanPada: new Date(opsi.dibuat),
      status: opsi.status,
      dibuatPada: new Date(opsi.dibuat),
      diverifikasiPada: opsi.verifikasi ? new Date(opsi.verifikasi) : null,
      korban: { create: { nama: "Nama Rahasia Fiktif", nikCipher: "v1.x.y.z", nikIndeks: `idx-${awalan}-${n}`, kecamatanId: opsi.kecamatan ? kecId : null } },
    },
  });
  laporanIds.push(l.id);
  return l;
}

async function sesi(laporanId: string, urutan: number, jenisId: string, mulai: string, status: "TERJADWAL" | "BERLANGSUNG" | "SELESAI" | "DIBATALKAN") {
  const m = new Date(mulai);
  const s = await db.sesi.create({ data: { laporanId, urutan, jenisPendampingId: jenisId, pendampingId: pendId, lokasiId, mulai: m, selesai: new Date(m.getTime() + 3600e3), status } });
  await db.tiket.create({
    data: {
      sesiId: s.id,
      nomorAntrean: `${awalan.slice(-5)}-${++urutTiket}`,
      tanggal: new Date(`${m.toISOString().slice(0, 10)}T00:00:00Z`),
      urutan: 500 + urutTiket,
      lokasiId,
      jenisPendampingId: jenisId,
      kodeCheckIn: randomBytes(12).toString("base64url"),
    },
  });
  return s;
}

beforeAll(async () => {
  adminId = (await db.pengguna.create({ data: { nama: "Penguji Dasbor", email: `${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "ADMIN" } })).id;
  jenisKId = (await db.jenisKekerasan.create({ data: { nama: `Jenis ${awalan}` } })).id;
  jenisA = (await db.jenisPendampingan.create({ data: { kode: awalan.slice(-7), nama: `Layanan A ${awalan}` } })).id;
  jenisB = (await db.jenisPendampingan.create({ data: { kode: `B${awalan.slice(-6)}`, nama: `Layanan B ${awalan}` } })).id;
  lokasiId = (await db.lokasi.create({ data: { nama: `Lokasi ${awalan}`, alamat: "Jl. Fiktif 1" } })).id;
  pendId = (await db.pengguna.create({ data: { nama: "Pendamping Dasbor", email: `pend${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "PENDAMPING" } })).id;
  kecId = (await db.kecamatan.findFirstOrThrow()).id;

  const l1 = await laporan({ dibuat: "2031-03-10T03:00:00Z", status: "BARU", kecamatan: true });
  await laporan({ dibuat: "2031-03-05T03:00:00Z", status: "TERVERIFIKASI", verifikasi: "2031-03-06T03:00:00Z" });
  const l3 = await laporan({ dibuat: "2031-02-20T03:00:00Z", status: "DALAM_PENDAMPINGAN", verifikasi: "2031-02-21T03:00:00Z" });
  await laporan({ dibuat: "2031-03-01T08:00:00Z", status: "DITOLAK", verifikasi: "2031-03-02T03:00:00Z" });
  await laporan({ dibuat: "2030-12-20T03:00:00Z", status: "DITUTUP", verifikasi: "2031-01-05T03:00:00Z" }); // di luar 30 hari, dalam grafik Desember
  await laporan({ dibuat: "2031-02-28T17:30:00Z", status: "BARU" }); // 1 Maret 00.30 WIB: masuk Maret menurut Jakarta, bukan Februari

  // sesi
  await sesi(l3.id, 1, jenisA, "2031-03-10T02:00:00Z", "SELESAI"); // S1: tanpa laporan pendampingan
  const s2 = await sesi(l3.id, 2, jenisA, "2031-03-12T02:00:00Z", "SELESAI"); // S2: dengan laporan dan usulan menunggu
  await sesi(l3.id, 3, jenisB, "2031-03-14T02:00:00Z", "BERLANGSUNG");
  await sesi(l3.id, 4, jenisA, "2031-03-20T02:00:00Z", "TERJADWAL"); // tidak dihitung pada donat
  await sesi(l3.id, 5, jenisA, "2031-03-13T02:00:00Z", "DIBATALKAN"); // tidak dihitung
  await sesi(l3.id, 6, jenisB, "2030-12-01T02:00:00Z", "SELESAI"); // S3: di luar 30 hari, tanpa laporan
  await sesi(l1.id, 1, jenisA, "2031-03-15T07:00:00Z", "TERJADWAL"); // hari ini 14.00 WIB
  await sesi(l1.id, 2, jenisB, "2031-03-15T02:30:00Z", "TERJADWAL"); // hari ini 09.30 WIB
  await sesi(l1.id, 3, jenisB, "2031-03-15T03:30:00Z", "DIBATALKAN"); // hari ini tetapi dibatalkan

  const lp = await db.laporanPendampingan.create({ data: { sesiId: s2.id, penulisId: pendId, jenisPendampingan: "x", keterangan: "x", rekomendasi: "x", ajukanSesiLanjutan: true, dikirimPada: new Date("2031-03-12T04:00:00Z") } });
  await db.usulanSesi.create({ data: { laporanPendampinganId: lp.id } });
});

afterAll(async () => {
  const sesiIds = (await db.sesi.findMany({ where: { laporanId: { in: laporanIds } }, select: { id: true } })).map((s) => s.id);
  const lp = (await db.laporanPendampingan.findMany({ where: { sesiId: { in: sesiIds } }, select: { id: true } })).map((x) => x.id);
  await db.usulanSesi.deleteMany({ where: { laporanPendampinganId: { in: lp } } });
  await db.laporanPendampingan.deleteMany({ where: { id: { in: lp } } });
  await db.tiket.deleteMany({ where: { sesiId: { in: sesiIds } } });
  await db.sesi.deleteMany({ where: { id: { in: sesiIds } } });
  await db.laporan.deleteMany({ where: { id: { in: laporanIds } } });
  await db.pengguna.deleteMany({ where: { id: { in: [adminId, pendId] } } });
  await db.lokasi.deleteMany({ where: { id: lokasiId } });
  await db.jenisPendampingan.deleteMany({ where: { id: { in: [jenisA, jenisB] } } });
  await db.jenisKekerasan.deleteMany({ where: { id: jenisKId } });
  await db.$disconnect();
});

describe("ringkasan dasbor", () => {
  it("kartu: 30 hari terakhir; Terverifikasi = lolos verifikasi pada periode apa pun status berikutnya", async () => {
    const r = await ringkasanDasbor(db, SEKARANG);
    expect(r.periodeHari).toBe(30);
    // Menunggu verifikasi tidak dibatasi periode dan dihitung dari seluruh basis data; berkas uji lain berjalan bersamaan,
    // jadi hanya dipastikan dua laporan Baru uji ikut terhitung.
    expect(r.kartu.baru).toBeGreaterThanOrEqual(2);
    expect(r.kartu.terverifikasi).toBe(2); // yang Terverifikasi dan Dalam pendampingan; yang Ditutup diverifikasi Januari
    expect(r.kartu.ditolak).toBe(1);
    expect(r.kartu.total).toBe(5); // dibuat sejak 13 Februari: lima laporan; yang Desember tidak
    expect(await jumlahLaporanBaru(db)).toBeGreaterThanOrEqual(2);
  });

  it("grafik 6 bulan menurut Jakarta: bulan berurutan, status dipetakan, laporan 00.30 WIB 1 Maret masuk Maret", async () => {
    const { grafik } = await ringkasanDasbor(db, SEKARANG);
    expect(grafik.map((g) => g.bulan)).toEqual(["2030-10", "2030-11", "2030-12", "2031-01", "2031-02", "2031-03"]);
    expect(grafik.map((g) => g.label)).toEqual(["Okt", "Nov", "Des", "Jan", "Feb", "Mar"]);
    const per = Object.fromEntries(grafik.map((g) => [g.label, g]));
    expect(per.Des).toMatchObject({ baru: 0, terverifikasi: 1, ditolak: 0 }); // yang Ditutup dihitung terverifikasi
    expect(per.Feb).toMatchObject({ baru: 0, terverifikasi: 1, ditolak: 0 });
    expect(per.Mar).toMatchObject({ baru: 2, terverifikasi: 1, ditolak: 1 });
    expect(per.Okt).toMatchObject({ baru: 0, terverifikasi: 0, ditolak: 0 });
  });

  it("donat: hanya sesi selesai atau berlangsung dalam 30 hari, terurut dari terbanyak", async () => {
    const r = await ringkasanDasbor(db, SEKARANG);
    expect(r.donat).toEqual([
      { nama: `Layanan A ${awalan}`, jumlah: 2 },
      { nama: `Layanan B ${awalan}`, jumlah: 1 },
    ]);
    expect(r.totalDonat).toBe(3);
  });

  it("perlu tindakan: usulan menunggu, sesi selesai tanpa laporan, dan sesi hari ini (tanpa yang dibatalkan)", async () => {
    const r = await ringkasanDasbor(db, SEKARANG);
    // Hitungan menyeluruh dan dibagi dengan berkas uji lain: minimal yang berasal dari data uji ini.
    expect(r.tindakan.usulan).toBeGreaterThanOrEqual(1);
    expect(r.tindakan.belumLapor).toBeGreaterThanOrEqual(2); // S1 dan S3; S2 sudah punya laporan
    expect(r.tindakan.usulanLaporanId).toBeTruthy();
    expect(r.tindakan.belumLaporLaporanId).toBeTruthy();
    expect(r.tindakan.sesiHariIni).toBe(2);
  });

  it("laporan terbaru: lima teratas menurut waktu masuk, hanya kode, jenis, kecamatan, dan status", async () => {
    const r = await ringkasanDasbor(db, SEKARANG);
    expect(r.terbaru).toHaveLength(5);
    expect(r.terbaru.map((x) => x.status)).toEqual(["BARU", "TERVERIFIKASI", "DITOLAK", "BARU", "DALAM_PENDAMPINGAN"]);
    expect(r.terbaru[0].kecamatan).toBeTruthy();
    expect(r.terbaru[1].kecamatan).toBeNull();
    expect(JSON.stringify(r)).not.toContain("Nama Rahasia Fiktif");
  });

  it("jadwal hari ini: urut jam, zona Jakarta, tanpa sesi dibatalkan, memuat nomor antrean dan lokasi", async () => {
    const { jadwal } = await ringkasanDasbor(db, SEKARANG);
    expect(jadwal.map((j) => j.jam)).toEqual(["09:30", "14:00"]);
    expect(jadwal[0]).toMatchObject({ jenis: `Layanan B ${awalan}`, pendamping: "Pendamping Dasbor", lokasi: `Lokasi ${awalan}`, status: "TERJADWAL" });
    expect(jadwal[0].nomorAntrean).toContain(awalan.slice(-5));
  });

  it("keadaan kosong: semua nol, enam bulan tetap tampil, donat dan jadwal kosong", async () => {
    const r = await ringkasanDasbor(db, new Date("2040-06-15T05:00:00Z"));
    expect(r.kartu).toMatchObject({ terverifikasi: 0, ditolak: 0, total: 0 });
    expect(r.grafik).toHaveLength(6);
    expect(r.grafik.every((g) => g.baru + g.terverifikasi + g.ditolak === 0)).toBe(true);
    expect(r.donat).toEqual([]);
    expect(r.totalDonat).toBe(0);
    expect(r.jadwal).toEqual([]);
  });

  it("pergantian tahun: enam bulan mundur melewati Desember ke Januari", async () => {
    const r = await ringkasanDasbor(db, new Date("2031-02-10T05:00:00Z"));
    expect(r.grafik.map((g) => g.bulan)).toEqual(["2030-09", "2030-10", "2030-11", "2030-12", "2031-01", "2031-02"]);
  });
});

describe("batas atas sumbu grafik", () => {
  it("selalu kelipatan empat dengan langkah rapi dan tidak kurang dari nilai terbesar", () => {
    expect(batasAtas(0)).toBe(4);
    expect(batasAtas(3)).toBe(4);
    expect(batasAtas(5)).toBe(8);
    expect(batasAtas(9)).toBe(20);
    expect(batasAtas(21)).toBe(40);
    expect(batasAtas(48)).toBe(80);
    expect(batasAtas(5000)).toBe(8000);
    for (const m of [0, 1, 4, 6, 11, 17, 33, 99, 150, 777, 12345]) {
      const a = batasAtas(m);
      expect(a).toBeGreaterThanOrEqual(m);
      expect(a % 4).toBe(0);
      expect(Number.isInteger(a / 4)).toBe(true);
    }
  });
});
