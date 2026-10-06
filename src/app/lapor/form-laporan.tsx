"use client";

import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  FilePlus2,
  Lock,
  Send,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import {
  FORMAT_BERKAS,
  JENIS_KELAMIN,
  Langkah1,
  Langkah2,
  MAKS_BERKAS,
  NAMA_BIDANG,
  SkemaLaporan,
  galatPerBidang,
  periksaBerkas,
  type Galat,
} from "@/lib/laporan";
import { kirimLaporan } from "./actions";

type Opsi = { id: string; nama: string };
type ItemBerkas = { file: File; galat: string | null };

const LANGKAH = ["Pelapor & korban", "Kejadian", "Dokumen"];
const MAKS_KRONOLOGI = 2000;

const fokus = "focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100";
const kontrol =
  "h-13 w-full rounded-xl border border-line-strong bg-surface px-4 text-base text-ink placeholder:text-ink-mute focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 aria-[invalid=true]:border-error aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-error-50";

function hariIniLokal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ukuranTeks(n: number) {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

function Bidang({
  id,
  label,
  wajib,
  petunjuk,
  galat,
  children,
}: {
  id: string;
  label: string;
  wajib?: boolean;
  petunjuk?: string;
  galat?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-bold text-ink">
        {label} {wajib ? <span className="text-error">*</span> : <span className="font-medium text-ink-mute">(tidak wajib)</span>}
      </label>
      {petunjuk && (
        <p id={`${id}-petunjuk`} className="-mt-1 text-sm text-ink-mute">
          {petunjuk}
        </p>
      )}
      {children}
      {galat && (
        <p id={`${id}-galat`} role="alert" className="flex items-start gap-2 text-sm font-medium text-error">
          <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          {galat}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, galat?: string, petunjuk?: boolean) {
  return galat ? `${id}-galat` : petunjuk ? `${id}-petunjuk` : undefined;
}

export function FormLaporan({ jenis, kecamatan }: { jenis: Opsi[]; kecamatan: Opsi[] }) {
  const [state, aksi, mengirim] = useActionState(kirimLaporan, undefined);
  const form = useRef<HTMLFormElement>(null);
  const ringkasanRef = useRef<HTMLDivElement>(null);
  const inputBerkas = useRef<HTMLInputElement>(null);
  const [hariIni] = useState(hariIniLokal);

  const [langkah, setLangkah] = useState<1 | 2 | 3>(1);
  const [galat, setGalat] = useState<Galat>({});
  const [ringkasan, setRingkasan] = useState<string | null>(null);
  const [panjang, setPanjang] = useState(0);
  const [berkas, setBerkas] = useState<ItemBerkas[]>([]);
  const [lihatState, setLihatState] = useState(state);

  // Hasil dari server (galat validasi atau penyimpanan) menggantikan keadaan tampilan.
  if (state !== lihatState) {
    setLihatState(state);
    if (state) {
      setGalat(state.galat ?? {});
      setRingkasan(state.ringkasan ?? null);
      if (state.langkah) setLangkah(state.langkah);
    }
  }

  useEffect(() => {
    if (ringkasan) ringkasanRef.current?.focus();
  }, [ringkasan]);

  const nilaiAwal = (k: string) => state?.nilai?.[k] ?? "";

  function nilaiFormulir() {
    const fd = new FormData(form.current!);
    return Object.fromEntries(NAMA_BIDANG.map((k) => [k, String(fd.get(k) ?? "")]));
  }

  function tampilkanGalat(g: Galat, pesan: string) {
    setGalat(g);
    setRingkasan(pesan);
  }

  function lanjut() {
    const skema = langkah === 1 ? Langkah1 : Langkah2;
    const hasil = skema.safeParse(nilaiFormulir());
    if (!hasil.success) {
      const g = galatPerBidang(hasil.error);
      const n = Object.keys(g).length;
      tampilkanGalat(g, `${n} kolom perlu dilengkapi. Perbaiki kolom bertanda merah untuk melanjutkan.`);
      return;
    }
    setGalat({});
    setRingkasan(null);
    setLangkah((langkah + 1) as 2 | 3);
    window.scrollTo({ top: 0 });
  }

  function kembali() {
    setGalat({});
    setRingkasan(null);
    setLangkah((langkah - 1) as 1 | 2);
    window.scrollTo({ top: 0 });
  }

  function saatKirim(e: React.FormEvent<HTMLFormElement>) {
    const nilai = nilaiFormulir();
    const hasil = SkemaLaporan.safeParse(nilai);
    const adaBerkasBermasalah = berkas.some((b) => b.galat);
    if (hasil.success && !adaBerkasBermasalah) return; // lanjut ke Server Action
    e.preventDefault();
    if (!hasil.success) {
      const g = galatPerBidang(hasil.error);
      const bidang = Object.keys(g);
      const adaDiLangkahAwal = bidang.some((b) => b in Langkah1.shape || b in Langkah2.shape);
      tampilkanGalat(g, `${bidang.length} kolom perlu dilengkapi. Perbaiki kolom bertanda merah untuk melanjutkan.`);
      if (adaDiLangkahAwal) setLangkah(bidang.some((b) => b in Langkah1.shape) ? 1 : 2);
    } else {
      tampilkanGalat({}, "Hapus berkas yang bermasalah sebelum mengirim.");
    }
  }

  // Berkas yang sah disinkronkan ke input file agar ikut terkirim; yang bermasalah tidak dikirim.
  function sinkron(daftar: ItemBerkas[]) {
    const dt = new DataTransfer();
    daftar.filter((b) => !b.galat).forEach((b) => dt.items.add(b.file));
    if (inputBerkas.current) inputBerkas.current.files = dt.files;
  }

  function pilihBerkas(e: React.ChangeEvent<HTMLInputElement>) {
    const baru = Array.from(e.target.files ?? []).map((file) => ({ file, galat: periksaBerkas(file) }));
    let sah = berkas.filter((b) => !b.galat).length;
    const gabung = [
      ...berkas,
      ...baru.map((b) => {
        if (b.galat) return b;
        if (sah >= MAKS_BERKAS) return { ...b, galat: `Maksimal ${MAKS_BERKAS} berkas.` };
        sah += 1;
        return b;
      }),
    ];
    setBerkas(gabung);
    sinkron(gabung);
  }

  function hapusBerkas(i: number) {
    const sisa = berkas.filter((_, j) => j !== i);
    setBerkas(sisa);
    sinkron(sisa);
  }

  const aktif = (n: number) => (langkah === n ? "" : "hidden");

  return (
    <form ref={form} action={aksi} onSubmit={saatKirim} noValidate className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="flex-1 px-4 pb-6 pt-5">
        <ol aria-label="Langkah pengisian" className="mb-5 grid grid-cols-3 gap-2">
          {LANGKAH.map((nama, i) => {
            const n = i + 1;
            return (
              <li key={nama} aria-current={langkah === n ? "step" : undefined}>
                <span className={"block h-1.5 rounded-md " + (n <= langkah ? "bg-blue-600" : "bg-line")} />
                <span className={"mt-2 block text-[13px] leading-tight " + (langkah === n ? "font-bold text-navy-900" : "text-ink-mute")}>
                  {n}. {nama}
                </span>
              </li>
            );
          })}
        </ol>

        {ringkasan && (
          <div
            ref={ringkasanRef}
            tabIndex={-1}
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl bg-error-50 p-4 text-sm font-medium text-error outline-none"
          >
            <AlertCircle size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
            <p>{ringkasan}</p>
          </div>
        )}

        {/* Kolom jebakan untuk robot */}
        <input name="situs" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" defaultValue="" />

        {/* Langkah 1 */}
        <fieldset className={aktif(1) + " flex flex-col gap-5"}>
          <legend className="mb-1 text-xl font-extrabold text-navy-900">Data pelapor</legend>
          <Bidang id="namaPelapor" label="Nama pelapor" wajib galat={galat.namaPelapor}>
            <input id="namaPelapor" name="namaPelapor" autoComplete="name" defaultValue={nilaiAwal("namaPelapor")} aria-invalid={!!galat.namaPelapor} aria-describedby={describedBy("namaPelapor", galat.namaPelapor)} className={kontrol} />
          </Bidang>
          <Bidang id="kontakPelapor" label="Nomor HP / WhatsApp" wajib galat={galat.kontakPelapor}>
            <input id="kontakPelapor" name="kontakPelapor" type="tel" inputMode="tel" autoComplete="tel" placeholder="Contoh: 0812 3456 7890" defaultValue={nilaiAwal("kontakPelapor")} aria-invalid={!!galat.kontakPelapor} aria-describedby={describedBy("kontakPelapor", galat.kontakPelapor)} className={kontrol} />
          </Bidang>

          <div className="border-t border-line-soft pt-5" />
          <h2 className="-mt-3 text-xl font-extrabold text-navy-900">Data korban</h2>
          <Bidang id="namaKorban" label="Nama korban" wajib galat={galat.namaKorban}>
            <input id="namaKorban" name="namaKorban" placeholder="Boleh nama panggilan" defaultValue={nilaiAwal("namaKorban")} aria-invalid={!!galat.namaKorban} aria-describedby={describedBy("namaKorban", galat.namaKorban)} className={kontrol} />
          </Bidang>
          <Bidang id="usiaKorban" label="Usia korban" galat={galat.usiaKorban}>
            <input id="usiaKorban" name="usiaKorban" type="number" inputMode="numeric" min={0} max={120} defaultValue={nilaiAwal("usiaKorban")} aria-invalid={!!galat.usiaKorban} aria-describedby={describedBy("usiaKorban", galat.usiaKorban)} className={kontrol + " max-w-[10rem]"} />
          </Bidang>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-bold text-ink">
              Jenis kelamin korban <span className="font-medium text-ink-mute">(tidak wajib)</span>
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {JENIS_KELAMIN.map((j) => (
                <label key={j} className="flex h-13 cursor-pointer items-center gap-3 rounded-xl border border-line-strong bg-surface px-4 font-medium has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-blue-100">
                  <input type="radio" name="jenisKelaminKorban" value={j} defaultChecked={nilaiAwal("jenisKelaminKorban") === j} className="h-5 w-5 accent-blue-600" />
                  {j}
                </label>
              ))}
            </div>
          </fieldset>
        </fieldset>

        {/* Langkah 2 */}
        <fieldset className={aktif(2) + " flex flex-col gap-5"}>
          <legend className="mb-1 text-xl font-extrabold text-navy-900">Tentang kejadian</legend>
          <Bidang id="jenisKekerasanId" label="Jenis kekerasan" wajib galat={galat.jenisKekerasanId}>
            <div className="relative">
              <select id="jenisKekerasanId" name="jenisKekerasanId" defaultValue={nilaiAwal("jenisKekerasanId")} aria-invalid={!!galat.jenisKekerasanId} aria-describedby={describedBy("jenisKekerasanId", galat.jenisKekerasanId)} className={kontrol + " appearance-none pr-12"}>
                <option value="">Pilih jenis kekerasan</option>
                {jenis.map((j) => (
                  <option key={j.id} value={j.id}>{j.nama}</option>
                ))}
              </select>
              <ChevronDown size={20} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-mute" />
            </div>
          </Bidang>
          <Bidang id="kecamatanId" label="Kecamatan tempat kejadian" wajib galat={galat.kecamatanId}>
            <div className="relative">
              <select id="kecamatanId" name="kecamatanId" defaultValue={nilaiAwal("kecamatanId")} aria-invalid={!!galat.kecamatanId} aria-describedby={describedBy("kecamatanId", galat.kecamatanId)} className={kontrol + " appearance-none pr-12"}>
                <option value="">Pilih kecamatan</option>
                {kecamatan.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
              <ChevronDown size={20} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-mute" />
            </div>
          </Bidang>
          <Bidang id="tanggalKejadian" label="Tanggal kejadian" wajib petunjuk="Jika tidak ingat pasti, pilih perkiraan tanggal." galat={galat.tanggalKejadian}>
            <div className="relative">
              <input id="tanggalKejadian" name="tanggalKejadian" type="date" max={hariIni} defaultValue={nilaiAwal("tanggalKejadian")} aria-invalid={!!galat.tanggalKejadian} aria-describedby={describedBy("tanggalKejadian", galat.tanggalKejadian, true)} className={kontrol + " pr-12"} />
              <Calendar size={20} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-mute" />
            </div>
          </Bidang>
          <Bidang id="kronologi" label="Kronologi kejadian" wajib petunjuk="Ceritakan sebisanya: apa yang terjadi, di mana, dan siapa yang terlibat." galat={galat.kronologi}>
            <textarea id="kronologi" name="kronologi" rows={7} maxLength={MAKS_KRONOLOGI} onInput={(e) => setPanjang(e.currentTarget.value.length)} defaultValue={nilaiAwal("kronologi")} aria-invalid={!!galat.kronologi} aria-describedby={describedBy("kronologi", galat.kronologi, true)} className={kontrol + " h-auto min-h-40 py-3"} />
            <p className="text-right text-sm tabular-nums text-ink-mute" aria-live="polite">
              {panjang} / {MAKS_KRONOLOGI} karakter
            </p>
          </Bidang>
        </fieldset>

        {/* Langkah 3 */}
        <fieldset className={aktif(3) + " flex flex-col gap-5"}>
          <legend className="mb-1 text-xl font-extrabold text-navy-900">
            Dokumen pendukung <span className="text-base font-medium text-ink-mute">(tidak wajib)</span>
          </legend>
          <p className="-mt-2 text-ink-soft">
            Foto, tangkapan layar, atau surat. {FORMAT_BERKAS}, maksimal 5 MB per berkas, hingga {MAKS_BERKAS} berkas.
          </p>

          <input ref={inputBerkas} id="dokumen" name="dokumen" type="file" multiple accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" onChange={pilihBerkas} className="sr-only" tabIndex={-1} />
          <button
            type="button"
            onClick={() => {
              // Memilih ulang menggantikan isi input; berkas lama dipertahankan lewat state.
              inputBerkas.current?.click();
            }}
            className={`flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-600/40 bg-blue-50/50 px-4 py-6 font-bold text-navy-800 transition-colors hover:bg-blue-50 ${fokus}`}
          >
            <FilePlus2 size={32} aria-hidden="true" className="text-blue-600" />
            Pilih berkas
          </button>

          {berkas.length > 0 && (
            <ul className="flex flex-col gap-3" aria-label="Berkas dipilih">
              {berkas.map((b, i) => (
                <li
                  key={`${b.file.name}-${i}`}
                  className={"flex items-center gap-3 rounded-xl border bg-surface p-4 " + (b.galat ? "border-error bg-error-50/40" : "border-line")}
                >
                  {b.galat ? (
                    <AlertCircle size={24} aria-hidden="true" className="shrink-0 text-error" />
                  ) : (
                    <CheckCircle2 size={24} aria-hidden="true" className="shrink-0 text-success" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-ink">{b.file.name}</p>
                    <p className={"text-sm " + (b.galat ? "text-error" : "text-ink-mute")}>
                      {b.galat ?? `${ukuranTeks(b.file.size)} · Siap dikirim`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => hapusBerkas(i)}
                    aria-label={`${b.galat ? "Singkirkan" : "Hapus"} ${b.file.name}`}
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-blue-50 ${fokus}`}
                  >
                    {b.galat ? <X size={20} aria-hidden="true" /> : <Trash2 size={20} aria-hidden="true" />}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-line-soft pt-5" />
          <div>
            <label
              className={"flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-blue-100 " + (galat.persetujuan ? "border-error bg-error-50/40" : "border-line-strong bg-surface")}
            >
              <input id="persetujuan" name="persetujuan" type="checkbox" defaultChecked={nilaiAwal("persetujuan") === "on"} aria-invalid={!!galat.persetujuan} aria-describedby={describedBy("persetujuan", galat.persetujuan)} className="mt-0.5 h-6 w-6 shrink-0 rounded-md accent-blue-600" />
              <span className="font-medium text-ink">
                Saya menyetujui data pribadi dalam laporan ini digunakan oleh DALDUK PPA Kabupaten Bandung hanya untuk penanganan kasus. <span className="text-error">*</span>
              </span>
            </label>
            {galat.persetujuan && (
              <p id="persetujuan-galat" role="alert" className="mt-2 flex items-start gap-2 text-sm font-medium text-error">
                <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                {galat.persetujuan}
              </p>
            )}
            <p className="mt-3 flex items-start gap-2 text-sm text-ink-mute">
              <Lock size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              Data Anda dirahasiakan dan hanya dibaca petugas yang menangani laporan.
            </p>
          </div>
        </fieldset>
      </div>

      <div className="sticky bottom-0 border-t border-line bg-surface">
        <div className="mx-auto flex max-w-md gap-3 px-4 py-3">
          {langkah === 1 ? (
            <Link href="/" className={`inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface font-bold text-ink transition-colors hover:bg-blue-50 ${fokus}`}>
              <X size={18} aria-hidden="true" />
              Batal
            </Link>
          ) : (
            <button type="button" onClick={kembali} className={`inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface font-bold text-ink transition-colors hover:bg-blue-50 ${fokus}`}>
              Kembali
            </button>
          )}
          {langkah < 3 ? (
            <button type="button" onClick={lanjut} className={`inline-flex h-13 flex-[2] items-center justify-center gap-2 rounded-xl bg-magenta-600 font-bold text-white shadow-card transition-colors hover:bg-magenta-700 ${fokus}`}>
              Lanjut
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          ) : (
            <button type="submit" disabled={mengirim} className={`inline-flex h-13 flex-[2] items-center justify-center gap-2 rounded-xl bg-magenta-600 font-bold text-white shadow-card transition-colors hover:bg-magenta-700 disabled:bg-line-strong disabled:shadow-none ${fokus}`}>
              <Send size={18} aria-hidden="true" />
              {mengirim ? "Mengirim..." : "Kirim Laporan"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
