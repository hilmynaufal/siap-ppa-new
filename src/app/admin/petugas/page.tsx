import { Breadcrumb } from "@/components/breadcrumb";
import { db } from "@/lib/db";
import { daftarLokasi, daftarPetugas } from "@/lib/master-layanan";
import { DaftarPetugas } from "./daftar-petugas";

export const metadata = { title: "Akun Petugas | SIAP PPA" };
export const dynamic = "force-dynamic";

export default async function HalamanPetugas() {
  const [petugas, lokasi] = await Promise.all([daftarPetugas(db), daftarLokasi(db)]);
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb remah={[{ label: "Beranda", href: "/admin" }, { label: "Data master" }, { label: "Akun Petugas" }]} />
      <DaftarPetugas data={petugas} lokasi={lokasi.filter((l) => l.aktif).map((l) => ({ id: l.id, nama: l.nama }))} />
    </main>
  );
}
