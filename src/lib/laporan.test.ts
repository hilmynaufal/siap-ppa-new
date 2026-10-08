import "dotenv/config";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import {
  POLA_KODE,
  SkemaLaporan,
  bentukDataLaporan,
  buatKodePendaftaran,
  deteksiTipe,
  galatPerBidang,
  galatSampaiLangkah,
  hitungUsia,
  langkahDariBidang,
  periksaBerkas,
  type DataLaporan,
} from "./laporan";
import { periksaPilihanLaporan, simpanLaporan } from "./laporan-layanan";
import { dekripsiNik, indeksNik } from "./nik";

const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

// NIK fiktif berbentuk benar (bukan milik siapa pun).
const NIK_PELAPOR = "3204010101800001";
const NIK_KORBAN = "3204014101100002";

/** Isian formulir yang lengkap dan benar; tiap tes mengubah bagian yang diuji. */
const form = (ekstra: Record<string, string> = {}): Record<string, string> => ({
  pelaporAdalahKorban: "",
  pelaporNama: "Pelapor Uji",
  pelaporNik: "3204 0101-0180.0001",
  pelaporHubunganId: "hub",
  pelaporKontak: "0812 3456 7890",
  pelaporAlamat: "",
  pelaporKecamatanId: "",
  pelaporDesaId: "",
  korbanNama: "Korban Uji",
  korbanNik: NIK_KORBAN,
  korbanJenisKelamin: "PEREMPUAN",
  korbanTempatLahir: "Bandung",
  korbanTanggalLahir: "2010-05-20",
  korbanPendidikan: "SMP",
  korbanPekerjaanId: "",
  korbanStatusPerkawinan: "BELUM_KAWIN",
  korbanKontak: "",
  korbanAlamat: "Jl. Fiktif No. 1",
  korbanKecamatanId: "kec",
  korbanDesaId: "",
  jenisKekerasanId: "jenis",
  tanggalKejadian: "2026-10-03",
  kronologi: "Kronologi uji yang cukup panjang.",
  terlaporTidakDiketahui: "",
  terlaporNama: "",
  terlaporJenisKelamin: "",
  terlaporUsia: "",
  terlaporHubunganId: "",
  terlaporAlamat: "",
  persetujuan: "on",
  ...ekstra,
});

const galat = (v: Record<string, string>) => {
  const h = SkemaLaporan.safeParse(v);
  return h.success ? {} : galatPerBidang(h.error);
};

describe("kode pendaftaran", () => {
  it("berformat PPA-YYMMDD-XXXXXX tanpa huruf yang mudah tertukar", () => {
    for (let i = 0; i < 200; i++) expect(buatKodePendaftaran(new Date(2026, 9, 6))).toMatch(POLA_KODE);
    expect(buatKodePendaftaran(new Date(2026, 9, 6)).startsWith("PPA-261006-")).toBe(true);
  });
});

