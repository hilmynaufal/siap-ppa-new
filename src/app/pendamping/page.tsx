import { ClipboardList } from "lucide-react";
import { IkonKotak } from "@/components/ikon-kotak";

export const metadata = { title: "Pendamping | SIAP PPA" };

export default function BerandaPendamping() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <section className="hero-lembut flex items-center gap-4 rounded-2xl p-6 md:p-8">
        <IkonKotak ikon={ClipboardList} warna="teal" ukuran="lg" />
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Kelola Pendampingan</h1>
          <p className="mt-1 text-ink-soft">Daftar sesi pendampingan Anda akan tampil di sini.</p>
        </div>
      </section>
    </main>
  );
}
