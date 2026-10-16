// Kode pendaftaran yang diingat di browser Pelapor (otomatis setelah laporan terkirim, berlaku 1 hari karena layanan dilakukan pada hari itu). Tidak pernah dikirim ke server.
// Semua akses dibungkus try/catch: penyimpanan bisa ditolak (mode pribadi, data situs diblokir).
import { POLA_KODE } from "./laporan";

const KUNCI = "siap-ppa:kode-pendaftaran";
export const MASA_BERLAKU_MS = 24 * 60 * 60 * 1000;

/** Isi penyimpanan -> kode, atau null bila rusak, bukan kode yang sah, atau sudah lewat masa berlakunya. */
export function uraiKodeTersimpan(mentah: string | null, sekarang = Date.now()): string | null {
  if (!mentah) return null;
  try {
    const v: unknown = JSON.parse(mentah);
    if (typeof v !== "object" || v === null) return null;
    const { kode, sampai } = v as { kode?: unknown; sampai?: unknown };
    if (typeof kode !== "string" || !POLA_KODE.test(kode) || typeof sampai !== "number" || sampai <= sekarang) return null;
    return kode;
  } catch {
    return null;
  }
}

export function bacaKodeTersimpan(): string | null {
  try {
    const kode = uraiKodeTersimpan(localStorage.getItem(KUNCI));
    // Yang sudah kedaluwarsa atau rusak dibersihkan agar tidak tertinggal di perangkat.
    if (!kode) localStorage.removeItem(KUNCI);
    return kode;
  } catch {
    return null;
  }
}

export function simpanKode(kode: string, sekarang = Date.now()): boolean {
  try {
    localStorage.setItem(KUNCI, JSON.stringify({ kode, sampai: sekarang + MASA_BERLAKU_MS }));
    return true;
  } catch {
    return false;
  }
}

export function hapusKodeTersimpan() {
  try {
    localStorage.removeItem(KUNCI);
  } catch {
    // Tidak ada yang bisa dihapus bila penyimpanan tidak tersedia.
  }
}

/** Kode pendaftaran dari fragmen tautan Cek Tiket (`#kode=PPA-...`); null bila tidak ada atau tidak berformat benar. */
export function kodeDariFragmen(hash: string): string | null {
  const nilai = new URLSearchParams(hash.replace(/^#/, "")).get("kode")?.trim().toUpperCase() ?? "";
  return POLA_KODE.test(nilai) ? nilai : null;
}
