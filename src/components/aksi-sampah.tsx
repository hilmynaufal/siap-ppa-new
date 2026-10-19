"use client";

import { ArchiveRestore, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { hapusLaporanAksi, hapusPermanenAksi, pulihkanLaporanAksi, type AksiSampah } from "@/app/admin/laporan/actions";
import { ALASAN_HAPUS_MAKS, ALASAN_HAPUS_MIN } from "@/lib/aktif";
import { Galat, Modal, fokus, input, tombolKecil, tombolNetral } from "./ui-form";

const tombolBahaya = `inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-error px-6 font-bold text-white shadow-card transition-colors hover:bg-[#a8281d] disabled:bg-line-strong disabled:shadow-none ${fokus}`;
const kecilBahaya = `${tombolKecil} border-error-50 bg-error-50 text-error hover:bg-[#f9d7d3]`;

/** Tombol "Hapus" di detail laporan: memindahkan ke Sampah dengan alasan; server lalu mengalihkan ke daftar. */
export function TombolHapusLaporan({ id, kode }: { id: string; kode: string }) {
  const [buka, setBuka] = useState(false);
  const [state, aksi, pending] = useActionState(hapusLaporanAksi, undefined as AksiSampah);
  return (
    <>
      <button type="button" onClick={() => setBuka(true)} className={kecilBahaya}>
        <Trash2 size={18} aria-hidden="true" />
        Hapus
      </button>
      {buka && !state?.ok && (
        <Modal
          idJudul="judul-hapus"
          idSubjudul="sub-hapus"
          ikon={Trash2}
          warna="coral"
          judul="Pindahkan ke Sampah?"
          subjudul={`Laporan ${kode} beserta jadwal dan tiketnya disembunyikan dari semua daftar. Masih dapat dipulihkan dari menu Sampah.`}
          onTutup={() => setBuka(false)}
        >
          <form action={aksi} noValidate className="mt-5">
            <input type="hidden" name="id" value={id} />
            <label htmlFor="alasan-hapus" className="mb-2 block text-sm font-bold">
              Alasan menghapus <span className="text-error">*</span>
            </label>
            <textarea
              id="alasan-hapus"
              name="alasan"
              rows={3}
              required
              minLength={ALASAN_HAPUS_MIN}
              maxLength={ALASAN_HAPUS_MAKS}
              placeholder="Mis. laporan ganda, laporan uji, atau permintaan pelapor."
              aria-invalid={state?.pesan ? true : undefined}
              aria-describedby={state?.pesan ? "galat-hapus" : undefined}
              className={input + " h-auto py-3"}
            />
            <div className="mt-2">
              <Galat id="galat-hapus" pesan={state?.pesan} />
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => setBuka(false)} className={tombolNetral} autoFocus>
                Batal
              </button>
              <button type="submit" disabled={pending} className={tombolBahaya}>
                <Trash2 size={18} aria-hidden="true" />
                Pindahkan ke Sampah
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

/** Pulihkan dan Hapus permanen untuk laporan di Sampah. Dengan `dariDetail`, setelah hapus permanen server mengalihkan ke Sampah. */
export function AksiLaporanSampah({ id, kode, dariDetail = false }: { id: string; kode: string; dariDetail?: boolean }) {
  const [pulih, aksiPulih, pendingPulih] = useActionState(pulihkanLaporanAksi, undefined as AksiSampah);
  const [hapus, aksiHapus, pendingHapus] = useActionState(hapusPermanenAksi, undefined as AksiSampah);
  const [buka, setBuka] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={aksiPulih}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" disabled={pendingPulih} className={`${tombolKecil} border-brand-600 bg-surface text-brand-800 hover:bg-brand-50`}>
          <ArchiveRestore size={16} aria-hidden="true" />
          {pendingPulih ? "Memulihkan..." : "Pulihkan"}
        </button>
      </form>
      <button type="button" onClick={() => setBuka(true)} className={kecilBahaya}>
        <Trash2 size={16} aria-hidden="true" />
        Hapus permanen
      </button>
      <Galat id={`galat-pulih-${id}`} pesan={pulih?.pesan} />
      {buka && !hapus?.ok && (
        <Modal
          idJudul="judul-permanen"
          idSubjudul="sub-permanen"
          ikon={Trash2}
          warna="coral"
          judul="Hapus permanen?"
          subjudul={`Laporan ${kode}, data pelapor, korban, pelaku, jadwal, tiket, laporan pendampingan, dan semua berkas unggahannya dihapus selamanya. Tindakan ini tidak dapat dibatalkan.`}
          onTutup={() => setBuka(false)}
        >
          <form action={aksiHapus} noValidate className="mt-5">
            <input type="hidden" name="id" value={id} />
            {dariDetail && <input type="hidden" name="dariDetail" value="1" />}
            <label htmlFor={`konfirmasi-${id}`} className="mb-2 block text-sm font-bold">
              Ketik <span className="tabular-nums">{kode}</span> untuk mengonfirmasi
            </label>
            <input
              id={`konfirmasi-${id}`}
              name="konfirmasi"
              autoComplete="off"
              aria-invalid={hapus?.pesan ? true : undefined}
              aria-describedby={hapus?.pesan ? "galat-permanen" : undefined}
              className={input + " tabular-nums"}
            />
            <div className="mt-2">
              <Galat id="galat-permanen" pesan={hapus?.pesan} />
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => setBuka(false)} className={tombolNetral} autoFocus>
                Batal
              </button>
              <button type="submit" disabled={pendingHapus} className={tombolBahaya}>
                <Trash2 size={18} aria-hidden="true" />
                Hapus permanen
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
