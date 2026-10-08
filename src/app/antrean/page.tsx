import { Monitor } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { layarPublik, opsiAntrean } from "@/lib/antrean";
import { LayarAntrean } from "./layar-antrean";

export const metadata = { title: "Layar Antrean | SIAP PPA" };
export const dynamic = "force-dynamic";

/** Layar antrean publik untuk TV lobi (tanpa masuk). Tanpa pilihan lokasi dan layanan, tampil daftar tautan layar. */
export default async function HalamanAntreanPublik({ searchParams }: { searchParams: Promise<{ lokasi?: string; jenis?: string }> }) {
  const q = await searchParams;
  const awal = q.lokasi && q.jenis ? await layarPublik(db, q.lokasi, q.jenis) : null;
  if (awal && q.lokasi && q.jenis) return <LayarAntrean lokasiId={q.lokasi} jenisId={q.jenis} awal={awal} />;

  const { lokasi, jenis } = await opsiAntrean(db);
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 flex items-center gap-3 text-2xl font-extrabold text-navy-900">
        <Monitor size={28} aria-hidden="true" />
        Layar antrean
      </h1>
      <p className="mb-6 text-ink-soft">Pilih lokasi dan layanan untuk ditampilkan di layar lobi. Layar hanya menampilkan nomor, tanpa nama.</p>
      {q.lokasi && q.jenis && <p className="mb-6 rounded-xl bg-error-50 p-4 font-semibold text-error">Lokasi atau layanan tidak ditemukan.</p>}
      <ul className="flex flex-col gap-3">
        {lokasi.flatMap((l) =>
          jenis.map((j) => (
            <li key={`${l.id}-${j.id}`}>
              <Link href={`/antrean?lokasi=${l.id}&jenis=${j.id}`} className="flex min-h-14 flex-col justify-center rounded-xl border border-line bg-surface px-5 py-3 hover:bg-blue-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
                <span className="font-bold text-ink">{j.nama}</span>
                <span className="text-sm text-ink-soft">{l.nama}</span>
              </Link>
            </li>
          )),
        )}
      </ul>
    </main>
  );
}
