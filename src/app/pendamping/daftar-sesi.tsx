"use client";

import { CalendarCheck, CalendarClock, ClipboardList, FileWarning, History, Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { FilterChip } from "@/components/filter";
import { LencanaSesi } from "@/components/lencana-sesi";
import { StripKpi } from "@/components/strip-kpi";
import { tombolKecil } from "@/components/ui-form";
import type { SesiPendamping } from "@/lib/sesi";
import { AksiSesi } from "./aksi-sesi";

type Tab = "hari-ini" | "mendatang" | "perlu-laporan" | "riwayat";

const ZONA = "Asia/Jakarta";
const tanggal = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: ZONA });
const jam = (iso: string) => new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: ZONA }).replace(".", ":");

const KOSONG: Record<Tab, string> = {
  "hari-ini": "Tidak ada sesi yang perlu ditangani hari ini.",
  mendatang: "Belum ada sesi mendatang.",
  "perlu-laporan": "Semua sesi yang selesai sudah dilaporkan.",
  riwayat: "Belum ada riwayat sesi.",
};

/** Daftar sesi milik Pendamping dengan tab Hari ini, Mendatang, dan Perlu laporan. Identitas korban hanya berupa inisial. */
export function DaftarSesi({ sesi }: { sesi: SesiPendamping[] }) {
  const hariIni = sesi.filter((s) => s.hariIni);
  const mendatang = sesi.filter((s) => s.mendatang);
  const perluLaporan = sesi.filter((s) => s.perluLaporan);
  const riwayat = sesi.filter((s) => !s.hariIni && !s.mendatang && !s.perluLaporan);
  const [tab, setTab] = useState<Tab>(hariIni.length > 0 ? "hari-ini" : mendatang.length > 0 ? "mendatang" : perluLaporan.length > 0 ? "perlu-laporan" : "hari-ini");

  const daftar = { "hari-ini": hariIni, mendatang, "perlu-laporan": perluLaporan, riwayat }[tab];
  // Yang paling baru dulu untuk riwayat, terdekat dulu untuk sisanya.
  const tampil = tab === "riwayat" ? [...daftar].reverse() : daftar;

  return (
    <>
      <StripKpi
        judul="Ringkasan sesi"
        item={[
          { label: "Hari ini", nilai: hariIni.length, keterangan: "Perlu ditangani hari ini", ikon: CalendarCheck, warna: "teal" },
          { label: "Mendatang", nilai: mendatang.length, keterangan: "Setelah hari ini", ikon: CalendarClock, warna: "blue" },
          { label: "Perlu laporan", nilai: perluLaporan.length, keterangan: "Sesi selesai tanpa laporan", ikon: FileWarning, warna: "amber" },
          { label: "Semua sesi", nilai: sesi.length, keterangan: "Yang pernah ditugaskan", ikon: ClipboardList, warna: "violet" },
        ]}
      />

      <p className="mb-4 flex items-start gap-3 rounded-2xl bg-info-50 p-4 text-sm font-medium text-info">
        <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
        Anda melihat data yang diperlukan untuk pendampingan saja. Identitas korban dirahasiakan dan hanya ditampilkan sebagai inisial.
      </p>

      <div className="mb-4">
        <FilterChip<Tab>
          label="Tampilkan"
          nilai={tab}
          onUbah={setTab}
          pilihan={[
            { nilai: "hari-ini", label: "Hari ini", jumlah: hariIni.length },
            { nilai: "mendatang", label: "Mendatang", jumlah: mendatang.length },
            { nilai: "perlu-laporan", label: "Perlu laporan", jumlah: perluLaporan.length },
            { nilai: "riwayat", label: "Riwayat", jumlah: riwayat.length },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-[15px]">
            <thead className="bg-blue-50 text-sm font-bold text-navy-900">
              <tr>
                <th scope="col" className="px-5 py-4">Tanggal</th>
                <th scope="col" className="px-5 py-4">Jam</th>
                <th scope="col" className="px-5 py-4">Tempat</th>
                <th scope="col" className="px-5 py-4">Kasus</th>
                <th scope="col" className="px-5 py-4">Antrean</th>
                <th scope="col" className="px-5 py-4">Status</th>
                <th scope="col" className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tampil.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-ink-mute">
                    <History size={40} aria-hidden="true" className="mx-auto mb-3 text-line-strong" />
                    {KOSONG[tab]}
                  </td>
                </tr>
              )}
              {tampil.map((s) => (
                <tr key={s.id} className="border-t border-line-soft align-top">
                  <td className="whitespace-nowrap px-5 py-4 text-ink">{tanggal(s.mulai)}</td>
                  <td className="whitespace-nowrap px-5 py-4 font-bold tabular-nums text-ink">
                    {jam(s.mulai)} - {jam(s.selesai)}
                  </td>
                  <td className="px-5 py-4 text-ink-soft">
                    <span className="font-semibold text-ink">{s.lokasi}</span>
                    <br />
                    <span className="text-sm">{s.alamat}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-bold tabular-nums text-navy-900">{s.kodeLaporan}</span>
                    <br />
                    <span className="text-sm text-ink-soft">
                      {s.inisialKorban} · Sesi {s.urutan} · {s.jenis}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 tabular-nums text-ink-soft">{s.nomorAntrean ?? "-"}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col items-start gap-1.5">
                      <LencanaSesi status={s.status} />
                      {s.perluLaporan && <span className="text-xs font-semibold text-warning">Laporan belum dikirim</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col items-end gap-2">
                      <AksiSesi id={s.id} status={s.status} bisaMulai={s.bisaMulai} kode={s.kodeLaporan} kecil />
                      <Link
                        href={`/pendamping/sesi/${s.id}`}
                        aria-label={`Lihat ringkasan kasus ${s.kodeLaporan} sesi ${s.urutan}`}
                        className={`${tombolKecil} border-blue-100 bg-blue-50 text-navy-700 hover:bg-blue-100`}
                      >
                        Ringkasan kasus
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
