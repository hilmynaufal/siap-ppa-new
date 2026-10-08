"use client";

import { CalendarClock, CircleSlash, MapPin, Plus, Ticket } from "lucide-react";
import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import { LencanaSesi, type StatusSesiUi } from "@/components/lencana-sesi";
import { IkonKotak } from "@/components/ikon-kotak";
import { TampilLaporan } from "@/components/tampil-laporan";
import type { LaporanView } from "@/lib/laporan-pendampingan";
import { Galat, Modal, fokus, input, tombolKecil, tombolNetral, tombolUtama } from "@/components/ui-form";
import { batalkanSesiAksi, tambahSesiAksi, type AksiSesi } from "../actions";
import type { OpsiJadwal } from "./panel-verifikasi";

export type SesiAdmin = {
  id: string;
  urutan: number;
  jenis: string;
  lokasi: string;
  alamat: string;
  pendamping: string;
  nomorAntrean: string | null;
  mulai: string;
  selesai: string;
  status: StatusSesiUi;
  laporan: LaporanView | null;
};

const ZONA = "Asia/Jakarta";
const tglJam = (iso: string) => new Date(iso).toLocaleString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: ZONA });
const jamSaja = (iso: string) => new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: ZONA }).replace(".", ":");

function Bidang({ id, label, galat, children }: { id: string; label: string; galat?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">
        {label} <span className="text-error">*</span>
      </label>
      {children}
      <div className="mt-1">
        <Galat id={`galat-${id}`} pesan={galat} />
      </div>
    </div>
  );
}

/** Isian awal jadwal saat menjadwalkan dari usulan sesi lanjutan. */
export type AwalJadwal = { jenisPendampingId?: string; pendampingId?: string; lokasiId?: string };

