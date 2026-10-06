"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { hapus, tambah, ubah } from "./actions";

type Jenis = { id: string; nama: string; aktif: boolean; jumlahLaporan: number };

const input =
  "h-11 w-full rounded-[10px] border border-[#CFCBDD] px-3 text-base focus:border-2 focus:border-[#5847C2] focus:outline-none focus:ring-[3px] focus:ring-[#D9D3F7] aria-[invalid=true]:border-2 aria-[invalid=true]:border-[#B42318]";
const tombolUtama =
  "h-11 rounded-[10px] bg-[#5847C2] px-5 font-bold text-white hover:bg-[#46379E] focus:outline-none focus:ring-[3px] focus:ring-[#D9D3F7] disabled:bg-[#CFCBDD]";
const tombolNetral =
  "h-11 rounded-[10px] border border-[#CFCBDD] px-4 font-bold hover:bg-[#F7F6FB] focus:outline-none focus:ring-[3px] focus:ring-[#D9D3F7]";

function Galat({ id, pesan }: { id: string; pesan?: string }) {
  if (!pesan) return null;
  return (
    <p id={id} role="alert" className="flex items-center gap-2 text-sm text-[#B42318]">
      <span aria-hidden="true">!</span>
      {pesan}
    </p>
  );
}

function FormTambah({ onTutup }: { onTutup: () => void }) {
  const [state, action, pending] = useActionState(tambah, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      form.current?.reset();
      onTutup();
    }
  }, [state, onTutup]);

  return (
    <form
      ref={form}
      action={action}
      className="mb-6 rounded-2xl border border-[#DEDBE8] bg-white p-5"
      aria-labelledby="judul-tambah"
    >
      <h2 id="judul-tambah" className="mb-4 text-lg font-bold">
        Tambah jenis kekerasan
      </h2>
      <label htmlFor="nama-baru" className="mb-2 block text-sm font-semibold">
        Nama jenis <span className="text-[#B42318]">*</span>
      </label>
      <div className="flex gap-3">
        <input
          id="nama-baru"
          name="nama"
          autoFocus
          defaultValue={state?.nilai}
          aria-invalid={!!state?.pesan}
          aria-describedby={state?.pesan ? "galat-baru" : undefined}
          className={input}
        />
        <button type="button" onClick={onTutup} className={tombolNetral}>
          Batal
        </button>
        <button type="submit" disabled={pending} className={tombolUtama}>
          Simpan
        </button>
      </div>
      <div className="mt-2">
        <Galat id="galat-baru" pesan={state?.pesan} />
      </div>
    </form>
  );
}

function BarisUbah({ j, onSelesai }: { j: Jenis; onSelesai: () => void }) {
  const [state, action, pending] = useActionState(ubah, undefined);
  useEffect(() => {
    if (state?.ok) onSelesai();
  }, [state, onSelesai]);

  return (
    <td colSpan={3} className="px-5 py-3">
      <form action={action} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="id" value={j.id} />
        <label htmlFor={`nama-${j.id}`} className="sr-only">
          Nama jenis
        </label>
        <input
          id={`nama-${j.id}`}
          name="nama"
          defaultValue={state?.nilai ?? j.nama}
          aria-invalid={!!state?.pesan}
          aria-describedby={state?.pesan ? `galat-${j.id}` : undefined}
          className={input + " max-w-md"}
        />
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="aktif" defaultChecked={j.aktif} className="h-5 w-5 accent-[#5847C2]" />
          Tampil di formulir
        </label>
        <button type="button" onClick={onSelesai} className={tombolNetral}>
          Batal
        </button>
        <button type="submit" disabled={pending} className={tombolUtama}>
          Simpan
        </button>
        <div className="w-full">
          <Galat id={`galat-${j.id}`} pesan={state?.pesan} />
        </div>
      </form>
    </td>
  );
}

function ModalHapus({ j, onTutup }: { j: Jenis; onTutup: () => void }) {
  const [state, action, pending] = useActionState(hapus, undefined);
  useEffect(() => {
    if (state?.ok) onTutup();
  }, [state, onTutup]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onTutup();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onTutup]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1F1D2B]/50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="judul-hapus" className="w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-[0_24px_64px_rgba(31,29,43,.30)]">
        <h2 id="judul-hapus" className="text-lg font-bold">
          Hapus &quot;{j.nama}&quot;?
        </h2>
        <p className="mt-2 text-[#4A4859]">Jenis ini akan hilang dari daftar dan formulir pelaporan. Tindakan ini tidak dapat dibatalkan.</p>
        <form action={action} className="mt-5">
          <input type="hidden" name="id" value={j.id} />
          <Galat id="galat-hapus" pesan={state?.pesan} />
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={onTutup} className={tombolNetral} autoFocus>
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="h-11 rounded-[10px] bg-[#B42318] px-5 font-bold text-white hover:bg-[#8F1C13] focus:outline-none focus:ring-[3px] focus:ring-[#F6C9C4] disabled:bg-[#CFCBDD]"
            >
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
  const [ubahId, setUbahId] = useState<string | null>(null);
  const [hapusJ, setHapusJ] = useState<Jenis | null>(null);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Jenis Kekerasan</h1>
        {!tambahBuka && (
          <button type="button" onClick={() => setTambahBuka(true)} className={tombolUtama}>
            + Tambah jenis
          </button>
        )}
      </div>

      {tambahBuka && <FormTambah onTutup={() => setTambahBuka(false)} />}

      <div className="overflow-x-auto rounded-2xl border border-[#DEDBE8] bg-white">
        <table className="w-full text-left text-[15px]">
          <thead className="bg-[#F7F6FB] text-sm font-semibold text-[#4A4859]">
            <tr>
              <th scope="col" className="px-5 py-3">No.</th>
              <th scope="col" className="px-5 py-3">Nama jenis kekerasan</th>
              <th scope="col" className="px-5 py-3">Dipakai di laporan</th>
              <th scope="col" className="px-5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {jenis.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-[#66637A]">
                  Belum ada jenis kekerasan. Pilih &quot;Tambah jenis&quot; untuk memulai.
                </td>
              </tr>
            )}
            {jenis.map((j, i) => (
              <tr key={j.id} className="border-t border-[#ECEAF3]">
                {ubahId === j.id ? (
                  <>
                    <td className="px-5 py-3 text-[#66637A]">{i + 1}</td>
                    <BarisUbah j={j} onSelesai={() => setUbahId(null)} />
                  </>
                ) : (
                  <>
                    <td className="px-5 py-3 text-[#66637A]">{i + 1}</td>
                    <td className="px-5 py-3 font-semibold">
                      {j.nama}
                      {!j.aktif && (
                        <span className="ml-3 rounded-full bg-[#F1EFF6] px-2.5 py-0.5 text-xs font-bold text-[#4A4859]">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[#4A4859]">{j.jumlahLaporan} laporan</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setUbahId(j.id)}
                          className="h-10 rounded-[10px] border border-[#CFCBDD] px-4 text-sm font-bold text-[#46379E] hover:bg-[#EEEBFB] focus:outline-none focus:ring-[3px] focus:ring-[#D9D3F7]"
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() => setHapusJ(j)}
                          className="h-10 rounded-[10px] border border-[#F6C9C4] px-4 text-sm font-bold text-[#B42318] hover:bg-[#FDECEA] focus:outline-none focus:ring-[3px] focus:ring-[#F6C9C4]"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hapusJ && <ModalHapus j={hapusJ} onTutup={() => setHapusJ(null)} />}
    </>
  );
}
