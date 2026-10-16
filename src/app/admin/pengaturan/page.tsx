import { Settings } from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { IkonKotak } from "@/components/ikon-kotak";
import { db } from "@/lib/db";
import { bacaPengaturanBap } from "@/lib/pengaturan";
import { FormPengaturan } from "./form-pengaturan";

export const metadata = { title: "Pengaturan | SIAP PPA" };
export const dynamic = "force-dynamic";

export default async function Halaman() {
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb remah={[{ label: "Beranda", href: "/admin" }, { label: "Pengaturan" }]} />
      <div className="mb-6 flex items-center gap-4">
        <IkonKotak ikon={Settings} warna="navy" ukuran="lg" />
        <div>
          <h1 className="text-2xl font-extrabold text-brand-900">Pengaturan</h1>
          <p className="mt-0.5 text-sm text-ink-soft">Pengaturan aplikasi. Setiap perubahan tercatat di log audit.</p>
        </div>
      </div>
      <section aria-labelledby="h-penandatangan" className="rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6">
        <h2 id="h-penandatangan" className="text-lg font-bold text-brand-900">
          Penandatangan BAP
        </h2>
        <p className="mb-5 mt-1 text-sm text-ink-soft">Nama dan NIP Kepala UPTD PPA yang tercetak pada Berita Acara Pelaporan.</p>
        <FormPengaturan awal={await bacaPengaturanBap(db)} />
      </section>
    </main>
  );
}
