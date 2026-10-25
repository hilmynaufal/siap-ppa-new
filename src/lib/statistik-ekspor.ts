import type { StatistikKasus } from "./statistik";
import { buatXlsxLaporan, type SelExcel } from "./xlsx";

/** Judul laporan bulanan sesuai format UPTD PPA. */
export function judulLaporan(s: Pick<StatistikKasus, "periode">) {
  return {
    utama: "LAPORAN KASUS KTP/KTA DI KABUPATEN BANDUNG",
    periode: s.periode.bulan ? `BULAN ${s.periode.label.toUpperCase().replace(" ", " TAHUN ")}` : s.periode.label.toUpperCase(),
  };
}

/** Jumlah per kolom tabel kecamatan (baris JUMLAH). */
export function jumlahKecamatan(s: Pick<StatistikKasus, "kecamatan">) {
  return s.kecamatan.reduce(
    (a, k) => ({ anakL: a.anakL + k.anakL, dewasaL: a.dewasaL + k.dewasaL, anakP: a.anakP + k.anakP, dewasaP: a.dewasaP + k.dewasaP, lain: a.lain + k.lain }),
    { anakL: 0, dewasaL: 0, anakP: 0, dewasaP: 0, lain: 0 },
  );
}

/**
 * Laporan bulanan sebagai satu lembar Excel: tiga tabel format resmi (usia, kecamatan, jenis kasus) ditambah tren 12 bulan.
 * Angkanya sama dengan halaman statistik dan halaman cetak karena berasal dari data yang sama.
 */
export function statistikXlsx(s: StatistikKasus, dibuat: string): Uint8Array {
  const baris: SelExcel[][] = [];
  const tebal: number[] = [];
  const tulis = (b: SelExcel[], t = false) => {
    if (t) tebal.push(baris.length);
    baris.push(b);
  };
  const j = judulLaporan(s);
  tulis([j.utama], true);
  tulis([j.periode], true);
  tulis(["UPTD Perlindungan Perempuan dan Anak, DP2KBP3A Kabupaten Bandung"]);
  tulis([]);

  tulis(["1. LAPORAN BERDASARKAN USIA KORBAN"], true);
  tulis(["No", "Kelompok", "Jumlah"], true);
  s.usia.forEach((u, i) => tulis([i + 1, u.label, u.jumlah]));
  tulis(["", "JUMLAH", s.total], true);
  tulis([]);

  const k = jumlahKecamatan(s);
  const adaLain = k.lain > 0;
  tulis(["2. LAPORAN PER KECAMATAN"], true);
  tulis(["No", "Kecamatan", "Laki-laki anak", "Laki-laki dewasa", "Perempuan anak", "Perempuan dewasa", ...(adaLain ? ["Lainnya*"] : []), "Jumlah"], true);
  s.kecamatan.forEach((r, i) => tulis([i + 1, r.nama, r.anakL, r.dewasaL, r.anakP, r.dewasaP, ...(adaLain ? [r.lain] : []), r.jumlah]));
  tulis(["", "JUMLAH", k.anakL, k.dewasaL, k.anakP, k.dewasaP, ...(adaLain ? [k.lain] : []), s.total], true);
  if (adaLain) tulis(["", "* Jenis kelamin lainnya/tidak diisi, atau usia tidak diketahui."]);
  tulis([]);

  tulis(["3. LAPORAN BERDASARKAN JENIS KASUS"], true);
  tulis(["No", "Jenis kasus", "Anak", "Dewasa", "Jumlah", "Keterangan"], true);
  s.jenis.forEach((r, i) => tulis([i + 1, r.nama, r.anak, r.dewasa, r.jumlah, ""]));
  tulis(["", "TOTAL KESELURUHAN", s.jenis.reduce((a, r) => a + r.anak, 0), s.jenis.reduce((a, r) => a + r.dewasa, 0), s.total], true);
  tulis([]);

  tulis(["4. TREN KORBAN 12 BULAN"], true);
  tulis(["No", "Bulan", "Anak", "Dewasa", "Usia tidak diketahui", "Jumlah"], true);
  s.tren.forEach((t, i) => tulis([i + 1, t.label, t.anak, t.dewasa, t.lain, t.anak + t.dewasa + t.lain]));
  tulis([]);

  tulis(["", "Dihitung menurut bulan laporan masuk dari laporan terverifikasi, dalam pendampingan, dan ditutup. Anak: usia di bawah 18 tahun pada tanggal kejadian."]);
  tulis(["", `Dibuat dari SIAP PPA pada ${dibuat}.`]);

  return buatXlsxLaporan("Laporan", baris, { lebar: [6, 42, 14, 16, 16, 18, 14, 12], tebal });
}
