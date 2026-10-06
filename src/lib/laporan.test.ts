import "dotenv/config";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import {
  Langkah1,
  Langkah2,
  Langkah3,
  POLA_KODE,
  SkemaLaporan,
  buatKodePendaftaran,
  deteksiTipe,
  galatPerBidang,
  periksaBerkas,
} from "./laporan";
import { simpanLaporan } from "./laporan-layanan";

const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

describe("kode pendaftaran", () => {
  it("berformat PPA-YYMMDD-XXXXXX tanpa huruf yang mudah tertukar", () => {
    for (let i = 0; i < 200; i++) expect(buatKodePendaftaran(new Date(2026, 9, 6))).toMatch(POLA_KODE);
    expect(buatKodePendaftaran(new Date(2026, 9, 6)).startsWith("PPA-261006-")).toBe(true);
  });
});

describe("langkah 1: pelapor dan korban", () => {
  it("meminta nama, nomor HP, dan nama korban", () => {
    const g = galatPerBidang(Langkah1.safeParse({ namaPelapor: "", kontakPelapor: "", namaKorban: "" }).error!);
    expect(g.namaPelapor).toBe("Nama pelapor wajib diisi.");
    expect(g.kontakPelapor).toContain("Nomor HP wajib diisi");
    expect(g.namaKorban).toContain("Nama panggilan juga boleh");
  });
  it("menolak nomor HP tidak valid dan usia di luar rentang, menerima usia dan jenis kelamin kosong", () => {
    const buruk = Langkah1.safeParse({ namaPelapor: "A", kontakPelapor: "abc", namaKorban: "B", usiaKorban: "150" });
    expect(galatPerBidang(buruk.error!)).toMatchObject({ kontakPelapor: expect.any(String), usiaKorban: expect.any(String) });
    const baik = Langkah1.safeParse({ namaPelapor: "A", kontakPelapor: "0812 3456 7890", namaKorban: "B", usiaKorban: "", jenisKelaminKorban: "" });
    expect(baik.success).toBe(true);
  });
});

describe("langkah 2: kejadian", () => {
  const dasar = { jenisKekerasanId: "j", kecamatanId: "k", tanggalKejadian: "2026-10-03", kronologi: "Ceritanya cukup panjang." };
  it("menerima data lengkap", () => expect(Langkah2.safeParse(dasar).success).toBe(true));
  it("menolak tanggal di masa depan, tidak valid, dan kronologi pendek", () => {
    const besok = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    expect(galatPerBidang(Langkah2.safeParse({ ...dasar, tanggalKejadian: besok }).error!).tanggalKejadian).toContain("masa depan");
    expect(Langkah2.safeParse({ ...dasar, tanggalKejadian: "2026-13-45" }).success).toBe(false);
    expect(galatPerBidang(Langkah2.safeParse({ ...dasar, kronologi: "pendek" }).error!).kronologi).toContain("Kronologi wajib diisi");
    expect(galatPerBidang(Langkah2.safeParse({ ...dasar, jenisKekerasanId: "", kecamatanId: "" }).error!)).toMatchObject({
      jenisKekerasanId: "Pilih jenis kekerasan.",
      kecamatanId: "Pilih kecamatan tempat kejadian.",
    });
  });
});

describe("langkah 3: persetujuan", () => {
  it("wajib dicentang", () => {
    expect(galatPerBidang(Langkah3.safeParse({}).error!).persetujuan).toBe("Centang persetujuan untuk mengirim laporan.");
    expect(Langkah3.safeParse({ persetujuan: "on" }).success).toBe(true);
  });
  it("skema gabungan memuat semua bidang wajib", () => {
    const g = galatPerBidang(SkemaLaporan.safeParse({}).error!);
    expect(Object.keys(g).sort()).toEqual(
      ["jenisKekerasanId", "kecamatanId", "kontakPelapor", "kronologi", "namaKorban", "namaPelapor", "persetujuan", "tanggalKejadian"].sort(),
    );
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

const data = () => ({
  namaPelapor: "Pelapor Uji",
  kontakPelapor: "0812 3456 7890",
  namaKorban: "Korban Uji",
  usiaKorban: 14,
  jenisKelaminKorban: "Perempuan" as const,
  jenisKekerasanId: jenisId,
  kecamatanId,
  tanggalKejadian: "2026-10-03",
  kronologi: "Kronologi uji yang cukup panjang.",
  persetujuan: "on" as const,
});

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), "siap-ppa-uji-"));
  jenisId = (await db.jenisKekerasan.create({ data: { nama: awalan } })).id;
  kecamatanId = (await db.kecamatan.findFirstOrThrow()).id;
});

afterAll(async () => {
  await db.laporan.deleteMany({ where: { jenisKekerasanId: jenisId } });
  await db.jenisKekerasan.deleteMany({ where: { id: jenisId } });
  await db.$disconnect();
  rmSync(dir, { recursive: true, force: true });
});

describe("simpanLaporan", () => {
  it("menyimpan laporan, mencatat berkas, dan menulis berkas di luar akar web", async () => {
    const hasil = await simpanLaporan(db, data(), [{ nama: "bukti.jpg", bytes: JPG }, { nama: "surat.pdf", bytes: PDF }], dir);
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.kode).toMatch(POLA_KODE);
    const l = await db.laporan.findUniqueOrThrow({ where: { kodePendaftaran: hasil.kode }, include: { dokumen: true } });
    expect(l).toMatchObject({ status: "BARU", persetujuanData: true, namaKorban: "Korban Uji" });
    expect(l.dokumen).toHaveLength(2);
    for (const d of l.dokumen) expect(existsSync(path.join(dir, d.jalurBerkas))).toBe(true);
    expect(l.dokumen.map((d) => d.tipeMime).sort()).toEqual(["application/pdf", "image/jpeg"]);
  });

  it("menyimpan laporan tanpa berkas (dokumen tidak wajib)", async () => {
    const hasil = await simpanLaporan(db, data(), [], dir);
    expect(hasil.ok).toBe(true);
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

  it("membatalkan laporan bila berkas gagal ditulis", async () => {
    const jumlahSebelum = await db.laporan.count({ where: { jenisKekerasanId: jenisId } });
    const bukanFolder = path.join(dir, "ini-berkas");
    writeFileSync(bukanFolder, "x");
    await expect(simpanLaporan(db, data(), [{ nama: "a.png", bytes: PNG }], bukanFolder)).rejects.toThrow();
    expect(await db.laporan.count({ where: { jenisKekerasanId: jenisId } })).toBe(jumlahSebelum);
  });
});

describe("data kecamatan", () => {
  it("memuat 31 kecamatan Kabupaten Bandung", async () => {
    expect(await db.kecamatan.count()).toBeGreaterThanOrEqual(31);
    expect(await db.kecamatan.findUnique({ where: { nama: "Soreang" } })).not.toBeNull();
  });
});