/** Formulir jadwal sesi. Dengan `usulanId` formulir menyetujui usulan sesi lanjutan sekaligus menjadwalkannya. */
export function ModalTambah({ laporanId, kode, opsi, onTutup, usulanId, awal }: { laporanId: string; kode: string; opsi: OpsiJadwal; onTutup: () => void; usulanId?: string; awal?: AwalJadwal }) {
  const [state, aksi, pending] = useActionState(tambahSesiAksi, undefined as AksiSesi);
  const [v, setV] = useState({ jenisPendampingId: awal?.jenisPendampingId ?? "", pendampingId: awal?.pendampingId ?? "", lokasiId: awal?.lokasiId ?? "", tanggal: "", jamMulai: "", jamSelesai: "" });
  const isi = (k: keyof typeof v) => ({ value: v[k], onChange: (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value })) });
  const g = (state?.galat ?? {}) as Record<string, string | undefined>;
  const attr = (k: string) => ({ "aria-invalid": g[k] ? true : undefined, "aria-describedby": g[k] ? `galat-${k}` : undefined });
  const calon = useMemo(() => opsi.pendamping.filter((p) => !v.jenisPendampingId || !p.jenisPendampingId || p.jenisPendampingId === v.jenisPendampingId), [opsi.pendamping, v.jenisPendampingId]);

  useEffect(() => {
    if (state?.ok) onTutup();
  }, [state, onTutup]);

  return (
    <Modal idJudul="judul-tambah-sesi" idSubjudul="sub-tambah-sesi" ikon={Plus} warna="green" judul={usulanId ? "Setujui dan jadwalkan" : "Tambah sesi pendampingan"} subjudul={usulanId ? `Laporan ${kode}. Menyetujui usulan sesi lanjutan dan menerbitkan tiket; Pelapor serta Pendamping diberi tahu.` : `Laporan ${kode}. Tiket terbit otomatis dan Pelapor serta Pendamping diberi tahu.`} onTutup={onTutup}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          startTransition(() => aksi(data));
        }}
        className="mt-5 flex flex-col gap-4"
      >
        <input type="hidden" name="id" value={laporanId} />
        {usulanId && <input type="hidden" name="usulanId" value={usulanId} />}
        <Bidang id="jenisPendampingId" label="Jenis pendampingan" galat={g.jenisPendampingId}>
          <select id="jenisPendampingId" name="jenisPendampingId" value={v.jenisPendampingId} onChange={(e) => setV((x) => ({ ...x, jenisPendampingId: e.target.value, pendampingId: "" }))} className={input} {...attr("jenisPendampingId")}>
            <option value="">Pilih jenis</option>
            {opsi.jenis.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nama}
              </option>
            ))}
          </select>
        </Bidang>
        <Bidang id="pendampingId" label="Pendamping" galat={g.pendampingId}>
          <select id="pendampingId" name="pendampingId" {...isi("pendampingId")} className={input} {...attr("pendampingId")}>
            <option value="">Pilih pendamping</option>
            {calon.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
        </Bidang>
        <Bidang id="lokasiId" label="Lokasi layanan" galat={g.lokasiId}>
          <select id="lokasiId" name="lokasiId" {...isi("lokasiId")} className={input} {...attr("lokasiId")}>
            <option value="">Pilih lokasi</option>
            {opsi.lokasi.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nama}
              </option>
            ))}
          </select>
        </Bidang>
        <Bidang id="tanggal" label="Tanggal layanan" galat={g.tanggal}>
          <input id="tanggal" name="tanggal" type="date" {...isi("tanggal")} className={input} {...attr("tanggal")} />
        </Bidang>
        <div className="grid grid-cols-2 gap-3">
          <Bidang id="jamMulai" label="Jam mulai" galat={g.jamMulai}>
            <input id="jamMulai" name="jamMulai" type="time" {...isi("jamMulai")} className={input} {...attr("jamMulai")} />
          </Bidang>
          <Bidang id="jamSelesai" label="Jam selesai" galat={g.jamSelesai}>
            <input id="jamSelesai" name="jamSelesai" type="time" {...isi("jamSelesai")} className={input} {...attr("jamSelesai")} />
          </Bidang>
        </div>
        <Galat id="galat-tambah" pesan={state?.pesan && !state.galat ? state.pesan : undefined} />
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onTutup} className={tombolNetral}>
            Batal
          </button>
          <button type="submit" disabled={pending} className={tombolUtama}>
            <Plus size={18} aria-hidden="true" />
            {usulanId ? "Setujui dan jadwalkan" : "Tambah sesi"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ModalBatal({ laporanId, s, onTutup }: { laporanId: string; s: SesiAdmin; onTutup: () => void }) {
  const [state, aksi, pending] = useActionState(batalkanSesiAksi, undefined as AksiSesi);
  useEffect(() => {
    if (state?.ok) onTutup();
  }, [state, onTutup]);
  return (
    <Modal idJudul="judul-batal-sesi" idSubjudul="sub-batal-sesi" ikon={CircleSlash} warna="coral" judul="Batalkan sesi" subjudul={`Sesi ${s.urutan} (${tglJam(s.mulai)}) dibatalkan dan Pelapor serta Pendamping diberi tahu.`} onTutup={onTutup}>
      <form action={aksi} noValidate className="mt-5">
        <input type="hidden" name="laporanId" value={laporanId} />
        <input type="hidden" name="sesiId" value={s.id} />
        <label htmlFor="alasan-batal" className="mb-2 block text-sm font-bold">
          Alasan pembatalan <span className="text-error">*</span>
        </label>
        <textarea
          id="alasan-batal"
          name="alasan"
          rows={3}
          maxLength={300}
          defaultValue={state?.alasan ?? ""}
          aria-invalid={state?.pesan ? true : undefined}
          className="w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-base text-ink focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 aria-[invalid=true]:border-error"
        />
        <div className="mt-2">
          <Galat id="galat-batal" pesan={state?.pesan} />
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onTutup} className={tombolNetral}>
            Kembali
          </button>
          <button type="submit" disabled={pending} className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-error px-6 font-bold text-white shadow-card transition-colors hover:bg-[#a8281d] disabled:bg-line-strong disabled:shadow-none ${fokus}`}>
            <CircleSlash size={18} aria-hidden="true" />
            Batalkan sesi
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Daftar sesi pendampingan satu laporan, dengan tambah sesi dan pembatalan sesi yang belum dimulai. */
export function PendampinganAdmin({ laporanId, kode, sesi, opsi, bisaTambah }: { laporanId: string; kode: string; sesi: SesiAdmin[]; opsi: OpsiJadwal; bisaTambah: boolean }) {
  const [tambah, setTambah] = useState(false);
  const [batal, setBatal] = useState<SesiAdmin | null>(null);
  const lengkap = opsi.jenis.length > 0 && opsi.lokasi.length > 0 && opsi.pendamping.length > 0;

  return (
    <section aria-labelledby="h-sesi-admin" className="rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IkonKotak ikon={CalendarClock} warna="teal" />
          <h2 id="h-sesi-admin" className="text-lg font-bold text-navy-900">
            Sesi pendampingan ({sesi.length})
          </h2>
        </div>
        {bisaTambah && lengkap && (
          <button type="button" onClick={() => setTambah(true)} className={`${tombolKecil} border-blue-600 bg-surface text-navy-800 hover:bg-blue-50`}>
            <Plus size={16} aria-hidden="true" />
            Tambah sesi
          </button>
        )}
      </div>
      {sesi.length === 0 ? (
        <p className="text-ink-soft">Belum ada sesi. Sesi pertama dibuat saat laporan diverifikasi.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sesi.map((x) => (
            <li key={x.id} className="rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-bold text-navy-900">
                  Sesi {x.urutan} · {x.jenis}
                  {x.nomorAntrean && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-sm tabular-nums text-navy-800">
                      <Ticket size={14} aria-hidden="true" />
                      {x.nomorAntrean}
                    </span>
                  )}
                </p>
                <LencanaSesi status={x.status} />
              </div>
              <p className="mt-1 text-ink">
                {tglJam(x.mulai)} - {jamSaja(x.selesai)} WIB
              </p>
              <p className="mt-1 flex items-start gap-2 text-sm text-ink-soft">
                <MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-mute" />
                {x.lokasi}, {x.alamat}
              </p>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-ink-soft">Pendamping: {x.pendamping}</p>
                {x.status === "TERJADWAL" && (
                  <button type="button" onClick={() => setBatal(x)} className={`${tombolKecil} border-error-50 bg-error-50 text-error hover:bg-[#f9d7d3]`} aria-label={`Batalkan sesi ${x.urutan}`}>
                    <CircleSlash size={16} aria-hidden="true" />
                    Batalkan
                  </button>
                )}
              </div>
              {x.laporan ? (
                <details className="mt-2 border-t border-line-soft pt-2">
                  <summary className="inline-flex min-h-11 cursor-pointer items-center font-bold text-blue-600 underline focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">Lihat laporan</summary>
                  <div className="mt-3">
                    <TampilLaporan laporan={x.laporan} />
                  </div>
                </details>
              ) : (
                x.status === "SELESAI" && <p className="mt-2 border-t border-line-soft pt-2 text-sm font-semibold text-warning">Laporan belum dikirim</p>
              )}
            </li>
          ))}
        </ul>
      )}
      {tambah && <ModalTambah laporanId={laporanId} kode={kode} opsi={opsi} onTutup={() => setTambah(false)} />}
      {batal && <ModalBatal laporanId={laporanId} s={batal} onTutup={() => setBatal(null)} />}
    </section>
  );
}
