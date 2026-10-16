"use client";

import { CheckCircle2, ClipboardList, FileText, Printer, ShieldAlert, User, UserX } from "lucide-react";
import { useActionState, useRef, type ReactNode } from "react";
import { lengkapiBapAksi, type AksiBap } from "@/app/bap/actions";
import type { BidangBap, IsianBap } from "@/lib/data-bap";
import { OPSI_JENIS_KELAMIN, OPSI_PENDIDIKAN, OPSI_STATUS_BPJS, OPSI_STATUS_PERKAWINAN } from "@/lib/laporan-skema";
import { IkonKotak, type WarnaIkon } from "./ikon-kotak";
import { BidangForm } from "./master-ui";
import { Galat, fokus, input, tombolNetral, tombolUtama } from "./ui-form";

type Opsi = { id: string; nama: string };
export type DataFormBap = {
  laporanId: string;
  kode: string;
  adaPelapor: boolean;
  domisili: { pelapor: string; korban: string };
  nikTerlapor: string | null;
  isian: IsianBap;
};

const daftarEnum = (o: readonly { nilai: string; label: string }[]) => o.map((x) => ({ id: x.nilai, nama: x.label }));

function Bagian({ id, judul, ikon, warna, keterangan, children }: { id: string; judul: string; ikon: typeof User; warna: WarnaIkon; keterangan?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6">
      <div className="mb-4 flex items-center gap-3">
        <IkonKotak ikon={ikon} warna={warna} />
        <div>
          <h2 id={id} className="text-lg font-bold text-brand-900">
            {judul}
          </h2>
          {keterangan && <p className="text-sm text-ink-soft">{keterangan}</p>}
        </div>
      </div>
      <div className="grid gap-x-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

/**
 * Melengkapi data BAP yang tidak ditanyakan formulir publik. Dipakai Admin (detail laporan)
 * dan Pendamping (kasus yang ditanganinya). Semua isian tidak wajib.
 */
export function FormLengkapiBap({ data, opsi, kembali }: { data: DataFormBap; opsi: { pekerjaan: Opsi[]; agama: Opsi[]; hubungan: Opsi[] }; kembali: { href: string; label: string } }) {
  const [state, aksi, pending] = useActionState(lengkapiBapAksi, undefined as AksiBap);
  const form = useRef<HTMLFormElement>(null);
  const g = state?.galat ?? {};
  const awal = (k: BidangBap) => state?.nilai?.[k] ?? data.isian[k];
  const attr = (k: BidangBap) => ({ id: k, name: k, "aria-invalid": g[k] ? true : undefined, "aria-describedby": g[k] ? `${k}-galat` : undefined });

  const teks = (k: BidangBap, label: string, ekstra: React.InputHTMLAttributes<HTMLInputElement> = {}, petunjuk?: string) => (
    <BidangForm id={k} label={label} wajib={false} galat={g[k]} petunjuk={petunjuk}>
      <input {...attr(k)} defaultValue={awal(k)} autoComplete="off" className={input} {...ekstra} />
    </BidangForm>
  );
  const pilih = (k: BidangBap, label: string, daftar: Opsi[], kosong = "Belum diisi") => (
    <BidangForm id={k} label={label} wajib={false} galat={g[k]}>
      <select {...attr(k)} defaultValue={awal(k)} className={input}>
        <option value="">{kosong}</option>
        {daftar.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nama}
          </option>
        ))}
      </select>
    </BidangForm>
  );
  const area = (k: BidangBap, label: string, petunjuk?: string) => (
    <div className="md:col-span-2">
      <BidangForm id={k} label={label} wajib={false} galat={g[k]} petunjuk={petunjuk}>
        <textarea {...attr(k)} defaultValue={awal(k)} rows={3} className={input + " h-auto py-3"} />
      </BidangForm>
    </div>
  );
  /** Alamat KTP dengan tombol untuk menyalin alamat domisili yang diisi Pelapor. */
  const alamatKtp = (k: "pelaporAlamatKtp" | "korbanAlamatKtp", domisili: string) => (
    <div className="md:col-span-2">
      <BidangForm id={k} label="Alamat sesuai KTP" wajib={false} galat={g[k]} petunjuk={domisili ? `Domisili: ${domisili}` : "Alamat domisili belum diisi Pelapor."}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input {...attr(k)} defaultValue={awal(k)} autoComplete="off" className={input} />
          {domisili && (
            <button
              type="button"
              onClick={() => {
                const el = form.current?.elements.namedItem(k) as HTMLInputElement | null;
                if (el) el.value = domisili;
              }}
              className={`${tombolNetral} h-12 shrink-0 text-sm`}
            >
              Sama dengan domisili
            </button>
          )}
        </div>
      </BidangForm>
    </div>
  );

  const jk = daftarEnum(OPSI_JENIS_KELAMIN);
  const pdd = daftarEnum(OPSI_PENDIDIKAN);

  return (
    <form ref={form} action={aksi} noValidate className="flex flex-col gap-6">
      <input type="hidden" name="laporanId" value={data.laporanId} />

      {data.adaPelapor ? (
        <Bagian id="h-bap-pelapor" judul="Data pelapor" ikon={User} warna="sky">
          {pilih("pelaporJenisKelamin", "Jenis kelamin", jk)}
          {teks("pelaporTempatLahir", "Tempat lahir")}
          {teks("pelaporTanggalLahir", "Tanggal lahir", { type: "date" })}
          {pilih("pelaporPekerjaanId", "Pekerjaan", opsi.pekerjaan)}
          {pilih("pelaporPendidikan", "Pendidikan", pdd)}
          {pilih("pelaporAgamaId", "Agama", opsi.agama)}
          {pilih("pelaporStatusPerkawinan", "Status pernikahan", daftarEnum(OPSI_STATUS_PERKAWINAN))}
          {alamatKtp("pelaporAlamatKtp", data.domisili.pelapor)}
        </Bagian>
      ) : (
        <p className="rounded-2xl border border-line bg-surface p-5 text-ink-soft">Korban sendiri yang melapor; data pelapor di BAP mengikuti data korban.</p>
      )}

      <Bagian id="h-bap-korban" judul="Data korban" ikon={ShieldAlert} warna="coral">
        {teks("korbanNamaPanggilan", "Nama panggilan")}
        {pilih("korbanAgamaId", "Agama", opsi.agama)}
        {teks("korbanNoBpjs", "Nomor BPJS", { inputMode: "numeric", maxLength: 20 }, "13 digit.")}
        {pilih("korbanStatusBpjs", "Status BPJS", daftarEnum(OPSI_STATUS_BPJS))}
        {alamatKtp("korbanAlamatKtp", data.domisili.korban)}
      </Bagian>

      <Bagian id="h-bap-pelaku" judul="Data pelaku" ikon={UserX} warna="violet">
        {teks("terlaporNama", "Nama lengkap")}
        {teks("terlaporNamaPanggilan", "Nama panggilan")}
        {teks(
          "terlaporNik",
          "No. identitas (NIK)",
          { inputMode: "numeric", maxLength: 19, placeholder: data.nikTerlapor ? "Kosongkan bila tidak diubah" : "16 digit angka" },
          data.nikTerlapor ? `Tersimpan: ${data.nikTerlapor}. Disimpan terenkripsi.` : "Disimpan terenkripsi.",
        )}
        {pilih("terlaporJenisKelamin", "Jenis kelamin", jk)}
        {teks("terlaporTempatLahir", "Tempat lahir")}
        {teks("terlaporTanggalLahir", "Tanggal lahir", { type: "date" })}
        {teks("terlaporUsia", "Usia (bila tanggal lahir tidak diketahui)", { type: "number", inputMode: "numeric", min: 0, max: 120 })}
        {pilih("terlaporPekerjaanId", "Pekerjaan", opsi.pekerjaan)}
        {pilih("terlaporPendidikan", "Pendidikan", pdd)}
        {pilih("terlaporAgamaId", "Agama", opsi.agama)}
        {pilih("terlaporHubunganId", "Hubungan korban dengan pelaku", opsi.hubungan)}
        <div className="md:col-span-2">{teks("terlaporAlamat", "Alamat sesuai KTP")}</div>
      </Bagian>

      <Bagian id="h-bap-kejadian" judul="Kejadian dan tindak lanjut" ikon={ClipboardList} warna="amber">
        <div className="md:col-span-2">{teks("tempatKejadian", "Tempat kejadian (TKP)")}</div>
        {area("alasanKebutuhan", "Alasan kebutuhan korban/pengadu")}
        {area("lembagaRujukan", "Lembaga rujukan", "Mis. rumah sakit, unit PPA Polres, atau lembaga bantuan hukum.")}
      </Bagian>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-line bg-surface px-4 py-3 md:-mx-8 md:px-8">
        <div className="mr-auto" aria-live="polite">
          {state?.ok ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-success">
              <CheckCircle2 size={16} aria-hidden="true" />
              {state.pesan}
            </p>
          ) : (
            <Galat id="galat-bap" pesan={state?.pesan} />
          )}
        </div>
        <a href={kembali.href} className={tombolNetral}>
          {kembali.label}
        </a>
        <a href={`/bap/${data.laporanId}`} target="_blank" rel="noopener noreferrer" className={`${tombolNetral} ${fokus}`}>
          <Printer size={18} aria-hidden="true" />
          Cetak BAP
        </a>
        <button type="submit" disabled={pending} className={tombolUtama}>
          <FileText size={18} aria-hidden="true" />
          {pending ? "Menyimpan..." : "Simpan data BAP"}
        </button>
      </div>
    </form>
  );
}
