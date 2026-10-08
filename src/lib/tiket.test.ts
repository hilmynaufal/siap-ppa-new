import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import { periksaLaju, catatGagal } from "./batas-laju";
import { cekTiket, formatNomorAntrean, hariJakarta, jadwalPendamping, normalisasiKode } from "./tiket";
import { tolakLaporan, verifikasiLaporan } from "./verifikasi";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
// Acak (bukan dari jam) agar berkas uji yang berjalan paralel tidak menghasilkan kode pendaftaran yang sama.
const sufiks = Array.from({ length: 6 }, () => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 31)]).join("");
const awalan = `UJIT${sufiks}`;
let adminId = "";
let jenisId = "";
let jenisPId = "";
let lokasiId = "";
let pendampingId = "";
const dibuat: string[] = [];
const hariIni = hariJakarta(new Date());

// Kode pendaftaran uji mengikuti pola resmi agar lolos pemeriksaan format.
const kodeUji = (n: number) => `PPA-261007-${sufiks.padEnd(5, "X").slice(0, 5)}${"ABCDEFGH"[n]}`;

async function laporanBaru(n: number, status: "BARU" | "DITOLAK" = "BARU") {
  const l = await db.laporan.create({
    data: {
      kodePendaftaran: kodeUji(n),
      pelapor: { create: { nama: "Pelapor Fiktif", kontak: "081200000000" } },
      korban: { create: { nama: `Korban ${awalan}${n}` } },
      jenisKekerasanId: jenisId,
      kronologi: "Kronologi fiktif untuk pengujian tiket.",
      persetujuanData: true,
      persetujuanPada: new Date(),
      status,
      alasanPenolakan: status === "DITOLAK" ? "Data tidak lengkap." : null,
    },
  });
  dibuat.push(l.id);
  return l;
}

const jadwal = (tanggal: string, jamMulai = "09:00", jamSelesai = "10:00") => ({
  jenisPendampingId: jenisPId,
  pendampingId,
  lokasiId,
  tanggal,
  jamMulai,
  jamSelesai,
});

