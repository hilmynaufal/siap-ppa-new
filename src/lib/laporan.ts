import { randomInt } from "node:crypto";
import * as z from "zod";

export const MAKS_BERKAS = 3;
export const MAKS_UKURAN = 5 * 1024 * 1024;
export const JENIS_KELAMIN = ["Perempuan", "Laki-laki"] as const;

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

// ---- Skema per langkah (dipakai di klien dan diperiksa ulang di server) ----

const wajib = (pesan: string, maks = 120) =>
  z.string({ error: pesan }).trim().min(1, { error: pesan }).max(maks, { error: `Terlalu panjang (maksimal ${maks} huruf).` });

const kosongJadiUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

export const Langkah1 = z.object({
  namaPelapor: wajib("Nama pelapor wajib diisi."),
  kontakPelapor: z
    .string({ error: "Nomor HP wajib diisi agar petugas dapat menghubungi Anda." })
    .trim()
    .min(1, { error: "Nomor HP wajib diisi agar petugas dapat menghubungi Anda." })
    .regex(/^\+?[\d\s-]{8,20}$/, { error: "Nomor HP tidak valid. Contoh: 0812 3456 7890." }),
  namaKorban: wajib("Nama korban wajib diisi. Nama panggilan juga boleh."),
  usiaKorban: z.preprocess(
    kosongJadiUndefined,
    z.coerce.number({ error: "Usia harus berupa angka." }).int({ error: "Usia harus berupa angka bulat." }).min(0, { error: "Usia tidak valid." }).max(120, { error: "Usia tidak valid." }).optional(),
  ),
  jenisKelaminKorban: z.preprocess(kosongJadiUndefined, z.enum(JENIS_KELAMIN).optional()),
});

function tanggalValid(s: string) {
  const d = new Date(`${s}T00:00:00`);
  return !Number.isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function tidakDiMasaDepan(s: string) {
  const hariIni = new Date();
  hariIni.setHours(23, 59, 59, 999);
  return new Date(`${s}T00:00:00`) <= hariIni;
}

export const Langkah2 = z.object({
  jenisKekerasanId: z.string({ error: "Pilih jenis kekerasan." }).min(1, { error: "Pilih jenis kekerasan." }),
  kecamatanId: z.string({ error: "Pilih kecamatan tempat kejadian." }).min(1, { error: "Pilih kecamatan tempat kejadian." }),
  tanggalKejadian: z
    .string({ error: "Tanggal kejadian wajib diisi. Jika tidak ingat pasti, pilih perkiraan." })
    .min(1, { error: "Tanggal kejadian wajib diisi. Jika tidak ingat pasti, pilih perkiraan." })
    .refine(tanggalValid, { error: "Tanggal tidak valid." })
    .refine((s) => !tanggalValid(s) || tidakDiMasaDepan(s), { error: "Tanggal tidak boleh di masa depan." }),
  kronologi: z
    .string({ error: "Kronologi wajib diisi." })
    .trim()
    .min(10, { error: "Kronologi wajib diisi. Ceritakan sebisanya (minimal 10 huruf)." })
    .max(2000, { error: "Kronologi maksimal 2000 karakter." }),
});

export const Langkah3 = z.object({
  persetujuan: z.literal("on", { error: "Centang persetujuan untuk mengirim laporan." }),
});

export const SkemaLaporan = Langkah1.extend(Langkah2.shape).extend(Langkah3.shape);
export type DataLaporan = z.infer<typeof SkemaLaporan>;

export const NAMA_BIDANG = [
  "namaPelapor",
  "kontakPelapor",
  "namaKorban",
  "usiaKorban",
  "jenisKelaminKorban",
  "jenisKekerasanId",
  "kecamatanId",
  "tanggalKejadian",
  "kronologi",
  "persetujuan",
] as const;

export type Galat = Partial<Record<(typeof NAMA_BIDANG)[number], string>>;

/** Ambil pesan galat pertama per bidang dari hasil parse zod. */
export function galatPerBidang(error: z.ZodError): Galat {
  const hasil: Galat = {};
  for (const isu of error.issues) {
    const kunci = String(isu.path[0]) as keyof Galat;
    if (!(kunci in hasil)) hasil[kunci] = isu.message;
  }
  return hasil;
}

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
