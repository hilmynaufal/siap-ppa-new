import { CalendarClock, CalendarPlus, ClipboardX, Inbox, LayoutDashboard, Ticket, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { DonatLayanan } from "@/components/donat-layanan";
import { GrafikBatang } from "@/components/grafik-batang";
import { IkonKotak } from "@/components/ikon-kotak";
import { LencanaLaporan } from "@/components/lencana-laporan";
import { LencanaSesi } from "@/components/lencana-sesi";
import { db } from "@/lib/db";
import { ringkasanDasbor } from "@/lib/dasbor";

export const metadata = { title: "Dasbor | SIAP PPA" };
export const dynamic = "force-dynamic";

const ZONA = "Asia/Jakarta";
const masuk = (iso: string) => new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: ZONA });
const tanggalPanjang = (tgl: string) => new Date(`${tgl}T00:00:00+07:00`).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: ZONA });

const FOKUS = "focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100";

function Kartu({ titik, judul, nilai, ket, href }: { titik: string; judul: string; nilai: number; ket: string; href: string }) {
  return (
    <Link href={href} className={`rounded-2xl border border-line bg-surface p-5 shadow-card transition-transform hover:-translate-y-0.5 ${FOKUS}`}>
      <p className="flex items-center gap-2 font-semibold text-ink">
        <span aria-hidden="true" className={`h-3 w-3 rounded-full ${titik}`} />
        {judul}
      </p>
      <p className="mt-2 text-4xl font-extrabold tabular-nums text-navy-900" data-testid={`kartu-${judul.toLowerCase().replace(/\s+/g, "-")}`}>
        {nilai}
      </p>
      <p className="mt-1 text-sm text-ink-soft">{ket}</p>
    </Link>
  );
}

