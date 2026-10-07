"use client";

import { CalendarDays, Clock, Hourglass, MapPin, Phone, Printer, Search, Ticket, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { IkonKotak } from "@/components/ikon-kotak";
import { LencanaLaporan } from "@/components/lencana-laporan";
import { Galat, fokus } from "@/components/ui-form";
import { periksaTiket, type HasilPeriksa, type TiketDenganQr } from "./actions";

const TANPA_QR_STATUS = ["SELESAI", "TIDAK_HADIR", "DIBATALKAN"] as const;
const SEGARKAN_MS = 20_000;

const tanggalPanjang = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
const jamSaja = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).replace(".", ":");

function KartuTiket({ t }: { t: TiketDenganQr }) {
  const selesai = (TANPA_QR_STATUS as readonly string[]).includes(t.statusSesi);
  return (
    <li className="break-inside-avoid rounded-2xl border border-line bg-surface p-5 shadow-card print:shadow-none">
      <div className="flex items-center gap-3">
        <IkonKotak ikon={Ticket} warna="magenta" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-soft">Sesi {t.urutan}</p>
          <h3 className="font-bold text-navy-900">{t.jenis}</h3>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-blue-50 p-4 text-center">
        <p className="text-sm font-semibold text-ink-soft">Nomor antrean</p>
        <p className="mt-1 text-2xl font-extrabold tabular-nums text-navy-900" aria-label={`Nomor antrean ${t.nomorAntrean}`}>
          {t.nomorAntrean}
        </p>
      </div>

      <dl className="mt-4 flex flex-col gap-3 text-[15px]">
        <div className="flex items-start gap-3">
          <CalendarDays size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-mute" />
          <div>
            <dt className="sr-only">Tanggal</dt>
            <dd className="font-semibold text-ink">{tanggalPanjang(t.mulai)}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Clock size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-mute" />
          <div>
            <dt className="sr-only">Waktu</dt>
            <dd className="text-ink">{jamSaja(t.mulai)} - {jamSaja(t.selesai)} WIB</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-mute" />
          <div>
            <dt className="sr-only">Tempat</dt>
            <dd className="text-ink">
              <span className="font-semibold">{t.lokasi}</span>
              <br />
              <span className="text-ink-soft">{t.alamat}</span>
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <UserRound size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-mute" />
          <div>
            <dt className="sr-only">Pendamping</dt>
            <dd className="text-ink">Pendamping: {t.pendamping}</dd>
          </div>
        </div>
      </dl>

      {t.antrean && (
        <div className="mt-4 grid grid-cols-2 gap-3 text-center" aria-live="polite">
          <div className="rounded-xl bg-success-50 p-3">
            <p className="text-xs font-semibold text-ink-soft">Sedang dilayani</p>
            <p className="mt-0.5 font-extrabold tabular-nums text-success">{t.antrean.nomorSaatIni ?? "Belum ada"}</p>
          </div>
          <div className="rounded-xl bg-warning-50 p-3">
            <p className="flex items-center justify-center gap-1 text-xs font-semibold text-ink-soft">
              <Users size={12} aria-hidden="true" /> Antrean di depan Anda
            </p>
            <p className="mt-0.5 font-extrabold tabular-nums text-warning">{t.antrean.sisaDidepan}</p>
          </div>
        </div>
      )}

      {!selesai && (
        <div className="mt-4 text-center">
          <div
            role="img"
            aria-label="Kode QR check-in. Tunjukkan kepada petugas saat tiba."
            className="mx-auto h-44 w-44 rounded-xl border border-line bg-white p-2 [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: t.qrSvg }}
          />
          <p className="mt-2 text-sm text-ink-soft">
            {t.sudahCheckIn ? "Anda sudah check-in. Mohon menunggu dipanggil." : "Tunjukkan kode QR ini kepada petugas saat tiba."}
          </p>
        </div>
      )}
    </li>
  );
}

