import * as z from "zod";

// Aman dipakai di klien dan server: hanya aturan isian dan pemeriksaan foto.

export const MAKS_FOTO = 5;
export const MAKS_UKURAN_FOTO = 5 * 1024 * 1024;
export const FORMAT_FOTO = "JPG atau PNG";

// Dibulatkan ke atas agar berkas yang sedikit melebihi batas tidak tampil sebagai "5,0 MB. Maksimal 5 MB".
const MB = (n: number) => `${(Math.ceil((n / 1024 / 1024) * 10) / 10).toFixed(1).replace(".", ",")} MB`;

/** Pemeriksaan cepat berdasarkan nama dan ukuran (klien dan server). Mengembalikan pesan galat atau null. */
export function periksaFoto(f: { name: string; size: number }): string | null {
  if (!/\.(jpe?g|png)$/i.test(f.name)) return "Format tidak didukung. Gunakan JPG atau PNG.";
  if (f.size === 0) return "Berkas kosong.";
  if (f.size > MAKS_UKURAN_FOTO) return `Ukuran ${MB(f.size)}. Maksimal 5 MB.`;
  return null;
}

export const NAMA_BIDANG_PENDAMPINGAN = ["jenisPendampinganId", "keterangan", "rekomendasi", "ajukanSesiLanjutan", "alasanRevisi"] as const;

const teks = (label: string, maks: number) =>
  z
    .string({ error: `${label} wajib diisi.` })
    .trim()
    .min(1, { error: `${label} wajib diisi.` })
    .max(maks, { error: `${label} terlalu panjang (maksimal ${maks} huruf).` });

export const SkemaLaporanPendampingan = z.object({
  jenisPendampinganId: z.string({ error: "Jenis pendampingan wajib dipilih." }).trim().min(1, { error: "Jenis pendampingan wajib dipilih." }),
  keterangan: teks("Keterangan pendampingan", 3000),
  rekomendasi: teks("Rekomendasi tindak lanjut", 2000),
  ajukanSesiLanjutan: z.boolean(),
});

export const SkemaRevisi = SkemaLaporanPendampingan.extend({
  alasanRevisi: z
    .string({ error: "Alasan revisi wajib diisi." })
    .trim()
    .min(5, { error: "Alasan revisi wajib diisi (minimal 5 huruf)." })
    .max(300, { error: "Alasan revisi terlalu panjang (maksimal 300 huruf)." }),
});

export type IsiLaporanPendampingan = z.infer<typeof SkemaLaporanPendampingan>;
export type GalatPendampingan = Partial<Record<(typeof NAMA_BIDANG_PENDAMPINGAN)[number], string>>;

export function galatBidang(e: z.ZodError): GalatPendampingan {
  const g: GalatPendampingan = {};
  for (const i of e.issues) {
    const k = String(i.path[0]) as keyof GalatPendampingan;
    if (!g[k]) g[k] = i.message;
  }
  return g;
}
