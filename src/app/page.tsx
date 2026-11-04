import {
  ArrowRight,
  CalendarCheck,
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  FileLock2,
  FilePenLine,
  Globe,
  History,
  Lock,
  MapPin,
  Paperclip,
  Phone,
  Search,
  ShieldCheck,
  Ticket,
  UserRoundX,
} from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { ANGKA, ANTREAN, BAURAN_LAYANAN, JENIS_CONTOH, KONTAK_CONTOH, LAPORAN_BULANAN, LOKASI } from "@/components/beranda/data-contoh";
import { GerakBeranda } from "@/components/beranda/gerak-beranda";
import { KepalaBeranda } from "@/components/beranda/kepala-beranda";
import { Perjalanan, type Langkah } from "@/components/beranda/perjalanan";
import { PitaJenis } from "@/components/beranda/pita-jenis";
import { LayarCheckin, LayarFormulir, LayarJadwal, LayarTerkirim, LayarTiket, PolaQr, Ponsel } from "@/components/beranda/ponsel";
import { IkonKotak } from "@/components/ikon-kotak";
import { LogoSiap } from "@/components/logo-siap";
import { SiluetMalam } from "@/components/siluet-malam";
import { db } from "@/lib/db";
import { kontakDaruratAktif } from "@/lib/kontak-darurat";

export const dynamic = "force-dynamic";

const ALAMAT_APLIKASI = process.env.APP_URL ?? "https://siap-ppa-new-370b48.hirumi.app";
const TAUTAN_LAPOR = `${ALAMAT_APLIKASI.replace(/\/$/, "")}/lapor`;
const angka = new Intl.NumberFormat("id-ID");

/** Data nyata dari basis data; saat pengembangan tanpa basis data, pakai data contoh agar desain tetap bisa ditinjau. */
async function muatData() {
  try {
    const [kontak, jenis] = await Promise.all([
      kontakDaruratAktif(db, 3),
      db.jenisKekerasan.findMany({ where: { aktif: true }, orderBy: { nama: "asc" }, select: { nama: true } }),
    ]);
    return { kontak, jenis: jenis.map((j) => j.nama) };
  } catch (galat) {
    if (process.env.NODE_ENV === "production") throw galat;
    return { kontak: KONTAK_CONTOH, jenis: JENIS_CONTOH };
  }
}

const LANGKAH: Langkah[] = [
  {
    judul: "Isi formulir dari ponsel",
    isi: "Pindai QR di pamflet atau buka SIAP PPA dari peramban. Tidak perlu akun, tidak perlu memasang aplikasi.",
    poin: ["Pilih jenis kejadian dan ceritakan dengan bahasa Anda", "Lampirkan foto atau dokumen bila ada, boleh dilewati", "Selesai dalam sekitar lima menit"],
    layar: <LayarFormulir />,
  },
  {
    judul: "Simpan kode pendaftaran",
    isi: "Setelah laporan terkirim, Anda menerima kode pendaftaran. Peramban Anda mengingatnya otomatis selama satu hari.",
    poin: ["Pakai kode ini untuk mengecek status lewat Cek Tiket", "Petugas memeriksa laporan pada jam kerja", "Bila keadaan mendesak, tekan tombol Darurat"],
    layar: <LayarTerkirim />,
  },
  {
    judul: "Terima tiket dan jadwal",
    isi: "Setelah diverifikasi, tiket Anda memuat nomor antrean, jenis layanan, pendamping, dan jadwal pendampingan.",
    poin: ["Lokasi layanan tertera jelas di tiket", "Setiap perubahan jadwal tercatat dan dapat ditelusuri", "Cek tiket kapan saja untuk jadwal terbaru"],
    layar: <LayarJadwal />,
  },
  {
    judul: "Datang dan check-in",
    isi: "Tunjukkan QR tiket ke petugas di loket. Nomor Anda masuk antrean dan dipanggil lewat layar.",
    poin: ["Tidak perlu mengantre berdiri", "Pendamping menemui Anda sesuai jadwal", "Hasil pendampingan dicatat untuk tindak lanjut"],
    layar: <LayarCheckin />,
  },
];

const LAYANAN_UPTD = [
  { judul: "Pengaduan masyarakat", isi: "Laporan dari korban, keluarga, atau siapa pun yang mengetahui, diterima lewat aplikasi, telepon, atau datang langsung." },
  { judul: "Penjangkauan korban", isi: "Petugas mendatangi korban yang tidak dapat datang sendiri, bersama aparat setempat bila diperlukan." },
  { judul: "Pengelolaan kasus", isi: "Setiap kasus dipegang petugas yang memantau perkembangannya sampai tuntas." },
  { judul: "Penampungan sementara", isi: "Rumah aman bagi korban yang membutuhkan perlindungan segera dari pelaku." },
  { judul: "Mediasi", isi: "Penyelesaian secara kekeluargaan bila aman dan dikehendaki korban, didampingi mediator." },
  { judul: "Pendampingan korban", isi: "Psikologis, hukum, kesehatan, dan sosial, sampai korban merasa lebih kuat." },
];