function Hasil({ h }: { h: Extract<HasilPeriksa, { ok: true }> }) {
  return (
    <section aria-labelledby="h-hasil" className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="h-hasil" className="text-lg font-bold text-navy-900">Laporan <span className="tabular-nums">{h.kode}</span></h2>
        <LencanaLaporan status={h.status} />
      </div>

      {h.status === "BARU" && (
        <div className="flex items-start gap-4 rounded-2xl border border-line bg-canvas p-5">
          <IkonKotak ikon={Hourglass} warna="amber" />
          <p className="text-ink-soft">
            Laporan Anda sudah kami terima dan sedang diperiksa oleh Admin. Tiket dan jadwal akan muncul di sini setelah laporan diverifikasi. Silakan cek kembali nanti.
          </p>
        </div>
      )}

      {h.status === "DITOLAK" && (
        <div className="rounded-2xl border border-line bg-canvas p-5">
          <p className="font-bold text-navy-900">Laporan belum dapat kami proses</p>
          {h.alasanPenolakan && <p className="mt-2 whitespace-pre-wrap break-words text-ink-soft">{h.alasanPenolakan}</p>}
          <p className="mt-3 text-sm text-ink-soft">
            Bila Anda memerlukan bantuan segera, hubungi <Link href="/kontak-darurat" className="font-bold text-blue-600 underline">kontak darurat</Link>.
          </p>
        </div>
      )}

      {h.tiket.length > 0 && (
        <>
          <ul className="flex flex-col gap-4">
            {h.tiket.map((t) => (
              <KartuTiket key={t.sesiId} t={t} />
            ))}
          </ul>
          <button
            type="button"
            onClick={() => window.print()}
            className={`mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface font-bold text-ink transition-colors hover:bg-blue-50 print:hidden ${fokus}`}
          >
            <Printer size={20} aria-hidden="true" />
            Cetak atau simpan tiket (PDF)
          </button>
        </>
      )}

      {(h.status === "TERVERIFIKASI" || h.status === "DALAM_PENDAMPINGAN") && h.tiket.length === 0 && (
        <p className="rounded-2xl border border-line bg-canvas p-5 text-ink-soft">Jadwal pendampingan belum tersedia. Silakan cek kembali nanti.</p>
      )}
    </section>
  );
}

export function CekTiket() {
  const [kode, setKode] = useState("");
  const [hasil, setHasil] = useState<HasilPeriksa | null>(null);
  const [pending, mulai] = useTransition();
  const kodeAktif = useRef<string | null>(null);

  const cari = useCallback(
    (nilai: string) => {
      mulai(async () => {
        const h = await periksaTiket(nilai);
        kodeAktif.current = h.ok ? h.kode : null;
        setHasil(h);
      });
    },
    [],
  );

  // Pada hari layanan, indikator antrean disegarkan otomatis tanpa memuat ulang halaman.
  const adaAntrean = hasil?.ok && hasil.tiket.some((t) => t.antrean);
  useEffect(() => {
    if (!adaAntrean) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible" && kodeAktif.current) {
        periksaTiket(kodeAktif.current).then((h) => h.ok && setHasil(h));
      }
    }, SEGARKAN_MS);
    return () => clearInterval(id);
  }, [adaAntrean]);

  return (
    <div className="px-4 py-6">
      <div className="print:hidden">
        <div className="mb-4 flex items-center gap-4">
          <IkonKotak ikon={Ticket} warna="magenta" ukuran="lg" />
          <div>
            <h1 className="text-xl font-extrabold text-navy-900">Cek tiket</h1>
            <p className="mt-0.5 text-sm text-ink-soft">Masukkan kode pendaftaran dari saat Anda mengirim laporan.</p>
          </div>
        </div>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            cari(kode);
          }}
        >
          <label htmlFor="kode" className="mb-2 block text-sm font-bold">
            Kode pendaftaran
          </label>
          <input
            id="kode"
            name="kode"
            value={kode}
            onChange={(e) => setKode(e.target.value.toUpperCase())}
            placeholder="PPA-261007-AB23CD"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-invalid={hasil && !hasil.ok ? true : undefined}
            aria-describedby={hasil && !hasil.ok ? "galat-kode" : undefined}
            className="h-14 w-full rounded-xl border border-line-strong bg-surface px-4 text-base font-semibold tabular-nums tracking-wide text-ink focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 aria-[invalid=true]:border-error aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-error-50"
          />
          <div className="mt-2">
            <Galat id="galat-kode" pesan={hasil && !hasil.ok ? hasil.pesan : undefined} />
          </div>
          <button
            type="submit"
            disabled={pending || kode.trim().length === 0}
            className={`mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-magenta-600 font-bold text-white shadow-card transition-colors hover:bg-magenta-700 disabled:bg-line-strong disabled:shadow-none ${fokus}`}
          >
            <Search size={20} aria-hidden="true" />
            {pending ? "Memeriksa..." : "Cek tiket"}
          </button>
        </form>
      </div>

      {hasil?.ok && <Hasil h={hasil} />}

      <p className="mt-8 flex items-center justify-center gap-2 text-sm text-ink-mute print:hidden">
        <Phone size={14} aria-hidden="true" />
        Kode hilang? Hubungi <Link href="/kontak-darurat" className="font-bold text-blue-600 underline">UPTD PPA</Link>.
      </p>
    </div>
  );
}
