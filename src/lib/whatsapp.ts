/** Pesan pembuka yang sudah terisi saat Pelapor membuka WhatsApp dari tombol Darurat. */
export const PESAN_DARURAT = "Halo UPTD PPA Kabupaten Bandung, saya membutuhkan bantuan segera.";

/**
 * Tautan wa.me untuk sebuah nomor ponsel. Nomor lokal (08xx) diubah ke format internasional (628xx);
 * bila nomor kosong atau terlalu pendek, hasilnya null agar pemanggil dapat memakai cadangan (tel:).
 */
export function tautanWhatsapp(nomor: string | null | undefined, pesan?: string): string | null {
  let angka = (nomor ?? "").replace(/\D/g, "");
  if (angka.startsWith("0")) angka = `62${angka.slice(1)}`;
  if (angka.length < 9 || angka.length > 15) return null;
  return `https://wa.me/${angka}${pesan ? `?text=${encodeURIComponent(pesan)}` : ""}`;
}

/** Tautan WhatsApp tombol Darurat dari variabel lingkungan `WA_DARURAT`; null bila belum diisi. */
export function tautanWaDarurat(): string | null {
  return tautanWhatsapp(process.env.WA_DARURAT, PESAN_DARURAT);
}
