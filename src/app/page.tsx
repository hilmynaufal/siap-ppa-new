import {
  CalendarCheck,
  ChevronDown,
  ClipboardCheck,
  FilePenLine,
  HeartHandshake,
  Lock,
  MapPin,
  Phone,
  QrCode,
  Scale,
  Smartphone,
  Ticket,
  UserRoundX,
} from "lucide-react";
import Link from "next/link";
import { Gelombang } from "@/components/gelombang";
import { IkonKotak, type WarnaIkon } from "@/components/ikon-kotak";
import { KepalaPelapor } from "@/components/kepala-pelapor";
import { SiluetHero } from "@/components/siluet-hero";
import { SiluetMalam } from "@/components/siluet-malam";
import { TiketContoh } from "@/components/tiket-contoh";
import { db } from "@/lib/db";
import { kontakDaruratAktif } from "@/lib/kontak-darurat";

export const dynamic = "force-dynamic";

type Langkah = { ikon: typeof QrCode; warna: WarnaIkon; judul: string; isi: string };

const LANGKAH: Langkah[] = [
  { ikon: QrCode, warna: "teal", judul: "Pindai QR atau buka tautan", isi: "Tidak perlu membuat akun atau memasang aplikasi. Cukup dari ponsel Anda." },
  { ikon: FilePenLine, warna: "magenta", judul: "Isi formulir singkat", isi: "Ceritakan kejadian dengan bahasa Anda sendiri, lewat langkah-langkah yang singkat." },
  { ikon: ClipboardCheck, warna: "violet", judul: "Petugas memeriksa laporan", isi: "Petugas DALDUK PPA memverifikasi laporan Anda." },
  { ikon: CalendarCheck, warna: "green", judul: "Terima tiket dan jadwal", isi: "Anda mendapat nomor antrean dan jadwal pendampingan. Simpan nomor tiketnya untuk dicek kapan saja." },
];

const JANJI = [
  { ikon: Lock, warna: "navy", judul: "Data dirahasiakan", isi: "Hanya petugas yang berwenang yang dapat membuka laporan Anda." },
  { ikon: UserRoundX, warna: "sky", judul: "Tanpa akun", isi: "Tiket Anda cukup nomor yang diberikan setelah laporan diverifikasi." },
  { ikon: Smartphone, warna: "coral", judul: "Ringan di ponsel apa pun", isi: "Dirancang agar tetap lancar di ponsel sederhana dan sinyal yang lemah." },
] satisfies { ikon: typeof Lock; warna: WarnaIkon; judul: string; isi: string }[];

const WARNA_LENCANA = [
  "bg-magenta-50 text-magenta-700",
  "bg-blue-50 text-navy-800",
  "bg-success-50 text-success",
  "bg-warning-50 text-warning",
  "bg-info-50 text-info",
];

const PERTANYAAN = [
  {
    t: "Siapa yang boleh melapor?",
    j: "Korban sendiri, keluarga, tetangga, guru, atau siapa pun yang mengetahui adanya kekerasan terhadap perempuan dan anak di Kabupaten Bandung.",
  },
  {
    t: "Apakah saya harus menyebutkan nama?",
    j: "Isi data yang Anda nyaman berikan. Petugas akan menjaga kerahasiaannya dan hanya memakainya untuk menindaklanjuti laporan.",
  },
  {
    t: "Apa yang terjadi setelah laporan terkirim?",
    j: "Petugas memverifikasi laporan Anda. Setelah itu Anda menerima tiket berisi nomor antrean dan jadwal pendampingan, yang bisa dicek lewat menu Cek Tiket.",
  },
  {
    t: "Bagaimana bila keadaan sangat mendesak?",
    j: "Jangan menunggu. Tekan tombol Darurat di bagian atas halaman untuk langsung menelepon kontak darurat yang aktif.",
  },
];

const tunda = (ms: number) => ({ "--tunda": `${ms}ms` }) as React.CSSProperties;

