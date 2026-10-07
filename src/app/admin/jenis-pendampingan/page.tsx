import { Breadcrumb } from "@/components/breadcrumb";
import { db } from "@/lib/db";
import { daftarJenisPendampingan } from "@/lib/master-layanan";
import { DaftarJenisPendampingan } from "./daftar-jenis-pendampingan";

export const metadata = { title: "Jenis Pendampingan | SIAP PPA" };
export const dynamic = "force-dynamic";

export default async function HalamanJenisPendampingan() {
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb remah={[{ label: "Beranda", href: "/admin" }, { label: "Data master" }, { label: "Jenis Pendampingan" }]} />
      <DaftarJenisPendampingan data={await daftarJenisPendampingan(db)} />
    </main>
  );
}
