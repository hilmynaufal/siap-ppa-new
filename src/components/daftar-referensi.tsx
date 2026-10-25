"use client";

import { BookOpenText, BriefcaseBusiness, Handshake, Pencil, Plus, Signpost, Trash2, type LucideIcon } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { DaftarMaster } from "./daftar-master";
import type { WarnaIkon } from "./ikon-kotak";
import { BidangForm, ModalHapus, SakelarAktif, type AksiMaster } from "./master-ui";
import { Modal, TombolModal, input, tombolKecil } from "./ui-form";

type Baris = { id: string; nama: string; aktif: boolean; urutan: number; wajibSurat?: boolean };
// Komponen ikon tidak bisa dikirim dari server ke klien, jadi dipilih lewat nama.
const IKON: Record<"hubungan" | "pekerjaan" | "agama" | "rujukan", LucideIcon> = { hubungan: Handshake, pekerjaan: BriefcaseBusiness, agama: BookOpenText, rujukan: Signpost };
type AksiForm = (s: AksiMaster, fd: FormData) => Promise<AksiMaster>;

function ModalReferensi({ r, judul, tambah, ubah, onTutup, pakaiWajibSurat }: { r: Baris | null; judul: string; tambah: AksiForm; ubah: AksiForm; onTutup: () => void; pakaiWajibSurat: boolean }) {
  const ubahMode = r !== null;
  const [state, aksi, pending] = useActionState(ubahMode ? ubah : tambah, undefined as AksiMaster);
  useEffect(() => {
    if (state?.ok) onTutup();
  }, [state, onTutup]);
  const nilai = (k: string, awal: string) => state?.nilai?.[k] ?? awal;
  const g = state?.galat ?? {};

  return (
    <Modal
      idJudul="judul-ref"
      idSubjudul="subjudul-ref"
      ikon={ubahMode ? Pencil : Plus}
      warna={ubahMode ? "sky" : "green"}
      judul={`${ubahMode ? "Ubah" : "Tambah"} ${judul.toLowerCase()}`}
      subjudul="Pilihan ini tampil pada formulir laporan bila aktif."
      onTutup={onTutup}
    >
      <form action={aksi} className="mt-5">
        {r && <input type="hidden" name="id" value={r.id} />}
        <BidangForm id="nama" label="Nama" galat={g.nama}>
          <input id="nama" name="nama" autoFocus autoComplete="off" defaultValue={nilai("nama", r?.nama ?? "")} aria-invalid={!!g.nama} className={input} />
        </BidangForm>
        <BidangForm id="urutan" label="Urutan tampil" wajib={false} petunjuk="Angka kecil tampil lebih dulu (0-999). Pilihan 'Lainnya' sebaiknya diberi angka besar." galat={g.urutan}>
          <input id="urutan" name="urutan" type="number" inputMode="numeric" min={0} max={999} defaultValue={nilai("urutan", String(r?.urutan ?? 0))} aria-invalid={!!g.urutan} className={input} />
        </BidangForm>
        {pakaiWajibSurat && (
          <label className="mb-4 flex min-h-11 items-start gap-3 text-sm">
            <input type="checkbox" name="wajibSurat" defaultChecked={state?.nilai ? state.nilai.wajibSurat === "on" : (r?.wajibSurat ?? false)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600" />
            <span>
              <strong className="block">Wajib unggah surat rujukan</strong>
              Pelapor yang memilih asal ini harus melampirkan surat rujukan.
            </span>
          </label>
        )}
        {ubahMode && (
          <label className="mb-4 flex min-h-11 items-center gap-3 text-sm font-bold">
            <input type="checkbox" name="aktif" defaultChecked={r.aktif} className="h-5 w-5 accent-brand-600" />
            Aktif (tampil di formulir)
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

/** Daftar rujukan sederhana (nama, urutan, aktif) dengan tambah, ubah, hapus, dan saklar aktif. */
export function DaftarReferensi({
  judul,
  deskripsi,
  ikon,
  warna,
  satuan,
  data,
  tambah,
  ubah,
  hapus,
  alihkan,
  pakaiWajibSurat = false,
}: {
  judul: string;
  deskripsi: string;
  ikon: keyof typeof IKON;
  warna: WarnaIkon;
  satuan: string;
  data: Baris[];
  tambah: AksiForm;
  ubah: AksiForm;
  hapus: AksiForm;
  alihkan: (id: string, aktif: boolean) => Promise<unknown>;
  /** Asal rujukan: tampilkan kolom dan isian "Wajib unggah surat rujukan". */
  pakaiWajibSurat?: boolean;
}) {
  const [form, setForm] = useState<{ r: Baris | null } | null>(null);
  const [hapusR, setHapusR] = useState<Baris | null>(null);

  return (
    <DaftarMaster<Baris>
      judul={judul}
      deskripsi={deskripsi}
      ikon={IKON[ikon]}
      warna={warna}
      tombolTambah={`Tambah ${satuan}`}
      onTambah={() => setForm({ r: null })}
      baris={data}
      cocok={(r, q) => r.nama.toLowerCase().includes(q)}
      satuan={satuan}
      labelCari={`Cari ${satuan}`}
      placeholderCari="Cari nama..."
      kosong={`Belum ada data. Pilih "Tambah ${satuan}" untuk memulai.`}
      lebarMin={640}
      kolom={[
        { judul: "Nama", sel: (r) => <span className="font-semibold text-ink">{r.nama}</span> },
        { judul: "Urutan", sel: (r) => <span className="tabular-nums text-ink-soft">{r.urutan}</span> },
        ...(pakaiWajibSurat ? [{ judul: "Surat rujukan", sel: (r: Baris) => <span className={r.wajibSurat ? "font-semibold text-brand-800" : "text-ink-mute"}>{r.wajibSurat ? "Wajib" : "Tidak wajib"}</span> }] : []),
        { judul: "Aktif", sel: (r) => <SakelarAktif aktif={r.aktif} nama={r.nama} onAlih={() => alihkan(r.id, !r.aktif)} /> },
      ]}
      aksi={(r) => (
        <>
          <button type="button" onClick={() => setForm({ r })} className={`${tombolKecil} border-brand-100 bg-brand-50 text-brand-700 hover:bg-brand-100`}>
            <Pencil size={16} aria-hidden="true" />
            Ubah
          </button>
          <button type="button" onClick={() => setHapusR(r)} className={`${tombolKecil} border-error-50 bg-error-50 text-error hover:bg-[#f9d7d3]`}>
            <Trash2 size={16} aria-hidden="true" />
            Hapus
          </button>
        </>
      )}
      anak={
        <>
          {form && <ModalReferensi r={form.r} judul={judul} tambah={tambah} ubah={ubah} onTutup={() => setForm(null)} pakaiWajibSurat={pakaiWajibSurat} />}
          {hapusR && (
            <ModalHapus
              id={hapusR.id}
              judul={`Hapus "${hapusR.nama}"?`}
              pesan="Hanya dapat dihapus bila belum dipakai di laporan. Bila sudah dipakai, nonaktifkan agar tidak tampil di formulir."
              aksi={hapus}
              onTutup={() => setHapusR(null)}
            />
          )}
        </>
      }
    />
  );
}
