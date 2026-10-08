import { ArrowLeft, CalendarClock, Info, MapPin, ShieldAlert, Ticket } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IkonKotak } from "@/components/ikon-kotak";
import { LencanaLaporan } from "@/components/lencana-laporan";
import { LencanaSesi } from "@/components/lencana-sesi";
import { TampilLaporan } from "@/components/tampil-laporan";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { OPSI_JENIS_KELAMIN } from "@/lib/laporan";
import { laporanKasus } from "@/lib/laporan-pendampingan";
import { ringkasanSesiPendamping } from "@/lib/sesi";
import { hariJakarta } from "@/lib/tiket";
import { AksiSesi } from "../../aksi-sesi";
import { PanelLaporanPendampingan } from "./laporan-pendampingan";

export const metadata = { title: "Ringkasan Kasus | SIAP PPA" };
export const dynamic = "force-dynamic";

const ZONA = "Asia/Jakarta";
const tglPanjang = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: ZONA });
const jam = (iso: string) => new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: ZONA }).replace(".", ":");
const tglPendek = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: ZONA });

function Baris({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-sm font-semibold text-ink-soft">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}

export default async function HalamanSesi({ params }: { params: Promise<{ id: string }> }) {
  const pengguna = await wajibPeran("PENDAMPING");
  const { id } = await params;
  // Hanya sesi yang ditugaskan kepada Pendamping ini; selain itu 404 (tidak membocorkan keberadaan sesi lain).
  const s = await ringkasanSesiPendamping(db, id, pengguna.id);
  if (!s) notFound();
  const [laporan, opsiJenis] = await Promise.all([
    laporanKasus(db, s.laporanId),
    db.jenisPendampingan.findMany({ where: { aktif: true }, orderBy: { nama: "asc" }, select: { id: true, nama: true } }),
  ]);
  const k = s.kasus;
  const jk = OPSI_JENIS_KELAMIN.find((o) => o.nilai === k.jenisKelamin)?.label ?? "Tidak diisi";
  const bisaMulai = s.status === "TERJADWAL" && hariJakarta(new Date(s.mulai)) <= hariJakarta(new Date());

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <Link href="/pendamping" className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-blue-600 hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
        <ArrowLeft size={16} aria-hidden="true" />
        Kembali ke Kelola Pendampingan
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <IkonKotak ikon={ShieldAlert} warna="coral" ukuran="lg" />
          <div>
            <h1 className="text-2xl font-extrabold text-navy-900">
              Kasus <span className="tabular-nums">{k.kode}</span>
            </h1>
            <p className="mt-0.5 text-sm text-ink-soft">
              Sesi {s.urutan} · {s.jenis}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LencanaLaporan status={k.status} />
          <LencanaSesi status={s.status} />
        </div>
      </div>

      <p className="mb-6 flex items-start gap-3 rounded-2xl bg-info-50 p-4 text-sm font-medium text-info">
        <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
        Identitas korban dan pelapor dirahasiakan. Anda melihat data yang diperlukan untuk pendampingan saja.
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[24rem_1fr]">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="h-ringkasan" className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 id="h-ringkasan" className="mb-2 text-lg font-bold text-navy-900">
              Ringkasan kasus
            </h2>
            <dl className="divide-y divide-line-soft">
              <Baris label="Korban">
                {k.inisialKorban} · {k.usia !== null ? `${k.usia} tahun` : "usia tidak diisi"} · {jk}
              </Baris>
              <Baris label="Kecamatan">{k.kecamatan ?? "Tidak diisi"}</Baris>
              <Baris label="Jenis kekerasan">{k.jenisKekerasan}</Baris>
              <Baris label="Tanggal kejadian">{k.tanggalKejadian ? tglPanjang(k.tanggalKejadian) : "Tidak diisi"}</Baris>
              <Baris label="Kronologi">
                <p className="whitespace-pre-wrap break-words">{k.kronologi}</p>
              </Baris>
            </dl>
          </section>

          <section aria-labelledby="h-sesi" className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 id="h-sesi" className="mb-3 text-lg font-bold text-navy-900">
              Sesi ini
            </h2>
            <dl className="flex flex-col gap-3 text-sm">
              <div>
                <dt className="font-semibold text-ink-soft">Waktu</dt>
                <dd className="text-ink">
                  {tglPanjang(s.mulai)}
                  <br />
                  {jam(s.mulai)} - {jam(s.selesai)} WIB
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink-soft">Tempat</dt>
                <dd className="flex items-start gap-2 text-ink">
                  <MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-mute" />
                  <span>
                    {s.lokasi}, {s.alamatLokasi}
                  </span>
                </dd>
              </div>
              {s.nomorAntrean && (
                <div>
                  <dt className="font-semibold text-ink-soft">Nomor antrean</dt>
                  <dd className="flex items-center gap-2 font-bold tabular-nums text-navy-900">
                    <Ticket size={16} aria-hidden="true" />
                    {s.nomorAntrean}
                  </dd>
                </div>
              )}
            </dl>
            <div className="mt-4 border-t border-line-soft pt-4">
              <AksiSesi id={s.id} status={s.status} bisaMulai={bisaMulai} kode={k.kode} />
            </div>
          </section>

          <section aria-labelledby="h-linimasa" className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <div className="mb-3 flex items-center gap-3">
              <IkonKotak ikon={CalendarClock} warna="teal" />
              <h2 id="h-linimasa" className="text-lg font-bold text-navy-900">
                Riwayat sesi kasus ini ({s.linimasa.length})
              </h2>
            </div>
            <ol className="flex flex-col gap-3">
              {s.linimasa.map((x) => (
                <li key={x.id} className={"rounded-xl border p-4 " + (x.saatIni ? "border-blue-600 bg-blue-50" : "border-line")} aria-current={x.saatIni ? "step" : undefined}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-navy-900">
                        Sesi {x.urutan} · {x.jenis} {x.saatIni && <span className="text-sm font-semibold text-blue-600">(sesi ini)</span>}
                      </p>
                      <p className="text-sm text-ink-soft">
                        {tglPendek(x.mulai)}, {jam(x.mulai)} · {x.pendamping}
                        {x.nomorAntrean && <span className="tabular-nums"> · {x.nomorAntrean}</span>}
                      </p>
                    </div>
                    <LencanaSesi status={x.status} />
                  </div>
                  {!x.saatIni && laporan[x.id] && (
                    <details className="mt-3">
                      <summary className="inline-flex min-h-11 cursor-pointer items-center font-bold text-blue-600 underline focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">Lihat laporan</summary>
                      <div className="mt-3">
                        <TampilLaporan laporan={laporan[x.id]} />
                      </div>
                    </details>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <PanelLaporanPendampingan
          key={s.id}
          sesiId={s.id}
          urutan={s.urutan}
          statusSesi={s.status}
          opsiJenis={opsiJenis}
          jenisAwalId={s.jenisPendampingId}
          laporan={laporan[s.id] ?? null}
        />
      </div>
    </main>
  );
}
