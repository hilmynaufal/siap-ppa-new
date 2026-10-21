"use client";

import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  HeartHandshake,
  ChevronDown,
  FilePlus2,
  Lock,
  Send,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import {
  BIDANG_JEBAKAN,
  DOKUMEN_LAPORAN,
  FORMAT_BERKAS,
  OPSI_JENIS_KELAMIN,
  OPSI_PENDIDIKAN,
  OPSI_STATUS_BPJS,
  OPSI_STATUS_PERKAWINAN,
  SkemaLaporan,
  galatPerBidang,
  galatSampaiLangkah,
  hitungUsia,
  langkahDariBidang,
  bidangDokumen,
  nilaiDariFormData,
  periksaBerkas,
  type Galat,
  type JenisDokumenLaporan,
  type Langkah,
} from "@/lib/laporan";
import { kirimLaporan } from "./actions";

type Opsi = { id: string; nama: string };
type OpsiDesa = Opsi & { kecamatanId: string };
type ItemBerkas = { file: File; galat: string | null };
type BerkasPerJenis = Partial<Record<JenisDokumenLaporan, ItemBerkas>>;

const LANGKAH = ["Pelapor", "Korban", "Kejadian", "Terlapor", "Dokumen"];
const MAKS_KRONOLOGI = 2000;

const fokus = "focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100";
const kontrol =
  "h-13 w-full rounded-xl border border-line-strong bg-surface px-4 text-base text-ink placeholder:text-ink-mute focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100 aria-[invalid=true]:border-error aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-error-50";
const kartuPilihan =
  "flex h-13 cursor-pointer items-center gap-3 rounded-xl border border-line-strong bg-surface px-4 font-medium has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-100";

// Seperti kartuPilihan, tetapi tingginya mengikuti isi agar nama yang panjang tetap terbaca.
const kartuCentang = kartuPilihan.replace("h-13", "min-h-13 py-3");

