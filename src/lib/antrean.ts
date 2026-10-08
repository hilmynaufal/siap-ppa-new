import type { PrismaClient } from "@/generated/prisma/client";
import { hariJakarta, normalisasiKode } from "./tiket";

export type StatusAntrean = "MENUNGGU" | "DIPANGGIL" | "BERLANGSUNG" | "SELESAI" | "DILEWATI";

export type FilterAntrean = { lokasiId: string; jenisPendampingId: string; tanggal: string };
export type HasilAntrean<T = object> = ({ ok: true; pesan?: string } & T) | { ok: false; pesan: string };

const jamJakarta = (d: Date) => d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).replace(".", ":");
const tanggalDb = (t: string) => new Date(`${t}T00:00:00Z`);

/** Memisahkan "PSI-20261008-005" menjadi awalan "PSI" dan urutan "005" untuk layar besar. */
export function pecahNomor(nomor: string) {
  const bagian = nomor.split("-");
  return { awalan: bagian[0] ?? nomor, urutan: bagian.length > 1 ? bagian[bagian.length - 1] : "" };
}

// ------------------------------------------------------------------ Admin: antrean hari ini

export type BarisAntrean = {
  id: string;
  nomorAntrean: string;
  urutan: number;
  jadwal: string;
  pendamping: string;
  checkIn: string | null;
  dipanggil: string | null;
  status: StatusAntrean;
  /** Dapat dilewati: belum dimulai dan belum selesai. */
  bisaLewati: boolean;
};

/** Daftar antrean satu lokasi, jenis pendampingan, dan tanggal, lengkap dengan nomor yang sedang dipanggil. Tanpa nama korban. */
export async function daftarAntrean(db: PrismaClient, f: FilterAntrean) {
  const rows = await db.tiket.findMany({
    where: { lokasiId: f.lokasiId, jenisPendampingId: f.jenisPendampingId, tanggal: tanggalDb(f.tanggal) },
    orderBy: { urutan: "asc" },
    include: { sesi: { select: { mulai: true, status: true, pendamping: { select: { nama: true } } } } },
  });
  const baris: BarisAntrean[] = rows.map((t) => ({
    id: t.id,
    nomorAntrean: t.nomorAntrean,
    urutan: t.urutan,
    jadwal: jamJakarta(t.sesi.mulai),
    pendamping: t.sesi.pendamping.nama,
    checkIn: t.checkInPada ? jamJakarta(t.checkInPada) : null,
    dipanggil: t.dipanggilPada ? jamJakarta(t.dipanggilPada) : null,
    status: t.statusAntrean,
    bisaLewati: (t.statusAntrean === "MENUNGGU" || t.statusAntrean === "DIPANGGIL") && t.sesi.status === "TERJADWAL",
  }));
  const dipanggil = rows
    .filter((t) => t.statusAntrean === "DIPANGGIL" && t.dipanggilPada)
    .sort((a, b) => b.dipanggilPada!.getTime() - a.dipanggilPada!.getTime())[0];
  const sedangDipanggil = dipanggil ? baris.find((b) => b.id === dipanggil.id)! : null;
  return {
    baris,
    sedangDipanggil,
    jumlah: baris.length,
    menunggu: baris.filter((b) => b.status === "MENUNGGU" && b.checkIn).length,
    adaYangBisaDipanggil: baris.some((b) => b.status === "MENUNGGU" && b.checkIn),
  };
}

/** Opsi penyaring: lokasi dan jenis pendampingan yang aktif. */
export async function opsiAntrean(db: PrismaClient) {
  const [lokasi, jenis] = await Promise.all([
    db.lokasi.findMany({ where: { aktif: true }, orderBy: { nama: "asc" }, select: { id: true, nama: true } }),
    db.jenisPendampingan.findMany({ where: { aktif: true }, orderBy: { nama: "asc" }, select: { id: true, nama: true, kode: true } }),
  ]);
  return { lokasi, jenis };
}

// ------------------------------------------------------------------ Check-in

/**
 * Check-in petugas: memindai QR tiket atau mengetik kode/nomor antrean. Hanya pada hari layanan dan selama sesinya belum dimulai.
 * Tiket yang pernah dilewati dapat check-in lagi (datang terlambat) dan kembali menunggu.
 */
