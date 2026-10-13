"use client";

import { CheckCircle2, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { bacaKodeTersimpan, hapusKodeTersimpan, simpanKode } from "@/lib/kode-tersimpan";

export function SalinKode({ kode }: { kode: string }) {
  const [tersalin, setTersalin] = useState(false);
  const [ingat, setIngat] = useState(false);
  const [gagalSimpan, setGagalSimpan] = useState(false);

  useEffect(() => {
    // Membaca penyimpanan browser hanya mungkin setelah tampil di klien.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIngat(bacaKodeTersimpan() === kode);
  }, [kode]);

  function ubahIngat(nilai: boolean) {
    if (nilai) {
      const ok = simpanKode(kode);
      setGagalSimpan(!ok);
      setIngat(ok);
    } else {
      hapusKodeTersimpan();
      setGagalSimpan(false);
      setIngat(false);
    }
  }

  async function salin() {
    try {
      await navigator.clipboard.writeText(kode);
      setTersalin(true);
      setTimeout(() => setTersalin(false), 3000);
    } catch {
      // Salin otomatis tidak didukung: kode tetap terlihat dan bisa disalin manual.
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={salin}
        className={"inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-magenta-600 px-6 font-bold text-white shadow-card transition-colors hover:bg-magenta-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-magenta-100" + (tersalin ? "" : " napas")}
      >
        <Copy size={18} aria-hidden="true" />
        Salin kode
      </button>
      <p role="status" aria-live="polite" className="min-h-6">
        {tersalin && (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-success">
            <CheckCircle2 size={16} aria-hidden="true" />
            Kode berhasil disalin
          </span>
        )}
      </p>
      <label className="mt-3 flex w-full cursor-pointer items-start gap-3 rounded-xl border border-line-strong bg-surface p-3 text-left has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-blue-100">
        <input type="checkbox" checked={ingat} onChange={(e) => ubahIngat(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-blue-600" />
        <span className="text-sm text-ink">
          <span className="font-semibold">Ingat kode di perangkat ini</span>
          <span className="mt-0.5 block text-ink-soft">Agar mudah dibuka lagi di Cek Tiket; terhapus otomatis setelah 3 hari. Jangan dicentang bila HP atau komputer ini dipakai bersama orang lain.</span>
        </span>
      </label>
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-error">
        {gagalSimpan && "Browser ini tidak mengizinkan penyimpanan. Salin dan simpan kodenya sendiri."}
      </p>
    </>
  );
}
