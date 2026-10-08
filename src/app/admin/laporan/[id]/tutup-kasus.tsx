"use client";

import { CheckCircle2, Lock, LockKeyhole } from "lucide-react";
import { useActionState, useState } from "react";
import { Galat, Modal, tombolNetral, tombolUtama } from "@/components/ui-form";
import { tutupKasusAksi, type AksiSesi } from "../actions";

/** Kartu Tutup kasus: tombol aktif hanya bila semua sesi selesai; penutupan meminta konfirmasi. */
export function TutupKasus({ laporanId, kode, bisa, alasan, sudahDitutup }: { laporanId: string; kode: string; bisa: boolean; alasan: string[]; sudahDitutup: boolean }) {
  const [buka, setBuka] = useState(false);
  const [state, aksi, pending] = useActionState(tutupKasusAksi, undefined as AksiSesi);

  return (
    <section aria-labelledby="h-tutup" className="rounded-2xl border border-line bg-surface p-5 shadow-card lg:mt-6">
      <h2 id="h-tutup" className="mb-3 flex items-center gap-2 text-lg font-bold text-navy-900">
        <LockKeyhole size={20} aria-hidden="true" className="text-navy-700" />
        Tutup kasus
      </h2>
      {sudahDitutup ? (
        <p className="flex items-start gap-2 text-sm text-success">
          <CheckCircle2 size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          Kasus ini sudah ditutup.
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-soft">Kasus dapat ditutup setelah semua sesi selesai.</p>
          {!bisa && (
            <ul className="mb-3 list-disc pl-5 text-sm text-warning" data-testid="syarat-tutup">
              {alasan.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
          <button type="button" disabled={!bisa} onClick={() => setBuka(true)} className={`${tombolUtama} w-full`}>
            <Lock size={18} aria-hidden="true" />
            Tutup kasus
          </button>
        </>
      )}
      {buka && !state?.ok && (
        <Modal idJudul="judul-tutup" idSubjudul="sub-tutup" ikon={LockKeyhole} warna="navy" judul="Tutup kasus?" subjudul={`Kasus ${kode} ditutup dan tidak dapat ditambah sesi atau diubah jadwalnya lagi.`} onTutup={() => setBuka(false)}>
          <form action={aksi} className="mt-5">
            <input type="hidden" name="id" value={laporanId} />
            <Galat id="galat-tutup" pesan={state?.pesan} />
            <div className="mt-4 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => setBuka(false)} className={tombolNetral} autoFocus>
                Batal
              </button>
              <button type="submit" disabled={pending} className={tombolUtama}>
                <Lock size={18} aria-hidden="true" />
                Ya, tutup kasus
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
