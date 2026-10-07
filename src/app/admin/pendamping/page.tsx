import { Breadcrumb } from "@/components/breadcrumb";
import { db } from "@/lib/db";
import { daftarJenisPendampingan, daftarPendamping } from "@/lib/master-layanan";
import { DaftarPendamping } from "./daftar-pendamping";

export const metadata = { title: "Akun Pendamping | SIAP PPA" };
export const dynamic = "force-dynamic";

export default async function HalamanPendamping() {
  const [pendamping, jenis] = await Promise.all([daftarPendamping(db), daftarJenisPendampingan(db)]);
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb remah={[{ label: "Beranda", href: "/admin" }, { label: "Data master" }, { label: "Akun Pendamping" }]} />
      <DaftarPendamping data={pendamping} jenis={jenis.filter((j) => j.aktif).map((j) => ({ id: j.id, nama: j.nama }))} />
    </main>
  );
}
