import { CalendarPlus, Lock } from "lucide-react";
import type { LaporanView } from "@/lib/laporan-pendampingan";

const ZONA = "Asia/Jakarta";
const tglJam = (iso: string) => new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: ZONA });

const LABEL_USULAN = {
  MENUNGGU: "Diajukan sebagai usulan sesi lanjutan",
  DISETUJUI: "Usulan sesi lanjutan disetujui dan dijadwalkan",
  DITOLAK: "Usulan sesi lanjutan tidak disetujui",
} as const;

export function Foto({ foto, ukuran = "h-24 w-24" }: { foto: LaporanView["foto"]; ukuran?: string }) {
  if (foto.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-3" aria-label="Foto pendukung">
      {foto.map((f) => (
        <li key={f.id} className="w-24">
          <a href={`/foto-pendampingan/${f.id}`} target="_blank" rel="noopener noreferrer" className="block rounded-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100" aria-label={`Buka foto ${f.nama}`}>
            {/* Berkas dilayani lewat rute berotorisasi; tidak ada optimasi gambar Next yang perlu dipakai. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/foto-pendampingan/${f.id}`} alt={f.nama} loading="lazy" className={`${ukuran} rounded-xl border border-line bg-blue-50 object-cover`} />
          </a>
          <p className="mt-1 truncate text-xs text-ink-soft" title={f.nama}>
            {f.nama}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Bagian({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 text-sm font-bold text-ink-soft">{label}</h3>
      <div className="rounded-xl bg-blue-50/60 px-4 py-3 text-ink">{children}</div>
    </div>
  );
}

/** Isi laporan pendampingan yang sudah terkirim (baca saja): dipakai Pendamping, Pendamping lain, dan Admin. */
export function TampilLaporan({ laporan, denganRiwayat = true }: { laporan: LaporanView; denganRiwayat?: boolean }) {
  return (
    <div className="flex flex-col gap-4" data-testid="tampil-laporan">
      <p className="flex items-start gap-2 text-sm text-ink-soft">
        <Lock size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
        <span>
          Dikirim {tglJam(laporan.dikirimPada)} oleh {laporan.penulis}
          {laporan.versi > 1 && ` · Versi ${laporan.versi}`}
        </span>
      </p>
      <Bagian label="Jenis pendampingan">{laporan.jenis}</Bagian>
      <Bagian label="Keterangan pendampingan">
        <p className="whitespace-pre-wrap break-words">{laporan.keterangan}</p>
      </Bagian>
      <Bagian label="Rekomendasi tindak lanjut">
        <p className="whitespace-pre-wrap break-words">{laporan.rekomendasi}</p>
      </Bagian>
      {laporan.statusUsulan && (
        <p className="inline-flex w-fit items-center gap-2 rounded-lg bg-info-50 px-3 py-1.5 text-sm font-semibold text-info">
          <CalendarPlus size={16} aria-hidden="true" />
          {LABEL_USULAN[laporan.statusUsulan]}
        </p>
      )}
      {laporan.foto.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-ink-soft">Foto pendukung ({laporan.foto.length})</h3>
          <Foto foto={laporan.foto} />
        </div>
      )}
      {denganRiwayat && laporan.riwayat.length > 1 && (
        <div className="border-t border-line-soft pt-4">
          <h3 className="mb-2 text-sm font-bold text-ink-soft">Riwayat revisi</h3>
          <ol className="flex flex-col gap-3">
            {laporan.riwayat.map((r) => (
              <li key={r.versi} className="text-sm">
                <p className="font-bold text-ink">
                  Versi {r.versi} · {r.alasan ? "Revisi dikirim" : "Laporan dikirim"}
                </p>
                <p className="text-ink-soft">
                  {tglJam(r.pada)} · {r.oleh}
                </p>
                {r.alasan && <p className="text-ink">Alasan: {r.alasan}</p>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
