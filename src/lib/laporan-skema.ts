import * as z from "zod";
import { bersihkanNik, nikValid } from "./nik-format";

// ---- Pilihan bernilai tetap (label untuk tampilan, nilai sama dengan enum basis data) ----

export const OPSI_JENIS_KELAMIN = [
  { nilai: "PEREMPUAN", label: "Perempuan" },
  { nilai: "LAKI_LAKI", label: "Laki-laki" },
  { nilai: "LAINNYA", label: "Lainnya" },
] as const;

export const OPSI_STATUS_BPJS = [
  { nilai: "AKTIF", label: "Aktif" },
  { nilai: "TIDAK_AKTIF", label: "Tidak aktif" },
  { nilai: "TIDAK_TAHU", label: "Tidak tahu" },
] as const;

export const OPSI_PENDIDIKAN = [
  { nilai: "BELUM_SEKOLAH", label: "Belum sekolah" },
  { nilai: "TIDAK_SEKOLAH", label: "Tidak sekolah" },
  { nilai: "SD", label: "SD/sederajat" },
  { nilai: "SMP", label: "SMP/sederajat" },
  { nilai: "SMA", label: "SMA/sederajat" },
  { nilai: "DIPLOMA", label: "Diploma (D1-D3)" },
  { nilai: "SARJANA", label: "Sarjana (D4/S1)" },
  { nilai: "PASCASARJANA", label: "Pascasarjana (S2/S3)" },
] as const;

export const OPSI_STATUS_PERKAWINAN = [
  { nilai: "BELUM_KAWIN", label: "Belum kawin" },
  { nilai: "KAWIN", label: "Kawin" },
  { nilai: "CERAI_HIDUP", label: "Cerai hidup" },
  { nilai: "CERAI_MATI", label: "Cerai mati" },
] as const;

const nilaiOpsi = (o: readonly { nilai: string }[]) => new Set(o.map((x) => x.nilai));
const JK = nilaiOpsi(OPSI_JENIS_KELAMIN);
const PDD = nilaiOpsi(OPSI_PENDIDIKAN);
const SPK = nilaiOpsi(OPSI_STATUS_PERKAWINAN);
const BPJS = nilaiOpsi(OPSI_STATUS_BPJS);

/** Nomor kartu BPJS Kesehatan: 13 digit; spasi dan tanda hubung diabaikan. */
export const bersihkanNoBpjs = (v: string) => v.replace(/[\s.-]/g, "");
export const noBpjsValid = (v: string) => /^\d{13}$/.test(bersihkanNoBpjs(v));

/** Usia penuh (tahun) pada tanggal `pada` dari tanggal lahir YYYY-MM-DD. */
export function hitungUsia(tanggalLahir: string, pada = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tanggalLahir);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  let usia = pada.getFullYear() - y;
  if (pada.getMonth() + 1 < mo || (pada.getMonth() + 1 === mo && pada.getDate() < d)) usia--;
  return usia;
}

// ---- Skema formulir (dipakai di klien dan diperiksa ulang di server) ----

/** Langkah formulir: 1 Pelapor, 2 Korban, 3 Kejadian, 4 Terlapor, 5 Berkas dan persetujuan. */
export type Langkah = 1 | 2 | 3 | 4 | 5;

