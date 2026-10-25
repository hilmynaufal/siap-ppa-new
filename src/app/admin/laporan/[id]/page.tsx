import { ClipboardPen, FileImage, FileSearch, FileText, HeartHandshake, Link2, MapPin, Phone, Printer, ShieldAlert, Trash2, User, UserX } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AksiLaporanSampah, TombolHapusLaporan } from "@/components/aksi-sampah";
import { Breadcrumb } from "@/components/breadcrumb";
import { IkonKotak } from "@/components/ikon-kotak";
import { LencanaLaporan } from "@/components/lencana-laporan";
import { db } from "@/lib/db";
import { OPSI_JENIS_KELAMIN, OPSI_PENDIDIKAN, OPSI_STATUS_BPJS, OPSI_STATUS_PERKAWINAN, hitungUsia, labelDokumen } from "@/lib/laporan";
import { daftarUsulan, laporanKasus } from "@/lib/laporan-pendampingan";
import { laporanTerkait } from "@/lib/nik-akses";
import { syaratTutupKasus } from "@/lib/sesi";
import { jadwalLaporan } from "@/lib/tiket";
import { detailLaporan } from "@/lib/verifikasi";
import { NikTersamar } from "./nik-tersamar";
import { PanelVerifikasi } from "./panel-verifikasi";
import { PendampinganAdmin } from "./pendampingan-admin";
import { TutupKasus } from "./tutup-kasus";
import { UsulanSesi } from "./usulan-sesi";

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

/** Label tampilan dari nilai enum (atau "Tidak diisi"). */
const label = (daftar: readonly { nilai: string; label: string }[], nilai: string | null) => (nilai ? (daftar.find((o) => o.nilai === nilai)?.label ?? nilai) : "Tidak diisi");

