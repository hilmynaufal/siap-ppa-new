import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BatangTunggal, BatangUsia, GarisKategori, PilihGrafik, TrenBulanan, bacaModeGrafik } from "@/components/grafik-statistik";
import { KopUptd } from "@/components/kop-uptd";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { bacaPengaturanBap } from "@/lib/pengaturan";
import { bacaPeriode, statistikKasus } from "@/lib/statistik";
import { judulLaporan, jumlahKecamatan } from "@/lib/statistik-ekspor";
import { TombolCetak } from "./tombol-cetak";
import "./statistik.css";

export const metadata = { title: "Laporan Kasus Bulanan | SIAP PPA" };
export const dynamic = "force-dynamic";

/** Laporan statistik siap cetak (format laporan KTP/KTA UPTD PPA). Hanya Admin (lihat akses.ts). */
export default async function CetakStatistik({ searchParams }: { searchParams: Promise<{ tahun?: string; bulan?: string; grafik?: string }> }) {
  await wajibPeran("ADMIN");
  const q = await searchParams;
  const periode = bacaPeriode(q);
  const garis = bacaModeGrafik(q.grafik) === "garis";
  const dasarParam = { tahun: String(periode.tahun), bulan: periode.bulan ? String(periode.bulan) : "semua" };
  const [s, ttd] = await Promise.all([statistikKasus(db, periode), bacaPengaturanBap(db)]);
  const j = judulLaporan(s);
  const k = jumlahKecamatan(s);
  const adaLain = k.lain > 0;
  const tanggal = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
  const kembali = `/admin/statistik?${new URLSearchParams({ ...dasarParam, grafik: garis ? "garis" : "batang" })}`;
  const bulanJudul = s.periode.label;

  return (
    <div className="lst-latar">
      <div className="lst-alat">
        <Link href={kembali} className="inline-flex items-center gap-2 font-bold text-brand-800 underline">
          <ArrowLeft size={16} aria-hidden="true" />
          Kembali
        </Link>
        <p>Kolom Keterangan pada tabel jenis kasus dapat diketik langsung sebelum dicetak (tidak disimpan).</p>
        <PilihGrafik mode={garis ? "garis" : "batang"} dasar="/cetak/statistik" param={dasarParam} />
        <TombolCetak />
      </div>

      <article className="lst-kertas">
        <KopUptd />
        <h1 className="lst-judul">
          {j.utama}
          <br />
          {j.periode}
        </h1>

        <section className="lst-bagian">
          <h2>1. LAPORAN BERDASARKAN USIA KORBAN</h2>
          <table className="lst-tabel">
            <thead>
              <tr>
                <th scope="col">No</th>
                <th scope="col">Kelompok</th>
                <th scope="col">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {s.usia.map((u, i) => (
                <tr key={u.kunci}>
                  <td className="lst-no">{i + 1}</td>
                  <td>{u.label}</td>
                  <td className="lst-angka">{u.jumlah}</td>
                </tr>
              ))}
              <tr className="lst-jumlah">
                <td />
                <th scope="row">JUMLAH</th>
                <td className="lst-angka">{s.total}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="lst-bagian">
          <h2>2. LAPORAN PER KECAMATAN</h2>
          <table className="lst-tabel">
            <thead>
              <tr>
                <th scope="col" rowSpan={2}>No</th>
                <th scope="col" rowSpan={2}>Kecamatan</th>
                <th scope="colgroup" colSpan={2}>Laki-laki</th>
                <th scope="colgroup" colSpan={2}>Perempuan</th>
                {adaLain && <th scope="col" rowSpan={2}>Lainnya*</th>}
                <th scope="col" rowSpan={2}>Jumlah</th>
              </tr>
              <tr>
                <th scope="col">Anak</th>
                <th scope="col">Dewasa</th>
                <th scope="col">Anak</th>
                <th scope="col">Dewasa</th>
              </tr>
            </thead>
            <tbody>
              {s.kecamatan.length === 0 && (
                <tr>
                  <td colSpan={adaLain ? 8 : 7} className="lst-angka">
                    Tidak ada kasus.
                  </td>
                </tr>
              )}
              {s.kecamatan.map((r, i) => (
                <tr key={r.nama}>
                  <td className="lst-no">{i + 1}</td>
                  <td>{r.nama}</td>
                  <td className="lst-angka">{r.anakL}</td>
                  <td className="lst-angka">{r.dewasaL}</td>
                  <td className="lst-angka">{r.anakP}</td>
                  <td className="lst-angka">{r.dewasaP}</td>
                  {adaLain && <td className="lst-angka">{r.lain}</td>}
                  <td className="lst-angka">{r.jumlah}</td>
                </tr>
              ))}
              <tr className="lst-jumlah">
                <td />
                <th scope="row">JUMLAH</th>
                <td className="lst-angka">{k.anakL}</td>
                <td className="lst-angka">{k.dewasaL}</td>
                <td className="lst-angka">{k.anakP}</td>
                <td className="lst-angka">{k.dewasaP}</td>
                {adaLain && <td className="lst-angka">{k.lain}</td>}
                <td className="lst-angka">{s.total}</td>
              </tr>
            </tbody>
          </table>
          {adaLain && <p className="lst-catatan">* Jenis kelamin lainnya/tidak diisi, atau usia tidak diketahui.</p>}
        </section>

        <section className="lst-bagian">
          <h2>3. LAPORAN BERDASARKAN JENIS KASUS</h2>
          <table className="lst-tabel">
            <thead>
              <tr>
                <th scope="col">No</th>
                <th scope="col">Jenis kasus</th>
                <th scope="col">Anak</th>
                <th scope="col">Dewasa</th>
                <th scope="col">Jumlah</th>
                <th scope="col">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {s.jenis.map((r, i) => (
                <tr key={r.nama}>
                  <td className="lst-no">{i + 1}</td>
                  <td>{r.nama}</td>
                  <td className="lst-angka">{r.anak}</td>
                  <td className="lst-angka">{r.dewasa}</td>
                  <td className="lst-angka">{r.jumlah}</td>
                  <td className="lst-ket" contentEditable suppressContentEditableWarning aria-label={`Keterangan ${r.nama}`} />
                </tr>
              ))}
              <tr className="lst-jumlah">
                <td />
                <th scope="row">TOTAL KESELURUHAN</th>
                <td className="lst-angka">{s.jenis.reduce((a, r) => a + r.anak, 0)}</td>
                <td className="lst-angka">{s.jenis.reduce((a, r) => a + r.dewasa, 0)}</td>
                <td className="lst-angka">{s.total}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </section>

        <section className="lst-bagian">
          <h2>4. GRAFIK KORBAN BERDASARKAN USIA</h2>
          <p className="lst-sub">{bulanJudul}</p>
          <div className="lst-grafik">
            {garis ? (
              <GarisKategori data={s.usia.map((u) => ({ nama: u.pendek, jumlah: u.jumlah }))} label="Grafik korban berdasarkan usia" />
            ) : (
              <BatangTunggal data={s.usia.map((u) => ({ nama: u.label, jumlah: u.jumlah }))} total={s.total} />
            )}
          </div>
        </section>

        <section className="lst-bagian">
          <h2>5. GRAFIK KORBAN PER KECAMATAN</h2>
          <p className="lst-sub">{bulanJudul}</p>
          <div className="lst-grafik">
            {garis ? (
              <GarisKategori data={s.kecamatan} label="Grafik korban per kecamatan" />
            ) : (
              <BatangUsia data={s.kecamatan.map((k) => ({ nama: k.nama, jumlah: k.jumlah, anak: k.anakL + k.anakP, dewasa: k.dewasaL + k.dewasaP, lain: k.lain }))} label="Korban per kecamatan" />
            )}
          </div>
        </section>

        <section className="lst-bagian">
          <h2>6. GRAFIK KORBAN BERDASARKAN JENIS KASUS</h2>
          <p className="lst-sub">{bulanJudul}</p>
          <div className="lst-grafik">
            {garis ? <GarisKategori data={s.jenis} label="Grafik korban berdasarkan jenis kasus" /> : <BatangUsia data={s.jenis} label="Korban per jenis kasus" />}
          </div>
        </section>

        <section className="lst-bagian">
          <h2>7. GRAFIK KORBAN PER BULAN ({s.tren[0].label} - {s.tren[s.tren.length - 1].label})</h2>
          <div className="lst-grafik">
            <TrenBulanan data={s.tren} sorot={s.periode.bulan ? s.periode.kunci : undefined} />
          </div>
        </section>

        <p className="lst-catatan">
          Dihitung menurut bulan laporan masuk dari laporan terverifikasi, dalam pendampingan, dan ditutup. Anak: usia di bawah 18 tahun pada tanggal kejadian.
        </p>

        <div className="lst-ttd">
          <p>Soreang, {tanggal}</p>
          <p>Kepala UPTD PPA</p>
          <div className="lst-ttd-ruang" />
          <p className="lst-garis">{ttd.kepalaUptdNama || "...................................."}</p>
          <p>NIP. {ttd.kepalaUptdNip || "...................................."}</p>
        </div>
      </article>
    </div>
  );
}
