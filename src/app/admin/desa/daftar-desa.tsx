"use client";

import { Landmark, Pencil, Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { DaftarMaster } from "@/components/daftar-master";
import { FilterPilihan } from "@/components/filter";
import { ImporCsv } from "@/components/impor-csv";
import { BidangForm, ModalHapus, type AksiMaster } from "@/components/master-ui";
import { Modal, TombolModal, input, tombolKecil } from "@/components/ui-form";
import { TEMPLAT_DESA_CSV } from "@/lib/desa";
import { hapus, jalankanImpor, pratinjauImpor, tambah, ubah } from "./actions";

type Desa = { id: string; nama: string; kode: string | null; kecamatanId: string; kecamatan: string; aktif: boolean };
type Opsi = { id: string; nama: string };

function ModalDesa({ d, kecamatan, onTutup }: { d: Desa | null; kecamatan: Opsi[]; onTutup: () => void }) {
  const ubahMode = d !== null;
  const [state, aksi, pending] = useActionState(ubahMode ? ubah : tambah, undefined as AksiMaster);
  useEffect(() => {
    if (state?.ok) onTutup();
  }, [state, onTutup]);
  const nilai = (k: string, awal: string) => state?.nilai?.[k] ?? awal;
  const g = state?.galat ?? {};

  return (
    <Modal
      idJudul="judul-desa"
      idSubjudul="subjudul-desa"
      ikon={ubahMode ? Pencil : Plus}
      warna={ubahMode ? "sky" : "green"}
      judul={ubahMode ? "Ubah desa/kelurahan" : "Tambah desa/kelurahan"}
      subjudul="Tampil sebagai pilihan alamat setelah kecamatan dipilih pada formulir laporan."
      onTutup={onTutup}
    >
      <form action={aksi} className="mt-5">
        {d && <input type="hidden" name="id" value={d.id} />}
        <BidangForm id="kecamatanId" label="Kecamatan" galat={g.kecamatanId}>
          <select id="kecamatanId" name="kecamatanId" defaultValue={nilai("kecamatanId", d?.kecamatanId ?? "")} aria-invalid={!!g.kecamatanId} className={input}>
            <option value="">Pilih kecamatan</option>
            {kecamatan.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </BidangForm>
        <BidangForm id="nama" label="Nama desa/kelurahan" galat={g.nama}>
          <input id="nama" name="nama" autoComplete="off" defaultValue={nilai("nama", d?.nama ?? "")} aria-invalid={!!g.nama} className={input} />
        </BidangForm>
        <BidangForm id="kode" label="Kode wilayah" wajib={false} petunjuk="Opsional, mis. 32.04.01.2001." galat={g.kode}>
          <input id="kode" name="kode" autoComplete="off" defaultValue={nilai("kode", d?.kode ?? "")} aria-invalid={!!g.kode} className={input} />
        </BidangForm>
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

export function DaftarDesa({ data, kecamatan }: { data: Desa[]; kecamatan: Opsi[] }) {
  const [form, setForm] = useState<{ d: Desa | null } | null>(null);
  const [hapusD, setHapusD] = useState<Desa | null>(null);
  const [wilayah, setWilayah] = useState("");

  return (
    <DaftarMaster<Desa>
      judul="Desa/Kelurahan"
      deskripsi="Daftar desa dan kelurahan per kecamatan untuk alamat pelapor dan korban. Isi lewat impor CSV."
      ikon={Landmark}
      warna="green"
      tombolTambah="Tambah desa"
      onTambah={() => setForm({ d: null })}
      tindakanTambahan={
        <ImporCsv
          judul="Impor desa/kelurahan dari CSV"
          petunjuk={
            <>
              Kolom: <strong>kecamatan, desa, kode</strong> (kode boleh kosong). Nama kecamatan harus sama dengan daftar kecamatan. Baris yang sudah ada (kecamatan dan nama sama) dilewati.
            </>
          }
          templat={TEMPLAT_DESA_CSV}
          namaTemplat="templat-desa.csv"
          satuan="desa"
          pratinjau={pratinjauImpor}
          jalankan={jalankanImpor}
        />
      }
      baris={data}
      sembunyikanStatus
      filterTambahan={<FilterPilihan id="filter-kecamatan" label="Filter kecamatan" semua="Semua kecamatan" pilihan={kecamatan.map((k) => k.nama)} nilai={wilayah} onUbah={setWilayah} />}
      cocok={(r, q) => (!wilayah || r.kecamatan === wilayah) && (r.nama.toLowerCase().includes(q) || r.kecamatan.toLowerCase().includes(q) || (r.kode ?? "").includes(q))}
      satuan="desa"
      labelCari="Cari desa atau kelurahan"
      placeholderCari="Cari nama, kecamatan, atau kode..."
      kosong={'Belum ada data desa. Pilih "Impor CSV" untuk mengisi dari berkas resmi.'}
      lebarMin={800}
      kolom={[
        { judul: "Kecamatan", sel: (r) => <span className="text-ink-soft">{r.kecamatan}</span> },
        { judul: "Desa/Kelurahan", sel: (r) => <span className="font-semibold text-ink">{r.nama}</span> },
        { judul: "Kode", sel: (r) => <span className="tabular-nums text-ink-soft">{r.kode ?? "-"}</span> },
      ]}
      aksi={(r) => (
        <>
          <button type="button" onClick={() => setForm({ d: r })} className={`${tombolKecil} border-blue-100 bg-blue-50 text-navy-700 hover:bg-blue-100`}>
            <Pencil size={16} aria-hidden="true" />
            Ubah
          </button>
          <button type="button" onClick={() => setHapusD(r)} className={`${tombolKecil} border-error-50 bg-error-50 text-error hover:bg-[#f9d7d3]`}>
            <Trash2 size={16} aria-hidden="true" />
            Hapus
          </button>
        </>
      )}
      anak={
        <>
          {form && <ModalDesa d={form.d} kecamatan={kecamatan} onTutup={() => setForm(null)} />}
          {hapusD && (
            <ModalHapus
              id={hapusD.id}
              judul={`Hapus "${hapusD.nama}"?`}
              pesan="Hanya dapat dihapus bila belum dipakai di laporan."
              aksi={hapus}
              onTutup={() => setHapusD(null)}
            />
          )}
        </>
      }
    />
  );
}
