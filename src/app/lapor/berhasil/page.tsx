import { CheckCircle2, ClipboardCheck, SearchCheck, Ticket } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KepalaPelapor } from "@/components/kepala-pelapor";
import { db } from "@/lib/db";
import { kontakDaruratAktif } from "@/lib/kontak-darurat";
import { POLA_KODE } from "@/lib/laporan";
import { SalinKode } from "./salin-kode";

export const metadata = { title: "Laporan Terkirim | SIAP PPA" };
export const dynamic = "force-dynamic";

const LANGKAH = [
  { ikon: ClipboardCheck, teks: "Petugas memeriksa laporan Anda pada jam kerja." },
  { ikon: Ticket, teks: "Bila terverifikasi, tiket terbit berisi nomor antrean dan jadwal pendampingan dengan psikolog atau konsultan hukum." },
  { ikon: SearchCheck, teks: "Cek tiket kapan saja di menu Cek Tiket dengan kode pendaftaran." },
];

export default async function HalamanBerhasil({ searchParams }: { searchParams: Promise<{ kode?: string }> }) {
  const { kode } = await searchParams;
  if (!kode || !POLA_KODE.test(kode)) redirect("/");
  const kontak = await kontakDaruratAktif(db, 1);

  return (
    <div className="min-h-screen bg-surface">
      <KepalaPelapor telepon={kontak[0]?.telepon} />
      <main className="mx-auto max-w-md px-4 pb-10 pt-8">
        <div className="text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-success-50 text-success">
            <CheckCircle2 size={44} aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-3xl font-extrabold leading-tight text-navy-900">Laporan Anda sudah kami terima</h1>
          <p className="mt-2 text-ink-soft">Terima kasih sudah berani melapor.</p>
        </div>

        <section aria-label="Kode pendaftaran" className="mt-6 rounded-2xl border border-line bg-canvas p-5 text-center shadow-card">
          <p className="text-sm font-semibold text-ink-soft">Kode pendaftaran</p>
          <p className="mt-2 select-all break-all text-3xl font-extrabold tracking-wide text-navy-900 tabular-nums">{kode}</p>
          <div className="mt-4 flex flex-col items-center gap-1">
            <SalinKode kode={kode} />
          </div>
          <p className="mt-2 text-sm text-ink-soft">Simpan kode ini. Anda memerlukannya untuk mengecek tiket.</p>
        </section>

        <h2 className="mb-4 mt-8 text-xl font-extrabold text-navy-900">Langkah berikutnya</h2>
        <ol className="flex flex-col gap-4">
          {LANGKAH.map((l, i) => (
            <li key={i} className="flex items-start gap-4">
              <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 font-extrabold text-navy-700">
                {i + 1}
              </span>
              <p className="pt-1 text-ink">{l.teks}</p>
            </li>
          ))}
        </ol>

        <Link
          href="/cek-tiket"
          className="mt-8 inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface font-bold text-navy-800 transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
        >
          <Ticket size={18} aria-hidden="true" />
          Cek Tiket
        </Link>
      </main>
    </div>
  );
}
