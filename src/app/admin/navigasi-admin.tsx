"use client";

import { BriefcaseBusiness, CalendarDays, ContactRound, Handshake, HeartHandshake, Home, Inbox, Landmark, MapPinned, Shapes, UserRoundCog, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; ikon: LucideIcon };

// Hanya menu yang halamannya sudah ada; menu lain ditambahkan di kartu fitur masing-masing.
const GRUP: { judul?: string; item: Item[] }[] = [
  { item: [{ href: "/admin", label: "Beranda", ikon: Home }] },
  {
    judul: "Layanan",
    item: [
      { href: "/admin/laporan", label: "Laporan masuk", ikon: Inbox },
      { href: "/admin/jadwal", label: "Jadwal pendampingan", ikon: CalendarDays },
    ],
  },
  {
    judul: "Data master",
    item: [
      { href: "/admin/jenis-kekerasan", label: "Jenis Kekerasan", ikon: Shapes },
      { href: "/admin/kontak-darurat", label: "Kontak Darurat", ikon: ContactRound },
      { href: "/admin/jenis-pendampingan", label: "Jenis Pendampingan", ikon: HeartHandshake },
      { href: "/admin/lokasi", label: "Lokasi Layanan", ikon: MapPinned },
      { href: "/admin/pendamping", label: "Akun Pendamping", ikon: UserRoundCog },
      { href: "/admin/hubungan", label: "Hubungan dengan Korban", ikon: Handshake },
      { href: "/admin/pekerjaan", label: "Pekerjaan", ikon: BriefcaseBusiness },
      { href: "/admin/desa", label: "Desa/Kelurahan", ikon: Landmark },
    ],
  },
];

/** Menu Admin. Bila `kolaps`, hanya ikon yang tampak (rail); label tetap ada untuk pembaca layar dan tooltip. */
export function NavigasiAdmin({ kolaps = false }: { kolaps?: boolean }) {
  const path = usePathname();
  return (
    <nav aria-label="Menu Admin" className="flex flex-col gap-4 p-3">
      {GRUP.map((g, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          {g.judul && (
            <>
              <p
                aria-hidden={kolaps}
                className={
                  "overflow-hidden whitespace-nowrap px-3 text-xs font-bold uppercase tracking-wider text-blue-100/80 transition-[max-height,opacity,padding] duration-200 ease-out motion-reduce:transition-none " +
                  (kolaps ? "max-h-0 pb-0 opacity-0" : "max-h-6 pb-1 opacity-100")
                }
              >
                {g.judul}
              </p>
              <div
                aria-hidden="true"
                className={
                  "mx-3 h-px bg-white/15 transition-opacity duration-200 motion-reduce:transition-none " +
                  (kolaps ? "opacity-100" : "hidden opacity-0")
                }
              />
            </>
          )}
          {g.item.map((it) => {
            const aktif = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                title={kolaps ? it.label : undefined}
                aria-current={aktif ? "page" : undefined}
                className={
                  "flex min-h-11 items-center rounded-xl text-sm font-semibold text-white transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100/60 " +
                  (kolaps ? "justify-center px-0 " : "px-3 ") +
                  (aktif ? "bg-magenta-100/15" : "hover:bg-white/8")
                }
              >
                <it.ikon
                  size={20}
                  strokeWidth={2.25}
                  aria-hidden="true"
                  className={"shrink-0 " + (aktif ? "text-magenta-100" : "")}
                />
                <span
                  className={
                    "overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-200 ease-out motion-reduce:transition-none " +
                    (kolaps ? "ml-0 max-w-0 opacity-0" : "ml-3 max-w-[12rem] opacity-100")
                  }
                >
                  {it.label}
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
