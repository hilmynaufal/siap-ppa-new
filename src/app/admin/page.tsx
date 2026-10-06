import { HandHeart, Shapes } from "lucide-react";
import Link from "next/link";
import { IkonKotak } from "@/components/ikon-kotak";

export const metadata = { title: "Admin | SIAP PPA" };

export default function BerandaAdmin() {
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <section className="hero-lembut flex items-center gap-4 rounded-2xl p-6 md:p-8">
        <IkonKotak ikon={HandHeart} warna="magenta" ukuran="lg" />
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Selamat datang di SIAP PPA</h1>
          <p className="mt-1 text-ink-soft">Pilih menu di samping untuk mulai bekerja.</p>
        </div>
      </section>

      <h2 className="mb-3 mt-8 text-lg font-bold text-navy-900">Menu cepat</h2>
      <Link
        href="/admin/jenis-kekerasan"
        className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:max-w-sm"
      >
        <IkonKotak ikon={Shapes} warna="violet" ukuran="lg" />
        <span>
          <span className="block font-bold text-navy-900">Jenis Kekerasan</span>
          <span className="text-sm text-ink-mute">Kelola kategori pada formulir</span>
        </span>
      </Link>
    </main>
  );
}
