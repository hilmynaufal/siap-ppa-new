import type { JenisKelamin, PrismaClient, StatusLaporan } from "@/generated/prisma/client";
import { LAPORAN_AKTIF } from "./aktif";

/**
 * Statistik kasus untuk Admin dan laporan bulanan resmi (format KTP/KTA Kabupaten Bandung).
 * Satu laporan = satu korban. Yang dihitung hanya laporan yang sudah lolos verifikasi dan tidak di Sampah;
 * laporan Baru dan Ditolak tidak dihitung. Periode mengikuti waktu laporan masuk menurut waktu Jakarta.
 * Tidak memuat nama atau data identitas korban.
 */
export const STATUS_DIHITUNG: StatusLaporan[] = ["TERVERIFIKASI", "DALAM_PENDAMPINGAN", "DITUTUP"];
/** Anak menurut UU Perlindungan Anak: belum berusia 18 tahun. */
export const USIA_DEWASA = 18;
export const BULAN_TREN = 12;
export const TAHUN_AWAL = 2024;

export const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const HARI_MS = 24 * 3600 * 1000;

export type KelompokUsia = "ANAK" | "DEWASA" | "TIDAK_DIKETAHUI";

const tanggalJakarta = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
const awalBulan = (t: number, b: number) => new Date(`${t}-${String(b).padStart(2, "0")}-01T00:00:00+07:00`);
/** Bulan ke-`b` (boleh di luar 1..12) digeser ke tahun yang sesuai. */
const geser = (t: number, b: number) => ({ t: t + Math.floor((b - 1) / 12), b: ((((b - 1) % 12) + 12) % 12) + 1 });

/** Usia (tahun penuh) pada tanggal acuan; keduanya YYYY-MM-DD. */
export function usiaPada(lahir: string, acuan: string): number {
  const [ly, lm, ld] = lahir.split("-").map(Number);
  const [ay, am, ad] = acuan.split("-").map(Number);
  return ay - ly - (am < lm || (am === lm && ad < ld) ? 1 : 0);
}

/** Kelompok usia korban pada tanggal kejadian (atau tanggal lapor bila tanggal kejadian kosong). */
export function kelompokUsia(lahir: string | null, acuan: string): KelompokUsia {
  if (!lahir) return "TIDAK_DIKETAHUI";
  const u = usiaPada(lahir, acuan);
  if (u < 0) return "TIDAK_DIKETAHUI";
  return u < USIA_DEWASA ? "ANAK" : "DEWASA";
}

export type Periode = { tahun: number; bulan: number | null; mulai: Date; akhir: Date; label: string; kunci: string };

function buatPeriode(tahun: number, bulan: number | null): Periode {
  if (bulan === null) return { tahun, bulan, mulai: awalBulan(tahun, 1), akhir: awalBulan(tahun + 1, 1), label: `Tahun ${tahun}`, kunci: String(tahun) };
  const n = geser(tahun, bulan + 1);
  return {
    tahun,
    bulan,
    mulai: awalBulan(tahun, bulan),
    akhir: awalBulan(n.t, n.b),
    label: `${NAMA_BULAN[bulan - 1]} ${tahun}`,
    kunci: `${tahun}-${String(bulan).padStart(2, "0")}`,
  };
}

/**
 * Periode dari parameter alamat: `tahun` dan `bulan` (1-12, atau "semua" untuk setahun penuh).
 * Nilai yang tidak dikenal atau di masa depan kembali ke bulan berjalan.
 */
export function bacaPeriode(q: { tahun?: string | null; bulan?: string | null }, sekarang = new Date()): Periode {
  const [ty, tm] = tanggalJakarta(sekarang).split("-").map(Number);
  const tahun = Number(q.tahun);
  if (!Number.isInteger(tahun) || tahun < TAHUN_AWAL || tahun > ty) return buatPeriode(ty, tm);
  if (q.bulan === "semua") return buatPeriode(tahun, null);
  const bulan = Number(q.bulan);
  if (!Number.isInteger(bulan) || bulan < 1 || bulan > 12 || (tahun === ty && bulan > tm)) return buatPeriode(ty, tm);
  return buatPeriode(tahun, bulan);
}

