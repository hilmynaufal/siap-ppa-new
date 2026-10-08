import { randomBytes } from "node:crypto";
import * as z from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { POLA_KODE } from "./laporan";

/** Zona waktu layanan. Jakarta tidak memakai waktu musim panas, jadi selisihnya tetap +07:00. */
const ZONA = "+07:00";

export const BIDANG_JADWAL = ["jenisPendampingId", "pendampingId", "lokasiId", "tanggal", "jamMulai", "jamSelesai"] as const;
export type BidangJadwal = (typeof BIDANG_JADWAL)[number];
export type GalatJadwal = Partial<Record<BidangJadwal, string>>;

const pilih = (pesan: string) => z.string({ error: pesan }).trim().min(1, { error: pesan });
const jam = (pesan: string) => z.string({ error: pesan }).regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: pesan });

export const SkemaJadwal = z.object({
  jenisPendampingId: pilih("Pilih jenis pendampingan."),
  pendampingId: pilih("Pilih pendamping."),
  lokasiId: pilih("Pilih lokasi layanan."),
  tanggal: z.string({ error: "Isi tanggal layanan." }).regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Isi tanggal layanan." }),
  jamMulai: jam("Isi jam mulai."),
  jamSelesai: jam("Isi jam selesai."),
});

export type DataJadwal = z.infer<typeof SkemaJadwal>;

/** Tanggal hari ini menurut Jakarta, format YYYY-MM-DD. */
export const hariJakarta = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

const waktu = (tanggal: string, hhmm: string) => new Date(`${tanggal}T${hhmm}:00${ZONA}`);

export type JadwalTervalidasi = { data: DataJadwal; mulai: Date; selesai: Date; kodeJenis: string };

/**
 * Memeriksa isian jadwal di server (tidak mengandalkan klien): bentuk isian, tanggal dan jam yang masuk akal,
 * serta pendamping, jenis, dan lokasi yang benar-benar ada dan aktif.
 */
export async function validasiJadwal(
  db: PrismaClient | Prisma.TransactionClient,
  mentah: unknown,
  sekarang = new Date(),
): Promise<{ ok: true; jadwal: JadwalTervalidasi } | { ok: false; galat: GalatJadwal }> {
  const p = SkemaJadwal.safeParse(mentah);
  if (!p.success) {
    const galat: GalatJadwal = {};
    for (const i of p.error.issues) {
      const k = i.path[0] as BidangJadwal;
      if (BIDANG_JADWAL.includes(k) && !galat[k]) galat[k] = i.message;
    }
    return { ok: false, galat };
  }
  const d = p.data;
  const galat: GalatJadwal = {};
  const mulai = waktu(d.tanggal, d.jamMulai);
  const selesai = waktu(d.tanggal, d.jamSelesai);

  if (Number.isNaN(mulai.getTime()) || hariJakarta(mulai) !== d.tanggal) galat.tanggal = "Tanggal tidak valid.";
  else if (d.tanggal < hariJakarta(sekarang)) galat.tanggal = "Tanggal layanan tidak boleh sebelum hari ini.";
  else if (mulai.getTime() < sekarang.getTime()) galat.jamMulai = "Jam mulai sudah lewat.";
  if (!galat.jamMulai && !galat.tanggal && selesai.getTime() <= mulai.getTime()) galat.jamSelesai = "Jam selesai harus setelah jam mulai.";

  const [jenis, lokasi, pendamping] = await Promise.all([
    db.jenisPendampingan.findFirst({ where: { id: d.jenisPendampingId, aktif: true } }),
    db.lokasi.findFirst({ where: { id: d.lokasiId, aktif: true } }),
    db.pengguna.findFirst({ where: { id: d.pendampingId, peran: "PENDAMPING", aktif: true } }),
  ]);
  if (!jenis) galat.jenisPendampingId = "Jenis pendampingan tidak ditemukan atau tidak aktif.";
  if (!lokasi) galat.lokasiId = "Lokasi tidak ditemukan atau tidak aktif.";
  if (!pendamping) galat.pendampingId = "Pendamping tidak ditemukan atau tidak aktif.";
  else if (jenis && pendamping.jenisPendampingId && pendamping.jenisPendampingId !== jenis.id) {
    galat.pendampingId = "Pendamping ini bertugas pada jenis pendampingan lain.";
  }

  if (Object.keys(galat).length > 0 || !jenis) return { ok: false, galat };
  return { ok: true, jadwal: { data: d, mulai, selesai, kodeJenis: jenis.kode } };
}

export function buatKodeCheckIn() {
  return randomBytes(18).toString("base64url");
}

