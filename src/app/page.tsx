import { FilePenLine, Lock, MapPin, Phone, Ticket } from "lucide-react";
import Link from "next/link";
import { KepalaPelapor } from "@/components/kepala-pelapor";
import { db } from "@/lib/db";
import { kontakDaruratAktif } from "@/lib/kontak-darurat";

export const dynamic = "force-dynamic";

export default async function BerandaPelapor() {
  const kontak = await kontakDaruratAktif(db, 3);

  return (
    <div className="min-h-screen bg-surface">
      <KepalaPelapor telepon={kontak[0]?.telepon} />
      <main className="mx-auto max-w-md">
        <section className="hero-lembut px-4 pb-8 pt-8">
          <h1 className="text-4xl font-extrabold leading-tight text-navy-900">Anda tidak sendiri.</h1>
          <p className="mt-3 text-lg text-ink-soft">
            Laporkan kekerasan terhadap perempuan dan anak di Kabupaten Bandung. Petugas akan menindaklanjuti laporan Anda dan menjaga kerahasiaannya.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-success-50 px-3 py-1.5 text-sm font-bold text-success">
            <Lock size={16} aria-hidden="true" />
            Data dirahasiakan
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/lapor"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-magenta-600 text-lg font-bold text-white shadow-card transition-colors hover:bg-magenta-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-magenta-100"
            >
              <FilePenLine size={22} aria-hidden="true" />
              Buat Laporan
            </Link>
            <Link
              href="/cek-tiket"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface text-lg font-bold text-navy-800 transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
            >
              <Ticket size={22} aria-hidden="true" />
              Cek Tiket
            </Link>
          </div>
        </section>

        {kontak.length > 0 && (
          <section aria-labelledby="judul-kontak" className="px-4 pb-10 pt-6">
            <h2 id="judul-kontak" className="mb-4 text-xl font-extrabold text-navy-900">
              Kontak darurat aktif
            </h2>
            <ul className="flex flex-col gap-4">
              {kontak.map((k) => (
                <li key={k.id} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
                  <p className="font-bold text-navy-900">{k.instansi}</p>
                  <p className="mt-1 flex items-start gap-2 text-sm text-ink-soft">
                    <MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-mute" />
                    {k.alamat}
                  </p>
                  <a
                    href={`tel:${k.telepon.replace(/[^\d+]/g, "")}`}
                    className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-50 font-bold text-navy-800 transition-colors hover:bg-blue-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                  >
                    <Phone size={18} aria-hidden="true" />
                    Telepon {k.telepon}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
