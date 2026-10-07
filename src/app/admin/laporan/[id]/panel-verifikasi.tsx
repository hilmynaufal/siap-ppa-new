"use client";

import { CheckCircle2, ClipboardCheck, TriangleAlert, XCircle } from "lucide-react";
import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import { LencanaLaporan, type StatusLaporanUi } from "@/components/lencana-laporan";
import { Galat, Modal, fokus, input, tombolNetral, tombolUtama } from "@/components/ui-form";
import { ALASAN_MAKS, ALASAN_MIN } from "@/lib/verifikasi";
import { tolak, verifikasi, type AksiVerifikasi } from "../actions";

export type OpsiJadwal = {
  jenis: { id: string; nama: string }[];
  pendamping: { id: string; nama: string; jenisPendampingId: string | null }[];
  lokasi: { id: string; nama: string }[];
};

type Props = {
  opsi: OpsiJadwal;
  id: string;
  kode: string;
  status: StatusLaporanUi;
  verifikator: string | null;
  diverifikasiPada: string | null;
  alasanPenolakan: string | null;
};

function ModalTolak({ id, kode, onTutup }: { id: string; kode: string; onTutup: () => void }) {
  const [state, aksi, pending] = useActionState(tolak, undefined as AksiVerifikasi);
  useEffect(() => {
    if (state?.ok) onTutup();
  }, [state, onTutup]);

  return (
    <Modal
      idJudul="judul-tolak"
      idSubjudul="subjudul-tolak"
      ikon={XCircle}
      warna="coral"
      judul="Tolak laporan"
      subjudul={`Laporan ${kode} akan ditandai ditolak. Alasan dicatat dan tidak dapat diubah.`}
      onTutup={onTutup}
    >
      <form action={aksi} noValidate className="mt-5">
        <input type="hidden" name="id" value={id} />
        <label htmlFor="alasan" className="mb-2 block text-sm font-bold">
          Alasan penolakan <span className="text-error">*</span>
        </label>
        <textarea
          id="alasan"
          name="alasan"
          rows={4}
          required
          minLength={ALASAN_MIN}
          maxLength={ALASAN_MAKS}
          defaultValue={state?.alasan ?? ""}
          aria-invalid={state?.pesan ? true : undefined}
          aria-describedby={state?.pesan ? "galat-alasan" : undefined}
          className="w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-base text-ink focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 aria-[invalid=true]:border-error aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-error-50"
        />
        <p className="mt-1 text-sm text-ink-mute">Jelaskan singkat mengapa laporan tidak dapat diproses.</p>
        <div className="mt-2">
          <Galat id="galat-alasan" pesan={state?.pesan} />
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onTutup} className={tombolNetral}>
            Batal
          </button>
          <button
            type="submit"
            disabled={pending}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-error px-6 font-bold text-white shadow-card transition-colors hover:bg-[#a8281d] disabled:bg-line-strong disabled:shadow-none ${fokus}`}
          >
            <XCircle size={18} aria-hidden="true" />
            Tolak laporan
          </button>
        </div>
      </form>
    </Modal>
  );
}

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