export async function checkInTiket(db: PrismaClient, masukan: string, petugasId: string, sekarang = new Date(), batasLokasiId: string | null = null): Promise<HasilAntrean<{ nomorAntrean: string; jam: string }>> {
  const mentah = String(masukan ?? "").trim().slice(0, 100);
  if (!mentah) return { ok: false, pesan: "Isi kode tiket atau pindai QR." };
  const t = await db.tiket.findFirst({
    where: { OR: [{ kodeCheckIn: mentah }, { nomorAntrean: normalisasiKode(mentah) }] },
    select: { id: true, nomorAntrean: true, lokasiId: true, tanggal: true, statusAntrean: true, checkInPada: true, sesi: { select: { status: true, laporan: { select: { status: true } } } } },
  });
  if (!t) return { ok: false, pesan: "Tiket tidak ditemukan. Periksa kode atau pindai ulang." };
  // Petugas hanya melayani lokasinya sendiri; pesan sengaja tidak menyebut lokasi lain.
  if (batasLokasiId && t.lokasiId !== batasLokasiId) return { ok: false, pesan: "Tiket ini bukan untuk lokasi Anda." };
  const tanggal = t.tanggal.toISOString().slice(0, 10);
  if (tanggal !== hariJakarta(sekarang)) return { ok: false, pesan: `Tiket ${t.nomorAntrean} untuk tanggal ${tanggal}, bukan hari ini.` };
  if (t.sesi.laporan.status === "DITUTUP" || t.sesi.status === "DIBATALKAN") return { ok: false, pesan: `Sesi untuk tiket ${t.nomorAntrean} sudah dibatalkan atau kasusnya ditutup.` };
  if (t.sesi.status !== "TERJADWAL") return { ok: false, pesan: `Sesi untuk tiket ${t.nomorAntrean} sudah dimulai atau selesai.` };
  if (t.checkInPada && t.statusAntrean !== "DILEWATI") return { ok: false, pesan: `${t.nomorAntrean} sudah check-in pukul ${jamJakarta(t.checkInPada)}.` };

  // Syarat status lama mencegah dua petugas memproses tiket yang sama bersamaan.
  const { count } = await db.tiket.updateMany({
    where: { id: t.id, statusAntrean: t.statusAntrean, checkInPada: t.checkInPada },
    data: { checkInPada: sekarang, statusAntrean: "MENUNGGU", dipanggilPada: null },
  });
  if (count === 0) return { ok: false, pesan: "Tiket baru saja diproses petugas lain. Muat ulang." };
  await db.logAudit.create({ data: { penggunaId: petugasId, aksi: "CHECK_IN_TIKET", entitas: "Tiket", entitasId: t.id, rincian: { nomorAntrean: t.nomorAntrean } } });
  return { ok: true, nomorAntrean: t.nomorAntrean, jam: jamJakarta(sekarang) };
}

// ------------------------------------------------------------------ Panggil dan lewati

/** Memanggil nomor berikutnya: yang sudah check-in dan menunggu, berurutan menurut nomor antrean. */
export async function panggilBerikutnya(db: PrismaClient, f: FilterAntrean, petugasId: string, sekarang = new Date(), batasLokasiId: string | null = null): Promise<HasilAntrean<{ nomorAntrean: string }>> {
  if (batasLokasiId && f.lokasiId !== batasLokasiId) return { ok: false, pesan: "Antrean ini bukan untuk lokasi Anda." };
  if (f.tanggal !== hariJakarta(sekarang)) return { ok: false, pesan: "Nomor hanya dapat dipanggil pada hari layanan." };
  for (let percobaan = 0; percobaan < 3; percobaan++) {
    const t = await db.tiket.findFirst({
      where: {
        lokasiId: f.lokasiId,
        jenisPendampingId: f.jenisPendampingId,
        tanggal: tanggalDb(f.tanggal),
        statusAntrean: "MENUNGGU",
        checkInPada: { not: null },
        sesi: { status: "TERJADWAL" },
      },
      orderBy: { urutan: "asc" },
      select: { id: true, nomorAntrean: true },
    });
    if (!t) return { ok: false, pesan: "Belum ada nomor yang menunggu. Pastikan Pelapor sudah check-in." };
    const { count } = await db.tiket.updateMany({ where: { id: t.id, statusAntrean: "MENUNGGU" }, data: { statusAntrean: "DIPANGGIL", dipanggilPada: sekarang } });
    if (count === 0) continue;
    await db.logAudit.create({ data: { penggunaId: petugasId, aksi: "PANGGIL_TIKET", entitas: "Tiket", entitasId: t.id, rincian: { nomorAntrean: t.nomorAntrean } } });
    return { ok: true, nomorAntrean: t.nomorAntrean };
  }
  return { ok: false, pesan: "Antrean baru saja berubah. Coba panggil lagi." };
}