function hariIniLokal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ukuranTeks(n: number) {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

function SlotDokumen({
  jenis,
  label,
  wajib,
  item,
  onUbah,
}: {
  jenis: JenisDokumenLaporan;
  label: string;
  wajib: boolean;
  item: ItemBerkas | undefined;
  onUbah: (item: ItemBerkas | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const bidang = bidangDokumen(jenis);

  function pilih(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return onUbah(null);
    const galat = periksaBerkas(file);
    // Berkas bermasalah tidak ikut terkirim: kolomnya dikosongkan dan pesannya ditampilkan.
    if (galat) e.target.value = "";
    onUbah({ file, galat });
  }

  function hapus() {
    if (input.current) input.current.value = "";
    onUbah(null);
  }

  return (
    <li className={"rounded-xl border bg-surface p-4 " + (item?.galat ? "border-error bg-error-50/40" : "border-line")}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={bidang} className="font-bold text-ink">
          {label}
        </label>
        <span className={"shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold " + (wajib ? "bg-sun-50 text-brand-700" : "bg-brand-50 text-brand-700")}>{wajib ? "Wajib" : "Opsional"}</span>
      </div>
      <input ref={input} id={bidang} name={bidang} type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" onChange={pilih} className="sr-only" tabIndex={-1} />
      {item ? (
        <div className="mt-3 flex items-center gap-3">
          {item.galat ? <AlertCircle size={24} aria-hidden="true" className="shrink-0 text-error" /> : <CheckCircle2 size={24} aria-hidden="true" className="shrink-0 text-success" />}
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-ink">{item.file.name}</p>
            <p className={"text-sm " + (item.galat ? "text-error" : "text-ink-mute")}>{item.galat ?? `${ukuranTeks(item.file.size)} · Siap dikirim`}</p>
          </div>
          <button type="button" onClick={hapus} aria-label={`${item.galat ? "Singkirkan" : "Hapus"} ${item.file.name}`} className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-brand-50 ${fokus}`}>
            {item.galat ? <X size={20} aria-hidden="true" /> : <Trash2 size={20} aria-hidden="true" />}
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => input.current?.click()} className={`mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-600/40 bg-brand-50/50 font-bold text-brand-800 transition-colors hover:bg-brand-50 ${fokus}`}>
          <FilePlus2 size={20} aria-hidden="true" className="text-brand-700" />
          Pilih berkas
        </button>
      )}
    </li>
  );
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

/** Pilihan (select) dengan panah; `kosong` adalah teks pilihan awal. */
function Pilih({
  id,
  daftar,
  kosong,
  nilaiAwal,
  galat,
  petunjuk,
  nilai,
  onUbah,
  nonaktif,
}: {
  id: string;
  daftar: { nilai: string; label: string }[];
  kosong: string;
  nilaiAwal?: string;
  galat?: string;
  petunjuk?: boolean;
  nilai?: string;
  onUbah?: (v: string) => void;
  nonaktif?: boolean;
}) {
  const terkendali = nilai !== undefined;
  return (
    <div className="relative">
      <select
        id={id}
        name={id}
        {...(terkendali ? { value: nilai, onChange: (e) => onUbah?.(e.target.value) } : { defaultValue: nilaiAwal ?? "" })}
        disabled={nonaktif}
        aria-invalid={!!galat}
        aria-describedby={describedBy(id, galat, petunjuk)}
        className={kontrol + " appearance-none pr-12 disabled:bg-canvas disabled:text-ink-mute"}
      >
        <option value="">{kosong}</option>
        {daftar.map((o) => (
          <option key={o.nilai} value={o.nilai}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={20} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-mute" />
    </div>
  );
}

function Teks({
  id,
  galat,
  nilaiAwal,
  petunjuk,
  className,
  ...sisa
}: { id: string; galat?: string; nilaiAwal: string; petunjuk?: boolean } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "name" | "defaultValue">) {
  return (
    <input
      id={id}
      name={id}
      defaultValue={nilaiAwal}
      aria-invalid={!!galat}
      aria-describedby={describedBy(id, galat, petunjuk)}
      className={kontrol + (className ? ` ${className}` : "")}
      {...sisa}
    />
  );
}

function PilihanJenisKelamin({ nama, nilaiAwal, wajib, galat }: { nama: string; nilaiAwal: string; wajib: boolean; galat?: string }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-bold text-ink">
        Jenis kelamin {wajib ? <span className="text-error">*</span> : <span className="font-medium text-ink-mute">(tidak wajib)</span>}
      </legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {OPSI_JENIS_KELAMIN.map((j) => (
          <label key={j.nilai} className={kartuPilihan}>
            <input type="radio" name={nama} value={j.nilai} defaultChecked={nilaiAwal === j.nilai} className="h-5 w-5 accent-brand-600" />
            {j.label}
          </label>
        ))}
      </div>
      {galat && (
        <p role="alert" className="flex items-start gap-2 text-sm font-medium text-error">
          <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          {galat}
        </p>
      )}
    </fieldset>
  );
}

export function FormLaporan({
  jenis,
  kecamatan,
  desa,
  hubungan,
  pekerjaan,
  pendampingan,
  agama,
}: {
  jenis: Opsi[];
  kecamatan: Opsi[];
  desa: OpsiDesa[];
  hubungan: Opsi[];
  pekerjaan: Opsi[];
  pendampingan: Opsi[];
  agama: Opsi[];
}) {
  const [state, aksi, mengirim] = useActionState(kirimLaporan, undefined);
  const form = useRef<HTMLFormElement>(null);
  const ringkasanRef = useRef<HTMLDivElement>(null);
  const [hariIni] = useState(hariIniLokal);

  const [langkah, setLangkah] = useState<Langkah>(1);
  const [galat, setGalat] = useState<Galat>({});
  const [ringkasan, setRingkasan] = useState<string | null>(null);
  const [panjang, setPanjang] = useState(0);
  const [berkas, setBerkas] = useState<BerkasPerJenis>({});
  const [lihatState, setLihatState] = useState(state);

  // Isian yang mengubah tampilan form dikendalikan state; selebihnya dibaca dari form saat dikirim.
  const [sendiri, setSendiri] = useState(false);
  const [terlaporTak, setTerlaporTak] = useState(false);
  const [kecKorban, setKecKorban] = useState("");
  const [kecPelapor, setKecPelapor] = useState("");
  const [tglLahir, setTglLahir] = useState("");

  // Hasil dari server (galat validasi atau penyimpanan) menggantikan keadaan tampilan.
  if (state !== lihatState) {
    setLihatState(state);
    if (state) {
      // Formulir tidak dikosongkan (dikirim manual), sehingga berkas yang dipilih tetap ada.
      setGalat(state.galat ?? {});
      setRingkasan(state.ringkasan ?? null);
      if (state.langkah) setLangkah(state.langkah);
    }
  }

  useEffect(() => {
    if (ringkasan) ringkasanRef.current?.focus();
  }, [ringkasan]);

  const nilaiAwal = (k: string) => state?.nilai?.[k] ?? "";
  const usia = tglLahir ? hitungUsia(tglLahir) : null;
  const desaDi = (kecId: string) => desa.filter((d) => d.kecamatanId === kecId).map((d) => ({ nilai: d.id, label: d.nama }));
  const opsi = (daftar: Opsi[]) => daftar.map((o) => ({ nilai: o.id, label: o.nama }));
  const desaKorban = desaDi(kecKorban);
  const desaPelapor = desaDi(kecPelapor);

  function nilaiFormulir() {
    return nilaiDariFormData(new FormData(form.current!));
  }

  /** Desa/kelurahan korban wajib bila kecamatannya sudah punya data desa (server memeriksa hal yang sama). */
  function galatDesa(nilai: Record<string, string>): Galat {
    const kec = nilai.korbanKecamatanId;
    return kec && !nilai.korbanDesaId && desa.some((d) => d.kecamatanId === kec) ? { korbanDesaId: "Pilih desa/kelurahan." } : {};
  }

  function tampilkanGalat(g: Galat, pesan: string) {
    setGalat(g);
    setRingkasan(pesan);
  }

  function lanjut() {
    const nilai = nilaiFormulir();
    const hasil = SkemaLaporan.safeParse(nilai);
    const g = galatSampaiLangkah({ ...galatDesa(nilai), ...(hasil.success ? {} : galatPerBidang(hasil.error)) }, langkah);
    const n = Object.keys(g).length;
    if (n > 0) {
      tampilkanGalat(g, `${n} kolom perlu dilengkapi. Perbaiki kolom bertanda merah untuk melanjutkan.`);
      return;
    }
    setGalat({});
    setRingkasan(null);
    setLangkah((langkah + 1) as Langkah);
    window.scrollTo({ top: 0 });
  }

  function kembali() {
    setGalat({});
    setRingkasan(null);
    setLangkah((langkah - 1) as Langkah);
    window.scrollTo({ top: 0 });
  }

  function saatKirim(e: React.FormEvent<HTMLFormElement>) {
    // Selalu dikirim manual (bukan lewat atribut action): React mengosongkan formulir setelah aksi selesai,
    // termasuk pilihan dan berkas, sehingga Pelapor yang mengirim ulang setelah galat terlempar ke langkah awal.
    e.preventDefault();
    const nilai = nilaiFormulir();
    const hasil = SkemaLaporan.safeParse(nilai);
    const gDesa = galatDesa(nilai);
    const galatBerkas = DOKUMEN_LAPORAN.flatMap((d) => {
      const item = berkas[d.jenis];
      if (item?.galat) return [`${d.label}: ${item.galat}`];
      return d.wajib && !item ? [`${d.label} wajib dilampirkan.`] : [];
    });
    if (hasil.success && galatBerkas.length === 0 && Object.keys(gDesa).length === 0) {
      const data = new FormData(e.currentTarget);
      startTransition(() => aksi(data));
      return;
    }
    if (!hasil.success || Object.keys(gDesa).length > 0) {
      const g = { ...gDesa, ...(hasil.success ? {} : galatPerBidang(hasil.error)) };
      const bidang = Object.keys(g);
      tampilkanGalat(g, `${bidang.length} kolom perlu dilengkapi. Perbaiki kolom bertanda merah untuk melanjutkan.`);
      setLangkah(Math.min(...bidang.map(langkahDariBidang)) as Langkah);
    } else {
      tampilkanGalat({}, galatBerkas[0]);
    }
  }

  function ubahBerkas(jenis: JenisDokumenLaporan, item: ItemBerkas | null) {
    setBerkas((lama) => {
      const baru = { ...lama };
      if (item) baru[jenis] = item;
      else delete baru[jenis];
      return baru;
    });
  }

  const aktif = (n: number) => (langkah === n ? "" : "hidden");
  const jumlahLangkah = LANGKAH.length;

  return (
    <form ref={form} onSubmit={saatKirim} noValidate className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="flex-1 px-4 pb-6 pt-5">
        <ol aria-label="Langkah pengisian" className="mb-5 grid grid-cols-5 gap-1.5">
          {LANGKAH.map((nama, i) => {
            const n = i + 1;
            return (
              <li key={nama} aria-current={langkah === n ? "step" : undefined}>
                <span className={"block h-1.5 rounded-md " + (n <= langkah ? "bg-brand-600" : "bg-line")} />
                <span className={"mt-2 block truncate text-[12px] leading-tight " + (langkah === n ? "font-bold text-brand-900" : "text-ink-mute")}>
                  {n}. {nama}
                </span>
              </li>
            );
          })}
        </ol>

        {ringkasan && (
          <div ref={ringkasanRef} tabIndex={-1} role="alert" className="mb-5 flex items-start gap-3 rounded-xl bg-error-50 p-4 text-sm font-medium text-error outline-none">
            <AlertCircle size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
            <p>{ringkasan}</p>
          </div>
        )}

        {/* Kolom jebakan untuk robot; atribut data-* meminta pengelola kata sandi melewatinya. */}
        <input
          name={BIDANG_JEBAKAN}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          data-1p-ignore
          data-lpignore="true"
          data-bwignore
          data-form-type="other"
          className="sr-only"
          defaultValue=""
        />

        {/* Langkah 1: Pelapor */}
        <fieldset className={aktif(1) + " flex flex-col gap-5"}>
          <legend className="mb-1 text-xl font-extrabold text-brand-900">Data pelapor</legend>
          <label
            className={"flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-100 " + "border-line-strong bg-surface"}
          >
            <input type="checkbox" name="pelaporAdalahKorban" checked={sendiri} onChange={(e) => setSendiri(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 rounded-md accent-brand-600" />
            <span className="font-medium text-ink">
              <strong>Saya sendiri korbannya.</strong> Data pelapor tidak perlu diisi.
            </span>
          </label>

          {!sendiri && (
            <>
              <Bidang id="pelaporNama" label="Nama lengkap" wajib galat={galat.pelaporNama}>
                <Teks id="pelaporNama" autoComplete="name" nilaiAwal={nilaiAwal("pelaporNama")} galat={galat.pelaporNama} />
              </Bidang>
              <Bidang id="pelaporNik" label="NIK" wajib petunjuk="16 digit sesuai KTP/KK. Disimpan terenkripsi." galat={galat.pelaporNik}>
                <Teks id="pelaporNik" inputMode="numeric" autoComplete="off" maxLength={19} placeholder="16 digit angka" nilaiAwal={nilaiAwal("pelaporNik")} galat={galat.pelaporNik} petunjuk />
              </Bidang>
              <Bidang id="pelaporHubunganId" label="Hubungan dengan korban" wajib galat={galat.pelaporHubunganId}>
                <Pilih id="pelaporHubunganId" daftar={opsi(hubungan)} kosong="Pilih hubungan" nilaiAwal={nilaiAwal("pelaporHubunganId")} galat={galat.pelaporHubunganId} />
              </Bidang>
              <Bidang id="pelaporKontak" label="Nomor HP / WhatsApp" wajib galat={galat.pelaporKontak}>
                <Teks id="pelaporKontak" type="tel" inputMode="tel" autoComplete="tel" placeholder="Contoh: 0812 3456 7890" nilaiAwal={nilaiAwal("pelaporKontak")} galat={galat.pelaporKontak} />
              </Bidang>
              <Bidang id="pelaporAlamat" label="Alamat tempat tinggal (domisili)" galat={galat.pelaporAlamat}>
                <Teks id="pelaporAlamat" autoComplete="street-address" placeholder="Jalan, nomor, RT/RW" nilaiAwal={nilaiAwal("pelaporAlamat")} galat={galat.pelaporAlamat} />
              </Bidang>
              <Bidang id="pelaporKecamatanId" label="Kecamatan" galat={galat.pelaporKecamatanId}>
                <Pilih id="pelaporKecamatanId" daftar={opsi(kecamatan)} kosong="Pilih kecamatan" nilai={kecPelapor} onUbah={setKecPelapor} galat={galat.pelaporKecamatanId} />
              </Bidang>
              <Bidang id="pelaporDesaId" label="Desa/Kelurahan" galat={galat.pelaporDesaId}>
                <Pilih
                  key={kecPelapor}
                  id="pelaporDesaId"
                  daftar={desaPelapor}
                  kosong={!kecPelapor ? "Pilih kecamatan dulu" : desaPelapor.length === 0 ? "Data desa belum tersedia" : "Pilih desa/kelurahan"}
                  nilaiAwal={nilaiAwal("pelaporDesaId")}
                  nonaktif={desaPelapor.length === 0}
                  galat={galat.pelaporDesaId}
                />
              </Bidang>
            </>
          )}
        </fieldset>

        {/* Langkah 2: Korban */}
        <fieldset className={aktif(2) + " flex flex-col gap-5"}>
          <legend className="mb-1 text-xl font-extrabold text-brand-900">Data korban</legend>
          <Bidang id="korbanNama" label="Nama lengkap" wajib galat={galat.korbanNama}>
            <Teks id="korbanNama" autoComplete="off" nilaiAwal={nilaiAwal("korbanNama")} galat={galat.korbanNama} />
          </Bidang>
          <Bidang id="korbanNamaPanggilan" label="Nama panggilan" galat={galat.korbanNamaPanggilan}>
            <Teks id="korbanNamaPanggilan" autoComplete="off" nilaiAwal={nilaiAwal("korbanNamaPanggilan")} galat={galat.korbanNamaPanggilan} />
          </Bidang>
          <Bidang id="korbanNik" label="NIK" wajib petunjuk="16 digit sesuai KTP/KK/KIA. Disimpan terenkripsi." galat={galat.korbanNik}>
            <Teks id="korbanNik" inputMode="numeric" autoComplete="off" maxLength={19} placeholder="16 digit angka" nilaiAwal={nilaiAwal("korbanNik")} galat={galat.korbanNik} petunjuk />
          </Bidang>
          <PilihanJenisKelamin nama="korbanJenisKelamin" nilaiAwal={nilaiAwal("korbanJenisKelamin")} wajib galat={galat.korbanJenisKelamin} />
          <Bidang id="korbanTempatLahir" label="Tempat lahir" galat={galat.korbanTempatLahir}>
            <Teks id="korbanTempatLahir" autoComplete="off" nilaiAwal={nilaiAwal("korbanTempatLahir")} galat={galat.korbanTempatLahir} />
          </Bidang>
          <Bidang id="korbanTanggalLahir" label="Tanggal lahir" wajib galat={galat.korbanTanggalLahir}>
            <div className="relative">
              <input
                id="korbanTanggalLahir"
                name="korbanTanggalLahir"
                type="date"
                max={hariIni}
                defaultValue={nilaiAwal("korbanTanggalLahir")}
                onChange={(e) => setTglLahir(e.target.value)}
                aria-invalid={!!galat.korbanTanggalLahir}
                aria-describedby={describedBy("korbanTanggalLahir", galat.korbanTanggalLahir)}
                className={kontrol + " pr-12"}
              />
              <Calendar size={20} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-mute" />
            </div>
            {usia !== null && usia >= 0 && (
              <p className="text-sm font-semibold text-brand-800" aria-live="polite" data-testid="usia-korban">
                Usia: {usia} tahun
              </p>
            )}
          </Bidang>
          <Bidang id="korbanPendidikan" label="Pendidikan terakhir" galat={galat.korbanPendidikan}>
            <Pilih id="korbanPendidikan" daftar={OPSI_PENDIDIKAN.map((o) => ({ nilai: o.nilai, label: o.label }))} kosong="Pilih pendidikan" nilaiAwal={nilaiAwal("korbanPendidikan")} galat={galat.korbanPendidikan} />
          </Bidang>
          <Bidang id="korbanPekerjaanId" label="Pekerjaan" galat={galat.korbanPekerjaanId}>
            <Pilih id="korbanPekerjaanId" daftar={opsi(pekerjaan)} kosong="Pilih pekerjaan" nilaiAwal={nilaiAwal("korbanPekerjaanId")} galat={galat.korbanPekerjaanId} />
          </Bidang>
          {agama.length > 0 && (
            <Bidang id="korbanAgamaId" label="Agama" galat={galat.korbanAgamaId}>
              <Pilih id="korbanAgamaId" daftar={opsi(agama)} kosong="Pilih agama" nilaiAwal={nilaiAwal("korbanAgamaId")} galat={galat.korbanAgamaId} />
            </Bidang>
          )}
          <Bidang id="korbanStatusPerkawinan" label="Status perkawinan" galat={galat.korbanStatusPerkawinan}>
            <Pilih id="korbanStatusPerkawinan" daftar={OPSI_STATUS_PERKAWINAN.map((o) => ({ nilai: o.nilai, label: o.label }))} kosong="Pilih status" nilaiAwal={nilaiAwal("korbanStatusPerkawinan")} galat={galat.korbanStatusPerkawinan} />
          </Bidang>
          <Bidang id="korbanNoBpjs" label="Nomor BPJS" petunjuk="13 digit pada kartu BPJS/KIS, bila ada." galat={galat.korbanNoBpjs}>
            <Teks id="korbanNoBpjs" inputMode="numeric" autoComplete="off" maxLength={20} placeholder="13 digit angka" nilaiAwal={nilaiAwal("korbanNoBpjs")} galat={galat.korbanNoBpjs} petunjuk />
          </Bidang>
          <Bidang id="korbanStatusBpjs" label="Status BPJS" galat={galat.korbanStatusBpjs}>
            <Pilih id="korbanStatusBpjs" daftar={OPSI_STATUS_BPJS.map((o) => ({ nilai: o.nilai, label: o.label }))} kosong="Pilih status BPJS" nilaiAwal={nilaiAwal("korbanStatusBpjs")} galat={galat.korbanStatusBpjs} />
          </Bidang>
          <Bidang
            id="korbanKontak"
            label={sendiri ? "Nomor HP / WhatsApp Anda" : "Nomor HP / WhatsApp korban"}
            wajib={sendiri}
            petunjuk={sendiri ? "Agar petugas dapat menghubungi Anda." : undefined}
            galat={galat.korbanKontak}
          >
            <Teks id="korbanKontak" type="tel" inputMode="tel" autoComplete="tel" placeholder="Contoh: 0812 3456 7890" nilaiAwal={nilaiAwal("korbanKontak")} galat={galat.korbanKontak} petunjuk={sendiri} />
          </Bidang>
          <Bidang id="korbanAlamat" label="Alamat tempat tinggal (domisili)" wajib galat={galat.korbanAlamat}>
            <Teks id="korbanAlamat" autoComplete="off" placeholder="Jalan, nomor, RT/RW" nilaiAwal={nilaiAwal("korbanAlamat")} galat={galat.korbanAlamat} />
          </Bidang>
          <Bidang id="korbanKecamatanId" label="Kecamatan" wajib galat={galat.korbanKecamatanId}>
            <Pilih id="korbanKecamatanId" daftar={opsi(kecamatan)} kosong="Pilih kecamatan" nilai={kecKorban} onUbah={setKecKorban} galat={galat.korbanKecamatanId} />
          </Bidang>
          <Bidang id="korbanDesaId" label="Desa/Kelurahan" wajib={desaKorban.length > 0} galat={galat.korbanDesaId}>
            <Pilih
              key={kecKorban}
              id="korbanDesaId"
              daftar={desaKorban}
              kosong={!kecKorban ? "Pilih kecamatan dulu" : desaKorban.length === 0 ? "Data desa belum tersedia" : "Pilih desa/kelurahan"}
              nilaiAwal={nilaiAwal("korbanDesaId")}
              nonaktif={desaKorban.length === 0}
              galat={galat.korbanDesaId}
            />
          </Bidang>
        </fieldset>

        {/* Langkah 3: Kejadian */}
        <fieldset className={aktif(3) + " flex flex-col gap-5"}>
          <legend className="mb-1 text-xl font-extrabold text-brand-900">Tentang kejadian</legend>
          <Bidang id="jenisKekerasanId" label="Jenis kekerasan" wajib galat={galat.jenisKekerasanId}>
            <Pilih id="jenisKekerasanId" daftar={opsi(jenis)} kosong="Pilih jenis kekerasan" nilaiAwal={nilaiAwal("jenisKekerasanId")} galat={galat.jenisKekerasanId} />
          </Bidang>
          <Bidang id="tanggalKejadian" label="Tanggal kejadian" wajib petunjuk="Jika tidak ingat pasti, pilih perkiraan tanggal." galat={galat.tanggalKejadian}>
            <div className="relative">
              <input id="tanggalKejadian" name="tanggalKejadian" type="date" max={hariIni} defaultValue={nilaiAwal("tanggalKejadian")} aria-invalid={!!galat.tanggalKejadian} aria-describedby={describedBy("tanggalKejadian", galat.tanggalKejadian, true)} className={kontrol + " pr-12"} />
              <Calendar size={20} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-mute" />
            </div>
          </Bidang>
          <Bidang id="tempatKejadian" label="Tempat kejadian" petunjuk="Mis. rumah korban, sekolah, atau nama jalan dan desanya." galat={galat.tempatKejadian}>
            <Teks id="tempatKejadian" autoComplete="off" nilaiAwal={nilaiAwal("tempatKejadian")} galat={galat.tempatKejadian} petunjuk />
          </Bidang>
          <Bidang id="kronologi" label="Kronologi kejadian" wajib petunjuk="Ceritakan sebisanya: apa yang terjadi, di mana, dan siapa yang terlibat." galat={galat.kronologi}>
            <textarea id="kronologi" name="kronologi" rows={7} maxLength={MAKS_KRONOLOGI} onInput={(e) => setPanjang(e.currentTarget.value.length)} defaultValue={nilaiAwal("kronologi")} aria-invalid={!!galat.kronologi} aria-describedby={describedBy("kronologi", galat.kronologi, true)} className={kontrol + " h-auto min-h-40 py-3"} />
            <p className="text-right text-sm tabular-nums text-ink-mute" aria-live="polite">
              {panjang} / {MAKS_KRONOLOGI} karakter
            </p>
          </Bidang>
          {pendampingan.length > 0 && (
            <fieldset className="flex flex-col gap-2" aria-describedby={galat.jenisPendampinganId ? "jenisPendampinganId-galat" : "jenisPendampinganId-petunjuk"}>
              <legend className="mb-2 text-sm font-bold text-ink">
                Pendampingan yang dibutuhkan <span className="font-medium text-ink-mute">(tidak wajib)</span>
              </legend>
              <p id="jenisPendampinganId-petunjuk" className="-mt-1 mb-1 text-sm text-ink-mute">
                Pilih satu yang paling dibutuhkan. Jika belum tahu, petugas akan membantu menentukannya.
              </p>
              <div className="flex flex-col gap-3">
                {[...pendampingan, { id: "", nama: "Belum tahu" }].map((p) => (
                  <label key={p.id || "belum-tahu"} className={kartuCentang}>
                    <input
                      type="radio"
                      name="jenisPendampinganId"
                      value={p.id}
                      defaultChecked={nilaiAwal("jenisPendampinganId") === p.id}
                      className="h-5 w-5 shrink-0 accent-brand-600"
                    />
                    {p.id ? <HeartHandshake size={18} aria-hidden="true" className="shrink-0 text-brand-700" /> : null}
                    {p.nama}
                  </label>
                ))}
              </div>
              {galat.jenisPendampinganId && (
                <p id="jenisPendampinganId-galat" role="alert" className="flex items-start gap-2 text-sm font-medium text-error">
                  <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                  {galat.jenisPendampinganId}
                </p>
              )}
            </fieldset>
          )}
        </fieldset>

        {/* Langkah 4: Terlapor */}
        <fieldset className={aktif(4) + " flex flex-col gap-5"}>
          <legend className="mb-1 text-xl font-extrabold text-brand-900">
            Pelaku / terlapor <span className="text-base font-medium text-ink-mute">(tidak wajib)</span>
          </legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-line-strong bg-surface p-4 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-100">
            <input type="checkbox" name="terlaporTidakDiketahui" checked={terlaporTak} onChange={(e) => setTerlaporTak(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 rounded-md accent-brand-600" />
            <span className="font-medium text-ink">
              <strong>Pelaku belum diketahui.</strong> Lewati bagian ini.
            </span>
          </label>
          {!terlaporTak && (
            <>
              <Bidang id="terlaporNama" label="Nama" galat={galat.terlaporNama}>
                <Teks id="terlaporNama" autoComplete="off" placeholder="Boleh nama panggilan" nilaiAwal={nilaiAwal("terlaporNama")} galat={galat.terlaporNama} />
              </Bidang>
              <PilihanJenisKelamin nama="terlaporJenisKelamin" nilaiAwal={nilaiAwal("terlaporJenisKelamin")} wajib={false} galat={galat.terlaporJenisKelamin} />
              <Bidang id="terlaporUsia" label="Usia (perkiraan)" galat={galat.terlaporUsia}>
                <Teks id="terlaporUsia" type="number" inputMode="numeric" min={0} max={120} nilaiAwal={nilaiAwal("terlaporUsia")} galat={galat.terlaporUsia} className="max-w-[10rem]" />
              </Bidang>
              <Bidang id="terlaporHubunganId" label="Hubungan dengan korban" galat={galat.terlaporHubunganId}>
                <Pilih id="terlaporHubunganId" daftar={opsi(hubungan)} kosong="Pilih hubungan" nilaiAwal={nilaiAwal("terlaporHubunganId")} galat={galat.terlaporHubunganId} />
              </Bidang>
              <Bidang id="terlaporAlamat" label="Alamat / lokasi terlapor" galat={galat.terlaporAlamat}>
                <Teks id="terlaporAlamat" autoComplete="off" placeholder="Alamat atau tempat biasa pelaku berada" nilaiAwal={nilaiAwal("terlaporAlamat")} galat={galat.terlaporAlamat} />
              </Bidang>
            </>
          )}
        </fieldset>

        {/* Langkah 5: Dokumen dan persetujuan */}
        <fieldset className={aktif(5) + " flex flex-col gap-5"}>
          <legend className="mb-1 text-xl font-extrabold text-brand-900">
            Dokumen pendukung
          </legend>
          <p className="-mt-2 text-ink-soft">
            Lampirkan dokumen milik korban. {FORMAT_BERKAS}, maksimal 5 MB per berkas.
          </p>
          <ul className="flex flex-col gap-3">
            {DOKUMEN_LAPORAN.map((d) => (
              <SlotDokumen key={d.jenis} jenis={d.jenis} label={d.label} wajib={d.wajib} item={berkas[d.jenis]} onUbah={(item) => ubahBerkas(d.jenis, item)} />
            ))}
          </ul>

          <div className="border-t border-line-soft pt-5" />
          <div>
            <label className={"flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-100 " + (galat.persetujuan ? "border-error bg-error-50/40" : "border-line-strong bg-surface")}>
              <input id="persetujuan" name="persetujuan" type="checkbox" defaultChecked={nilaiAwal("persetujuan") === "on"} aria-invalid={!!galat.persetujuan} aria-describedby={describedBy("persetujuan", galat.persetujuan)} className="mt-0.5 h-6 w-6 shrink-0 rounded-md accent-brand-600" />
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
              Data Anda dirahasiakan dan hanya dibaca petugas yang menangani laporan. NIK disimpan terenkripsi.
            </p>
          </div>
        </fieldset>
      </div>

      <div className="sticky bottom-0 border-t border-line bg-surface">
        <div className="mx-auto flex max-w-md gap-3 px-4 py-3">
          {langkah === 1 ? (
            <Link href="/" className={`inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface font-bold text-ink transition-colors hover:bg-brand-50 ${fokus}`}>
              <X size={18} aria-hidden="true" />
              Batal
            </Link>
          ) : (
            <button type="button" onClick={kembali} className={`inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface font-bold text-ink transition-colors hover:bg-brand-50 ${fokus}`}>
              Kembali
            </button>
          )}
          {langkah < jumlahLangkah ? (
            <button type="button" onClick={lanjut} className={`inline-flex h-13 flex-[2] items-center justify-center gap-2 rounded-xl bg-brand-600 font-bold text-white shadow-card transition-colors hover:bg-brand-700 ${fokus}`}>
              Lanjut
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          ) : (
            <button type="submit" disabled={mengirim} className={`inline-flex h-13 flex-[2] items-center justify-center gap-2 rounded-xl bg-brand-600 font-bold text-white shadow-card transition-colors hover:bg-brand-700 disabled:bg-line-strong disabled:shadow-none ${fokus}`}>
              <Send size={18} aria-hidden="true" />
              {mengirim ? "Mengirim..." : "Kirim Laporan"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
