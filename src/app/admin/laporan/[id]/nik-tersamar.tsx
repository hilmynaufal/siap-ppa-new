"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import type { PihakNik } from "@/lib/nik-akses";
import { tampilkanNik } from "../actions";

const DETIK_TAMPIL = 30;

const kelompok = (nik: string) => nik.replace(/(\d{4})(?=\d)/g, "$1 ");

/** NIK tersamar dengan tombol Tampilkan. Membuka NIK dicatat di audit; tampilan menutup sendiri setelah 30 detik. */
export function NikTersamar({ laporanId, pihak, tersamar, ada }: { laporanId: string; pihak: PihakNik; tersamar: string; ada: boolean }) {
  const [nik, setNik] = useState<string | null>(null);
  const [sisa, setSisa] = useState(0);
  const [galat, setGalat] = useState<string | null>(null);
  const [pending, mulai] = useTransition();

  useEffect(() => {
    if (!nik) return;
    const id = setInterval(() => {
      setSisa((s) => {
        if (s <= 1) {
          setNik(null);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [nik]);

  function buka() {
    setGalat(null);
    mulai(async () => {
      const h = await tampilkanNik(laporanId, pihak);
      if (h.ok) {
        setNik(h.nik);
        setSisa(DETIK_TAMPIL);
      } else setGalat(h.pesan);
    });
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="inline-flex items-center gap-2 tabular-nums" data-testid={`nik-${pihak.toLowerCase()}`}>
        <Lock size={14} aria-hidden="true" className="text-ink-mute" />
        {nik ? kelompok(nik) : tersamar}
      </span>
      {ada && (
        <button
          type="button"
          onClick={nik ? () => setNik(null) : buka}
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:opacity-60"
        >
          {nik ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          {nik ? `Sembunyikan (${sisa}d)` : "Tampilkan"}
        </button>
      )}
      {galat && (
        <span role="alert" className="text-sm font-medium text-error">
          {galat}
        </span>
      )}
      {!nik && ada && <span className="sr-only">Membuka NIK utuh dicatat dalam audit log.</span>}
    </span>
  );
}
