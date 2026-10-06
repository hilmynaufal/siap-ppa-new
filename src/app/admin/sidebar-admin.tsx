"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { NavigasiAdmin } from "./navigasi-admin";

export const COOKIE_SIDEBAR = "siap_sidebar";

/** Sidebar Admin yang dapat dilipat menjadi rail ikon; status diingat lewat cookie agar tidak berkedip saat dimuat ulang. */
export function SidebarAdmin({ awalKolaps }: { awalKolaps: boolean }) {
  const [kolaps, setKolaps] = useState(awalKolaps);

  function alihkan() {
    const baru = !kolaps;
    setKolaps(baru);
    document.cookie = `${COOKIE_SIDEBAR}=${baru ? "kolaps" : "lebar"}; path=/; max-age=31536000; samesite=lax`;
  }

  const Ikon = kolaps ? PanelLeftOpen : PanelLeftClose;
  return (
    <aside
      data-kolaps={kolaps}
      className={
        "sticky top-[4.5rem] hidden h-[calc(100vh-4.5rem)] shrink-0 self-start overflow-y-auto overflow-x-hidden bg-navy-900 transition-[width] duration-200 ease-out motion-reduce:transition-none md:block " +
        (kolaps ? "w-[72px]" : "w-[264px]")
      }
    >
      <div className={"flex p-3 pb-0 " + (kolaps ? "justify-center" : "justify-end")}>
        <button
          type="button"
          onClick={alihkan}
          aria-expanded={!kolaps}
          aria-label={kolaps ? "Bentangkan menu" : "Ciutkan menu"}
          title={kolaps ? "Bentangkan menu" : "Ciutkan menu"}
          className="grid h-11 w-11 place-items-center rounded-xl text-blue-100 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100/60"
        >
          <Ikon size={20} aria-hidden="true" />
        </button>
      </div>
      <NavigasiAdmin kolaps={kolaps} />
    </aside>
  );
}