beforeAll(async () => {
  adminId = (await db.pengguna.create({ data: { nama: "Penguji T", email: `${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "ADMIN" } })).id;
  jenisId = (await db.jenisKekerasan.create({ data: { nama: `Jenis ${awalan}` } })).id;
  jenisPId = (await db.jenisPendampingan.create({ data: { kode: awalan.slice(-7), nama: `Pendampingan ${awalan}` } })).id;
  lokasiId = (await db.lokasi.create({ data: { nama: `Lokasi ${awalan}`, alamat: "Jl. Fiktif No. 2" } })).id;
  pendampingId = (await db.pengguna.create({ data: { nama: "Pendamping T", email: `p${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "PENDAMPING", jenisPendampingId: jenisPId } })).id;
});

afterAll(async () => {
  await db.logAudit.deleteMany({ where: { entitasId: { in: dibuat } } });
  await db.tiket.deleteMany({ where: { sesi: { laporanId: { in: dibuat } } } });
  await db.sesi.deleteMany({ where: { laporanId: { in: dibuat } } });
  await db.laporan.deleteMany({ where: { id: { in: dibuat } } });
  await db.pengguna.deleteMany({ where: { id: { in: [pendampingId, adminId] } } });
  await db.lokasi.deleteMany({ where: { id: lokasiId } });
  await db.jenisPendampingan.deleteMany({ where: { id: jenisPId } });
  await db.jenisKekerasan.deleteMany({ where: { id: jenisId } });
  await db.$disconnect();
});

describe("cek tiket Pelapor", () => {
  it("format kode salah dan kode tidak dikenal ditolak dengan pesan berbeda", async () => {
    expect(await cekTiket(db, "abc")).toMatchObject({ ok: false, pesan: expect.stringContaining("Format kode") });
    expect(await cekTiket(db, "PPA-261007-ZZZZZZ")).toMatchObject({ ok: false, pesan: expect.stringContaining("tidak ditemukan") });
  });

  it("kode dinormalisasi (huruf kecil dan spasi)", () => {
    expect(normalisasiKode("  ppa-261007-ab23cd ")).toBe("PPA-261007-AB23CD");
  });

  it("laporan baru: status BARU tanpa tiket; ditolak: alasan terlihat", async () => {
    const a = await laporanBaru(0);
    const b = await laporanBaru(1, "DITOLAK");
    expect(await cekTiket(db, a.kodePendaftaran)).toMatchObject({ ok: true, status: "BARU", tiket: [], alasanPenolakan: null });
    expect(await cekTiket(db, b.kodePendaftaran)).toMatchObject({ ok: true, status: "DITOLAK", alasanPenolakan: "Data tidak lengkap.", tiket: [] });
  });

  it("hasil tidak memuat nama korban atau isi laporan", async () => {
    const h = await cekTiket(db, kodeUji(0));
    expect(JSON.stringify(h)).not.toMatch(/Korban|Kronologi|Pelapor Fiktif|081200000000/);
  });

  it("setelah verifikasi, tiket memuat waktu, tempat, pendamping, nomor antrean, dan kode QR", async () => {
    const l = await laporanBaru(2);
    const besok = hariJakarta(new Date(Date.now() + 24 * 3600 * 1000));
    const v = await verifikasiLaporan(db, l.id, adminId, jadwal(besok, "10:30", "11:30"));
    expect(v.ok).toBe(true);
    const h = await cekTiket(db, l.kodePendaftaran);
    expect(h).toMatchObject({ ok: true, status: "TERVERIFIKASI" });
    if (!h.ok) return;
    expect(h.tiket).toHaveLength(1);
    expect(h.tiket[0]).toMatchObject({
      urutan: 1,
      jenis: `Pendampingan ${awalan}`,
      lokasi: `Lokasi ${awalan}`,
      alamat: "Jl. Fiktif No. 2",
      pendamping: "Pendamping T",
      tanggal: besok,
      nomorAntrean: formatNomorAntrean(awalan.slice(-7), besok, h.tiket[0].urutan),
      sudahCheckIn: false,
      antrean: null,
    });
    expect(h.tiket[0].kodeCheckIn.length).toBeGreaterThanOrEqual(20);
    expect(h.tiket[0].mulai).toBe(new Date(`${besok}T10:30:00+07:00`).toISOString());
  });

  it("indikator antrean muncul hanya pada hari layanan setelah check-in", async () => {
    const l1 = await laporanBaru(3);
    const l2 = await laporanBaru(4);
    const jamDepan = new Date(Date.now() + 2 * 3600 * 1000);
    const hariLayanan = hariJakarta(jamDepan);
    if (hariLayanan !== hariIni) return; // dekat tengah malam: lewati agar uji tidak acak
    const jam = jamDepan.toLocaleTimeString("sv-SE", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" });
    await verifikasiLaporan(db, l1.id, adminId, jadwal(hariLayanan, jam, "23:59"));
    await verifikasiLaporan(db, l2.id, adminId, jadwal(hariLayanan, jam, "23:59"));
    const t1 = await db.tiket.findFirstOrThrow({ where: { sesi: { laporanId: l1.id } } });
    const t2 = await db.tiket.findFirstOrThrow({ where: { sesi: { laporanId: l2.id } } });

    // Belum check-in: tidak ada indikator.
    const sebelum = await cekTiket(db, l2.kodePendaftaran);
    expect(sebelum.ok && sebelum.tiket[0].antrean).toBeNull();

    await db.tiket.update({ where: { id: t1.id }, data: { checkInPada: new Date(), statusAntrean: "BERLANGSUNG" } });
    await db.tiket.update({ where: { id: t2.id }, data: { checkInPada: new Date() } });
    const h = await cekTiket(db, l2.kodePendaftaran);
    expect(h.ok && h.tiket[0].antrean).toEqual({ nomorSaatIni: t1.nomorAntrean, sisaDidepan: 1 });
    expect(h.ok && h.tiket[0].sudahCheckIn).toBe(true);
  });

  it("laporan yang tidak lagi BARU tidak bisa ditolak dan tiketnya tetap utuh", async () => {
    const l = await laporanBaru(5);
    const besok = hariJakarta(new Date(Date.now() + 24 * 3600 * 1000));
    await verifikasiLaporan(db, l.id, adminId, jadwal(besok));
    expect(await tolakLaporan(db, l.id, adminId, "Alasan penolakan yang cukup panjang.")).toMatchObject({ ok: false });
    const h = await cekTiket(db, l.kodePendaftaran);
    expect(h.ok && h.tiket).toHaveLength(1);
  });
});

describe("jadwal Pendamping", () => {
  it("hanya memuat sesi yang ditugaskan kepada pendamping itu, terurut menurut waktu", async () => {
    const semua = await jadwalPendamping(db, pendampingId);
    expect(semua.length).toBeGreaterThanOrEqual(3);
    const waktu = semua.map((s) => s.mulai);
    expect([...waktu].sort()).toEqual(waktu);
    expect(semua.every((s) => s.nomorAntrean && s.lokasi === `Lokasi ${awalan}`)).toBe(true);
    expect(await jadwalPendamping(db, adminId)).toEqual([]);
  });
});

describe("pembatas laju", () => {
  it("memblokir setelah batas kegagalan dan pulih setelah jendela habis", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i++) catatGagal("k", 1000, t0);
    expect(periksaLaju("k", 3, 1000, t0 + 10).boleh).toBe(false);
    expect(periksaLaju("k", 3, 1000, t0 + 1001).boleh).toBe(true);
    expect(periksaLaju("lain", 3, 1000, t0).boleh).toBe(true);
  });
});
