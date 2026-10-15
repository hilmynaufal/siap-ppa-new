/** Pesan pembuka yang sudah terisi saat Pelapor membuka WhatsApp dari tombol Darurat. */
export const PESAN_DARURAT = "Halo UPTD PPA Kabupaten Bandung, saya membutuhkan bantuan segera.";

/** Nomor dalam format internasional tanpa tanda (08xx menjadi 628xx); hanya angka. */
function normalkan(nomor: string | null | undefined) {
  const angka = (nomor ?? "").replace(/\D/g, "");
  return angka.startsWith("0") ? `62${angka.slice(1)}` : angka;
}

/** Nomor ponsel Indonesia (628xx). Telepon kantor (mis. 022) tidak bisa dihubungi lewat WhatsApp. */
export function nomorPonsel(nomor: string | null | undefined) {
  return /^628\d{7,12}$/.test(normalkan(nomor));
}

/**
 * Tautan wa.me untuk sebuah nomor. Nomor lokal (08xx) diubah ke format internasional (628xx);
 * bila nomor kosong atau tidak wajar, hasilnya null agar pemanggil dapat memakai cadangan (tel:).
 */
export function tautanWhatsapp(nomor: string | null | undefined, pesan?: string): string | null {
  const angka = normalkan(nomor);
  if (angka.length < 9 || angka.length > 15) return null;
  return `https://wa.me/${angka}${pesan ? `?text=${encodeURIComponent(pesan)}` : ""}`;
}

/**
 * Tautan WhatsApp tombol Darurat: nomor `WA_DARURAT` bila diisi, selain itu nomor kontak darurat aktif
 * asalkan nomor ponsel. Null bila keduanya tidak bisa dipakai, sehingga tombol kembali menelepon (tel:).
 */
export function tautanWaDarurat(teleponKontak?: string | null): string | null {
  const nomor = tautanWhatsapp(process.env.WA_DARURAT, PESAN_DARURAT);
  if (nomor) return nomor;
  return nomorPonsel(teleponKontak) ? tautanWhatsapp(teleponKontak, PESAN_DARURAT) : null;
}