const PRIVASI = [
  { ikon: Lock, warna: "navy", judul: "Akses dibatasi peran", isi: "Hanya Admin dan pendamping yang ditugaskan yang dapat membuka laporan Anda." },
  { ikon: UserRoundX, warna: "sky", judul: "Tanpa akun, tanpa kata sandi", isi: "Anda cukup menyimpan kode pendaftaran. Tidak ada data masuk yang bisa bocor." },
  { ikon: FileLock2, warna: "teal", judul: "Berkas tidak terbuka untuk umum", isi: "Foto dan dokumen disimpan terpisah dari situs, hanya dibuka oleh petugas yang berwenang." },
  { ikon: History, warna: "violet", judul: "Setiap perubahan tercatat", isi: "Verifikasi dan perubahan jadwal masuk catatan audit yang dapat ditelusuri." },
] as const;

const PERTANYAAN = [
  { t: "Siapa yang boleh melapor?", j: "Korban sendiri, keluarga, tetangga, guru, atau siapa pun yang mengetahui adanya kekerasan terhadap perempuan dan anak di Kabupaten Bandung." },
  { t: "Apakah melapor dikenakan biaya?", j: "Tidak. Seluruh layanan SIAP PPA dan UPTD PPA Kabupaten Bandung tidak dipungut biaya." },
  { t: "Apakah saya harus menyebutkan nama?", j: "Isi data yang Anda nyaman berikan. Petugas menjaga kerahasiaannya dan hanya memakainya untuk menindaklanjuti laporan." },
  { t: "Apa yang terjadi setelah laporan terkirim?", j: "Petugas memverifikasi laporan Anda. Setelah itu Anda menerima tiket berisi nomor antrean dan jadwal pendampingan, yang bisa dicek lewat Cek Tiket." },
  { t: "Bagaimana bila saya lupa kode pendaftaran?", j: "Kode diingat otomatis di peramban yang sama selama satu hari. Bila tetap hilang, hubungi UPTD PPA dan sebutkan nama serta tanggal laporan." },
  { t: "Bagaimana bila keadaan sangat mendesak?", j: "Jangan menunggu. Tekan tombol Darurat di bagian atas halaman untuk langsung menelepon kontak darurat yang aktif." },
];

const tunda = (ms: number) => ({ "--tunda": `${ms}ms` }) as React.CSSProperties;

function Kepala({ label, judul, isi, id, gelap = false }: { label: string; judul: string; isi?: string; id: string; gelap?: boolean }) {
  return (
    <div data-muncul className="max-w-3xl">
      <p className={`text-sm font-bold ${gelap ? "text-sun-400" : "text-brand-700"}`}>{label}</p>
      <h2 id={id} className={`text-balance mt-3 font-extrabold leading-[1.08] tracking-tight ${gelap ? "text-surface" : "text-brand-900"}`} style={{ fontSize: "clamp(2rem, 4.4vw, 3.4rem)" }}>
        {judul}
      </h2>
      {isi && <p className={`mt-4 max-w-2xl text-lg ${gelap ? "text-brand-100" : "text-ink-soft"}`}>{isi}</p>}
    </div>
  );
}

