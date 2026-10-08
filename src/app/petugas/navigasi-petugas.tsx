"use client";

import { CalendarClock, Ticket } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEM = [
  { href: "/petugas", label: "Antrean hari ini", ikon: Ticket },
  { href: "/petugas/jadwal", label: "Jadwal hari ini", ikon: CalendarClock },
];

/** Menu Petugas: hanya dua halaman. */
export function NavigasiPetugas() {
  const path = usePathname();
  return (
    <nav aria-label="Menu Petugas" className="flex gap-2 overflow-x-auto border-b border-line bg-surface px-4 py-2 md:px-8">
      {ITEM.map((i) => {
        const aktif = path === i.href;
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={aktif ? "page" : undefined}
            className={
              "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 " +
              (aktif ? "bg-navy-900 text-white" : "text-ink hover:bg-blue-50")
            }
          >
            <i.ikon size={18} aria-hidden="true" />
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