export const formatNomorAntrean = (kode: string, tanggal: string, urutan: number) =>
  `${kode}-${tanggal.replaceAll("-", "")}-${String(urutan).padStart(3, "0")}`;

/**
 * Membuat sesi pertama dan tiketnya di dalam transaksi pemanggil.
 * Urutan antrean dihitung per jenis pendampingan per hari agar nomor antrean unik di seluruh lokasi;
 * bila dua Admin menerbitkan bersamaan, batasan unik di basis data memicu pengulangan transaksi oleh pemanggil.
 */
export async function terbitkanTiket(tx: Prisma.TransactionClient, laporanId: string, j: JadwalTervalidasi) {
  const { data } = j;
  const tanggal = new Date(`${data.tanggal}T00:00:00Z`);
  const [{ _max: antrean }, { _max: sesiTerakhir }] = await Promise.all([
    tx.tiket.aggregate({ where: { jenisPendampingId: data.jenisPendampingId, tanggal }, _max: { urutan: true } }),
    tx.sesi.aggregate({ where: { laporanId }, _max: { urutan: true } }),
  ]);
  const urutan = (antrean.urutan ?? 0) + 1;
  const sesi = await tx.sesi.create({
    data: {
      laporanId,
      urutan: (sesiTerakhir.urutan ?? 0) + 1,
      jenisPendampingId: data.jenisPendampingId,
      pendampingId: data.pendampingId,
      lokasiId: data.lokasiId,
      mulai: j.mulai,
      selesai: j.selesai,
    },
  });
  const tiket = await tx.tiket.create({
    data: {
      sesiId: sesi.id,
      nomorAntrean: formatNomorAntrean(j.kodeJenis, data.tanggal, urutan),
      tanggal,
      urutan,
      lokasiId: data.lokasiId,
      jenisPendampingId: data.jenisPendampingId,
      kodeCheckIn: buatKodeCheckIn(),
    },
  });
  return { sesiId: sesi.id, tiketId: tiket.id, nomorAntrean: tiket.nomorAntrean };
}

// ---------------------------------------------------------------- Pelapor: cek tiket

export const normalisasiKode = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");

export type TiketPelapor = {
  sesiId: string;
  urutan: number;
  mulai: string;
  selesai: string;
  tanggal: string;
  jenis: string;
  lokasi: string;
  alamat: string;
  pendamping: string;
  nomorAntrean: string;
  kodeCheckIn: string;
  sudahCheckIn: boolean;
  statusAntrean: "MENUNGGU" | "DIPANGGIL" | "BERLANGSUNG" | "SELESAI" | "DILEWATI";
  statusSesi: "TERJADWAL" | "BERLANGSUNG" | "SELESAI" | "TIDAK_HADIR" | "DIBATALKAN";
  /** Pemberitahuan pembaruan jadwal untuk Pelapor, terbaru dulu. */
  pembaruan: { pesan: string; pada: string }[];
  /** Hanya terisi pada hari layanan: nomor yang sedang dilayani dan jumlah antrean di depan. */
  antrean: { nomorSaatIni: string | null; sisaDidepan: number } | null;
};

export type HasilCekTiket =
  | { ok: false; pesan: string }
  | {
      ok: true;
      kode: string;
      status: "BARU" | "DITOLAK" | "TERVERIFIKASI" | "DALAM_PENDAMPINGAN" | "DITUTUP";
      alasanPenolakan: string | null;
      dibuatPada: string;
      tiket: TiketPelapor[];
    };

const AKTIF_DILAYANI = ["DIPANGGIL", "BERLANGSUNG"] as const;
const BELUM_SELESAI = ["MENUNGGU", "DIPANGGIL", "BERLANGSUNG"] as const;