export const BIDANG_LANGKAH = {
  1: [
    "pelaporAdalahKorban", "pelaporNama", "pelaporNik", "pelaporHubunganId", "pelaporKontak", "pelaporJenisKelamin", "pelaporTempatLahir", "pelaporTanggalLahir",
    "pelaporPekerjaanId", "pelaporPendidikan", "pelaporAgamaId", "pelaporStatusPerkawinan", "pelaporAlamat", "pelaporKecamatanId", "pelaporDesaId",
  ],
  2: [
    "korbanNama", "korbanNamaPanggilan", "korbanNik", "korbanJenisKelamin", "korbanTempatLahir", "korbanTanggalLahir", "korbanPendidikan",
    "korbanPekerjaanId", "korbanAgamaId", "korbanStatusPerkawinan", "korbanNoBpjs", "korbanStatusBpjs", "korbanKontak", "korbanAlamat", "korbanKecamatanId", "korbanDesaId",
  ],
  3: ["jenisKekerasanId", "tanggalKejadian", "tempatKejadian", "kronologi", "asalRujukanId", "lembagaRujukan", "alasanRujukan", "jenisPendampinganId"],
  4: ["terlaporTidakDiketahui", "terlaporNama", "terlaporJenisKelamin", "terlaporUsia", "terlaporHubunganId", "terlaporAlamat"],
  5: ["persetujuan"],
} as const satisfies Record<Langkah, readonly string[]>;

export const NAMA_BIDANG = Object.values(BIDANG_LANGKAH).flat();
export type NamaBidang = (typeof NAMA_BIDANG)[number];
export type Galat = Partial<Record<NamaBidang, string>>;

/**
 * Nama kolom jebakan robot. Sengaja tidak mirip isian umum (nama, situs, email, telepon, alamat)
 * agar tidak diisi otomatis oleh browser atau pengelola kata sandi milik Pelapor sungguhan.
 */
export const BIDANG_JEBAKAN = "ppa_k7x";

/** Isian formulir sebagai teks per bidang; dipakai di klien dan server agar hasilnya sama. */
export function nilaiDariFormData(fd: FormData): Record<string, string> {
  return Object.fromEntries(NAMA_BIDANG.map((k) => [k, String(fd.get(k) ?? "")]));
}

export function langkahDariBidang(b: string): Langkah {
  for (const [n, daftar] of Object.entries(BIDANG_LANGKAH)) if ((daftar as readonly string[]).includes(b)) return Number(n) as Langkah;
  return 5;
}

/** Nilai pilihan "Datang/lapor langsung" pada asal rujukan; disimpan sebagai asal rujukan kosong. */
export const ASAL_LANGSUNG = "LANGSUNG";
export const LABEL_ASAL_LANGSUNG = "Datang/lapor langsung";

const POLA_HP = /^\+?[\d\s-]{8,20}$/;
const teks = (maks: number) => z.string().trim().max(maks, { error: `Terlalu panjang (maksimal ${maks} huruf).` });

export function tanggalValid(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}
export function tidakDiMasaDepan(s: string) {
  const hariIni = new Date();
  hariIni.setHours(23, 59, 59, 999);
  return new Date(`${s}T00:00:00`) <= hariIni;
}

// Semua bidang berupa teks (begitulah FormData tiba). Aturan wajib/bersyarat ada di superRefine di bawah.
const bentuk = {
  pelaporAdalahKorban: z.string().trim(),
  pelaporNama: teks(120),
  pelaporNik: teks(40),
  pelaporHubunganId: teks(60),
  pelaporKontak: teks(30),
  pelaporJenisKelamin: teks(20),
  pelaporTempatLahir: teks(100),
  pelaporTanggalLahir: teks(10),
  pelaporPekerjaanId: teks(60),
  pelaporPendidikan: teks(20),
  pelaporAgamaId: teks(60),
  pelaporStatusPerkawinan: teks(20),
  pelaporAlamat: teks(300),
  pelaporKecamatanId: teks(60),
  pelaporDesaId: teks(60),
  korbanNama: teks(120),
  korbanNamaPanggilan: teks(60),
  korbanNik: teks(40),
  korbanJenisKelamin: teks(20),
  korbanTempatLahir: teks(100),
  korbanTanggalLahir: teks(10),
  korbanPendidikan: teks(20),
  korbanPekerjaanId: teks(60),
  korbanAgamaId: teks(60),
  korbanStatusPerkawinan: teks(20),
  korbanNoBpjs: teks(30),
  korbanStatusBpjs: teks(20),
  korbanKontak: teks(30),
  korbanAlamat: teks(300),
  korbanKecamatanId: teks(60),
  korbanDesaId: teks(60),
  jenisKekerasanId: teks(60),
  tanggalKejadian: teks(10),
  tempatKejadian: teks(300),
  kronologi: z.string().trim().max(2000, { error: "Kronologi maksimal 2000 karakter." }),
  jenisPendampinganId: teks(60),
  asalRujukanId: teks(60),
  lembagaRujukan: teks(150),
  alasanRujukan: teks(500),
  terlaporTidakDiketahui: z.string().trim(),
  terlaporNama: teks(120),
  terlaporJenisKelamin: teks(20),
  terlaporUsia: teks(4),
  terlaporHubunganId: teks(60),
  terlaporAlamat: teks(300),
  persetujuan: z.string().trim(),
};

