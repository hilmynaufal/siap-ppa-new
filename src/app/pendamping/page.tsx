import { BellRing, CalendarCheck, CalendarClock, CalendarDays, CheckCheck, ClipboardList, Clock, MapPin, Ticket } from "lucide-react";
import { IkonKotak } from "@/components/ikon-kotak";
import { LencanaStatus } from "@/components/lencana-status";
import { StripKpi } from "@/components/strip-kpi";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifikasiPendamping } from "@/lib/jadwal";
import { hariJakarta, jadwalPendamping } from "@/lib/tiket";
import { tandaiSemuaDibaca } from "./actions";

export const metadata = { title: "Jadwal Pendampingan | SIAP PPA" };
export const dynamic = "force-dynamic";

type Sesi = Awaited<ReturnType<typeof jadwalPendamping>>[number];

const STATUS = {
  TERJADWAL: { nada: "info", label: "Terjadwal" },
  BERLANGSUNG: { nada: "peringatan", label: "Berlangsung" },
  SELESAI: { nada: "sukses", label: "Selesai" },
  TIDAK_HADIR: { nada: "galat", label: "Tidak hadir" },
  DIBATALKAN: { nada: "netral", label: "Dibatalkan" },
} as const;

const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
const jam = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).replace(".", ":");

function KartuSesi({ s }: { s: Sesi }) {
  const st = STATUS[s.status];
  return (
    <li className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-navy-900">{s.namaKorban}</p>
          <p className="text-sm text-ink-soft">
            <span className="tabular-nums">{s.kodeLaporan}</span> · {s.jenisKekerasan}
          </p>
        </div>
        <LencanaStatus nada={st.nada}>{st.label}</LencanaStatus>
      </div>
      <dl className="mt-3 grid gap-2 text-[15px] sm:grid-cols-2">
        <div className="flex items-start gap-2">
          <CalendarDays size={16} aria-hidden="true" className="mt-1 shrink-0 text-ink-mute" />
          <div>
            <dt className="sr-only">Tanggal</dt>
            <dd className="text-ink">{tanggal(s.mulai)}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Clock size={16} aria-hidden="true" className="mt-1 shrink-0 text-ink-mute" />
          <div>
            <dt className="sr-only">Waktu</dt>
            <dd className="text-ink">{jam(s.mulai)} - {jam(s.selesai)} WIB</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={16} aria-hidden="true" className="mt-1 shrink-0 text-ink-mute" />
          <div>
            <dt className="sr-only">Tempat</dt>
            <dd className="text-ink">{s.lokasi}<span className="text-ink-soft">, {s.alamat}</span></dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Ticket size={16} aria-hidden="true" className="mt-1 shrink-0 text-ink-mute" />
          <div>
            <dt className="sr-only">Jenis dan nomor antrean</dt>
            <dd className="text-ink">Sesi {s.urutan} · {s.jenis}{s.nomorAntrean && <span className="tabular-nums"> · {s.nomorAntrean}</span>}</dd>
          </div>
        </div>
      </dl>
    </li>
  );
}

function Daftar({ judul, id, sesi, kosong }: { judul: string; id: string; sesi: Sesi[]; kosong: string }) {
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2 id={id} className="mb-3 text-lg font-bold text-navy-900">{judul}</h2>
      {sesi.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-6 text-center text-ink-soft">{kosong}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sesi.map((s) => (
            <KartuSesi key={s.id} s={s} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function BerandaPendamping() {
  const pengguna = await wajibPeran("PENDAMPING");
  const [semua, notif] = await Promise.all([jadwalPendamping(db, pengguna.id), notifikasiPendamping(db, pengguna.id, 5)]);
  const belumDibaca = notif.filter((n) => !n.dibaca).length;
  const hariIni = hariJakarta(new Date());
  const tanggalSesi = (s: Sesi) => hariJakarta(new Date(s.mulai));
  const aktif = (s: Sesi) => s.status === "TERJADWAL" || s.status === "BERLANGSUNG";
  const hariIniList = semua.filter((s) => aktif(s) && tanggalSesi(s) === hariIni);
  const mendatang = semua.filter((s) => aktif(s) && tanggalSesi(s) > hariIni);
  const lainnya = semua.filter((s) => !aktif(s) || tanggalSesi(s) < hariIni).reverse();

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex items-center gap-4">
        <IkonKotak ikon={ClipboardList} warna="teal" ukuran="lg" />
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Jadwal pendampingan</h1>
          <p className="mt-0.5 text-sm text-ink-soft">Sesi yang ditugaskan Admin kepada Anda.</p>
        </div>
      </div>

      <StripKpi
        judul="Ringkasan jadwal"
        item={[
          { label: "Hari ini", nilai: hariIniList.length, keterangan: "Sesi aktif hari ini", ikon: CalendarCheck, warna: "teal" },
          { label: "Mendatang", nilai: mendatang.length, keterangan: "Setelah hari ini", ikon: CalendarClock, warna: "blue" },
          { label: "Semua sesi", nilai: semua.length, keterangan: "Yang pernah ditugaskan", ikon: ClipboardList, warna: "violet" },
        ]}
      />

      {notif.length > 0 && (
        <section aria-labelledby="h-notif" className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id="h-notif" className="flex items-center gap-2 text-lg font-bold text-navy-900">
              <BellRing size={20} aria-hidden="true" className="text-magenta-600" />
              Pemberitahuan
              {belumDibaca > 0 && (
                <span className="rounded-lg bg-magenta-600 px-2 py-0.5 text-xs font-bold text-white">{belumDibaca} baru</span>
              )}
            </h2>
            {belumDibaca > 0 && (
              <form action={tandaiSemuaDibaca}>
                <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-blue-600 hover:bg-blue-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
                  <CheckCheck size={16} aria-hidden="true" />
                  Tandai sudah dibaca
                </button>
              </form>
            )}
          </div>
          <ul className="flex flex-col gap-2">
            {notif.map((n) => (
              <li key={n.id} className={"rounded-xl border p-4 " + (n.dibaca ? "border-line bg-surface" : "border-magenta-100 bg-magenta-100/10")}>
                <p className="break-words text-ink">{n.pesan}</p>
                <p className="mt-1 text-xs text-ink-mute">
                  {new Date(n.pada).toLocaleString("id-ID", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })} WIB
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Daftar judul="Hari ini" id="h-hari-ini" sesi={hariIniList} kosong="Tidak ada sesi hari ini." />
      <Daftar judul="Mendatang" id="h-mendatang" sesi={mendatang} kosong="Belum ada sesi mendatang." />
      {lainnya.length > 0 && <Daftar judul="Riwayat" id="h-riwayat" sesi={lainnya} kosong="" />}
    </main>
  );
}
