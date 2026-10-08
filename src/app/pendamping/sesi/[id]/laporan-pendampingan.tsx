"use client";

import { AlertCircle, ClipboardList, Image as IkonGambar, ImagePlus, Info, Lock, Pencil, Send, Trash2, Undo2, X } from "lucide-react";
import { startTransition, useActionState, useRef, useState } from "react";
import { IkonKotak } from "@/components/ikon-kotak";
import { TampilLaporan } from "@/components/tampil-laporan";
import { Galat, Modal, fokus, input, tombolNetral, tombolUtama } from "@/components/ui-form";
import type { LaporanView } from "@/lib/laporan-pendampingan";
import { FORMAT_FOTO, MAKS_FOTO, SkemaLaporanPendampingan, SkemaRevisi, galatBidang, periksaFoto, type GalatPendampingan } from "@/lib/pendampingan-skema";
import { kirimLaporanAksi, revisiLaporanAksi, type AksiLaporan } from "../../actions";

type Props = {
  sesiId: string;
  urutan: number;
  statusSesi: string;
  opsiJenis: { id: string; nama: string }[];
  jenisAwalId: string;
  laporan: LaporanView | null;
};

type Item = { file: File; galat: string | null };

const ukuranTeks = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const NAMA_BIDANG = ["jenisPendampinganId", "keterangan", "rekomendasi", "alasanRevisi"] as const;

function Kolom({ id, label, wajib = true, galat, children }: { id: string; label: string; wajib?: boolean; galat?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">
        {label} {wajib && <span className="text-error">*</span>}
      </label>
      {children}
      <div className="mt-1">
        <Galat id={`galat-${id}`} pesan={galat} />
      </div>
    </div>
  );
}

const areaTeks = "w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-base text-ink focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 aria-[invalid=true]:border-error aria-[invalid=true]:bg-error-50/40";