const tautanTombol =
  "inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-sm font-bold text-ink transition-colors hover:bg-brand-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100";

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
  const k = l.korban;
  const usia = k?.tanggalLahir ? hitungUsia(k.tanggalLahir) : null;
  const [sesiDasar, laporanSesi, usulan, terkait, tutup, jenis, pendamping, lokasi] = await Promise.all([
    jadwalLaporan(db, id),
    laporanKasus(db, id),
    daftarUsulan(db, id),
    laporanTerkait(db, id),
    syaratTutupKasus(db, id),
    db.jenisPendampingan.findMany({ where: { aktif: true }, orderBy: { nama: "asc" }, select: { id: true, nama: true } }),
    db.pengguna.findMany({
      where: { peran: "PENDAMPING", aktif: true },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, jenisPendampingId: true },
    }),
    db.lokasi.findMany({ where: { aktif: true }, orderBy: { nama: "asc" }, select: { id: true, nama: true } }),
  ]);

  const sesi = sesiDasar.map((x) => ({ ...x, laporan: laporanSesi[x.id] ?? null }));
  // Pilihan Pelapor ditandai di formulir jadwal; Admin tetap bebas memilih jenis lain.
  const opsi = { jenis, pendamping, lokasi, diminta: l.pendampinganDiminta.map((p) => p.id) };
  // Laporan di Sampah tampil baca-saja: tidak ada verifikasi, jadwal, BAP, atau penutupan kasus.
  const diSampah = !!l.sampah;
  const kasusAktif = !diSampah && (l.status === "TERVERIFIKASI" || l.status === "DALAM_PENDAMPINGAN");

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb
        remah={[{ label: "Beranda", href: "/admin" }, { label: "Laporan masuk", href: "/admin/laporan" }, { label: l.kode }]}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <IkonKotak ikon={FileSearch} warna="blue" ukuran="lg" />
          <div>
            <h1 className="text-2xl font-extrabold text-brand-900">Laporan {l.kode}</h1>
            <p className="mt-0.5 text-sm text-ink-soft">Masuk {fmt(l.dibuatPada)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LencanaLaporan status={l.status} />
          {!diSampah && (
            <>
              <Link href={`/admin/laporan/${l.id}/lengkapi`} className={tautanTombol}>
                <ClipboardPen size={18} aria-hidden="true" />
                Lengkapi data BAP
              </Link>
              <a href={`/bap/${l.id}`} target="_blank" rel="noopener noreferrer" className={tautanTombol}>
                <Printer size={18} aria-hidden="true" />
                Cetak BAP
              </a>
              <TombolHapusLaporan id={l.id} kode={l.kode} />
            </>
          )}
        </div>
      </div>

      {l.sampah && (
        <section aria-labelledby="h-sampah" className="mb-6 rounded-2xl border border-error/30 bg-error-50 p-5">
          <h2 id="h-sampah" className="flex items-center gap-2 font-bold text-error">
            <Trash2 size={18} aria-hidden="true" />
            Laporan ini ada di Sampah
          </h2>
          <p className="mt-1 text-sm text-ink">
            Dihapus {fmt(l.sampah.pada)}
            {l.sampah.oleh && <> oleh {l.sampah.oleh}</>}
            {l.sampah.alasan && <>. Alasan: {l.sampah.alasan}</>}. Laporan, jadwal, dan tiketnya tidak tampil di daftar mana pun.
          </p>
          <div className="mt-3">
            <AksiLaporanSampah id={l.id} kode={l.kode} dariDetail />
          </div>
        </section>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="h-korban" className="rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6">
            <div className="mb-2 flex items-center gap-3">
              <IkonKotak ikon={ShieldAlert} warna="coral" />
              <h2 id="h-korban" className="text-lg font-bold text-brand-900">Data korban</h2>
            </div>
            {k ? (
              <dl className="divide-y divide-line-soft">
                <Baris label="Nama lengkap">{k.nama}</Baris>
                {k.namaPanggilan && <Baris label="Nama panggilan">{k.namaPanggilan}</Baris>}
                <Baris label="NIK">
                  <NikTersamar laporanId={l.id} pihak="KORBAN" tersamar={k.nikTersamar} ada={k.adaNik} />
                </Baris>
                <Baris label="Jenis kelamin">{label(OPSI_JENIS_KELAMIN, k.jenisKelamin)}</Baris>
                <Baris label="Tempat, tanggal lahir">
                  {k.tempatLahir || k.tanggalLahir ? [k.tempatLahir, k.tanggalLahir ? fmt(`${k.tanggalLahir}T00:00:00+07:00`, false) : null].filter(Boolean).join(", ") : "Tidak diisi"}
                </Baris>
                <Baris label="Usia">{usia !== null ? `${usia} tahun` : "Tidak diisi"}</Baris>
                <Baris label="Pendidikan">{label(OPSI_PENDIDIKAN, k.pendidikan)}</Baris>
                <Baris label="Pekerjaan">{k.pekerjaan ?? "Tidak diisi"}</Baris>
                <Baris label="Agama">{k.agama ?? "Tidak diisi"}</Baris>
                <Baris label="Status perkawinan">{label(OPSI_STATUS_PERKAWINAN, k.statusPerkawinan)}</Baris>
                <Baris label="BPJS">
                  {k.noBpjs || k.statusBpjs ? [k.noBpjs, k.statusBpjs ? label(OPSI_STATUS_BPJS, k.statusBpjs) : null].filter(Boolean).join(" · ") : "Tidak diisi"}
                </Baris>
                {k.kontak && (
                  <Baris label="Kontak">
                    <span className="inline-flex items-center gap-2 tabular-nums">
                      <Phone size={16} aria-hidden="true" className="text-ink-mute" />
                      {k.kontak}
                    </span>
                  </Baris>
                )}
                <Baris label="Alamat domisili">
                  <span className="flex items-start gap-2">
                    <MapPin size={16} aria-hidden="true" className="mt-1 shrink-0 text-ink-mute" />
                    <span>{[k.alamat, k.desa, k.kecamatan].filter(Boolean).join(", ") || "Tidak diisi"}</span>
                  </span>
                </Baris>
                {k.alamatKtp && <Baris label="Alamat KTP">{k.alamatKtp}</Baris>}
              </dl>
            ) : (
              <p className="text-ink-soft">Data korban tidak tersedia.</p>
            )}
          </section>

          <section aria-labelledby="h-kejadian" className="rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6">
            <div className="mb-2 flex items-center gap-3">
              <IkonKotak ikon={FileSearch} warna="amber" />
              <h2 id="h-kejadian" className="text-lg font-bold text-brand-900">Kejadian</h2>
            </div>
            <dl className="divide-y divide-line-soft">
              <Baris label="Jenis kekerasan">{l.jenis}</Baris>
              <Baris label="Tanggal kejadian">{l.tanggalKejadian ? fmt(l.tanggalKejadian, false) : "Tidak diisi"}</Baris>
              <Baris label="Tempat kejadian">{l.tempatKejadian ?? "Tidak diisi"}</Baris>
              <Baris label="Dirujuk dari">{l.asalRujukan ?? "Tidak dirujuk"}</Baris>
              <Baris label="Kronologi">
                <p className="whitespace-pre-wrap break-words">{l.kronologi}</p>
              </Baris>
              <Baris label="Pendampingan diminta">
                {l.pendampinganDiminta.length === 0 ? (
                  <span className="text-ink-soft">Tidak dipilih Pelapor (diserahkan kepada petugas)</span>
                ) : (
                  <ul className="flex flex-wrap gap-2" aria-label="Jenis pendampingan yang diminta Pelapor">
                    {l.pendampinganDiminta.map((p) => (
                      <li key={p.id} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-800">
                        <HeartHandshake size={14} aria-hidden="true" />
                        {p.nama}
                      </li>
                    ))}
                  </ul>
                )}
              </Baris>
              {l.alasanKebutuhan && (
                <Baris label="Alasan kebutuhan">
                  <p className="whitespace-pre-wrap break-words">{l.alasanKebutuhan}</p>
                </Baris>
              )}
              {l.lembagaRujukan && (
                <Baris label="Lembaga rujukan">
                  <p className="whitespace-pre-wrap break-words">{l.lembagaRujukan}</p>
                </Baris>
              )}
            </dl>
          </section>

          <section aria-labelledby="h-pelapor" className="rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6">
            <div className="mb-2 flex items-center gap-3">
              <IkonKotak ikon={User} warna="sky" />
              <h2 id="h-pelapor" className="text-lg font-bold text-brand-900">Pelapor</h2>
            </div>
            {l.pelaporAdalahKorban || !l.pelapor ? (
              <p className="text-ink-soft">{l.pelaporAdalahKorban ? "Korban sendiri yang melapor. Kontaknya ada pada data korban." : "Data pelapor tidak tersedia."}</p>
            ) : (
              <dl className="divide-y divide-line-soft">
                <Baris label="Nama lengkap">{l.pelapor.nama}</Baris>
                <Baris label="NIK">
                  <NikTersamar laporanId={l.id} pihak="PELAPOR" tersamar={l.pelapor.nikTersamar} ada={l.pelapor.adaNik} />
                </Baris>
                <Baris label="Hubungan dengan korban">{l.pelapor.hubungan ?? "Tidak diisi"}</Baris>
                <Baris label="Kontak">
                  <span className="inline-flex items-center gap-2 tabular-nums">
                    <Phone size={16} aria-hidden="true" className="text-ink-mute" />
                    {l.pelapor.kontak}
                  </span>
                </Baris>
                <Baris label="Alamat">{[l.pelapor.alamat, l.pelapor.desa, l.pelapor.kecamatan].filter(Boolean).join(", ") || "Tidak diisi"}</Baris>
              </dl>
            )}
          </section>

          <section aria-labelledby="h-terlapor" className="rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6">
            <div className="mb-2 flex items-center gap-3">
              <IkonKotak ikon={UserX} warna="violet" />
              <h2 id="h-terlapor" className="text-lg font-bold text-brand-900">Terlapor</h2>
            </div>
            {l.terlapor.length === 0 ? (
              <p className="text-ink-soft">Pelaku belum diketahui atau tidak diisi.</p>
            ) : (
              l.terlapor.map((t) => (
                <dl key={t.id} className="divide-y divide-line-soft">
                  <Baris label="Nama">{t.nama ?? "Tidak diisi"}</Baris>
                  <Baris label="Jenis kelamin">{label(OPSI_JENIS_KELAMIN, t.jenisKelamin)}</Baris>
                  <Baris label="Usia (perkiraan)">{t.usia !== null ? `${t.usia} tahun` : "Tidak diisi"}</Baris>
                  <Baris label="Hubungan dengan korban">{t.hubungan ?? "Tidak diisi"}</Baris>
                  <Baris label="Alamat / lokasi">{t.alamat ?? "Tidak diisi"}</Baris>
                </dl>
              ))
            )}
          </section>

          {terkait.length > 0 && (
            <section aria-labelledby="h-terkait" className="rounded-2xl border border-warning/30 bg-warning-50 p-5 md:p-6">
              <div className="mb-3 flex items-center gap-3">
                <IkonKotak ikon={Link2} warna="amber" />
                <h2 id="h-terkait" className="text-lg font-bold text-brand-900">Laporan terkait</h2>
              </div>
              <p className="mb-3 text-sm text-ink-soft">Laporan lain memuat NIK yang sama dengan korban atau pelapor laporan ini.</p>
              <ul className="flex flex-col gap-2">
                {terkait.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/admin/laporan/${t.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface px-4 py-3 hover:bg-brand-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                    >
                      <span className="font-semibold tabular-nums text-ink">{t.kode}</span>
                      <span className="text-sm text-ink-soft">{t.keterangan}</span>
                      <LencanaLaporan status={t.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(l.status === "TERVERIFIKASI" || l.status === "DALAM_PENDAMPINGAN" || l.status === "DITUTUP") && (
            <PendampinganAdmin
              laporanId={l.id}
              kode={l.kode}
              sesi={sesi}
              opsi={opsi}
              bisaTambah={kasusAktif}
              bacaSaja={diSampah}
            />
          )}

          <section aria-labelledby="h-dokumen" className="rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6">
            <div className="mb-3 flex items-center gap-3">
              <IkonKotak ikon={FileText} warna="violet" />
              <h2 id="h-dokumen" className="text-lg font-bold text-brand-900">Dokumen pendukung</h2>
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
                      className="flex min-h-12 items-center gap-3 rounded-xl border border-line px-4 py-2 text-ink transition-colors hover:bg-brand-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                    >
                      {d.tipeMime === "application/pdf" ? (
                        <FileText size={20} aria-hidden="true" className="shrink-0 text-coral-500" />
                      ) : (
                        <FileImage size={20} aria-hidden="true" className="shrink-0 text-sky-500" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{labelDokumen(d.jenis)}</span>
                        <span className="block truncate text-sm text-ink-mute">{d.namaBerkas}</span>
                      </span>
                      <span className="shrink-0 text-sm text-ink-mute">{ukuranTeks(d.ukuran)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div>
          {(kasusAktif || l.status === "DITUTUP") && <UsulanSesi laporanId={l.id} kode={l.kode} usulan={usulan} opsi={opsi} bisaMemutuskan={kasusAktif} />}
          {!diSampah && (
            <PanelVerifikasi
              opsi={opsi}
              id={l.id}
              kode={l.kode}
              status={l.status}
              verifikator={l.verifikator}
              diverifikasiPada={l.diverifikasiPada ? fmt(l.diverifikasiPada) : null}
              alasanPenolakan={l.alasanPenolakan}
            />
          )}
          {!diSampah && (l.status === "TERVERIFIKASI" || l.status === "DALAM_PENDAMPINGAN" || l.status === "DITUTUP") && (
            <TutupKasus laporanId={l.id} kode={l.kode} bisa={tutup.bisa} alasan={tutup.alasan} sudahDitutup={tutup.sudahDitutup} />
          )}
        </div>
      </div>
    </main>
  );
}
