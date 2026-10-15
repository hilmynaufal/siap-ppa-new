/**
 * Data contoh untuk landing page. Angka, alamat, dan jam layanan di sini masih ILUSTRASI untuk keperluan desain;
 * ganti dengan data dari basis data (dasbor, lokasi, antrean) sebelum dipakai sungguhan.
 */

export const ANGKA = {
  periode: "Januari sampai Oktober 2026",
  laporan: 1284,
  didampingi: 963,
  kecamatan: 31,
  verifikasiCepat: 96,
  pendamping: 42,
  sesi: 2417,
};

/** Laporan diterima per bulan (satu seri). */
export const LAPORAN_BULANAN = [
  { bulan: "Januari", label: "Jan", n: 96 },
  { bulan: "Februari", label: "Feb", n: 104 },
  { bulan: "Maret", label: "Mar", n: 118 },
  { bulan: "April", label: "Apr", n: 111 },
  { bulan: "Mei", label: "Mei", n: 127 },
  { bulan: "Juni", label: "Jun", n: 134 },
  { bulan: "Juli", label: "Jul", n: 142 },
  { bulan: "Agustus", label: "Agu", n: 139 },
  { bulan: "September", label: "Sep", n: 151 },
  { bulan: "Oktober", label: "Okt", n: 162 },
];

/** Bauran layanan; urutan warna tetap (divalidasi untuk buta warna dengan label terlihat). */
export const BAURAN_LAYANAN = [
  { nama: "Psikologis", persen: 41, warna: "#048842" },
  { nama: "Hukum", persen: 24, warna: "#7A4FD6" },
  { nama: "Kesehatan", persen: 15, warna: "#C98A00" },
  { nama: "Mediasi", persen: 12, warna: "#1E8FD0" },
  { nama: "Rumah aman", persen: 8, warna: "#E0583A" },
];

export const LOKASI = {
  nama: "UPTD PPA Kabupaten Bandung",
  alamat: "Kompleks Pemerintahan Kabupaten Bandung, Jl. Raya Soreang Km 17, Soreang",
  jam: [
    { hari: "Senin sampai Kamis", jam: "08.00 sampai 15.30" },
    { hari: "Jumat", jam: "08.00 sampai 11.00" },
    { hari: "Sabtu, Minggu, libur", jam: "Tutup" },
  ],
  peta: "https://www.google.com/maps/search/?api=1&query=Soreang%20Kabupaten%20Bandung",
};

export const ANTREAN = {
  dilayani: 12,
  berikutnya: [13, 14, 15, 16],
  selesaiHariIni: 18,
  menunggu: 4,
};

/** Dipakai hanya bila basis data belum tersedia saat pengembangan. */
export const JENIS_CONTOH = [
  "Kekerasan fisik",
  "Kekerasan psikis",
  "Kekerasan seksual",
  "Penelantaran",
  "Perundungan",
  "Eksploitasi ekonomi",
  "Perdagangan orang",
  "Kekerasan berbasis gender online",
];

/** Kontak contoh, hanya untuk mode pengembangan tanpa basis data. Jangan tampil di produksi. */
export const KONTAK_CONTOH = [
  { id: "c1", instansi: "UPTD PPA Kabupaten Bandung", alamat: "Soreang, Kabupaten Bandung", telepon: "0800-0000-0001" },
  { id: "c2", instansi: "Unit PPA Kepolisian", alamat: "Soreang, Kabupaten Bandung", telepon: "0800-0000-0002" },
  { id: "c3", instansi: "Layanan Puskesmas Ramah Anak", alamat: "Baleendah, Kabupaten Bandung", telepon: "0800-0000-0003" },
];
