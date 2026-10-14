"use client";

import { Printer } from "lucide-react";

/** Tombol cetak untuk halaman pamflet; disembunyikan saat dicetak lewat kelas `tanpa-cetak`. */
export function TombolCetak() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="tanpa-cetak inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 font-bold text-white shadow-card transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
    >
      <Printer size={18} aria-hidden="true" />
      Cetak pamflet
    </button>
  );
}
