import { Hourglass } from "lucide-react";
import Link from "next/link";
import { IkonKotak } from "@/components/ikon-kotak";
import { KepalaPelapor } from "@/components/kepala-pelapor";
import { db } from "@/lib/db";
import { kontakDaruratAktif } from "@/lib/kontak-darurat";

export const metadata = { title: "Cek Tiket | SIAP PPA" };
export const dynamic = "force-dynamic";

// Halaman sementara: pengecekan tiket dikerjakan pada kartu Penerbitan Tiket & Jadwal Layanan.
export default async function HalamanCekTiket() {
  const kontak = await kontakDaruratAktif(db, 1);
  return (
    <div className="min-h-screen bg-surface">
      <KepalaPelapor judul="Cek Tiket" kembaliHref="/" telepon={kontak[0]?.telepon} />
      <main className="mx-auto max-w-md px-4 py-8">
        <div className="flex items-start gap-4 rounded-2xl border border-line bg-canvas p-5">
          <IkonKotak ikon={Hourglass} warna="amber" ukuran="md" />
          <div>
            <h1 className="text-lg font-bold text-navy-900">Segera hadir</h1>
            <p className="mt-1 text-ink-soft">
              Pengecekan tiket dengan kode pendaftaran sedang disiapkan. Simpan kode pendaftaran Anda dengan baik.
            </p>
            <Link href="/" className="mt-4 inline-flex h-11 items-center rounded-xl px-1 font-bold text-blue-600 hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
              Kembali ke beranda
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
