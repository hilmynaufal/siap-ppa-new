import "./kop-uptd.css";

/** Kop surat Pemerintah Kabupaten Bandung / DP2KBP3A / UPTD PPA, untuk dokumen cetak. */
export function KopUptd() {
  return (
    <header className="bap-kop">
      {/* eslint-disable-next-line @next/next/no-img-element -- dicetak apa adanya, tanpa optimasi gambar */}
      <img src="/brand/logo-kabupaten-bandung.jpg" alt="Lambang Kabupaten Bandung" className="bap-logo" />
      <div className="bap-kop-teks">
        <p className="bap-kop-1">PEMERINTAH KABUPATEN BANDUNG</p>
        <p className="bap-kop-2">DINAS PENGENDALIAN PENDUDUK, KELUARGA BERENCANA,</p>
        <p className="bap-kop-2">PEMBERDAYAAN PEREMPUAN DAN PERLINDUNGAN ANAK</p>
        <p className="bap-kop-3">UPTD PERLINDUNGAN PEREMPUAN DAN ANAK</p>
        <p className="bap-kop-4">Jl. Raya Soreang KM. 17 Telp. (022) 5897180 Soreang 40911</p>
        <p className="bap-kop-4">Kabupaten Bandung Provinsi Jawa Barat</p>
      </div>
    </header>
  );
}