export const SkemaLaporan = z.object(bentuk).superRefine((d, ctx) => {
  const tambah = (path: NamaBidang, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
  const kosong = (v: string) => v === "";
  const sendiri = d.pelaporAdalahKorban === "on";

  // Langkah 1: Pelapor (dilewati bila korban sendiri yang melapor)
  if (!sendiri) {
    if (kosong(d.pelaporNama)) tambah("pelaporNama", "Nama lengkap pelapor wajib diisi.");
    if (kosong(d.pelaporNik)) tambah("pelaporNik", "NIK pelapor wajib diisi.");
    else if (!nikValid(bersihkanNik(d.pelaporNik))) tambah("pelaporNik", "NIK harus 16 digit angka dan berformat benar.");
    if (kosong(d.pelaporHubunganId)) tambah("pelaporHubunganId", "Pilih hubungan Anda dengan korban.");
    if (kosong(d.pelaporKontak)) tambah("pelaporKontak", "Nomor HP/WhatsApp wajib diisi agar petugas dapat menghubungi Anda.");
    else if (!POLA_HP.test(d.pelaporKontak)) tambah("pelaporKontak", "Nomor HP tidak valid. Contoh: 0812 3456 7890.");
    if (!kosong(d.pelaporDesaId) && kosong(d.pelaporKecamatanId)) tambah("pelaporDesaId", "Pilih kecamatan lebih dulu.");
    // Data diri untuk Berita Acara Pelaporan.
    if (kosong(d.pelaporJenisKelamin)) tambah("pelaporJenisKelamin", "Pilih jenis kelamin Anda.");
    else if (!JK.has(d.pelaporJenisKelamin)) tambah("pelaporJenisKelamin", "Pilihan tidak dikenal.");
    if (kosong(d.pelaporTempatLahir)) tambah("pelaporTempatLahir", "Tempat lahir wajib diisi.");
    if (kosong(d.pelaporTanggalLahir)) tambah("pelaporTanggalLahir", "Tanggal lahir wajib diisi.");
    else if (!tanggalValid(d.pelaporTanggalLahir)) tambah("pelaporTanggalLahir", "Tanggal lahir tidak valid.");
    else if (!tidakDiMasaDepan(d.pelaporTanggalLahir)) tambah("pelaporTanggalLahir", "Tanggal lahir tidak boleh di masa depan.");
    else if ((hitungUsia(d.pelaporTanggalLahir) ?? 0) > 120) tambah("pelaporTanggalLahir", "Tanggal lahir tidak masuk akal.");
    if (kosong(d.pelaporPekerjaanId)) tambah("pelaporPekerjaanId", "Pilih pekerjaan Anda.");
    if (kosong(d.pelaporPendidikan)) tambah("pelaporPendidikan", "Pilih pendidikan terakhir Anda.");
    else if (!PDD.has(d.pelaporPendidikan)) tambah("pelaporPendidikan", "Pilihan tidak dikenal.");
    if (kosong(d.pelaporAgamaId)) tambah("pelaporAgamaId", "Pilih agama Anda.");
    if (kosong(d.pelaporStatusPerkawinan)) tambah("pelaporStatusPerkawinan", "Pilih status perkawinan Anda.");
    else if (!SPK.has(d.pelaporStatusPerkawinan)) tambah("pelaporStatusPerkawinan", "Pilihan tidak dikenal.");
  }

  // Langkah 2: Korban
  if (kosong(d.korbanNama)) tambah("korbanNama", "Nama lengkap korban wajib diisi.");
  if (kosong(d.korbanNik)) tambah("korbanNik", "NIK korban wajib diisi.");
  else if (!nikValid(bersihkanNik(d.korbanNik))) tambah("korbanNik", "NIK harus 16 digit angka dan berformat benar.");
  if (kosong(d.korbanJenisKelamin)) tambah("korbanJenisKelamin", "Pilih jenis kelamin korban.");
  else if (!JK.has(d.korbanJenisKelamin)) tambah("korbanJenisKelamin", "Pilihan tidak dikenal.");
  if (kosong(d.korbanTanggalLahir)) tambah("korbanTanggalLahir", "Tanggal lahir korban wajib diisi.");
  else if (!tanggalValid(d.korbanTanggalLahir)) tambah("korbanTanggalLahir", "Tanggal lahir tidak valid.");
  else if (!tidakDiMasaDepan(d.korbanTanggalLahir)) tambah("korbanTanggalLahir", "Tanggal lahir tidak boleh di masa depan.");
  else if ((hitungUsia(d.korbanTanggalLahir) ?? 0) > 120) tambah("korbanTanggalLahir", "Tanggal lahir tidak masuk akal.");
  if (!kosong(d.korbanPendidikan) && !PDD.has(d.korbanPendidikan)) tambah("korbanPendidikan", "Pilihan tidak dikenal.");
  if (!kosong(d.korbanStatusPerkawinan) && !SPK.has(d.korbanStatusPerkawinan)) tambah("korbanStatusPerkawinan", "Pilihan tidak dikenal.");
  if (!kosong(d.korbanNoBpjs) && !noBpjsValid(d.korbanNoBpjs)) tambah("korbanNoBpjs", "Nomor BPJS harus 13 digit angka.");
  if (!kosong(d.korbanStatusBpjs) && !BPJS.has(d.korbanStatusBpjs)) tambah("korbanStatusBpjs", "Pilihan tidak dikenal.");
  if (sendiri) {
    if (kosong(d.korbanKontak)) tambah("korbanKontak", "Nomor HP/WhatsApp wajib diisi agar petugas dapat menghubungi Anda.");
    else if (!POLA_HP.test(d.korbanKontak)) tambah("korbanKontak", "Nomor HP tidak valid. Contoh: 0812 3456 7890.");
  } else if (!kosong(d.korbanKontak) && !POLA_HP.test(d.korbanKontak)) {
    tambah("korbanKontak", "Nomor HP tidak valid. Contoh: 0812 3456 7890.");
  }
  if (kosong(d.korbanAlamat)) tambah("korbanAlamat", "Alamat lengkap korban wajib diisi.");
  else if (d.korbanAlamat.length < 5) tambah("korbanAlamat", "Alamat terlalu pendek.");
  if (kosong(d.korbanKecamatanId)) tambah("korbanKecamatanId", "Pilih kecamatan tempat tinggal korban.");

  // Langkah 3: Kejadian
  if (kosong(d.jenisKekerasanId)) tambah("jenisKekerasanId", "Pilih jenis kekerasan.");
  if (kosong(d.tanggalKejadian)) tambah("tanggalKejadian", "Tanggal kejadian wajib diisi. Jika tidak ingat pasti, pilih perkiraan.");
  else if (!tanggalValid(d.tanggalKejadian)) tambah("tanggalKejadian", "Tanggal tidak valid.");
  else if (!tidakDiMasaDepan(d.tanggalKejadian)) tambah("tanggalKejadian", "Tanggal tidak boleh di masa depan.");
  if (kosong(d.kronologi)) tambah("kronologi", "Kronologi wajib diisi.");
  else if (d.kronologi.length < 10) tambah("kronologi", "Kronologi wajib diisi. Ceritakan sebisanya (minimal 10 huruf).");
  if (kosong(d.asalRujukanId)) tambah("asalRujukanId", `Pilih asal rujukan, atau "${LABEL_ASAL_LANGSUNG}" bila tidak dirujuk.`);
  else if (d.asalRujukanId !== ASAL_LANGSUNG && kosong(d.lembagaRujukan)) tambah("lembagaRujukan", "Tulis nama lembaga atau pihak yang merujuk Anda.");

  // Langkah 4: Terlapor (semua opsional; dilewati bila belum diketahui)
  if (d.terlaporTidakDiketahui !== "on") {
    if (!kosong(d.terlaporJenisKelamin) && !JK.has(d.terlaporJenisKelamin)) tambah("terlaporJenisKelamin", "Pilihan tidak dikenal.");
    if (!kosong(d.terlaporUsia) && (!/^\d{1,3}$/.test(d.terlaporUsia) || Number(d.terlaporUsia) > 120)) tambah("terlaporUsia", "Usia harus angka 0-120.");
  }

  // Langkah 5
  if (d.persetujuan !== "on") tambah("persetujuan", "Centang persetujuan untuk mengirim laporan.");
});

export type FormLaporan = z.infer<typeof SkemaLaporan>;

/** Ambil pesan galat pertama per bidang dari hasil parse zod. */
export function galatPerBidang(error: z.ZodError): Galat {
  const hasil: Galat = {};
  for (const isu of error.issues) {
    const kunci = String(isu.path[0]) as NamaBidang;
    if (!(kunci in hasil)) hasil[kunci] = isu.message;
  }
  return hasil;
}

/** Galat yang relevan sampai langkah `n` (pemeriksaan di klien memeriksa langkah demi langkah). */
export function galatSampaiLangkah(galat: Galat, n: Langkah): Galat {
  const hasil: Galat = {};
  for (const [k, v] of Object.entries(galat)) if (langkahDariBidang(k) <= n) hasil[k as NamaBidang] = v;
  return hasil;
}

type JenisKelaminKode = (typeof OPSI_JENIS_KELAMIN)[number]["nilai"];
type StatusBpjsKode = (typeof OPSI_STATUS_BPJS)[number]["nilai"];

/** Data laporan yang sudah bersih dan terstruktur, siap disimpan. NIK sudah dibersihkan tetapi belum dienkripsi. */
export type DataLaporan = {
  pelaporAdalahKorban: boolean;
  pelapor: {
    nama: string;
    nik: string;
    hubunganId: string;
    kontak: string;
    jenisKelamin: JenisKelaminKode;
    tempatLahir: string;
    tanggalLahir: string;
    pekerjaanId: string;
    pendidikan: string;
    agamaId: string;
    statusPerkawinan: string;
    alamat: string | null;
    kecamatanId: string | null;
    desaId: string | null;
  } | null;
  korban: {
    nama: string;
    namaPanggilan: string | null;
    nik: string;
    jenisKelamin: JenisKelaminKode;
    tempatLahir: string | null;
    tanggalLahir: string;
    pendidikan: string | null;
    pekerjaanId: string | null;
    agamaId: string | null;
    statusPerkawinan: string | null;
    noBpjs: string | null;
    statusBpjs: StatusBpjsKode | null;
    kontak: string | null;
    alamat: string;
    kecamatanId: string;
    desaId: string | null;
  };
  jenisKekerasanId: string;
  tanggalKejadian: string;
  tempatKejadian: string | null;
  kronologi: string;
  /** Satu jenis pendampingan yang diminta Pelapor; null bila diserahkan kepada petugas. */
  jenisPendampinganId: string | null;
  /** Dirujuk dari mana; null bila datang/lapor langsung. */
  asalRujukanId: string | null;
  /** Lembaga/pihak yang merujuk dan alasannya; null bila datang langsung. */
  lembagaRujukan: string | null;
  alasanRujukan: string | null;
  terlapor: { nama: string | null; jenisKelamin: JenisKelaminKode | null; usia: number | null; hubunganId: string | null; alamat: string | null } | null;
};

const atau = (v: string) => (v === "" ? null : v);

/** Mengubah isian formulir yang sudah lolos SkemaLaporan menjadi DataLaporan. */
export function bentukDataLaporan(d: FormLaporan): DataLaporan {
  const sendiri = d.pelaporAdalahKorban === "on";
  const langsung = d.asalRujukanId === ASAL_LANGSUNG || d.asalRujukanId === "";
  const adaTerlapor =
    d.terlaporTidakDiketahui !== "on" &&
    [d.terlaporNama, d.terlaporJenisKelamin, d.terlaporUsia, d.terlaporHubunganId, d.terlaporAlamat].some((v) => v !== "");
  return {
    pelaporAdalahKorban: sendiri,
    pelapor: sendiri
      ? null
      : {
          nama: d.pelaporNama,
          nik: bersihkanNik(d.pelaporNik),
          hubunganId: d.pelaporHubunganId,
          kontak: d.pelaporKontak,
          jenisKelamin: d.pelaporJenisKelamin as JenisKelaminKode,
          tempatLahir: d.pelaporTempatLahir,
          tanggalLahir: d.pelaporTanggalLahir,
          pekerjaanId: d.pelaporPekerjaanId,
          pendidikan: d.pelaporPendidikan,
          agamaId: d.pelaporAgamaId,
          statusPerkawinan: d.pelaporStatusPerkawinan,
          alamat: atau(d.pelaporAlamat),
          kecamatanId: atau(d.pelaporKecamatanId),
          desaId: atau(d.pelaporDesaId),
        },
    korban: {
      nama: d.korbanNama,
      namaPanggilan: atau(d.korbanNamaPanggilan),
      nik: bersihkanNik(d.korbanNik),
      jenisKelamin: d.korbanJenisKelamin as JenisKelaminKode,
      tempatLahir: atau(d.korbanTempatLahir),
      tanggalLahir: d.korbanTanggalLahir,
      pendidikan: atau(d.korbanPendidikan),
      pekerjaanId: atau(d.korbanPekerjaanId),
      agamaId: atau(d.korbanAgamaId),
      statusPerkawinan: atau(d.korbanStatusPerkawinan),
      noBpjs: d.korbanNoBpjs === "" ? null : bersihkanNoBpjs(d.korbanNoBpjs),
      statusBpjs: atau(d.korbanStatusBpjs) as StatusBpjsKode | null,
      kontak: atau(d.korbanKontak),
      alamat: d.korbanAlamat,
      kecamatanId: d.korbanKecamatanId,
      desaId: atau(d.korbanDesaId),
    },
    jenisKekerasanId: d.jenisKekerasanId,
    tanggalKejadian: d.tanggalKejadian,
    tempatKejadian: atau(d.tempatKejadian),
    kronologi: d.kronologi,
    // Tidak wajib: Pelapor yang belum tahu menyerahkannya kepada petugas.
    jenisPendampinganId: atau(d.jenisPendampinganId),
    // "Datang langsung" disimpan sebagai asal rujukan kosong; lembaga dan alasannya diabaikan.
    asalRujukanId: langsung ? null : atau(d.asalRujukanId),
    lembagaRujukan: langsung ? null : atau(d.lembagaRujukan),
    alasanRujukan: langsung ? null : atau(d.alasanRujukan),
    terlapor: adaTerlapor
      ? {
          nama: atau(d.terlaporNama),
          jenisKelamin: atau(d.terlaporJenisKelamin) as JenisKelaminKode | null,
          usia: d.terlaporUsia === "" ? null : Number(d.terlaporUsia),
          hubunganId: atau(d.terlaporHubunganId),
          alamat: atau(d.terlaporAlamat),
        }
      : null,
  };
}
