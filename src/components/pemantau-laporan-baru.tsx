"use client";

import { Bell, BellOff, BellRing } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { StatusLaporanBaru } from "@/lib/dasbor";
import { SELANG_PERIKSA_MS, adaLaporanLebihBaru, judulDenganJumlah, pesanNotifikasi } from "@/lib/notifikasi-laporan";

type Izin = NotificationPermission | "tidak-didukung";

/** Bunyi pendek dua nada lewat Web Audio (tanpa berkas suara). Diam bila browser menolak memutar. */
function bunyi() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [880, 1175].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.16);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.18);
      o.stop(ctx.currentTime + i * 0.18 + 0.18);
    });
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    // abaikan
  }
}

/**
 * Selama tab Admin terbuka, memeriksa laporan baru setiap 30 detik. Bila ada laporan yang lebih baru dari
 * pemeriksaan sebelumnya: notifikasi browser (bila diizinkan), bunyi singkat, dan halaman disegarkan.
 * Judul tab selalu memuat jumlah laporan yang menunggu verifikasi.
 */
export function PemantauLaporanBaru({ awal }: { awal: StatusLaporanBaru }) {
  const [izin, setIzin] = useState<Izin>("default");
  const [jumlah, setJumlah] = useState(awal.jumlah);
  const terakhir = useRef<StatusLaporanBaru>(awal);
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    // Izin hanya dapat dibaca di browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIzin(typeof Notification === "undefined" ? "tidak-didukung" : Notification.permission);
  }, []);

  // Judul halaman diganti Next.js setiap pindah atau segar halaman; jumlahnya diperiksa ulang tiap detik
  // (bukan MutationObserver pada <head>, yang dapat berbalas-balasan dengan pembaruan judul oleh Next.js).
  useEffect(() => {
    const pasang = () => {
      const target = judulDenganJumlah(document.title, jumlah);
      if (document.title !== target) document.title = target;
    };
    pasang();
    const id = setInterval(pasang, 1000);
    return () => clearInterval(id);
  }, [jumlah, path]);

  const periksa = useCallback(async () => {
    let s: StatusLaporanBaru;
    try {
      const res = await fetch("/admin/laporan-baru", { cache: "no-store", headers: { Accept: "application/json" } });
      if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return;
      s = await res.json();
    } catch {
      return;
    }
    const baru = adaLaporanLebihBaru(terakhir.current, s);
    terakhir.current = s;
    setJumlah(s.jumlah);
    if (!baru) return;
    bunyi();
    router.refresh();
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const p = pesanNotifikasi(s.jumlah);
      const n = new Notification(p.judul, { body: p.isi, icon: "/icon.png", tag: "siap-ppa-laporan-baru" });
      n.onclick = () => {
        window.focus();
        router.push("/admin/laporan");
        n.close();
      };
    }
  }, [router]);

  useEffect(() => {
    const id = setInterval(periksa, SELANG_PERIKSA_MS);
    return () => clearInterval(id);
  }, [periksa]);

  async function mintaIzin() {
    if (typeof Notification === "undefined") return;
    setIzin(await Notification.requestPermission());
  }

  const kelas =
    "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-ink transition-colors hover:bg-brand-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100";

  if (izin === "tidak-didukung") return null;
  if (izin === "granted") {
    return (
      <span className={kelas} title="Notifikasi laporan baru aktif selama tab ini terbuka" aria-label="Notifikasi laporan baru aktif">
        <BellRing size={18} aria-hidden="true" className="text-brand-700" />
      </span>
    );
  }
  if (izin === "denied") {
    return (
      <span className={kelas} title="Notifikasi diblokir. Izinkan lewat ikon gembok di bilah alamat Chrome." aria-label="Notifikasi laporan baru diblokir browser">
        <BellOff size={18} aria-hidden="true" className="text-ink-mute" />
      </span>
    );
  }
  return (
    <button type="button" onClick={mintaIzin} className={kelas} title="Tampilkan notifikasi Chrome saat laporan baru masuk">
      <Bell size={18} aria-hidden="true" className="text-brand-700" />
      <span className="hidden lg:inline">Aktifkan notifikasi</span>
    </button>
  );
}