describe("skema formulir", () => {
  it("menerima isian lengkap dan benar, termasuk NIK dengan spasi/tanda hubung", () => {
    expect(galat(form())).toEqual({});
  });

  it("isian kosong: semua bidang wajib ditandai, bidang opsional tidak", () => {
    const g = SkemaLaporan.safeParse(Object.fromEntries(Object.keys(form()).map((k) => [k, ""])));
    expect(Object.keys(galatPerBidang(g.error!)).sort()).toEqual(
      [
        "pelaporNama", "pelaporNik", "pelaporHubunganId", "pelaporKontak",
        "korbanNama", "korbanNik", "korbanJenisKelamin", "korbanTanggalLahir", "korbanAlamat", "korbanKecamatanId",
        "jenisKekerasanId", "tanggalKejadian", "kronologi", "persetujuan",
      ].sort(),
    );
  });

  it("korban sendiri yang melapor: pelapor tidak diwajibkan, tetapi kontak korban wajib", () => {
    const sendiri = { pelaporAdalahKorban: "on", pelaporNama: "", pelaporNik: "", pelaporHubunganId: "", pelaporKontak: "" };
    expect(Object.keys(galat(form(sendiri)))).toEqual(["korbanKontak"]);
    expect(galat(form({ ...sendiri, korbanKontak: "0812 3456 7890" }))).toEqual({});
    expect(galat(form({ ...sendiri, korbanKontak: "abc" })).korbanKontak).toContain("tidak valid");
  });

  it("NIK harus 16 digit berformat benar", () => {
    for (const nik of ["123", "3204010101800", "32040101018000011", "320401010180000A", "3204010113800001", "3204013201800001"]) {
      expect(galat(form({ korbanNik: nik })).korbanNik, nik).toContain("16 digit");
    }
    expect(galat(form({ pelaporNik: "" })).pelaporNik).toBe("NIK pelapor wajib diisi.");
  });

  it("tanggal lahir: tidak valid, di masa depan, atau tidak masuk akal ditolak", () => {
    expect(galat(form({ korbanTanggalLahir: "2026-02-30" })).korbanTanggalLahir).toContain("tidak valid");
    expect(galat(form({ korbanTanggalLahir: "2999-01-01" })).korbanTanggalLahir).toContain("masa depan");
    expect(galat(form({ korbanTanggalLahir: "1800-01-01" })).korbanTanggalLahir).toContain("tidak masuk akal");
  });

  it("pilihan bernilai tetap dan nomor HP divalidasi; terlapor opsional tapi bila diisi harus benar", () => {
    expect(galat(form({ korbanJenisKelamin: "X" })).korbanJenisKelamin).toContain("tidak dikenal");
    expect(galat(form({ korbanPendidikan: "S9" })).korbanPendidikan).toContain("tidak dikenal");
    expect(galat(form({ pelaporKontak: "abc" })).pelaporKontak).toContain("tidak valid");
    expect(galat(form({ terlaporUsia: "150" })).terlaporUsia).toContain("0-120");
    expect(galat(form({ terlaporUsia: "35", terlaporJenisKelamin: "LAKI_LAKI" }))).toEqual({});
    // Saat pelaku belum diketahui, isian terlapor yang salah diabaikan.
    expect(galat(form({ terlaporTidakDiketahui: "on", terlaporUsia: "999" }))).toEqual({});
  });

  it("kejadian dan persetujuan seperti sebelumnya", () => {
    const besok = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    expect(galat(form({ tanggalKejadian: besok })).tanggalKejadian).toContain("masa depan");
    expect(galat(form({ kronologi: "pendek" })).kronologi).toContain("Kronologi wajib diisi");
    expect(galat(form({ persetujuan: "" })).persetujuan).toBe("Centang persetujuan untuk mengirim laporan.");
  });

  it("galat dipetakan ke langkah yang benar dan dapat disaring sampai langkah tertentu", () => {
    expect(langkahDariBidang("pelaporNik")).toBe(1);
    expect(langkahDariBidang("korbanDesaId")).toBe(2);
    expect(langkahDariBidang("kronologi")).toBe(3);
    expect(langkahDariBidang("terlaporUsia")).toBe(4);
    expect(langkahDariBidang("persetujuan")).toBe(5);
    const g = galat(form({ pelaporNama: "", kronologi: "x", persetujuan: "" }));
    expect(Object.keys(galatSampaiLangkah(g, 1))).toEqual(["pelaporNama"]);
    expect(Object.keys(galatSampaiLangkah(g, 3)).sort()).toEqual(["kronologi", "pelaporNama"]);
  });

  it("usia dihitung dari tanggal lahir", () => {
    const pada = new Date(2026, 9, 8); // 8 Oktober 2026
    expect(hitungUsia("2010-10-08", pada)).toBe(16);
    expect(hitungUsia("2010-10-09", pada)).toBe(15);
    expect(hitungUsia("2026-10-01", pada)).toBe(0);
    expect(hitungUsia("bukan", pada)).toBeNull();
  });

  it("bentukDataLaporan membersihkan NIK dan memutuskan ada tidaknya pelapor dan terlapor", () => {
    const biasa = bentukDataLaporan(SkemaLaporan.parse(form({ terlaporNama: "Terlapor Uji" })));
    expect(biasa.pelapor?.nik).toBe(NIK_PELAPOR);
    expect(biasa.terlapor).toMatchObject({ nama: "Terlapor Uji", usia: null, jenisKelamin: null });
    expect(biasa.korban).toMatchObject({ nik: NIK_KORBAN, tempatLahir: "Bandung", pekerjaanId: null, desaId: null });

    const sendiri = bentukDataLaporan(SkemaLaporan.parse(form({ pelaporAdalahKorban: "on", korbanKontak: "0812 3456 7890" })));
    expect(sendiri).toMatchObject({ pelaporAdalahKorban: true, pelapor: null, terlapor: null });
    expect(sendiri.korban.kontak).toBe("0812 3456 7890");

    expect(bentukDataLaporan(SkemaLaporan.parse(form({ terlaporTidakDiketahui: "on", terlaporNama: "Diabaikan" }))).terlapor).toBeNull();
  });
});

