"use client";

import { CheckCircle2, Clock, FileSearch, Inbox, XCircle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BilahCari } from "@/components/bilah-cari";
import { FilterChip, FilterPilihan, TombolAturUlang } from "@/components/filter";
import { LencanaLaporan, type StatusLaporanUi } from "@/components/lencana-laporan";
import { Paginasi } from "@/components/paginasi";
import { StripKpi } from "@/components/strip-kpi";
import { tombolKecil } from "@/components/ui-form";

type Baris = {
  id: string;
  kode: string;
  namaKorban: string;
  jenis: string;
  kecamatan: string | null;
  status: StatusLaporanUi;
  dibuatPada: string;
};

type FilterStatus = "semua" | "BARU" | "TERVERIFIKASI" | "DITOLAK";

const fmtTanggal = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });

/** Tanggal lokal Jakarta (YYYY-MM-DD) untuk dibandingkan dengan isian tanggal. */
const hariJakarta = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

const inputTanggal =
  "h-10 rounded-xl border border-line-strong bg-surface px-3 text-sm font-medium text-ink focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100";

export function DaftarLaporan({ laporan, jenis, kecamatan }: { laporan: Baris[]; jenis: string[]; kecamatan: string[] }) {
  const [cari, setCari] = useState("");
  const [status, setStatus] = useState<FilterStatus>("semua");
  const [jenisF, setJenisF] = useState("");
  const [wilayah, setWilayah] = useState("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [halaman, setHalaman] = useState(1);
  const [ukuran, setUkuran] = useState(10);

  const hitung = (s: StatusLaporanUi) => laporan.filter((l) => l.status === s).length;
  const filterAktif = !!(cari || jenisF || wilayah || dari || sampai || status !== "semua");

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return laporan.filter((l) => {
      if (status !== "semua" && l.status !== status) return false;
      if (jenisF && l.jenis !== jenisF) return false;
      if (wilayah && l.kecamatan !== wilayah) return false;
      const hari = hariJakarta(l.dibuatPada);
      if (dari && hari < dari) return false;
      if (sampai && hari > sampai) return false;
      return !q || l.kode.toLowerCase().includes(q) || l.namaKorban.toLowerCase().includes(q);
    });
  }, [laporan, cari, status, jenisF, wilayah, dari, sampai]);

  const jumlahHalaman = Math.max(1, Math.ceil(tampil.length / ukuran));
  const halamanAktif = Math.min(halaman, jumlahHalaman);
  const mulai = (halamanAktif - 1) * ukuran;
  const halamanData = tampil.slice(mulai, mulai + ukuran);

  const ubah =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setHalaman(1);
    };
  const aturUlang = () => {
    setCari("");
    setStatus("semua");
    setJenisF("");
    setWilayah("");
    setDari("");
    setSampai("");
    setHalaman(1);
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy-900">Laporan masuk</h1>
        <p className="mt-1 text-ink-soft">Periksa isi laporan dari Pelapor, lalu verifikasi atau tolak dengan alasan.</p>
      </div>

      <StripKpi
        judul="Ringkasan laporan"
        item={[
          { label: "Semua laporan", nilai: laporan.length, keterangan: "Sejak sistem dipakai", ikon: Inbox, warna: "blue" },
          { label: "Menunggu verifikasi", nilai: hitung("BARU"), keterangan: "Perlu diperiksa Admin", ikon: Clock, warna: "amber" },
          { label: "Terverifikasi", nilai: hitung("TERVERIFIKASI"), keterangan: "Siap dijadwalkan", ikon: CheckCircle2, warna: "green" },
          { label: "Ditolak", nilai: hitung("DITOLAK"), keterangan: "Disertai alasan", ikon: XCircle, warna: "coral" },
        ]}
      />

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <BilahCari nilai={cari} onUbah={ubah(setCari)} placeholder="Cari kode pendaftaran atau nama korban..." label="Cari laporan" />
          <FilterPilihan id="filter-jenis" label="Filter jenis kekerasan" semua="Semua jenis" pilihan={jenis} nilai={jenisF} onUbah={ubah(setJenisF)} />
          <FilterPilihan id="filter-kecamatan" label="Filter kecamatan" semua="Semua kecamatan" pilihan={kecamatan} nilai={wilayah} onUbah={ubah(setWilayah)} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
            Dari tanggal
            <input type="date" value={dari} max={sampai || undefined} onChange={(e) => ubah(setDari)(e.target.value)} className={inputTanggal} />
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
            Sampai tanggal
            <input type="date" value={sampai} min={dari || undefined} onChange={(e) => ubah(setSampai)(e.target.value)} className={inputTanggal} />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterChip
            label="Status"
            nilai={status}
            onUbah={ubah(setStatus)}
            pilihan={[
              { nilai: "semua", label: "Semua", jumlah: laporan.length },
              { nilai: "BARU", label: "Menunggu", jumlah: hitung("BARU") },
              { nilai: "TERVERIFIKASI", label: "Terverifikasi", jumlah: hitung("TERVERIFIKASI") },
              { nilai: "DITOLAK", label: "Ditolak", jumlah: hitung("DITOLAK") },
            ]}
          />
          {filterAktif && <TombolAturUlang onKlik={aturUlang} />}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-[15px] [&_td]:whitespace-nowrap">
            <thead className="bg-blue-50 text-sm font-bold text-navy-900">
              <tr>
                <th scope="col" className="px-5 py-4">No.</th>
                <th scope="col" className="px-5 py-4">Kode</th>
                <th scope="col" className="px-5 py-4">Korban</th>
                <th scope="col" className="px-5 py-4">Jenis</th>
                <th scope="col" className="px-5 py-4">Kecamatan</th>
                <th scope="col" className="px-5 py-4">Masuk</th>
                <th scope="col" className="px-5 py-4">Status</th>
                <th scope="col" className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tampil.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-ink-mute">
                    <Inbox size={40} aria-hidden="true" className="mx-auto mb-3 text-line-strong" />
                    {laporan.length === 0 ? "Belum ada laporan masuk." : "Tidak ada laporan yang cocok dengan pencarian atau filter."}
                  </td>
                </tr>
              )}
              {halamanData.map((l, i) => (
                <tr key={l.id} className="border-t border-line-soft">
                  <td className="px-5 py-3 text-ink-mute">{mulai + i + 1}</td>
                  <td className="px-5 py-3 font-semibold tabular-nums text-ink">{l.kode}</td>
                  <td className="px-5 py-3 text-ink">{l.namaKorban}</td>
                  <td className="px-5 py-3 text-ink-soft">{l.jenis}</td>
                  <td className="px-5 py-3 text-ink-soft">{l.kecamatan ?? "-"}</td>
                  <td className="px-5 py-3 text-ink-soft">{fmtTanggal(l.dibuatPada)}</td>
                  <td className="px-5 py-3">
                    <LencanaLaporan status={l.status} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      <Link
                        href={`/admin/laporan/${l.id}`}
                        aria-label={`Lihat detail laporan ${l.kode}`}
                        className={`${tombolKecil} border-blue-100 bg-blue-50 text-navy-700 hover:bg-blue-100`}
                      >
                        <FileSearch size={16} aria-hidden="true" />
                        {l.status === "BARU" ? "Periksa" : "Lihat"}
                      </Link>
                    </div>
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
          satuan="laporan"
          onHalaman={setHalaman}
          onUkuran={(u) => {
            setUkuran(u);
            setHalaman(1);
          }}
        />
      </div>
    </>
  );
}
