import { Breadcrumb } from "@/components/breadcrumb";
import { db } from "@/lib/db";
import { daftarLokasi } from "@/lib/master-layanan";
import { DaftarLokasi } from "./daftar-lokasi";

export const metadata = { title: "Lokasi Layanan | SIAP PPA" };
export const dynamic = "force-dynamic";

export default async function HalamanLokasi() {
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb remah={[{ label: "Beranda", href: "/admin" }, { label: "Data master" }, { label: "Lokasi Layanan" }]} />
      <DaftarLokasi data={await daftarLokasi(db)} />
    </main>
  );
}
