"use client";

import { CheckCircle2, AlertCircle, Megaphone, SkipForward, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { IkonKotak } from "@/components/ikon-kotak";
import { LencanaStatus, type NadaLencana } from "@/components/lencana-status";
import { fokus, input, tombolUtama } from "@/components/ui-form";
import type { BarisAntrean, StatusAntrean } from "@/lib/antrean";
import { checkInAksi, lewatiAksi, panggilAksi } from "./actions";
import { PemindaiQr } from "./pemindai-qr";

type Data = { baris: BarisAntrean[]; sedangDipanggil: BarisAntrean | null; jumlah: number; menunggu: number; adaYangBisaDipanggil: boolean };
type Props = {
  opsi: { lokasi: { id: string; nama: string }[]; jenis: { id: string; nama: string }[] };
  lokasiId: string;
  jenisId: string;
  tanggal: string;
  hariIni: string;
  data: Data | null;
};

const STATUS: Record<StatusAntrean, { label: string; nada: NadaLencana }> = {
  MENUNGGU: { label: "Menunggu", nada: "netral" },
  DIPANGGIL: { label: "Dipanggil", nada: "peringatan" },
  BERLANGSUNG: { label: "Berlangsung", nada: "info" },
  SELESAI: { label: "Selesai", nada: "sukses" },
  DILEWATI: { label: "Dilewati", nada: "galat" },
};

const SEGAR_MS = 8000;

/** Antrean hari ini: nomor yang dipanggil, daftar antrean, dan check-in petugas. Disegarkan otomatis. */
export function PanelAntrean({ opsi, lokasiId, jenisId, tanggal, hariIni, data }: Props) {
  const router = useRouter();
  const [pending, mulai] = useTransition();
  const [kode, setKode] = useState("");
  const [hasil, setHasil] = useState<{ ok: boolean; pesan: string } | null>(null);
  const [galatAksi, setGalatAksi] = useState<string | null>(null);

  // Antrean berubah di meja lain dan dari Pendamping; segarkan tanpa memuat ulang halaman.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, SEGAR_MS);
    return () => clearInterval(id);
  }, [router]);

  function ubahFilter(k: "lokasi" | "jenis" | "tanggal", v: string) {
    const q = new URLSearchParams({ lokasi: lokasiId, jenis: jenisId, tanggal, [k]: v });
    router.replace(`/admin/antrean?${q.toString()}`);
  }

  function checkIn(masukan: string) {
    if (!masukan.trim()) {
      setHasil({ ok: false, pesan: "Isi kode tiket atau pindai QR." });
      return;
    }
    mulai(async () => {
      const h = await checkInAksi(masukan);
      setHasil(h.ok ? { ok: true, pesan: `${h.nomorAntrean} berhasil check-in pukul ${h.jam}.` } : { ok: false, pesan: h.pesan });
      if (h.ok) {
        setKode("");
        router.refresh();
      }
    });
  }

  function jalankan(fn: () => Promise<{ ok: boolean; pesan?: string }>) {
    setGalatAksi(null);
    mulai(async () => {
      const h = await fn();
      if (!h.ok) setGalatAksi(h.pesan ?? "Gagal.");
      else router.refresh();
    });
  }

  const dipanggil = data?.sedangDipanggil ?? null;
  const bisaPanggil = !!data?.adaYangBisaDipanggil && tanggal === hariIni;

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <IkonKotak ikon={Ticket} warna="magenta" ukuran="lg" />
        <h1 className="text-2xl font-extrabold text-navy-900">Antrean Hari Ini</h1>
      </div>

      <section aria-label="Penyaring antrean" className="mb-6 grid gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card md:grid-cols-3">
        <div>
          <label htmlFor="f-lokasi" className="mb-1.5 block text-sm font-bold">
            Lokasi
          </label>
          <select id="f-lokasi" value={lokasiId} onChange={(e) => ubahFilter("lokasi", e.target.value)} className={input}>
            {opsi.lokasi.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nama}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-jenis" className="mb-1.5 block text-sm font-bold">
            Layanan
          </label>
          <select id="f-jenis" value={jenisId} onChange={(e) => ubahFilter("jenis", e.target.value)} className={input}>
            {opsi.jenis.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nama}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-tanggal" className="mb-1.5 block text-sm font-bold">
            Tanggal
          </label>
          <input id="f-tanggal" type="date" value={tanggal} onChange={(e) => e.target.value && ubahFilter("tanggal", e.target.value)} className={input} />
        </div>
      </section>

      {!data ? (
        <p className="rounded-2xl border border-line bg-surface p-6 text-ink-soft">Belum ada lokasi layanan atau jenis pendampingan aktif.</p>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[1fr_24rem]">
          <div className="flex flex-col gap-6">
            <section aria-label="Nomor sedang dipanggil" className="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-magenta-600 p-6 text-white shadow-card">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white/80">Sedang dipanggil</p>
                <p className="mt-1 break-all text-3xl font-extrabold tabular-nums md:text-5xl" data-testid="sedang-dipanggil">
                  {dipanggil ? dipanggil.nomorAntrean : "Belum ada"}
                </p>
                {dipanggil && (
                  <p className="mt-1 text-sm text-white/80">
                    Jadwal {dipanggil.jadwal} · {dipanggil.pendamping} · dipanggil {dipanggil.dipanggil}
                  </p>
                )}
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-56">
                <button type="button" disabled={pending || !bisaPanggil} onClick={() => jalankan(() => panggilAksi(lokasiId, jenisId, tanggal))} className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white font-bold text-navy-900 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 ${fokus}`}>
                  <Megaphone size={18} aria-hidden="true" />
                  Panggil berikutnya
                </button>
                <button
                  type="button"
                  disabled={pending || !dipanggil?.bisaLewati}
                  onClick={() => dipanggil && jalankan(() => lewatiAksi(dipanggil.id))}
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/70 font-bold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 ${fokus}`}
                >
                  <SkipForward size={18} aria-hidden="true" />
                  Lewati
                </button>
              </div>
              {galatAksi && (
                <p role="alert" className="w-full rounded-xl bg-white p-3 text-sm font-semibold text-error">
                  {galatAksi}
                </p>
              )}
            </section>

            <section aria-labelledby="h-daftar-antrean" className="rounded-2xl border border-line bg-surface shadow-card">
              <div className="flex items-center justify-between gap-3 border-b border-line-soft p-5">
                <h2 id="h-daftar-antrean" className="text-lg font-bold text-navy-900">
                  Daftar antrean
                </h2>
                <p className="text-sm text-ink-soft">
                  {data.jumlah} nomor · {data.menunggu} menunggu
                </p>
              </div>
              {data.baris.length === 0 ? (
                <p className="p-6 text-ink-soft">Belum ada tiket untuk lokasi, layanan, dan tanggal ini.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[40rem] text-left">
                    <thead className="bg-blue-50/60 text-sm font-bold text-ink-soft">
                      <tr>
                        <th scope="col" className="px-5 py-3">No. antrean</th>
                        <th scope="col" className="px-3 py-3">Jadwal</th>
                        <th scope="col" className="px-3 py-3">Pendamping</th>
                        <th scope="col" className="px-3 py-3">Check-in</th>
                        <th scope="col" className="px-3 py-3">Status</th>
                        <th scope="col" className="px-3 py-3"><span className="sr-only">Aksi</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-soft">
                      {data.baris.map((b) => (
                        <tr key={b.id} className={b.id === dipanggil?.id ? "bg-blue-50" : undefined}>
                          <td className={"px-5 py-3 tabular-nums " + (b.id === dipanggil?.id ? "font-extrabold text-navy-900" : "")}>{b.nomorAntrean}</td>
                          <td className="px-3 py-3 tabular-nums">{b.jadwal}</td>
                          <td className="px-3 py-3">{b.pendamping}</td>
                          <td className="px-3 py-3 tabular-nums text-ink-soft">{b.checkIn ?? "Belum check-in"}</td>
                          <td className="px-3 py-3">
                            <LencanaStatus nada={STATUS[b.status].nada}>{STATUS[b.status].label}</LencanaStatus>
                          </td>
                          <td className="px-3 py-3 text-right">
                            {b.bisaLewati && b.id !== dipanggil?.id && (
                              <button type="button" disabled={pending} onClick={() => jalankan(() => lewatiAksi(b.id))} aria-label={`Lewati ${b.nomorAntrean}`} className={`inline-flex h-10 items-center rounded-lg border border-line-strong px-3 text-sm font-bold text-ink hover:bg-blue-50 disabled:opacity-60 ${fokus}`}>
                                Lewati
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <section aria-labelledby="h-checkin" className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 id="h-checkin" className="mb-4 text-lg font-bold text-navy-900">
              Check-in
            </h2>
            <PemindaiQr onKode={checkIn} />
            <p className="my-4 text-center text-sm text-ink-mute">atau masukkan kode</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                checkIn(kode);
              }}
              className="flex flex-col gap-3"
            >
              <label htmlFor="kode-tiket" className="text-sm font-bold">
                Kode tiket
              </label>
              <div className="flex gap-2">
                <input id="kode-tiket" value={kode} onChange={(e) => setKode(e.target.value)} placeholder="PSI-20261008-007" autoComplete="off" spellCheck={false} className={`${input} min-w-0 flex-1`} />
                <button type="submit" disabled={pending} className={tombolUtama}>
                  Check-in
                </button>
              </div>
            </form>
            {hasil && (
              <p role="status" data-testid="hasil-checkin" className={"mt-4 flex items-start gap-2 rounded-xl p-3 text-sm font-semibold " + (hasil.ok ? "bg-success-50 text-success" : "bg-error-50 text-error")}>
                {hasil.ok ? <CheckCircle2 size={18} aria-hidden="true" className="mt-0.5 shrink-0" /> : <AlertCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0" />}
                <span>{hasil.pesan}</span>
              </p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
