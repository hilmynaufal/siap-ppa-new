# Panduan Logo SIAP PPA

**Ide:** lengkung pelindung yang merangkul satu titik. Setiap orang yang melapor dilindungi dan didampingi.

## Berkas utama
| Pemakaian | Berkas |
|---|---|
| Simbol (warna) | `siap-symbol.svg` |
| Simbol ukuran kecil (≤ 32 px) | `siap-symbol-small.svg` |
| Logo horizontal (header, surat, spanduk) | `siap-horizontal.svg` |
| Logo tumpuk (poster, stiker QR, kartu) | `siap-stacked.svg` |
| Wordmark saja | `siap-wordmark.svg` |
| Latar gelap | `*-reversed.svg` |
| Satu warna hitam / putih | `kit/variants/*-black.svg`, `*-white.svg` |
| Favicon, ikon aplikasi, PWA | `kit/web/` |

## Warna
| Nama | HEX | RGB | Kegunaan |
|---|---|---|---|
| Navy 900 | `#0F2A63` | 15, 42, 99 | lengkung dan huruf |
| Magenta 600 | `#D6247C` | 214, 36, 124 | titik (satu-satunya aksen) |
| Magenta terang | `#FF6FB0` | 255, 111, 176 | titik di atas latar navy |
| Putih | `#FFFFFF` | 255, 255, 255 | lengkung dan huruf di latar gelap |

Token sama dengan `--color-navy-900` dan `--color-magenta-600` di `src/app/globals.css`. Nilai CMYK/Pantone untuk cetak belum ditetapkan: minta percetakan mencocokkan HEX di atas dan cetak uji dulu.

## Ruang bebas dan ukuran minimum
- Ruang bebas di semua sisi: **selebar tebal lengkung simbol** (±1/6 tinggi simbol), minimal; lebih lega lebih baik.
- Simbol: minimum **24 px** (layar) / **8 mm** (cetak). Di bawah 32 px pakai `siap-symbol-small.svg`.
- Logo horizontal: minimum lebar **120 px** / **30 mm**. Logo tumpuk: **80 px** / **20 mm**.

## Latar yang diperbolehkan
- Putih atau `canvas` `#F2F6FF`: versi warna.
- Navy `#0F2A63` atau foto gelap yang tenang: versi *reversed*.
- Cetak satu warna, stempel, fotokopi: versi hitam atau putih.

## Jangan
- Mengubah warna titik menjadi merah darurat (`#C8102E`): merah dicadangkan untuk tombol darurat.
- Memutar, memiringkan, memadatkan, atau menambah bayangan dan gradasi.
- Mengganti huruf dengan font lain atau memisahkan titik dari lengkung.
- Menaruh logo warna di atas foto ramai atau latar magenta.
- Memakai logo ini di dokumen pihak lain tanpa izin Diskominfo.

## Catatan
- Huruf SIAP PPA digambar sebagai garis (monoline) berujung bulat, bukan font; tidak ada lisensi font yang perlu diurus.
- Master memakai *stroke*; bila percetakan butuh outline, ekspor "expand stroke" dari Inkscape atau Illustrator.
- Pemeriksaan kemiripan dengan logo lain dan pendaftaran merek belum dilakukan.
