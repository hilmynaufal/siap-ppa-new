"use client";

import { Info, Trash2, TriangleAlert, X } from "lucide-react";
import { useActionState, useEffect, useTransition, type ReactNode } from "react";
import { Galat, fokus, tombolNetral, useTutupDenganEsc } from "./ui-form";

/** Bentuk hasil aksi server untuk halaman data master. */
export type AksiMaster =
  | { ok?: boolean; pesan?: string; galat?: Record<string, string>; nilai?: Record<string, string>; kataSandi?: string; email?: string }
  | undefined;

/** Satu bidang formulir: label, petunjuk/galat di bawahnya. */
export function BidangForm({
  id,
  label,
  wajib = true,
  petunjuk,
  galat,
  children,
}: {
  id: string;
  label: string;
  wajib?: boolean;
  petunjuk?: string;
  galat?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-2 block text-sm font-bold">
        {label} {wajib && <span className="text-error">*</span>}
      </label>
      {children}
      <div className="mt-2 min-h-5">
        {galat ? (
          <Galat id={`${id}-galat`} pesan={galat} />
        ) : petunjuk ? (
          <p id={`${id}-petunjuk`} className="flex items-center gap-2 text-sm text-ink-mute">
            <Info size={16} aria-hidden="true" className="shrink-0" />
            {petunjuk}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Saklar aktif/nonaktif di tabel; memanggil `onAlih` lalu menyegarkan data lewat revalidate di server. */
export function SakelarAktif({ aktif, nama, onAlih }: { aktif: boolean; nama: string; onAlih: () => Promise<unknown> }) {
  const [pending, mulai] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={aktif}
      aria-label={`${aktif ? "Nonaktifkan" : "Aktifkan"} ${nama}`}
      disabled={pending}
      onClick={() => mulai(async () => void (await onAlih()))}
      className={
        "relative h-7 w-12 shrink-0 rounded-xl transition-colors duration-200 motion-reduce:transition-none disabled:opacity-60 " +
        fokus +
        " " +
        (aktif ? "bg-success" : "bg-line-strong")
      }
    >
      <span
        aria-hidden="true"
        className={
          "absolute top-0.5 h-6 w-6 rounded-lg bg-surface shadow-card transition-[left] duration-200 motion-reduce:transition-none " +
          (aktif ? "left-[22px]" : "left-0.5")
        }
      />
    </button>
  );
}

/** Konfirmasi hapus: `aksi` adalah server action yang menerima FormData berisi `id`. */
export function ModalHapus({
  id,
  judul,
  pesan,
  aksi,
  onTutup,
}: {
  id: string;
  judul: string;
  pesan: string;
  aksi: (s: AksiMaster, fd: FormData) => Promise<AksiMaster>;
  onTutup: () => void;
}) {
  const [state, kirim, pending] = useActionState(aksi, undefined as AksiMaster);
  useEffect(() => {
    if (state?.ok) onTutup();
  }, [state, onTutup]);
  useTutupDenganEsc(onTutup);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="judul-hapus" className="w-full max-w-[520px] rounded-2xl bg-surface p-6 shadow-modal">
        <div className="flex items-start gap-4">
          <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-error-50 text-error">
            <TriangleAlert size={26} />
          </span>
          <div>
            <h2 id="judul-hapus" className="text-lg font-bold text-navy-900">
              {judul}
            </h2>
            <p className="mt-1 text-ink-soft">{pesan}</p>
          </div>
        </div>
        <form action={kirim} className="mt-5">
          <input type="hidden" name="id" value={id} />
          <Galat id="galat-hapus" pesan={state?.pesan} />
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onTutup} className={tombolNetral} autoFocus>
              <X size={18} aria-hidden="true" />
              Batal
            </button>
            <button type="submit" disabled={pending} className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-error px-6 font-bold text-white transition-colors hover:bg-[#8f1c13] disabled:bg-line-strong ${fokus}`}>
              <Trash2 size={18} aria-hidden="true" />
              Hapus
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
