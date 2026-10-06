"use client";

import {
  CalendarClock,
  CalendarPlus,
  EyeOff,
  FileText,
  Inbox,
  Info,
  Pencil,
  Plus,
  Shapes,
  Trash2,
  TriangleAlert,
  User,
  X,
} from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { IkonKotak } from "@/components/ikon-kotak";
import { LencanaStatus } from "@/components/lencana-status";
import { Galat, Modal, TombolModal, input, tombolKecil, tombolNetral, tombolUtama, useTutupDenganEsc } from "@/components/ui-form";
import { hapus, tambah, ubah } from "./actions";

type Jenis = {
  id: string;
  nama: string;
  aktif: boolean;
  jumlahLaporan: number;
  dibuatPada: string;
  diubahPada: string;
  dibuatOleh: string | null;
};

function tanggal(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

function BidangNama({
  state,
  defaultValue,
}: {
  state: { pesan?: string; nilai?: string } | undefined;
  defaultValue?: string;
}) {
  return (
    <>
      <label htmlFor="nama-jenis" className="mb-2 block text-sm font-bold">
        Nama jenis <span className="text-error">*</span>
      </label>
      <input
        id="nama-jenis"
        name="nama"
        autoFocus
        autoComplete="off"
        placeholder="Contoh: Kekerasan psikis"
        defaultValue={state?.nilai ?? defaultValue}
        aria-invalid={!!state?.pesan}
        aria-describedby={state?.pesan ? "galat-jenis" : "petunjuk-jenis"}
        className={input}
      />
      <div className="mt-2 min-h-5">
        {state?.pesan ? (
          <Galat id="galat-jenis" pesan={state.pesan} />
        ) : (
          <p id="petunjuk-jenis" className="flex items-center gap-2 text-sm text-ink-mute">
            <Info size={16} aria-hidden="true" className="shrink-0" />
            Gunakan nama singkat dan jelas. Nama tidak boleh sama dengan yang sudah ada.
          </p>
        )}
      </div>
    </>
  );
}

function ModalTambah({ onTutup }: { onTutup: () => void }) {
  const [state, action, pending] = useActionState(tambah, undefined);
  useEffect(() => {
    if (state?.ok) onTutup();
  }, [state, onTutup]);

  return (
    <Modal
      idJudul="judul-tambah"
      idSubjudul="subjudul-tambah"
      ikon={Plus}
      warna="green"
      judul="Tambah jenis kekerasan"
      subjudul="Jenis ini akan tampil sebagai pilihan pada formulir pelaporan."
      onTutup={onTutup}
    >
      <form action={action} className="mt-5">
        <BidangNama state={state} />
        <TombolModal onTutup={onTutup} pending={pending} />
      </form>
    </Modal>
  );
}

function ModalUbah({ j, onTutup }: { j: Jenis; onTutup: () => void }) {
  const [state, action, pending] = useActionState(ubah, undefined);
  useEffect(() => {
    if (state?.ok) onTutup();
  }, [state, onTutup]);

  return (
    <Modal
      idJudul="judul-ubah"
      idSubjudul="subjudul-ubah"
      ikon={Pencil}
      warna="sky"
      judul="Ubah jenis kekerasan"
      subjudul="Perubahan nama langsung berlaku pada formulir pelaporan."
      onTutup={onTutup}
    >
      <form action={action} className="mt-5">
        <input type="hidden" name="id" value={j.id} />
        <BidangNama state={state} defaultValue={j.nama} />
        <label className="mt-3 flex min-h-11 items-center gap-3 text-sm font-semibold">
          <input type="checkbox" name="aktif" defaultChecked={j.aktif} className="h-6 w-6 rounded-md accent-magenta-600" />
          <span>
            Tampil di formulir
            <span className="block text-xs font-normal text-ink-mute">
              Matikan untuk menyembunyikan jenis ini tanpa menghapusnya.
            </span>
          </span>
        </label>
        <TombolModal onTutup={onTutup} pending={pending} />
      </form>
    </Modal>
  );
}

function ModalHapus({ j, onTutup }: { j: Jenis; onTutup: () => void }) {
  const [state, action, pending] = useActionState(hapus, undefined);
  useEffect(() => {
    if (state?.ok) onTutup();
  }, [state, onTutup]);
  useTutupDenganEsc(onTutup);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-hapus"
        className="w-full max-w-[520px] rounded-2xl bg-surface p-6 shadow-modal"
      >
        <div className="flex items-start gap-4">
          <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-error-50 text-error">
            <TriangleAlert size={26} />
          </span>
          <div>
            <h2 id="judul-hapus" className="text-lg font-bold text-navy-900">
              Hapus &quot;{j.nama}&quot;?
            </h2>
            <p className="mt-1 text-ink-soft">
              Jenis ini akan hilang dari daftar dan formulir pelaporan. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        </div>
        <form action={action} className="mt-5">
          <input type="hidden" name="id" value={j.id} />
          <Galat id="galat-hapus" pesan={state?.pesan} />
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onTutup} className={tombolNetral} autoFocus>
              <X size={18} aria-hidden="true" />
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-error px-6 font-bold text-white transition-colors hover:bg-[#8f1c13] focus:outline-none focus-visible:ring-4 focus-visible:ring-error-50 disabled:bg-line-strong"
            >
              <Trash2 size={18} aria-hidden="true" />
              Hapus
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DaftarJenis({ jenis }: { jenis: Jenis[] }) {
  const [tambahBuka, setTambahBuka] = useState(false);
  const [ubahJ, setUbahJ] = useState<Jenis | null>(null);
  const [hapusJ, setHapusJ] = useState<Jenis | null>(null);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <IkonKotak ikon={Shapes} warna="violet" ukuran="lg" />
          <div>
            <h1 className="text-2xl font-extrabold text-navy-900">Jenis Kekerasan</h1>
            <p className="mt-0.5 text-sm text-ink-soft">
              Kelola kategori kekerasan yang menjadi pilihan pada formulir pelaporan.
            </p>
          </div>
        </div>
        <button type="button" onClick={() => setTambahBuka(true)} className={tombolUtama}>
          <Plus size={20} aria-hidden="true" />
          Tambah jenis
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
        <table className="w-full min-w-[1000px] text-left text-[15px] [&_td]:whitespace-nowrap">
          <thead className="bg-blue-50 text-sm font-bold text-navy-900">
            <tr>
              <th scope="col" className="px-5 py-4">No.</th>
              <th scope="col" className="px-5 py-4">Nama jenis kekerasan</th>
              <th scope="col" className="px-5 py-4">Status</th>
              <th scope="col" className="px-5 py-4">Dipakai di laporan</th>
              <th scope="col" className="px-5 py-4">Dibuat</th>
              <th scope="col" className="px-5 py-4">Diperbarui</th>
              <th scope="col" className="px-5 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {jenis.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-ink-mute">
                  <Inbox size={40} aria-hidden="true" className="mx-auto mb-3 text-line-strong" />
                  Belum ada jenis kekerasan. Pilih &quot;Tambah jenis&quot; untuk memulai.
                </td>
              </tr>
            )}
            {jenis.map((j, i) => (
              <tr key={j.id} className="border-t border-line-soft">
                <td className="px-5 py-3 text-ink-mute">{i + 1}</td>
                <td className="px-5 py-3 font-semibold text-ink">
                  {j.nama}
                </td>
                <td className="px-5 py-3">
                  {j.aktif ? (
                    <LencanaStatus nada="sukses">Aktif</LencanaStatus>
                  ) : (
                    <LencanaStatus nada="netral" ikon={EyeOff}>
                      Nonaktif
                    </LencanaStatus>
                  )}
                </td>
                <td className="px-5 py-3 text-ink-soft">
                  <span className="inline-flex items-center gap-2">
                    <FileText size={16} aria-hidden="true" className="text-ink-mute" />
                    {j.jumlahLaporan} laporan
                  </span>
                </td>
                <td className="px-5 py-3 text-ink-soft">
                  <span className="flex items-center gap-2">
                    <CalendarPlus size={16} aria-hidden="true" className="text-ink-mute" />
                    {tanggal(j.dibuatPada)}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-mute">
                    <User size={14} aria-hidden="true" />
                    {j.dibuatOleh ? `oleh ${j.dibuatOleh}` : "pembuat tidak tercatat"}
                  </span>
                </td>
                <td className="px-5 py-3 text-ink-soft">
                  <span className="flex items-center gap-2">
                    <CalendarClock size={16} aria-hidden="true" className="text-ink-mute" />
                    {tanggal(j.diubahPada)}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setUbahJ(j)}
                      className={`${tombolKecil} border-blue-100 bg-blue-50 text-navy-700 hover:bg-blue-100`}
                    >
                      <Pencil size={16} aria-hidden="true" />
                      Ubah
                    </button>
                    <button
                      type="button"
                      onClick={() => setHapusJ(j)}
                      className={`${tombolKecil} border-error-50 bg-error-50 text-error hover:bg-[#f9d7d3]`}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tambahBuka && <ModalTambah onTutup={() => setTambahBuka(false)} />}
      {ubahJ && <ModalUbah j={ubahJ} onTutup={() => setUbahJ(null)} />}
      {hapusJ && <ModalHapus j={hapusJ} onTutup={() => setHapusJ(null)} />}
    </>
  );
}
