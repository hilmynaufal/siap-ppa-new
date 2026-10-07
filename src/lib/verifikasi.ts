import * as z from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { terbitkanTiket, validasiJadwal, type GalatJadwal } from "./tiket";

export const ALASAN_MIN = 10;
export const ALASAN_MAKS = 500;

export const SkemaPenolakan = z.object({
  alasan: z
    .string({ error: "Alasan penolakan wajib diisi." })
    .trim()
    .min(ALASAN_MIN, { error: `Alasan penolakan wajib diisi (minimal ${ALASAN_MIN} huruf).` })
    .max(ALASAN_MAKS, { error: `Alasan terlalu panjang (maksimal ${ALASAN_MAKS} huruf).` }),
});

export type HasilVerifikasi =
  | { ok: true; nomorAntrean?: string }
  | { ok: false; pesan: string; galat?: GalatJadwal };

const PESAN_SUDAH_DIPROSES = "Laporan ini sudah diproses. Muat ulang halaman untuk melihat status terbaru.";

/** Daftar laporan untuk Admin, terbaru dulu. Tanggal dikirim sebagai teks ISO agar aman melintasi batas server dan klien. */
export async function daftarLaporanAdmin(db: PrismaClient) {
  const rows = await db.laporan.findMany({
    orderBy: { dibuatPada: "desc" },
    include: {
      jenisKekerasan: { select: { nama: true } },
      kecamatan: { select: { nama: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    kode: r.kodePendaftaran,
    namaKorban: r.namaKorban,
    jenis: r.jenisKekerasan.nama,
    kecamatan: r.kecamatan?.nama ?? null,
    status: r.status,
    dibuatPada: r.dibuatPada.toISOString(),
  }));
}

export async function detailLaporan(db: PrismaClient, id: string) {
  const r = await db.laporan.findUnique({
    where: { id },
    include: {
      jenisKekerasan: { select: { nama: true } },
      kecamatan: { select: { nama: true } },
      verifikator: { select: { nama: true } },
      dokumen: { select: { id: true, namaBerkas: true, tipeMime: true, ukuran: true }, orderBy: { namaBerkas: "asc" } },
    },
  });
  if (!r) return null;
  return {
    id: r.id,
    kode: r.kodePendaftaran,
    namaPelapor: r.namaPelapor,
    kontakPelapor: r.kontakPelapor,
    namaKorban: r.namaKorban,
    usiaKorban: r.usiaKorban,
    jenisKelaminKorban: r.jenisKelaminKorban,
    jenis: r.jenisKekerasan.nama,
    kecamatan: r.kecamatan?.nama ?? null,
    tanggalKejadian: r.tanggalKejadian?.toISOString() ?? null,
    kronologi: r.kronologi,
    status: r.status,
    alasanPenolakan: r.alasanPenolakan,
    verifikator: r.verifikator?.nama ?? null,
    diverifikasiPada: r.diverifikasiPada?.toISOString() ?? null,
    dibuatPada: r.dibuatPada.toISOString(),
    dokumen: r.dokumen,
  };
}

function adaBentrokUnik(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

/**
 * Mengubah status BARU menjadi hasil verifikasi dan mencatat audit dalam satu transaksi.
 * `updateMany` dengan syarat status BARU membuat dua Admin yang menekan tombol bersamaan tidak saling menimpa.
 */
async function putuskan(
  db: PrismaClient,
  id: string,
  adminId: string,
  status: "TERVERIFIKASI" | "DITOLAK",
  alasan: string | null,
  jadwal?: Awaited<ReturnType<typeof validasiJadwal>> & { ok: true },
): Promise<HasilVerifikasi> {
  return db.$transaction(async (tx) => {
    const { count } = await tx.laporan.updateMany({
      where: { id, status: "BARU" },
      data: { status, alasanPenolakan: alasan, verifikatorId: adminId, diverifikasiPada: new Date() },
    });
    if (count === 0) {
      const ada = await tx.laporan.findUnique({ where: { id }, select: { id: true } });
      return { ok: false as const, pesan: ada ? PESAN_SUDAH_DIPROSES : "Laporan tidak ditemukan." };
    }
    // Tiket diterbitkan otomatis pada transaksi yang sama: laporan terverifikasi selalu punya jadwal dan tiket.
    const tiket = jadwal ? await terbitkanTiket(tx, id, jadwal.jadwal) : null;
    await tx.logAudit.create({
      data: {
        penggunaId: adminId,
        aksi: status === "TERVERIFIKASI" ? "VERIFIKASI_LAPORAN" : "TOLAK_LAPORAN",
        entitas: "Laporan",
        entitasId: id,
        rincian: tiket ? { sesiId: tiket.sesiId, nomorAntrean: tiket.nomorAntrean } : alasan ? { alasan } : undefined,
      },
    });
    return { ok: true as const, nomorAntrean: tiket?.nomorAntrean };
  });
}

/** Memverifikasi laporan sekaligus menunjuk pendamping dan jadwal; tiket terbit otomatis. */
export async function verifikasiLaporan(
  db: PrismaClient,
  id: string,
  adminId: string,
  jadwalMentah: unknown,
  sekarang = new Date(),
): Promise<HasilVerifikasi> {
  const j = await validasiJadwal(db, jadwalMentah, sekarang);
  if (!j.ok) return { ok: false, pesan: "Lengkapi pendamping dan jadwal terlebih dahulu.", galat: j.galat };
  // Dua Admin yang menerbitkan nomor antrean bersamaan bisa berbenturan pada batasan unik; ulangi transaksinya.
  for (let percobaan = 1; ; percobaan++) {
    try {
      return await putuskan(db, id, adminId, "TERVERIFIKASI", null, j);
    } catch (e) {
      if (!adaBentrokUnik(e) || percobaan >= 4) throw e;
    }
  }
}

export async function tolakLaporan(db: PrismaClient, id: string, adminId: string, alasanMentah: string) {
  const p = SkemaPenolakan.safeParse({ alasan: alasanMentah });
  if (!p.success) return { ok: false as const, pesan: p.error.issues[0].message };
  return putuskan(db, id, adminId, "DITOLAK", p.data.alasan);
}
