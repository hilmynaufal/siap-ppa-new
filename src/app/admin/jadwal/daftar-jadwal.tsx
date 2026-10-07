"use client";

import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  History,
  List,
  Pencil,
  Repeat,
} from "lucide-react";
import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import { BilahCari } from "@/components/bilah-cari";
import { FilterChip, FilterPilihan, TombolAturUlang } from "@/components/filter";
import { IkonKotak } from "@/components/ikon-kotak";
import { LencanaStatus, type NadaLencana } from "@/components/lencana-status";
import { Paginasi } from "@/components/paginasi";
import { StripKpi } from "@/components/strip-kpi";
import { Galat, Modal, fokus, input, tombolKecil, tombolNetral, tombolUtama } from "@/components/ui-form";
import { muatRiwayat, ubah, type AksiJadwal } from "./actions";

type Status = "TERJADWAL" | "BERLANGSUNG" | "SELESAI" | "TIDAK_HADIR" | "DIBATALKAN";
type Sesi = {
  id: string;
  kodeLaporan: string;
  namaKorban: string;
  urutan: number;
  jenis: string;
  jenisPendampingId: string;
  lokasi: string;
  pendampingId: string;
  pendamping: string;
  nomorAntrean: string | null;
  sudahCheckIn: boolean;
  mulai: string;
  selesai: string;
  status: Status;
  jumlahPerubahan: number;
  notifTerakhir: string | null;
};
type Pendamping = { id: string; nama: string; jenisPendampingId: string | null };
type Riwayat = Awaited<ReturnType<typeof muatRiwayat>>;

const STATUS: Record<Status, { nada: NadaLencana; label: string }> = {
  TERJADWAL: { nada: "info", label: "Terjadwal" },
  BERLANGSUNG: { nada: "peringatan", label: "Berlangsung" },
  SELESAI: { nada: "sukses", label: "Selesai" },
  TIDAK_HADIR: { nada: "galat", label: "Tidak hadir" },
  DIBATALKAN: { nada: "netral", label: "Dibatalkan" },
};

const ZONA = "Asia/Jakarta";
const hari = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: ZONA });
const jam = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: ZONA }).replace(".", ":");
const tglPendek = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: ZONA });
const tglWaktu = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: ZONA });

const inputTanggal =
  "h-10 rounded-xl border border-line-strong bg-surface px-3 text-sm font-medium text-ink focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100";

// ---------------------------------------------------------------- Modal ubah

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

function ModalUbah({ s, pendamping, onTutup }: { s: Sesi; pendamping: Pendamping[]; onTutup: () => void }) {
  const [state, aksi, pending] = useActionState(ubah, undefined as AksiJadwal);
  const [v, setV] = useState({ pendampingId: s.pendampingId, tanggal: hari(s.mulai), jamMulai: jam(s.mulai), jamSelesai: jam(s.selesai), alasan: "" });
  const isi = (k: keyof typeof v) => ({ value: v[k], onChange: (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value })) });
  const g = (state?.galat ?? {}) as Record<string, string | undefined>;
  const attr = (k: string) => ({ "aria-invalid": g[k] ? true : undefined, "aria-describedby": g[k] ? `galat-${k}` : undefined });
  const calon = pendamping.filter((p) => !p.jenisPendampingId || p.jenisPendampingId === s.jenisPendampingId);

  useEffect(() => {
    if (state?.ok) onTutup();
  }, [state, onTutup]);

  return (
    <Modal
      idJudul="judul-ubah"
      idSubjudul="subjudul-ubah"
      ikon={Pencil}
      warna="sky"
      judul="Ubah jadwal"
      subjudul={`Sesi ${s.urutan} laporan ${s.kodeLaporan}. Pelapor dan Pendamping akan diberi tahu.`}
      onTutup={onTutup}
    >
      <form
        noValidate
        onSubmit={(e) => {
          // Dikirim manual agar React tidak mengosongkan isian ketika ada galat.
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          startTransition(() => aksi(data));
        }}
        className="mt-5 flex flex-col gap-4"
      >
        <input type="hidden" name="id" value={s.id} />
        <Bidang id="pendampingId" label="Pendamping" galat={g.pendampingId}>
          <select id="pendampingId" name="pendampingId" {...isi("pendampingId")} className={input} {...attr("pendampingId")}>
            {calon.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
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
        <Bidang id="alasan" label="Alasan perubahan" galat={g.alasan}>
          <textarea
            id="alasan"
            name="alasan"
            rows={3}
            maxLength={300}
            {...isi("alasan")}
            className="w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-base text-ink focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 aria-[invalid=true]:border-error aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-error-50"
            {...attr("alasan")}
          />
        </Bidang>
        <Galat id="galat-ubah" pesan={state?.pesan && !state.galat ? state.pesan : undefined} />
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onTutup} className={tombolNetral}>
            Batal
          </button>
          <button type="submit" disabled={pending} className={tombolUtama}>
            <BellRing size={18} aria-hidden="true" />
            Simpan dan beri tahu
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------- Modal riwayat

function BarisPerubahan({ dari, ke, label }: { dari: string; ke: string; label: string }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-sm text-ink">
      <span className="font-semibold text-ink-soft">{label}:</span>
      <span>{dari}</span>
      <ArrowRight size={14} aria-hidden="true" className="text-ink-mute" />
      <span className="font-bold">{ke}</span>
    </p>
  );
}