/** Periode yang sama sebelumnya (bulan lalu atau tahun lalu), untuk pembanding. */
export function periodeSebelumnya(p: Periode): Periode {
  if (p.bulan === null) return buatPeriode(p.tahun - 1, null);
  const s = geser(p.tahun, p.bulan - 1);
  return buatPeriode(s.t, s.b);
}

/** Pilihan tahun pada filter, terbaru lebih dulu. */
export function pilihanTahun(sekarang = new Date()) {
  const ty = Number(tanggalJakarta(sekarang).slice(0, 4));
  return Array.from({ length: ty - TAHUN_AWAL + 1 }, (_, i) => ty - i);
}

/** Satu laporan yang sudah diringkas; tanpa data identitas. */
export type BarisStatistik = {
  bulan: string;
  jenisKelamin: JenisKelamin | null;
  kelompok: KelompokUsia;
  kecamatanId: string | null;
  jenisKekerasanId: string;
  status: StatusLaporan;
  rujukan: string | null;
  hubunganPelaku: string | null;
  pendampingan: string | null;
  /** Hari dari laporan masuk sampai diverifikasi / sampai sesi pertama. */
  hariVerifikasi: number | null;
  hariSesi: number | null;
};

export type Hitungan = { nama: string; jumlah: number };
export type BarisUsia = { kunci: string; label: string; jumlah: number };
export type BarisKecamatan = { nama: string; anakL: number; dewasaL: number; anakP: number; dewasaP: number; lain: number; jumlah: number };
export type BarisJenis = { nama: string; anak: number; dewasa: number; lain: number; jumlah: number };
export type TitikTren = { bulan: string; label: string; anak: number; dewasa: number; lain: number };

const urutkan = (m: Map<string, number>, akhir: string[] = []): Hitungan[] =>
  [...m]
    .map(([nama, jumlah]) => ({ nama, jumlah }))
    .sort((a, b) => Number(akhir.includes(a.nama)) - Number(akhir.includes(b.nama)) || b.jumlah - a.jumlah || a.nama.localeCompare(b.nama));
const tambah = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
const rata = (xs: (number | null)[]) => {
  const ada = xs.filter((x): x is number => x !== null);
  return ada.length ? Math.round((ada.reduce((s, x) => s + x, 0) / ada.length) * 10) / 10 : null;
};

export const TANPA_RUJUKAN = "Datang/lapor langsung";
export const TANPA_HUBUNGAN = "Tidak diketahui";
export const TANPA_PENDAMPINGAN = "Belum tahu";
export const TANPA_KECAMATAN = "Kecamatan tidak diisi";

/**
 * Menyusun semua tabel dari baris yang sudah dipilih periodenya. `baris` adalah laporan dalam periode;
 * `tren` adalah laporan dalam 12 bulan untuk grafik tren.
 */
