import { randomInt } from "node:crypto";

export const MAKS_BERKAS = 3;
export const MAKS_UKURAN = 5 * 1024 * 1024;

// Tanpa huruf dan angka yang mudah tertukar (O/0, I/1/L) agar kode mudah dibaca dan disalin.
const ALFABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function buatKodePendaftaran(sekarang = new Date()): string {
  const yy = String(sekarang.getFullYear()).slice(2);
  const mm = String(sekarang.getMonth() + 1).padStart(2, "0");
  const dd = String(sekarang.getDate()).padStart(2, "0");
  const acak = Array.from({ length: 6 }, () => ALFABET[randomInt(ALFABET.length)]).join("");
  return `PPA-${yy}${mm}${dd}-${acak}`;
}

export const POLA_KODE = /^PPA-\d{6}-[A-Z2-9]{6}$/;

// Skema formulir dan tipe data laporan ada di laporan-skema.ts.
export * from "./laporan-skema";

// ---- Berkas pendukung ----

export type TipeBerkas = "image/jpeg" | "image/png" | "application/pdf";
const EKSTENSI: Record<TipeBerkas, string> = { "image/jpeg": "jpg", "image/png": "png", "application/pdf": "pdf" };

export function ekstensiUntuk(tipe: TipeBerkas) {
  return EKSTENSI[tipe];
}

/** Tipe ditentukan dari isi berkas (magic bytes), bukan dari nama atau tipe yang diklaim pengunggah. */
export function deteksiTipe(b: Uint8Array): TipeBerkas | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "application/pdf";
  return null;
}

const MB = (n: number) => `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;

/** Pemeriksaan cepat di klien dan server berdasarkan nama dan ukuran. Mengembalikan pesan galat atau null. */
export function periksaBerkas(f: { name: string; size: number }): string | null {
  if (!/\.(jpe?g|png|pdf)$/i.test(f.name)) return "Format tidak didukung. Gunakan JPG, PNG, atau PDF.";
  if (f.size === 0) return "Berkas kosong.";
  if (f.size > MAKS_UKURAN) return `Ukuran ${MB(f.size)}. Maksimal 5 MB.`;
  return null;
}

export const FORMAT_BERKAS = "JPG, PNG, atau PDF";
