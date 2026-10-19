import { Trash2 } from "lucide-react";
import Link from "next/link";
import { AksiLaporanSampah } from "@/components/aksi-sampah";
import { Breadcrumb } from "@/components/breadcrumb";
import { IkonKotak } from "@/components/ikon-kotak";
import { LencanaLaporan } from "@/components/lencana-laporan";
import { db } from "@/lib/db";
import { daftarSampah } from "@/lib/sampah";

export const metadata = { title: "Sampah | SIAP PPA" };
export const dynamic = "force-dynamic";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).replace(".", ":");

export default async function HalamanSampah() {
  const sampah = await daftarSampah(db);
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb remah={[{ label: "Beranda", href: "/admin" }, { label: "Sampah" }]} />
      <div className="mb-6 flex items-center gap-4">
        <IkonKotak ikon={Trash2} warna="coral" ukuran="lg" />
        <div>
          <h1 className="text-2xl font-extrabold text-brand-900">Sampah</h1>
          <p className="mt-0.5 text-sm text-ink-soft">Laporan yang dihapus. Pulihkan untuk mengembalikannya, atau hapus permanen untuk menghapus data dan berkasnya selamanya.</p>
        </div>
      </div>

      {sampah.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-6 text-ink-soft shadow-card">Sampah kosong.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sampah.map((l) => (
            <li key={l.id} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/admin/laporan/${l.id}`} className="font-bold tabular-nums text-brand-800 underline focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100">
                    {l.kode}
                  </Link>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {l.korban ?? "Korban tidak diisi"} · {l.jenis} · masuk {fmt(l.dibuatPada)}
                  </p>
                </div>
                <LencanaLaporan status={l.status} />
              </div>
              <p className="mt-3 text-sm text-ink">
                Dihapus {fmt(l.dihapusPada)}
                {l.oleh && <> oleh {l.oleh}</>}
                {l.alasan && <span className="text-ink-soft"> · Alasan: {l.alasan}</span>}
              </p>
              <div className="mt-3">
                <AksiLaporanSampah id={l.id} kode={l.kode} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
