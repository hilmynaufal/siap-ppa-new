import { Breadcrumb } from "@/components/breadcrumb";
import { db } from "@/lib/db";
import { daftarKontakAdmin } from "@/lib/kontak-darurat";
import { DaftarKontak } from "./daftar-kontak";

export const metadata = { title: "Kontak Darurat | SIAP PPA" };

export default async function HalamanKontakDarurat() {
  const [kontak, kecamatan] = await Promise.all([
    daftarKontakAdmin(db),
    db.kecamatan.findMany({ orderBy: { nama: "asc" }, select: { id: true, nama: true } }),
  ]);
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb
        remah={[{ label: "Beranda", href: "/admin" }, { label: "Data master" }, { label: "Kontak Darurat" }]}
      />
      <DaftarKontak kontak={kontak} kecamatan={kecamatan} />
    </main>
  );
}