export default async function BerandaPelapor() {
  const [kontak, jenis] = await Promise.all([
    kontakDaruratAktif(db, 3),
    db.jenisKekerasan.findMany({ where: { aktif: true }, orderBy: { nama: "asc" }, select: { id: true, nama: true } }),
  ]);

  return (
    <div className="min-h-screen bg-surface">
      <KepalaPelapor telepon={kontak[0]?.telepon} lebar />
      <main>
        {/* Hero */}
        <section className="hero-senja relative overflow-hidden">
          <div className="relative z-10 mx-auto max-w-6xl px-4 pb-48 pt-10 md:pb-72 lg:pt-16">
            <div>
              <p className="muncul inline-flex items-center gap-2 rounded-lg bg-success-50 px-3 py-1.5 text-sm font-bold text-success">
                <Lock size={16} aria-hidden="true" />
                Data dirahasiakan
              </p>
              <h1
                style={{ ...tunda(80), fontSize: "clamp(2.75rem, 7.5vw, 5rem)" }}
                className="muncul mt-5 font-extrabold leading-[1.05] tracking-tight text-navy-900"
              >
                Anda tidak sendiri.
              </h1>
              <p style={tunda(160)} className="muncul mt-5 max-w-xl text-lg text-ink-soft md:text-xl">
                Laporkan kekerasan terhadap perempuan dan anak di Kabupaten Bandung. Petugas akan menindaklanjuti laporan Anda dan menjaga kerahasiaannya.
              </p>
              <div style={tunda(240)} className="muncul mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/lapor"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-magenta-600 px-8 text-lg font-bold text-white shadow-card transition-colors hover:bg-magenta-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-magenta-100"
                >
                  <FilePenLine size={22} aria-hidden="true" />
                  Buat Laporan
                </Link>
                <Link
                  href="/cek-tiket"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-8 text-lg font-bold text-navy-800 transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                >
                  <Ticket size={22} aria-hidden="true" />
                  Cek Tiket
                </Link>
              </div>
            </div>
          </div>
          <SiluetHero className="muncul pointer-events-none absolute inset-x-0 bottom-0 h-44 w-full md:h-64" />
        </section>

        {/* Janji */}
        <section aria-labelledby="judul-janji" className="mx-auto max-w-6xl px-4 pb-14 pt-14 md:pb-20 md:pt-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
            <div>
              <p className="text-sm font-bold text-magenta-700">Janji kami</p>
              <h2 id="judul-janji" className="text-balance mt-2 text-3xl font-extrabold leading-tight text-navy-900 md:text-4xl">
                Melapor tidak perlu membuat Anda semakin cemas.
              </h2>
            </div>
            <ul className="flex flex-col divide-y divide-line-soft">
              {JANJI.map((j) => (
                <li key={j.judul} className="flex items-start gap-4 py-5 first:pt-0 last:pb-0">
                  <IkonKotak ikon={j.ikon} warna={j.warna} ukuran="lg" />
                  <span>
                    <span className="block text-xl font-bold text-navy-900">{j.judul}</span>
                    <span className="mt-1 block max-w-prose text-ink-soft">{j.isi}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Alur dan tiket */}
        <section aria-labelledby="judul-alur" className="bg-canvas">
          <Gelombang warna="var(--color-surface)" balik className="-mb-px" />
          <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-16 lg:pb-24">
            <div>
              <p className="text-sm font-bold text-magenta-700">Cara melapor</p>
              <h2 id="judul-alur" className="text-balance mt-2 text-3xl font-extrabold leading-tight text-navy-900 md:text-4xl">
                Empat langkah, tanpa tergesa.
              </h2>
              <ol className="mt-8">
                {LANGKAH.map((l, i) => (
                  <li key={l.judul} className="relative flex gap-5 pb-8 last:pb-0">
                    {i < LANGKAH.length - 1 && <span aria-hidden="true" className="absolute left-[27px] top-14 h-[calc(100%-3.5rem)] w-0.5 bg-line-strong" />}
                    <IkonKotak ikon={l.ikon} warna={l.warna} ukuran="lg" />
                    <div className="pt-1">
                      <p className="text-sm font-bold text-ink-mute">Langkah {i + 1}</p>
                      <h3 className="text-xl font-bold text-navy-900">{l.judul}</h3>
                      <p className="mt-1 max-w-prose text-ink-soft">{l.isi}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="lg:sticky lg:top-24">
              <TiketContoh />
            </div>
          </div>
          <Gelombang warna="var(--color-surface)" className="-mb-px" />
        </section>

        {/* Pendampingan */}
        <section aria-labelledby="judul-dapat" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="text-sm font-bold text-magenta-700">Yang Anda dapatkan</p>
          <h2 id="judul-dapat" className="text-balance mt-2 max-w-2xl text-3xl font-extrabold leading-tight text-navy-900 md:text-4xl">
            Ditemani sampai Anda merasa lebih kuat.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <article className="rounded-3xl bg-magenta-50 p-7 md:p-9">
              <IkonKotak ikon={HeartHandshake} warna="magenta" ukuran="lg" />
              <h3 className="mt-5 text-2xl font-extrabold text-navy-900">Pendampingan psikologis</h3>
              <p className="mt-2 max-w-md text-ink-soft">Ditemani psikolog dan konselor selama proses pemulihan, dengan jadwal yang Anda terima lewat tiket.</p>
            </article>
            <article className="rounded-3xl bg-blue-50 p-7 md:p-9">
              <IkonKotak ikon={Scale} warna="violet" ukuran="lg" />
              <h3 className="mt-5 text-2xl font-extrabold text-navy-900">Pendampingan hukum</h3>
              <p className="mt-2 max-w-md text-ink-soft">Konsultasi dengan konsultan hukum mitra bila Anda membutuhkannya, tanpa harus mengurus semuanya sendiri.</p>
            </article>
          </div>

          {jenis.length > 0 && (
            <div className="mt-14 rounded-3xl border border-line bg-surface p-7 shadow-card md:p-9">
              <h3 className="text-xl font-extrabold text-navy-900">Yang dapat Anda laporkan</h3>
              <p className="mt-1 max-w-prose text-ink-soft">Tidak yakin kejadian Anda termasuk yang mana? Ceritakan saja apa yang terjadi.</p>
              <ul className="mt-5 flex flex-wrap gap-2.5">
                {jenis.map((j, i) => (
                  <li key={j.id} className={`rounded-xl px-4 py-2 text-sm font-bold ${WARNA_LENCANA[i % WARNA_LENCANA.length]}`}>
                    {j.nama}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Pertanyaan */}
        <section aria-labelledby="judul-tanya" className="bg-canvas">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:py-24 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
            <div>
              <p className="text-sm font-bold text-magenta-700">Pertanyaan umum</p>
              <h2 id="judul-tanya" className="text-balance mt-2 text-3xl font-extrabold leading-tight text-navy-900 md:text-4xl">
                Masih ragu? Wajar.
              </h2>
              <p className="mt-3 max-w-sm text-ink-soft">Beberapa hal yang sering ditanyakan sebelum orang memutuskan melapor.</p>
            </div>
            <div className="flex flex-col gap-3">
              {PERTANYAAN.map((p) => (
                <details key={p.t} className="group rounded-2xl border border-line bg-surface shadow-card">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-3 font-bold text-navy-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 [&::-webkit-details-marker]:hidden">
                    {p.t}
                    <ChevronDown size={20} aria-hidden="true" className="shrink-0 text-ink-mute transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-4 text-ink-soft">{p.j}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Penutup */}
        <section aria-labelledby="judul-penutup" className="relative overflow-hidden bg-navy-900 text-white">
          <div className="mx-auto max-w-6xl px-4 pb-44 pt-16 md:pb-52 md:pt-24">
            <h2 id="judul-penutup" className="text-balance max-w-3xl font-extrabold leading-tight tracking-tight" style={{ fontSize: "clamp(2.25rem, 5.5vw, 3.75rem)" }}>
              Langkah pertama bisa Anda mulai hari ini.
            </h2>
            <p className="mt-4 max-w-xl text-lg text-blue-100">Butuh beberapa menit saja. Petugas kami yang melanjutkan dari sana.</p>
            <Link
              href="/lapor"
              className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-magenta-600 px-8 text-lg font-bold text-white shadow-card transition-colors hover:bg-magenta-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-magenta-100"
            >
              <FilePenLine size={22} aria-hidden="true" />
              Buat Laporan
            </Link>

            {kontak.length > 0 && (
              <div className="mt-14">
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <h3 className="text-xl font-extrabold">Kontak darurat aktif</h3>
                  <Link href="/kontak-darurat" className="rounded-lg text-sm font-bold text-blue-100 underline underline-offset-4 hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
                    Lihat semua
                  </Link>
                </div>
                <ul className="grid gap-4 md:grid-cols-3">
                  {kontak.map((k) => (
                    <li key={k.id} className="rounded-2xl bg-surface p-4 text-ink shadow-modal">
                      <p className="font-bold text-navy-900">{k.instansi}</p>
                      <p className="mt-1 flex items-start gap-2 text-sm text-ink-soft">
                        <MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-mute" />
                        {k.alamat}
                      </p>
                      <a
                        href={`tel:${k.telepon.replace(/[^\d+]/g, "")}`}
                        className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-50 font-bold text-navy-800 transition-colors hover:bg-blue-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
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
          <SiluetMalam className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full md:h-48" />
        </section>
      </main>

      <footer className="bg-navy-950 text-blue-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm md:flex-row md:items-center md:justify-between">
          <p className="font-bold text-white">SIAP PPA, DALDUK PPA Kabupaten Bandung</p>
          <p>Layanan pelaporan kekerasan terhadap perempuan dan anak.</p>
        </div>
      </footer>
    </div>
  );
}
