"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

// Hanya menu yang halamannya sudah ada; menu lain ditambahkan di kartu fitur masing-masing.
const GRUP: { judul?: string; item: Item[] }[] = [
  { item: [{ href: "/admin", label: "Beranda" }] },
  { judul: "Data master", item: [{ href: "/admin/jenis-kekerasan", label: "Jenis Kekerasan" }] },
];

export function NavigasiAdmin() {
  const path = usePathname();
  return (
    <nav aria-label="Menu Admin" className="flex flex-col gap-5 p-4">
      {GRUP.map((g, i) => (
        <div key={i} className="flex flex-col gap-1">
          {g.judul && (
            <p className="px-3 pb-1 text-xs font-bold uppercase tracking-wide text-[#66637A]">{g.judul}</p>
          )}
          {g.item.map((it) => {
            const aktif = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={aktif ? "page" : undefined}
                className={
                  "flex h-11 items-center rounded-[10px] px-3 font-semibold focus:outline-none focus:ring-[3px] focus:ring-[#D9D3F7] " +
                  (aktif ? "bg-[#EEEBFB] text-[#46379E]" : "text-[#4A4859] hover:bg-[#F7F6FB]")
                }
              >
                {it.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