/** Data laporan dan tiket untuk Pelapor berdasarkan kode pendaftaran. Tidak memuat nama atau isi laporan. */
export async function cekTiket(db: PrismaClient, kodeMentah: string, sekarang = new Date()): Promise<HasilCekTiket> {
  const kode = normalisasiKode(kodeMentah);
  if (!POLA_KODE.test(kode)) return { ok: false, pesan: "Format kode tidak sesuai. Contoh: PPA-261007-AB23CD." };

  const l = await db.laporan.findUnique({
    where: { kodePendaftaran: kode },
    select: {
      status: true,
      alasanPenolakan: true,
      dibuatPada: true,
      sesi: {
        orderBy: { urutan: "asc" },
        select: {
          id: true,
          urutan: true,
          mulai: true,
          selesai: true,
          status: true,
          jenisPendamping: { select: { nama: true } },
          lokasi: { select: { nama: true, alamat: true } },
          pendamping: { select: { nama: true } },
          tiket: true,
          notifikasi: { where: { penerima: "PELAPOR" }, orderBy: { dibuatPada: "desc" }, take: 3, select: { pesan: true, dibuatPada: true } },
        },
      },
    },
  });
  if (!l) return { ok: false, pesan: "Kode pendaftaran tidak ditemukan. Periksa kembali penulisannya." };

  const hariIni = hariJakarta(sekarang);
  const tiket: TiketPelapor[] = [];
  for (const s of l.sesi) {
    const t = s.tiket;
    if (!t) continue;
    const tanggal = t.tanggal.toISOString().slice(0, 10);
    let antrean: TiketPelapor["antrean"] = null;
    if (tanggal === hariIni && t.checkInPada && BELUM_SELESAI.includes(t.statusAntrean as (typeof BELUM_SELESAI)[number])) {
      const grup = { lokasiId: t.lokasiId, jenisPendampingId: t.jenisPendampingId, tanggal: t.tanggal };
      const [dilayani, didepan] = await Promise.all([
        db.tiket.findFirst({
          where: { ...grup, statusAntrean: { in: [...AKTIF_DILAYANI] } },
          orderBy: { urutan: "desc" },
          select: { nomorAntrean: true },
        }),
        db.tiket.count({
          where: { ...grup, urutan: { lt: t.urutan }, checkInPada: { not: null }, statusAntrean: { in: [...BELUM_SELESAI] } },
        }),
      ]);
      antrean = { nomorSaatIni: dilayani?.nomorAntrean ?? null, sisaDidepan: didepan };
    }
    tiket.push({
      sesiId: s.id,
      urutan: s.urutan,
      mulai: s.mulai.toISOString(),
      selesai: s.selesai.toISOString(),
      tanggal,
      jenis: s.jenisPendamping.nama,
      lokasi: s.lokasi.nama,
      alamat: s.lokasi.alamat,
      pendamping: s.pendamping.nama,
      nomorAntrean: t.nomorAntrean,
      kodeCheckIn: t.kodeCheckIn,
      sudahCheckIn: t.checkInPada !== null,
      statusAntrean: t.statusAntrean,
      statusSesi: s.status,
      pembaruan: s.notifikasi.map((n) => ({ pesan: n.pesan, pada: n.dibuatPada.toISOString() })),
      antrean,
    });
  }
  return {
    ok: true,
    kode,
    status: l.status,
    alasanPenolakan: l.status === "DITOLAK" ? l.alasanPenolakan : null,
    dibuatPada: l.dibuatPada.toISOString(),
    tiket,
  };
}

// ---------------------------------------------------------------- Pendamping: jadwal

/** Sesi yang ditugaskan kepada satu Pendamping, terdekat lebih dulu. */
export async function jadwalPendamping(db: PrismaClient, pendampingId: string) {
  const rows = await db.sesi.findMany({
    where: { pendampingId },
    orderBy: { mulai: "asc" },
    include: {
      laporan: { select: { kodePendaftaran: true, korban: { select: { nama: true } }, jenisKekerasan: { select: { nama: true } } } },
      jenisPendamping: { select: { nama: true } },
      lokasi: { select: { nama: true, alamat: true } },
      tiket: { select: { nomorAntrean: true } },
    },
  });
  return rows.map((s) => ({
    id: s.id,
    kodeLaporan: s.laporan.kodePendaftaran,
    namaKorban: s.laporan.korban?.nama ?? "-",
    jenisKekerasan: s.laporan.jenisKekerasan.nama,
    urutan: s.urutan,
    jenis: s.jenisPendamping.nama,
    lokasi: s.lokasi.nama,
    alamat: s.lokasi.alamat,
    nomorAntrean: s.tiket?.nomorAntrean ?? null,
    mulai: s.mulai.toISOString(),
    selesai: s.selesai.toISOString(),
    status: s.status,
  }));
}

/** Sesi dan tiket sebuah laporan, untuk Admin. */
export async function jadwalLaporan(db: PrismaClient, laporanId: string) {
  const rows = await db.sesi.findMany({
    where: { laporanId },
    orderBy: { urutan: "asc" },
    include: {
      jenisPendamping: { select: { nama: true } },
      lokasi: { select: { nama: true, alamat: true } },
      pendamping: { select: { nama: true } },
      tiket: { select: { nomorAntrean: true, statusAntrean: true } },
    },
  });
  return rows.map((s) => ({
    id: s.id,
    urutan: s.urutan,
    jenis: s.jenisPendamping.nama,
    lokasi: s.lokasi.nama,
    alamat: s.lokasi.alamat,
    pendamping: s.pendamping.nama,
    nomorAntrean: s.tiket?.nomorAntrean ?? null,
    mulai: s.mulai.toISOString(),
    selesai: s.selesai.toISOString(),
    status: s.status,
  }));
}
