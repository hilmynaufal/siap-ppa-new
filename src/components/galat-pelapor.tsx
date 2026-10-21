"use client";

import { Phone, RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { IkonKotak } from "./ikon-kotak";
import { KepalaPelapor } from "./kepala-pelapor";
import { fokus } from "./ui-form";

/** Telepon kantor UPTD PPA (sama dengan kop BAP); tidak perlu basis data, sehingga tetap tampil saat server bermasalah. */
const TELEPON_UPTD = "(022) 5897180";

/**
 * Halaman galat untuk alur Pelapor (dipakai error.tsx). Menggantikan layar galat bawaan Next.js dengan pesan
 * yang menenangkan, tombol coba lagi, dan kontak yang bisa dihubungi bila laporan mendesak.
 */
export function GalatPelapor({ judul, error, reset }: { judul: string; error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface">
      <KepalaPelapor judul={judul} kembaliHref="/" />
      <main className="mx-auto max-w-md px-4 py-8">
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-line bg-canvas p-5">
          <IkonKotak ikon={TriangleAlert} warna="amber" ukuran="md" />
          <div>
            <h1 className="text-lg font-bold text-brand-900">Maaf, halaman ini sedang bermasalah</h1>
            <p className="mt-1 text-ink-soft">
              Server sedang sibuk atau baru diperbarui. Silakan coba lagi beberapa saat lagi. Bila Anda membutuhkan bantuan segera, hubungi UPTD PPA Kabupaten Bandung.
            </p>
            {error.digest && <p className="mt-2 text-xs text-ink-mute">Kode galat: {error.digest}</p>}
          </div>
          <div className="flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={`inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 font-bold text-white shadow-card transition-colors hover:bg-brand-700 ${fokus}`}
            >
              <RotateCcw size={18} aria-hidden="true" />
              Muat ulang halaman
            </button>
            <button type="button" onClick={reset} className={`inline-flex h-13 w-full items-center justify-center rounded-xl border border-line-strong bg-surface font-bold text-ink transition-colors hover:bg-brand-50 ${fokus}`}>
              Coba lagi tanpa memuat ulang
            </button>
            <a href={`tel:${TELEPON_UPTD.replace(/\D/g, "")}`} className={`inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface font-bold text-ink transition-colors hover:bg-brand-50 ${fokus}`}>
              <Phone size={18} aria-hidden="true" />
              Telepon UPTD PPA {TELEPON_UPTD}
            </a>
            <Link href="/kontak-darurat" className="text-center text-sm font-bold text-brand-700 underline">
              Lihat kontak darurat lainnya
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
