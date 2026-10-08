import { Breadcrumb } from "@/components/breadcrumb";
import { db } from "@/lib/db";
import { daftarDesa } from "@/lib/desa";
import { DaftarDesa } from "./daftar-desa";

export const metadata = { title: "Desa/Kelurahan | SIAP PPA" };
export const dynamic = "force-dynamic";

export default async function HalamanDesa() {
  const [desa, kecamatan] = await Promise.all([daftarDesa(db), db.kecamatan.findMany({ orderBy: { nama: "asc" }, select: { id: true, nama: true } })]);
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb remah={[{ label: "Beranda", href: "/admin" }, { label: "Data master" }, { label: "Desa/Kelurahan" }]} />
      <DaftarDesa data={desa} kecamatan={kecamatan} />
    </main>
  );
}