function FormVerifikasi({ id, opsi }: { id: string; opsi: OpsiJadwal }) {
  const [state, aksi, pending] = useActionState(verifikasi, undefined as AksiVerifikasi);
  // Semua isian dikendalikan state agar tidak hilang saat formulir di-reset React setelah aksi selesai (mis. karena galat).
  const [v, setV] = useState({ jenisPendampingId: "", pendampingId: "", lokasiId: "", tanggal: "", jamMulai: "", jamSelesai: "" });
  const isi = (k: keyof typeof v) => ({ value: v[k], onChange: (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value })) });
  const jenisId = v.jenisPendampingId;
  const pendampingCocok = useMemo(
    () => opsi.pendamping.filter((p) => !jenisId || !p.jenisPendampingId || p.jenisPendampingId === jenisId),
    [opsi.pendamping, jenisId],
  );
  const g = state?.galat ?? {};
  const lengkap = opsi.jenis.length > 0 && opsi.lokasi.length > 0 && opsi.pendamping.length > 0;
  const lapor = (k: string) => (g as Record<string, string | undefined>)[k];
  const attr = (k: string) => ({ "aria-invalid": lapor(k) ? true : undefined, "aria-describedby": lapor(k) ? `galat-${k}` : undefined });

  if (!lengkap) {
    return (
      <p className="flex items-start gap-2 rounded-xl bg-warning-50 p-3 text-sm text-warning">
        <TriangleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
        Data jenis pendampingan, lokasi layanan, atau akun Pendamping belum tersedia, sehingga jadwal belum dapat dibuat.
      </p>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        // Dikirim manual (bukan action={...}) agar React tidak mengosongkan isian saat ada galat.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => aksi(data));
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="id" value={id} />
      <p className="text-sm text-ink-soft">
        Tentukan pendamping dan jadwal layanan. Tiket terbit otomatis setelah laporan diverifikasi.
      </p>
      <Bidang id="jenisPendampingId" label="Jenis pendampingan" galat={g.jenisPendampingId}>
        <select id="jenisPendampingId" name="jenisPendampingId" onChange={(e) => setV((x) => ({ ...x, jenisPendampingId: e.target.value, pendampingId: "" }))} value={v.jenisPendampingId} className={input} {...attr("jenisPendampingId")}>
          <option value="">Pilih jenis</option>
          {opsi.jenis.map((j) => (
            <option key={j.id} value={j.id}>{j.nama}</option>
          ))}
        </select>
      </Bidang>
      <Bidang id="pendampingId" label="Pendamping" galat={g.pendampingId}>
        <select id="pendampingId" name="pendampingId" {...isi("pendampingId")} className={input} {...attr("pendampingId")}>
          <option value="">Pilih pendamping</option>
          {pendampingCocok.map((p) => (
            <option key={p.id} value={p.id}>{p.nama}</option>
          ))}
        </select>
      </Bidang>
      <Bidang id="lokasiId" label="Lokasi layanan" galat={g.lokasiId}>
        <select id="lokasiId" name="lokasiId" {...isi("lokasiId")} className={input} {...attr("lokasiId")}>
          <option value="">Pilih lokasi</option>
          {opsi.lokasi.map((l) => (
            <option key={l.id} value={l.id}>{l.nama}</option>
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
      <button type="submit" disabled={pending} className={`${tombolUtama} w-full`}>
        <CheckCircle2 size={20} aria-hidden="true" />
        Verifikasi dan terbitkan tiket
      </button>
      <Galat id="galat-verifikasi" pesan={state?.pesan} />
    </form>
  );
}

export function PanelVerifikasi({ opsi, id, kode, status, verifikator, diverifikasiPada, alasanPenolakan }: Props) {
  const [tolakBuka, setTolakBuka] = useState(false);
  const menunggu = status === "BARU";

  return (
    <aside aria-labelledby="h-verifikasi" className="rounded-2xl border border-line bg-surface p-5 shadow-card lg:sticky lg:top-24">
      <h2 id="h-verifikasi" className="mb-3 flex items-center gap-2 text-lg font-bold text-navy-900">
        <ClipboardCheck size={20} aria-hidden="true" className="text-magenta-600" />
        Verifikasi
      </h2>

      <div className="mb-4">
        <LencanaLaporan status={status} />
      </div>

      {menunggu ? (
        <>
          <FormVerifikasi id={id} opsi={opsi} />
          <button
            type="button"
            onClick={() => setTolakBuka(true)}
            className={`${tombolNetral} mt-3 w-full border-error-50 text-error hover:bg-error-50`}
          >
            <XCircle size={20} aria-hidden="true" />
            Tolak laporan
          </button>
        </>
      ) : (
        <dl className="flex flex-col gap-3 text-sm">
          {verifikator && (
            <div>
              <dt className="font-semibold text-ink-soft">Diperiksa oleh</dt>
              <dd className="text-ink">{verifikator}</dd>
            </div>
          )}
          {diverifikasiPada && (
            <div>
              <dt className="font-semibold text-ink-soft">Waktu</dt>
              <dd className="text-ink">{diverifikasiPada}</dd>
            </div>
          )}
          {alasanPenolakan && (
            <div>
              <dt className="font-semibold text-ink-soft">Alasan penolakan</dt>
              <dd className="whitespace-pre-wrap break-words text-ink">{alasanPenolakan}</dd>
            </div>
          )}
        </dl>
      )}

      {tolakBuka && <ModalTolak id={id} kode={kode} onTutup={() => setTolakBuka(false)} />}
    </aside>
  );
}
