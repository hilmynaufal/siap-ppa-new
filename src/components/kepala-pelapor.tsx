import { ArrowLeft, Phone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { IkonKotak } from "./ikon-kotak";

/** Header halaman Pelapor (mobile first). `kembaliHref` menampilkan panah kembali dan judul halaman. */
export function KepalaPelapor({
  judul,
  kembaliHref,
  telepon,
}: {
  judul?: string;
  kembaliHref?: string;
  /** Nomor kontak darurat aktif; tombol Darurat disembunyikan bila belum ada. */
  telepon?: string | null;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between gap-3 px-4">
        {kembaliHref ? (
          <Link
            href={kembaliHref}
            aria-label="Kembali ke beranda"
            className="flex min-w-0 items-center gap-1 rounded-xl py-2 pr-2 text-navy-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
          >
            <span className="grid h-11 w-11 place-items-center">
              <ArrowLeft size={22} aria-hidden="true" />
            </span>
            <span className="truncate text-lg font-extrabold">{judul}</span>
          </Link>
        ) : (
          <Link href="/" className="flex min-w-0 items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
            <IkonKotak ikon={ShieldCheck} warna="magenta" ukuran="md" />
            <span className="min-w-0">
              <span className="block font-extrabold leading-tight text-navy-900">SIAP PPA</span>
              <span className="block truncate text-xs text-ink-mute">DALDUK PPA Kab. Bandung</span>
            </span>
          </Link>
        )}
        {telepon && (
          <a
            href={`tel:${telepon.replace(/[^\d+]/g, "")}`}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-emergency px-4 font-bold text-white transition-colors hover:bg-emergency-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-error-50"
          >
            <Phone size={18} aria-hidden="true" />
            Darurat
          </a>
        )}
      </div>
    </header>
  );
}