export default async function BerandaPelapor() {
  const [{ kontak, jenis }, qrSvg] = await Promise.all([
    muatData(),
    QRCode.toString(TAUTAN_LAPOR, { type: "svg", margin: 0, errorCorrectionLevel: "Q", color: { dark: "#0B3D22", light: "#FBFDFB" } }),
  ]);
  const maksBulan = Math.max(...LAPORAN_BULANAN.map((b) => b.n));

  return (
    <div className="min-h-screen bg-surface">
      <KepalaBeranda telepon={kontak[0]?.telepon} />
      <GerakBeranda>
        <main>
          {/* ================= Hero ================= */}
          <section aria-labelledby="judul-hero" className="hero-rimba relative overflow-hidden text-surface">
            <div aria-hidden="true" className="pola-titik absolute inset-0" />
            <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 pb-6 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-4 lg:pb-0 lg:pt-10">
              <div className="relative z-10 py-4 lg:py-16">
                <p className="muncul inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-bold text-brand-100 ring-1 ring-white/15">
                  <ShieldCheck size={16} aria-hidden="true" className="text-sun-400" />
                  Layanan resmi DALDUK PPA Kabupaten Bandung
                </p>
                <h1 id="judul-hero" style={{ ...tunda(80), fontSize: "clamp(3.1rem, 8.6vw, 6.4rem)" }} className="muncul mt-6 font-extrabold leading-[0.98] tracking-[-0.035em]">
                  Anda tidak <span className="text-sun-400">sendiri.</span>
                </h1>
                <p style={tunda(160)} className="muncul mt-6 max-w-xl text-lg leading-relaxed text-brand-100 md:text-xl">
                  Laporkan kekerasan terhadap perempuan dan anak langsung dari ponsel. Petugas memverifikasi laporan Anda, lalu pendamping profesional menemani sampai tuntas.
                </p>
                <div style={tunda(240)} className="muncul mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/lapor"
                    className="group inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-sun-400 px-8 text-lg font-extrabold text-brand-950 shadow-card transition-colors hover:bg-sun-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-sun-50"
                  >
                    <FilePenLine size={22} aria-hidden="true" />
                    Buat Laporan
                    <ArrowRight size={20} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/cek-tiket"
                    className="inline-flex h-14 items-center justify-center gap-2 rounded-xl px-8 text-lg font-bold text-surface ring-2 ring-white/30 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-sun-50"
                  >
                    <Ticket size={22} aria-hidden="true" />
                    Cek Tiket
                  </Link>
                </div>
                <ul style={tunda(320)} className="muncul mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-brand-100">
                  {["Gratis", "Tanpa akun", "Data dirahasiakan", "Sekitar 5 menit"].map((t) => (
                    <li key={t} className="inline-flex items-center gap-2">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-leaf-500 text-brand-950">
                        <Check size={13} strokeWidth={3.25} aria-hidden="true" />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Panggung visual: cincin perlindungan, ponsel, dan kartu status yang melayang. Dekoratif. */}
              <div aria-hidden="true" className="relative flex h-[600px] items-center justify-center sm:h-[680px]">
                <svg viewBox="0 0 640 640" className="pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 sm:h-[760px] sm:w-[760px]">
                  <circle cx="320" cy="320" r="150" fill="rgb(96 174 45 / 0.16)" />
                  {[190, 245, 300].map((r, i) => (
                    <circle key={r} data-cincin pathLength={1} cx="320" cy="320" r={r} fill="none" stroke="#D6EFDC" strokeOpacity={0.32 - i * 0.08} strokeWidth="1.5" />
                  ))}
                  <g data-putar>
                    <circle cx="320" cy="320" r="272" fill="none" stroke="#F2B218" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="2 14" strokeLinecap="round" />
                    <circle cx="592" cy="320" r="7" fill="#F2B218" />
                    <circle cx="48" cy="320" r="4" fill="#60AE2D" />
                  </g>
                </svg>

                <div data-hero-ponsel className="relative">
                  <div data-apung>
                    <Ponsel>
                      <LayarTiket />
                    </Ponsel>
                  </div>
                </div>

                <div data-hero-chip className="absolute left-0 top-[12%] lg:-left-12">
                  <div data-apung className="flex items-center gap-3 rounded-2xl bg-surface py-3 pl-3 pr-5 text-ink shadow-modal">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
                      <Check size={20} strokeWidth={3} />
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-brand-900">Laporan diverifikasi</span>
                      <span className="block text-xs text-ink-mute">2 jam setelah dikirim</span>
                    </span>
                  </div>
                </div>
                <div data-hero-chip className="absolute right-0 top-[40%] hidden sm:block lg:-right-6">
                  <div data-apung className="flex items-center gap-3 rounded-2xl bg-surface py-3 pl-3 pr-5 text-ink shadow-modal">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-sun-400 text-brand-950">
                      <CalendarCheck size={20} strokeWidth={2.5} />
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-brand-900">Jadwal pendampingan</span>
                      <span className="block text-xs text-ink-mute">Selasa, 09.30</span>
                    </span>
                  </div>
                </div>
                <div data-hero-chip className="absolute bottom-[3%] left-0 hidden sm:block lg:-left-12">
                  <div data-apung className="flex items-center gap-3 rounded-2xl bg-surface py-3 pl-3 pr-5 text-ink shadow-modal">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500 text-white">
                      <Lock size={19} strokeWidth={2.5} />
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-brand-900">Hanya petugas berwenang</span>
                      <span className="block text-xs text-ink-mute">yang dapat membuka laporan</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <svg viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true" className="relative block h-14 w-full md:h-24">
              <path d="M0 64 C220 18 420 34 640 66 C860 98 1080 22 1440 52 V120 H0 Z" fill="#0F5A32" opacity="0.75" />
              <path d="M0 96 C260 62 520 78 760 96 C1000 114 1200 76 1440 90 V120 H0 Z" fill="#062F1A" />
            </svg>
          </section>

          {jenis.length > 0 && <PitaJenis jenis={jenis} />}

          {/* ================= Fitur aplikasi (bento) ================= */}
          <section id="layanan" aria-labelledby="judul-layanan" className="scroll-mt-16 bg-canvas py-20 md:py-28">
            <div className="mx-auto max-w-7xl px-4">
              <Kepala
                id="judul-layanan"
                label="Fitur aplikasi"
                judul="Satu pindaian QR, semua layanan di genggaman."
                isi="SIAP PPA menghubungkan Anda, petugas, dan pendamping dalam satu alur. Ini yang bisa Anda lakukan dari ponsel."
              />

              <div data-muncul-grup="110" className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                {/* A: formulir */}
                <article className="relative overflow-hidden rounded-3xl bg-brand-900 p-6 text-surface md:p-8 lg:col-span-3 lg:row-span-2">
                  <h3 className="text-2xl font-extrabold md:text-3xl">Lapor dari ponsel, tanpa akun</h3>
                  <p className="mt-2 max-w-md text-brand-100">Formulir empat langkah dengan bahasa sehari-hari. Foto dan dokumen pendukung bisa dilampirkan.</p>
                  <div aria-hidden="true" className="mt-8 rounded-2xl bg-surface p-5 text-ink shadow-modal md:mx-6 md:-mb-14 md:p-6">
                    <div data-progres className="flex gap-1.5">
                      {[0, 1, 2, 3].map((i) => (
                        <span key={i} className="h-2 flex-1 overflow-hidden rounded-full bg-line-soft">
                          <span className="block h-full origin-left rounded-full bg-brand-600" />
                        </span>
                      ))}
                    </div>
                    <p className="mt-4 text-xs font-bold text-ink-mute">Langkah 2 dari 4</p>
                    <p className="text-xl font-extrabold text-brand-900">Ceritakan kejadiannya</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {["Kekerasan psikis", "Di rumah", "Berulang"].map((c) => (
                        <span key={c} className="rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-800 ring-1 ring-brand-100">
                          {c}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 min-h-28 rounded-xl px-4 py-3 text-[15px] leading-relaxed ring-1 ring-line-strong">
                      <span data-ketik="Kejadiannya di rumah, sudah berulang sejak bulan lalu. Saya ingin bicara dengan psikolog.">
                        Kejadiannya di rumah, sudah berulang sejak bulan lalu. Saya ingin bicara dengan psikolog.
                      </span>
                      <span className="kursor ml-0.5 inline-block h-5 w-0.5 translate-y-1 bg-brand-600" />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm text-ink-soft">
                      {["foto-1.jpg", "surat-keterangan.pdf"].map((f) => (
                        <span key={f} className="inline-flex items-center gap-1.5 rounded-lg bg-canvas px-2.5 py-1.5 ring-1 ring-line">
                          <Paperclip size={14} /> {f}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 font-bold text-white">
                      Lanjut <ArrowRight size={18} />
                    </div>
                  </div>
                </article>

                {/* B: cek tiket */}
                <article className="rounded-3xl bg-sun-50 p-6 md:p-8 lg:col-span-3">
                  <h3 className="text-2xl font-extrabold text-brand-900">Cek tiket kapan saja</h3>
                  <p className="mt-2 max-w-md text-ink-soft">Masukkan kode pendaftaran untuk melihat status, nomor antrean, dan jadwal Anda.</p>
                  <div aria-hidden="true" className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex h-12 flex-1 items-center gap-2.5 rounded-xl bg-surface px-4 font-bold tracking-wider text-brand-900 ring-1 ring-line-strong">
                      <Search size={18} className="text-ink-mute" /> REG-48K2-PQ
                    </div>
                    <div data-tukar className="relative h-12 sm:w-56">
                      <span className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-warning-50 text-sm font-bold text-warning">
                        <Clock size={16} /> Menunggu verifikasi
                      </span>
                      <span className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-success-50 text-sm font-bold text-success opacity-0">
                        <Check size={16} strokeWidth={3} /> Terverifikasi, A-014
                      </span>
                    </div>
                  </div>
                </article>

                {/* C: antrean digital */}
                <article className="rounded-3xl border border-line bg-surface p-6 md:p-8 lg:col-span-2">
                  <h3 className="text-xl font-extrabold text-brand-900">Antrean digital</h3>
                  <p className="mt-2 text-ink-soft">Nomor Anda tampil di layar loket. Tidak perlu berdesakan.</p>
                  <div aria-hidden="true" className="mt-5 rounded-2xl bg-brand-950 p-5 text-center">
                    <p className="text-xs font-bold text-brand-100">Nomor dipanggil</p>
                    <div className="overflow-hidden">
                      <p data-balik="14" className="text-5xl font-extrabold tabular-nums text-sun-400">
                        A-014
                      </p>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-brand-100">Menuju loket 2</p>
                  </div>
                </article>

                {/* D: check-in QR */}
                <article className="rounded-3xl bg-brand-100 p-6 lg:col-span-1">
                  <h3 className="text-xl font-extrabold text-brand-900">Check-in QR</h3>
                  <p className="mt-2 text-sm text-ink-soft">Petugas memindai tiket Anda di loket.</p>
                  <div aria-hidden="true" className="relative mx-auto mt-5 w-32 rounded-xl bg-surface p-2.5">
                    <PolaQr />
                    <span data-pindai className="absolute inset-x-1.5 top-2 h-0.5 rounded-full bg-sun-400 shadow-[0_0_10px_2px_rgb(242_178_24/0.7)]" />
                  </div>
                </article>

                {/* E: jadwal */}
                <article className="rounded-3xl border border-line bg-surface p-6 md:p-8 lg:col-span-2">
                  <h3 className="text-xl font-extrabold text-brand-900">Jadwal pendampingan</h3>
                  <p className="mt-2 text-ink-soft">Tanggal, jam, lokasi, dan pendamping tertera di tiket Anda.</p>
                  <div aria-hidden="true" className="mt-5 grid grid-cols-5 gap-1.5 text-center">
                    {[
                      ["Sen", 19],
                      ["Sel", 20],
                      ["Rab", 21],
                      ["Kam", 22],
                      ["Jum", 23],
                    ].map(([h, t]) => (
                      <span key={h} data-detak={t === 20 ? "" : undefined} className={`rounded-xl py-2.5 ${t === 20 ? "bg-sun-400 text-brand-950" : "bg-canvas text-ink-soft"}`}>
                        <span className="block text-xs font-semibold">{h}</span>
                        <span className="block text-lg font-extrabold tabular-nums">{t}</span>
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm font-bold text-brand-900">Selasa, 09.30, pendampingan psikologis</p>
                </article>

                {/* F: pendamping */}
                <article className="rounded-3xl bg-brand-50 p-6 md:p-8 lg:col-span-2">
                  <h3 className="text-xl font-extrabold text-brand-900">Pendamping profesional</h3>
                  <p className="mt-2 text-ink-soft">Psikolog, konsultan hukum, dan pekerja sosial mitra UPTD PPA.</p>
                  <div aria-hidden="true" className="mt-5 flex items-center">
                    {[
                      ["RA", "bg-violet-500"],
                      ["DS", "bg-teal-500"],
                      ["NF", "bg-coral-500"],
                      ["YP", "bg-sky-500"],
                    ].map(([i, w]) => (
                      <span key={i} className={`-ml-2 grid h-12 w-12 place-items-center rounded-full text-sm font-extrabold text-white ring-4 ring-brand-50 first:ml-0 ${w}`}>
                        {i}
                      </span>
                    ))}
                    <span className="-ml-2 grid h-12 w-12 place-items-center rounded-full bg-brand-900 text-sm font-extrabold text-white ring-4 ring-brand-50">+{ANGKA.pendamping - 4}</span>
                  </div>
                  <ul className="mt-4 flex flex-wrap gap-2 text-sm font-bold text-brand-800">
                    {["Psikolog", "Hukum", "Pekerja sosial"].map((p) => (
                      <li key={p} className="rounded-lg bg-surface px-2.5 py-1 ring-1 ring-brand-100">
                        {p}
                      </li>
                    ))}
                  </ul>
                </article>

                {/* G: kontak darurat */}
                <article className="rounded-3xl border border-line bg-surface p-6 md:p-8 lg:col-span-2">
                  <h3 className="text-xl font-extrabold text-brand-900">Kontak darurat</h3>
                  <p className="mt-2 text-ink-soft">Satu sentuhan untuk menelepon layanan darurat yang aktif.</p>
                  <ul aria-hidden="true" className="mt-5 flex flex-col gap-2">
                    {kontak.slice(0, 2).map((k) => (
                      <li key={k.id} className="flex items-center justify-between gap-3 rounded-xl bg-canvas px-3 py-2.5">
                        <span className="min-w-0 truncate text-sm font-bold text-brand-900">{k.instansi}</span>
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emergency text-white">
                          <Phone size={16} />
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/kontak-darurat" className="mt-4 inline-flex items-center gap-1.5 rounded-lg font-bold text-brand-700 underline underline-offset-4 hover:text-brand-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100">
                    Lihat semua kontak <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </article>
              </div>
            </div>
          </section>

          {/* ================= Cara melapor (cerita gulir) ================= */}
          <section id="cara" aria-labelledby="judul-cara" className="scroll-mt-16 bg-surface py-20 md:py-28">
            <div className="mx-auto max-w-7xl px-4">
              <Kepala id="judul-cara" label="Cara melapor" judul="Dari laporan sampai pendampingan, begini jalannya." isi="Empat langkah tanpa tergesa. Anda selalu tahu laporan Anda sedang di mana." />
              <div className="mt-10 lg:mt-0">
                <Perjalanan langkah={LANGKAH} />
              </div>
            </div>
          </section>

          {/* ================= Dalam angka ================= */}
          <section id="angka" aria-labelledby="judul-angka" className="scroll-mt-16 border-t border-line-soft bg-canvas py-20 md:py-28">
            <div className="mx-auto grid max-w-7xl gap-14 px-4 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
              <div data-muncul>
                <p className="text-sm font-bold text-brand-700">Dalam angka, {ANGKA.periode}</p>
                <h2 id="judul-angka" className="text-balance mt-3 font-extrabold leading-[1.12] tracking-tight text-brand-900" style={{ fontSize: "clamp(2rem, 4.2vw, 3.2rem)" }}>
                  <span data-hitung={ANGKA.laporan} className="tabular-nums text-brand-600">
                    {angka.format(ANGKA.laporan)}
                  </span>{" "}
                  laporan diterima,{" "}
                  <span data-hitung={ANGKA.didampingi} className="tabular-nums text-brand-600">
                    {angka.format(ANGKA.didampingi)}
                  </span>{" "}
                  perempuan dan anak didampingi.
                </h2>
                <p className="mt-4 max-w-xl text-lg text-ink-soft">Setiap laporan dicatat, diverifikasi, lalu ditindaklanjuti petugas dan pendamping profesional.</p>

                <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line-soft">
                  {[
                    { n: ANGKA.kecamatan, akhir: "", label: "kecamatan terjangkau" },
                    { n: ANGKA.verifikasiCepat, akhir: "%", label: "diverifikasi kurang dari 1×24 jam" },
                    { n: ANGKA.pendamping, akhir: "", label: "pendamping profesional" },
                    { n: ANGKA.sesi, akhir: "", label: "sesi pendampingan" },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col-reverse gap-1 bg-surface p-5 md:p-6">
                      <dt className="text-sm font-semibold text-ink-soft">{s.label}</dt>
                      <dd className="text-3xl font-extrabold tabular-nums text-brand-900 md:text-4xl">
                        <span data-hitung={s.n}>{angka.format(s.n)}</span>
                        {s.akhir}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <figure data-muncul="120" className="m-0 rounded-3xl border border-line bg-surface p-6 shadow-card md:p-8">
                <figcaption>
                  <p className="text-lg font-extrabold text-brand-900">Laporan diterima per bulan</p>
                  <p className="text-sm text-ink-mute">Tahun 2026</p>
                </figcaption>
                <div data-batang aria-hidden="true" className="mt-6 flex h-60 items-end gap-1.5 border-b border-line md:gap-3">
                  {LAPORAN_BULANAN.map((b, i) => {
                    const terakhir = i === LAPORAN_BULANAN.length - 1;
                    return (
                      <div key={b.bulan} title={`${b.bulan}: ${b.n} laporan`} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                        {(terakhir || i === 0) && (
                          <span data-batang-label className="text-sm font-extrabold tabular-nums text-ink">
                            {b.n}
                          </span>
                        )}
                        <span
                          data-batang-isi
                          className={`block w-full origin-bottom rounded-t-[4px] ${terakhir ? "bg-brand-600" : "bg-leaf-500/55"}`}
                          style={{ height: `${(b.n / maksBulan) * 82}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div aria-hidden="true" className="mt-2 flex gap-1.5 md:gap-3">
                  {LAPORAN_BULANAN.map((b, i) => (
                    <span key={b.bulan} className={`flex-1 text-center text-xs ${i === LAPORAN_BULANAN.length - 1 ? "font-extrabold text-brand-900" : "text-ink-mute"}`}>
                      {b.label}
                    </span>
                  ))}
                </div>
                <table className="sr-only">
                  <caption>Laporan diterima per bulan, 2026</caption>
                  <thead>
                    <tr>
                      <th scope="col">Bulan</th>
                      <th scope="col">Laporan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LAPORAN_BULANAN.map((b) => (
                      <tr key={b.bulan}>
                        <th scope="row">{b.bulan}</th>
                        <td>{b.n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-10 border-t border-line-soft pt-8">
                  <p className="font-extrabold text-brand-900">Layanan yang paling banyak diberikan</p>
                  <div data-tirai aria-hidden="true" className="mt-4 flex h-4 gap-0.5">
                    {BAURAN_LAYANAN.map((l) => (
                      <span key={l.nama} title={`${l.nama}: ${l.persen}%`} className="h-full origin-left first:rounded-l-full last:rounded-r-full" style={{ flexGrow: l.persen, background: l.warna }} />
                    ))}
                  </div>
                  <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
                    {BAURAN_LAYANAN.map((l) => (
                      <li key={l.nama} className="flex items-center gap-2 text-sm text-ink-soft">
                        <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-sm" style={{ background: l.warna }} />
                        {l.nama}
                        <span className="ml-auto font-extrabold tabular-nums text-ink sm:ml-0">{l.persen}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </figure>
            </div>
          </section>

          {/* ================= Enam layanan UPTD PPA ================= */}
          <section id="pendampingan" aria-labelledby="judul-pendampingan" className="relative scroll-mt-16 overflow-hidden bg-brand-900 py-20 text-surface md:py-28">
            <div aria-hidden="true" className="pola-titik absolute inset-0" />
            <div className="relative mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <Kepala
                  gelap
                  id="judul-pendampingan"
                  label="Layanan UPTD PPA"
                  judul="Enam layanan, satu pintu."
                  isi="Laporan Anda dapat ditindaklanjuti dengan layanan berikut sesuai kebutuhan, seluruhnya tanpa biaya."
                />
                <div data-muncul="200" className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <IkonKotak ikon={ShieldCheck} warna="amber" />
                  <p className="text-sm text-brand-100">
                    Dikelola <span className="font-bold text-surface">UPTD PPA Kabupaten Bandung</span> di bawah Dinas DALDUK PPA.
                  </p>
                </div>
              </div>
              <ol data-muncul-grup="100" className="flex flex-col divide-y divide-white/10 border-y border-white/10">
                {LAYANAN_UPTD.map((l, i) => (
                  <li key={l.judul} className="group grid grid-cols-[3.5rem_1fr] gap-4 py-7 md:grid-cols-[5rem_1fr] md:py-8">
                    <span aria-hidden="true" className="text-4xl font-extrabold tabular-nums leading-none text-sun-400 md:text-5xl">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-2xl font-extrabold">{l.judul}</h3>
                      <p className="mt-2 max-w-xl text-brand-100">{l.isi}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ================= Kerahasiaan ================= */}
          <section aria-labelledby="judul-privasi" className="bg-surface py-20 md:py-28">
            <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
              <div data-gambar aria-hidden="true" className="relative mx-auto w-full max-w-md">
                <svg viewBox="0 0 400 400" className="block w-full">
                  <circle cx="200" cy="200" r="190" fill="#ECF7EE" stroke="none" />
                  <circle cx="200" cy="200" r="160" fill="none" stroke="#B9D0C0" strokeWidth="1.5" />
                  <circle cx="200" cy="200" r="120" fill="none" stroke="#B9D0C0" strokeWidth="1.5" strokeDasharray="3 9" />
                  <path d="M200 70 L300 108 V196 C300 262 256 310 200 332 C144 310 100 262 100 196 V108 Z" fill="#FBFDFB" stroke="#048842" strokeWidth="7" strokeLinejoin="round" />
                  <rect x="160" y="190" width="80" height="62" rx="12" fill="none" stroke="#0B3D22" strokeWidth="7" />
                  <path d="M176 190 V170 C176 156 186 146 200 146 C214 146 224 156 224 170 V190" fill="none" stroke="#0B3D22" strokeWidth="7" strokeLinecap="round" />
                  <path d="M200 214 V230" fill="none" stroke="#F2B218" strokeWidth="8" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <Kepala id="judul-privasi" label="Kerahasiaan" judul="Cerita Anda hanya untuk yang berwenang." />
                <ul data-muncul-grup className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
                  {PRIVASI.map((p) => (
                    <li key={p.judul} className="flex flex-col gap-3">
                      <IkonKotak ikon={p.ikon} warna={p.warna} />
                      <h3 className="text-lg font-extrabold text-brand-900">{p.judul}</h3>
                      <p className="-mt-1 text-ink-soft">{p.isi}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ================= Lokasi dan antrean ================= */}
          <section id="lokasi" aria-labelledby="judul-lokasi" className="scroll-mt-16 bg-canvas py-20 md:py-28">
            <div className="mx-auto grid max-w-7xl items-start gap-12 px-4 lg:grid-cols-2 lg:gap-20">
              <div>
                <Kepala id="judul-lokasi" label="Datang langsung" judul="Pintu kami terbuka di Soreang." />
                <dl data-muncul-grup className="mt-10 flex flex-col gap-6">
                  <div className="flex gap-4">
                    <dt className="sr-only">Alamat</dt>
                    <MapPin size={24} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-600" />
                    <dd>
                      <span className="block text-lg font-extrabold text-brand-900">{LOKASI.nama}</span>
                      <span className="block text-ink-soft">{LOKASI.alamat}</span>
                    </dd>
                  </div>
                  <div className="flex gap-4">
                    <dt className="sr-only">Jam layanan</dt>
                    <Clock size={24} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-600" />
                    <dd className="w-full max-w-sm">
                      <span className="block text-lg font-extrabold text-brand-900">Jam layanan tatap muka</span>
                      <ul className="mt-2 divide-y divide-line">
                        {LOKASI.jam.map((j) => (
                          <li key={j.hari} className="flex justify-between gap-4 py-2 text-ink-soft">
                            {j.hari}
                            <span className={`font-bold tabular-nums ${j.jam === "Tutup" ? "text-ink-mute" : "text-ink"}`}>{j.jam}</span>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div className="flex gap-4">
                    <dt className="sr-only">Laporan daring</dt>
                    <Globe size={24} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-600" />
                    <dd className="text-ink-soft">
                      <span className="font-extrabold text-brand-900">Laporan daring 24 jam.</span> Kirim kapan saja, petugas memeriksa pada jam kerja.
                    </dd>
                  </div>
                </dl>
                <a
                  href={LOKASI.peta}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-9 inline-flex h-12 items-center gap-2 rounded-xl border border-line-strong bg-surface px-5 font-bold text-brand-800 transition-colors hover:bg-brand-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                >
                  <MapPin size={18} aria-hidden="true" />
                  Petunjuk arah
                  <ExternalLink size={16} aria-hidden="true" className="text-ink-mute" />
                </a>
              </div>

              <div data-muncul="120" className="rounded-3xl bg-brand-950 p-6 text-surface shadow-modal md:p-9">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-extrabold">Antrean hari ini</h3>
                  <span className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-brand-100">
                    <span className="relative grid h-2.5 w-2.5 place-items-center">
                      <span data-denyut className="absolute inset-0 rounded-full bg-leaf-500" />
                      <span className="relative h-2.5 w-2.5 rounded-full bg-leaf-500" />
                    </span>
                    Contoh tampilan
                  </span>
                </div>
                <p className="mt-8 text-sm font-semibold text-brand-100">Sedang dilayani</p>
                <div className="overflow-hidden">
                  <p data-balik={ANTREAN.dilayani} className="font-extrabold tabular-nums leading-none tracking-tight text-sun-400" style={{ fontSize: "clamp(4rem, 10vw, 6.5rem)" }}>
                    A-{String(ANTREAN.dilayani).padStart(3, "0")}
                  </p>
                </div>
                <p className="mt-6 text-sm font-semibold text-brand-100">Berikutnya</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {ANTREAN.berikutnya.map((n) => (
                    <li key={n} className="rounded-lg bg-white/10 px-3 py-1.5 font-bold tabular-nums">
                      A-{String(n).padStart(3, "0")}
                    </li>
                  ))}
                </ul>
                <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10">
                  <div className="flex flex-col-reverse bg-brand-950 p-4">
                    <dt className="text-sm text-brand-100">Selesai hari ini</dt>
                    <dd className="text-3xl font-extrabold tabular-nums">{ANTREAN.selesaiHariIni}</dd>
                  </div>
                  <div className="flex flex-col-reverse bg-brand-950 p-4">
                    <dt className="text-sm text-brand-100">Menunggu</dt>
                    <dd className="text-3xl font-extrabold tabular-nums">{ANTREAN.menunggu}</dd>
                  </div>
                </dl>
                <Link href="/antrean" className="mt-6 inline-flex items-center gap-1.5 rounded-lg font-bold text-sun-50 underline underline-offset-4 hover:text-surface focus:outline-none focus-visible:ring-4 focus-visible:ring-sun-50/40">
                  Buka layar antrean <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>

          {/* ================= Tanya jawab ================= */}
          <section id="tanya" aria-labelledby="judul-tanya" className="scroll-mt-16 bg-surface py-20 md:py-28">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
              <Kepala id="judul-tanya" label="Tanya jawab" judul="Masih ragu? Wajar." isi="Hal-hal yang sering ditanyakan sebelum orang memutuskan melapor." />
              <div data-muncul-grup="70" className="flex flex-col gap-3">
                {PERTANYAAN.map((p) => (
                  <details key={p.t} className="group rounded-2xl border border-line bg-surface transition-colors open:bg-canvas">
                    <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-3 text-lg font-bold text-brand-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 [&::-webkit-details-marker]:hidden">
                      {p.t}
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-800 transition-transform duration-300 group-open:rotate-180">
                        <ChevronDown size={20} aria-hidden="true" />
                      </span>
                    </summary>
                    <p className="max-w-prose px-5 pb-5 text-ink-soft">{p.j}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* ================= Penutup ================= */}
          <section aria-labelledby="judul-penutup" className="hero-rimba relative overflow-hidden text-surface">
            <div aria-hidden="true" className="pola-titik absolute inset-0" />
            <div className="relative mx-auto max-w-7xl px-4 pb-44 pt-20 md:pb-56 md:pt-28">
              <div className="grid items-center gap-12 lg:grid-cols-[1.3fr_0.7fr]">
                <div data-muncul>
                  <h2 id="judul-penutup" className="text-balance max-w-3xl font-extrabold leading-[1.02] tracking-[-0.03em]" style={{ fontSize: "clamp(2.5rem, 6vw, 4.75rem)" }}>
                    Langkah pertama bisa Anda mulai <span className="text-sun-400">hari ini.</span>
                  </h2>
                  <p className="mt-5 max-w-xl text-lg text-brand-100">Butuh beberapa menit saja. Petugas kami yang melanjutkan dari sana.</p>
                  <Link
                    href="/lapor"
                    className="group mt-9 inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-sun-400 px-8 text-lg font-extrabold text-brand-950 shadow-card transition-colors hover:bg-sun-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-sun-50"
                  >
                    <FilePenLine size={22} aria-hidden="true" />
                    Buat Laporan
                    <ArrowRight size={20} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
                <figure data-muncul="150" className="m-0 hidden w-full max-w-xs justify-self-end rounded-3xl bg-surface p-6 text-ink shadow-modal lg:block">
                  <div className="aspect-square w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                  <figcaption className="mt-4 text-center">
                    <span className="block font-extrabold text-brand-900">Lanjutkan di ponsel</span>
                    <span className="block text-sm text-ink-soft">Pindai dengan kamera untuk membuka formulir laporan.</span>
                  </figcaption>
                </figure>
              </div>

              {kontak.length > 0 && (
                <div className="mt-16">
                  <div className="mb-4 flex items-baseline justify-between gap-3">
                    <h3 className="text-xl font-extrabold">Kontak darurat aktif</h3>
                    <Link href="/kontak-darurat" className="rounded-lg text-sm font-bold text-brand-100 underline underline-offset-4 hover:text-surface focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100">
                      Lihat semua
                    </Link>
                  </div>
                  <ul data-muncul-grup className="grid gap-4 md:grid-cols-3">
                    {kontak.map((k) => (
                      <li key={k.id} className="rounded-2xl bg-surface p-4 text-ink shadow-modal">
                        <p className="font-bold text-brand-900">{k.instansi}</p>
                        <p className="mt-1 flex items-start gap-2 text-sm text-ink-soft">
                          <MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-mute" />
                          {k.alamat}
                        </p>
                        <a
                          href={`tel:${k.telepon.replace(/[^\d+]/g, "")}`}
                          className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-50 font-bold text-brand-800 transition-colors hover:bg-brand-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                        >
                          <Phone size={18} aria-hidden="true" />
                          Telepon {k.telepon}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <SiluetMalam className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full md:h-56" />
          </section>
        </main>
      </GerakBeranda>

      <footer className="bg-brand-950 text-brand-100">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <LogoSiap ukuran={48} className="rounded-full bg-surface p-0.5" />
              <span>
                <span className="block text-lg font-extrabold text-surface">SIAP PPA</span>
                <span className="block text-sm">Perlindungan Perempuan dan Anak</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm">Sistem informasi akses pelayanan perlindungan perempuan dan anak, Dinas DALDUK PPA Kabupaten Bandung.</p>
          </div>
          {[
            {
              judul: "Layanan",
              tautan: [
                ["/lapor", "Buat laporan"],
                ["/cek-tiket", "Cek tiket"],
                ["/kontak-darurat", "Kontak darurat"],
                ["/antrean", "Layar antrean"],
              ],
            },
            {
              judul: "Bantuan",
              tautan: [
                ["#cara", "Cara melapor"],
                ["#tanya", "Tanya jawab"],
                ["#lokasi", "Lokasi dan jam layanan"],
                ["/pamflet", "Pamflet QR"],
              ],
            },
            { judul: "Untuk petugas", tautan: [["/masuk", "Masuk ke aplikasi"]] },
          ].map((k) => (
            <nav key={k.judul} aria-label={k.judul}>
              <p className="font-extrabold text-surface">{k.judul}</p>
              <ul className="mt-3 flex flex-col gap-1">
                {k.tautan.map(([href, teks]) => (
                  <li key={href}>
                    <Link href={href} className="inline-block rounded-lg py-1.5 text-sm hover:text-surface hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100/40">
                      {teks}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-7xl px-4 py-5 text-sm">© 2026 Dinas DALDUK PPA Kabupaten Bandung. Layanan ini gratis.</p>
        </div>
      </footer>
    </div>
  );
}
