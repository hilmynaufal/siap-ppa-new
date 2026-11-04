import { CalendarCheck, Check, ClipboardCheck, Copy, HeartHandshake, Loader, MapPin, ScanLine, Send, Ticket } from "lucide-react";
import type { ReactNode } from "react";
import { LogoSiap } from "@/components/logo-siap";

/**
 * Bingkai ponsel untuk memperlihatkan layar aplikasi di landing page. Seluruh isinya ilustrasi (aria-hidden):
 * informasi yang sama selalu tersedia sebagai teks di bagian halaman yang memuatnya.
 */
export function Ponsel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div aria-hidden="true" className={`relative w-[272px] shrink-0 rounded-[2.75rem] bg-brand-950 p-2.5 shadow-modal ring-1 ring-white/10 sm:w-[300px] ${className}`}>
      <div className="absolute left-1/2 top-4 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-brand-950" />
      <div className="relative h-[540px] overflow-hidden rounded-[2.2rem] bg-canvas sm:h-[600px]">{children}</div>
    </div>
  );
}

function BilahAtas({ judul }: { judul: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-line bg-surface px-4 pb-3 pt-11">
      <LogoSiap ukuran={26} />
      <span className="text-sm font-extrabold text-brand-900">{judul}</span>
    </div>
  );
}

const LINIMASA = [
  { teks: "Laporan terkirim", waktu: "Senin, 08.12", status: "selesai" },
  { teks: "Diverifikasi petugas", waktu: "Senin, 10.40", status: "selesai" },
  { teks: "Jadwal ditetapkan", waktu: "Selasa, 09.30", status: "aktif" },
  { teks: "Pendampingan", waktu: "Menunggu", status: "nanti" },
] as const;

/** Layar tiket untuk hero: nomor antrean, linimasa status, dan jadwal. */
export function LayarTiket() {
  return (
    <>
      <BilahAtas judul="Tiket Anda" />
      <div className="px-4 pt-4">
        <div className="rounded-2xl bg-brand-900 px-4 pb-4 pt-3 text-white">
          <p className="text-xs font-semibold text-brand-100">Nomor antrean</p>
          <p data-nomor-hero className="mt-0.5 text-5xl font-extrabold tabular-nums tracking-tight">
            A-014
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-[11px] font-bold text-brand-100">
            <Check size={12} strokeWidth={3} /> Terverifikasi
          </p>
        </div>

        <ol data-garis-waktu className="mt-4 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
          {LINIMASA.map((l) => (
            <li key={l.teks} className="flex items-center gap-3">
              <span className="relative grid h-7 w-7 shrink-0 place-items-center">
                {l.status === "aktif" && <span data-denyut className="absolute inset-0 rounded-full bg-sun-400" />}
                <span
                  className={`relative grid h-7 w-7 place-items-center rounded-full ${
                    l.status === "selesai" ? "bg-brand-600 text-white" : l.status === "aktif" ? "bg-sun-400 text-brand-950" : "bg-line-soft text-ink-mute"
                  }`}
                >
                  {l.status === "selesai" ? <Check size={14} strokeWidth={3} /> : l.status === "aktif" ? <CalendarCheck size={14} strokeWidth={2.5} /> : <HeartHandshake size={14} />}
                </span>
              </span>
              <span className="min-w-0">
                <span className={`block text-[13px] font-bold ${l.status === "nanti" ? "text-ink-mute" : "text-brand-900"}`}>{l.teks}</span>
                <span className="block text-[11px] text-ink-mute">{l.waktu}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-4 rounded-2xl border border-line bg-surface p-4">
          <p className="text-[11px] font-semibold text-ink-mute">Jadwal pendampingan</p>
          <p className="text-sm font-extrabold text-brand-900">Selasa, 20 Okt 2026, 09.30</p>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-soft">
            <MapPin size={13} className="text-sky-500" /> UPTD PPA Kab. Bandung
          </p>
        </div>
      </div>
    </>
  );
}

/** Langkah 1: formulir bertahap. */
export function LayarFormulir() {
  return (
    <>
      <BilahAtas judul="Buat Laporan" />
      <div className="px-4 pt-4">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i === 1 ? "bg-brand-600" : "bg-line"}`} />
          ))}
        </div>
        <p className="mt-3 text-[11px] font-bold text-ink-mute">Langkah 1 dari 4</p>
        <p className="text-lg font-extrabold leading-snug text-brand-900">Apa yang terjadi?</p>

        <p className="mt-4 text-[12px] font-bold text-ink">Jenis kejadian</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {["Kekerasan psikis", "Fisik", "Seksual", "Penelantaran"].map((j, i) => (
            <span key={j} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${i === 0 ? "bg-brand-50 text-brand-800 ring-2 ring-brand-600" : "bg-surface text-ink-soft ring-1 ring-line-strong"}`}>
              {j}
            </span>
          ))}
        </div>

        <p className="mt-4 text-[12px] font-bold text-ink">Kapan terjadi?</p>
        <div className="mt-1.5 rounded-xl bg-surface px-3 py-2.5 text-[13px] text-ink ring-1 ring-line-strong">12 Oktober 2026</div>

        <p className="mt-4 text-[12px] font-bold text-ink">Ceritakan dengan bahasa Anda</p>
        <div className="mt-1.5 h-24 rounded-xl bg-surface px-3 py-2.5 text-[12px] leading-relaxed text-ink-soft ring-1 ring-line-strong">
          Saya sering dibentak dan dilarang keluar rumah...
        </div>

        <div className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-bold text-white">
          Lanjut <Send size={15} />
        </div>
      </div>
    </>
  );
}

