"use client";

import { CheckCircle2, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { simpanKode } from "@/lib/kode-tersimpan";

export function SalinKode({ kode }: { kode: string }) {
  const [tersalin, setTersalin] = useState(false);

  // Kode diingat di perangkat ini (berlaku 1 hari) agar mudah dibuka lagi di Cek Tiket. Gagal diam-diam bila penyimpanan ditolak.
  useEffect(() => {
    simpanKode(kode);
  }, [kode]);

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
        className={"inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 font-bold text-white shadow-card transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100" + (tersalin ? "" : " napas")}
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
    </>
  );
}
