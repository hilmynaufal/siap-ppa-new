import type { Prisma } from "@/generated/prisma/client";

/** Laporan yang tidak di Sampah. Pakai pada setiap kueri yang menampilkan laporan (lihat sampah.ts). */
export const LAPORAN_AKTIF = { dihapusPada: null } satisfies Prisma.LaporanWhereInput;
/** Sesi/tiket yang laporannya tidak di Sampah (jadwal, antrean, Cek Tiket). */
export const SESI_AKTIF = { laporan: LAPORAN_AKTIF } satisfies Prisma.SesiWhereInput;

/** Batas alasan memindahkan laporan ke Sampah (dipakai formulir dan server). */
export const ALASAN_HAPUS_MIN = 5;
export const ALASAN_HAPUS_MAKS = 300;
