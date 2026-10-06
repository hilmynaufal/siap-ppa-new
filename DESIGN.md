---
name: SIAP PPA New
description: Sistem pelaporan kasus kekerasan terhadap perempuan dan anak, Kabupaten Bandung. Hangat, berwarna, berikon, membulat, dan tenang di area kerja.
colors:
  navy-950: "#0A1B44"
  navy-900: "#0F2A63"
  navy-800: "#17387F"
  navy-700: "#214A9E"
  blue-600: "#2F6FED"
  blue-100: "#DBE7FF"
  blue-50: "#EAF1FF"
  magenta-600: "#D6247C"
  magenta-700: "#B81B68"
  magenta-100: "#FFD6EA"
  magenta-50: "#FFEAF4"
  emergency: "#C8102E"
  emergency-hover: "#A50D26"
  teal-500: "#0E9F8E"
  teal-700: "#0B7F72"
  green-500: "#1E9E5A"
  amber-400: "#F5B014"
  violet-500: "#7A4FD6"
  sky-500: "#1E9BE0"
  coral-500: "#F26A4B"
  ink: "#1B2540"
  ink-soft: "#46506B"
  ink-mute: "#5B6682"
  canvas: "#F2F6FF"
  surface: "#FBFCFF"
  line: "#D9E2F5"
  line-soft: "#E8EEFB"
  line-strong: "#BCCAE6"
  success: "#1E7A46"
  success-50: "#E3F5EA"
  warning: "#7A4F00"
  warning-50: "#FFF3D6"
  error: "#B42318"
  error-50: "#FDECEA"
  info: "#1F5FAD"
  info-50: "#E6EFFA"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.2
  headline:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.3
  title:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.magenta-600}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    height: "48px"
    padding: "0 24px"
  button-primary-hover:
    backgroundColor: "{colors.magenta-700}"
  button-neutral:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "48px"
    padding: "0 20px"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    height: "48px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "48px"
    padding: "0 16px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "20px"
  badge:
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  sidebar:
    backgroundColor: "{colors.navy-900}"
    textColor: "#FFFFFF"
    width: "264px"
---

# Design System: SIAP PPA New

## 1. Overview

**Creative North Star: "Rumah Singgah yang Cerah"**

Aplikasi ini dipakai orang yang tidak ahli IT, sebagian sedang tertekan, sebagian lagi bekerja seharian dengan data yang berat. Sistem ini menjawabnya dengan satu keluarga visual: hangat, berwarna, dan berikon, tetapi tidak ramai. Halaman Pelapor boleh lebih ekspresif (hero gradien lembut, menu berikon besar); halaman Admin dan Pendamping lebih tenang dan rapi, namun memakai warna, ikon, dan bentuk membulat yang sama. Lembut tidak berarti kekanak-kanakan: bahasa tetap sopan dan serius, tanpa maskot atau emoji.

Sistem ini menolak tiga hal, mengikuti PRODUCT.md: **kaku dan birokratis** (tabel padat abu-abu tanpa ikon), **alarmis dan menakutkan** (dominasi merah dan hitam, bahasa mengancam), dan **dashboard SaaS generik** (template admin ungu-gradien dengan kartu angka seragam). Merah hanya untuk darurat dan galat.

**Key Characteristics:**
- Strategi warna "full palette": biru tua sebagai identitas, magenta untuk aksi utama, enam warna kategori untuk kotak ikon, netral bernuansa biru.
- Ikon di setiap tombol penting dan judul bagian; status selalu ikon dan teks, tidak hanya warna.
- Bentuk membulat sedang: kartu 16 px, kontrol 12 px, lencana 8 px.
- Tema terang saja; tidak ada mode gelap.
- Gerak hanya transisi singkat (150 sampai 200 ms) dan dimatikan oleh `prefers-reduced-motion`.
- Ringan untuk ponsel lemah: ikon SVG inline, font dihosting sendiri (paket npm), tanpa gambar berat.

## 2. Colors

Palet penuh dengan peran jelas: biru membawa identitas, magenta mengajak bertindak, enam warna kategori membedakan menu, dan netral bernuansa biru menjaga ketenangan. Tidak ada hitam atau putih murni.

