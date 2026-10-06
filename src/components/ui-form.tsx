"use client";

import { AlertCircle, Save, X, type LucideIcon } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { IkonKotak, type WarnaIkon } from "./ikon-kotak";

// Gaya dan kerangka formulir/modal bersama untuk halaman Admin (tombol, input, galat, modal).
export const fokus = "focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100";
export const input =
  "h-12 w-full rounded-xl border border-line-strong bg-surface px-4 text-base text-ink focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 aria-[invalid=true]:border-error aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-error-50";
export const tombolUtama = `inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-magenta-600 px-6 font-bold text-white shadow-card transition-colors hover:bg-magenta-700 disabled:bg-line-strong disabled:shadow-none ${fokus}`;
export const tombolNetral = `inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-5 font-bold text-ink transition-colors hover:bg-blue-50 ${fokus}`;
export const tombolKecil = `inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors ${fokus}`;

export function Galat({ id, pesan }: { id: string; pesan?: string }) {
  if (!pesan) return null;
  return (
    <p id={id} role="alert" className="flex items-center gap-2 text-sm font-medium text-error">
      <AlertCircle size={16} aria-hidden="true" className="shrink-0" />
      {pesan}
    </p>
  );
}

export function useTutupDenganEsc(onTutup: () => void) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onTutup();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onTutup]);
}

/** Kerangka modal: ikon, judul, subjudul, tombol tutup; Esc menutup. */
export function Modal({
  idJudul,
  idSubjudul,
  ikon,
  warna,
  judul,
  subjudul,
  onTutup,
  children,
}: {
  idJudul: string;
  idSubjudul: string;
  ikon: LucideIcon;
  warna: WarnaIkon;
  judul: string;
  subjudul: string;
  onTutup: () => void;
  children: ReactNode;
}) {
  useTutupDenganEsc(onTutup);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idJudul}
        aria-describedby={idSubjudul}
        className="w-full max-w-[520px] rounded-2xl bg-surface p-6 shadow-modal"
      >
        <div className="flex items-start gap-4">
          <IkonKotak ikon={ikon} warna={warna} ukuran="lg" />
          <div className="min-w-0 flex-1">
            <h2 id={idJudul} className="text-lg font-bold text-navy-900">
              {judul}
            </h2>
            <p id={idSubjudul} className="mt-0.5 text-sm text-ink-soft">
              {subjudul}
            </p>
          </div>
          <button
            type="button"
            onClick={onTutup}
            aria-label="Tutup"
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-blue-50 ${fokus}`}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function TombolModal({ onTutup, pending }: { onTutup: () => void; pending: boolean }) {
  return (
    <div className="mt-5 flex flex-wrap justify-end gap-3">
      <button type="button" onClick={onTutup} className={tombolNetral}>
        <X size={18} aria-hidden="true" />
        Batal
      </button>
      <button type="submit" disabled={pending} className={tombolUtama}>
        <Save size={18} aria-hidden="true" />
        Simpan
      </button>
    </div>
  );
}