describe("berkas pendukung", () => {
  it("mengenali tipe dari isi, bukan nama", () => {
    expect(deteksiTipe(JPG)).toBe("image/jpeg");
    expect(deteksiTipe(PNG)).toBe("image/png");
    expect(deteksiTipe(PDF)).toBe("application/pdf");
    expect(deteksiTipe(new Uint8Array([0x4d, 0x5a, 0x90]))).toBeNull();
  });
  it("memeriksa ekstensi, ukuran, dan berkas kosong", () => {
    expect(periksaBerkas({ name: "a.jpg", size: 1000 })).toBeNull();
    expect(periksaBerkas({ name: "rekaman.mp4", size: 1000 })).toContain("Format tidak didukung");
    expect(periksaBerkas({ name: "besar.pdf", size: 7.4 * 1024 * 1024 })).toBe("Ukuran 7,4 MB. Maksimal 5 MB.");
    expect(periksaBerkas({ name: "kosong.png", size: 0 })).toBe("Berkas kosong.");
  });
});

// ---- Penyimpanan ke PostgreSQL dan disk ----
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const awalan = `Uji-K8-${Date.now()}`;
let dir = "";
let jenisId = "";
let kecamatanId = "";
let kecamatanLainId = "";
let hubunganId = "";
let desaId = "";

function data(ekstra: Partial<DataLaporan> = {}): DataLaporan {
  const d = bentukDataLaporan(
    SkemaLaporan.parse(form({ pelaporHubunganId: hubunganId, korbanKecamatanId: kecamatanId, korbanDesaId: desaId, jenisKekerasanId: jenisId, terlaporNama: "Terlapor Uji", terlaporUsia: "40" })),
  );
  return { ...d, ...ekstra };
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), "siap-ppa-uji-"));
  jenisId = (await db.jenisKekerasan.create({ data: { nama: awalan } })).id;
  const [kec, lain] = await Promise.all([db.kecamatan.findUniqueOrThrow({ where: { nama: "Soreang" } }), db.kecamatan.findUniqueOrThrow({ where: { nama: "Banjaran" } })]);
  kecamatanId = kec.id;
  kecamatanLainId = lain.id;
  hubunganId = (await db.hubunganKorban.findFirstOrThrow({ where: { aktif: true } })).id;
  desaId = (await db.desa.create({ data: { kecamatanId, nama: `${awalan} Desa` } })).id;
});

afterAll(async () => {
  await db.laporan.deleteMany({ where: { jenisKekerasanId: jenisId } });
  await db.jenisKekerasan.deleteMany({ where: { id: jenisId } });
  await db.desa.deleteMany({ where: { id: desaId } });
  await db.$disconnect();
  rmSync(dir, { recursive: true, force: true });
});

