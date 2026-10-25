import type { StatusLaporanBaru } from "./dasbor";

/** Selang pemeriksaan laporan baru di browser Admin. */
export const SELANG_PERIKSA_MS = 30_000;

/** Beri tahu hanya bila ada laporan baru yang masuk setelah pemeriksaan sebelumnya (bukan sekadar jumlahnya berubah). */
export function adaLaporanLebihBaru(sebelum: StatusLaporanBaru, sekarang: StatusLaporanBaru): boolean {
  if (!sekarang.terbaru || sekarang.jumlah === 0) return false;
  return !sebelum.terbaru || new Date(sekarang.terbaru) > new Date(sebelum.terbaru);
}

/** Judul tab dengan jumlah laporan menunggu, mis. "(3) Dasbor | SIAP PPA". */
export function judulDenganJumlah(judul: string, jumlah: number): string {
  const dasar = judul.replace(/^\(\d+\)\s*/, "");
  return jumlah > 0 ? `(${jumlah}) ${dasar}` : dasar;
}

/** Isi notifikasi: tanpa nama, kode, atau isi laporan. */
export function pesanNotifikasi(jumlah: number) {
  return { judul: "Laporan baru masuk", isi: jumlah > 1 ? `${jumlah} laporan menunggu verifikasi.` : "1 laporan menunggu verifikasi." };
}