export function rangkumStatistik(
  baris: BarisStatistik[],
  master: { jenis: { id: string; nama: string; aktif: boolean }[]; kecamatan: { id: string; nama: string }[] },
  tren: { kunciBulan: string[]; baris: Pick<BarisStatistik, "bulan" | "kelompok">[] },
) {
  const anak = (jk: JenisKelamin) => baris.filter((b) => b.kelompok === "ANAK" && b.jenisKelamin === jk).length;
  const dewasa = baris.filter((b) => b.kelompok === "DEWASA").length;
  const anakP = anak("PEREMPUAN");
  const anakL = anak("LAKI_LAKI");
  const anakLain = baris.filter((b) => b.kelompok === "ANAK").length - anakP - anakL;
  const tidakDiketahui = baris.filter((b) => b.kelompok === "TIDAK_DIKETAHUI").length;

  // Tabel 1 mengikuti format resmi: Dewasa, Anak perempuan, Anak laki-laki; baris lain hanya bila ada.
  const usia: BarisUsia[] = [
    { kunci: "DEWASA", label: `Dewasa (${USIA_DEWASA} tahun ke atas)`, jumlah: dewasa },
    { kunci: "ANAK_P", label: `Anak perempuan (0-${USIA_DEWASA - 1} tahun)`, jumlah: anakP },
    { kunci: "ANAK_L", label: `Anak laki-laki (0-${USIA_DEWASA - 1} tahun)`, jumlah: anakL },
    ...(anakLain ? [{ kunci: "ANAK_LAIN", label: "Anak, jenis kelamin lainnya/tidak diisi", jumlah: anakLain }] : []),
    ...(tidakDiketahui ? [{ kunci: "TIDAK_DIKETAHUI", label: "Usia tidak diketahui", jumlah: tidakDiketahui }] : []),
  ];

  const namaKec = new Map(master.kecamatan.map((k) => [k.id, k.nama]));
  const perKec = new Map<string, BarisKecamatan>();
  for (const b of baris) {
    const nama = (b.kecamatanId && namaKec.get(b.kecamatanId)) || TANPA_KECAMATAN;
    const r = perKec.get(nama) ?? { nama, anakL: 0, dewasaL: 0, anakP: 0, dewasaP: 0, lain: 0, jumlah: 0 };
    const jk = b.jenisKelamin === "LAKI_LAKI" ? "L" : b.jenisKelamin === "PEREMPUAN" ? "P" : null;
    if (jk && b.kelompok !== "TIDAK_DIKETAHUI") r[`${b.kelompok === "ANAK" ? "anak" : "dewasa"}${jk}`]++;
    else r.lain++;
    r.jumlah++;
    perKec.set(nama, r);
  }
  const kecamatan = [...perKec.values()].sort((a, b) => Number(a.nama === TANPA_KECAMATAN) - Number(b.nama === TANPA_KECAMATAN) || a.nama.localeCompare(b.nama));

  // Semua jenis aktif tampil (termasuk nol), jenis nonaktif hanya bila ada kasusnya.
  const jenis: BarisJenis[] = master.jenis.flatMap((j) => {
    const di = baris.filter((b) => b.jenisKekerasanId === j.id);
    if (!j.aktif && di.length === 0) return [];
    const a = di.filter((b) => b.kelompok === "ANAK").length;
    const d = di.filter((b) => b.kelompok === "DEWASA").length;
    return [{ nama: j.nama, anak: a, dewasa: d, lain: di.length - a - d, jumlah: di.length }];
  });

  const trenData: TitikTren[] = tren.kunciBulan.map((k) => {
    const di = tren.baris.filter((b) => b.bulan === k);
    const a = di.filter((b) => b.kelompok === "ANAK").length;
    const d = di.filter((b) => b.kelompok === "DEWASA").length;
    return { bulan: k, label: `${BULAN_PENDEK[Number(k.slice(5)) - 1]} ${k.slice(2, 4)}`, anak: a, dewasa: d, lain: di.length - a - d };
  });

  const rujukan = new Map<string, number>();
  const hubungan = new Map<string, number>();
  const pendampingan = new Map<string, number>();
  for (const b of baris) {
    tambah(rujukan, b.rujukan ?? TANPA_RUJUKAN);
    tambah(hubungan, b.hubunganPelaku ?? TANPA_HUBUNGAN);
    tambah(pendampingan, b.pendampingan ?? TANPA_PENDAMPINGAN);
  }

  return {
    total: baris.length,
    anak: anakP + anakL + anakLain,
    dewasa,
    tidakDiketahui,
    perempuan: baris.filter((b) => b.jenisKelamin === "PEREMPUAN").length,
    usia,
    kecamatan,
    jenis,
    tren: trenData,
    status: STATUS_DIHITUNG.map((s) => ({ status: s, jumlah: baris.filter((b) => b.status === s).length })),
    rujukan: urutkan(rujukan, [TANPA_RUJUKAN]),
    hubungan: urutkan(hubungan, [TANPA_HUBUNGAN]),
    pendampingan: urutkan(pendampingan, [TANPA_PENDAMPINGAN]),
    rataHariVerifikasi: rata(baris.map((b) => b.hariVerifikasi)),
    rataHariSesi: rata(baris.map((b) => b.hariSesi)),
  };
}

