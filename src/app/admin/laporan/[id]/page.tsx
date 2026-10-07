import { CalendarClock, FileImage, FileSearch, FileText, MapPin, Phone, ShieldAlert, Ticket, User } from "lucide-react";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { IkonKotak } from "@/components/ikon-kotak";
import { LencanaLaporan } from "@/components/lencana-laporan";
import { db } from "@/lib/db";
import { jadwalLaporan } from "@/lib/tiket";
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
  const [sesi, jenis, pendamping, lokasi] = await Promise.all([
    jadwalLaporan(db, id),
    db.jenisPendampingan.findMany({ where: { aktif: true }, orderBy: { nama: "asc" }, select: { id: true, nama: true } }),
    db.pengguna.findMany({
      where: { peran: "PENDAMPING", aktif: true },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, jenisPendampingId: true },
    }),
    db.lokasi.findMany({ where: { aktif: true }, orderBy: { nama: "asc" }, select: { id: true, nama: true } }),
  ]);

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb
        remah={[{ label: "Beranda", href: "/admin" }, { label: "Laporan masuk", href: "/admin/laporan" }, { label: l.kode }]}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <IkonKotak ikon={FileSearch} warna="blue" ukuran="lg" />
          <div>
            <h1 className="text-2xl font-extrabold text-navy-900">Laporan {l.kode}</h1>
            <p className="mt-0.5 text-sm text-ink-soft">Masuk {fmt(l.dibuatPada)}</p>
          </div>
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

          {sesi.length > 0 && (
            <section aria-labelledby="h-jadwal" className="rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6">
              <div className="mb-3 flex items-center gap-3">
                <IkonKotak ikon={CalendarClock} warna="teal" />
                <h2 id="h-jadwal" className="text-lg font-bold text-navy-900">Jadwal dan tiket</h2>
              </div>
              <ul className="flex flex-col gap-3">
                {sesi.map((x) => (
                  <li key={x.id} className="rounded-xl border border-line p-4">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-bold text-navy-900">
                      Sesi {x.urutan} · {x.jenis}
                      {x.nomorAntrean && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-sm tabular-nums text-navy-800">
                          <Ticket size={14} aria-hidden="true" />
                          {x.nomorAntrean}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-ink">{fmt(x.mulai)} - {new Date(x.selesai).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })} WIB</p>
                    <p className="mt-1 flex items-start gap-2 text-sm text-ink-soft">
                      <MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-mute" />
                      {x.lokasi}, {x.alamat}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">Pendamping: {x.pendamping}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

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
          opsi={{ jenis, pendamping, lokasi }}
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
