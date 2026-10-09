"use client";

import { Check, Copy, KeyRound, Pencil, Plus, ScanLine, ShieldAlert } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { DaftarMaster } from "@/components/daftar-master";
import { BidangForm, SakelarAktif, type AksiMaster } from "@/components/master-ui";
import { Modal, TombolModal, fokus, input, tombolKecil, tombolUtama, useTutupDenganEsc } from "@/components/ui-form";
import { alihkan, aturUlangSandi, tambah, ubah } from "./actions";

type Petugas = {
  id: string;
  nama: string;
  email: string;
  aktif: boolean;
  lokasiId: string | null;
  lokasi: string | null;
};
type Opsi = { id: string; nama: string };

/** Kata sandi sementara hanya ditampilkan sekali; setelah modal ditutup tidak dapat dilihat lagi. */
function ModalSandi({ nama, email, kataSandi, onTutup }: { nama?: string; email: string; kataSandi: string; onTutup: () => void }) {
  const [tersalin, setTersalin] = useState(false);
  useTutupDenganEsc(onTutup);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="judul-sandi" className="w-full max-w-[520px] rounded-2xl bg-surface p-6 shadow-modal">
        <div className="flex items-start gap-4">
          <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-400 text-navy-950">
            <KeyRound size={26} />
          </span>
          <div>
            <h2 id="judul-sandi" className="text-lg font-bold text-navy-900">
              Kata sandi sementara
            </h2>
            <p className="mt-1 text-ink-soft">
              {nama ? `Untuk ${nama} (${email}).` : email} Sampaikan lewat saluran yang aman.
            </p>
          </div>
        </div>
        <p className="mt-4 select-all rounded-xl bg-blue-50 p-4 text-center text-2xl font-extrabold tracking-wider text-navy-900 tabular-nums" data-testid="kata-sandi">
          {kataSandi}
        </p>
        <p className="mt-3 flex items-start gap-2 text-sm text-warning">
          <ShieldAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          Kata sandi ini hanya tampil sekali dan tidak disimpan dalam bentuk yang bisa dibaca. Bila hilang, gunakan Atur ulang sandi.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(kataSandi);
                setTersalin(true);
              } catch {
                /* clipboard bisa diblokir; kata sandi tetap dapat disalin manual */
              }
            }}
            className={`inline-flex h-12 items-center gap-2 rounded-xl border border-line-strong bg-surface px-5 font-bold text-ink hover:bg-blue-50 ${fokus}`}
          >
            {tersalin ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
            {tersalin ? "Tersalin" : "Salin"}
          </button>
          <button type="button" onClick={onTutup} className={tombolUtama} autoFocus>
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalPetugas({ p, lokasi, onTutup, onSandi }: { p: Petugas | null; lokasi: Opsi[]; onTutup: () => void; onSandi: (s: { nama: string; email: string; kataSandi: string }) => void }) {
  const ubahMode = p !== null;
  const [state, aksi, pending] = useActionState(ubahMode ? ubah : tambah, undefined as AksiMaster);
  useEffect(() => {
    if (!state?.ok) return;
    if (state.kataSandi) onSandi({ nama: state.nilai?.nama ?? "", email: state.email ?? "", kataSandi: state.kataSandi });
    onTutup();
  }, [state, onTutup, onSandi]);
  const nilai = (k: string, awal: string) => state?.nilai?.[k] ?? awal;
  const g = state?.galat ?? {};
  // Lokasi lama tetap bisa dipilih walau kini nonaktif.
  const pilihan = p?.lokasiId && !lokasi.some((l) => l.id === p.lokasiId) ? [...lokasi, { id: p.lokasiId, nama: `${p.lokasi} (nonaktif)` }] : lokasi;

  return (
    <Modal
      idJudul="judul-petugas"
      idSubjudul="subjudul-petugas"
      ikon={ubahMode ? Pencil : Plus}
      warna={ubahMode ? "sky" : "green"}
      judul={ubahMode ? "Ubah akun Petugas" : "Tambah akun Petugas"}
      subjudul={ubahMode ? "Perubahan email berlaku untuk masuk berikutnya." : "Kata sandi sementara dibuat otomatis dan ditampilkan sekali setelah disimpan."}
      onTutup={onTutup}
    >
      <form action={aksi} className="mt-5">
        {p && <input type="hidden" name="id" value={p.id} />}
        <BidangForm id="nama" label="Nama lengkap" galat={g.nama}>
          <input id="nama" name="nama" autoFocus autoComplete="off" defaultValue={nilai("nama", p?.nama ?? "")} aria-invalid={!!g.nama} className={input} />
        </BidangForm>
        <BidangForm id="email" label="Email" petunjuk="Dipakai untuk masuk." galat={g.email}>
          <input id="email" name="email" type="email" autoComplete="off" defaultValue={nilai("email", p?.email ?? "")} aria-invalid={!!g.email} className={input} />
        </BidangForm>
        <BidangForm id="lokasiId" label="Lokasi tugas" petunjuk="Petugas hanya melihat antrean dan jadwal di lokasi ini." galat={g.lokasiId}>
          <select id="lokasiId" name="lokasiId" defaultValue={nilai("lokasiId", p?.lokasiId ?? "")} aria-invalid={!!g.lokasiId} className={input}>
            <option value="">Pilih lokasi</option>
            {pilihan.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nama}
              </option>
            ))}
          </select>
        </BidangForm>
        {ubahMode && (
          <label className="mb-4 flex min-h-11 items-center gap-3 text-sm font-bold">
            <input type="checkbox" name="aktif" defaultChecked={p.aktif} className="h-5 w-5 accent-blue-600" />
            Aktif (dapat masuk)
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

function ModalAturUlang({ p, onTutup, onSandi }: { p: Petugas; onTutup: () => void; onSandi: (s: { nama: string; email: string; kataSandi: string }) => void }) {
  const [state, aksi, pending] = useActionState(aturUlangSandi, undefined as AksiMaster);
  useEffect(() => {
    if (!state?.ok || !state.kataSandi) return;
    onSandi({ nama: p.nama, email: p.email, kataSandi: state.kataSandi });
    onTutup();
  }, [state, p, onTutup, onSandi]);
  useTutupDenganEsc(onTutup);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="judul-reset" className="w-full max-w-[520px] rounded-2xl bg-surface p-6 shadow-modal">
        <h2 id="judul-reset" className="text-lg font-bold text-navy-900">
          Atur ulang kata sandi {p.nama}?
        </h2>
        <p className="mt-1 text-ink-soft">Kata sandi lama langsung tidak berlaku. Kata sandi sementara yang baru akan ditampilkan sekali.</p>
        <form action={aksi} className="mt-5">
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="email" value={p.email} />
          {state?.pesan && <p role="alert" className="mb-2 text-sm font-medium text-error">{state.pesan}</p>}
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onTutup} className={`inline-flex h-12 items-center rounded-xl border border-line-strong bg-surface px-5 font-bold text-ink hover:bg-blue-50 ${fokus}`} autoFocus>
              Batal
            </button>
            <button type="submit" disabled={pending} className={tombolUtama}>
              <KeyRound size={18} aria-hidden="true" />
              Atur ulang
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DaftarPetugas({ data, lokasi }: { data: Petugas[]; lokasi: Opsi[] }) {
  const [form, setForm] = useState<{ p: Petugas | null } | null>(null);
  const [reset, setReset] = useState<Petugas | null>(null);
  const [sandi, setSandi] = useState<{ nama: string; email: string; kataSandi: string } | null>(null);

  return (
    <DaftarMaster<Petugas>
      judul="Akun Petugas"
      deskripsi="Akun loket yang mengelola antrean dan melihat jadwal hari ini di satu lokasi. Kata sandi sementara dibuat otomatis."
      ikon={ScanLine}
      warna="teal"
      tombolTambah="Tambah petugas"
      onTambah={() => setForm({ p: null })}
      baris={data}
      cocok={(r, q) => r.nama.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || (r.lokasi ?? "").toLowerCase().includes(q)}
      satuan="petugas"
      labelCari="Cari petugas"
      placeholderCari="Cari nama, email, atau lokasi..."
      kosong={'Belum ada akun Petugas. Pilih "Tambah petugas" untuk memulai.'}
      lebarMin={760}
      kolom={[
        { judul: "Nama", sel: (r) => <span className="font-semibold text-ink">{r.nama}</span> },
        { judul: "Email", sel: (r) => <span className="text-ink-soft">{r.email}</span> },
        { judul: "Lokasi tugas", sel: (r) => <span className="text-ink-soft">{r.lokasi ?? "-"}</span> },
        { judul: "Aktif", sel: (r) => <SakelarAktif aktif={r.aktif} nama={r.nama} onAlih={() => alihkan(r.id, !r.aktif)} /> },
      ]}
      aksi={(r) => (
        <>
          <button type="button" onClick={() => setForm({ p: r })} className={`${tombolKecil} border-blue-100 bg-blue-50 text-navy-700 hover:bg-blue-100`}>
            <Pencil size={16} aria-hidden="true" />
            Ubah
          </button>
          <button type="button" onClick={() => setReset(r)} className={`${tombolKecil} border-line-strong bg-surface text-ink hover:bg-blue-50`}>
            <KeyRound size={16} aria-hidden="true" />
            Atur ulang sandi
          </button>
        </>
      )}
      anak={
        <>
          {form && <ModalPetugas p={form.p} lokasi={lokasi} onTutup={() => setForm(null)} onSandi={setSandi} />}
          {reset && <ModalAturUlang p={reset} onTutup={() => setReset(null)} onSandi={setSandi} />}
          {sandi && <ModalSandi nama={sandi.nama} email={sandi.email} kataSandi={sandi.kataSandi} onTutup={() => setSandi(null)} />}
        </>
      }
    />
  );
}
