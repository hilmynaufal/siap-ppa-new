import { rm } from "node:fs/promises";
import path from "node:path";
import * as z from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { ALASAN_HAPUS_MAKS, ALASAN_HAPUS_MIN, LAPORAN_AKTIF } from "./aktif";
import { direktoriUnggah } from "./laporan-layanan";

/**
 * Sampah laporan. Menghapus memindahkan laporan ke Sampah (hapus lunak: `dihapusPada` terisi) sehingga
 * laporan, jadwal, dan tiketnya hilang dari semua daftar tetapi masih dapat dipulihkan. Hapus permanen
 * hanya dari Sampah: data dan berkas unggahan dihapus selamanya, jejaknya tetap ada di log audit.
 */

const SkemaAlasan = z
  .string()
  .trim()
  .min(ALASAN_HAPUS_MIN, { error: `Tuliskan alasan (minimal ${ALASAN_HAPUS_MIN} huruf).` })
  .max(ALASAN_HAPUS_MAKS, { error: `Alasan terlalu panjang (maksimal ${ALASAN_HAPUS_MAKS} huruf).` });

export type HasilSampah = { ok: true } | { ok: false; pesan: string };

export async function pindahkanKeSampah(db: PrismaClient, id: string, adminId: string, alasanMentah: unknown): Promise<HasilSampah> {
  const alasan = SkemaAlasan.safeParse(alasanMentah);
  if (!alasan.success) return { ok: false, pesan: alasan.error.issues[0].message };
  return db.$transaction(async (tx) => {
    const { count } = await tx.laporan.updateMany({ where: { id, ...LAPORAN_AKTIF }, data: { dihapusPada: new Date(), dihapusOlehId: adminId, alasanHapus: alasan.data } });
    if (count === 0) return { ok: false as const, pesan: "Laporan tidak ditemukan atau sudah di Sampah." };
    await tx.logAudit.create({ data: { penggunaId: adminId, aksi: "HAPUS_LAPORAN", entitas: "Laporan", entitasId: id, rincian: { alasan: alasan.data } } });
    return { ok: true as const };
  });
}

export async function pulihkanLaporan(db: PrismaClient, id: string, adminId: string): Promise<HasilSampah> {
  return db.$transaction(async (tx) => {
    const { count } = await tx.laporan.updateMany({ where: { id, dihapusPada: { not: null } }, data: { dihapusPada: null, dihapusOlehId: null, alasanHapus: null } });
    if (count === 0) return { ok: false as const, pesan: "Laporan tidak ada di Sampah." };
    await tx.logAudit.create({ data: { penggunaId: adminId, aksi: "PULIHKAN_LAPORAN", entitas: "Laporan", entitasId: id } });
    return { ok: true as const };
  });
}

/**
 * Menghapus selamanya laporan yang sudah di Sampah beserta sesi, tiket, pemberitahuan, laporan pendampingan,
 * dan berkas unggahannya. Log audit tidak dihapus; entri penghapusan mencatat kode laporannya.
 */
export async function hapusPermanen(db: PrismaClient, id: string, adminId: string, dir = direktoriUnggah()): Promise<HasilSampah> {
  const l = await db.laporan.findFirst({ where: { id, dihapusPada: { not: null } }, select: { kodePendaftaran: true, sesi: { select: { id: true } } } });
  if (!l) return { ok: false, pesan: "Hanya laporan di Sampah yang dapat dihapus permanen." };
  const sesiIds = l.sesi.map((s) => s.id);

  await db.$transaction(async (tx) => {
    const lp = { sesiId: { in: sesiIds } };
    // Urutan mengikuti relasi tanpa cascade: usulan dan revisi -> laporan pendampingan -> isi sesi -> sesi -> laporan.
    await tx.usulanSesi.deleteMany({ where: { OR: [{ laporanId: id }, { laporanPendampingan: lp }, { sesiHasilId: { in: sesiIds } }] } });
    await tx.revisiLaporanPendampingan.deleteMany({ where: { laporanPendampingan: lp } });
    await tx.laporanPendampingan.deleteMany({ where: lp });
    await tx.notifikasi.deleteMany({ where: lp });
    await tx.riwayatJadwal.deleteMany({ where: lp });
    await tx.tiket.deleteMany({ where: lp });
    await tx.sesi.deleteMany({ where: { id: { in: sesiIds } } });
    // Pelapor, korban, terlapor, dokumen, dan pendampingan yang diminta ikut terhapus (onDelete: Cascade).
    await tx.laporan.delete({ where: { id } });
    await tx.logAudit.create({ data: { penggunaId: adminId, aksi: "HAPUS_PERMANEN_LAPORAN", entitas: "Laporan", entitasId: id, rincian: { kode: l.kodePendaftaran, jumlahSesi: sesiIds.length } } });
  });

  // Berkas dihapus setelah data terhapus; kegagalan di sini tidak mengembalikan data.
  const folder = [id, ...sesiIds.map((s) => path.join("pendampingan", s))];
  await Promise.all(folder.map((f) => rm(path.join(/* turbopackIgnore: true */ dir, f), { recursive: true, force: true }).catch(() => {})));
  return { ok: true };
}

/** Isi Sampah, terbaru lebih dulu. */
export async function daftarSampah(db: PrismaClient) {
  const rows = await db.laporan.findMany({
    where: { dihapusPada: { not: null } },
    orderBy: { dihapusPada: "desc" },
    select: {
      id: true,
      kodePendaftaran: true,
      status: true,
      dibuatPada: true,
      dihapusPada: true,
      alasanHapus: true,
      dihapusOleh: { select: { nama: true } },
      korban: { select: { nama: true } },
      jenisKekerasan: { select: { nama: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    kode: r.kodePendaftaran,
    status: r.status,
    korban: r.korban?.nama ?? null,
    jenis: r.jenisKekerasan.nama,
    dibuatPada: r.dibuatPada.toISOString(),
    dihapusPada: r.dihapusPada!.toISOString(),
    alasan: r.alasanHapus,
    oleh: r.dihapusOleh?.nama ?? null,
  }));
}
