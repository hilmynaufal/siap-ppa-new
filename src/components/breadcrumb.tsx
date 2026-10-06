import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

export type Remah = { label: string; href?: string };

/** Jejak halaman; remah terakhir adalah halaman saat ini. */
export function Breadcrumb({ remah }: { remah: Remah[] }) {
  return (
    <nav aria-label="Jejak halaman" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {remah.map((r, i) => {
          const terakhir = i === remah.length - 1;
          return (
            <li key={r.label} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={16} aria-hidden="true" className="text-ink-mute" />}
              {terakhir || !r.href ? (
                <span aria-current={terakhir ? "page" : undefined} className="font-semibold text-navy-900">
                  {r.label}
                </span>
              ) : (
                <Link
                  href={r.href}
                  className="inline-flex items-center gap-1.5 rounded-lg font-medium text-ink-soft transition-colors hover:text-blue-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                >
                  {i === 0 && <Home size={16} aria-hidden="true" />}
                  {r.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