/** Langkah 2: laporan terkirim, menunggu verifikasi. */
export function LayarTerkirim() {
  return (
    <>
      <BilahAtas judul="Laporan terkirim" />
      <div className="px-4 pt-8 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-600 text-white">
          <Check size={32} strokeWidth={3} />
        </span>
        <p className="mt-4 text-lg font-extrabold text-brand-900">Terima kasih sudah berani melapor.</p>
        <p className="mt-1 text-[12px] text-ink-soft">Simpan kode ini untuk mengecek laporan Anda.</p>
        <div className="mt-4 rounded-2xl border-2 border-dashed border-brand-600 bg-brand-50 px-3 py-3">
          <p className="text-[11px] font-semibold text-ink-mute">Kode pendaftaran</p>
          <p className="text-xl font-extrabold tracking-wider text-brand-900">REG-48K2-PQ</p>
        </div>
        <div className="mt-3 flex h-10 items-center justify-center gap-2 rounded-xl bg-surface text-[13px] font-bold text-brand-800 ring-1 ring-line-strong">
          <Copy size={14} /> Salin kode
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-sun-50 p-3 text-left">
          <Loader size={18} className="shrink-0 text-warning" />
          <p className="text-[12px] font-semibold text-warning">Petugas sedang memeriksa laporan Anda.</p>
        </div>
      </div>
    </>
  );
}

/** Langkah 3: tiket dan jadwal. */
export function LayarJadwal() {
  return (
    <>
      <BilahAtas judul="Tiket Anda" />
      <div className="px-4 pt-4">
        <div className="rounded-2xl bg-brand-900 p-4 text-white">
          <p className="text-[11px] font-semibold text-brand-100">Nomor antrean</p>
          <p className="text-4xl font-extrabold tabular-nums">A-014</p>
        </div>
        <ul className="mt-4 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
          <li className="flex gap-2.5">
            <CalendarCheck size={18} className="mt-0.5 shrink-0 text-green-500" />
            <span>
              <span className="block text-[11px] text-ink-mute">Jadwal</span>
              <span className="block text-[13px] font-bold text-brand-900">Selasa, 20 Okt 2026, 09.30</span>
            </span>
          </li>
          <li className="flex gap-2.5">
            <HeartHandshake size={18} className="mt-0.5 shrink-0 text-brand-700" />
            <span>
              <span className="block text-[11px] text-ink-mute">Layanan</span>
              <span className="block text-[13px] font-bold text-brand-900">Pendampingan psikologis</span>
            </span>
          </li>
          <li className="flex gap-2.5">
            <ClipboardCheck size={18} className="mt-0.5 shrink-0 text-violet-500" />
            <span>
              <span className="block text-[11px] text-ink-mute">Pendamping</span>
              <span className="block text-[13px] font-bold text-brand-900">Psikolog klinis</span>
            </span>
          </li>
          <li className="flex gap-2.5">
            <MapPin size={18} className="mt-0.5 shrink-0 text-sky-500" />
            <span>
              <span className="block text-[11px] text-ink-mute">Lokasi</span>
              <span className="block text-[13px] font-bold text-brand-900">UPTD PPA Kab. Bandung</span>
            </span>
          </li>
        </ul>
        <div className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl bg-surface text-[13px] font-bold text-brand-800 ring-1 ring-line-strong">
          <Ticket size={14} /> Simpan tiket
        </div>
      </div>
    </>
  );
}

/** Langkah 4: check-in di loket dengan QR. */
export function LayarCheckin() {
  return (
    <>
      <BilahAtas judul="Check-in" />
      <div className="px-4 pt-5 text-center">
        <p className="text-[12px] text-ink-soft">Tunjukkan kode ini ke petugas di loket.</p>
        <div className="relative mx-auto mt-3 w-44 rounded-2xl bg-surface p-3 ring-1 ring-line">
          <PolaQr />
          <span data-pindai className="absolute inset-x-2 top-2 h-0.5 rounded-full bg-sun-400 shadow-[0_0_12px_2px_rgb(242_178_24/0.7)]" />
        </div>
        <p className="mt-3 text-2xl font-extrabold tabular-nums text-brand-900">A-014</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-left">
          <div className="rounded-xl bg-brand-50 p-3">
            <p className="text-[11px] text-ink-mute">Sedang dipanggil</p>
            <p className="text-lg font-extrabold tabular-nums text-brand-900">A-012</p>
          </div>
          <div className="rounded-xl bg-sun-50 p-3">
            <p className="text-[11px] text-ink-mute">Giliran Anda</p>
            <p className="text-lg font-extrabold text-brand-900">2 lagi</p>
          </div>
        </div>
        <p className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-soft">
          <ScanLine size={14} /> Petugas memindai, nomor Anda masuk antrean.
        </p>
      </div>
    </>
  );
}

/** Pola QR hiasan (bukan kode yang bisa dipindai): tiga penanda sudut dan modul semu acak yang tetap. */
export function PolaQr({ className = "" }: { className?: string }) {
  const N = 21;
  let benih = 7;
  const acak = () => {
    benih = (benih * 9301 + 49297) % 233280;
    return benih / 233280;
  };
  const diPenanda = (x: number, y: number) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
  const modul: [number, number][] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!diPenanda(x, y) && acak() > 0.52) modul.push([x, y]);
  const penanda = [
    [0, 0],
    [N - 7, 0],
    [0, N - 7],
  ];
  return (
    <svg viewBox={`0 0 ${N} ${N}`} className={`block w-full ${className}`} shapeRendering="crispEdges">
      {modul.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0B3D22" />
      ))}
      {penanda.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x + 0.5} y={y + 0.5} width="6" height="6" fill="none" stroke="#0B3D22" strokeWidth="1" />
          <rect x={x + 2} y={y + 2} width="3" height="3" fill="#0B3D22" />
        </g>
      ))}
    </svg>
  );
}