async function ambilBaris(db: PrismaClient, mulai: Date, akhir: Date): Promise<BarisStatistik[]> {
  const rows = await db.laporan.findMany({
    where: { ...LAPORAN_AKTIF, status: { in: STATUS_DIHITUNG }, dibuatPada: { gte: mulai, lt: akhir } },
    select: {
      dibuatPada: true,
      tanggalKejadian: true,
      diverifikasiPada: true,
      status: true,
      jenisKekerasanId: true,
      asalRujukan: { select: { nama: true } },
      korban: { select: { jenisKelamin: true, tanggalLahir: true, kecamatanId: true } },
      terlapor: { select: { hubungan: { select: { nama: true } } }, orderBy: { id: "asc" }, take: 1 },
      pendampinganDiminta: { select: { jenisPendamping: { select: { nama: true } } }, take: 1 },
      sesi: { where: { status: { not: "DIBATALKAN" } }, select: { mulai: true }, orderBy: { mulai: "asc" }, take: 1 },
    },
  });
  const hari = (a: Date, b: Date | null | undefined) => (b ? Math.max(0, (b.getTime() - a.getTime()) / HARI_MS) : null);
  return rows.map((r) => {
    const masuk = tanggalJakarta(r.dibuatPada);
    return {
      bulan: masuk.slice(0, 7),
      jenisKelamin: r.korban?.jenisKelamin ?? null,
      kelompok: kelompokUsia(r.korban?.tanggalLahir ? r.korban.tanggalLahir.toISOString().slice(0, 10) : null, r.tanggalKejadian ? tanggalJakarta(r.tanggalKejadian) : masuk),
      kecamatanId: r.korban?.kecamatanId ?? null,
      jenisKekerasanId: r.jenisKekerasanId,
      status: r.status,
      rujukan: r.asalRujukan?.nama ?? null,
      hubunganPelaku: r.terlapor[0]?.hubungan?.nama ?? null,
      pendampingan: r.pendampinganDiminta[0]?.jenisPendamping.nama ?? null,
      hariVerifikasi: hari(r.dibuatPada, r.diverifikasiPada),
      hariSesi: hari(r.dibuatPada, r.sesi[0]?.mulai),
    };
  });
}

/** Statistik satu periode, ditambah tren 12 bulan (berakhir di bulan terpilih, atau Januari-Desember untuk setahun). */
export async function statistikKasus(db: PrismaClient, periode: Periode) {
  const sebelum = periodeSebelumnya(periode);
  const akhirBulan = periode.bulan ?? 12;
  const kunciBulan = Array.from({ length: BULAN_TREN }, (_, i) => {
    const g = geser(periode.tahun, akhirBulan - (BULAN_TREN - 1) + i);
    return `${g.t}-${String(g.b).padStart(2, "0")}`;
  });
  const [ty, tb] = kunciBulan[0].split("-").map(Number);
  const mulaiTren = awalBulan(ty, tb);
  const akhirTren = periode.akhir;

  const [barisTren, jumlahSebelum, jenis, kecamatan] = await Promise.all([
    ambilBaris(db, mulaiTren < periode.mulai ? mulaiTren : periode.mulai, akhirTren),
    db.laporan.count({ where: { ...LAPORAN_AKTIF, status: { in: STATUS_DIHITUNG }, dibuatPada: { gte: sebelum.mulai, lt: sebelum.akhir } } }),
    db.jenisKekerasan.findMany({ select: { id: true, nama: true, aktif: true }, orderBy: { nama: "asc" } }),
    db.kecamatan.findMany({ select: { id: true, nama: true } }),
  ]);
  const baris = barisTren.filter((b) => (periode.bulan === null ? b.bulan.startsWith(`${periode.tahun}-`) : b.bulan === periode.kunci));
  return {
    periode: { label: periode.label, kunci: periode.kunci, tahun: periode.tahun, bulan: periode.bulan },
    sebelumnya: { label: sebelum.label, jumlah: jumlahSebelum },
    ...rangkumStatistik(baris, { jenis, kecamatan }, { kunciBulan, baris: barisTren }),
  };
}

export type StatistikKasus = Awaited<ReturnType<typeof statistikKasus>>;
