import { Phone, Ticket } from "lucide-react";
import Link from "next/link";
import { LogoSiap } from "@/components/logo-siap";

const NAV = [
  { href: "#layanan", teks: "Fitur" },
  { href: "#cara", teks: "Cara melapor" },
  { href: "#angka", teks: "Dalam angka" },
  { href: "#pendampingan", teks: "Layanan" },
  { href: "#lokasi", teks: "Lokasi" },
  { href: "#tanya", teks: "Tanya jawab" },
];

/** Header landing page: logo, navigasi bagian (layar lebar), Cek Tiket, dan tombol Darurat. */
export function KepalaBeranda({ telepon }: { telepon?: string | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100">
          <LogoSiap />
          <span className="min-w-0">
            <span className="block font-extrabold leading-tight text-brand-900">SIAP PPA</span>
            <span className="block truncate text-xs text-ink-mute">DALDUK PPA Kab. Bandung</span>
          </span>
        </Link>

        <nav aria-label="Bagian halaman" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  className="rounded-lg px-3 py-2 text-sm font-bold text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                >
                  {n.teks}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/cek-tiket"
            className="hidden h-11 items-center gap-2 rounded-xl px-3 font-bold text-brand-800 transition-colors hover:bg-brand-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 sm:inline-flex"
          >
            <Ticket size={18} aria-hidden="true" />
            Cek Tiket
          </Link>
          {telepon && (
            <a
              href={`tel:${telepon.replace(/[^\d+]/g, "")}`}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-emergency px-4 font-bold text-white transition-colors hover:bg-emergency-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-error-50"
            >
              <Phone size={18} aria-hidden="true" />
              Darurat
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
