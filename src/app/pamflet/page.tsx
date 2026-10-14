import { CalendarCheck, FilePenLine, Lock, Phone, QrCode as IkonQr, ScanLine } from "lucide-react";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { IkonKotak } from "@/components/ikon-kotak";
import { LogoSiapLengkap } from "@/components/logo-siap";
import { SiluetHero } from "@/components/siluet-hero";
import { TombolCetak } from "@/components/tombol-cetak";
import { db } from "@/lib/db";
import { kontakDaruratAktif } from "@/lib/kontak-darurat";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pamflet SIAP PPA", robots: { index: false } };

/** Alamat tetap aplikasi; QR selalu mengarah ke formulir laporan di domain ini, bukan ke alamat tempat halaman dibuka. */
const ALAMAT_APLIKASI = process.env.APP_URL ?? "https://siap-ppa-new-370b48.hirumi.app";
const TAUTAN_LAPOR = `${ALAMAT_APLIKASI.replace(/\/$/, "")}/lapor`;

const LANGKAH = [
  { ikon: ScanLine, warna: "teal", teks: "Pindai kode ini dengan kamera ponsel" },
  { ikon: FilePenLine, warna: "magenta", teks: "Isi formulir singkat" },
  { ikon: CalendarCheck, warna: "green", teks: "Terima tiket dan jadwal pendampingan" },
] as const;

export default async function Pamflet() {
  const [kontak, qrSvg] = await Promise.all([
    kontakDaruratAktif(db, 3),
    QRCode.toString(TAUTAN_LAPOR, { type: "svg", margin: 0, errorCorrectionLevel: "Q", color: { dark: "#0B3D22", light: "#FFFFFF" } }),
  ]);

  return (
    <div className="min-h-screen bg-canvas py-8 print:bg-white print:py-0">
      <style>{"@page { size: A4; margin: 0; } @media print { .tanpa-cetak { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }"}</style>

      <div className="tanpa-cetak mx-auto mb-6 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4">
        <p className="text-sm text-ink-soft">Ukuran A4. Pilih &ldquo;Simpan sebagai PDF&rdquo; atau cetak langsung. Aktifkan &ldquo;Grafik latar&rdquo; bila warna tidak muncul.</p>
        <TombolCetak />
      </div>

      <article className="relative mx-auto flex h-[297mm] w-[210mm] flex-col overflow-hidden bg-surface shadow-modal print:shadow-none">
        {/* Bagian atas */}
        <div className="hero-senja relative flex flex-1 flex-col px-[14mm] pt-[12mm]">
          <header className="relative z-10 flex flex-col items-start gap-1">
            <LogoSiapLengkap lebar={170} />
            <p className="text-[9pt] text-ink-soft">DALDUK PPA Kabupaten Bandung</p>
          </header>

          <div className="relative z-10 mt-[10mm]">
            <h1 className="text-[48pt] font-extrabold leading-[1.02] tracking-tight text-brand-900">
              Anda tidak
              <br />
              sendiri.
            </h1>
            <p className="mt-[4mm] max-w-[140mm] text-[13pt] leading-snug text-ink-soft">
              Mengalami atau mengetahui kekerasan terhadap perempuan dan anak di Kabupaten Bandung? Laporkan dengan aman langsung dari ponsel Anda.
            </p>
          </div>

          {/* Kartu QR */}
          <section aria-label="Kode QR menuju formulir laporan" className="relative z-10 mt-[9mm] flex items-center gap-[8mm] rounded-3xl bg-surface p-[7mm] shadow-modal">
            <div className="shrink-0">
              <div
                role="img"
                aria-label={`Kode QR menuju ${TAUTAN_LAPOR}`}
                className="h-[62mm] w-[62mm] rounded-xl border border-line bg-white p-[3mm] [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[11pt] font-bold text-brand-700">
                <IkonQr size={18} aria-hidden="true" />
                Pindai untuk melapor
              </p>
              <ol className="mt-[3mm] flex flex-col gap-[3mm]">
                {LANGKAH.map((l, i) => (
                  <li key={l.teks} className="flex items-center gap-3">
                    <IkonKotak ikon={l.ikon} warna={l.warna} />
                    <span className="text-[11pt] font-bold leading-tight text-brand-900">
                      <span className="mr-1 text-ink-mute">{i + 1}.</span>
                      {l.teks}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-[4mm] inline-flex items-center gap-2 rounded-lg bg-success-50 px-3 py-1.5 text-[10pt] font-bold text-success">
                <Lock size={14} aria-hidden="true" />
                Tanpa akun. Data dirahasiakan.
              </p>
              <p className="mt-[3mm] break-all text-[9pt] text-ink-soft">
                Atau buka: <span className="font-bold text-brand-900">{TAUTAN_LAPOR.replace(/^https?:\/\//, "")}</span>
              </p>
            </div>
          </section>

          <SiluetHero className="pointer-events-none absolute inset-x-0 bottom-0 h-[64mm] w-full" />
        </div>

        {/* Kontak darurat */}
        <footer className="relative z-10 bg-brand-900 px-[14mm] pb-[9mm] pt-[6mm] text-white">
          <p className="text-[11pt] font-extrabold">Dalam keadaan darurat, hubungi:</p>
          {kontak.length > 0 ? (
            <ul className="mt-[3mm] grid grid-cols-3 gap-[4mm]">
              {kontak.map((k) => (
                <li key={k.id} className="rounded-xl bg-white/10 px-3 py-2">
                  <p className="text-[9pt] font-bold leading-tight">{k.instansi}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[11pt] font-extrabold tabular-nums">
                    <Phone size={14} aria-hidden="true" />
                    {k.telepon}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[10pt] text-brand-100">Kontak darurat dapat dilihat di halaman Kontak Darurat aplikasi.</p>
          )}
        </footer>
      </article>
    </div>
  );
}
