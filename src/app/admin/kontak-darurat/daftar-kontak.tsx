"use client";

import { ChevronDown, ContactRound, Info, MapPin, Pencil, Phone, Plus, Trash2, TriangleAlert, X } from "lucide-react";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { BilahCari } from "@/components/bilah-cari";
import { FilterChip, FilterPilihan, TombolAturUlang } from "@/components/filter";
import { IkonKotak } from "@/components/ikon-kotak";
import { Paginasi } from "@/components/paginasi";
import {
  Galat,
  Modal,
  TombolModal,
  fokus,
  input,
  tombolKecil,
  tombolNetral,
  tombolUtama,
  useTutupDenganEsc,
} from "@/components/ui-form";
import { alihkan, hapus, jalankanImpor, pratinjauImpor, tambah, ubah, type AksiKontak } from "./actions";
import { ImporCsv } from "@/components/impor-csv";
import { TEMPLAT_CSV } from "@/lib/impor-kontak";

type Kontak = {
  id: string;
  instansi: string;
  telepon: string;
  alamat: string;
  aktif: boolean;
  kecamatanId: string | null;
  kecamatan: string | null;
};
type Opsi = { id: string; nama: string };

const TINGKAT_KABUPATEN = "Tingkat kabupaten";

function SakelarAktif({ k }: { k: Kontak }) {
  const [pending, mulai] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={k.aktif}
      aria-label={`${k.aktif ? "Nonaktifkan" : "Aktifkan"} ${k.instansi}`}
      disabled={pending}
      onClick={() => mulai(async () => void (await alihkan(k.id, !k.aktif)))}
      className={
        "relative h-7 w-12 shrink-0 rounded-xl transition-colors duration-200 motion-reduce:transition-none disabled:opacity-60 " +
        fokus +
        " " +
        (k.aktif ? "bg-success" : "bg-line-strong")
      }
    >
      <span
        aria-hidden="true"
        className={
          "absolute top-0.5 h-6 w-6 rounded-lg bg-surface shadow-card transition-[left] duration-200 motion-reduce:transition-none " +
          (k.aktif ? "left-[22px]" : "left-0.5")
        }
      />
    </button>
  );
}

