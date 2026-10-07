"use client";

import { CheckCircle2, ClipboardCheck, Info, XCircle } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { LencanaLaporan, type StatusLaporanUi } from "@/components/lencana-laporan";
import { Galat, Modal, fokus, tombolNetral, tombolUtama } from "@/components/ui-form";
import { ALASAN_MAKS, ALASAN_MIN } from "@/lib/verifikasi";
import { tolak, verifikasi, type AksiVerifikasi } from "../actions";

type Props = {
  id: string;
  kode: string;
  status: StatusLaporanUi;
  verifikator: string | null;
  diverifikasiPada: string | null;
  alasanPenolakan: string | null;
};

function ModalTolak({ id, kode, onTutup }: { id: string; kode: string; onTutup: () => void }) {
  const [state, aksi, pending] = useActionState(tolak, undefined as AksiVerifikasi);
  useEffect(() => {
    if (state?.ok) onTutup();
  }, [state, onTutup]);

  return (
    <Modal
      idJudul="judul-tolak"
      idSubjudul="subjudul-tolak"
      ikon={XCircle}
      warna="coral"
      judul="Tolak laporan"
      subjudul={`Laporan ${kode} akan ditandai ditolak. Alasan dicatat dan tidak dapat diubah.`}
      onTutup={onTutup}
    >
      <form action={aksi} noValidate className="mt-5">
        <input type="hidden" name="id" value={id} />
        <label htmlFor="alasan" className="mb-2 block text-sm font-bold">
          Alasan penolakan <span className="text-error">*</span>
        </label>
        <textarea
          id="alasan"
          name="alasan"
          rows={4}
          required
          minLength={ALASAN_MIN}
          maxLength={ALASAN_MAKS}
          defaultValue={state?.alasan ?? ""}
          aria-invalid={state?.pesan ? true : undefined}
          aria-describedby={state?.pesan ? "galat-alasan" : undefined}
          className="w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-base text-ink focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 aria-[invalid=true]:border-error aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-error-50"
        />
        <p className="mt-1 text-sm text-ink-mute">Jelaskan singkat mengapa laporan tidak dapat diproses.</p>
        <div className="mt-2">
          <Galat id="galat-alasan" pesan={state?.pesan} />
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onTutup} className={tombolNetral}>
            Batal
          </button>
          <button
            type="submit"
            disabled={pending}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-error px-6 font-bold text-white shadow-card transition-colors hover:bg-[#a8281d] disabled:bg-line-strong disabled:shadow-none ${fokus}`}
          >
            <XCircle size={18} aria-hidden="true" />
            Tolak laporan
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function PanelVerifikasi({ id, kode, status, verifikator, diverifikasiPada, alasanPenolakan }: Props) {
  const [stateV, aksiV, pendingV] = useActionState(verifikasi, undefined as AksiVerifikasi);
  const [tolakBuka, setTolakBuka] = useState(false);
  const menunggu = status === "BARU";

  return (
    <aside aria-labelledby="h-verifikasi" className="rounded-2xl border border-line bg-surface p-5 shadow-card lg:sticky lg:top-24">
      <h2 id="h-verifikasi" className="mb-3 flex items-center gap-2 text-lg font-bold text-navy-900">
        <ClipboardCheck size={20} aria-hidden="true" className="text-magenta-600" />
        Verifikasi
      </h2>

      <div className="mb-4">
        <LencanaLaporan status={status} />
      </div>

      {menunggu ? (
        <>
          <p className="mb-4 text-sm text-ink-soft">
            Periksa isi laporan dan dokumen di samping. Laporan terverifikasi akan siap dijadwalkan pendampingannya.
          </p>
          <form action={aksiV}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" disabled={pendingV} className={`${tombolUtama} w-full`}>
              <CheckCircle2 size={20} aria-hidden="true" />
              Verifikasi laporan
            </button>
          </form>
          <button
            type="button"
            onClick={() => setTolakBuka(true)}
            className={`${tombolNetral} mt-3 w-full border-error-50 text-error hover:bg-error-50`}
          >
            <XCircle size={20} aria-hidden="true" />
            Tolak laporan
          </button>
          <div className="mt-3">
            <Galat id="galat-verifikasi" pesan={stateV?.pesan} />
          </div>
        </>
      ) : (
        <dl className="flex flex-col gap-3 text-sm">
          {verifikator && (
            <div>
              <dt className="font-semibold text-ink-soft">Diperiksa oleh</dt>
              <dd className="text-ink">{verifikator}</dd>
            </div>
          )}
          {diverifikasiPada && (
            <div>
              <dt className="font-semibold text-ink-soft">Waktu</dt>
              <dd className="text-ink">{diverifikasiPada}</dd>
            </div>
          )}
          {alasanPenolakan && (
            <div>
              <dt className="font-semibold text-ink-soft">Alasan penolakan</dt>
              <dd className="whitespace-pre-wrap break-words text-ink">{alasanPenolakan}</dd>
            </div>
          )}
          {status === "TERVERIFIKASI" && (
            <p className="flex items-start gap-2 rounded-xl bg-info-50 p-3 text-info">
              <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              Langkah berikutnya: tentukan pendamping dan jadwal pada fitur Tiket dan Jadwal.
            </p>
          )}
        </dl>
      )}

      {tolakBuka && <ModalTolak id={id} kode={kode} onTutup={() => setTolakBuka(false)} />}
    </aside>
  );
}
