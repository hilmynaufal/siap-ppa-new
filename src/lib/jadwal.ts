import * as z from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { formatNomorAntrean, validasiJadwal, type GalatJadwal } from "./tiket";

export const KANAL_APLIKASI = "APLIKASI";
export const ALASAN_JADWAL_MIN = 5;
export const ALASAN_JADWAL_MAKS = 300;

export const SkemaUbahJadwal = z.object({
  pendampingId: z.string({ error: "Pilih pendamping." }).trim().min(1, { error: "Pilih pendamping." }),
  tanggal: z.string({ error: "Isi tanggal layanan." }).regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Isi tanggal layanan." }),
  jamMulai: z.string({ error: "Isi jam mulai." }).regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Isi jam mulai." }),
  jamSelesai: z.string({ error: "Isi jam selesai." }).regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Isi jam selesai." }),
  alasan: z
    .string({ error: "Alasan perubahan wajib diisi." })
    .trim()
    .min(ALASAN_JADWAL_MIN, { error: `Alasan perubahan wajib diisi (minimal ${ALASAN_JADWAL_MIN} huruf).` })
    .max(ALASAN_JADWAL_MAKS, { error: `Alasan terlalu panjang (maksimal ${ALASAN_JADWAL_MAKS} huruf).` }),
});

export const BIDANG_UBAH = ["pendampingId", "tanggal", "jamMulai", "jamSelesai", "alasan"] as const;
export type GalatUbah = GalatJadwal & { alasan?: string };
export type HasilUbahJadwal =
  | { ok: true; ringkasan: string }
  | { ok: false; pesan: string; galat?: GalatUbah };

const fmtTanggal = (d: Date) =>
  d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
const fmtJam = (d: Date) =>
  d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).replace(".", ":");

