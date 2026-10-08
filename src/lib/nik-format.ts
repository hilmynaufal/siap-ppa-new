// Pemeriksaan bentuk NIK yang aman dipakai di klien (tanpa node:crypto). Enkripsi ada di nik.ts.

export const POLA_NIK = /^\d{16}$/;

export function nikValid(nik: string) {
  if (!POLA_NIK.test(nik)) return false;
  // Struktur NIK: 6 digit wilayah, 6 digit tanggal lahir (tanggal +40 untuk perempuan), 4 digit urut.
  const hari = Number(nik.slice(6, 8));
  const bulan = Number(nik.slice(8, 10));
  const hariNyata = hari > 40 ? hari - 40 : hari;
  return Number(nik.slice(0, 2)) > 0 && hariNyata >= 1 && hariNyata <= 31 && bulan >= 1 && bulan <= 12;
}

/** Hapus spasi dan tanda hubung yang sering terketik saat menyalin NIK. */
export const bersihkanNik = (s: string) => s.replace(/[\s.-]/g, "");
