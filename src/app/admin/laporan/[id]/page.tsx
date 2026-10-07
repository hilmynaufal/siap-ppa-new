import { FileImage, FileText, MapPin, Phone, ShieldAlert, User } from "lucide-react";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { IkonKotak } from "@/components/ikon-kotak";
import { LencanaLaporan } from "@/components/lencana-laporan";
import { db } from "@/lib/db";
import { detailLaporan } from "@/lib/verifikasi";
import { PanelVerifikasi } from "./panel-verifikasi";

export const metadata = { title: "Detail Laporan | SIAP PPA" };
export const dynamic = "force-dynamic";

const fmt = (iso: string, denganJam = true) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(denganJam ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Jakarta",
  });

const ukuranTeks = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

function Baris({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-sm font-semibold text-ink-soft">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}

export default async function HalamanDetailLaporan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await detailLaporan(db, id);
  if (!l) notFound();

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb
        remah={[{ label: "Beranda", href: "/admin" }, { label: "Laporan masuk", href: "/admin/laporan" }, { label: l.kode }]}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Laporan {l.kode}</h1>
          <p className="mt-1 text-ink-soft">Masuk {fmt(l.dibuatPada)}</p>
        </div>
        <LencanaLaporan status={l.status} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="h-korban" className="rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6">
            <div className="mb-2 flex items-center gap-3">
              <IkonKotak ikon={ShieldAlert} warna="coral" />
              <h2 id="h-korban" className="text-lg font-bold text-navy-900">Data korban dan kejadian</h2>
            </div>
            <dl className="divide-y divide-line-soft">
              <Baris label="Nama korban">{l.namaKorban}</Baris>
              <Baris label="Usia">{l.usiaKorban !== null ? `${l.usiaKorban} tahun` : "Tidak diisi"}</Baris>
              <Baris label="Jenis kelamin">{l.jenisKelaminKorban ?? "Tidak diisi"}</Baris>
              <Baris label="Jenis kekerasan">{l.jenis}</Baris>
              <Baris label="Kecamatan">
                <span className="inline-flex items-center gap-2">
                  <MapPin size={16} aria-hidden="true" className="text-ink-mute" />
                  {l.kecamatan ?? "Tidak diisi"}
                </span>
              </Baris>
              <Baris label="Tanggal kejadian">{l.tanggalKejadian ? fmt(l.tanggalKejadian, false) : "Tidak diisi"}</Baris>
              <Baris label="Kronologi">
                <p className="whitespace-pre-wrap break-words">{l.kronologi}</p>
              </Baris>
            </dl>
          </section>

          <section aria-labelledby="h-pelapor" className="rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6">
            <div className="mb-2 flex items-center gap-3">
              <IkonKotak ikon={User} warna="sky" />
              <h2 id="h-pelapor" className="text-lg font-bold text-navy-900">Pelapor</h2>
            </div>
            <dl className="divide-y divide-line-soft">
              <Baris label="Nama pelapor">{l.namaPelapor}</Baris>
              <Baris label="Kontak">
                <span className="inline-flex items-center gap-2 tabular-nums">
                  <Phone size={16} aria-hidden="true" className="text-ink-mute" />
                  {l.kontakPelapor}
                </span>
              </Baris>
            </dl>
          </section>

          <section aria-labelledby="h-dokumen" className="rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6">
            <div className="mb-3 flex items-center gap-3">
              <IkonKotak ikon={FileText} warna="violet" />
              <h2 id="h-dokumen" className="text-lg font-bold text-navy-900">Dokumen pendukung</h2>
            </div>
            {l.dokumen.length === 0 ? (
              <p className="text-ink-soft">Pelapor tidak melampirkan dokumen.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {l.dokumen.map((d) => (
                  <li key={d.id}>
                    <a
                      href={`/admin/laporan/${l.id}/dokumen/${d.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-12 items-center gap-3 rounded-xl border border-line px-4 py-2 text-ink transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                    >
                      {d.tipeMime === "application/pdf" ? (
                        <FileText size={20} aria-hidden="true" className="shrink-0 text-coral-500" />
                      ) : (
                        <FileImage size={20} aria-hidden="true" className="shrink-0 text-sky-500" />
                      )}
                      <span className="min-w-0 flex-1 truncate font-semibold">{d.namaBerkas}</span>
                      <span className="shrink-0 text-sm text-ink-mute">{ukuranTeks(d.ukuran)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <PanelVerifikasi
          id={l.id}
          kode={l.kode}
          status={l.status}
          verifikator={l.verifikator}
          diverifikasiPada={l.diverifikasiPada ? fmt(l.diverifikasiPada) : null}
          alasanPenolakan={l.alasanPenolakan}
        />
      </div>
    </main>
  );
}