function FormLaporan({ sesiId, urutan, opsiJenis, jenisAwalId, laporan, onBatal }: Omit<Props, "statusSesi"> & { onBatal?: () => void }) {
  const revisi = laporan !== null;
  const [state, aksi, pending] = useActionState(revisi ? revisiLaporanAksi : kirimLaporanAksi, undefined as AksiLaporan);
  const idAwal = laporan ? (opsiJenis.find((j) => j.nama === laporan.jenis)?.id ?? jenisAwalId) : jenisAwalId;
  const [v, setV] = useState({ jenisPendampinganId: idAwal, keterangan: laporan?.keterangan ?? "", rekomendasi: laporan?.rekomendasi ?? "", alasanRevisi: "" });
  const [ajukan, setAjukan] = useState(laporan?.ajukanSesiLanjutan ?? false);
  const [baru, setBaru] = useState<Item[]>([]);
  const [hapus, setHapus] = useState<string[]>([]);
  const [galatLokal, setGalatLokal] = useState<GalatPendampingan>({});
  const [ringkasan, setRingkasan] = useState<string | null>(null);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const berkas = useRef<HTMLInputElement>(null);

  // Usulan yang sudah diputuskan Admin tidak dapat ditarik; sebelum itu Pendamping bebas mengubahnya.
  const usulanTerkunci = laporan?.statusUsulan === "DISETUJUI" || laporan?.statusUsulan === "DITOLAK";
  const lama = (laporan?.foto ?? []).filter((f) => !hapus.includes(f.id));
  const sah = baru.filter((b) => !b.galat);
  const total = lama.length + sah.length;
  const g: GalatPendampingan = { ...(state?.galat ?? {}), ...galatLokal };
  const attr = (k: keyof GalatPendampingan) => ({ "aria-invalid": g[k] ? true : undefined, "aria-describedby": g[k] ? `galat-${k}` : undefined });
  const isi = (k: keyof typeof v) => ({ value: v[k], onChange: (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value })) });

  function pilihFoto(e: React.ChangeEvent<HTMLInputElement>) {
    let hitung = total;
    const tambah = Array.from(e.target.files ?? []).map((file): Item => {
      const galat = periksaFoto(file);
      if (galat) return { file, galat };
      if (hitung >= MAKS_FOTO) return { file, galat: `Maksimal ${MAKS_FOTO} foto.` };
      hitung += 1;
      return { file, galat: null };
    });
    setBaru((x) => [...x, ...tambah]);
    e.target.value = "";
  }

  function periksaDanKonfirmasi() {
    const hasil = (revisi ? SkemaRevisi : SkemaLaporanPendampingan).safeParse({ ...v, ajukanSesiLanjutan: ajukan });
    const gl = hasil.success ? {} : galatBidang(hasil.error);
    setGalatLokal(gl);
    const n = Object.keys(gl).length;
    if (n > 0) {
      setRingkasan(`${n} kolom wajib belum diisi. Lengkapi kolom bertanda merah sebelum mengirim.`);
      const pertama = NAMA_BIDANG.find((k) => gl[k]);
      if (pertama) document.getElementById(pertama)?.focus();
      return;
    }
    if (baru.some((b) => b.galat)) {
      setRingkasan("Singkirkan foto yang bermasalah sebelum mengirim.");
      return;
    }
    setRingkasan(null);
    setKonfirmasi(true);
  }

  function kirim() {
    const fd = new FormData();
    fd.set("sesiId", sesiId);
    fd.set("jenisPendampinganId", v.jenisPendampinganId);
    fd.set("keterangan", v.keterangan);
    fd.set("rekomendasi", v.rekomendasi);
    if (ajukan) fd.set("ajukanSesiLanjutan", "on");
    if (revisi) fd.set("alasanRevisi", v.alasanRevisi);
    for (const id of hapus) fd.append("hapusFoto", id);
    for (const b of sah) fd.append("foto", b.file);
    setKonfirmasi(false);
    startTransition(() => aksi(fd));
  }

  const ringkasanTampil = ringkasan ?? (state?.pesan && !state.galat ? state.pesan : null) ?? (state?.galat ? "Ada kolom yang perlu diperbaiki." : null);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        periksaDanKonfirmasi();
      }}
      className="flex flex-col gap-5"
    >
      {ringkasanTampil && (
        <p role="alert" className="flex items-start gap-3 rounded-xl bg-error-50 p-4 text-sm font-medium text-error" data-testid="ringkasan-galat">
          <AlertCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>{ringkasanTampil}</span>
        </p>
      )}

      <Kolom id="jenisPendampinganId" label="Jenis pendampingan" galat={g.jenisPendampinganId}>
        <select id="jenisPendampinganId" {...isi("jenisPendampinganId")} className={input} {...attr("jenisPendampinganId")}>
          <option value="">Pilih jenis</option>
          {opsiJenis.map((j) => (
            <option key={j.id} value={j.id}>
              {j.nama}
            </option>
          ))}
        </select>
      </Kolom>

      <Kolom id="keterangan" label="Keterangan pendampingan" galat={g.keterangan}>
        <textarea id="keterangan" rows={5} maxLength={3000} placeholder="Tuliskan jalannya sesi, kondisi korban, dan hal penting yang dibahas." {...isi("keterangan")} className={areaTeks} {...attr("keterangan")} />
      </Kolom>

      <Kolom id="rekomendasi" label="Rekomendasi tindak lanjut" galat={g.rekomendasi}>
        <textarea id="rekomendasi" rows={4} maxLength={2000} {...isi("rekomendasi")} className={areaTeks} {...attr("rekomendasi")} />
      </Kolom>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-blue-100">
        <input type="checkbox" checked={ajukan} disabled={usulanTerkunci} onChange={(e) => setAjukan(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 rounded-md accent-blue-600" />
        <span>
          <span className="block font-bold text-ink">Ajukan sebagai usulan sesi lanjutan</span>
          <span className="block text-sm text-ink-soft">
            {usulanTerkunci ? "Usulan ini sudah diputuskan Admin dan tidak dapat ditarik." : "Admin akan meninjau usulan dan menjadwalkan sesi baru."}
          </span>
        </span>
      </label>

      <div>
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <span className="text-sm font-bold">
            Foto pendukung <span className="font-medium text-ink-mute">(tidak wajib)</span>
          </span>
          <span className="text-sm text-ink-soft" data-testid="hitung-foto">
            {total} dari {MAKS_FOTO} foto
          </span>
        </div>
        <p className="mb-3 text-sm text-ink-soft">
          {FORMAT_FOTO}, maksimal 5 MB per foto, hingga {MAKS_FOTO} foto.
        </p>
        <input ref={berkas} id="foto-baru" type="file" multiple accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={pilihFoto} className="sr-only" tabIndex={-1} />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" aria-label="Foto laporan">
          <li>
            <button
              type="button"
              disabled={total >= MAKS_FOTO}
              onClick={() => berkas.current?.click()}
              className={`flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-600/40 bg-blue-50/50 p-2 text-center text-sm font-bold text-navy-800 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 ${fokus}`}
            >
              <ImagePlus size={24} aria-hidden="true" className="text-blue-600" />
              Tambah foto
            </button>
          </li>
          {(laporan?.foto ?? []).map((f) => {
            const dibuang = hapus.includes(f.id);
            return (
              <li key={f.id} className="min-w-0">
                <div className={"relative aspect-square overflow-hidden rounded-xl border border-line bg-blue-50 " + (dibuang ? "opacity-40" : "")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/foto-pendampingan/${f.id}`} alt={f.nama} className="h-full w-full object-cover" />
                </div>
                <div className="mt-1 flex items-center justify-between gap-1">
                  <span className="min-w-0 truncate text-xs text-ink-soft" title={f.nama}>
                    {dibuang ? "Akan dihapus" : f.nama}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHapus((x) => (dibuang ? x.filter((i) => i !== f.id) : [...x, f.id]))}
                    aria-label={`${dibuang ? "Batalkan penghapusan" : "Hapus"} foto ${f.nama}`}
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-blue-50 ${fokus}`}
                  >
                    {dibuang ? <Undo2 size={16} aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
                  </button>
                </div>
              </li>
            );
          })}
          {baru.map((b, i) => (
            <li key={`${b.file.name}-${i}`} className="min-w-0">
              <div className={"grid aspect-square place-items-center rounded-xl border-2 " + (b.galat ? "border-error bg-error-50/40 text-error" : "border-line bg-blue-50 text-blue-600")}>
                {b.galat ? <AlertCircle size={28} aria-hidden="true" /> : <IkonGambar size={28} aria-hidden="true" />}
              </div>
              <div className="mt-1 flex items-center justify-between gap-1">
                <span className="min-w-0 truncate text-xs font-semibold text-ink" title={b.file.name}>
                  {b.file.name}
                </span>
                <button type="button" onClick={() => setBaru((x) => x.filter((it) => it !== b))} aria-label={`${b.galat ? "Singkirkan" : "Hapus"} ${b.file.name}`} className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-blue-50 ${fokus}`}>
                  {b.galat ? <X size={16} aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
                </button>
              </div>
              <p className={"text-xs " + (b.galat ? "text-error" : "text-ink-mute")}>{b.galat ?? ukuranTeks(b.file.size)}</p>
            </li>
          ))}
        </ul>
      </div>

      {revisi && (
        <Kolom id="alasanRevisi" label="Alasan revisi" galat={g.alasanRevisi}>
          <textarea id="alasanRevisi" rows={2} maxLength={300} placeholder="Mengapa laporan ini perlu diubah?" {...isi("alasanRevisi")} className={areaTeks} {...attr("alasanRevisi")} />
        </Kolom>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-5">
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          <Lock size={16} aria-hidden="true" />
          Setelah dikirim, laporan terkunci.
        </p>
        <div className="flex flex-wrap gap-3">
          {onBatal && (
            <button type="button" onClick={onBatal} className={tombolNetral}>
              Batal
            </button>
          )}
          <button type="submit" disabled={pending} className={tombolUtama}>
            <Send size={18} aria-hidden="true" />
            {revisi ? "Kirim revisi" : "Kirim laporan"}
          </button>
        </div>
      </div>

      {konfirmasi && (
        <Modal
          idJudul="judul-kirim-laporan"
          idSubjudul="sub-kirim-laporan"
          ikon={Lock}
          warna="navy"
          judul={revisi ? "Kirim revisi laporan?" : "Kirim laporan pendampingan?"}
          subjudul={`Setelah dikirim, laporan terkunci dan hanya dapat diubah melalui Ajukan revisi. Admin dan Pendamping lain pada kasus ini dapat membaca laporan sesi ${urutan}.`}
          onTutup={() => setKonfirmasi(false)}
        >
          {ajukan && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-info-50 p-3 text-sm text-info">
              <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              Usulan sesi lanjutan ikut dikirim ke Admin.
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={() => setKonfirmasi(false)} className={tombolNetral} autoFocus>
              Periksa lagi
            </button>
            <button type="button" disabled={pending} onClick={kirim} className={tombolUtama}>
              <Lock size={18} aria-hidden="true" />
              {revisi ? "Kirim revisi" : "Kirim dan kunci"}
            </button>
          </div>
        </Modal>
      )}
    </form>
  );
}

/** Panel Laporan pendampingan pada detail sesi: formulir, keadaan terkunci, dan revisi. */
export function PanelLaporanPendampingan(props: Props) {
  const { laporan, statusSesi, urutan } = props;
  const [revisiUntuk, setRevisiUntuk] = useState<number | null>(null);
  const bisaLapor = statusSesi === "BERLANGSUNG" || statusSesi === "SELESAI";
  const sedangRevisi = laporan !== null && revisiUntuk === laporan.versi;

  return (
    <section aria-labelledby="h-laporan" className="rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IkonKotak ikon={ClipboardList} warna="blue" />
          <h2 id="h-laporan" className="text-lg font-bold text-navy-900">
            Laporan pendampingan · Sesi {urutan}
          </h2>
        </div>
        {laporan && !sedangRevisi && (
          <button type="button" onClick={() => setRevisiUntuk(laporan.versi)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-blue-600 bg-surface px-4 text-sm font-bold text-navy-800 hover:bg-blue-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
            <Pencil size={16} aria-hidden="true" />
            Ajukan revisi
          </button>
        )}
        {!laporan && bisaLapor && <span className="text-sm text-ink-soft">Kolom bertanda * wajib diisi</span>}
      </div>

      {laporan ? (
        sedangRevisi ? (
          <FormLaporan key={`revisi-${laporan.versi}`} {...props} onBatal={() => setRevisiUntuk(null)} />
        ) : (
          <>
            <p className="mb-4 flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-sm text-ink">
              <Lock size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-navy-700" />
              <span>
                <strong>Laporan terkunci (baca saja).</strong> Ajukan revisi bila ada yang perlu diubah.
              </span>
            </p>
            <TampilLaporan laporan={laporan} />
          </>
        )
      ) : bisaLapor ? (
        <FormLaporan {...props} />
      ) : (
        <p className="flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-ink-soft" data-testid="laporan-belum-bisa">
          <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
          {statusSesi === "TERJADWAL" ? "Laporan dapat diisi setelah sesi dimulai." : "Sesi ini tidak berlangsung, jadi tidak ada laporan yang perlu diisi."}
        </p>
      )}
    </section>
  );
}

