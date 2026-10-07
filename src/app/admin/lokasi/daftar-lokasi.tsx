"use client";

import { MapPinned, Pencil, Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { DaftarMaster } from "@/components/daftar-master";
import { BidangForm, ModalHapus, SakelarAktif, type AksiMaster } from "@/components/master-ui";
import { Modal, TombolModal, input, tombolKecil } from "@/components/ui-form";
import { alihkan, hapus, tambah, ubah } from "./actions";

type Lokasi = { id: string; nama: string; alamat: string; aktif: boolean; jumlahSesi: number };

function ModalLokasi({ l, onTutup }: { l: Lokasi | null; onTutup: () => void }) {
  const ubahMode = l !== null;
  const [state, aksi, pending] = useActionState(ubahMode ? ubah : tambah, undefined as AksiMaster);
  useEffect(() => {
    if (state?.ok) onTutup();
  }, [state, onTutup]);
  const nilai = (k: string, awal: string) => state?.nilai?.[k] ?? awal;
  const g = state?.galat ?? {};

  return (
    <Modal
      idJudul="judul-lokasi"
      idSubjudul="subjudul-lokasi"
      ikon={ubahMode ? Pencil : Plus}
      warna={ubahMode ? "sky" : "green"}
      judul={ubahMode ? "Ubah lokasi layanan" : "Tambah lokasi layanan"}
      subjudul="Lokasi tampil di tiket Pelapor sebagai tempat pendampingan."
      onTutup={onTutup}
    >
      <form action={aksi} className="mt-5">
        {l && <input type="hidden" name="id" value={l.id} />}
        <BidangForm id="nama" label="Nama lokasi" galat={g.nama}>
          <input id="nama" name="nama" autoFocus autoComplete="off" placeholder="Kantor UPTD PPA Kabupaten Bandung" defaultValue={nilai("nama", l?.nama ?? "")} aria-invalid={!!g.nama} className={input} />
        </BidangForm>
        <BidangForm id="alamat" label="Alamat lengkap" galat={g.alamat}>
          <textarea
            id="alamat"
            name="alamat"
            rows={3}
            placeholder="Jalan, nomor, desa/kelurahan, kecamatan"
            defaultValue={nilai("alamat", l?.alamat ?? "")}
            aria-invalid={!!g.alamat}
            className="w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-base text-ink focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 aria-[invalid=true]:border-error aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-error-50"
          />
        </BidangForm>
        {ubahMode && (
          <label className="mb-4 flex min-h-11 items-center gap-3 text-sm font-bold">
            <input type="checkbox" name="aktif" defaultChecked={l.aktif} className="h-5 w-5 accent-blue-600" />
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

export function DaftarLokasi({ data }: { data: Lokasi[] }) {
  const [form, setForm] = useState<{ l: Lokasi | null } | null>(null);
  const [hapusL, setHapusL] = useState<Lokasi | null>(null);

  return (
    <DaftarMaster<Lokasi>
      judul="Lokasi Layanan"
      deskripsi="Tempat pendampingan diberikan, mis. kantor UPTD PPA. Antrean dihitung per lokasi."
      ikon={MapPinned}
      warna="teal"
      tombolTambah="Tambah lokasi"
      onTambah={() => setForm({ l: null })}
      baris={data}
      cocok={(r, q) => r.nama.toLowerCase().includes(q) || r.alamat.toLowerCase().includes(q)}
      satuan="lokasi"
      labelCari="Cari lokasi layanan"
      placeholderCari="Cari nama atau alamat..."
      kosong={'Belum ada lokasi layanan. Pilih "Tambah lokasi" untuk memulai.'}
      lebarMin={900}
      kolom={[
        { judul: "Nama", sel: (r) => <span className="font-semibold text-ink">{r.nama}</span> },
        { judul: "Alamat", sel: (r) => <span className="block max-w-sm truncate text-ink-soft" title={r.alamat}>{r.alamat}</span> },
        { judul: "Sesi", sel: (r) => <span className="tabular-nums text-ink-soft">{r.jumlahSesi}</span> },
        { judul: "Aktif", sel: (r) => <SakelarAktif aktif={r.aktif} nama={r.nama} onAlih={() => alihkan(r.id, !r.aktif)} /> },
      ]}
      aksi={(r) => (
        <>
          <button type="button" onClick={() => setForm({ l: r })} className={`${tombolKecil} border-blue-100 bg-blue-50 text-navy-700 hover:bg-blue-100`}>
            <Pencil size={16} aria-hidden="true" />
            Ubah
          </button>
          <button type="button" onClick={() => setHapusL(r)} className={`${tombolKecil} border-error-50 bg-error-50 text-error hover:bg-[#f9d7d3]`}>
            <Trash2 size={16} aria-hidden="true" />
            Hapus
          </button>
        </>
      )}
      anak={
        <>
          {form && <ModalLokasi l={form.l} onTutup={() => setForm(null)} />}
          {hapusL && (
            <ModalHapus
              id={hapusL.id}
              judul={`Hapus "${hapusL.nama}"?`}
              pesan="Hanya dapat dihapus bila belum pernah dipakai. Bila sudah dipakai, nonaktifkan agar tidak tampil di pilihan jadwal."
              aksi={hapus}
              onTutup={() => setHapusL(null)}
            />
          )}
        </>
      }
    />
  );
}
