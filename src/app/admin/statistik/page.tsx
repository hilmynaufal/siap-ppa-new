import { Baby, ChartColumn, Clock, Download, Printer, UsersRound, Venus } from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { BatangTunggal, BatangUsia, GarisKategori, PilihGrafik, TrenBulanan, bacaModeGrafik } from "@/components/grafik-statistik";
import { IkonKotak } from "@/components/ikon-kotak";
import { StripKpi } from "@/components/strip-kpi";
import { fokus, tombolUtama } from "@/components/ui-form";
import { db } from "@/lib/db";
import { NAMA_BULAN, TANPA_KECAMATAN, USIA_DEWASA, bacaPeriode, pilihanTahun, statistikKasus } from "@/lib/statistik";
import { jumlahKecamatan } from "@/lib/statistik-ekspor";

export const metadata = { title: "Laporan & Statistik | SIAP PPA" };
export const dynamic = "force-dynamic";

const LABEL_STATUS = { TERVERIFIKASI: "Terverifikasi", DALAM_PENDAMPINGAN: "Dalam pendampingan", DITUTUP: "Ditutup" } as const;
const persen = (n: number, t: number) => (t ? `${Math.round((n / t) * 100)}%` : "0%");
const hari = (n: number | null) => (n === null ? "-" : n < 1 ? `${Math.round(n * 24)} jam` : `${n.toLocaleString("id-ID")} hari`);
const pilih = "h-11 rounded-xl border border-line-strong bg-surface px-3 text-base text-ink focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100";

function Panel({ id, judul, ket, children, kelas = "" }: { id: string; judul: string; ket?: string; children: React.ReactNode; kelas?: string }) {
  return (
    <section aria-labelledby={id} className={`min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6 ${kelas}`}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={id} className="text-lg font-bold text-brand-900">
          {judul}
        </h2>
        {ket && <span className="text-sm text-ink-soft">{ket}</span>}
      </div>
      {children}
    </section>
  );
}

const th = "px-2 py-2 text-right font-bold";
const td = "px-2 py-2.5 text-right tabular-nums";

