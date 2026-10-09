"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavigasiAdmin } from "./navigasi-admin";

export const COOKIE_SIDEBAR = "siap_sidebar";

const LEBAR_LEBAR = 264;
const LEBAR_RAIL = 72;
/** Jeda sebelum rail terbentang saat kursor masuk, agar tidak berkedip ketika kursor sekadar lewat. */
const JEDA_MASUK_MS = 120;

/**
 * Sidebar Admin yang dapat dilipat menjadi rail ikon; status diingat lewat cookie agar tidak berkedip saat dimuat ulang.
 * Saat berupa rail, sidebar terbentang sementara (menimpa isi halaman tanpa menggesernya) selama kursor atau fokus papan tombol
 * ada di dalamnya, lalu kembali menjadi rail. Tombol bentang/ciutkan ada di bawah.
 */
export function SidebarAdmin({ awalKolaps, jumlahBaru = 0 }: { awalKolaps: boolean; jumlahBaru?: number }) {
  const [kolaps, setKolaps] = useState(awalKolaps);
  const [sementara, setSementara] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function buka() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSementara(true), JEDA_MASUK_MS);
  }
  function tutup() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setSementara(false);
  }

  function alihkan() {
    const baru = !kolaps;
    setKolaps(baru);
    // Kursor masih di atas tombol: biarkan rail benar-benar menciut sampai kursor keluar lalu masuk lagi.
    if (baru) tutup();
    document.cookie = `${COOKIE_SIDEBAR}=${baru ? "kolaps" : "lebar"}; path=/; max-age=31536000; samesite=lax`;
  }

  const terbentang = !kolaps || sementara;
  const Ikon = kolaps ? PanelLeftOpen : PanelLeftClose;
  const label = kolaps ? "Bentangkan menu" : "Ciutkan menu";

  return (
    // Penahan lebar tetap: tinggi dan lebarnya tidak berubah saat rail terbentang sementara, jadi isi halaman tidak bergeser.
    <div
      className="sticky top-[4.5rem] z-30 hidden h-[calc(100vh-4.5rem)] shrink-0 self-start transition-[width] duration-200 ease-out motion-reduce:transition-none md:block"
      style={{ width: kolaps ? LEBAR_RAIL : LEBAR_LEBAR }}
    >
      <aside
        data-kolaps={kolaps}
        data-sementara={kolaps && sementara}
        onMouseEnter={kolaps ? buka : undefined}
        onMouseLeave={tutup}
        onFocus={kolaps ? () => setSementara(true) : undefined}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) tutup();
        }}
        className={
          "absolute inset-y-0 left-0 flex flex-col overflow-hidden bg-navy-900 transition-[width,box-shadow] duration-200 ease-out motion-reduce:transition-none " +
          (kolaps && sementara ? "shadow-modal" : "")
        }
        style={{ width: terbentang ? LEBAR_LEBAR : LEBAR_RAIL }}
      >
        <div className="gulir-gelap min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-3">
          <NavigasiAdmin kolaps={!terbentang} jumlahBaru={jumlahBaru} />
        </div>
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={alihkan}
            aria-expanded={!kolaps}
            aria-label={label}
            title={terbentang ? undefined : label}
            className={
              "flex h-11 w-full items-center rounded-xl text-sm font-semibold text-blue-100 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100/60 " +
              (terbentang ? "px-3" : "justify-center")
            }
          >
            <Ikon size={20} aria-hidden="true" className="shrink-0" />
            <span
              aria-hidden="true"
              className={
                "overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-200 ease-out motion-reduce:transition-none " +
                (terbentang ? "ml-3 max-w-[12rem] opacity-100" : "ml-0 max-w-0 opacity-0")
              }
            >
              {label}
            </span>
          </button>
        </div>
      </aside>
    </div>
  );
}