function ModalRiwayat({ s, onTutup }: { s: Sesi; onTutup: () => void }) {
  const [data, setData] = useState<Riwayat | null>(null);
  useEffect(() => {
    let batal = false;
    muatRiwayat(s.id).then((r) => !batal && setData(r));
    return () => {
      batal = true;
    };
  }, [s.id]);

  return (
    <Modal
      idJudul="judul-riwayat"
      idSubjudul="subjudul-riwayat"
      ikon={History}
      warna="violet"
      judul="Riwayat perubahan jadwal"
      subjudul={`Sesi ${s.urutan} laporan ${s.kodeLaporan}`}
      onTutup={onTutup}
    >
      <div className="mt-5 max-h-[55vh] overflow-y-auto pr-1">
        {data === null ? (
          <p className="text-ink-soft">Memuat...</p>
        ) : data.length === 0 ? (
          <p className="rounded-xl bg-canvas p-4 text-center text-ink-soft">Jadwal ini belum pernah diubah.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {data.map((r) => (
              <li key={r.id} className="rounded-xl border border-line p-4">
                <p className="text-sm font-bold text-navy-900">
                  {tglWaktu(r.dibuatPada)} WIB <span className="font-normal text-ink-soft">· oleh {r.pengubah}</span>
                </p>
                <div className="mt-2 flex flex-col gap-1">
                  {r.perubahan.mulai && r.perubahan.selesai && (
                    <BarisPerubahan
                      label="Waktu"
                      dari={`${tglPendek(r.perubahan.mulai.dari)}, ${jam(r.perubahan.mulai.dari)}-${jam(r.perubahan.selesai.dari)}`}
                      ke={`${tglPendek(r.perubahan.mulai.ke)}, ${jam(r.perubahan.mulai.ke)}-${jam(r.perubahan.selesai.ke)}`}
                    />
                  )}
                  {r.perubahan.pendamping && <BarisPerubahan label="Pendamping" dari={r.perubahan.pendamping.dari} ke={r.perubahan.pendamping.ke} />}
                  {r.perubahan.nomorAntrean && <BarisPerubahan label="Nomor antrean" dari={r.perubahan.nomorAntrean.dari} ke={r.perubahan.nomorAntrean.ke} />}
                </div>
                {r.alasan && <p className="mt-2 break-words text-sm text-ink-soft">Alasan: {r.alasan}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="mt-5 flex justify-end">
        <button type="button" onClick={onTutup} className={tombolNetral}>
          Tutup
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- Kalender

const NAMA_HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function Kalender({ sesi, onPilih }: { sesi: Sesi[]; onPilih: (s: Sesi) => void }) {
  const hariIni = hari(new Date().toISOString());
  const [bulan, setBulan] = useState(() => hariIni.slice(0, 7));
  const [tahun, bln] = bulan.split("-").map(Number);
  const pindah = (n: number) => {
    const d = new Date(Date.UTC(tahun, bln - 1 + n, 1));
    setBulan(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  };
  const sel = useMemo(() => {
    const awal = new Date(Date.UTC(tahun, bln - 1, 1));
    const geser = (awal.getUTCDay() + 6) % 7; // Senin = 0
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(Date.UTC(tahun, bln - 1, 1 - geser + i));
      return d.toISOString().slice(0, 10);
    });
  }, [tahun, bln]);
  const perHari = useMemo(() => {
    const m = new Map<string, Sesi[]>();
    for (const s of sesi) m.set(hari(s.mulai), [...(m.get(hari(s.mulai)) ?? []), s]);
    return m;
  }, [sesi]);
  const judul = new Date(Date.UTC(tahun, bln - 1, 1)).toLocaleDateString("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-line-soft px-5 py-3">
        <h2 className="text-lg font-bold capitalize text-navy-900" aria-live="polite">{judul}</h2>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => pindah(-1)} aria-label="Bulan sebelumnya" className={`grid h-10 w-10 place-items-center rounded-xl border border-line-strong hover:bg-blue-50 ${fokus}`}>
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setBulan(hariIni.slice(0, 7))} className={`h-10 rounded-xl border border-line-strong px-3 text-sm font-bold hover:bg-blue-50 ${fokus}`}>
            Hari ini
          </button>
          <button type="button" onClick={() => pindah(1)} aria-label="Bulan berikutnya" className={`grid h-10 w-10 place-items-center rounded-xl border border-line-strong hover:bg-blue-50 ${fokus}`}>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[720px] grid-cols-7 text-sm" role="grid" aria-label={`Kalender ${judul}`}>
          {NAMA_HARI.map((n) => (
            <div key={n} role="columnheader" className="bg-blue-50 px-2 py-2 text-center font-bold text-navy-900">
              {n}
            </div>
          ))}
          {sel.map((tgl) => {
            const dalamBulan = tgl.startsWith(bulan);
            const item = perHari.get(tgl) ?? [];
            return (
              <div
                key={tgl}
                role="gridcell"
                aria-label={`${tgl}, ${item.length} sesi`}
                className={"min-h-28 border-l border-t border-line-soft p-1.5 " + (dalamBulan ? "bg-surface" : "bg-canvas")}
              >
                <p className={"mb-1 text-right text-xs font-bold " + (tgl === hariIni ? "text-magenta-600" : dalamBulan ? "text-ink-soft" : "text-line-strong")}>
                  {Number(tgl.slice(8))}
                </p>
                <ul className="flex flex-col gap-1">
                  {item.slice(0, 3).map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => onPilih(s)}
                        title={`${s.namaKorban} · ${s.pendamping} · ${s.kodeLaporan}`}
                        className={`w-full truncate rounded-lg bg-blue-50 px-1.5 py-1 text-left text-xs font-semibold text-navy-800 hover:bg-blue-100 ${fokus}`}
                      >
                        <span className="tabular-nums">{jam(s.mulai)}</span> {s.namaKorban}
                      </button>
                    </li>
                  ))}
                  {item.length > 3 && <li className="px-1 text-xs font-semibold text-ink-mute">+{item.length - 3} lagi</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Halaman

type FilterStatus = "semua" | "TERJADWAL" | "SELESAI" | "DIUBAH";

export function DaftarJadwal({ sesi, pendamping }: { sesi: Sesi[]; pendamping: Pendamping[] }) {
  const [tampilan, setTampilan] = useState<"daftar" | "kalender">("daftar");
  const [cari, setCari] = useState("");
  const [status, setStatus] = useState<FilterStatus>("semua");
  const [orang, setOrang] = useState("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [halaman, setHalaman] = useState(1);
  const [ukuran, setUkuran] = useState(10);
  const [ubahS, setUbahS] = useState<Sesi | null>(null);
  const [riwayatS, setRiwayatS] = useState<Sesi | null>(null);

  const hariIni = hari(new Date().toISOString());
  const dapatDiubah = (s: Sesi) => s.status === "TERJADWAL" && !s.sudahCheckIn;
  const jumlah = {
    hariIni: sesi.filter((s) => hari(s.mulai) === hariIni && s.status !== "DIBATALKAN").length,
    mendatang: sesi.filter((s) => hari(s.mulai) > hariIni && s.status === "TERJADWAL").length,
    diubah: sesi.filter((s) => s.jumlahPerubahan > 0).length,
  };
  const filterAktif = !!(cari || orang || dari || sampai || status !== "semua");

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return sesi.filter((s) => {
      if (status === "TERJADWAL" && s.status !== "TERJADWAL") return false;
      if (status === "SELESAI" && s.status !== "SELESAI") return false;
      if (status === "DIUBAH" && s.jumlahPerubahan === 0) return false;
      if (orang && s.pendamping !== orang) return false;
      const h = hari(s.mulai);
      if (dari && h < dari) return false;
      if (sampai && h > sampai) return false;
      return !q || s.kodeLaporan.toLowerCase().includes(q) || s.namaKorban.toLowerCase().includes(q) || (s.nomorAntrean ?? "").toLowerCase().includes(q);
    });
  }, [sesi, cari, status, orang, dari, sampai]);

  const jumlahHalaman = Math.max(1, Math.ceil(tampil.length / ukuran));
  const halamanAktif = Math.min(halaman, jumlahHalaman);
  const mulai = (halamanAktif - 1) * ukuran;
  const halamanData = tampil.slice(mulai, mulai + ukuran);

  const ubahFilter =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setHalaman(1);
    };
  const aturUlang = () => {
    setCari(""); setStatus("semua"); setOrang(""); setDari(""); setSampai(""); setHalaman(1);
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <IkonKotak ikon={CalendarDays} warna="teal" ukuran="lg" />
          <div>
            <h1 className="text-2xl font-extrabold text-navy-900">Jadwal pendampingan</h1>
            <p className="mt-0.5 text-sm text-ink-soft">Lihat jadwal, ubah tanggal, jam, atau pendamping, dan telusuri riwayat perubahannya.</p>
          </div>
        </div>
        <div role="group" aria-label="Tampilan" className="flex rounded-xl border border-line-strong bg-surface p-1">
          {([["daftar", "Daftar", List], ["kalender", "Kalender", CalendarRange]] as const).map(([k, label, Ikon]) => (
            <button
              key={k}
              type="button"
              aria-pressed={tampilan === k}
              onClick={() => setTampilan(k)}
              className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold transition-colors ${fokus} ` + (tampilan === k ? "bg-blue-600 text-white" : "text-ink-soft hover:bg-blue-50")}
            >
              <Ikon size={16} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <StripKpi
        judul="Ringkasan jadwal"
        item={[
          { label: "Hari ini", nilai: jumlah.hariIni, keterangan: "Sesi pada hari ini", ikon: CalendarCheck, warna: "teal" },
          { label: "Mendatang", nilai: jumlah.mendatang, keterangan: "Terjadwal setelah hari ini", ikon: CalendarClock, warna: "blue" },
          { label: "Pernah diubah", nilai: jumlah.diubah, keterangan: "Punya riwayat perubahan", ikon: Repeat, warna: "amber" },
          { label: "Semua sesi", nilai: sesi.length, keterangan: "Seluruh jadwal", ikon: CalendarDays, warna: "violet" },
        ]}
      />

      {tampilan === "kalender" ? (
        <Kalender sesi={sesi} onPilih={(s) => (dapatDiubah(s) ? setUbahS(s) : setRiwayatS(s))} />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              <BilahCari nilai={cari} onUbah={ubahFilter(setCari)} placeholder="Cari kode, nama korban, atau nomor antrean..." label="Cari jadwal" />
              <FilterPilihan id="filter-pendamping" label="Filter pendamping" semua="Semua pendamping" pilihan={pendamping.map((p) => p.nama)} nilai={orang} onUbah={ubahFilter(setOrang)} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <label className="flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
                Dari tanggal
                <input type="date" value={dari} max={sampai || undefined} onChange={(e) => ubahFilter(setDari)(e.target.value)} className={inputTanggal} />
              </label>
              <label className="flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
                Sampai tanggal
                <input type="date" value={sampai} min={dari || undefined} onChange={(e) => ubahFilter(setSampai)(e.target.value)} className={inputTanggal} />
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <FilterChip
                label="Status"
                nilai={status}
                onUbah={ubahFilter(setStatus)}
                pilihan={[
                  { nilai: "semua", label: "Semua", jumlah: sesi.length },
                  { nilai: "TERJADWAL", label: "Terjadwal", jumlah: sesi.filter((s) => s.status === "TERJADWAL").length },
                  { nilai: "SELESAI", label: "Selesai", jumlah: sesi.filter((s) => s.status === "SELESAI").length },
                  { nilai: "DIUBAH", label: "Pernah diubah", jumlah: jumlah.diubah },
                ]}
              />
              {filterAktif && <TombolAturUlang onKlik={aturUlang} />}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-[15px] [&_td]:whitespace-nowrap">
                <thead className="bg-blue-50 text-sm font-bold text-navy-900">
                  <tr>
                    <th scope="col" className="px-5 py-4">No.</th>
                    <th scope="col" className="px-5 py-4">Waktu</th>
                    <th scope="col" className="px-5 py-4">Laporan</th>
                    <th scope="col" className="px-5 py-4">Pendamping</th>
                    <th scope="col" className="px-5 py-4">Antrean</th>
                    <th scope="col" className="px-5 py-4">Status</th>
                    <th scope="col" className="px-5 py-4">Pemberitahuan</th>
                    <th scope="col" className="px-5 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {tampil.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-ink-mute">
                        <CalendarDays size={40} aria-hidden="true" className="mx-auto mb-3 text-line-strong" />
                        {sesi.length === 0 ? "Belum ada jadwal. Jadwal terbit saat laporan diverifikasi." : "Tidak ada jadwal yang cocok dengan pencarian atau filter."}
                      </td>
                    </tr>
                  )}
                  {halamanData.map((s, i) => {
                    const st = STATUS[s.status];
                    return (
                      <tr key={s.id} className="border-t border-line-soft">
                        <td className="px-5 py-3 text-ink-mute">{mulai + i + 1}</td>
                        <td className="px-5 py-3 text-ink">
                          <span className="font-semibold">{tglPendek(s.mulai)}</span>
                          <br />
                          <span className="tabular-nums text-ink-soft">{jam(s.mulai)} - {jam(s.selesai)} WIB</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-semibold tabular-nums text-ink">{s.kodeLaporan}</span>
                          <br />
                          <span className="text-ink-soft">{s.namaKorban} · Sesi {s.urutan}</span>
                        </td>
                        <td className="px-5 py-3 text-ink-soft">{s.pendamping}</td>
                        <td className="px-5 py-3 tabular-nums text-ink-soft">{s.nomorAntrean ?? "-"}</td>
                        <td className="px-5 py-3">
                          <LencanaStatus nada={st.nada}>{st.label}</LencanaStatus>
                        </td>
                        <td className="px-5 py-3">
                          {s.jumlahPerubahan === 0 ? (
                            <span className="text-ink-mute">-</span>
                          ) : s.notifTerakhir ? (
                            <LencanaStatus nada="sukses" ikon={BellRing}>Terkirim · {s.jumlahPerubahan}x diubah</LencanaStatus>
                          ) : (
                            <LencanaStatus nada="peringatan" ikon={BellRing}>Belum terkirim</LencanaStatus>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              disabled={!dapatDiubah(s)}
                              title={dapatDiubah(s) ? undefined : s.sudahCheckIn ? "Pelapor sudah check-in" : "Hanya jadwal Terjadwal yang dapat diubah"}
                              onClick={() => setUbahS(s)}
                              className={`${tombolKecil} border-blue-100 bg-blue-50 text-navy-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-line-soft disabled:bg-canvas disabled:text-line-strong`}
                            >
                              <Pencil size={16} aria-hidden="true" />
                              Ubah
                            </button>
                            <button type="button" onClick={() => setRiwayatS(s)} aria-label={`Riwayat perubahan sesi ${s.kodeLaporan}`} className={`${tombolKecil} border-line-strong bg-surface text-ink hover:bg-blue-50`}>
                              <History size={16} aria-hidden="true" />
                              Riwayat
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Paginasi
              halaman={halamanAktif}
              ukuran={ukuran}
              total={tampil.length}
              satuan="jadwal"
              onHalaman={setHalaman}
              onUkuran={(u) => {
                setUkuran(u);
                setHalaman(1);
              }}
            />
          </div>
        </>
      )}

      {ubahS && <ModalUbah s={ubahS} pendamping={pendamping} onTutup={() => setUbahS(null)} />}
      {riwayatS && <ModalRiwayat s={riwayatS} onTutup={() => setRiwayatS(null)} />}
    </>
  );
}
