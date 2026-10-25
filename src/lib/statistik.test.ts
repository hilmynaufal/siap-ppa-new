import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import { bacaPeriode, kelompokUsia, periodeSebelumnya, statistikKasus, TANPA_KECAMATAN, TANPA_RUJUKAN, usiaPada } from "./statistik";
import { judulLaporan, statistikXlsx } from "./statistik-ekspor";

describe("usia dan kelompok", () => {
  it("menghitung usia penuh pada tanggal acuan", () => {
    expect(usiaPada("2008-05-10", "2026-05-09")).toBe(17);
    expect(usiaPada("2008-05-10", "2026-05-10")).toBe(18);
  });
  it("anak bila di bawah 18 tahun; tanpa tanggal lahir tidak diketahui", () => {
    expect(kelompokUsia("2008-05-10", "2026-05-09")).toBe("ANAK");
    expect(kelompokUsia("2008-05-10", "2026-05-10")).toBe("DEWASA");
    expect(kelompokUsia(null, "2026-05-10")).toBe("TIDAK_DIKETAHUI");
    expect(kelompokUsia("2030-01-01", "2026-05-10")).toBe("TIDAK_DIKETAHUI");
  });
});

describe("periode", () => {
  const SEKARANG = new Date("2026-10-25T05:00:00Z");
  it("bawaan bulan berjalan; masa depan dan nilai asing ditolak", () => {
    expect(bacaPeriode({}, SEKARANG).kunci).toBe("2026-10");
    expect(bacaPeriode({ tahun: "2026", bulan: "11" }, SEKARANG).kunci).toBe("2026-10");
    expect(bacaPeriode({ tahun: "2019", bulan: "1" }, SEKARANG).kunci).toBe("2026-10");
    expect(bacaPeriode({ tahun: "2026", bulan: "x" }, SEKARANG).kunci).toBe("2026-10");
  });
  it("bulan dan setahun penuh, dengan batas waktu Jakarta", () => {
    const p = bacaPeriode({ tahun: "2026", bulan: "1" }, SEKARANG);
    expect(p.label).toBe("Januari 2026");
    expect(p.mulai.toISOString()).toBe("2025-12-31T17:00:00.000Z");
    expect(p.akhir.toISOString()).toBe("2026-01-31T17:00:00.000Z");
    expect(periodeSebelumnya(p).kunci).toBe("2025-12");
    const t = bacaPeriode({ tahun: "2025", bulan: "semua" }, SEKARANG);
    expect(t.label).toBe("Tahun 2025");
    expect(periodeSebelumnya(t).kunci).toBe("2024");
  });
  it("judul laporan mengikuti format resmi", () => {
    expect(judulLaporan({ periode: { label: "Januari 2026", kunci: "2026-01", tahun: 2026, bulan: 1 } }).periode).toBe("BULAN JANUARI TAHUN 2026");
    expect(judulLaporan({ periode: { label: "Tahun 2026", kunci: "2026", tahun: 2026, bulan: null } }).periode).toBe("TAHUN 2026");
  });
});

