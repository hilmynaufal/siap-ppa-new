"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/** Peristiwa untuk memulai bilah dari kode klien yang berpindah halaman sendiri (mis. router.replace pada penyaring). */
export const PERISTIWA_NAVIGASI = "siap:navigasi-mulai";
export const mulaiProgresNavigasi = () => window.dispatchEvent(new Event(PERISTIWA_NAVIGASI));

const BATAS_MS = 15000;

/**
 * Bilah kemajuan tipis di tepi atas saat berpindah halaman. App Router tidak punya peristiwa navigasi,
 * jadi bilah dimulai saat tautan internal diklik (atau tombol maju/mundur ditekan) dan diselesaikan
 * ketika alamat halaman berubah. Tanpa pustaka tambahan.
 */
export function ProgresNavigasi() {
  const path = usePathname();
  const query = useSearchParams().toString();
  const [lebar, setLebar] = useState(0);
  const [tampil, setTampil] = useState(false);
  const jalan = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const batas = useRef<ReturnType<typeof setTimeout> | null>(null);
  const awal = useRef(true);

  const berhenti = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    if (batas.current) clearTimeout(batas.current);
    timer.current = null;
    batas.current = null;
  }, []);

  const selesai = useCallback(() => {
    if (!jalan.current) return;
    jalan.current = false;
    berhenti();
    setLebar(100);
    setTimeout(() => {
      setTampil(false);
      setLebar(0);
    }, 260);
  }, [berhenti]);

  const mulai = useCallback(() => {
    if (jalan.current) return;
    jalan.current = true;
    setTampil(true);
    setLebar(8);
    // Merayap mendekati 90% agar terasa bergerak tanpa pernah tampak selesai sebelum halaman tiba.
    timer.current = setInterval(() => setLebar((w) => w + (90 - w) * 0.07), 180);
    batas.current = setTimeout(selesai, BATAS_MS);
  }, [selesai]);

  // Alamat berubah berarti halaman tujuan sudah tampil.
  useEffect(() => {
    if (awal.current) {
      awal.current = false;
      return;
    }
    // Timer (bukan rAF): rAF berhenti di tab yang tidak terlihat sehingga bilah bisa tertahan.
    const id = setTimeout(selesai, 0);
    return () => clearTimeout(id);
  }, [path, query, selesai]);

  useEffect(() => {
    const klik = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) return;
      const u = new URL(a.href, window.location.href);
      if (u.origin !== window.location.origin) return;
      // Tujuan sama dengan halaman sekarang: tidak ada perpindahan yang perlu ditunggu.
      if (u.pathname === window.location.pathname && u.search === window.location.search) return;
      mulai();
    };
    window.addEventListener("click", klik, true);
    window.addEventListener("popstate", mulai);
    window.addEventListener(PERISTIWA_NAVIGASI, mulai);
    return () => {
      window.removeEventListener("click", klik, true);
      window.removeEventListener("popstate", mulai);
      window.removeEventListener(PERISTIWA_NAVIGASI, mulai);
      berhenti();
    };
  }, [mulai, berhenti]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]" role="progressbar" aria-label="Memuat halaman" aria-hidden={!tampil} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(lebar)}>
      <div
        className="h-full rounded-r-full bg-magenta-600 shadow-[0_0_8px_rgb(214_36_124_/_0.6)] transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${lebar}%`, opacity: tampil ? 1 : 0 }}
      />
    </div>
  );
}