function Tindakan({ ikon: Ikon, warna, judul, jumlah, href, nol }: { ikon: LucideIcon; warna: string; judul: string; jumlah: number; href: string | null; nol: string }) {
  const isi = (
    <>
      <span aria-hidden="true" className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${warna}`}>
        <Ikon size={20} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink-soft">{judul}</span>
        <span className="block text-lg font-extrabold tabular-nums text-navy-900">{jumlah > 0 ? jumlah : nol}</span>
      </span>
    </>
  );
  const kelas = `flex items-center gap-3 rounded-xl border border-line bg-surface p-4 ${jumlah > 0 && href ? `hover:bg-blue-50 ${FOKUS}` : "opacity-75"}`;
  return jumlah > 0 && href ? (
    <Link href={href} className={kelas}>
      {isi}
    </Link>
  ) : (
    <div className={kelas}>{isi}</div>
  );
}

function Panel({ id, judul, aksi, ket, children, kelas = "" }: { id: string; judul: string; aksi?: React.ReactNode; ket?: string; children: React.ReactNode; kelas?: string }) {
  return (
    <section aria-labelledby={id} className={`rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6 ${kelas}`}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={id} className="text-lg font-bold text-navy-900">
          {judul}
        </h2>
        {aksi ?? (ket && <span className="text-sm text-ink-soft">{ket}</span>)}
      </div>
      {children}
    </section>
  );
}

export default async function Dasbor() {
  const r = await ringkasanDasbor(db);
  const k = r.kartu;
  const t = r.tindakan;
  const periode = `${r.periodeHari} hari terakhir`;

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex items-center gap-4">
        <IkonKotak ikon={LayoutDashboard} warna="blue" ukuran="lg" />
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Dasbor</h1>
          <p className="mt-0.5 text-sm text-ink-soft">Ringkasan layanan, {periode}.</p>
        </div>
      </div>

      <section aria-label="Ringkasan angka" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kartu titik="bg-blue-600" judul="Baru" nilai={k.baru} ket="Menunggu verifikasi" href="/admin/laporan" />
        <Kartu titik="bg-green-500" judul="Terverifikasi" nilai={k.terverifikasi} ket={periode} href="/admin/laporan" />
        <Kartu titik="bg-error" judul="Ditolak" nilai={k.ditolak} ket={periode} href="/admin/laporan" />
        <Kartu titik="bg-violet-500" judul="Total laporan" nilai={k.total} ket={periode} href="/admin/laporan" />
      </section>

      <section aria-labelledby="h-tindakan" className="mt-4">
        <h2 id="h-tindakan" className="sr-only">
          Perlu tindakan
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Tindakan ikon={CalendarPlus} warna="bg-amber-400/25 text-warning" judul="Usulan sesi lanjutan menunggu" jumlah={t.usulan} href={t.usulanLaporanId ? `/admin/laporan/${t.usulanLaporanId}` : null} nol="Tidak ada" />
          <Tindakan ikon={ClipboardX} warna="bg-coral-500/15 text-error" judul="Sesi selesai belum ada laporan" jumlah={t.belumLapor} href={t.belumLaporLaporanId ? `/admin/laporan/${t.belumLaporLaporanId}` : null} nol="Tidak ada" />
          <Tindakan ikon={Ticket} warna="bg-teal-500/15 text-teal-700" judul="Sesi hari ini" jumlah={t.sesiHariIni} href="/admin/antrean" nol="Tidak ada" />
        </div>
      </section>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1fr_24rem]">
        <Panel id="h-grafik" judul="Pengaduan per status" ket={`${r.grafik[0].label} sampai ${r.grafik[r.grafik.length - 1].label}`}>
          <GrafikBatang data={r.grafik} />
        </Panel>
        <Panel id="h-donat" judul="Jenis layanan" ket={periode}>
          <DonatLayanan data={r.donat} total={r.totalDonat} />
        </Panel>

        <Panel id="h-terbaru" judul="Laporan terbaru" aksi={<Link href="/admin/laporan" className={`rounded font-bold text-blue-600 underline ${FOKUS}`}>Lihat semua laporan</Link>}>
          {r.terbaru.length === 0 ? (
            <p className="flex items-start gap-3 rounded-xl border border-dashed border-line-strong p-4 text-sm text-ink-soft">
              <Inbox size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
              Belum ada laporan masuk.
            </p>
          ) : (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left">
                <thead className="text-sm font-bold text-ink-soft">
                  <tr>
                    <th scope="col" className="px-2 py-2">Kode</th>
                    <th scope="col" className="px-2 py-2">Masuk</th>
                    <th scope="col" className="px-2 py-2">Jenis</th>
                    <th scope="col" className="px-2 py-2">Kecamatan</th>
                    <th scope="col" className="px-2 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {r.terbaru.map((l) => (
                    <tr key={l.id}>
                      <td className="px-2 py-3 font-bold tabular-nums text-navy-900">
                        <Link href={`/admin/laporan/${l.id}`} className={`rounded underline-offset-2 hover:underline ${FOKUS}`}>
                          {l.kode}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 tabular-nums text-ink-soft">{masuk(l.masuk)}</td>
                      <td className="px-2 py-3">{l.jenis}</td>
                      <td className="px-2 py-3">{l.kecamatan ?? "-"}</td>
                      <td className="px-2 py-3">
                        <LencanaLaporan status={l.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel id="h-jadwal" judul="Jadwal hari ini" ket={tanggalPanjang(r.tanggal)}>
          {r.jadwal.length === 0 ? (
            <p className="flex items-start gap-3 rounded-xl border border-dashed border-line-strong p-4 text-sm text-ink-soft">
              <CalendarClock size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
              Tidak ada sesi terjadwal hari ini.
            </p>
          ) : (
            <ul className="-mx-1 flex max-h-[26rem] flex-col divide-y divide-line-soft overflow-y-auto">
              {r.jadwal.map((j, i) => (
                <li key={`${j.nomorAntrean}-${i}`} className="flex gap-4 px-1 py-3">
                  <p className="w-14 shrink-0 text-lg font-extrabold tabular-nums text-navy-900">
                    {j.jam}
                    <span className="block text-xs font-medium text-ink-mute">WIB</span>
                  </p>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink">
                      <span className="tabular-nums">{j.nomorAntrean}</span> · {j.jenis}
                    </p>
                    <p className="text-sm text-ink-soft">{j.pendamping}</p>
                    <p className="text-sm text-ink-soft">{j.lokasi}</p>
                    <div className="mt-1">
                      <LencanaSesi status={j.status} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </main>
  );
}