// Tahun 2034 hanya berisi data uji ini, jadi angka statistik dapat dipastikan.
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const acak = Array.from({ length: 6 }, () => "ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(Math.random() * 23)]).join("");
const ids: string[] = [];
let jenisA = "";
let jenisB = "";
let jenisNonaktif = "";
let rujukanId = "";
let kec: { id: string; nama: string }[] = [];
let n = 0;

async function laporan(o: {
  dibuat: string;
  status: "BARU" | "DITOLAK" | "TERVERIFIKASI" | "DALAM_PENDAMPINGAN" | "DITUTUP";
  jenis?: string;
  lahir?: string;
  kejadian?: string;
  jk?: "PEREMPUAN" | "LAKI_LAKI" | "LAINNYA";
  kec?: number;
  rujukan?: boolean;
  hapus?: boolean;
}) {
  const i = n++;
  const l = await db.laporan.create({
    data: {
      kodePendaftaran: `PPA-340101-${acak.slice(0, 4)}${"ABCDEFGHJKMNPQRSTUVWXYZ"[i]}`,
      jenisKekerasanId: o.jenis ?? jenisA,
      kronologi: "Kronologi fiktif untuk pengujian statistik.",
      persetujuanData: true,
      persetujuanPada: new Date(o.dibuat),
      status: o.status,
      dibuatPada: new Date(o.dibuat),
      diverifikasiPada: o.status === "BARU" ? null : new Date(new Date(o.dibuat).getTime() + 2 * 24 * 3600e3),
      tanggalKejadian: o.kejadian ? new Date(`${o.kejadian}T00:00:00Z`) : null,
      asalRujukanId: o.rujukan ? rujukanId : null,
      dihapusPada: o.hapus ? new Date() : null,
      korban: {
        create: {
          nama: "Nama Fiktif",
          jenisKelamin: o.jk ?? "PEREMPUAN",
          tanggalLahir: o.lahir ? new Date(`${o.lahir}T00:00:00Z`) : null,
          kecamatanId: o.kec === undefined ? null : kec[o.kec].id,
        },
      },
    },
  });
  ids.push(l.id);
}

beforeAll(async () => {
  jenisA = (await db.jenisKekerasan.create({ data: { nama: `A Stat ${acak}` } })).id;
  jenisB = (await db.jenisKekerasan.create({ data: { nama: `B Stat ${acak}` } })).id;
  jenisNonaktif = (await db.jenisKekerasan.create({ data: { nama: `C Stat ${acak}`, aktif: false } })).id;
  rujukanId = (await db.asalRujukan.create({ data: { nama: `Rujukan ${acak}` } })).id;
  kec = await db.kecamatan.findMany({ orderBy: { nama: "asc" }, take: 2, select: { id: true, nama: true } });

  // Maret 2034 (waktu Jakarta)
  await laporan({ dibuat: "2034-03-05T03:00:00Z", status: "TERVERIFIKASI", lahir: "2020-01-01", kec: 0, rujukan: true }); // anak P
  await laporan({ dibuat: "2034-03-06T03:00:00Z", status: "DALAM_PENDAMPINGAN", lahir: "2016-06-01", jk: "LAKI_LAKI", kec: 0, jenis: jenisB }); // anak L
  await laporan({ dibuat: "2034-03-07T03:00:00Z", status: "DITUTUP", lahir: "1990-01-01", kec: 1 }); // dewasa P
  // Lahir 2016-03-10: 17 tahun saat kejadian (2034-03-01), walau 18 tahun saat melapor -> anak.
  await laporan({ dibuat: "2034-03-20T03:00:00Z", status: "TERVERIFIKASI", lahir: "2016-03-10", kejadian: "2034-03-01", jk: "LAKI_LAKI", kec: 1 });
  await laporan({ dibuat: "2034-03-21T03:00:00Z", status: "TERVERIFIKASI", jenis: jenisNonaktif }); // usia & kecamatan tidak diketahui
  await laporan({ dibuat: "2034-02-28T17:30:00Z", status: "TERVERIFIKASI", lahir: "1990-01-01" }); // 1 Maret 00.30 WIB -> Maret
  // Tidak dihitung
  await laporan({ dibuat: "2034-03-08T03:00:00Z", status: "BARU", lahir: "1990-01-01" });
  await laporan({ dibuat: "2034-03-09T03:00:00Z", status: "DITOLAK", lahir: "1990-01-01" });
  await laporan({ dibuat: "2034-03-10T03:00:00Z", status: "TERVERIFIKASI", lahir: "1990-01-01", hapus: true });
  // Februari 2034 (pembanding) dan Januari 2034 (tren)
  await laporan({ dibuat: "2034-02-10T03:00:00Z", status: "DITUTUP", lahir: "1990-01-01" });
  await laporan({ dibuat: "2034-01-10T03:00:00Z", status: "DITUTUP", lahir: "2020-01-01" });
});

afterAll(async () => {
  await db.laporan.deleteMany({ where: { id: { in: ids } } });
  await db.jenisKekerasan.deleteMany({ where: { id: { in: [jenisA, jenisB, jenisNonaktif] } } });
  await db.asalRujukan.deleteMany({ where: { id: rujukanId } });
  await db.$disconnect();
});

describe("statistikKasus", () => {
  const SEKARANG = new Date("2034-06-01T05:00:00Z");

  it("menghitung hanya laporan terverifikasi/dalam pendampingan/ditutup yang tidak di Sampah", async () => {
    const s = await statistikKasus(db, bacaPeriode({ tahun: "2034", bulan: "3" }, SEKARANG));
    expect(s.total).toBe(6);
    expect(s.sebelumnya).toEqual({ label: "Februari 2034", jumlah: 1 });
    expect(Object.fromEntries(s.usia.map((u) => [u.kunci, u.jumlah]))).toEqual({ DEWASA: 2, ANAK_P: 1, ANAK_L: 2, TIDAK_DIKETAHUI: 1 });
    expect(s.anak).toBe(3);
    expect(s.perempuan).toBe(4);
    expect(s.status.map((x) => x.jumlah)).toEqual([4, 1, 1]);
    expect(s.rataHariVerifikasi).toBe(2);
  });

  it("tabel kecamatan memisahkan anak/dewasa per jenis kelamin; jumlah cocok dengan total", async () => {
    const s = await statistikKasus(db, bacaPeriode({ tahun: "2034", bulan: "3" }, SEKARANG));
    const k0 = s.kecamatan.find((k) => k.nama === kec[0].nama)!;
    const k1 = s.kecamatan.find((k) => k.nama === kec[1].nama)!;
    expect(k0).toMatchObject({ anakP: 1, anakL: 1, dewasaP: 0, dewasaL: 0, jumlah: 2 });
    expect(k1).toMatchObject({ dewasaP: 1, anakL: 1, jumlah: 2 });
    const tanpa = s.kecamatan.find((k) => k.nama === TANPA_KECAMATAN)!;
    expect(tanpa).toMatchObject({ lain: 1, dewasaP: 1, jumlah: 2 });
    expect(s.kecamatan.at(-1)!.nama).toBe(TANPA_KECAMATAN);
    expect(s.kecamatan.reduce((a, k) => a + k.jumlah, 0)).toBe(s.total);
  });

  it("jenis kasus: semua jenis aktif tampil, jenis nonaktif hanya bila ada kasus", async () => {
    const s = await statistikKasus(db, bacaPeriode({ tahun: "2034", bulan: "3" }, SEKARANG));
    const uji = s.jenis.filter((j) => j.nama.endsWith(acak));
    expect(uji.map((j) => [j.nama.slice(0, 1), j.anak, j.dewasa, j.lain, j.jumlah])).toEqual([
      ["A", 2, 2, 0, 4],
      ["B", 1, 0, 0, 1],
      ["C", 0, 0, 1, 1],
    ]);
    const feb = await statistikKasus(db, bacaPeriode({ tahun: "2034", bulan: "2" }, SEKARANG));
    expect(feb.jenis.some((j) => j.nama === `C Stat ${acak}`)).toBe(false);
    expect(feb.jenis.some((j) => j.nama === `B Stat ${acak}`)).toBe(true);
    expect(s.rujukan.find((r) => r.nama === `Rujukan ${acak}`)?.jumlah).toBe(1);
    expect(s.rujukan.at(-1)).toEqual({ nama: TANPA_RUJUKAN, jumlah: 5 });
  });

  it("tren 12 bulan berakhir di bulan terpilih; setahun penuh Januari-Desember", async () => {
    const s = await statistikKasus(db, bacaPeriode({ tahun: "2034", bulan: "3" }, SEKARANG));
    expect(s.tren).toHaveLength(12);
    expect(s.tren[0].bulan).toBe("2033-04");
    expect(s.tren.at(-1)).toMatchObject({ bulan: "2034-03", anak: 3, dewasa: 2, lain: 1 });
    expect(s.tren.find((t) => t.bulan === "2034-01")).toMatchObject({ anak: 1, dewasa: 0 });
    const t = await statistikKasus(db, bacaPeriode({ tahun: "2034", bulan: "semua" }, SEKARANG));
    expect(t.total).toBe(8);
    expect(t.tren.map((x) => x.bulan)).toEqual(Array.from({ length: 12 }, (_, i) => `2034-${String(i + 1).padStart(2, "0")}`));
    expect(t.sebelumnya.label).toBe("Tahun 2033");
  });

  it("Excel berisi judul dan tabel, tanpa nama korban", async () => {
    const s = await statistikKasus(db, bacaPeriode({ tahun: "2034", bulan: "3" }, SEKARANG));
    const teks = new TextDecoder().decode(statistikXlsx(s, "1 Juni 2034"));
    expect(teks).toContain("BULAN MARET TAHUN 2034");
    expect(teks).toContain("TOTAL KESELURUHAN");
    expect(teks).toContain(kec[0].nama);
    expect(teks).not.toContain("Nama Fiktif");
  });
});