/** Melewati nomor yang menunggu atau sedang dipanggil (tidak hadir di meja). Sesinya tetap terjadwal. */
export async function lewatiTiket(db: PrismaClient, tiketId: string, petugasId: string, sekarang = new Date(), batasLokasiId: string | null = null): Promise<HasilAntrean<{ nomorAntrean: string }>> {
  const t = await db.tiket.findUnique({ where: { id: tiketId }, select: { nomorAntrean: true, lokasiId: true } });
  if (!t || (batasLokasiId && t.lokasiId !== batasLokasiId)) return { ok: false, pesan: "Tiket tidak ditemukan." };
  const { count } = await db.tiket.updateMany({
    where: { id: tiketId, statusAntrean: { in: ["MENUNGGU", "DIPANGGIL"] }, sesi: { status: "TERJADWAL" } },
    data: { statusAntrean: "DILEWATI", selesaiPada: sekarang },
  });
  if (count === 0) return { ok: false, pesan: `${t.nomorAntrean} tidak dapat dilewati karena sudah dimulai, selesai, atau sudah dilewati.` };
  await db.logAudit.create({ data: { penggunaId: petugasId, aksi: "LEWATI_TIKET", entitas: "Tiket", entitasId: tiketId, rincian: { nomorAntrean: t.nomorAntrean } } });
  return { ok: true, nomorAntrean: t.nomorAntrean };
}

// ------------------------------------------------------------------ Layar publik (hanya nomor, tanpa nama)

export type LayarPublik = {
  jenis: string;
  lokasi: string;
  dipanggil: { awalan: string; urutan: string } | null;
  berikutnya: { awalan: string; urutan: string; nomor: string }[];
};

/** Data layar antrean untuk TV lobi: nomor yang dipanggil dan tiga nomor berikutnya. Tidak memuat nama atau data kasus. */
export async function layarPublik(db: PrismaClient, lokasiId: string, jenisPendampingId: string, sekarang = new Date()): Promise<LayarPublik | null> {
  const [lokasi, jenis] = await Promise.all([
    db.lokasi.findFirst({ where: { id: lokasiId, aktif: true }, select: { nama: true } }),
    db.jenisPendampingan.findFirst({ where: { id: jenisPendampingId, aktif: true }, select: { nama: true } }),
  ]);
  if (!lokasi || !jenis) return null;
  const dasar = { lokasiId, jenisPendampingId, tanggal: tanggalDb(hariJakarta(sekarang)) };
  const [dipanggil, berikut] = await Promise.all([
    db.tiket.findFirst({ where: { ...dasar, statusAntrean: "DIPANGGIL" }, orderBy: { dipanggilPada: "desc" }, select: { nomorAntrean: true } }),
    db.tiket.findMany({ where: { ...dasar, statusAntrean: "MENUNGGU", checkInPada: { not: null }, sesi: { status: "TERJADWAL" } }, orderBy: { urutan: "asc" }, take: 3, select: { nomorAntrean: true } }),
  ]);
  return {
    jenis: jenis.nama,
    lokasi: lokasi.nama,
    dipanggil: dipanggil ? pecahNomor(dipanggil.nomorAntrean) : null,
    berikutnya: berikut.map((b) => ({ ...pecahNomor(b.nomorAntrean), nomor: b.nomorAntrean })),
  };
}

// ------------------------------------------------------------------ Petugas: jadwal hari ini di lokasinya (tanpa data korban)

export type BarisJadwalHariIni = {
  nomorAntrean: string;
  jam: string;
  jenis: string;
  pendamping: string;
  statusSesi: "TERJADWAL" | "BERLANGSUNG" | "SELESAI" | "TIDAK_HADIR" | "DIBATALKAN";
  statusAntrean: StatusAntrean;
  checkIn: string | null;
};

/** Daftar sesi pada satu tanggal di satu lokasi untuk loket. Hanya nomor antrean, jam, jenis, dan Pendamping: tanpa nama atau kode laporan. */
export async function jadwalHariIni(db: PrismaClient, lokasiId: string, tanggal: string): Promise<BarisJadwalHariIni[]> {
  const rows = await db.sesi.findMany({
    where: { lokasiId, mulai: { gte: new Date(`${tanggal}T00:00:00+07:00`), lt: new Date(`${tanggal}T23:59:59.999+07:00`) } },
    orderBy: { mulai: "asc" },
    select: {
      mulai: true,
      status: true,
      jenisPendamping: { select: { nama: true } },
      pendamping: { select: { nama: true } },
      tiket: { select: { nomorAntrean: true, statusAntrean: true, checkInPada: true } },
    },
  });
  return rows.map((r) => ({
    nomorAntrean: r.tiket?.nomorAntrean ?? "-",
    jam: jamJakarta(r.mulai),
    jenis: r.jenisPendamping.nama,
    pendamping: r.pendamping.nama,
    statusSesi: r.status,
    statusAntrean: (r.tiket?.statusAntrean ?? "MENUNGGU") as StatusAntrean,
    checkIn: r.tiket?.checkInPada ? jamJakarta(r.tiket.checkInPada) : null,
  }));
}