function BidangForm({
  id,
  label,
  petunjuk,
  galat,
  children,
}: {
  id: string;
  label: string;
  petunjuk?: string;
  galat?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-2 block text-sm font-bold">
        {label} <span className="text-error">*</span>
      </label>
      {children}
      <div className="mt-2 min-h-5">
        {galat ? (
          <Galat id={`${id}-galat`} pesan={galat} />
        ) : petunjuk ? (
          <p id={`${id}-petunjuk`} className="flex items-center gap-2 text-sm text-ink-mute">
            <Info size={16} aria-hidden="true" className="shrink-0" />
            {petunjuk}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ModalKontak({ kontak, kecamatan, onTutup }: { kontak: Kontak | null; kecamatan: Opsi[]; onTutup: () => void }) {
  const ubahMode = kontak !== null;
  const [state, aksi, pending] = useActionState(ubahMode ? ubah : tambah, undefined as AksiKontak);
  useEffect(() => {
    if (state?.ok) onTutup();
  }, [state, onTutup]);
  const nilai = (k: string, awal: string) => state?.nilai?.[k] ?? awal;
  const g = state?.galat ?? {};
  const desc = (id: string, galat?: string, petunjuk?: boolean) => (galat ? `${id}-galat` : petunjuk ? `${id}-petunjuk` : undefined);

  return (
    <Modal
      idJudul="judul-kontak"
      idSubjudul="subjudul-kontak"
      ikon={ubahMode ? Pencil : Plus}
      warna={ubahMode ? "sky" : "green"}
      judul={ubahMode ? "Ubah kontak darurat" : "Tambah kontak darurat"}
      subjudul={
        ubahMode
          ? "Perubahan langsung berlaku di halaman Pelapor bila kontak aktif."
          : "Kontak ini akan tampil di halaman Pelapor setelah disimpan."
      }
      onTutup={onTutup}
    >
      <form action={aksi} className="mt-5">
        {kontak && <input type="hidden" name="id" value={kontak.id} />}
        <BidangForm id="instansi" label="Nama instansi" galat={g.instansi}>
          <input id="instansi" name="instansi" autoFocus autoComplete="off" placeholder="Contoh: Satgas PPA Kecamatan Soreang" defaultValue={nilai("instansi", kontak?.instansi ?? "")} aria-invalid={!!g.instansi} aria-describedby={desc("instansi", g.instansi)} className={input} />
        </BidangForm>
        <BidangForm id="telepon" label="Telepon" petunjuk="Boleh memakai kode area, mis. (022) 5890 0000." galat={g.telepon}>
          <input id="telepon" name="telepon" type="tel" inputMode="tel" autoComplete="off" placeholder="(022) 5890 0000" defaultValue={nilai("telepon", kontak?.telepon ?? "")} aria-invalid={!!g.telepon} aria-describedby={desc("telepon", g.telepon, true)} className={input} />
        </BidangForm>
        <div className="mb-4">
          <label htmlFor="kecamatanId" className="mb-2 block text-sm font-bold">
            Kecamatan
          </label>
          <div className="relative">
            <select id="kecamatanId" name="kecamatanId" defaultValue={nilai("kecamatanId", kontak?.kecamatanId ?? "")} aria-invalid={!!g.kecamatanId} aria-describedby={desc("kecamatanId", g.kecamatanId)} className={input + " appearance-none pr-12"}>
              <option value="">{TINGKAT_KABUPATEN} (tanpa kecamatan)</option>
              {kecamatan.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
            <ChevronDown size={18} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-mute" />
          </div>
          {g.kecamatanId && (
            <div className="mt-2">
              <Galat id="kecamatanId-galat" pesan={g.kecamatanId} />
            </div>
          )}
        </div>
        <BidangForm id="alamat" label="Alamat penanganan" galat={g.alamat}>
          <textarea id="alamat" name="alamat" rows={3} placeholder="Contoh: Kantor Kecamatan Soreang, Jl. Raya Soreang No. 1" defaultValue={nilai("alamat", kontak?.alamat ?? "")} aria-invalid={!!g.alamat} aria-describedby={desc("alamat", g.alamat)} className={input + " h-auto min-h-24 py-3"} />
        </BidangForm>
        {ubahMode && (
          <label className="mb-1 flex min-h-11 items-center gap-3 text-sm font-semibold">
            <input type="checkbox" name="aktif" defaultChecked={kontak.aktif} className="h-6 w-6 rounded-md accent-magenta-600" />
            <span>
              Aktif
              <span className="block text-xs font-normal text-ink-mute">Tampil di halaman Pelapor.</span>
            </span>
          </label>
        )}
        {state?.pesan && !state.galat && (
          <div className="mt-2">
            <Galat id="galat-umum" pesan={state.pesan} />
          </div>
        )}
        <TombolModal onTutup={onTutup} pending={pending} />
      </form>
    </Modal>
  );
}

function ModalHapusKontak({ k, onTutup }: { k: Kontak; onTutup: () => void }) {
  const [state, aksi, pending] = useActionState(hapus, undefined as AksiKontak);
  useEffect(() => {
    if (state?.ok) onTutup();
  }, [state, onTutup]);
  useTutupDenganEsc(onTutup);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="judul-hapus-kontak" className="w-full max-w-[520px] rounded-2xl bg-surface p-6 shadow-modal">
        <div className="flex items-start gap-4">
          <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-error-50 text-error">
            <TriangleAlert size={26} />
          </span>
          <div>
            <h2 id="judul-hapus-kontak" className="text-lg font-bold text-navy-900">
              Hapus &quot;{k.instansi}&quot;?
            </h2>
            <p className="mt-1 text-ink-soft">
              Kontak ini akan hilang dari daftar dan halaman Pelapor. Bila hanya ingin menyembunyikannya, matikan saklar Aktif.
            </p>
          </div>
        </div>
        <form action={aksi} className="mt-5">
          <input type="hidden" name="id" value={k.id} />
          <Galat id="galat-hapus-kontak" pesan={state?.pesan} />
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onTutup} className={tombolNetral} autoFocus>
              <X size={18} aria-hidden="true" />
              Batal
            </button>
            <button type="submit" disabled={pending} className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-error px-6 font-bold text-white transition-colors hover:bg-[#8f1c13] disabled:bg-line-strong ${fokus}`}>
              <Trash2 size={18} aria-hidden="true" />
              Hapus
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DaftarKontak({ kontak, kecamatan }: { kontak: Kontak[]; kecamatan: Opsi[] }) {
  const [form, setForm] = useState<{ kontak: Kontak | null } | null>(null);
  const [hapusK, setHapusK] = useState<Kontak | null>(null);
  const [cari, setCari] = useState("");
  const [status, setStatus] = useState<"semua" | "aktif" | "nonaktif">("semua");
  const [wilayah, setWilayah] = useState("");
  const [halaman, setHalaman] = useState(1);
  const [ukuran, setUkuran] = useState(10);

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return kontak.filter(
      (k) =>
        (status === "semua" || (status === "aktif") === k.aktif) &&
        (!wilayah || (wilayah === TINGKAT_KABUPATEN ? k.kecamatan === null : k.kecamatan === wilayah)) &&
        (!q || k.instansi.toLowerCase().includes(q) || k.telepon.toLowerCase().includes(q)),
    );
  }, [kontak, cari, status, wilayah]);
  const jumlahAktif = kontak.filter((k) => k.aktif).length;
  const jumlahHalaman = Math.max(1, Math.ceil(tampil.length / ukuran));
  const halamanAktif = Math.min(halaman, jumlahHalaman);
  const mulai = (halamanAktif - 1) * ukuran;
  const halamanData = tampil.slice(mulai, mulai + ukuran);
  const filterAktif = cari.trim() !== "" || status !== "semua" || wilayah !== "";
  const aturUlang = () => {
    setCari("");
    setStatus("semua");
    setWilayah("");
    setHalaman(1);
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <IkonKotak ikon={ContactRound} warna="teal" ukuran="lg" />
          <div>
            <h1 className="text-2xl font-extrabold text-navy-900">Kontak Darurat</h1>
            <p className="mt-0.5 text-sm text-ink-soft">
              Kelola nomor UPTD PPA dan Satgas yang tampil di halaman Pelapor.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <ImporCsv
            judul="Impor kontak darurat dari CSV"
            petunjuk={
              <>
                Kolom: <strong>instansi, telepon, alamat, kecamatan</strong>. Kosongkan kecamatan untuk kontak tingkat kabupaten. Baris yang sudah ada (instansi dan kecamatan sama) dilewati.
              </>
            }
            templat={TEMPLAT_CSV}
            namaTemplat="templat-kontak-darurat.csv"
            satuan="kontak"
            pratinjau={pratinjauImpor}
            jalankan={jalankanImpor}
          />
          <button type="button" onClick={() => setForm({ kontak: null })} className={tombolUtama}>
            <Plus size={20} aria-hidden="true" />
            Tambah kontak
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <BilahCari nilai={cari} onUbah={(v) => { setCari(v); setHalaman(1); }} placeholder="Cari nama instansi atau telepon..." label="Cari kontak darurat" />
          <FilterPilihan id="filter-wilayah" label="Filter kecamatan" semua="Semua kecamatan" pilihan={[TINGKAT_KABUPATEN, ...kecamatan.map((k) => k.nama)]} nilai={wilayah} onUbah={(v) => { setWilayah(v); setHalaman(1); }} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterChip
            label="Status"
            nilai={status}
            onUbah={(v) => { setStatus(v); setHalaman(1); }}
            pilihan={[
              { nilai: "semua", label: "Semua", jumlah: kontak.length },
              { nilai: "aktif", label: "Aktif", jumlah: jumlahAktif },
              { nilai: "nonaktif", label: "Nonaktif", jumlah: kontak.length - jumlahAktif },
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
                <th scope="col" className="px-5 py-4">Nama instansi</th>
                <th scope="col" className="px-5 py-4">Kecamatan</th>
                <th scope="col" className="px-5 py-4">Telepon</th>
                <th scope="col" className="px-5 py-4">Aktif</th>
                <th scope="col" className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tampil.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-ink-mute">
                    <Phone size={40} aria-hidden="true" className="mx-auto mb-3 text-line-strong" />
                    {kontak.length === 0 ? 'Belum ada kontak darurat. Pilih "Tambah kontak" untuk memulai.' : "Tidak ada kontak yang cocok dengan pencarian atau filter."}
                  </td>
                </tr>
              )}
              {halamanData.map((k, i) => (
                <tr key={k.id} className="border-t border-line-soft">
                  <td className="px-5 py-3 text-ink-mute">{mulai + i + 1}</td>
                  <td className="px-5 py-3 font-semibold text-ink" title={k.alamat}>
                    {k.instansi}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    <span className="inline-flex items-center gap-2">
                      <MapPin size={16} aria-hidden="true" className="text-ink-mute" />
                      {k.kecamatan ?? TINGKAT_KABUPATEN}
                    </span>
                  </td>
                  <td className="px-5 py-3 tabular-nums text-ink-soft">{k.telepon}</td>
                  <td className="px-5 py-3">
                    <SakelarAktif k={k} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setForm({ kontak: k })} className={`${tombolKecil} border-blue-100 bg-blue-50 text-navy-700 hover:bg-blue-100`}>
                        <Pencil size={16} aria-hidden="true" />
                        Ubah
                      </button>
                      <button type="button" onClick={() => setHapusK(k)} className={`${tombolKecil} border-error-50 bg-error-50 text-error hover:bg-[#f9d7d3]`}>
                        <Trash2 size={16} aria-hidden="true" />
                        Hapus
                      </button>
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
          satuan="kontak"
          onHalaman={setHalaman}
          onUkuran={(u) => {
            setUkuran(u);
            setHalaman(1);
          }}
        />
      </div>

      {form && <ModalKontak kontak={form.kontak} kecamatan={kecamatan} onTutup={() => setForm(null)} />}
      {hapusK && <ModalHapusKontak k={hapusK} onTutup={() => setHapusK(null)} />}
    </>
  );
}
