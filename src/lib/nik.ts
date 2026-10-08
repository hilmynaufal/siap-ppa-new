import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";

/**
 * Perlindungan NIK: disimpan terenkripsi (AES-256-GCM) dan dicari lewat indeks HMAC, tidak pernah sebagai teks biasa.
 * Kunci berasal dari satu variabel lingkungan `DATA_KEY` (32 byte, base64) yang diturunkan menjadi dua subkunci
 * terpisah (enkripsi dan indeks). Kunci yang hilang membuat NIK tersimpan tidak dapat dipulihkan: cadangkan dengan aman.
 */

const VERSI = "v1";

export { POLA_NIK, bersihkanNik, nikValid } from "./nik-format";

function induk(): Buffer {
  const mentah = process.env.DATA_KEY;
  if (!mentah) throw new Error("DATA_KEY belum diatur. Buat dengan: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"");
  const kunci = Buffer.from(mentah, "base64");
  if (kunci.length !== 32) throw new Error("DATA_KEY harus 32 byte dalam base64.");
  return kunci;
}

const subkunci = (label: string) => Buffer.from(hkdfSync("sha256", induk(), Buffer.alloc(0), `siap-ppa:${label}`, 32));

/** Mengenkripsi NIK. Hasil: `v1.<iv>.<tag>.<isi>` (base64url); iv acak, sehingga NIK yang sama menghasilkan teks berbeda. */
export function enkripsiNik(nik: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", subkunci("enkripsi"), iv);
  const isi = Buffer.concat([c.update(nik, "utf8"), c.final()]);
  return [VERSI, iv.toString("base64url"), c.getAuthTag().toString("base64url"), isi.toString("base64url")].join(".");
}

/** Membuka NIK terenkripsi. Melempar galat bila data diubah atau kunci salah. */
export function dekripsiNik(teks: string): string {
  const [versi, iv, tag, isi] = teks.split(".");
  if (versi !== VERSI || !iv || !tag || !isi) throw new Error("Format NIK terenkripsi tidak dikenal.");
  const d = createDecipheriv("aes-256-gcm", subkunci("enkripsi"), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(isi, "base64url")), d.final()]).toString("utf8");
}

/** Indeks deterministik untuk mencari atau mendeteksi NIK yang sama tanpa membuka isinya. */
export function indeksNik(nik: string): string {
  return createHmac("sha256", subkunci("indeks")).update(nik).digest("hex");
}

/** Tampilan tersamar untuk daftar: 4 digit pertama dan 4 terakhir. */
export function samarkanNik(nik: string): string {
  return nik.length === 16 ? `${nik.slice(0, 4)}${"•".repeat(8)}${nik.slice(-4)}` : "•".repeat(nik.length);
}

/** NIK tersamar dari teks terenkripsi; bila tidak ada atau tidak bisa dibuka, kembalikan keterangan singkat. */
export function nikTersamar(cipher: string | null | undefined): string {
  if (!cipher) return "Tidak tersedia";
  try {
    return samarkanNik(dekripsiNik(cipher));
  } catch {
    return "Tidak dapat dibuka";
  }
}