describe("simpanLaporan", () => {
  it("menyimpan laporan, pelapor, korban, dan terlapor; NIK terenkripsi dan dapat dicari lewat indeks", async () => {
    const hasil = await simpanLaporan(db, data(), [{ nama: "bukti.jpg", bytes: JPG }, { nama: "surat.pdf", bytes: PDF }], dir);
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.kode).toMatch(POLA_KODE);
    const l = await db.laporan.findUniqueOrThrow({
      where: { kodePendaftaran: hasil.kode },
      include: { dokumen: true, pelapor: true, korban: true, terlapor: true },
    });
    expect(l).toMatchObject({ status: "BARU", persetujuanData: true, pelaporAdalahKorban: false });
    expect(l.pelapor).toMatchObject({ nama: "Pelapor Uji", kontak: "0812 3456 7890", hubunganId });
    expect(l.korban).toMatchObject({ nama: "Korban Uji", jenisKelamin: "PEREMPUAN", pendidikan: "SMP", statusPerkawinan: "BELUM_KAWIN", kecamatanId, tempatLahir: "Bandung" });
    expect(l.korban?.tanggalLahir?.toISOString().slice(0, 10)).toBe("2010-05-20");
    expect(l.terlapor).toHaveLength(1);
    expect(l.terlapor[0]).toMatchObject({ nama: "Terlapor Uji", usia: 40 });

    // NIK tidak tersimpan sebagai teks biasa, tetapi dapat dibuka kembali dan dicari lewat indeks.
    for (const [baris, nik] of [[l.pelapor!, NIK_PELAPOR], [l.korban!, NIK_KORBAN]] as const) {
      expect(baris.nikCipher).not.toContain(nik);
      expect(dekripsiNik(baris.nikCipher!)).toBe(nik);
      expect(baris.nikIndeks).toBe(indeksNik(nik));
    }
    expect(await db.korban.count({ where: { nikIndeks: indeksNik(NIK_KORBAN), laporan: { jenisKekerasanId: jenisId } } })).toBeGreaterThanOrEqual(1);

    expect(l.dokumen).toHaveLength(2);
    for (const d of l.dokumen) expect(existsSync(path.join(dir, d.jalurBerkas))).toBe(true);
    expect(l.dokumen.map((d) => d.tipeMime).sort()).toEqual(["application/pdf", "image/jpeg"]);
  });

  it("korban sendiri yang melapor: tanpa baris pelapor dan tanpa terlapor", async () => {
    const d = data({ pelaporAdalahKorban: true, pelapor: null, terlapor: null });
    d.korban.kontak = "0812 3456 7890";
    const hasil = await simpanLaporan(db, d, [], dir);
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    const l = await db.laporan.findUniqueOrThrow({ where: { kodePendaftaran: hasil.kode }, include: { pelapor: true, korban: true, terlapor: true } });
    expect(l).toMatchObject({ pelaporAdalahKorban: true, pelapor: null, terlapor: [] });
    expect(l.korban?.kontak).toBe("0812 3456 7890");
  });

  it("menolak berkas yang isinya bukan JPG, PNG, atau PDF walau bernama .jpg", async () => {
    const hasil = await simpanLaporan(db, data(), [{ nama: "palsu.jpg", bytes: new Uint8Array([0x4d, 0x5a, 1, 2, 3]) }], dir);
    expect(hasil).toMatchObject({ ok: false });
    expect(!hasil.ok && hasil.pesan).toContain("bukan JPG, PNG, atau PDF");
  });

  it("menolak lebih dari 3 berkas dan berkas lebih dari 5 MB", async () => {
    const empat = [1, 2, 3, 4].map((i) => ({ nama: `b${i}.png`, bytes: PNG }));
    expect((await simpanLaporan(db, data(), empat, dir)).ok).toBe(false);
    const besar = new Uint8Array(5 * 1024 * 1024 + 1);
    besar.set(PNG);
    expect((await simpanLaporan(db, data(), [{ nama: "besar.png", bytes: besar }], dir)).ok).toBe(false);
  });

  it("membatalkan laporan bila berkas gagal ditulis (data pelapor/korban ikut hilang)", async () => {
    const jumlahSebelum = await db.laporan.count({ where: { jenisKekerasanId: jenisId } });
    const korbanSebelum = await db.korban.count({ where: { laporan: { jenisKekerasanId: jenisId } } });
    const bukanFolder = path.join(dir, "ini-berkas");
    writeFileSync(bukanFolder, "x");
    await expect(simpanLaporan(db, data(), [{ nama: "a.png", bytes: PNG }], bukanFolder)).rejects.toThrow();
    expect(await db.laporan.count({ where: { jenisKekerasanId: jenisId } })).toBe(jumlahSebelum);
    expect(await db.korban.count({ where: { laporan: { jenisKekerasanId: jenisId } } })).toBe(korbanSebelum);
  });
});

describe("periksaPilihanLaporan", () => {
  it("lolos untuk pilihan yang benar", async () => {
    expect(await periksaPilihanLaporan(db, data())).toEqual({});
  });

  it("menolak jenis, kecamatan, hubungan, dan pekerjaan yang tidak dikenal", async () => {
    const d = data({ jenisKekerasanId: "x" });
    d.korban.kecamatanId = "x";
    d.korban.pekerjaanId = "x";
    d.pelapor!.hubunganId = "x";
    expect(await periksaPilihanLaporan(db, d)).toMatchObject({
      jenisKekerasanId: expect.any(String),
      korbanKecamatanId: expect.any(String),
      korbanPekerjaanId: expect.any(String),
      pelaporHubunganId: expect.any(String),
    });
  });

  it("desa wajib bila kecamatannya sudah punya data desa, dan harus sesuai kecamatan", async () => {
    // Soreang punya desa uji -> wajib dipilih.
    const d = data();
    d.korban.desaId = null;
    const tanpaDesa = await periksaPilihanLaporan(db, d);
    expect(tanpaDesa.korbanDesaId).toBe("Pilih desa/kelurahan.");

    d.korban.desaId = desaId;
    expect(await periksaPilihanLaporan(db, d)).toEqual({});

    const salah = data();
    salah.korban.kecamatanId = kecamatanLainId;
    salah.korban.desaId = desaId;
    expect((await periksaPilihanLaporan(db, salah)).korbanDesaId).toContain("tidak sesuai");
  });
});

describe("data kecamatan", () => {
  it("memuat 31 kecamatan Kabupaten Bandung", async () => {
    expect(await db.kecamatan.count()).toBeGreaterThanOrEqual(31);
    expect(await db.kecamatan.findUnique({ where: { nama: "Soreang" } })).not.toBeNull();
  });
});
