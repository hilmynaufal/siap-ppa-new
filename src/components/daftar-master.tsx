"use client";

import { Plus, type LucideIcon } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { BilahCari } from "./bilah-cari";
import { FilterChip, TombolAturUlang } from "./filter";
import { IkonKotak, type WarnaIkon } from "./ikon-kotak";
import { Paginasi } from "./paginasi";
import { tombolUtama } from "./ui-form";

export type KolomMaster<T> = { judul: string; sel: (r: T) => ReactNode; kelas?: string };

/**
 * Daftar data master standar: judul berikon, tombol tambah, cari, filter status, tabel, dan paginasi.
 * Isi kolom, aksi per baris, dan modal disediakan halaman pemakai.
 */
export function DaftarMaster<T extends { id: string; aktif: boolean }>({
  judul,
  deskripsi,
  ikon,
  warna,
  tombolTambah,
  onTambah,
  tindakanTambahan,
  kolom,
  baris,
  cocok,
  aksi,
  satuan,
  labelCari,
  placeholderCari,
  kosong,
  lebarMin = 800,
  anak,
  sembunyikanStatus = false,
  filterTambahan,
}: {
  judul: string;
  deskripsi: string;
  ikon: LucideIcon;
  warna: WarnaIkon;
  tombolTambah: string;
  onTambah: () => void;
  tindakanTambahan?: ReactNode;
  kolom: KolomMaster<T>[];
  baris: T[];
  cocok: (r: T, q: string) => boolean;
  aksi: (r: T) => ReactNode;
  satuan: string;
  labelCari: string;
  placeholderCari: string;
  kosong: string;
  lebarMin?: number;
  anak?: ReactNode;
  /** Untuk data tanpa status aktif (mis. desa): menyembunyikan chip Status. */
  sembunyikanStatus?: boolean;
  /** Filter tambahan di samping kotak cari (state dipegang pemanggil; `cocok` membacanya). */
  filterTambahan?: ReactNode;
}) {
  const [cari, setCari] = useState("");
  const [status, setStatus] = useState<"semua" | "aktif" | "nonaktif">("semua");
  const [halaman, setHalaman] = useState(1);
  const [ukuran, setUkuran] = useState(10);

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return baris.filter((r) => (status === "semua" || (status === "aktif") === r.aktif) && cocok(r, q));
  }, [baris, cari, status, cocok]);
  const jumlahAktif = baris.filter((r) => r.aktif).length;
  const jumlahHalaman = Math.max(1, Math.ceil(tampil.length / ukuran));
  const halamanAktif = Math.min(halaman, jumlahHalaman);
  const mulai = (halamanAktif - 1) * ukuran;
  const filterAktif = !!cari || status !== "semua";

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <IkonKotak ikon={ikon} warna={warna} ukuran="lg" />
          <div>
            <h1 className="text-2xl font-extrabold text-navy-900">{judul}</h1>
            <p className="mt-0.5 text-sm text-ink-soft">{deskripsi}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {tindakanTambahan}
          <button type="button" onClick={onTambah} className={tombolUtama}>
            <Plus size={20} aria-hidden="true" />
            {tombolTambah}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <BilahCari
            nilai={cari}
            onUbah={(v) => {
              setCari(v);
              setHalaman(1);
            }}
            placeholder={placeholderCari}
            label={labelCari}
          />
          {filterTambahan}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {!sembunyikanStatus && (
          <FilterChip
            label="Status"
            nilai={status}
            onUbah={(v) => {
              setStatus(v);
              setHalaman(1);
            }}
            pilihan={[
              { nilai: "semua", label: "Semua", jumlah: baris.length },
              { nilai: "aktif", label: "Aktif", jumlah: jumlahAktif },
              { nilai: "nonaktif", label: "Nonaktif", jumlah: baris.length - jumlahAktif },
            ]}
          />
          )}
          {sembunyikanStatus && <span />}
          {filterAktif && (
            <TombolAturUlang
              onKlik={() => {
                setCari("");
                setStatus("semua");
                setHalaman(1);
              }}
            />
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[15px] [&_td]:whitespace-nowrap" style={{ minWidth: lebarMin }}>
            <thead className="bg-blue-50 text-sm font-bold text-navy-900">
              <tr>
                <th scope="col" className="px-5 py-4">No.</th>
                {kolom.map((k) => (
                  <th key={k.judul} scope="col" className={`px-5 py-4 ${k.kelas ?? ""}`}>
                    {k.judul}
                  </th>
                ))}
                <th scope="col" className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tampil.length === 0 && (
                <tr>
                  <td colSpan={kolom.length + 2} className="px-5 py-12 text-center text-ink-mute">
                    <IkonKotak ikon={ikon} warna="blue" ukuran="md" />
                    <p className="mt-3">{baris.length === 0 ? kosong : "Tidak ada data yang cocok dengan pencarian atau filter."}</p>
                  </td>
                </tr>
              )}
              {tampil.slice(mulai, mulai + ukuran).map((r, i) => (
                <tr key={r.id} className="border-t border-line-soft">
                  <td className="px-5 py-3 text-ink-mute">{mulai + i + 1}</td>
                  {kolom.map((k) => (
                    <td key={k.judul} className={`px-5 py-3 ${k.kelas ?? ""}`}>
                      {k.sel(r)}
                    </td>
                  ))}
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">{aksi(r)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paginasi
          halaman={halamanAktif}
          ukuran={ukuran}
          total={tampil.length}
          satuan={satuan}
          onHalaman={setHalaman}
          onUkuran={(u) => {
            setUkuran(u);
            setHalaman(1);
          }}
        />
      </div>
      {anak}
    </>
  );
}
