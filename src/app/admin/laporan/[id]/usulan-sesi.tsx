"use client";

import { CalendarPlus, Inbox, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { Galat, Modal, fokus, tombolNetral, tombolUtama } from "@/components/ui-form";
import type { UsulanView } from "@/lib/laporan-pendampingan";
import { tolakUsulanAksi, type AksiSesi } from "../actions";
import { ModalTambah } from "./pendampingan-admin";
import type { OpsiJadwal } from "./panel-verifikasi";

const tgl = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const LABEL = { DISETUJUI: "Disetujui", DITOLAK: "Ditolak" } as const;

function ModalTolak({ laporanId, u, onTutup }: { laporanId: string; u: UsulanView; onTutup: () => void }) {
  const [state, aksi, pending] = useActionState(tolakUsulanAksi, undefined as AksiSesi);
  useEffect(() => {
    if (state?.ok) onTutup();
  }, [state, onTutup]);
  return (
    <Modal idJudul="judul-tolak-usulan" idSubjudul="sub-tolak-usulan" ikon={X} warna="coral" judul="Tolak usulan sesi lanjutan?" subjudul={`Usulan dari ${u.dari} ditolak dan Pendamping diberi tahu. Tindakan ini tidak dapat dibatalkan.`} onTutup={onTutup}>
      <form action={aksi} className="mt-5">
        <input type="hidden" name="id" value={laporanId} />
        <input type="hidden" name="usulanId" value={u.id} />
        <Galat id="galat-tolak-usulan" pesan={state?.pesan} />
        <div className="mt-4 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onTutup} className={tombolNetral} autoFocus>
            Batal
          </button>
          <button type="submit" disabled={pending} className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-error px-6 font-bold text-white shadow-card transition-colors hover:bg-[#a8281d] disabled:bg-line-strong disabled:shadow-none ${fokus}`}>
            Ya, tolak usulan
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Kartu usulan sesi lanjutan dari rekomendasi Pendamping: Admin menyetujui dan menjadwalkan, atau menolak. */
export function UsulanSesi({ laporanId, kode, usulan, opsi, bisaMemutuskan }: { laporanId: string; kode: string; usulan: UsulanView[]; opsi: OpsiJadwal; bisaMemutuskan: boolean }) {
  const [setuju, setSetuju] = useState<UsulanView | null>(null);
  const [tolak, setTolak] = useState<UsulanView | null>(null);
  const menunggu = usulan.filter((u) => u.status === "MENUNGGU");
  const putus = usulan.filter((u) => u.status !== "MENUNGGU");

  return (
    <section aria-labelledby="h-usulan" className="mb-6 rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="h-usulan" className="flex items-center gap-2 text-lg font-bold text-navy-900">
          <CalendarPlus size={20} aria-hidden="true" className="text-navy-700" />
          Usulan sesi lanjutan
        </h2>
        {menunggu.length > 0 && (
          <span className="grid h-7 min-w-7 place-items-center rounded-full bg-navy-700 px-2 text-sm font-bold text-white" aria-label={`${menunggu.length} usulan menunggu`}>
            {menunggu.length}
          </span>
        )}
      </div>

      {menunggu.length === 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-dashed border-line-strong p-4 text-sm text-ink-soft">
          <Inbox size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
          <p>
            <strong className="block text-ink">Belum ada usulan</strong>
            Usulan dari rekomendasi Pendamping akan muncul di sini.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-4">
        {menunggu.map((u) => (
          <li key={u.id} className="border-b border-line-soft pb-4 last:border-b-0 last:pb-0" data-testid="usulan-menunggu">
            <p className="font-bold text-ink">{u.jenis}</p>
            <p className="mb-2 text-sm text-ink-soft">
              Dari {u.dari} · Sesi {u.urutanSesi} · {tgl(u.tanggal)}
            </p>
            <p className="mb-3 whitespace-pre-wrap break-words rounded-xl bg-blue-50/60 px-4 py-3 text-ink">{u.rekomendasi}</p>
            {bisaMemutuskan ? (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setSetuju(u)} className={`${tombolUtama} !h-11 !px-4 text-sm`}>
                  Setujui dan jadwalkan
                </button>
                <button type="button" onClick={() => setTolak(u)} className={`inline-flex h-11 items-center rounded-xl border border-error bg-surface px-4 text-sm font-bold text-error hover:bg-error-50 ${fokus}`}>
                  Tolak
                </button>
              </div>
            ) : (
              <p className="text-sm text-ink-soft">Kasus sudah ditutup, usulan tidak dapat diputuskan.</p>
            )}
          </li>
        ))}
      </ul>

      {putus.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2 border-t border-line-soft pt-4 text-sm text-ink-soft" aria-label="Usulan yang sudah diputuskan">
          {putus.map((u) => (
            <li key={u.id}>
              {LABEL[u.status as keyof typeof LABEL]} · {u.jenis} dari {u.dari} (Sesi {u.urutanSesi})
            </li>
          ))}
        </ul>
      )}

      {setuju && <ModalTambah laporanId={laporanId} kode={kode} opsi={opsi} usulanId={setuju.id} awal={setuju.awal} onTutup={() => setSetuju(null)} />}
      {tolak && <ModalTolak laporanId={laporanId} u={tolak} onTutup={() => setTolak(null)} />}
    </section>
  );
}
