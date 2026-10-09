import type { PrismaClient } from "@/generated/prisma/client";
import { hariJakarta } from "./tiket";

const HARI_MS = 24 * 3600 * 1000;
const NAMA_BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const PERIODE_HARI = 30;
export const BULAN_GRAFIK = 6;

const jam = (d: Date) => d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).replace(".", ":");
const awalBulan = (tahun: number, bulan: number) => {
  // bulan 1..12; nilai di luar rentang digeser ke tahun yang sesuai
  const t = tahun + Math.floor((bulan - 1) / 12);
  const b = ((((bulan - 1) % 12) + 12) % 12) + 1;
  return { t, b, tanggal: new Date(`${t}-${String(b).padStart(2, "0")}-01T00:00:00+07:00`) };
};

export type TitikGrafik = { bulan: string; label: string; baru: number; terverifikasi: number; ditolak: number };
export type IrisanDonat = { nama: string; jumlah: number };

/**
 * Angka untuk dasbor Admin. Kartu dan donat memakai 30 hari terakhir; grafik memakai 6 bulan kalender menurut waktu Jakarta.
 * "Terverifikasi" berarti lolos verifikasi pada periode itu, apa pun status berikutnya (dalam pendampingan atau ditutup).
 * Tidak memuat nama atau data identitas korban.
 */
export async function ringkasanDasbor(db: PrismaClient, sekarang = new Date()) {
  const awal30 = new Date(sekarang.getTime() - PERIODE_HARI * HARI_MS);
  const hariIni = hariJakarta(sekarang);
  const awalHari = new Date(`${hariIni}T00:00:00+07:00`);
  const akhirHari = new Date(awalHari.getTime() + HARI_MS);
  const [tahun, bulan] = hariIni.split("-").map(Number);
  const mulaiGrafik = awalBulan(tahun, bulan - (BULAN_GRAFIK - 1)).tanggal;
  const akhirGrafik = awalBulan(tahun, bulan + 1).tanggal;

  const diPeriode = { gte: awal30, lt: sekarang };
  const [baru, terverifikasi, ditolak, total, usulan, usulanPertama, belumLapor, belumLaporPertama, sesiHariIni, barisGrafik, barisDonat, terbaru, jadwal] = await Promise.all([
    db.laporan.count({ where: { status: "BARU" } }),
    db.laporan.count({ where: { status: { notIn: ["BARU", "DITOLAK"] }, diverifikasiPada: diPeriode } }),
    db.laporan.count({ where: { status: "DITOLAK", diverifikasiPada: diPeriode } }),
    db.laporan.count({ where: { dibuatPada: diPeriode } }),
    db.usulanSesi.count({ where: { status: "MENUNGGU" } }),
    db.usulanSesi.findFirst({ where: { status: "MENUNGGU" }, orderBy: { dibuatPada: "asc" }, select: { laporanPendampingan: { select: { sesi: { select: { laporanId: true } } } } } }),
    db.sesi.count({ where: { status: "SELESAI", laporanPendampingan: { is: null } } }),
    db.sesi.findFirst({ where: { status: "SELESAI", laporanPendampingan: { is: null } }, orderBy: { mulai: "asc" }, select: { laporanId: true } }),
    db.sesi.count({ where: { mulai: { gte: awalHari, lt: akhirHari }, status: { not: "DIBATALKAN" } } }),
    // Kolom disimpan sebagai UTC tanpa zona: ubah dulu ke UTC lalu ke Jakarta agar batas bulan menurut waktu Jakarta.
    db.$queryRaw<{ bulan: string; status: string; n: number }[]>`
      select to_char(date_trunc('month', (dibuat_pada at time zone 'UTC') at time zone 'Asia/Jakarta'), 'YYYY-MM') as bulan, status::text as status, count(*)::int as n
      from laporan where dibuat_pada >= ${mulaiGrafik} and dibuat_pada < ${akhirGrafik} group by 1, 2`,
    db.sesi.groupBy({ by: ["jenisPendampingId"], where: { status: { in: ["SELESAI", "BERLANGSUNG"] }, mulai: diPeriode }, _count: { _all: true } }),
    db.laporan.findMany({
      take: 5,
      orderBy: { dibuatPada: "desc" },
      select: { id: true, kodePendaftaran: true, dibuatPada: true, status: true, jenisKekerasan: { select: { nama: true } }, korban: { select: { kecamatan: { select: { nama: true } } } } },
    }),
    db.sesi.findMany({
      where: { mulai: { gte: awalHari, lt: akhirHari }, status: { not: "DIBATALKAN" } },
      orderBy: { mulai: "asc" },
      select: { mulai: true, status: true, jenisPendamping: { select: { nama: true } }, pendamping: { select: { nama: true } }, lokasi: { select: { nama: true } }, tiket: { select: { nomorAntrean: true } } },
    }),
  ]);

  const grafik: TitikGrafik[] = Array.from({ length: BULAN_GRAFIK }, (_, i) => {
    const { t, b } = awalBulan(tahun, bulan - (BULAN_GRAFIK - 1) + i);
    const kunci = `${t}-${String(b).padStart(2, "0")}`;
    const ambil = (f: (s: string) => boolean) => barisGrafik.filter((r) => r.bulan === kunci && f(r.status)).reduce((s, r) => s + r.n, 0);
    return {
      bulan: kunci,
      label: NAMA_BULAN[b - 1],
      baru: ambil((s) => s === "BARU"),
      terverifikasi: ambil((s) => s !== "BARU" && s !== "DITOLAK"),
      ditolak: ambil((s) => s === "DITOLAK"),
    };
  });

  const jenis = await db.jenisPendampingan.findMany({ where: { id: { in: barisDonat.map((b) => b.jenisPendampingId) } }, select: { id: true, nama: true } });
  const donat: IrisanDonat[] = barisDonat
    .map((b) => ({ nama: jenis.find((j) => j.id === b.jenisPendampingId)?.nama ?? "-", jumlah: b._count._all }))
    .sort((a, b) => b.jumlah - a.jumlah || a.nama.localeCompare(b.nama));

  return {
    tanggal: hariIni,
    periodeHari: PERIODE_HARI,
    kartu: { baru, terverifikasi, ditolak, total },
    tindakan: {
      usulan,
      usulanLaporanId: usulanPertama?.laporanPendampingan.sesi.laporanId ?? null,
      belumLapor,
      belumLaporLaporanId: belumLaporPertama?.laporanId ?? null,
      sesiHariIni,
    },
    grafik,
    donat,
    totalDonat: donat.reduce((s, d) => s + d.jumlah, 0),
    terbaru: terbaru.map((l) => ({
      id: l.id,
      kode: l.kodePendaftaran,
      masuk: l.dibuatPada.toISOString(),
      jenis: l.jenisKekerasan.nama,
      kecamatan: l.korban?.kecamatan?.nama ?? null,
      status: l.status,
    })),
    jadwal: jadwal.map((s) => ({
      jam: jam(s.mulai),
      nomorAntrean: s.tiket?.nomorAntrean ?? "-",
      jenis: s.jenisPendamping.nama,
      pendamping: s.pendamping.nama,
      lokasi: s.lokasi.nama,
      status: s.status,
    })),
  };
}

export type RingkasanDasbor = Awaited<ReturnType<typeof ringkasanDasbor>>;

/** Jumlah laporan yang menunggu verifikasi (lencana pada menu Laporan masuk). */
export const jumlahLaporanBaru = (db: PrismaClient) => db.laporan.count({ where: { status: "BARU" } });
