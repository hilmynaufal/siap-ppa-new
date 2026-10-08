"use client";

import { CheckCircle2, Download, FileSpreadsheet, TriangleAlert, Upload } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { Galat, Modal, fokus, tombolNetral, tombolUtama } from "./ui-form";

export type PratinjauUmum = { ok: boolean; pesan?: string; valid: unknown[]; dilewati: unknown[]; galat: { baris: number; pesan: string }[] };
export type AksiImporUmum = { pratinjau?: PratinjauUmum; pesan?: string; selesai?: { ditambah: number; dilewati: number } } | undefined;
type AksiServer = (s: AksiImporUmum, fd: FormData) => Promise<AksiImporUmum>;
/** Aksi server tiap halaman punya tipe status sendiri yang bentuknya sama; diterima apa adanya lalu dipakai sebagai AksiServer. */
type AksiHalaman = (s: never, fd: FormData) => Promise<unknown>;

/** Tombol dan modal impor CSV: pilih berkas, periksa (tanpa menyimpan), lalu impor bila semua baris valid. */
export function ImporCsv({
  judul,
  petunjuk,
  templat,
  namaTemplat,
  satuan,
  pratinjau: aksiPratinjau,
  jalankan: aksiJalankan,
}: {
  judul: string;
  petunjuk: React.ReactNode;
  /** Isi templat CSV yang dapat diunduh. */
  templat: string;
  namaTemplat: string;
  /** Kata benda untuk ringkasan, mis. "kontak" atau "desa". */
  satuan: string;
  pratinjau: AksiHalaman;
  jalankan: AksiHalaman;
}) {
  const [buka, setBuka] = useState(false);
  const [berkas, setBerkas] = useState<File | null>(null);
  const [periksa, kirimPeriksa, memeriksa] = useActionState(aksiPratinjau as unknown as AksiServer, undefined as AksiImporUmum);
  const [impor, kirimImpor, mengimpor] = useActionState(aksiJalankan as unknown as AksiServer, undefined as AksiImporUmum);
  // URL data (bukan blob) agar sama di server dan klien; BOM membuat Excel membaca UTF-8 dengan benar.
  const urlTemplat = `data:text/csv;charset=utf-8,${encodeURIComponent(String.fromCharCode(0xfeff) + templat)}`;

  const tutup = () => {
    setBuka(false);
    setBerkas(null);
  };
  const kirim = (aksi: typeof kirimPeriksa) => {
    if (!berkas) return;
    const fd = new FormData();
    fd.set("berkas", berkas);
    startTransition(() => aksi(fd));
  };

  const hasil = impor?.selesai ? impor : periksa;
  const p = (impor?.pratinjau && !impor.selesai ? impor.pratinjau : periksa?.pratinjau) ?? null;
  const pesan = impor?.pesan ?? periksa?.pesan;
  const sudahImpor = !!impor?.selesai;

  return (
    <>
      <button type="button" onClick={() => setBuka(true)} className={tombolNetral}>
        <Upload size={20} aria-hidden="true" />
        Impor CSV
      </button>
      {buka && (
        <Modal
          idJudul="judul-impor"
          idSubjudul="subjudul-impor"
          ikon={FileSpreadsheet}
          warna="teal"
          judul={judul}
          subjudul="Berkas diperiksa dulu. Data baru disimpan hanya bila semua baris benar."
          onTutup={tutup}
        >
          <div className="mt-5 flex flex-col gap-4">
            <a
              href={urlTemplat}
              download={namaTemplat}
              className={`inline-flex min-h-11 items-center gap-2 self-start rounded-xl px-1 text-sm font-bold text-blue-600 hover:underline ${fokus}`}
            >
              <Download size={16} aria-hidden="true" />
              Unduh templat CSV
            </a>
            <p className="text-sm text-ink-soft">
              {petunjuk}
            </p>
            <div>
              <label htmlFor="berkas-csv" className="mb-2 block text-sm font-bold">
                Berkas CSV
              </label>
              <input
                id="berkas-csv"
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={(e) => setBerkas(e.target.files?.[0] ?? null)}
                className={`block w-full rounded-xl border border-line-strong bg-surface p-2 text-sm file:mr-3 file:h-9 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:font-bold file:text-navy-800 ${fokus}`}
              />
              <div className="mt-2">
                <Galat id="galat-impor" pesan={pesan} />
              </div>
            </div>

            {p && !sudahImpor && (
              <div role="status" className={"rounded-xl p-4 text-sm " + (p.ok ? "bg-success-50 text-success" : "bg-error-50 text-error")}>
                <p className="flex items-center gap-2 font-bold">
                  {p.ok ? <CheckCircle2 size={16} aria-hidden="true" /> : <TriangleAlert size={16} aria-hidden="true" />}
                  {p.ok ? `${p.valid.length} ${satuan} siap diimpor${p.dilewati.length ? `, ${p.dilewati.length} dilewati karena sudah ada` : ""}.` : p.pesan}
                </p>
                {p.galat.length > 0 && (
                  <ul className="mt-2 max-h-40 list-disc overflow-y-auto pl-5 text-ink">
                    {p.galat.map((g) => (
                      <li key={`${g.baris}-${g.pesan}`}>
                        Baris {g.baris}: {g.pesan}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {sudahImpor && impor?.selesai && (
              <p role="status" className="flex items-center gap-2 rounded-xl bg-success-50 p-4 text-sm font-bold text-success">
                <CheckCircle2 size={16} aria-hidden="true" />
                {impor.selesai.ditambah} {satuan} ditambahkan{impor.selesai.dilewati ? `, ${impor.selesai.dilewati} dilewati (sudah ada)` : ""}.
              </p>
            )}
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={tutup} className={tombolNetral}>
              {sudahImpor ? "Selesai" : "Batal"}
            </button>
            {!sudahImpor && (
              <>
                <button type="button" disabled={!berkas || memeriksa} onClick={() => kirim(kirimPeriksa)} className={tombolNetral + " disabled:opacity-50"}>
                  Periksa berkas
                </button>
                <button type="button" disabled={!berkas || !p?.ok || p.valid.length === 0 || mengimpor} onClick={() => kirim(kirimImpor)} className={tombolUtama}>
                  <Upload size={18} aria-hidden="true" />
                  Impor{p?.ok && p.valid.length > 0 ? ` ${p.valid.length} ${satuan}` : ""}
                </button>
              </>
            )}
          </div>
        </Modal>
      )}
      <span className="sr-only" aria-live="polite">
        {hasil?.selesai ? "Impor selesai" : ""}
      </span>
    </>
  );
}