function adaBentrokUnik(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

async function ubahSekali(db: PrismaClient, sesiId: string, adminId: string, mentah: unknown, sekarang: Date): Promise<HasilUbahJadwal> {
  const p = SkemaUbahJadwal.safeParse(mentah);
  if (!p.success) {
    const galat: GalatUbah = {};
    for (const i of p.error.issues) {
      const k = i.path[0] as (typeof BIDANG_UBAH)[number];
      if (BIDANG_UBAH.includes(k) && !galat[k]) galat[k] = i.message;
    }
    return { ok: false, pesan: "Lengkapi isian yang ditandai.", galat };
  }
  const d = p.data;

  return db.$transaction(async (tx): Promise<HasilUbahJadwal> => {
    // Kunci baris sesi agar dua Admin yang mengubah bersamaan dijalankan bergantian.
    await tx.$queryRaw`SELECT id FROM sesi WHERE id = ${sesiId} FOR UPDATE`;
    const sesi = await tx.sesi.findUnique({
      where: { id: sesiId },
      include: {
        tiket: true,
        pendamping: { select: { id: true, nama: true } },
        lokasi: { select: { nama: true } },
        laporan: { select: { kodePendaftaran: true, status: true } },
      },
    });
    if (!sesi || !sesi.tiket) return { ok: false, pesan: "Jadwal tidak ditemukan." };
    if (sesi.status !== "TERJADWAL") return { ok: false, pesan: "Hanya jadwal berstatus Terjadwal yang dapat diubah." };
    if (sesi.laporan.status === "DITUTUP") return { ok: false, pesan: "Laporan ini sudah ditutup." };
    if (sesi.tiket.checkInPada) return { ok: false, pesan: "Pelapor sudah check-in, jadwal tidak dapat diubah lagi." };

    const v = await validasiJadwal(
      tx,
      { jenisPendampingId: sesi.jenisPendampingId, lokasiId: sesi.lokasiId, pendampingId: d.pendampingId, tanggal: d.tanggal, jamMulai: d.jamMulai, jamSelesai: d.jamSelesai },
      sekarang,
    );
    if (!v.ok) return { ok: false, pesan: "Lengkapi isian yang ditandai.", galat: v.galat };
    const { mulai, selesai } = v.jadwal;

    const berubahWaktu = mulai.getTime() !== sesi.mulai.getTime() || selesai.getTime() !== sesi.selesai.getTime();
    const berubahPendamping = d.pendampingId !== sesi.pendampingId;
    if (!berubahWaktu && !berubahPendamping) return { ok: false, pesan: "Tidak ada perubahan pada jadwal.", galat: { jamMulai: "Ubah tanggal, jam, atau pendamping." } };

    const tanggalBaru = new Date(`${d.tanggal}T00:00:00Z`);
    const berubahHari = tanggalBaru.getTime() !== sesi.tiket.tanggal.getTime();
    let nomor = sesi.tiket.nomorAntrean;
    let nomorLama: string | null = null;
    if (berubahHari) {
      // Pindah hari berarti masuk antrean hari baru: nomor dibuat ulang, kode QR tetap sama.
      const { _max } = await tx.tiket.aggregate({ where: { jenisPendampingId: sesi.jenisPendampingId, tanggal: tanggalBaru }, _max: { urutan: true } });
      const urutan = (_max.urutan ?? 0) + 1;
      nomorLama = nomor;
      nomor = formatNomorAntrean(v.jadwal.kodeJenis, d.tanggal, urutan);
      await tx.tiket.update({ where: { id: sesi.tiket.id }, data: { tanggal: tanggalBaru, urutan, nomorAntrean: nomor } });
    }
    await tx.sesi.update({ where: { id: sesiId }, data: { mulai, selesai, pendampingId: d.pendampingId } });

    const pendampingBaru = berubahPendamping
      ? await tx.pengguna.findUniqueOrThrow({ where: { id: d.pendampingId }, select: { nama: true } })
      : sesi.pendamping;
    const perubahan: Prisma.InputJsonObject = {
      ...(berubahWaktu && {
        mulai: { dari: sesi.mulai.toISOString(), ke: mulai.toISOString() },
        selesai: { dari: sesi.selesai.toISOString(), ke: selesai.toISOString() },
      }),
      ...(berubahPendamping && {
        pendamping: { dari: sesi.pendamping.nama, ke: pendampingBaru.nama, dariId: sesi.pendampingId, keId: d.pendampingId },
      }),
      ...(nomorLama && { nomorAntrean: { dari: nomorLama, ke: nomor } }),
    };
    await tx.riwayatJadwal.create({ data: { sesiId, pengubahId: adminId, perubahan, alasan: d.alasan } });

    // Pemberitahuan untuk Pelapor dan Pendamping terkait (kanal aplikasi: langsung tersedia untuk dibaca).
    const waktuTeks = `${fmtTanggal(mulai)}, pukul ${fmtJam(mulai)}-${fmtJam(selesai)} WIB di ${sesi.lokasi.nama}`;
    const sekarangKirim = new Date();
    const notif: Prisma.NotifikasiCreateManyInput[] = [
      {
        sesiId,
        penerima: "PELAPOR",
        kanal: KANAL_APLIKASI,
        dikirimPada: sekarangKirim,
        pesan: `Jadwal pendampingan Anda diperbarui menjadi ${waktuTeks}. Nomor antrean: ${nomor}. Alasan: ${d.alasan}`,
      },
      {
        sesiId,
        penerima: "PENDAMPING",
        penerimaId: d.pendampingId,
        kanal: KANAL_APLIKASI,
        dikirimPada: sekarangKirim,
        pesan: `Jadwal sesi laporan ${sesi.laporan.kodePendaftaran} diperbarui menjadi ${waktuTeks}. Alasan: ${d.alasan}`,
      },
    ];
    if (berubahPendamping) {
      notif.push({
        sesiId,
        penerima: "PENDAMPING",
        penerimaId: sesi.pendampingId,
        kanal: KANAL_APLIKASI,
        dikirimPada: sekarangKirim,
        pesan: `Sesi laporan ${sesi.laporan.kodePendaftaran} (${fmtTanggal(sesi.mulai)}) tidak lagi ditugaskan kepada Anda. Alasan: ${d.alasan}`,
      });
    }
    await tx.notifikasi.createMany({ data: notif });

    await tx.logAudit.create({
      data: { penggunaId: adminId, aksi: "UBAH_JADWAL", entitas: "Sesi", entitasId: sesiId, rincian: { ...perubahan, alasan: d.alasan } },
    });
    return { ok: true, ringkasan: waktuTeks };
  });
}

/**
 * Mengubah tanggal, jam, atau Pendamping sebuah sesi. Dalam satu transaksi: sesi dan tiket diperbarui,
 * riwayat perubahan dan audit dicatat, serta pemberitahuan dibuat untuk Pelapor dan Pendamping.
 */
export async function ubahJadwal(db: PrismaClient, sesiId: string, adminId: string, mentah: unknown, sekarang = new Date()) {
  for (let percobaan = 1; ; percobaan++) {
    try {
      return await ubahSekali(db, sesiId, adminId, mentah, sekarang);
    } catch (e) {
      // Benturan nomor antrean saat dua Admin memindahkan jadwal ke hari yang sama: ulangi dengan nomor baru.
      if (!adaBentrokUnik(e) || percobaan >= 4) throw e;
    }
  }
}

/** Semua sesi untuk halaman Jadwal Admin (tanggal sebagai teks ISO), beserta jumlah perubahan dan pemberitahuan. */
export async function daftarJadwalAdmin(db: PrismaClient) {
  const rows = await db.sesi.findMany({
    orderBy: { mulai: "asc" },
    include: {
      laporan: { select: { kodePendaftaran: true, korban: { select: { nama: true } } } },
      jenisPendamping: { select: { nama: true } },
      lokasi: { select: { nama: true } },
      pendamping: { select: { id: true, nama: true } },
      tiket: { select: { nomorAntrean: true, checkInPada: true } },
      _count: { select: { riwayat: true } },
      notifikasi: { orderBy: { dibuatPada: "desc" }, take: 1, select: { dibuatPada: true, dikirimPada: true } },
    },
  });
  return rows.map((s) => ({
    id: s.id,
    kodeLaporan: s.laporan.kodePendaftaran,
    namaKorban: s.laporan.korban?.nama ?? "-",
    urutan: s.urutan,
    jenis: s.jenisPendamping.nama,
    jenisPendampingId: s.jenisPendampingId,
    lokasi: s.lokasi.nama,
    pendampingId: s.pendamping.id,
    pendamping: s.pendamping.nama,
    nomorAntrean: s.tiket?.nomorAntrean ?? null,
    sudahCheckIn: !!s.tiket?.checkInPada,
    mulai: s.mulai.toISOString(),
    selesai: s.selesai.toISOString(),
    status: s.status,
    jumlahPerubahan: s._count.riwayat,
    notifTerakhir: s.notifikasi[0]?.dikirimPada?.toISOString() ?? null,
  }));
}

/** Riwayat perubahan sebuah sesi, terbaru dulu. */
export async function riwayatJadwal(db: PrismaClient, sesiId: string) {
  const rows = await db.riwayatJadwal.findMany({
    where: { sesiId },
    orderBy: { dibuatPada: "desc" },
    include: { pengubah: { select: { nama: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    pengubah: r.pengubah.nama,
    alasan: r.alasan,
    dibuatPada: r.dibuatPada.toISOString(),
    perubahan: r.perubahan as {
      mulai?: { dari: string; ke: string };
      selesai?: { dari: string; ke: string };
      pendamping?: { dari: string; ke: string };
      nomorAntrean?: { dari: string; ke: string };
    },
  }));
}

/** Pemberitahuan untuk satu Pendamping, terbaru dulu. */
export async function notifikasiPendamping(db: PrismaClient, penggunaId: string, jumlah = 10) {
  const rows = await db.notifikasi.findMany({
    where: { penerimaId: penggunaId, penerima: "PENDAMPING" },
    orderBy: { dibuatPada: "desc" },
    take: jumlah,
    select: { id: true, pesan: true, dibuatPada: true, dibacaPada: true },
  });
  return rows.map((n) => ({ id: n.id, pesan: n.pesan, pada: n.dibuatPada.toISOString(), dibaca: n.dibacaPada !== null }));
}

export function tandaiDibaca(db: PrismaClient, penggunaId: string) {
  return db.notifikasi.updateMany({ where: { penerimaId: penggunaId, dibacaPada: null }, data: { dibacaPada: new Date() } });
}