### Primary
- **Biru Tua Pelindung** (#0F2A63, `navy-900`): sidebar, judul halaman, teks penegas. Varian `navy-950` (#0A1B44) untuk lapisan gelap modal, `navy-800` (#17387F) dan `navy-700` (#214A9E) untuk teks di atas latar biru muda.
- **Biru Terang Tautan** (#2F6FED, `blue-600`): halaman aktif pada paginasi, tautan, tepi chip terpilih, dan cincin fokus. Putih di atasnya berkontras 4,55:1.
- **Biru Muda Lembut** (#EAF1FF, `blue-50`) dan (#DBE7FF, `blue-100`): kepala tabel, tombol sekunder, hover, cincin fokus.

### Secondary
- **Magenta Ajakan** (#D6247C, `magenta-600`): satu aksi utama per layar (Masuk, Tambah jenis, Simpan). Putih di atasnya berkontras 4,8:1. Hover `magenta-700` (#B81B68). Tepi muda `magenta-100` (#FFD6EA) dan `magenta-50` (#FFEAF4) untuk hero dan penanda item aktif di sidebar.
- **Merah Darurat** (#C8102E, `emergency`): hanya tombol kontak darurat. Hover (#A50D26).

### Tertiary
Warna kategori untuk kotak ikon, tiap menu satu warna tetap: **Teal** (#0E9F8E; untuk teks di atas permukaan terang pakai varian gelap #0B7F72, 5,0:1), **Hijau** (#1E9E5A), **Kuning** (#F5B014, ikon gelap), **Ungu** (#7A4FD6), **Biru Langit** (#1E9BE0), **Koral** (#F26A4B). Kotak ikon adalah grafik dekoratif bernilai 3:1; teks selalu mendampingi.

### Neutral
- **Tinta** (#1B2540, `ink`): teks utama. **Tinta Lembut** (#46506B) dan **Tinta Redup** (#5B6682, 5,0:1 di atas `canvas`) untuk teks sekunder.
- **Kanvas** (#F2F6FF) latar halaman; **Permukaan** (#FBFCFF) kartu dan formulir.
- **Garis** (#D9E2F5), **Garis Halus** (#E8EEFB) pemisah baris, **Garis Kuat** (#BCCAE6) tepi input.
- **Status:** sukses (#1E7A46 di atas #E3F5EA), peringatan (#7A4F00 di atas #FFF3D6), galat (#B42318 di atas #FDECEA), info (#1F5FAD di atas #E6EFFA).

### Named Rules
**The One Ask Rule.** Satu tombol magenta per layar atau modal. Aksi lain memakai tombol netral atau sekunder. Magenta yang bertebaran membuat pengguna tidak tahu harus mengklik apa.

**The Red Is Alarm Rule.** Merah (#C8102E) tidak pernah dipakai untuk dekorasi, kategori, atau aksi biasa. Galat dan hapus memakai `error` (#B42318) di atas latar `error-50`, bukan merah darurat.

**The Color Plus Words Rule.** Warna tidak pernah menjadi satu-satunya pembawa makna. Setiap status memiliki ikon dan teks.

## 3. Typography

**Display Font:** Plus Jakarta Sans (cadangan `ui-sans-serif, system-ui, sans-serif`)
**Body Font:** Plus Jakarta Sans
**Label/Mono Font:** Plus Jakarta Sans; monospace hanya untuk kode teknis.

**Character:** Satu keluarga geometris yang bersahabat dan jelas dibaca di layar kecil. Hierarki dibangun dari bobot (400, 600, 700, 800) dan ukuran, bukan dari pasangan huruf. Dihosting sendiri lewat paket `@fontsource-variable/plus-jakarta-sans` (varian variabel, bobot 400 sampai 800), jadi tidak ada panggilan ke Google saat build maupun saat dipakai.

### Hierarchy
- **Display** (800, 2.25rem, 1.2): judul hero halaman masuk dan beranda Pelapor.
- **Headline** (800, 1.5rem, 1.3): judul halaman (`h1`), di samping ikon besar.
- **Title** (700, 1.125rem, 1.4): judul modal dan bagian.
- **Body** (400 sampai 500, 1rem, 1.6): isi, dan teks isian formulir. Isian selalu 16 px agar tidak memicu zoom otomatis di iOS. Panjang baris prosa maksimal 65 sampai 75ch.
- **Label** (700, 0.875rem, 1.4): label bidang, tombol, kepala tabel. Teks sidebar 14 px (600), label filter dan chip 13 px, angka KPI 1.875rem (800, `tabular-nums`).

### Named Rules
**The One Family Rule.** Hanya Plus Jakarta Sans. Jangan menambah huruf tampilan atau huruf ikon.

## 4. Elevation

Sistem ini datar secara bawaan: kedalaman dibangun dari lapisan warna (kanvas, permukaan, garis) dan bayangan lembut hanya untuk kartu dan lapisan yang melayang. Tidak ada bayangan pada elemen yang diam di dalam kartu.

### Shadow Vocabulary
- **Kartu** (`box-shadow: 0 1px 2px rgb(27 37 64 / 0.06), 0 8px 24px rgb(27 37 64 / 0.06)`): kartu tabel, strip KPI, tombol utama, halaman aktif pada paginasi.
- **Modal** (`box-shadow: 0 24px 64px rgb(27 37 64 / 0.3)`): dialog di atas lapisan `navy-950` setengah transparan.

### Named Rules
**The Flat Inside Rule.** Elemen di dalam kartu (kolom tabel, lencana, chip) tidak punya bayangan sendiri. Bayangan milik kontainernya.

## 5. Components

Setiap komponen interaktif memiliki keadaan default, hover, fokus, nonaktif, dan galat bila relevan. Fokus selalu `ring-4` biru muda (`blue-100`) yang terlihat; jangan menghapus outline tanpa pengganti.

### Buttons
- **Shape:** sudut 12 px (`rounded-xl`), tinggi 48 px (tabel: 44 px), ikon 18 sampai 20 px di kiri teks.
- **Primary:** latar `magenta-600`, teks putih 700, bayangan kartu; hover `magenta-700`; nonaktif latar `line-strong` tanpa bayangan.
- **Neutral:** latar `surface`, tepi `line-strong`, hover `blue-50`.
- **Danger:** latar `error`, teks putih; hover (#8F1C13). Tombol hapus kecil di tabel memakai latar `error-50`.
- **Kecil (aksi baris):** tinggi 44 px, tepi dan latar tipis (`blue-50` untuk Ubah, `error-50` untuk Hapus), selalu ikon dan teks.

### Icon Tile (IkonKotak)
Kotak berwarna membulat berisi ikon putih (`lucide-react`, 2,25 px goresan): kecil 32 px (sudut 8), sedang 40 px (12), besar 56 px (14). Dekoratif (`aria-hidden`), selalu didampingi teks.

### Cards / Containers
- **Corner Style:** 16 px. **Background:** `surface`. **Border:** `line`. **Shadow:** kartu.
- **Padding:** 20 px. Jangan menumpuk kartu di dalam kartu. Judul halaman tidak dibungkus kartu.

### Inputs / Fields
- **Style:** tinggi 48 px (cari dan filter 40 px), sudut 12 px, tepi `line-strong`, latar `surface`, ikon pendahulu di kiri bila membantu (surel, kata sandi, cari).
- **Focus:** tepi `blue-600` dan cincin `blue-100`. **Error:** tepi dan cincin `error`, pesan di bawah dengan ikon, `aria-invalid` dan `aria-describedby`. Petunjuk (ikon info dan teks `ink-mute`) digantikan pesan galat saat ada galat.
- Placeholder memberi contoh nyata ("Contoh: Kekerasan psikis"); isian tetap terisi setelah galat.

### Status Badge (LencanaStatus)
Sudut 8 px, ikon 14 px dan teks 12 px (700). Lima nada: sukses, netral, info, peringatan, galat. Selalu ikon dan teks.

### KPI Strip (StripKpi)
Satu permukaan bersekat (celah 1 px di atas `line-soft`), bukan deretan kartu identik. Tiap sel: label (14 px, 600), angka (1.875rem, 800, `tabular-nums`), keterangan (boleh lencana), dan kotak ikon berwarna di ujung kanan. Dua kolom di bawah 1280 px, empat kolom di atasnya. Tanpa gradien.

### Search, Filter, and Chips
- **Cari (BilahCari):** ikon kaca pembesar, tombol X untuk menghapus isian, label tersembunyi untuk pembaca layar.
- **Filter chip (FilterChip):** tinggi 36 px, sudut 12 px, teks 13 px (700), jumlah di dalam chip. Terpilih: tepi `blue-600`, latar `blue-50`, tanda centang. `aria-pressed` pada tiap chip dalam `role="group"`.
- **Filter pilihan (FilterPilihan):** `<select>` bawaan peramban dengan ikon filter dan panah, tinggi 40 px, agar nyaman di tablet dan ponsel. Tombol "Atur ulang" muncul hanya saat ada filter aktif.

### Switch (Saklar)
Untuk status aktif atau nonaktif yang berlaku langsung dari tabel (mis. kontak darurat). Lebar 48 px, tinggi 28 px, sudut 12 px; hidup berlatar `success`, mati berlatar `line-strong`, kenop 24 px dengan transisi 200 ms. Berupa `<button role="switch" aria-checked>` dengan label tersembunyi yang menyebut aksi dan nama baris ("Nonaktifkan Satgas PPA ..."). Perubahan lain (nama, alamat) tetap lewat modal Ubah.

### Pagination (Paginasi)
Kiri: "Menampilkan 11-20 dari 26 jenis" dan "Baris per halaman" (10, 25, 50). Kanan: pertama, sebelumnya, nomor halaman (elipsis bila banyak), berikutnya, terakhir; tombol 40 px, sudut 12 px. Halaman aktif `blue-600` dengan teks putih dan `aria-current="page"`; tombol di batas menjadi nonaktif.

### Table
Dibungkus kartu 16 px dengan `overflow-x-auto`. Kepala `blue-50` (14 px, 700, `navy-900`); sel 15 px dengan baris dipisah `line-soft`; aksi rata kanan. Kolom data panjang tidak terlipat (`whitespace-nowrap`) dan tabel menggulir ke samping di layar sempit. Keadaan kosong memakai ikon besar dan satu kalimat petunjuk.

### Modal
Lebar maksimum 520 px, sudut 16 px, di atas lapisan `navy-950` setengah transparan. Kepala: kotak ikon besar, judul (18 px, 700), subjudul (14 px, `ink-soft`), dan tombol X 44 px. Isi: bidang dengan petunjuk. Kaki: tombol netral "Batal" dan satu tombol utama di kanan. Esc menutup; `role="dialog"`, `aria-modal`, `aria-labelledby`, dan `aria-describedby`. Modal hapus memakai ikon peringatan di kotak `error-50`.

### Navigation
- **Header:** menempel di atas (`sticky`, tinggi 72 px, `z-30`), latar `surface`, logo magenta, nama pengguna, tombol "Keluar" berikon.
- **Sidebar Admin:** latar `navy-900`, menempel di bawah header dengan tinggi sisa layar. Ikon putih polos, teks 14 px (600). Item aktif berlatar `magenta-100` 15 persen dengan ikon `magenta-100`, tanpa garis tepi samping. Dapat dilipat menjadi rail ikon 72 px (transisi lebar 200 ms), statusnya diingat lewat cookie; di layar di bawah 768 px menjadi menu lipat. Tooltip memberi nama menu saat dilipat.
- **Breadcrumb:** "Beranda > Data master > Halaman", ikon rumah pada tautan pertama; halaman saat ini bercetak tebal dengan `aria-current="page"`.

### Hero (area ekspresif)
Gradien lembut 135 derajat dari `blue-100` ke `magenta-50`, kotak ikon besar, judul `navy-900`. Dipakai di halaman masuk dan beranda; satu per layar. Gradien hanya sebagai latar, tidak pernah pada teks.

## 6. Do's and Don'ts

### Do:
- **Do** beri ikon pada setiap tombol penting dan judul bagian (lucide-react, 16 sampai 20 px), selalu bersama teks.
- **Do** pakai satu tombol utama magenta (#D6247C) per layar; lainnya netral atau sekunder.
- **Do** pakai sudut 16 px untuk kartu, 12 px untuk kontrol, 8 px untuk lencana.
- **Do** pakai bahasa sederhana dengan "Anda": "Anda tidak sendiri", "Nama tidak boleh sama dengan yang sudah ada".
- **Do** jaga kontras teks minimal 4,5:1 dan target sentuh minimal 44 px untuk Pelapor.
- **Do** jaga halaman Pelapor ringan: ikon SVG inline, tanpa font ikon atau gambar berat.
- **Do** biarkan konten Admin rata kiri dan mengisi lebar penuh di samping sidebar; header dan sidebar tetap menempel.

### Don't:
- **Don't** terlihat **kaku dan birokratis**: tabel padat abu-abu tanpa ikon, tanpa warna, tanpa ruang napas.
- **Don't** terlihat **alarmis dan menakutkan**: tidak ada dominasi merah dan hitam atau bahasa mengancam. Merah darurat (#C8102E) hanya untuk tombol kontak darurat.
- **Don't** menjadi **dashboard SaaS generik**: tidak ada gradien ungu, tidak ada deretan kartu angka seragam dengan angka besar dan gradien; KPI dibuat sebagai satu strip bersekat dengan konteks.
- **Don't** pakai `border-left` atau `border-right` lebih dari 1 px sebagai garis aksen berwarna pada kartu, daftar, atau item aktif.
- **Don't** pakai teks gradien, kaca buram (glassmorphism) dekoratif, atau mode gelap.
- **Don't** hanya membedakan status dengan warna; selalu tambah ikon dan teks.
- **Don't** menumpuk kartu di dalam kartu atau membungkus judul halaman dalam kartu.
- **Don't** pakai maskot, emoji, atau gaya kekanak-kanakan; bentuk lembut, bahasa serius.
- **Don't** menganimasikan selain transisi singkat (maksimal 200 ms) untuk lebar sidebar, warna, dan keadaan; tanpa pantulan atau pegas.
- **Don't** memakai em dash (tanda hubung panjang) pada teks antarmuka.