export default async function HalamanStatistik({ searchParams }: { searchParams: Promise<{ tahun?: string; bulan?: string; grafik?: string }> }) {
  const q = await searchParams;
  const periode = bacaPeriode(q);
  const mode = bacaModeGrafik(q.grafik);
  const garis = mode === "garis";
  const s = await statistikKasus(db, periode);
  const dasarParam = { tahun: String(periode.tahun), bulan: periode.bulan ? String(periode.bulan) : "semua" };
  const param = new URLSearchParams(dasarParam);
  const paramCetak = new URLSearchParams({ ...dasarParam, grafik: mode });
  const selisih = s.total - s.sebelumnya.jumlah;
  const jumlahKec = jumlahKecamatan(s);
  const adaLain = jumlahKec.lain > 0;
  const kecUrut = [...s.kecamatan].sort((a, b) => b.jumlah - a.jumlah || a.nama.localeCompare(b.nama));

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb remah={[{ label: "Beranda", href: "/admin" }, { label: "Laporan & statistik" }]} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <IkonKotak ikon={ChartColumn} warna="violet" ukuran="lg" />
          <div>
            <h1 className="text-2xl font-extrabold text-brand-900">Laporan & statistik</h1>
            <p className="mt-0.5 text-sm text-ink-soft">Kasus kekerasan terhadap perempuan dan anak, {s.periode.label}.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/cetak/statistik?${paramCetak}`} target="_blank" rel="noopener" className={tombolUtama}>
            <Printer size={18} aria-hidden="true" />
            Cetak laporan
          </a>
          <a
            href={`/admin/statistik/ekspor?${param}`}
            className={`inline-flex h-12 items-center gap-2 rounded-xl border border-line-strong bg-surface px-5 font-bold text-brand-800 transition-colors hover:bg-brand-50 ${fokus}`}
          >
            <Download size={18} aria-hidden="true" />
            Unduh Excel
          </a>
        </div>
      </div>

      <form method="get" className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink-soft">
          Bulan
          <select name="bulan" defaultValue={periode.bulan ? String(periode.bulan) : "semua"} className={pilih}>
            <option value="semua">Setahun penuh</option>
            {NAMA_BULAN.map((b, i) => (
              <option key={b} value={i + 1}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink-soft">
          Tahun
          <select name="tahun" defaultValue={String(periode.tahun)} className={pilih}>
            {pilihanTahun().map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <input type="hidden" name="grafik" value={mode} />
        <button type="submit" className={`h-11 rounded-xl bg-brand-600 px-5 font-bold text-white hover:bg-brand-700 ${fokus}`}>
          Tampilkan
        </button>
        <p className="basis-full text-sm text-ink-mute md:ml-auto md:basis-auto md:max-w-md">
          Menurut bulan laporan masuk. Dihitung: laporan terverifikasi, dalam pendampingan, dan ditutup. Laporan baru, ditolak, dan di Sampah tidak dihitung.
        </p>
      </form>

      <StripKpi
        judul="Ringkasan periode"
        item={[
          {
            label: "Korban",
            nilai: s.total,
            keterangan: `${selisih === 0 ? "Sama dengan" : selisih > 0 ? `+${selisih} dari` : `${selisih} dari`} ${s.sebelumnya.label} (${s.sebelumnya.jumlah})`,
            ikon: UsersRound,
            warna: "blue",
          },
          { label: "Anak", nilai: s.anak, keterangan: `${persen(s.anak, s.total)} korban berusia di bawah ${USIA_DEWASA} tahun`, ikon: Baby, warna: "sky" },
          { label: "Perempuan", nilai: s.perempuan, keterangan: `${persen(s.perempuan, s.total)} dari seluruh korban`, ikon: Venus, warna: "coral" },
          {
            label: "Rata-rata waktu verifikasi",
            nilai: hari(s.rataHariVerifikasi),
            keterangan: `Sampai sesi pertama: ${hari(s.rataHariSesi)}`,
            ikon: Clock,
            warna: "amber",
          },
        ]}
      />

      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        <span className="text-sm font-semibold text-ink-soft">Tampilan grafik</span>
        <PilihGrafik mode={mode} dasar="/admin/statistik" param={dasarParam} />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Panel id="h-tren" judul="Tren korban per bulan" ket={`${s.tren[0].label} sampai ${s.tren[s.tren.length - 1].label}`} kelas="xl:col-span-2">
          <TrenBulanan data={s.tren} sorot={s.periode.bulan ? s.periode.kunci : undefined} />
        </Panel>

        <Panel id="h-usia" judul="1. Berdasarkan usia korban" ket="Usia pada tanggal kejadian">
          <div className="mb-4">
            {garis ? (
              <GarisKategori data={s.usia.map((u) => ({ nama: u.pendek, jumlah: u.jumlah }))} label="Grafik korban berdasarkan usia" />
            ) : (
              <BatangTunggal data={s.usia.map((u) => ({ nama: u.label, jumlah: u.jumlah }))} total={s.total} />
            )}
          </div>
          <table className="w-full text-left">
            <thead className="text-sm text-ink-soft">
              <tr className="border-b border-line">
                <th scope="col" className="px-2 py-2 font-bold">Kelompok</th>
                <th scope="col" className={th}>Jumlah</th>
                <th scope="col" className={th}>Persen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {s.usia.map((u) => (
                <tr key={u.kunci}>
                  <th scope="row" className="px-2 py-2.5 font-semibold text-ink">{u.label}</th>
                  <td className={td}>{u.jumlah}</td>
                  <td className={`${td} text-ink-soft`}>{persen(u.jumlah, s.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-line font-extrabold text-brand-900">
                <th scope="row" className="px-2 py-2.5">Jumlah</th>
                <td className={td}>{s.total}</td>
                <td className={td}>{s.total ? "100%" : "0%"}</td>
              </tr>
            </tfoot>
          </table>
          <div className="mt-5 border-t border-line-soft pt-4">
            <h3 className="mb-3 text-sm font-bold text-ink-soft">Status penanganan</h3>
            <BatangTunggal data={s.status.map((x) => ({ nama: LABEL_STATUS[x.status as keyof typeof LABEL_STATUS], jumlah: x.jumlah }))} total={s.total} warna="#1e9e5a" />
          </div>
        </Panel>

        <Panel id="h-jenis" judul="3. Berdasarkan jenis kasus" ket="Dari master Jenis Kekerasan">
          {garis ? <GarisKategori data={s.jenis} label="Grafik korban berdasarkan jenis kasus" /> : <BatangUsia data={s.jenis} label="Korban per jenis kasus" />}
        </Panel>

        <Panel id="h-kec" judul="2. Per kecamatan" ket={`${s.kecamatan.filter((k) => k.nama !== TANPA_KECAMATAN).length} kecamatan dengan kasus`} kelas="xl:col-span-2">
          <div className={garis ? "grid gap-6" : "grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"}>
            {garis ? (
              <GarisKategori data={s.kecamatan} label="Grafik korban per kecamatan" />
            ) : (
              <BatangUsia data={kecUrut.map((k) => ({ nama: k.nama, jumlah: k.jumlah, anak: k.anakL + k.anakP, dewasa: k.dewasaL + k.dewasaP, lain: k.lain }))} label="Korban per kecamatan" />
            )}
            {s.kecamatan.length > 0 && (
              <div className="-mx-2 overflow-x-auto">
                <table className="w-full min-w-[30rem] text-left text-sm">
                  <thead className="text-ink-soft">
                    <tr>
                      <th scope="col" rowSpan={2} className="px-2 py-2 align-bottom font-bold">Kecamatan</th>
                      <th scope="colgroup" colSpan={2} className="border-b border-line px-2 py-1 text-center font-bold">Laki-laki</th>
                      <th scope="colgroup" colSpan={2} className="border-b border-line px-2 py-1 text-center font-bold">Perempuan</th>
                      {adaLain && <th scope="col" rowSpan={2} className={`${th} align-bottom`}>Lainnya*</th>}
                      <th scope="col" rowSpan={2} className={`${th} align-bottom`}>Jumlah</th>
                    </tr>
                    <tr className="border-b border-line">
                      <th scope="col" className={th}>Anak</th>
                      <th scope="col" className={th}>Dewasa</th>
                      <th scope="col" className={th}>Anak</th>
                      <th scope="col" className={th}>Dewasa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft">
                    {s.kecamatan.map((k) => (
                      <tr key={k.nama}>
                        <th scope="row" className="px-2 py-2.5 font-semibold text-ink">{k.nama}</th>
                        <td className={td}>{k.anakL}</td>
                        <td className={td}>{k.dewasaL}</td>
                        <td className={td}>{k.anakP}</td>
                        <td className={td}>{k.dewasaP}</td>
                        {adaLain && <td className={td}>{k.lain}</td>}
                        <td className={`${td} font-bold`}>{k.jumlah}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-line font-extrabold text-brand-900">
                      <th scope="row" className="px-2 py-2.5">Jumlah</th>
                      <td className={td}>{jumlahKec.anakL}</td>
                      <td className={td}>{jumlahKec.dewasaL}</td>
                      <td className={td}>{jumlahKec.anakP}</td>
                      <td className={td}>{jumlahKec.dewasaP}</td>
                      {adaLain && <td className={td}>{jumlahKec.lain}</td>}
                      <td className={td}>{s.total}</td>
                    </tr>
                  </tfoot>
                </table>
                {adaLain && <p className="mt-2 px-2 text-xs text-ink-mute">* Jenis kelamin lainnya/tidak diisi, atau usia tidak diketahui.</p>}
              </div>
            )}
          </div>
        </Panel>

        <div className="grid gap-6 md:grid-cols-3 xl:col-span-2">
          <Panel id="h-hub" judul="Hubungan pelaku dengan korban">
            <BatangTunggal data={s.hubungan} total={s.total} />
          </Panel>
          <Panel id="h-rujukan" judul="Asal rujukan">
            <BatangTunggal data={s.rujukan} total={s.total} />
          </Panel>
          <Panel id="h-layanan" judul="Pendampingan yang diminta">
            <BatangTunggal data={s.pendampingan} total={s.total} />
          </Panel>
        </div>
      </div>
    </main>
  );
}
