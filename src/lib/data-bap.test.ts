import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import { muatBap } from "./bap";
import { BIDANG_BAP, bolehAksesKasus, isianBapAwal, periksaIsianBap, simpanDataBap, type IsianBap } from "./data-bap";
import { dekripsiNik, enkripsiNik, indeksNik } from "./nik";
import { KUNCI_KEPALA_NAMA, KUNCI_KEPALA_NIP, bacaPengaturanBap, simpanPengaturanBap } from "./pengaturan";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const acak = Array.from({ length: 6 }, () => "ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(Math.random() * 23)]).join("");
const awalan = `UjiBap${acak}`;
// NIK fiktif berbentuk benar (bukan milik siapa pun).
const NIK_KORBAN = "3204014101100002";
const NIK_PELAPOR = "3204010101800001";
const NIK_PELAKU = "3204010202750003";

let adminId = "";
let pendA = "";
let pendB = "";
let jenisId = "";
let jenisPId = "";
let lokasiId = "";
let agamaId = "";
let pekerjaanId = "";
let hubunganId = "";
let rujukanId = "";
const laporanIds: string[] = [];
let urut = 0;
let pengaturanAwal: { kunci: string; nilai: string; diubahOlehId: string | null }[] = [];

const kosong = (): IsianBap => Object.fromEntries(BIDANG_BAP.map((k) => [k, ""])) as IsianBap;

async function laporanBaru(sendiri = false) {
  const n = urut++;
  const l = await db.laporan.create({
    data: {
      kodePendaftaran: `PPA-261016-${acak.slice(0, 5)}${"ABCDEFGHJKMNPQRSTUVWXYZ"[n]}`,
      pelaporAdalahKorban: sendiri,
      jenisKekerasanId: jenisId,
      kronologi: "Kronologi fiktif untuk pengujian BAP.",
      tanggalKejadian: new Date("2026-10-01T00:00:00"),
      tempatKejadian: "Rumah korban",
      persetujuanData: true,
      persetujuanPada: new Date(),
      status: "TERVERIFIKASI",
      korban: {
        create: {
          nama: "Korban Fiktif",
          nikCipher: enkripsiNik(NIK_KORBAN),
          nikIndeks: indeksNik(NIK_KORBAN),
          jenisKelamin: "PEREMPUAN",
          tanggalLahir: new Date("2011-03-04T00:00:00Z"),
          alamat: "Jl. Domisili No. 9",
          kontak: "081299990000",
          agamaId,
        },
      },
      pelapor: sendiri ? undefined : { create: { nama: "Pelapor Fiktif", nikCipher: enkripsiNik(NIK_PELAPOR), nikIndeks: indeksNik(NIK_PELAPOR), kontak: "081288880000", alamat: "Jl. Pelapor No. 1", hubunganId } },
    },
  });
  laporanIds.push(l.id);
  return l.id;
}

beforeAll(async () => {
  adminId = (await db.pengguna.create({ data: { nama: "Admin Bap", email: `admin${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "ADMIN" } })).id;
  jenisId = (await db.jenisKekerasan.create({ data: { nama: `Jenis ${awalan}` } })).id;
  jenisPId = (await db.jenisPendampingan.create({ data: { kode: awalan.slice(-7), nama: `Pendampingan ${awalan}` } })).id;
  lokasiId = (await db.lokasi.create({ data: { nama: `Lokasi ${awalan}`, alamat: "Jl. Fiktif No. 5" } })).id;
  agamaId = (await db.agama.findFirstOrThrow({ where: { aktif: true } })).id;
  pekerjaanId = (await db.pekerjaan.findFirstOrThrow({ where: { aktif: true } })).id;
  hubunganId = (await db.hubunganKorban.findFirstOrThrow({ where: { aktif: true } })).id;
  rujukanId = (await db.asalRujukan.findFirstOrThrow({ where: { nama: "Kepolisian" } })).id;
  const mk = (nama: string) => db.pengguna.create({ data: { nama, email: `${nama.toLowerCase()}${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "PENDAMPING" } });
  pendA = (await mk("PendA")).id;
  pendB = (await mk("PendB")).id;
  pengaturanAwal = await db.pengaturan.findMany({ where: { kunci: { in: [KUNCI_KEPALA_NAMA, KUNCI_KEPALA_NIP] } }, select: { kunci: true, nilai: true, diubahOlehId: true } });
});

afterAll(async () => {
  await db.logAudit.deleteMany({ where: { OR: [{ entitasId: { in: laporanIds } }, { penggunaId: { in: [adminId, pendA, pendB] } }] } });
  await db.sesi.deleteMany({ where: { laporanId: { in: laporanIds } } });
  await db.laporan.deleteMany({ where: { id: { in: laporanIds } } });
  // Kembalikan pengaturan seperti sebelum tes.
  await db.pengaturan.deleteMany({ where: { kunci: { in: [KUNCI_KEPALA_NAMA, KUNCI_KEPALA_NIP] } } });
  for (const p of pengaturanAwal) await db.pengaturan.create({ data: p });
  await db.pengguna.deleteMany({ where: { id: { in: [pendA, pendB, adminId] } } });
  await db.lokasi.deleteMany({ where: { id: lokasiId } });
  await db.jenisPendampingan.deleteMany({ where: { id: jenisPId } });
  await db.jenisKekerasan.deleteMany({ where: { id: jenisId } });
  await db.$disconnect();
});

describe("hak akses kasus", () => {
  it("Admin selalu boleh; Pendamping hanya bila punya sesi yang tidak dibatalkan", async () => {
    const id = await laporanBaru();
    const mulai = new Date(Date.now() + 86400000);
    const sesi = { laporanId: id, jenisPendampingId: jenisPId, lokasiId, mulai, selesai: new Date(mulai.getTime() + 3600000) };
    await db.sesi.create({ data: { ...sesi, urutan: 1, pendampingId: pendA } });
    await db.sesi.create({ data: { ...sesi, urutan: 2, pendampingId: pendB, status: "DIBATALKAN" } });
    expect(await bolehAksesKasus(db, { id: adminId, peran: "ADMIN" }, id)).toBe(true);
    expect(await bolehAksesKasus(db, { id: pendA, peran: "PENDAMPING" }, id)).toBe(true);
    expect(await bolehAksesKasus(db, { id: pendB, peran: "PENDAMPING" }, id)).toBe(false);
    expect(await bolehAksesKasus(db, { id: pendA, peran: "PETUGAS" }, id)).toBe(false);
  });
});

describe("periksaIsianBap", () => {
  it("semua bidang tidak wajib; bentuk yang salah ditandai", () => {
    expect(periksaIsianBap(kosong())).toEqual({});
    const g = periksaIsianBap({ ...kosong(), terlaporNik: "123", korbanNoBpjs: "12", terlaporUsia: "200", pelaporJenisKelamin: "X", pelaporTanggalLahir: "2999-01-01" });
    expect(g).toMatchObject({
      terlaporNik: expect.stringContaining("16 digit"),
      korbanNoBpjs: expect.stringContaining("13 digit"),
      terlaporUsia: expect.any(String),
      pelaporJenisKelamin: "Pilihan tidak dikenal.",
      pelaporTanggalLahir: expect.stringContaining("masa depan"),
    });
    expect(periksaIsianBap({ ...kosong(), terlaporJenisKelamin: "LAINNYA", korbanNoBpjs: "0001 2345 6789 0" })).toEqual({});
  });
});

describe("simpanDataBap", () => {
  it("menyimpan data pelapor, korban, pelaku (baru), dan tindak lanjut; NIK pelaku terenkripsi; audit tanpa isi", async () => {
    const id = await laporanBaru();
    const v: IsianBap = {
      ...(await isianBapAwal(db, id))!.isian,
      pelaporJenisKelamin: "LAKI_LAKI",
      pelaporTanggalLahir: "1980-01-01",
      pelaporPekerjaanId: pekerjaanId,
      pelaporAlamatKtp: "Jl. KTP Pelapor",
      korbanNamaPanggilan: "Nengsih",
      korbanNoBpjs: "0001-2345-6789-0",
      korbanStatusBpjs: "AKTIF",
      korbanAlamatKtp: "Jl. KTP Korban",
      terlaporNama: "Pelaku Fiktif",
      terlaporNik: NIK_PELAKU,
      terlaporAgamaId: agamaId,
      terlaporHubunganId: hubunganId,
      asalRujukanId: rujukanId,
      alasanRujukan: "Perlu pendampingan hukum.",
      lembagaRujukan: "Unit PPA Polresta",
    };
    const h = await simpanDataBap(db, id, v, pendA);
    expect(h.ok).toBe(true);

    const l = await db.laporan.findUniqueOrThrow({ where: { id }, include: { pelapor: true, korban: true, terlapor: true } });
    expect(l).toMatchObject({ asalRujukanId: rujukanId, alasanRujukan: "Perlu pendampingan hukum.", lembagaRujukan: "Unit PPA Polresta", tempatKejadian: "Rumah korban" });
    expect(l.pelapor).toMatchObject({ jenisKelamin: "LAKI_LAKI", pekerjaanId, alamatKtp: "Jl. KTP Pelapor" });
    expect(l.pelapor?.tanggalLahir?.toISOString().slice(0, 10)).toBe("1980-01-01");
    expect(l.korban).toMatchObject({ namaPanggilan: "Nengsih", noBpjs: "0001234567890", statusBpjs: "AKTIF", alamatKtp: "Jl. KTP Korban", agamaId });
    expect(l.terlapor).toHaveLength(1);
    expect(l.terlapor[0]).toMatchObject({ nama: "Pelaku Fiktif", agamaId, hubunganId, nikIndeks: indeksNik(NIK_PELAKU) });
    expect(l.terlapor[0].nikCipher).not.toContain(NIK_PELAKU);
    expect(dekripsiNik(l.terlapor[0].nikCipher!)).toBe(NIK_PELAKU);

    const audit = await db.logAudit.findFirstOrThrow({ where: { entitasId: id, aksi: "LENGKAPI_DATA_BAP" } });
    expect(audit.penggunaId).toBe(pendA);
    expect(JSON.stringify(audit.rincian)).not.toContain(NIK_PELAKU);
    expect((audit.rincian as { bidang: string[] }).bidang).toEqual(expect.arrayContaining(["terlaporNik", "korbanNoBpjs", "lembagaRujukan"]));

    // NIK pelaku kosong berarti tidak diubah; isian awal tidak membocorkan NIK.
    const awal = (await isianBapAwal(db, id))!;
    expect(awal.isian.terlaporNik).toBe("");
    expect(awal.nikTerlapor).not.toContain(NIK_PELAKU.slice(4, 12));
    expect((await simpanDataBap(db, id, { ...awal.isian, lembagaRujukan: "Unit PPA Polres Bandung" }, adminId)).ok).toBe(true);
    const t = await db.terlapor.findFirstOrThrow({ where: { laporanId: id } });
    expect(dekripsiNik(t.nikCipher!)).toBe(NIK_PELAKU);
  });

  it("tanpa perubahan tidak menulis audit; pilihan master yang tidak ada ditolak", async () => {
    const id = await laporanBaru();
    const awal = (await isianBapAwal(db, id))!;
    expect(await simpanDataBap(db, id, awal.isian, adminId)).toEqual({ ok: true, berubah: [] });
    expect(await db.logAudit.count({ where: { entitasId: id, aksi: "LENGKAPI_DATA_BAP" } })).toBe(0);
    const h = await simpanDataBap(db, id, { ...awal.isian, korbanAgamaId: "tidak-ada", terlaporPekerjaanId: "tidak-ada", asalRujukanId: "tidak-ada" }, adminId);
    expect(h.ok).toBe(false);
    expect(!h.ok && h.galat).toMatchObject({ korbanAgamaId: expect.any(String), terlaporPekerjaanId: expect.any(String), asalRujukanId: expect.any(String) });
  });

  it("BAP mencetak Datang langsung hanya bila asal rujukan dan lembaga perujuk sama-sama kosong", async () => {
    const id = await laporanBaru();
    expect((await muatBap(db, id, adminId))!.asalRujukan).toBe("Datang/lapor langsung");
    // Laporan lama: petugas mengisi lembaga tanpa asal rujukan; jangan dicetak "Datang langsung".
    await db.laporan.update({ where: { id }, data: { lembagaRujukan: "Unit PPA Polresta" } });
    expect((await muatBap(db, id, adminId))!.asalRujukan).toBe("");
    await db.laporan.update({ where: { id }, data: { asalRujukanId: rujukanId } });
    expect((await muatBap(db, id, adminId))!).toMatchObject({ asalRujukan: "Kepolisian", lembagaRujukan: "Unit PPA Polresta" });
  });

  it("bila korban sendiri yang melapor, bidang pelapor diabaikan dan pelaku tidak dibuat tanpa isian", async () => {
    const id = await laporanBaru(true);
    const awal = (await isianBapAwal(db, id))!;
    expect(awal.adaPelapor).toBe(false);
    expect((await simpanDataBap(db, id, { ...awal.isian, pelaporJenisKelamin: "PEREMPUAN", tempatKejadian: "Sekolah" }, adminId)).ok).toBe(true);
    expect(await db.pelapor.count({ where: { laporanId: id } })).toBe(0);
    expect(await db.terlapor.count({ where: { laporanId: id } })).toBe(0);
    expect((await db.laporan.findUniqueOrThrow({ where: { id } })).tempatKejadian).toBe("Sekolah");
  });
});

describe("muatBap", () => {
  it("memuat NIK utuh, pilihan master, dan mencatat pembukaan di audit", async () => {
    const id = await laporanBaru();
    const b = (await muatBap(db, id, adminId))!;
    expect(b.korban?.nik).toBe(NIK_KORBAN);
    expect(b.pelapor?.nik).toBe(NIK_PELAPOR);
    expect(b.korban?.usia).toMatch(/tahun$/);
    expect(b.relasiPelaporId).toBe(hubunganId);
    expect(b.pilihan.hubungan.some((h) => h.id === hubunganId)).toBe(true);
    expect(b.pilihan.jenisKekerasan.some((j) => j.id === jenisId)).toBe(true);
    expect(b.pilihan.jenisKelamin.map((j) => j.nilai)).toContain("LAINNYA");
    expect(b.tkp).toBe("Rumah korban");
    expect(await db.logAudit.count({ where: { entitasId: id, aksi: "CETAK_BAP", penggunaId: adminId } })).toBe(1);
  });

  it("korban sendiri yang melapor: data pelapor sama dengan korban dan relasi Korban", async () => {
    const id = await laporanBaru(true);
    const b = (await muatBap(db, id, adminId))!;
    expect(b.pelaporAdalahKorban).toBe(true);
    expect(b.pelapor?.nama).toBe("Korban Fiktif");
    expect(b.relasiPelaporId).toBeNull();
  });
});

describe("pengaturan penandatangan BAP", () => {
  it("memvalidasi nama dan NIP, menyimpan, dan mencatat audit", async () => {
    const salah = await simpanPengaturanBap(db, { kepalaUptdNama: "A", kepalaUptdNip: "123" }, adminId);
    expect(salah.ok).toBe(false);
    expect(!salah.ok && salah.galat).toMatchObject({ kepalaUptdNama: expect.any(String), kepalaUptdNip: "NIP harus 18 digit angka." });

    // Nama unik agar selalu berbeda dari pengaturan yang sudah ada di basis data.
    const nama = `Kepala ${awalan}, S.Sos.`;
    expect((await simpanPengaturanBap(db, { kepalaUptdNama: nama, kepalaUptdNip: "19850101 201401 2 001" }, adminId)).ok).toBe(true);
    expect(await bacaPengaturanBap(db)).toEqual({ kepalaUptdNama: nama, kepalaUptdNip: "198501012014012001" });
    expect(await db.logAudit.count({ where: { penggunaId: adminId, aksi: "UBAH_PENGATURAN_BAP" } })).toBe(1);
  });
});
