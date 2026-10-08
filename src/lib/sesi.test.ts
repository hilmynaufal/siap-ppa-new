import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import { batalkanSesi, daftarSesiPendamping, inisial, ringkasanSesiPendamping, syaratTutupKasus, tambahSesi, tutupKasus, ubahStatusSesi } from "./sesi";
import { hariJakarta } from "./tiket";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const acak = Array.from({ length: 6 }, () => "ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(Math.random() * 23)]).join("");
const awalan = `UjiSesi${acak}`;
const HARI = 24 * 3600 * 1000;
const hari = (n: number) => hariJakarta(new Date(Date.now() + n * HARI));
const waktu = (tanggal: string, jam: string) => new Date(`${tanggal}T${jam}:00+07:00`);

let adminId = "";
let jenisId = "";
let jenisPId = "";
let lokasiId = "";
let pendA = "";
let pendB = "";
const laporanIds: string[] = [];
let kodeUrut = 0;

async function laporanBaru(status: "BARU" | "TERVERIFIKASI" | "DALAM_PENDAMPINGAN" | "DITUTUP" = "TERVERIFIKASI") {
  const n = kodeUrut++;
  const l = await db.laporan.create({
    data: {
      kodePendaftaran: `PPA-261008-${acak.slice(0, 5)}${"ABCDEFGHJKMNPQRSTUVWXYZ"[n]}`,
      jenisKekerasanId: jenisId,
      kronologi: "Kronologi fiktif untuk pengujian pendampingan.",
      tanggalKejadian: new Date("2026-10-01T00:00:00"),
      persetujuanData: true,
      persetujuanPada: new Date(),
      status,
      korban: {
        create: { nama: "Siti Aminah Fiktif", nikCipher: "v1.x.y.z", nikIndeks: `idx-${awalan}-${n}`, jenisKelamin: "PEREMPUAN", tanggalLahir: new Date("2011-03-04T00:00:00Z"), alamat: "Jl. Rahasia No. 9", kontak: "081299990000" },
      },
      pelapor: { create: { nama: "Pelapor Rahasia Fiktif", kontak: "081288880000" } },
    },
  });
  laporanIds.push(l.id);
  return l;
}

let urutTiket = 0;
async function sesiBaru(laporanId: string, mulai: Date, pendampingId = pendA, status: "TERJADWAL" | "BERLANGSUNG" | "SELESAI" | "TIDAK_HADIR" | "DIBATALKAN" = "TERJADWAL") {
  const urutan = (await db.sesi.count({ where: { laporanId } })) + 1;
  const s = await db.sesi.create({
    data: { laporanId, urutan, jenisPendampingId: jenisPId, pendampingId, lokasiId, mulai, selesai: new Date(mulai.getTime() + 3600 * 1000), status },
  });
  await db.tiket.create({
    data: {
      sesiId: s.id,
      nomorAntrean: `${awalan.slice(-6)}-${++urutTiket}-${randomBytes(2).toString("hex")}`,
      tanggal: new Date(`${hariJakarta(mulai)}T00:00:00Z`),
      urutan: 900 + urutTiket,
      lokasiId,
      jenisPendampingId: jenisPId,
      kodeCheckIn: randomBytes(12).toString("base64url"),
    },
  });
  return s;
}

beforeAll(async () => {
  adminId = (await db.pengguna.create({ data: { nama: "Penguji Sesi", email: `${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "ADMIN" } })).id;
  jenisId = (await db.jenisKekerasan.create({ data: { nama: `Jenis ${awalan}` } })).id;
  jenisPId = (await db.jenisPendampingan.create({ data: { kode: awalan.slice(-7), nama: `Pendampingan ${awalan}` } })).id;
  lokasiId = (await db.lokasi.create({ data: { nama: `Lokasi ${awalan}`, alamat: "Jl. Fiktif No. 5" } })).id;
  const mk = (nama: string) =>
    db.pengguna.create({ data: { nama, email: `${nama.replace(/\s/g, "").toLowerCase()}${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "PENDAMPING", jenisPendampingId: jenisPId } });
  pendA = (await mk("Pendamping Sa")).id;
  pendB = (await mk("Pendamping Sb")).id;
});

afterAll(async () => {
  const sesi = (await db.sesi.findMany({ where: { laporanId: { in: laporanIds } }, select: { id: true } })).map((s) => s.id);
  await db.logAudit.deleteMany({ where: { OR: [{ entitasId: { in: [...sesi, ...laporanIds] } }, { penggunaId: { in: [adminId, pendA, pendB] } }] } });
  await db.usulanSesi.deleteMany({ where: { laporanPendampingan: { sesiId: { in: sesi } } } });
  await db.laporanPendampingan.deleteMany({ where: { sesiId: { in: sesi } } });
  await db.notifikasi.deleteMany({ where: { sesiId: { in: sesi } } });
  await db.riwayatJadwal.deleteMany({ where: { sesiId: { in: sesi } } });
  await db.tiket.deleteMany({ where: { sesiId: { in: sesi } } });
  await db.sesi.deleteMany({ where: { id: { in: sesi } } });
  await db.laporan.deleteMany({ where: { id: { in: laporanIds } } });
  await db.pengguna.deleteMany({ where: { id: { in: [pendA, pendB, adminId] } } });
  await db.lokasi.deleteMany({ where: { id: lokasiId } });
  await db.jenisPendampingan.deleteMany({ where: { id: jenisPId } });
  await db.jenisKekerasan.deleteMany({ where: { id: jenisId } });
  await db.$disconnect();
});

describe("inisial", () => {
  it("mengambil huruf pertama tiap kata (maksimal tiga)", () => {
    expect(inisial("Siti Aminah")).toBe("S.A.");
    expect(inisial("  budi ")).toBe("B.");
    expect(inisial("Ahmad Budi Cahya Dewi")).toBe("A.B.C.");
    expect(inisial(null)).toBe("-");
  });
});

describe("Pendamping mengubah status sesi", () => {
  it("Terjadwal ke Berlangsung ke Selesai: tiket ikut berubah, kasus menjadi Dalam pendampingan, tercatat di audit", async () => {
    const l = await laporanBaru("TERVERIFIKASI");
    const s = await sesiBaru(l.id, waktu(hari(0), "09:00"));
    expect(await ubahStatusSesi(db, s.id, pendA, "BERLANGSUNG")).toEqual({ ok: true });
    expect((await db.sesi.findUniqueOrThrow({ where: { id: s.id } })).status).toBe("BERLANGSUNG");
    expect((await db.tiket.findUniqueOrThrow({ where: { sesiId: s.id } })).statusAntrean).toBe("BERLANGSUNG");
    expect((await db.laporan.findUniqueOrThrow({ where: { id: l.id } })).status).toBe("DALAM_PENDAMPINGAN");

    expect(await ubahStatusSesi(db, s.id, pendA, "SELESAI")).toEqual({ ok: true });
    const t = await db.tiket.findUniqueOrThrow({ where: { sesiId: s.id } });
    expect(t.statusAntrean).toBe("SELESAI");
    expect(t.selesaiPada).not.toBeNull();
    const log = await db.logAudit.findMany({ where: { entitasId: s.id, aksi: "UBAH_STATUS_SESI" }, orderBy: { dibuatPada: "asc" } });
    expect(log.map((x) => x.rincian)).toEqual([{ dari: "TERJADWAL", ke: "BERLANGSUNG" }, { dari: "BERLANGSUNG", ke: "SELESAI" }]);
  });

  it("Tidak hadir: tiket menjadi Dilewati dan status kasus tidak berubah", async () => {
    const l = await laporanBaru("TERVERIFIKASI");
    const s = await sesiBaru(l.id, waktu(hari(-1), "09:00")); // sesi tertunda dari kemarin
    expect(await ubahStatusSesi(db, s.id, pendA, "TIDAK_HADIR")).toEqual({ ok: true });
    expect((await db.tiket.findUniqueOrThrow({ where: { sesiId: s.id } })).statusAntrean).toBe("DILEWATI");
    expect((await db.laporan.findUniqueOrThrow({ where: { id: l.id } })).status).toBe("TERVERIFIKASI");
  });

  it("menolak sesi masa depan, perpindahan di luar alur, Pendamping lain, dan kasus yang sudah ditutup", async () => {
    const l = await laporanBaru("TERVERIFIKASI");
    const depan = await sesiBaru(l.id, waktu(hari(3), "09:00"));
    expect(await ubahStatusSesi(db, depan.id, pendA, "BERLANGSUNG")).toMatchObject({ ok: false, pesan: expect.stringContaining("hari pelaksanaan") });
    expect(await ubahStatusSesi(db, depan.id, pendA, "SELESAI")).toMatchObject({ ok: false });
    const hariIni = await sesiBaru(l.id, waktu(hari(0), "11:00"));
    expect(await ubahStatusSesi(db, hariIni.id, pendB, "BERLANGSUNG")).toEqual({ ok: false, pesan: "Sesi tidak ditemukan." });
    const selesai = await sesiBaru(l.id, waktu(hari(0), "12:00"), pendA, "SELESAI");
    expect(await ubahStatusSesi(db, selesai.id, pendA, "BERLANGSUNG")).toMatchObject({ ok: false });
    const tutup = await laporanBaru("DITUTUP");
    const sTutup = await sesiBaru(tutup.id, waktu(hari(0), "10:00"));
    expect(await ubahStatusSesi(db, sTutup.id, pendA, "BERLANGSUNG")).toMatchObject({ ok: false, pesan: "Kasus ini sudah ditutup." });
    expect((await db.sesi.findUniqueOrThrow({ where: { id: hariIni.id } })).status).toBe("TERJADWAL");
  });

  it("dua perubahan bersamaan pada sesi yang sama: hanya satu yang berhasil", async () => {
    const l = await laporanBaru("TERVERIFIKASI");
    const s = await sesiBaru(l.id, waktu(hari(0), "08:00"));
    const hasil = await Promise.all([ubahStatusSesi(db, s.id, pendA, "BERLANGSUNG"), ubahStatusSesi(db, s.id, pendA, "TIDAK_HADIR")]);
    expect(hasil.filter((h) => h.ok)).toHaveLength(1);
    expect(await db.logAudit.count({ where: { entitasId: s.id, aksi: "UBAH_STATUS_SESI" } })).toBe(1);
  });
});

describe("daftar dan ringkasan untuk Pendamping (identitas dirahasiakan)", () => {
  it("menandai Hari ini, Mendatang, dan Perlu laporan; tanpa nama atau data pribadi", async () => {
    const l = await laporanBaru("DALAM_PENDAMPINGAN");
    const hariIni = await sesiBaru(l.id, waktu(hari(0), "07:00"));
    const depan = await sesiBaru(l.id, waktu(hari(4), "07:00"));
    const selesai = await sesiBaru(l.id, waktu(hari(-2), "07:00"), pendA, "SELESAI");
    const daftar = await daftarSesiPendamping(db, pendA);
    const ambil = (id: string) => daftar.find((x) => x.id === id)!;
    expect(ambil(hariIni.id)).toMatchObject({ hariIni: true, mendatang: false, perluLaporan: false, bisaMulai: true, inisialKorban: "S.A.F." });
    expect(ambil(depan.id)).toMatchObject({ hariIni: false, mendatang: true, bisaMulai: false });
    expect(ambil(selesai.id)).toMatchObject({ perluLaporan: true, hariIni: false, mendatang: false });
    const json = JSON.stringify(daftar.filter((x) => [hariIni.id, depan.id, selesai.id].includes(x.id)));
    for (const rahasia of ["Siti Aminah", "Rahasia", "081299990000", "081288880000", "v1.x.y.z"]) expect(json).not.toContain(rahasia);
    expect(await daftarSesiPendamping(db, pendB)).toEqual([]);
  });

  it("ringkasan kasus memuat yang perlu untuk pendampingan saja dan hanya untuk pemilik sesi", async () => {
    const l = await laporanBaru("DALAM_PENDAMPINGAN");
    const s1 = await sesiBaru(l.id, waktu(hari(-3), "09:00"), pendB, "SELESAI");
    const s2 = await sesiBaru(l.id, waktu(hari(1), "09:00"), pendA);
    const r = await ringkasanSesiPendamping(db, s2.id, pendA, new Date("2026-10-08T00:00:00Z"));
    expect(r).toMatchObject({
      urutan: 2,
      kasus: { kode: l.kodePendaftaran, inisialKorban: "S.A.F.", jenisKelamin: "PEREMPUAN", usia: 15, jenisKekerasan: `Jenis ${awalan}`, kronologi: expect.stringContaining("pendampingan") },
    });
    expect(r?.linimasa.map((x) => [x.urutan, x.pendamping, x.saatIni])).toEqual([[1, "Pendamping Sb", false], [2, "Anda", true]]);
    const json = JSON.stringify(r);
    for (const rahasia of ["Siti Aminah", "Rahasia", "081299990000", "081288880000", "v1.x.y.z"]) expect(json).not.toContain(rahasia);
    expect(await ringkasanSesiPendamping(db, s2.id, pendB)).toBeNull();
    expect(await ringkasanSesiPendamping(db, s1.id, pendA)).toBeNull();
  });
});

const jadwal = (ekstra: Record<string, string> = {}) => ({
  jenisPendampingId: jenisPId,
  pendampingId: pendA,
  lokasiId,
  tanggal: hari(5),
  jamMulai: "10:00",
  jamSelesai: "11:00",
  ...ekstra,
});

describe("Admin menambah dan membatalkan sesi", () => {
  it("menambah sesi kedua pada satu laporan: urutan, tiket, pemberitahuan, audit", async () => {
    const l = await laporanBaru("DALAM_PENDAMPINGAN");
    await sesiBaru(l.id, waktu(hari(-1), "09:00"), pendA, "SELESAI");
    const h = await tambahSesi(db, l.id, adminId, jadwal({ pendampingId: pendB }));
    expect(h.ok).toBe(true);
    const sesi = await db.sesi.findMany({ where: { laporanId: l.id }, orderBy: { urutan: "asc" }, include: { tiket: true } });
    expect(sesi.map((s) => s.urutan)).toEqual([1, 2]);
    expect(sesi[1]).toMatchObject({ pendampingId: pendB, status: "TERJADWAL" });
    expect(sesi[1].tiket?.nomorAntrean).toBe(h.ok ? h.pesan : "?");
    const notif = await db.notifikasi.findMany({ where: { sesiId: sesi[1].id } });
    expect(notif.map((n) => n.penerima).sort()).toEqual(["PELAPOR", "PENDAMPING"]);
    expect(notif.find((n) => n.penerima === "PENDAMPING")?.penerimaId).toBe(pendB);
    expect(await db.logAudit.count({ where: { entitasId: sesi[1].id, aksi: "TAMBAH_SESI" } })).toBe(1);
  });

  it("menolak sesi baru pada laporan yang belum terverifikasi atau sudah ditutup, dan jadwal yang tidak valid", async () => {
    const baru = await laporanBaru("BARU");
    const tutup = await laporanBaru("DITUTUP");
    const ok = await laporanBaru("TERVERIFIKASI");
    expect(await tambahSesi(db, baru.id, adminId, jadwal())).toMatchObject({ ok: false, pesan: expect.stringContaining("terverifikasi") });
    expect(await tambahSesi(db, tutup.id, adminId, jadwal())).toMatchObject({ ok: false });
    expect(await tambahSesi(db, ok.id, adminId, jadwal({ tanggal: hari(-2) }))).toMatchObject({ ok: false, galat: { tanggal: expect.any(String) } });
    expect(await tambahSesi(db, "tidak-ada", adminId, jadwal())).toEqual({ ok: false, pesan: "Laporan tidak ditemukan." });
    expect(await db.sesi.count({ where: { laporanId: { in: [baru.id, tutup.id, ok.id] } } })).toBe(0);
  });

  it("membatalkan sesi yang belum dimulai dengan alasan; tiket dilewati, riwayat dan pemberitahuan tercatat", async () => {
    const l = await laporanBaru("TERVERIFIKASI");
    const s = await sesiBaru(l.id, waktu(hari(2), "09:00"));
    expect(await batalkanSesi(db, s.id, adminId, "  ")).toMatchObject({ ok: false });
    expect(await batalkanSesi(db, s.id, adminId, "Pelapor pindah domisili.")).toEqual({ ok: true });
    expect((await db.sesi.findUniqueOrThrow({ where: { id: s.id } })).status).toBe("DIBATALKAN");
    expect((await db.tiket.findUniqueOrThrow({ where: { sesiId: s.id } })).statusAntrean).toBe("DILEWATI");
    const riwayat = await db.riwayatJadwal.findFirstOrThrow({ where: { sesiId: s.id } });
    expect(riwayat).toMatchObject({ alasan: "Pelapor pindah domisili.", perubahan: { status: { dari: "TERJADWAL", ke: "DIBATALKAN" } } });
    expect(await db.notifikasi.count({ where: { sesiId: s.id } })).toBe(2);
    expect(await batalkanSesi(db, s.id, adminId, "Sudah dibatalkan.")).toMatchObject({ ok: false, pesan: expect.stringContaining("Terjadwal") });
    const berjalan = await sesiBaru(l.id, waktu(hari(0), "09:00"), pendA, "BERLANGSUNG");
    expect(await batalkanSesi(db, berjalan.id, adminId, "Tidak boleh.")).toMatchObject({ ok: false });
  });
});

describe("tutup kasus", () => {
  it("ditolak selama ada sesi aktif atau belum ada sesi; berhasil setelah semua sesi selesai", async () => {
    const kosong = await laporanBaru("TERVERIFIKASI");
    expect((await syaratTutupKasus(db, kosong.id)).alasan).toContain("Belum ada sesi pendampingan.");
    expect(await tutupKasus(db, kosong.id, adminId)).toMatchObject({ ok: false });

    const l = await laporanBaru("DALAM_PENDAMPINGAN");
    await sesiBaru(l.id, waktu(hari(-3), "09:00"), pendA, "SELESAI");
    const aktif = await sesiBaru(l.id, waktu(hari(2), "09:00"));
    const s = await syaratTutupKasus(db, l.id);
    expect(s.bisa).toBe(false);
    expect(s.alasan.join(" ")).toContain("1 sesi yang belum selesai");
    expect(await tutupKasus(db, l.id, adminId)).toMatchObject({ ok: false });

    await batalkanSesi(db, aktif.id, adminId, "Tidak diperlukan lagi.");
    expect((await syaratTutupKasus(db, l.id)).bisa).toBe(true);
    expect(await tutupKasus(db, l.id, adminId)).toEqual({ ok: true });
    const tutup = await db.laporan.findUniqueOrThrow({ where: { id: l.id } });
    expect(tutup.status).toBe("DITUTUP");
    expect(tutup.ditutupPada).not.toBeNull();
    expect(await db.logAudit.count({ where: { entitasId: l.id, aksi: "TUTUP_KASUS" } })).toBe(1);
    expect(await tutupKasus(db, l.id, adminId)).toMatchObject({ ok: false, pesan: "Kasus sudah ditutup." });
    // Setelah ditutup tidak ada sesi baru dan jadwal tidak dapat diubah lagi.
    expect(await tambahSesi(db, l.id, adminId, jadwal())).toMatchObject({ ok: false });
  });

  it("ditolak bila masih ada usulan sesi lanjutan yang menunggu keputusan", async () => {
    const l = await laporanBaru("DALAM_PENDAMPINGAN");
    const s = await sesiBaru(l.id, waktu(hari(-1), "09:00"), pendA, "SELESAI");
    const lp = await db.laporanPendampingan.create({
      data: { sesiId: s.id, penulisId: pendA, jenisPendampingan: "Konseling", keterangan: "uji", rekomendasi: "uji", ajukanSesiLanjutan: true, dikirimPada: new Date() },
    });
    await db.usulanSesi.create({ data: { laporanPendampinganId: lp.id } });
    const sy = await syaratTutupKasus(db, l.id);
    expect(sy.bisa).toBe(false);
    expect(sy.alasan.join(" ")).toContain("usulan sesi lanjutan");
  });
});
