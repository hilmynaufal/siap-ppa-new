"use client";

import { HeartHandshake, Pencil, Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { DaftarMaster } from "@/components/daftar-master";
import { BidangForm, ModalHapus, SakelarAktif, type AksiMaster } from "@/components/master-ui";
import { Modal, TombolModal, input, tombolKecil } from "@/components/ui-form";
import { alihkan, hapus, tambah, ubah } from "./actions";

type Jenis = { id: string; kode: string; nama: string; aktif: boolean; jumlahSesi: number; jumlahPendamping: number };

function ModalJenis({ j, onTutup }: { j: Jenis | null; onTutup: () => void }) {
  const ubahMode = j !== null;
  const [state, aksi, pending] = useActionState(ubahMode ? ubah : tambah, undefined as AksiMaster);
  useEffect(() => {
    if (state?.ok) onTutup();
  }, [state, onTutup]);
  const nilai = (k: string, awal: string) => state?.nilai?.[k] ?? awal;
  const g = state?.galat ?? {};

  return (
    <Modal
      idJudul="judul-jp"
      idSubjudul="subjudul-jp"
      ikon={ubahMode ? Pencil : Plus}
      warna={ubahMode ? "sky" : "green"}
      judul={ubahMode ? "Ubah jenis pendampingan" : "Tambah jenis pendampingan"}
      subjudul="Kode dipakai sebagai awalan nomor antrean, mis. PSI-20261015-001."
      onTutup={onTutup}
    >
      <form action={aksi} className="mt-5">
        {j && <input type="hidden" name="id" value={j.id} />}
        <BidangForm id="kode" label="Kode" petunjuk="2-6 huruf atau angka, mis. PSI." galat={g.kode}>
          <input id="kode" name="kode" autoFocus autoComplete="off" maxLength={6} placeholder="PSI" defaultValue={nilai("kode", j?.kode ?? "")} aria-invalid={!!g.kode} className={input + " uppercase"} />
        </BidangForm>
        <BidangForm id="nama" label="Nama" galat={g.nama}>
          <input id="nama" name="nama" autoComplete="off" placeholder="Pendampingan psikologis" defaultValue={nilai("nama", j?.nama ?? "")} aria-invalid={!!g.nama} className={input} />
        </BidangForm>
        {ubahMode && (
          <label className="mb-4 flex min-h-11 items-center gap-3 text-sm font-bold">
            <input type="checkbox" name="aktif" defaultChecked={j.aktif} className="h-5 w-5 accent-blue-600" />
            Aktif (tampil di pilihan jadwal)
          </label>
        )}
        {state?.pesan && !state.galat && (
          <p role="alert" className="mb-2 text-sm font-medium text-error">
            {state.pesan}
          </p>
        )}
        <TombolModal onTutup={onTutup} pending={pending} />
      </form>
    </Modal>
  );
}

export function DaftarJenisPendampingan({ data }: { data: Jenis[] }) {
  const [form, setForm] = useState<{ j: Jenis | null } | null>(null);
  const [hapusJ, setHapusJ] = useState<Jenis | null>(null);

  return (
    <DaftarMaster<Jenis>
      judul="Jenis Pendampingan"
      deskripsi="Bidang layanan pendampingan, mis. psikologis, hukum, atau medis. Dipakai saat menjadwalkan sesi."
      ikon={HeartHandshake}
      warna="coral"
      tombolTambah="Tambah jenis"
      onTambah={() => setForm({ j: null })}
      baris={data}
      cocok={(r, q) => r.nama.toLowerCase().includes(q) || r.kode.toLowerCase().includes(q)}
      satuan="jenis"
      labelCari="Cari jenis pendampingan"
      placeholderCari="Cari kode atau nama..."
      kosong={'Belum ada jenis pendampingan. Pilih "Tambah jenis" untuk memulai.'}
      kolom={[
        { judul: "Kode", sel: (r) => <span className="font-bold tabular-nums text-navy-900">{r.kode}</span> },
        { judul: "Nama", sel: (r) => <span className="font-semibold text-ink">{r.nama}</span> },
        { judul: "Pendamping", sel: (r) => <span className="tabular-nums text-ink-soft">{r.jumlahPendamping}</span> },
        { judul: "Sesi", sel: (r) => <span className="tabular-nums text-ink-soft">{r.jumlahSesi}</span> },
        { judul: "Aktif", sel: (r) => <SakelarAktif aktif={r.aktif} nama={r.nama} onAlih={() => alihkan(r.id, !r.aktif)} /> },
      ]}
      aksi={(r) => (
        <>
          <button type="button" onClick={() => setForm({ j: r })} className={`${tombolKecil} border-blue-100 bg-blue-50 text-navy-700 hover:bg-blue-100`}>
            <Pencil size={16} aria-hidden="true" />
            Ubah
          </button>
          <button type="button" onClick={() => setHapusJ(r)} className={`${tombolKecil} border-error-50 bg-error-50 text-error hover:bg-[#f9d7d3]`}>
            <Trash2 size={16} aria-hidden="true" />
            Hapus
          </button>
        </>
      )}
      anak={
        <>
          {form && <ModalJenis j={form.j} onTutup={() => setForm(null)} />}
          {hapusJ && (
            <ModalHapus
              id={hapusJ.id}
              judul={`Hapus "${hapusJ.nama}"?`}
              pesan="Hanya dapat dihapus bila belum pernah dipakai. Bila sudah dipakai, nonaktifkan agar tidak tampil di pilihan jadwal."
              aksi={hapus}
              onTutup={() => setHapusJ(null)}
            />
          )}
        </>
      }
    />
  );
}
