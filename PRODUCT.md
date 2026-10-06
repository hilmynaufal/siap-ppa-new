# Product

## Register

product

## Users

Aplikasi dipakai empat kelompok, tidak satu pun ahli IT.

- **Pelapor** (korban atau masyarakat umum): membuka aplikasi dari ponsel Android murah setelah memindai QR Code, sering dengan sinyal lemah, dan mungkin sedang tertekan. Tugasnya: melapor dengan aman, lalu melihat tiket dan jadwalnya.
- **Admin** (ASN DALDUK PPA): memverifikasi laporan, mengatur sesi dan jadwal pendampingan, mengelola data master. Memakai laptop kantor, sebagian beresolusi kecil (1366 px).
- **Pendamping** (psikolog, konsultan hukum, mitra): melihat sesi yang ditugaskan dan menulis laporan pendampingan, sering lewat tablet.
- **Petugas check-in**: memindai QR tiket dan memanggil nomor antrean di lokasi layanan; layar antrean publik dibaca dari jauh di TV lobi.

## Product Purpose

SIAP PPA New adalah sistem pelaporan kasus kekerasan terhadap perempuan dan anak di Kabupaten Bandung (DALDUK PPA). Masyarakat memindai QR, mengisi formulir, lalu setelah Admin memverifikasi menerima tiket berisi nomor antrean dan jadwal pendampingan. Keberhasilan: korban berani dan mudah melapor, laporan tertangani tanpa tercecer, dan petugas bekerja tanpa pelatihan panjang.

## Brand Personality

Hangat dan melindungi, ceria dan berwarna. Suara: sopan, tenang, tidak menghakimi, memakai "Anda". Rasa yang dituju: "Anda tidak sendiri" untuk Pelapor; "mudah dan jelas" untuk petugas.

Dua gaya satu keluarga: halaman Pelapor lebih ekspresif (hero berwarna, menu berikon besar), halaman Admin dan Pendamping lebih tenang dan rapi, tetapi memakai warna, ikon, dan bentuk membulat yang sama.

## Anti-references

- Kaku dan birokratis: situs dinas lama, tabel padat abu-abu tanpa ikon.
- Alarmis dan menakutkan: dominasi merah dan hitam, bahasa mengancam. Merah hanya untuk tombol Darurat.
- Dashboard SaaS generik: template admin ungu-gradien dengan kartu angka seragam.

## Design Principles

1. **Ikon menuntun, teks menjelaskan.** Setiap tombol penting dan judul bagian punya ikon, supaya pengguna non-IT mengenali fungsi sebelum membaca.
2. **Warna membawa makna.** Tiap kategori menu punya warna tetap; status tidak pernah hanya warna, selalu ada teks dan ikon. Merah hanya untuk darurat dan galat.
3. **Lembut dan membulat, tetapi tidak kekanak-kanakan.** Bentuk besar dan ramah, bahasa serius dan hormat; tidak ada maskot atau emoji.
4. **Ringan sebelum indah.** Ponsel murah dan sinyal lemah: ikon SVG inline, tanpa gambar berat atau font ikon eksternal, gerak singkat dan halus.
5. **Satu langkah, satu tujuan.** Satu aksi utama per layar, bahasa sehari-hari, pesan galat yang menolong, bukan menyalahkan.

## Accessibility & Inclusion

- WCAG 2.2 AA: kontras teks minimal 4,5:1, target sentuh minimal 44 px (Pelapor 52 px untuk aksi utama).
- Status tidak bergantung pada warna saja (teks dan ikon menyertai).
- Hormati `prefers-reduced-motion`; gerak hanya transisi singkat.
- Bahasa sangat sederhana di halaman Pelapor; hindari istilah teknis dan hukum.
- Tema terang saja (tidak ada mode gelap), ukuran teks dasar 16 px.
